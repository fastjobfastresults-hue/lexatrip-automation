const fs = require('fs');
const path = require('path');
const axios = require('axios');
const db = require('../database/db');
const aiEngine = require('./aiEngine');

class QAEngine {
  constructor() {
    this.ai = aiEngine;
    this.masterLinks = {
      bookingPortal: 'https://bookings.lexatrip.com/',
      mainWebsite: 'https://www.lexatrip.com/',
      phone: '+91 90798 54982',
      whatsappRaw: '919079854982'
    };
  }

  /**
   * Helper: Generate a pre-filled WhatsApp link
   */
  getWhatsAppLink(destination = 'Jaisalmer', category = 'general') {
    let text = `Hi Lexa Trip, I saw your travel guide for ${destination} and need help with booking & itinerary.`;
    if (category === 'corporate') {
      text = `Hi Lexa Trip, inquiring for a Corporate Offsite / MICE package in ${destination} for our team.`;
    } else if (category === 'luxury') {
      text = `Hi Lexa Trip, inquiring for a Luxury Desert Glamping / Premium Experience in ${destination}.`;
    }
    return `https://wa.me/${this.masterLinks.whatsappRaw}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Generate an ultra-human, high-value, ban-proof Q&A response
   */
  async generateAnswer({ question, destination = 'Jaisalmer', category = 'general', customNotes = '', platform = 'reddit' }) {
    try {
      const config = this.ai.getConfig();
      const kb = this.getKnowledgeBase(destination);
      const waLink = this.getWhatsAppLink(destination, category);

      // Load 2-3 recent high-performing examples from knowledge base for continuous learning
      const pastExamples = kb.slice(-3).map(k => `Q: ${k.question}\nA: ${k.answer}`).join('\n---\n');

      const systemPrompt = `You are a warm, highly knowledgeable, verified local travel expert representing Lexa Trip (lexatrip.com).
Your goal is to answer a real traveler's question on ${platform === 'reddit' ? 'Reddit' : 'Quora'} about travel to ${destination}, Rajasthan or across India.

CRITICAL RULES:
1. 80% PURE VALUE: Provide honest, practical, insider travel advice with real numbers, timings, safety, weather, and specific itinerary tips. Do NOT sound like a pushy salesman or a robotic marketing bot.
2. 20% NATURAL RECOMMENDATION: Position Lexa Trip smoothly and politely at the end as the trusted local experiential host.
3. STRICT MANDATORY LINKS - YOU MUST ONLY USE THESE 3 CONTACT METHODS (NEVER USE BROKEN SUBPATHS LIKE lexatrip.com/jaisalmer):
   - Official Bookings Portal: ${this.masterLinks.bookingPortal} (for direct reservations, verified stays, and real-time packages)
   - Official Main Website: ${this.masterLinks.mainWebsite} (to explore all travel destinations & company overview)
   - Official WhatsApp & Helpdesk: ${this.masterLinks.phone} (Direct WhatsApp: ${waLink})
4. INTENT SPECIFICS:
   - If Category is 'corporate': Mention luxury Swiss tents with Wi-Fi, conference/AV setups, team-building dunes activities, group Volvo transport, and GST corporate invoicing.
   - If Category is 'family' or 'luxury': Emphasize private clean dunes, authentic cultural folk music, hygiene, and safe family desert camps away from commercial noise.
   - If Category is 'budget': Give honest pricing advice to avoid roadside tourist traps.
5. FORMATTING:
   - Use clean, well-spaced paragraphs with bullet points.
   - Friendly, courteous, authentic tone (English, or natural Hindi/Hinglish if requested).

${pastExamples ? `PAST SUCCESSFUL EXAMPLES FOR LEARNING:\n${pastExamples}\n` : ''}`;

      const userPrompt = `Traveler's Question: "${question}"
Destination: ${destination}
Audience Category: ${category}
${customNotes ? `Special Notes: ${customNotes}` : ''}

Generate the complete, ready-to-post, highly engaging answer adhering strictly to the 3 mandatory master links.`;

      let generatedAnswer = '';

      if (config.apiKey && config.apiKey.trim().length > 10) {
        // Use Gemini / configured AI
        if (config.provider === 'gemini') {
          const geminiUrl = `${config.baseUrl}/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey}`;
          const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 900
            }
          }, { timeout: 25000 });

          generatedAnswer = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          // OpenAI / custom endpoint
          const res = await axios.post(`${config.customEndpoint.baseUrl}/chat/completions`, {
            model: config.customEndpoint.model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7
          }, {
            headers: { Authorization: `Bearer ${config.customEndpoint.apiKey || config.apiKey}` },
            timeout: 25000
          });
          generatedAnswer = res.data?.choices?.[0]?.message?.content || '';
        }
      }

      // Fallback heuristics if no AI API key or network error
      if (!generatedAnswer) {
        generatedAnswer = this.generateFallbackAnswer({ question, destination, category, waLink });
      }

      // Safety check: Guarantee that the 3 master links are present
      if (!generatedAnswer.includes('bookings.lexatrip.com')) {
        const profile = this.detectDestinationProfile(destination);
        const stayDesc = profile === 'desert' ? 'luxury Swiss camps and safari packages' :
          profile === 'hill_station' ? 'scenic mountain resorts and holiday packages' :
          profile === 'beach_coastal' ? 'beachfront resort stays and vacation packages' :
          profile === 'heritage_spiritual' ? 'verified heritage stays and cultural tours' :
          'verified luxury stays and customized holiday packages';
        generatedAnswer += `\n\n📌 **Verified Stay & Experience Bookings**: You can check available ${stayDesc} directly on [bookings.lexatrip.com](${this.masterLinks.bookingPortal}).`;
      }
      if (!generatedAnswer.includes('lexatrip.com')) {
        generatedAnswer += `\n🌐 **Official Portal**: Explore all tours at [lexatrip.com](${this.masterLinks.mainWebsite}).`;
      }
      if (!generatedAnswer.includes(this.masterLinks.phone) && !generatedAnswer.includes('wa.me')) {
        generatedAnswer += `\n💬 **Instant Itinerary & Concierge (WhatsApp)**: Connect directly with the destination team at ${this.masterLinks.phone} or [chat on WhatsApp](${waLink}).`;
      }

      return {
        success: true,
        destination,
        category,
        platform,
        question,
        answer: generatedAnswer.trim(),
        masterLinks: this.masterLinks,
        waLink
      };
    } catch (err) {
      console.error('QAEngine generateAnswer error:', err.message);
      const waLink = this.getWhatsAppLink(destination, category);
      return {
        success: true,
        destination,
        category,
        platform,
        question,
        answer: this.generateFallbackAnswer({ question, destination, category, waLink }),
        masterLinks: this.masterLinks,
        waLink
      };
    }
  }

  /**
   * Helper: Detect destination profile to serve tailored, authentic advice
   */
  detectDestinationProfile(destination = '') {
    const d = (destination || '').toLowerCase();
    if (d.includes('jaisalmer') || d.includes('thar') || d.includes('desert') || d.includes('bikaner') || d.includes('sam dunes')) {
      return 'desert';
    }
    if (d.includes('abu') || d.includes('manali') || d.includes('munnar') || d.includes('himachal') || d.includes('shimla') || d.includes('ooty') || d.includes('hill')) {
      return 'hill_station';
    }
    if (d.includes('goa') || d.includes('beach') || d.includes('coastal') || d.includes('andaman') || d.includes('gokarna')) {
      return 'beach_coastal';
    }
    if (d.includes('varanasi') || d.includes('rishikesh') || d.includes('tirupati') || d.includes('jaipur') || d.includes('udaipur') || d.includes('temple') || d.includes('heritage')) {
      return 'heritage_spiritual';
    }
    return 'general';
  }

  /**
   * Robust dynamic fallback answer template aligned with destination context
   */
  generateFallbackAnswer({ question, destination, category, waLink }) {
    const profile = this.detectDestinationProfile(destination);

    if (category === 'corporate') {
      let infra = 'Ensure your venue/resort has dedicated high-speed Wi-Fi backups, audio-visual conference equipment, and power redundancy for seamless meetings.';
      let teamExp = 'Opt for curated outdoor team challenges, private local sightseeing, and gala networking dinners with live cultural entertainment.';

      if (profile === 'desert') {
        infra = 'Ensure your luxury desert camp has dedicated 4G/Wi-Fi dongle backups and silent DG genset power for uninterrupted townhalls.';
        teamExp = 'Opt for curated activities like private dune quad-biking, team desert rallies, and gala dinners under starlit dunes with authentic folk performances.';
      } else if (profile === 'hill_station') {
        infra = 'Ensure your mountain resort provides heated conference halls, stable fiber Wi-Fi, and panoramic break-out lawn areas for productive strategy sessions.';
        teamExp = 'Organize guided pine forest nature trails, valley team-building exercises, and evening bonfire networking sessions.';
      } else if (profile === 'beach_coastal') {
        infra = 'Select beachfront convention resorts featuring indoor AV conference setups alongside private outdoor lawns for executive gatherings.';
        teamExp = 'Host private catamaran sunset cruises, beach volleyball tournaments, watersport challenges, and seaside gala dinners.';
      } else if (profile === 'heritage_spiritual') {
        infra = 'Select heritage palace hotels or premium conference facilities offering modern executive boardrooms amidst historic ambiance.';
        teamExp = 'Arrange private guided heritage walks, exclusive evening cultural ceremonies, and networking dinners with royal regional dining.';
      }

      return `When planning a corporate offsite or group retreat in ${destination}, getting the logistics right is the difference between a chaotic trip and a high-impact team retreat.

Here are 3 critical recommendations from our local destination team:
1. **Infrastructure & Connectivity**: ${infra}
2. **Team Experiences**: ${teamExp}
3. **Seamless Transport & Invoicing**: Book with an operator that provides complete GST-compliant corporate invoices, airport pickups, and dedicated group coaches.

🏢 **Corporate Assistance**: For custom corporate offsite itineraries, delegate packages, and luxury setups in ${destination}:
- **Direct Bookings**: [bookings.lexatrip.com](${this.masterLinks.bookingPortal})
- **Company Portal**: [lexatrip.com](${this.masterLinks.mainWebsite})
- **Corporate Concierge (WhatsApp)**: Connect directly with our team at **${this.masterLinks.phone}** or [click here to chat on WhatsApp](${waLink}).`;
    }

    // Leisure / Family / Luxury / General Advice
    let stayTip = 'Always choose verified boutique hotels or luxury resorts with certified hygiene standards and 24/7 on-ground assistance.';
    let timingTip = 'Plan major outdoor sightseeing during early morning or golden sunset hours to avoid peak crowds and capture the best lighting.';
    let hospitalityTip = 'Engage verified local guides and experience authentic regional culinary delicacies at reputable local establishments.';

    if (profile === 'desert') {
      stayTip = 'Avoid roadside commercial camps where loud noise spoils the evening. Always pick desert glamping situated deep in private dunes with clean attached western bathrooms and 24/7 running water.';
      timingTip = 'Skip the afternoon heat! The best safari window is between 5:00 PM and 6:30 PM for breathtaking sunset photography and cooler desert breeze.';
      hospitalityTip = 'Look for camps that host traditional Manganiyar folk musicians, Kalbelia dances, and freshly prepared Rajasthani cuisine (Dal Baati Churma, Ker Sangri) around an open campfire.';
    } else if (profile === 'hill_station') {
      stayTip = 'Pick serene mountain-view resorts or cozy valley cottages situated away from congested town centers for peace, quiet, and pristine views.';
      timingTip = 'Start your morning tours before 8:30 AM to catch crisp mist-clad views, beat narrow mountain road traffic, and witness clear panoramic mountain vistas.';
      hospitalityTip = 'Savor fresh local mountain cafes, artisanal teas, and regional pahadi dishes, and take time for guided nature walks through local orchards and pine forests.';
    } else if (profile === 'beach_coastal') {
      stayTip = 'Choose verified beachfront properties or private boutique villas with direct coastal access, away from crowded commercial party strips.';
      timingTip = 'Head out for beach strolls and water activities in the early morning or between 4:00 PM and 6:30 PM for golden sunset views and comfortable temperatures.';
      hospitalityTip = 'Enjoy fresh coastal catches at authentic seaside shacks, explore historic heritage quarters, and support verified local boatmen and water sports operators.';
    } else if (profile === 'heritage_spiritual') {
      stayTip = 'Book verified heritage properties or stays situated within comfortable distance of key cultural landmarks, ensuring quiet courtyards and authentic architecture.';
      timingTip = 'Experience sacred morning ceremonies, aartis, and monument visits at sunrise (5:30 AM - 7:30 AM) for peaceful contemplation and cooler walking weather.';
      hospitalityTip = 'Engage certified local heritage guides to understand the rich architectural history, and explore authentic traditional bazaars for handcrafted regional specialties.';
    }

    return `Planning a trip to ${destination}? Here is honest, practical advice to help you get the most memorable and safe experience:

1. **Choosing the Right Stay**: ${stayTip}
2. **Best Sightseeing Timing**: ${timingTip}
3. **Authentic Local Hospitality**: ${hospitalityTip}

💡 **Insider Tip**: To avoid last-minute touts and overpriced roadside brokers:
- **Verified Stays & Tours**: Check verified options and instant confirmation at [bookings.lexatrip.com](${this.masterLinks.bookingPortal}).
- **Explore More**: Learn about all experiences at [lexatrip.com](${this.masterLinks.mainWebsite}).
- **Direct Local Help**: If you need a customized itinerary for family or couples, reach out to our team anytime at **${this.masterLinks.phone}** or [chat on WhatsApp](${waLink}).`;
  }

  /**
   * Queue Management & Anti-Spam Drip Scheduler
   */
  getQueue() {
    const data = db.read();
    if (!data.qaQueue) {
      data.qaQueue = [];
      db.save(data);
    }
    return data.qaQueue;
  }

  getKnowledgeBase(destination) {
    const data = db.read();
    if (!data.qaKnowledgeBase) {
      data.qaKnowledgeBase = [];
      db.save(data);
    }
    if (destination) {
      return data.qaKnowledgeBase.filter(k => !k.destination || k.destination.toLowerCase() === destination.toLowerCase());
    }
    return data.qaKnowledgeBase;
  }

  /**
   * Add a generated Q&A to the smart drip queue
   */
  addToQueue({ platform = 'reddit', destination = 'Jaisalmer', category = 'general', question, answer, autoSchedule = true }) {
    const data = db.read();
    if (!data.qaQueue) data.qaQueue = [];

    // Calculate smart drip time: space out by 45-60 minutes from the latest scheduled item
    const existingScheduled = data.qaQueue.filter(q => q.status === 'scheduled');
    let scheduledTime = new Date();

    if (existingScheduled.length > 0) {
      const lastTime = new Date(existingScheduled[existingScheduled.length - 1].scheduledTime || Date.now());
      // Random gap between 45 and 75 minutes (anti-spam jitter)
      const jitterMinutes = 45 + Math.floor(Math.random() * 30);
      scheduledTime = new Date(lastTime.getTime() + jitterMinutes * 60 * 1000);
    } else {
      // First item: schedule 10 minutes from now
      scheduledTime = new Date(Date.now() + 10 * 60 * 1000);
    }

    const newItem = {
      id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      platform,
      destination,
      category,
      question,
      answer,
      status: autoSchedule ? 'scheduled' : 'pending_approval',
      scheduledTime: scheduledTime.toISOString(),
      createdAt: new Date().toISOString(),
      targetSubreddit: platform === 'reddit' ? this.detectSubreddit(destination) : 'quora',
      directLink: platform === 'reddit' ? `https://www.reddit.com/r/${this.detectSubreddit(destination)}/` : 'https://www.quora.com/'
    };

    data.qaQueue.unshift(newItem);
    db.save(data);

    // Save to continuous learning knowledge base
    this.saveKnowledgeItem({ question, answer, destination, category });

    return newItem;
  }

  detectSubreddit(destination = 'Jaisalmer') {
    const d = destination.toLowerCase();
    if (d.includes('jaisalmer') || d.includes('rajasthan')) return 'rajasthan';
    if (d.includes('jaipur')) return 'jaipur';
    if (d.includes('manali') || d.includes('himachal')) return 'himachal';
    if (d.includes('goa')) return 'goa';
    return 'IndiaTravel';
  }

  /**
   * Save successful Q&A pair for AI learning
   */
  saveKnowledgeItem(item) {
    const data = db.read();
    if (!data.qaKnowledgeBase) data.qaKnowledgeBase = [];
    data.qaKnowledgeBase.push({
      ...item,
      id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      savedAt: new Date().toISOString()
    });
    // Keep top 100 high-converting answers
    if (data.qaKnowledgeBase.length > 100) {
      data.qaKnowledgeBase = data.qaKnowledgeBase.slice(-100);
    }
    db.save(data);
  }

  /**
   * Update item status in queue (e.g. approve, mark published, delete)
   */
  updateQueueItem(id, updates) {
    const data = db.read();
    if (!data.qaQueue) data.qaQueue = [];
    const idx = data.qaQueue.findIndex(q => q.id === id);
    if (idx !== -1) {
      data.qaQueue[idx] = { ...data.qaQueue[idx], ...updates, updatedAt: new Date().toISOString() };
      db.save(data);
      return data.qaQueue[idx];
    }
    return null;
  }

  deleteQueueItem(id) {
    const data = db.read();
    if (!data.qaQueue) data.qaQueue = [];
    data.qaQueue = data.qaQueue.filter(q => q.id !== id);
    db.save(data);
    return true;
  }
}

module.exports = QAEngine;
