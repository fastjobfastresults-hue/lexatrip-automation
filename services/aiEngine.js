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
   * AI-powered parsing with structured JSON output
   */
  async parseWithAI({ rawText, destinationName, config }) {
    const prompt = `You are a professional travel marketing and SEO specialist for "${destinationName}".
Analyze the following raw content and extract/organize exactly 5 distinct social media posts.

For EACH of the 5 posts, separate:
1. "title": A catchy, viral headline (max 70 characters, suitable for YouTube Shorts, Reels, Blog).
2. "caption": Engaging, high-converting travel storytelling description (2-4 lines).
3. "hashtags": High-volume SEO travel hashtags (starting with #${destinationName.replace(/\\s+/g, '')} and destination tags).

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

    // Clean JSON string if wrapped in codeblocks
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (!parsed.posts || !Array.isArray(parsed.posts)) {
      throw new Error('AI returned invalid format.');
    }

    return parsed.posts.slice(0, 5);
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

    for (let i = 0; i < 5; i++) {
      const chunk = chunksToProcess[i] || '';
      if (chunk) {
        posts.push(this.extractSinglePostSEO(chunk, i + 1, destinationName));
      } else {
        // Fallback default for remaining posts up to 5
        posts.push({
          index: i + 1,
          title: `${destinationName} Experience #${i + 1}`,
          caption: `Discover the breathtaking sights and royal hospitality of ${destinationName}. Book your memorable journey with us!`,
          hashtags: `#${destinationName.replace(/\\s+/g, '')} #TravelIndia #Wanderlust #Explore`
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
      hashtags = `#${destinationName.replace(/\\s+/g, '')} #TravelGoals #IncredibleIndia #ExploreWithUs`;
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
