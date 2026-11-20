const axios = require('axios');
const db = require('../database/db');

class AIEngine {
  constructor() {
    // Default AI settings
    this.defaultConfig = {
      provider: 'gemini', // 'gemini' | 'openai' | 'claude' | 'custom'
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-1.5-flash',
      customEndpoint: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o-mini'
      }
    };
  }

  getConfig() {
    const settings = db.getSettings();
    return settings.aiConfig || this.defaultConfig;
  }

  saveConfig(newConfig) {
    const current = this.getConfig();
    const updated = { ...current, ...newConfig };
    db.updateSettings({ aiConfig: updated });
    return updated;
  }

  /**
   * Smartly parse raw text into 5 distinct Post SEO sets (Title, Caption, Hashtags).
   * Works via AI when API key is provided, or via intelligent regex heuristics when offline.
   */
  async parseRawSeoPack({ rawText, destinationName = 'Lexa Trip' }) {
    if (!rawText || !rawText.trim()) {
      throw new Error('Raw SEO content is empty. Please paste your text.');
    }

    const config = this.getConfig();
    const hasApiKey = !!(config.apiKey || (config.provider === 'custom' && config.customEndpoint?.apiKey));

    if (hasApiKey) {
      try {
        console.log(`[AIEngine] Parsing SEO Pack using AI Provider: ${config.provider}...`);
        return await this.parseWithAI({ rawText, destinationName, config });
      } catch (err) {
        console.warn(`[AIEngine] AI parsing failed (${err.message}). Falling back to Smart Pattern Parser.`);
        return this.parseWithLocalHeuristics(rawText, destinationName);
      }
    } else {
      console.log('[AIEngine] No AI API Key set. Using Smart Local Pattern Parser.');
      return this.parseWithLocalHeuristics(rawText, destinationName);
    }
  }

  /**
   * Resilient JSON parser: strips markdown codeblocks, preambles/postambles,
   * trailing commas, and handles malformed LLM responses safely.
   */
  safeParseAIJson(rawStr) {
    if (!rawStr || typeof rawStr !== 'string') {
      throw new Error('Empty AI response.');
    }

    let text = rawStr.trim();

    // 1. Unwrap markdown code blocks (```json ... ``` or ``` ... ```)
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      text = fenceMatch[1].trim();
    }

    // 2. Extract substring enclosed by first { and last } or first [ and last ]
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    let candidate = text;
    if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      candidate = text.substring(firstBrace, lastBrace + 1);
    } else if (firstBracket !== -1 && lastBracket !== -1) {
      candidate = text.substring(firstBracket, lastBracket + 1);
    }

    // 3. Trailing comma & comment cleanup helpers
    const stripComments = (str) => str.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n\r]*/g, '');
    const stripTrailingCommas = (str) => str.replace(/,\s*([\]}])/g, '$1');

    try {
      return JSON.parse(candidate);
    } catch (err1) {
      try {
        return JSON.parse(stripTrailingCommas(candidate));
      } catch (err2) {
        try {
          // Strip multiline and single-line comments, then trailing commas, and re-attempt
          const sanitized = stripTrailingCommas(stripComments(candidate));
          return JSON.parse(sanitized);
        } catch (err3) {
          // If candidate extraction was affected by comments outside JSON, strip comments on full text
          const textWithoutComments = stripComments(text);
          const firstBraceClean = textWithoutComments.indexOf('{');
          const lastBraceClean = textWithoutComments.lastIndexOf('}');
          if (firstBraceClean !== -1 && lastBraceClean !== -1) {
            const cleanCandidate = stripTrailingCommas(textWithoutComments.substring(firstBraceClean, lastBraceClean + 1));
            return JSON.parse(cleanCandidate);
          }
          throw err3;
        }
      }
    }
  }

  /**
   * Generates clean social hashtag from destination string
   */
  formatHashtagTag(name = '') {
    // If name contains English in parentheses e.g. "लेक्सा ट्रिप जैसलमेर (Lexa Trip Jaisalmer)"
    const match = name.match(/\(([^)]+)\)/);
    const target = match ? match[1] : name;
    return target.replace(/[^\p{L}\p{M}\p{N}]/gu, '');
  }

  /**
   * AI-powered parsing with structured JSON output
   */
  async parseWithAI({ rawText, destinationName, config }) {
    const prompt = `You are a professional travel marketing and SEO specialist for "${destinationName}".
Analyze the following raw content and extract/organize exactly 5 distinct social media posts.

For EACH of the 5 posts, separate:
1. "title": A catchy, viral headline (max 70 characters, suitable for YouTube Shorts, Reels, Blog).
2. "caption": Engaging, high-converting travel storytelling description (2-4 lines).
3. "hashtags": High-volume SEO travel hashtags (starting with #${this.formatHashtagTag(destinationName)} and destination tags).

If the raw input contains fewer than 5 posts, creatively expand and generate the remaining posts based on the themes in the input for "${destinationName}".

Output ONLY valid JSON in this exact structure without markdown backticks or commentary:
{
  "posts": [
    {
      "index": 1,
      "title": "...",
      "caption": "...",
      "hashtags": "..."
    },
    ... (exactly 5 items, index 1 to 5)
  ]
}

Raw Input:
"""
${rawText}
"""`;

    let responseText = '';

    if (config.provider === 'gemini') {
      const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
      const model = config.model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }, { timeout: 25000 });
      responseText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } else if (config.provider === 'openai') {
      const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
      const model = config.model || 'gpt-4o-mini';
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 25000
      });
      responseText = res.data.choices?.[0]?.message?.content || '';

    } else if (config.provider === 'claude') {
      const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
      const model = config.model || 'claude-3-5-sonnet-20241022';
      const res = await axios.post('https://api.anthropic.com/v1/messages', {
        model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 25000
      });
      responseText = res.data.content?.[0]?.text || '';

    } else if (config.provider === 'custom') {
      const custom = config.customEndpoint || {};
      const baseUrl = (custom.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
      const apiKey = custom.apiKey;
      const model = custom.model || 'gpt-4o-mini';

      const res = await axios.post(`${baseUrl}/chat/completions`, {
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        timeout: 25000
      });
      responseText = res.data.choices?.[0]?.message?.content || '';
    }

    // Resilient JSON extraction and sanitization
    const parsed = this.safeParseAIJson(responseText);

    // Normalize output: support { posts: [...] }, direct array [...], or nested object
    let posts = [];
    if (parsed && Array.isArray(parsed.posts)) {
      posts = parsed.posts;
    } else if (Array.isArray(parsed)) {
      posts = parsed;
    } else if (parsed && typeof parsed === 'object') {
      const arrKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
      if (arrKey) posts = parsed[arrKey];
    }

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      throw new Error('AI returned invalid format: no posts array found.');
    }

    return posts.slice(0, 5).map((p, idx) => ({
      index: p.index || (idx + 1),
      title: (p.title || `${destinationName} Highlight #${idx + 1}`).trim(),
      caption: (p.caption || '').trim(),
      hashtags: (p.hashtags || `#${this.formatHashtagTag(destinationName)} #TravelIndia #Explore`).trim()
    }));
  }

  /**
   * Smart Local Pattern Parser (Zero API Key required)
   * Separates Title, Caption, and Hashtags using robust pattern matching
   */
  parseWithLocalHeuristics(rawText, destinationName) {
    const text = rawText.trim();
    const posts = [];

    // Check if separated by explicit Post markers: "Post 1", "Post 2", "1.", "2.", etc.
    const splitRegex = /(?:^|\n)(?:(?:post\s*#?\s*(\d+)|\b(\d+)[\.\)]\s*))/i;
    const rawChunks = text.split(/(?:^|\n)(?=(?:post\s*#?\s*\d+|\b\d+[\.\)]\s*))/i).filter(c => c && c.trim().length > 10);

    let chunksToProcess = rawChunks;

    // If no numbered posts, try splitting by double linebreaks or equal dividers
    if (chunksToProcess.length < 2) {
      chunksToProcess = text.split(/\n\s*---\s*\n|\n\s*===\s*\n|\n\s*\n\s*\n/).filter(c => c && c.trim().length > 10);
    }

    const cleanTag = this.formatHashtagTag(destinationName);
    const fallbackThemes = [
      { title: `Iconic Highlights & Scenic Wonders of ${destinationName}`, caption: `Discover breathtaking sights, hidden gems, and unforgettable experiences in ${destinationName}. Handcrafted holiday journeys tailored just for you!` },
      { title: `Luxury Stays & Premium Hospitality in ${destinationName}`, caption: `Relax in comfort with verified boutique stays, scenic vistas, and warm on-ground hospitality in ${destinationName}. Reserve your dream getaway today.` },
      { title: `Authentic Culture, Cuisine & Heritage in ${destinationName}`, caption: `Immerse yourself in rich local flavors, vibrant traditions, and timeless stories of ${destinationName}. Travel like an insider with Lexa Trip.` },
      { title: `Thrilling Adventures & Nature Trails in ${destinationName}`, caption: `Feel the rush with curated outdoor excursions, breathtaking viewpoints, and unforgettable adventures across ${destinationName}.` },
      { title: `Golden Sunset Moments & Memories in ${destinationName}`, caption: `Catch magical twilight hues and create memories that last a lifetime in ${destinationName}. Book your bespoke itinerary with our local destination team!` }
    ];

    for (let i = 0; i < 5; i++) {
      const chunk = chunksToProcess[i] || '';
      if (chunk) {
        posts.push(this.extractSinglePostSEO(chunk, i + 1, destinationName));
      } else {
        const theme = fallbackThemes[i] || fallbackThemes[0];
        posts.push({
          index: i + 1,
          title: theme.title,
          caption: theme.caption,
          hashtags: `#${cleanTag} #TravelIndia #Wanderlust #Explore`
        });
      }
    }

    return posts;
  }

  /**
   * Extract Title, Caption, Hashtags from a single text block
   */
  extractSinglePostSEO(block, index, destinationName) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    let title = '';
    let captionLines = [];
    let hashtags = '';

    for (let line of lines) {
      // Skip pure Post header markers like "Post 1:", "Post #1", "1."
      if (/^(?:post\s*#?\s*\d+[:\-]?|\d+[\.\)][:\-]?)$/i.test(line)) {
        continue;
      }

      // Check for Title marker
      if (/^title\s*[:\-]/i.test(line)) {
        title = line.replace(/^title\s*[:\-]\s*/i, '').trim();
      }
      // Check for Hashtags marker or pure hashtags line
      else if (/^(?:hashtag|tags|hashtags)\s*[:\-]/i.test(line)) {
        hashtags = line.replace(/^(?:hashtag|tags|hashtags)\s*[:\-]\s*/i, '').trim();
      } else if (line.startsWith('#') && line.includes('#')) {
        hashtags += (hashtags ? ' ' : '') + line;
      }
      // Check for Caption marker
      else if (/^(?:caption|description|desc)\s*[:\-]/i.test(line)) {
        captionLines.push(line.replace(/^(?:caption|description|desc)\s*[:\-]\s*/i, '').trim());
      } else {
        captionLines.push(line);
      }
    }

    // If no explicit title was marked, use the first line
    if (!title && captionLines.length > 0) {
      // Remove any leading numbers like "1. ", "Post 1: "
      title = captionLines[0].replace(/^(?:post\s*#?\s*\d+[:\-]?|\d+[\.\)][:\-]?)\s*/i, '').trim();
      captionLines.shift(); // Remove first line from caption
    }

    // If no hashtags found in lines, extract all #tags from the caption
    if (!hashtags) {
      const fullCaption = captionLines.join(' ');
      const matchedTags = fullCaption.match(/#[A-Za-z0-9_]+/g);
      if (matchedTags) {
        hashtags = matchedTags.join(' ');
        // Remove tags from caption
        captionLines = captionLines.map(l => l.replace(/#[A-Za-z0-9_]+/g, '').trim()).filter(Boolean);
      }
    }

    // Default hashtags if still empty
    if (!hashtags) {
      const cleanTag = this.formatHashtagTag(destinationName);
      hashtags = `#${cleanTag} #TravelGoals #IncredibleIndia #ExploreWithUs`;
    }

    // Truncate title if overly long
    if (title.length > 85) {
      title = title.substring(0, 82) + '...';
    }

    return {
      index,
      title: title || `${destinationName} Highlight #${index}`,
      caption: captionLines.join('\n').trim() || `Experience the true beauty and wonder of ${destinationName} with Lexa Trip.`,
      hashtags: hashtags.trim()
    };
  }
}

module.exports = new AIEngine();
