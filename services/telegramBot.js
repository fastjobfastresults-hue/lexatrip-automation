const path = require('path');
const fs = require('fs');
const axios = require('axios');
const db = require('../database/db');
const imageProcessor = require('./imageProcessor');
const videoEngine = require('./videoEngine');
const seoGenerator = require('./seoGenerator');
const scheduler = require('./scheduler');
const telegramNotifier = require('./telegramNotifier');
const channelTester = require('./channelTester');

class NativeTelegramBot {
  constructor(token) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
    this.fileBaseUrl = `https://api.telegram.org/file/bot${token}`;
    this.offset = 0;
    this.isPolling = false;
    this.handlers = {
      photo: [],
      text: [],
      message: [],
      channel_post: [],
      callback_query: [],
      polling_error: []
    };
    this.textHandlers = [];
  }

  on(event, callback) {
    if (this.handlers[event]) {
      this.handlers[event].push(callback);
    }
  }

  onText(regex, callback) {
    this.textHandlers.push({ regex, callback });
  }

  async getFileLink(fileId) {
    const res = await axios.get(`${this.baseUrl}/getFile`, {
      params: { file_id: fileId },
      timeout: 15000
    });
    if (res.data?.ok && res.data.result?.file_path) {
      return `${this.fileBaseUrl}/${res.data.result.file_path}`;
    }
    throw new Error('Telegram getFile failed: ' + JSON.stringify(res.data));
  }

  async sendMessage(chatId, text, options = {}) {
    const payload = {
      chat_id: chatId,
      text: text,
      ...options
    };
    try {
      const res = await axios.post(`${this.baseUrl}/sendMessage`, payload, { timeout: 15000 });
      return res.data;
    } catch (err) {
      if (options.parse_mode) {
        try {
          delete payload.parse_mode;
          const retryRes = await axios.post(`${this.baseUrl}/sendMessage`, payload, { timeout: 15000 });
          return retryRes.data;
        } catch (e) {
          console.error('[NativeTelegramBot] sendMessage retry error:', e.response?.data || e.message);
        }
      } else {
        console.error('[NativeTelegramBot] sendMessage error:', err.response?.data || err.message);
      }
    }
  }

  async answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
    try {
      await axios.post(`${this.baseUrl}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert
      }, { timeout: 10000 });
    } catch (e) {
      // quiet
    }
  }

  async editMessageText(chatId, messageId, text, options = {}) {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options
    };
    try {
      const res = await axios.post(`${this.baseUrl}/editMessageText`, payload, { timeout: 15000 });
      return res.data;
    } catch (err) {
      if (options.parse_mode) {
        delete payload.parse_mode;
        try {
          const res2 = await axios.post(`${this.baseUrl}/editMessageText`, payload, { timeout: 15000 });
          return res2.data;
        } catch (e) {}
      }
    }
  }

  startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.pollLoop();
  }

  stopPolling() {
    this.isPolling = false;
  }

  async processUpdate(update) {
    if (!update) return;

    // 1. Handle Callback Queries (Inline Button Clicks)
    if (update.callback_query) {
      for (const cb of this.handlers.callback_query) {
        try { await cb(update.callback_query); } catch (e) { console.error('callback_query error:', e); }
      }
      return;
    }

    // 2. Handle Messages & Channel Posts
    const msg = update.channel_post || update.message;
    if (!msg) return;

    // Only skip messages older than 2 hours to avoid ancient backlogs from days ago
    const msgAgeSeconds = Math.floor(Date.now() / 1000) - (msg.date || 0);
    if (msg.date && msgAgeSeconds > 7200) {
      console.log(`[TelegramBot] 🛑 Dropping stale message (${msgAgeSeconds}s old): ${msg.message_id}`);
      return;
    }

    if (update.channel_post) {
      for (const cb of this.handlers.channel_post) {
        try { await cb(msg); } catch (e) { console.error('Channel post handler error:', e); }
      }
    } else if (update.message) {
      for (const cb of this.handlers.message) {
        try { await cb(msg); } catch (e) { console.error('Message handler error:', e); }
      }

      if (msg.photo && msg.photo.length > 0) {
        for (const cb of this.handlers.photo) {
          try { await cb(msg); } catch (e) { console.error('Photo handler error:', e); }
        }
      }

      const text = (msg.text || '').trim();
      if (text) {
        for (const cb of this.handlers.text) {
          try { await cb(msg); } catch (e) { console.error('Text handler error:', e); }
        }
        for (const { regex, callback } of this.textHandlers) {
          const match = text.match(regex);
          if (match) {
            try { await callback(msg, match); } catch (e) { console.error('onText handler error:', e); }
          }
        }
      }
    }
  }

  async pollLoop() {
    console.log('🤖 Telegram Bot polling active. Listening for channel posts and messages...');
    while (this.isPolling) {
      try {
        const res = await axios.get(`${this.baseUrl}/getUpdates`, {
          params: {
            offset: this.offset,
            timeout: 20,
            allowed_updates: JSON.stringify(['message', 'channel_post', 'callback_query'])
          },
          timeout: 25000
        });

        if (res.data?.ok && Array.isArray(res.data.result)) {
          for (const update of res.data.result) {
            this.offset = update.update_id + 1;
            await this.processUpdate(update);
          }
        }
      } catch (err) {
        for (const cb of this.handlers.polling_error) {
          try { cb(err); } catch (e) {}
        }
        if (err.response?.status === 409) {
          console.warn('[TelegramBot Polling] 409 Conflict: Webhook is active or concurrent instance polling.');
          await new Promise(r => setTimeout(r, 10000));
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
  }
}

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.sessions = new Map();
    this.inbox = new Map();
    this.processedMessages = new Map();
    this.dailyReportInterval = null;
  }

  start() {
    const settings = db.getSettings();
    const token = settings.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.log('🤖 Telegram Bot token not configured yet. (Configure via Settings / Telegram Modal)');
      return;
    }

    try {
      this.bot = new NativeTelegramBot(token);
      this.setupHandlers();
      this.bot.startPolling();
      this.setupDailyReportSchedule();
      console.log('🤖 Telegram Bot active: 5-Post + Combined SEO Pipeline Listening!');
    } catch (err) {
      console.error('Error starting Telegram Bot:', err.message);
    }
  }

  stop() {
    if (this.dailyReportInterval) {
      clearInterval(this.dailyReportInterval);
      this.dailyReportInterval = null;
    }
    if (this.bot) {
      try {
        this.bot.stopPolling();
      } catch (e) {}
      this.bot = null;
    }
  }

  getInbox(destinationId = 'dest_jaisalmer') {
    if (!this.inbox.has(destinationId)) {
      this.inbox.set(destinationId, []);
    }
    return this.inbox.get(destinationId);
  }

  clearInbox(destinationId = 'dest_jaisalmer') {
    this.inbox.set(destinationId, []);
  }

  async handleWebhookUpdate(update) {
    if (this.bot) {
      await this.bot.processUpdate(update);
    }
  }

  resolveDestination(msg, textHint = '') {
    const destinations = db.getDestinations();
    const chatId = msg?.chat?.id ? String(msg.chat.id) : '';
    const chatTitle = (msg?.chat?.title || '').toLowerCase();
    const chatUsername = (msg?.chat?.username || '').toLowerCase();
    const messageContent = (textHint || msg?.text || msg?.caption || '').toLowerCase();

    // 1. Direct Explicit Channel ID match (Strict Priority #1 - 100% Channel Isolation)
    for (const d of destinations) {
      if (d.telegram?.channelId && String(d.telegram.channelId) === chatId) return d;
    }

    // 2. Direct Match by Channel Username (Strict Priority #2)
    if (chatUsername) {
      const cleanUser = chatUsername.replace(/^@/, '');
      for (const d of destinations) {
        const dUser = (d.telegram?.channelUsername || '').toLowerCase().replace(/^@/, '');
        if (dUser && dUser === cleanUser) return d;
      }
    }

    // 3. Match from Chat Title or Chat Username (Strict Priority #3)
    if (chatTitle) {
      for (const d of destinations) {
        const slug = (d.slug || '').toLowerCase();
        const name = (d.name || '').toLowerCase();
        const city = name.replace(/lexa\s*trip/i, '').trim();
        if (city && city.length > 2 && chatTitle.includes(city)) return d;
        if (slug && slug.length > 2 && chatTitle.includes(slug)) return d;
      }
    }

    // 4. Fallback ONLY for 1-on-1 Direct Private Chats with Bot: Match by Text/SEO
    const isDirectPrivateChat = !msg?.chat?.type || msg?.chat?.type === 'private';
    if (isDirectPrivateChat && messageContent) {
      for (const d of destinations) {
        const slug = (d.slug || '').toLowerCase();
        const cityEnglish = (d.name.match(/\((.*?)\)/)?.[1] || '').toLowerCase().replace(/lexa\s*trip/i, '').trim();
        const cityHindi = d.name.split('(')[0].replace(/लेक्सा\s*ट्रिप/i, '').trim();

        if (
          (cityEnglish && cityEnglish.length > 2 && messageContent.includes(cityEnglish)) ||
          (cityHindi && cityHindi.length > 2 && messageContent.includes(cityHindi)) ||
          (slug && slug.length > 2 && messageContent.includes(slug))
        ) {
          return d;
        }
      }
    }

    // 5. Session Active Destination
    const session = this.sessions.get(chatId);
    if (session?.destinationId) {
      const found = db.getDestination(session.destinationId);
      if (found) return found;
    }

    // 6. Fallback to default Jaisalmer
    return destinations.find(d => d.id === 'dest_jaisalmer') || destinations[0] || { id: 'dest_jaisalmer', name: 'Lexa Trip Jaisalmer', slug: 'jaisalmer' };
  }

  getSession(key, destination = null) {
    if (!this.sessions.has(key)) {
      this.sessions.set(key, {
        destinationId: destination?.id || 'dest_jaisalmer',
        photos: [],
        combinedSeo: null,
        batchDate: new Date().toISOString().split('T')[0]
      });
    }
    const sess = this.sessions.get(key);
    if (destination && sess.destinationId !== destination.id) {
      sess.destinationId = destination.id;
    }
    return sess;
  }

  resetSession(key) {
    this.sessions.delete(key);
  }

  parseCaptionToSeo(caption = '', defaultTitle = 'Lexa Trip') {
    if (!caption) return { title: defaultTitle, caption: '', hashtags: [] };

    const lines = caption.split('\n').map(l => l.trim()).filter(Boolean);
    let title = defaultTitle;
    let mainCaption = caption;
    let hashtags = [];

    const hashRegex = /#[\w\u0900-\u097F_]+/g;
    const foundHashes = caption.match(hashRegex) || [];
    hashtags = foundHashes;

    if (lines.length > 0) {
      const firstLine = lines[0].replace(/^(शीर्षक|टाइटल|title)\s*[:：\-]\s*/i, '').trim();
      if (firstLine.length > 3 && firstLine.length < 160) {
        title = firstLine;
      }
    }

    return {
      title,
      caption: lines.join('\n'),
      hashtags
    };
  }

  async sendDualMessage(chatId, text, options = {}) {
    await this.bot.sendMessage(chatId, text, options);
    const settings = db.getSettings();
    const adminChatId = settings.telegram?.allowedChatId;
    if (adminChatId && String(adminChatId) !== String(chatId)) {
      await this.bot.sendMessage(adminChatId, text, options);
    }
  }

  // --- 🔘 DYNAMIC BUTTON BUILDERS ---

  buildDestinationKeyboard() {
    const destinations = db.getDestinations();
    const rows = [];
    for (let i = 0; i < destinations.length; i += 2) {
      const row = [];
      const d1 = destinations[i];
      const name1 = d1.name.split('(')[0].trim();
      row.push({ text: `📍 ${name1}`, callback_data: `switch_${d1.id}` });
      if (destinations[i + 1]) {
        const d2 = destinations[i + 1];
        const name2 = d2.name.split('(')[0].trim();
        row.push({ text: `📍 ${name2}`, callback_data: `switch_${d2.id}` });
      }
      rows.push(row);
    }
    return rows;
  }

  buildDashboardKeyboard(currentDestId = 'dest_jaisalmer') {
    const destRows = this.buildDestinationKeyboard();
    return {
      inline_keyboard: [
        ...destRows,
        [
          { text: '📊 लाइव स्टेटस & ट्रैकिंग', callback_data: 'action_status' },
          { text: '📅 आज का शेड्यूल', callback_data: 'action_schedule' }
        ],
        [
          { text: '✅ पब्लिश्ड आर्काइव', callback_data: 'action_archive' },
          { text: '📋 24h डेली रिपोर्ट', callback_data: 'action_daily_report' }
        ],
        [
          { text: '🛡️ चैनल हेल्थ & सेफ्टी', callback_data: 'action_health' },
          { text: '🔄 सिंक & रीफ्रेश', callback_data: 'action_refresh' }
        ]
      ]
    };
  }

  getReplyKeyboard() {
    return {
      keyboard: [
        [{ text: '📊 लाइव स्टेटस' }, { text: '📅 आज का शेड्यूल' }],
        [{ text: '📋 डेली रिपोर्ट' }, { text: '🛡️ चैनल हेल्थ' }],
        [{ text: '🐪 डेस्टिनेशन बदलें' }, { text: '🔄 रीफ्रेश' }]
      ],
      resize_keyboard: true,
      persistent: true
    };
  }

  /**
   * Intelligently resolve targets for an instant single-photo social post.
   * Only includes channels that are authentic, verified, and not in pending/trial review.
   */
  resolveSinglePostTargets(dest) {
    const targets = [];
    const channels = dest?.channels || {};

    // 1. Facebook Page (Active if pageAccessToken & pageId present)
    if (channels.facebook?.enabled !== false && channels.facebook?.credentials?.pageAccessToken) {
      targets.push('facebook');
    }

    // 2. Instagram Business (Active if accessToken & instagramAccountId present)
    if (channels.instagram?.enabled !== false && channels.instagram?.credentials?.accessToken) {
      targets.push('instagram');
    }

    // 3. LinkedIn (Active if accessToken present)
    if (channels.linkedin?.enabled !== false && channels.linkedin?.credentials?.accessToken) {
      targets.push('linkedin');
    }

    // 4. Pinterest: ONLY include if standard write access is active (NOT trial_access_pending)
    if (channels.pinterest?.enabled !== false && 
        channels.pinterest?.credentials?.accessToken && 
        channels.pinterest?.credentials?.status !== 'trial_access_pending' &&
        !String(channels.pinterest.credentials.accessToken).startsWith('smart_')) {
      targets.push('pinterest');
    }

    // 5. Threads (Active if accessToken present)
    if (channels.threads?.enabled !== false && channels.threads?.credentials?.accessToken) {
      targets.push('threads');
    }

    // 6. Google Business Profile: Active if OAuth user accessToken present (NOT just API key)
    if (channels.google_business?.enabled !== false && 
        channels.google_business?.credentials?.accessToken &&
        !String(channels.google_business.credentials.accessToken).startsWith('AIzaSy')) {
      targets.push('google_business');
    }

    return targets.length > 0 ? targets : ['facebook', 'instagram'];
  }

  /**
   * 🛡️ Genuine Channel Health Audit via external API verification
   */
  async generateHealthReport(dest) {
    if (!dest) return '❌ डेस्टिनेशन उपलब्ध नहीं है।';

    const channelsToCheck = [
      'facebook', 'instagram', 'linkedin', 'pinterest',
      'youtube', 'blogger', 'threads', 'reddit', 'quora'
    ];

    const results = await Promise.allSettled(channelsToCheck.map(async (platform) => {
      const ch = dest.channels?.[platform];
      if (!ch || ch.enabled === false) {
        return { platform, status: 'disabled' };
      }
      if (!ch.credentials || Object.keys(ch.credentials).length === 0) {
        return { platform, status: 'unconfigured' };
      }
      try {
        const testRes = await channelTester.testChannel(platform, ch.credentials);
        return { platform, status: 'ok', info: testRes.accountName || testRes.handle || 'Verified' };
      } catch (err) {
        return { platform, status: 'error', error: err.message };
      }
    }));

    let connectedCount = 0;
    let failedCount = 0;
    let report = `🛡️ *[चैनल हेल्थ व API ऑडिट रिपोर्ट]*\n\n` +
      `📍 *डेस्टिनेशन:* ${dest.name}\n` +
      `🕒 *ऑडिट समय:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n\n`;

    results.forEach((r, idx) => {
      const p = channelsToCheck[idx];
      const icon = telegramNotifier.getPlatformIcon(p);
      const name = telegramNotifier.formatPlatformName(p);
      const data = r.value;

      if (!data || data.status === 'disabled') {
        report += `• ${icon} *${name}:* ⚪ निष्क्रिय (Disabled)\n`;
      } else if (data.status === 'unconfigured') {
        report += `• ${icon} *${name}:* 🟡 अनकॉन्फ़िगर्ड (No credentials)\n`;
      } else if (data.status === 'ok') {
        connectedCount++;
        report += `• ${icon} *${name}:* 🟢 सक्रिय (${data.info})\n`;
      } else {
        failedCount++;
        const shortErr = (data.error || 'Connection Failed').slice(0, 55);
        report += `• ${icon} *${name}:* 🔴 विफल (\`${shortErr}\`)\n`;
      }
    });

    report += `\n📊 *समरी:* ${connectedCount} सक्रिय | ${failedCount} विफल\n`;
    if (failedCount > 0) {
      report += `⚠️ कुछ चैनल्स के टोकन एक्सपायर या गलत हैं। डैशबोर्ड के 🔐 API वॉल्ट से अपडेट करें।\n`;
    } else {
      report += `✅ सभी कॉन्फ़िगर्ड चैनल्स का लाइव API टेस्ट सफल रहा।\n`;
    }
    report += `\n🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;
    return report;
  }

  // --- 📋 DAILY EXECUTIVE REPORT GENERATOR ---
  async sendDailyExecutiveReport(targetChatId = null) {
    const destinations = db.getDestinations();
    const queue = db.getQueue();
    const settings = db.getSettings();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayQueue = queue.filter(q => (q.scheduledTime || '').startsWith(todayStr) || (q.createdAt || '').startsWith(todayStr));
    const published = todayQueue.filter(q => q.status === 'published' || q.status === 'completed' || q.status === 'success');
    const queued = todayQueue.filter(q => q.status === 'queued');

    let reportMsg = `📋 *[लेक्सा ट्रिप — 24h दैनिक एग्जीक्यूटिव रिपोर्ट]* 🐪✨\n\n` +
      `📅 *दिनांक:* ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}\n` +
      `⏰ *समय:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `📊 *दैनिक पब्लिशिंग समरी:*\n` +
      `• कुल टास्क आज: *${todayQueue.length}*\n` +
      `• सफलतापूर्वक पब्लिश: *${published.length}* ✅\n` +
      `• कतार में शेड्यूल्ड: *${queued.length}* ⏳\n\n` +
      `🌐 *डेस्टिनेशन ब्रेकडाउन:*\n`;

    destinations.forEach((d, i) => {
      const dQueue = todayQueue.filter(q => q.destinationId === d.id);
      const dPub = dQueue.filter(q => q.status === 'published' || q.status === 'completed');
      reportMsg += `${i + 1}. *${d.name.split('(')[0].trim()}:* ${dPub.length}/${dQueue.length} पोस्ट्स पब्लिश्ड\n`;
    });

    reportMsg += `\n🛡️ *चैनल स्टेटस:* लाइव API टोकन ऑडिट हेतु /health भेजें\n` +
      `🌐 *लाइव वेब डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

    const adminChatId = targetChatId || settings.telegram?.allowedChatId;
    if (adminChatId) {
      await this.bot.sendMessage(adminChatId, reportMsg, {
        parse_mode: 'Markdown',
        reply_markup: this.buildDashboardKeyboard()
      });
    }

    destinations.forEach(async (d) => {
      if (d.telegram?.channelId && String(d.telegram.channelId) !== String(adminChatId)) {
        await this.bot.sendMessage(d.telegram.channelId, reportMsg, { parse_mode: 'Markdown' });
      }
    });
  }

  setupDailyReportSchedule() {
    let lastSentDate = '';
    this.dailyReportInterval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const todayDate = now.toISOString().split('T')[0];

      // Send twice daily: Morning Plan (08:30 AM) and Night Summary (10:00 PM)
      if ((hour === 8 && minute >= 30 && minute <= 40) || (hour === 22 && minute >= 0 && minute <= 10)) {
        const key = `${todayDate}_${hour}`;
        if (lastSentDate !== key) {
          lastSentDate = key;
          console.log('[TelegramBot] Sending Automated Daily Executive Report...');
          this.sendDailyExecutiveReport().catch(e => console.error('Daily report error:', e));
        }
      }
    }, 60000); // Check every minute
  }

  setupHandlers() {
    // 1. Welcome / Help Command
    this.bot.onText(/\/start|\/help|\/menu/, (msg) => {
      const chatId = msg.chat.id;
      const dest = this.resolveDestination(msg, text);
      const session = this.getSession(chatId, dest);

      const welcome = `🐪 *Lexa Trip Multi-Destination Command Center* ✨\n\n` +
        `📍 *सक्रिय डेस्टिनेशन:* *${dest.name}*\n` +
        `🤖 *24/7 ऑटो-पायलट:* सक्रिय (Anti-Spam Human Jitter)\n\n` +
        `*डेली 1-क्लिक वर्कफ़्लो:*\n` +
        `1️⃣ फोटो 1 से 5 भेजें (कैप्शन सहित)\n` +
        `2️⃣ कंबाइंड SEO टेक्स्ट भेजें\n` +
        `⚡ सिस्टम 5 पोस्ट्स, कर्सल और रील्स ऑटो-शेड्यूल कर देगा!\n\n` +
        `👇 *नीचे दिए गए बटनों से 1-क्लिक में लाइव स्टेटस व रिपोर्ट्स देखें:*`;

      this.bot.sendMessage(chatId, welcome, {
        parse_mode: 'Markdown',
        reply_markup: this.buildDashboardKeyboard(session.destinationId)
      });

      // Also set persistent mobile keyboard
      this.bot.sendMessage(chatId, `⌨️ *क्विक एक्सेस कंट्रोल बटन्स नीचे कीबोर्ड पर सक्रिय हैं:*`, {
        parse_mode: 'Markdown',
        reply_markup: this.getReplyKeyboard()
      });
    });

    // 2. View Live Status
    const renderStatus = async (chatId, destId = null) => {
      const destinations = db.getDestinations();
      const targetDest = destId ? db.getDestination(destId) : destinations[0];
      const queue = db.getQueue();
      const destQueue = queue.filter(q => q.destinationId === (targetDest?.id || 'dest_jaisalmer'));
      const pending = destQueue.filter(q => q.status === 'queued');
      const completed = destQueue.filter(q => q.status === 'published' || q.status === 'completed');
      const failed = destQueue.filter(q => q.status === 'failed' || q.status === 'partial_or_failed');

      let reply = `📊 *[लाइव स्टेटस & ट्रैकिंग]* 🐪\n\n` +
        `📍 *सक्रिय डेस्टिनेशन:* *${targetDest?.name || 'Lexa Trip'}*\n` +
        `✅ *पब्लिश्ड आज:* ${completed.length} पोस्ट्स\n` +
        `⏳ *कतार में शेड्यूल्ड:* ${pending.length} पोस्ट्स\n` +
        (failed.length > 0 ? `⚠️ *विफल / आंशिक:* ${failed.length} पोस्ट्स (डैशबोर्ड देखें)\n` : '') +
        `🛡️ *चैनल हेल्थ:* लाइव ऑडिट के लिए /health भेजें\n`;

      if (pending.length > 0) {
        reply += `\n*⏰ आगामी शेड्यूल्ड पोस्ट्स:*\n`;
        pending.slice(0, 5).forEach((item, i) => {
          const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          reply += `${i + 1}. [${item.itemType.toUpperCase()}] ${item.title.slice(0, 32)}...\n   ⏰ *${time}*\n`;
        });
      } else {
        reply += `\n✨ *अभी कोई पेंडिंग पोस्ट नहीं है। नया बैच भेजने के लिए 5 फ़ोटोज़ + कंबाइंड SEO भेजें।*`;
      }

      reply += `${telegramNotifier.getVerifiedLinks(targetDest)}\n\n` +
        `🌐 *लाइव वेब डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

      await this.bot.sendMessage(chatId, reply, {
        parse_mode: 'Markdown',
        reply_markup: this.buildDashboardKeyboard(targetDest?.id)
      });
    };

    this.bot.onText(/\/status|\/report|\/live/, (msg) => renderStatus(msg.chat.id));

    this.bot.onText(/\/health/, async (msg) => {
      const dest = this.resolveDestination(msg);
      await this.bot.sendMessage(msg.chat.id, `⏳ *[चैनल हेल्थ ऑडिट]* लाइव API टोकन्स की जांच हो रही है...`, { parse_mode: 'Markdown' });
      const healthMsg = await this.generateHealthReport(dest);
      await this.bot.sendMessage(msg.chat.id, healthMsg, { parse_mode: 'Markdown', reply_markup: this.buildDashboardKeyboard(dest.id) });
    });

    // 3. Reset command
    this.bot.onText(/\/reset/, (msg) => {
      this.resetSession(msg.chat.id);
      this.sendDualMessage(msg.chat.id, '🔄 आपका फ़ोटो व SEO बफ़र रीसेट कर दिया गया है। नई 5 फोटोज़ भेजना शुरू करें।');
    });

    // 4. Switch Destination
    this.bot.onText(/\/switch\s+(.+)/, (msg, match) => {
      const destId = match[1].trim();
      const dest = db.getDestination(destId);
      if (!dest) {
        return this.sendDualMessage(msg.chat.id, `❌ डेस्टिनेशन '${destId}' नहीं मिला। नीचे दिए गए बटनों से चुनें:`, {
          reply_markup: this.buildDashboardKeyboard()
        });
      }
      const session = this.getSession(msg.chat.id);
      session.destinationId = dest.id;
      this.sendDualMessage(msg.chat.id, `✅ सक्रिय डेस्टिनेशन अब बदल दिया गया है: *${dest.name}*`, {
        parse_mode: 'Markdown',
        reply_markup: this.buildDashboardKeyboard(dest.id)
      });
    });

    // 5. Destination List
    this.bot.onText(/\/destinations/, (msg) => {
      const destinations = db.getDestinations();
      let reply = `📍 *उपलब्ध डेस्टिनेशन्स (1-क्लिक में स्विच करें):*\n\n`;
      destinations.forEach((d, i) => {
        reply += `${i + 1}. *${d.name}* (ID: \`${d.id}\`)\n   टैगलाइन: ${d.tagline}\n\n`;
      });
      this.bot.sendMessage(msg.chat.id, reply, {
        parse_mode: 'Markdown',
        reply_markup: this.buildDashboardKeyboard()
      });
    });

    // 6. Handle Quick Mobile Reply Keyboard Texts
    this.bot.on('text', async (msg) => {
      const text = (msg.text || '').trim();
      const chatId = msg.chat.id;

      if (text === '📊 लाइव स्टेटस') {
        await renderStatus(chatId);
      } else if (text === '📅 आज का शेड्यूल') {
        const queue = db.getQueue();
        const pending = queue.filter(q => q.status === 'queued');
        let scheduleMsg = `📅 *[आज का लाइव शेड्यूल]* 🐪\n\n`;
        if (pending.length === 0) {
          scheduleMsg += `आज की सभी पोस्ट्स पब्लिश हो चुकी हैं या कोई नई पोस्ट कतार में नहीं है।`;
        } else {
          pending.forEach((item, i) => {
            const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            scheduleMsg += `${i + 1}. *${item.title.slice(0, 35)}...*\n   ⏰ समय: *${time}* | चैनल्स: ${(item.targets || []).join(', ')}\n\n`;
          });
        }
        await this.bot.sendMessage(chatId, scheduleMsg, { parse_mode: 'Markdown', reply_markup: this.buildDashboardKeyboard() });
      } else if (text === '📋 डेली रिपोर्ट') {
        await this.sendDailyExecutiveReport(chatId);
      } else if (text === '🛡️ चैनल हेल्थ') {
        const dest = this.resolveDestination(msg);
        await this.bot.sendMessage(chatId, `⏳ *[चैनल हेल्थ ऑडिट]* लाइव API टोकन्स की जांच हो रही है...`, { parse_mode: 'Markdown' });
        const healthMsg = await this.generateHealthReport(dest);
        await this.bot.sendMessage(chatId, healthMsg, { parse_mode: 'Markdown', reply_markup: this.buildDashboardKeyboard(dest.id) });
      } else if (text === '🐪 डेस्टिनेशन बदलें') {
        await this.bot.sendMessage(chatId, `📍 *कृपया डेस्टिनेशन चुनें:*`, {
          parse_mode: 'Markdown',
          reply_markup: this.buildDashboardKeyboard()
        });
      } else if (text === '🔄 रीफ्रेश') {
        await renderStatus(chatId);
      }
    });

    // 7. Handle Interactive Inline Button Clicks (Callback Queries)
    this.bot.on('callback_query', async (cbQuery) => {
      const data = cbQuery.data || '';
      const chatId = cbQuery.message?.chat?.id;
      const messageId = cbQuery.message?.message_id;

      if (data.startsWith('switch_')) {
        const destId = data.replace('switch_', '').trim();
        const dest = db.getDestination(destId);
        if (dest) {
          const session = this.getSession(chatId, dest);
          session.destinationId = dest.id;
          await this.bot.answerCallbackQuery(cbQuery.id, `✅ डेस्टिनेशन: ${dest.name.split('(')[0]}`);
          await renderStatus(chatId, dest.id);
        }
      } else if (data === 'action_status') {
        await this.bot.answerCallbackQuery(cbQuery.id, '📊 लाइव स्टेटस लोड हो रहा है...');
        await renderStatus(chatId);
      } else if (data === 'action_schedule') {
        await this.bot.answerCallbackQuery(cbQuery.id, '📅 शेड्यूल लोड हो रहा है...');
        const session = this.getSession(chatId);
        const sessionDest = db.getDestination(session.destinationId) || db.getDestinations()[0];
        const queue = db.getQueue();
        const pending = queue.filter(q => q.destinationId === sessionDest.id && q.status === 'queued');
        let scheduleMsg = `📅 *[आज का लाइव शेड्यूल & कतार]* 🐪\n\n` +
          `📍 *डेस्टिनेशन:* ${sessionDest.name}\n\n`;
        if (pending.length === 0) {
          scheduleMsg += `आज की सभी पोस्ट्स पब्लिश हो चुकी हैं या कतार में कोई पोस्ट नहीं है।\n`;
        } else {
          pending.forEach((item, i) => {
            const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            scheduleMsg += `${i + 1}. *${item.title.slice(0, 35)}...*\n   ⏰ समय: *${time}* | चैनल्स: ${(item.targets || []).join(', ')}\n\n`;
          });
        }
        scheduleMsg += `${telegramNotifier.getVerifiedLinks(sessionDest)}\n\n` +
          `🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;
        await this.bot.sendMessage(chatId, scheduleMsg, { parse_mode: 'Markdown', reply_markup: this.buildDashboardKeyboard(sessionDest.id) });
      } else if (data === 'action_archive') {
        await this.bot.answerCallbackQuery(cbQuery.id, '✅ पब्लिश्ड आर्काइव...');
        const session = this.getSession(chatId);
        const sessionDest = db.getDestination(session.destinationId) || db.getDestinations()[0];
        const queue = db.getQueue();
        const published = queue.filter(q => q.destinationId === sessionDest.id && (q.status === 'published' || q.status === 'completed')).slice(-6);
        let archiveMsg = `✅ *[हाल ही में पब्लिश की गई पोस्ट्स व लाइव लिंक्स]*\n\n` +
          `📍 *डेस्टिनेशन:* ${sessionDest.name}\n\n`;
        if (published.length === 0) {
          archiveMsg += `आज अभी तक कोई पोस्ट पब्लिश नहीं हुई है।\n`;
        } else {
          published.forEach((item, i) => {
            archiveMsg += `${i + 1}. *${item.title.slice(0, 35)}...*\n   ✅ स्टेटस: पब्लिश्ड | प्रकार: ${item.itemType.toUpperCase()}\n`;
          });
        }
        archiveMsg += `${telegramNotifier.getVerifiedLinks(sessionDest)}\n\n` +
          `🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;
        await this.bot.sendMessage(chatId, archiveMsg, { parse_mode: 'Markdown', reply_markup: this.buildDashboardKeyboard(sessionDest.id) });
      } else if (data === 'action_daily_report') {
        await this.bot.answerCallbackQuery(cbQuery.id, '📋 डेली रिपोर्ट तैयार की जा रही है...');
        await this.sendDailyExecutiveReport(chatId);
      } else if (data === 'action_health') {
        await this.bot.answerCallbackQuery(cbQuery.id, '🛡️ लाइव हेल्थ चेक शुरू...');
        const session = this.getSession(chatId);
        const dest = db.getDestination(session.destinationId) || this.resolveDestination({ chat: { id: chatId } });
        const healthMsg = await this.generateHealthReport(dest);
        await this.bot.sendMessage(chatId, healthMsg, { parse_mode: 'Markdown', reply_markup: this.buildDashboardKeyboard(dest.id) });
      } else if (data === 'action_refresh') {
        await this.bot.answerCallbackQuery(cbQuery.id, '🔄 रीफ्रेश पूर्ण!');
        await renderStatus(chatId);
      }
    });

    // 8. Incoming Photo Handler (Single Post with SEO Caption)
    const handlePhotoMessage = async (msg) => {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      const dedupeKey = `${chatId}_${messageId}`;

      // Atomic Deduplication: Drop duplicate webhook/polling dispatches
      if (this.processedMessages.has(dedupeKey)) {
        console.log(`[TelegramBot Dedupe] 🛑 Dropping duplicate photo message: ${dedupeKey}`);
        return;
      }
      this.processedMessages.set(dedupeKey, Date.now());
      if (this.processedMessages.size > 500) {
        const oldestKey = this.processedMessages.keys().next().value;
        this.processedMessages.delete(oldestKey);
      }

      const photoArray = msg.photo;
      if (!photoArray || photoArray.length === 0) return;

      const bestPhoto = photoArray[photoArray.length - 1];
      const dest = this.resolveDestination(msg, msg.caption || '');
      const session = this.getSession(chatId, dest);

      const destInboxDir = path.join(__dirname, '..', 'uploads', 'telegram_inbox', dest.id);
      fs.mkdirSync(destInboxDir, { recursive: true });

      try {
        const fileUrl = await this.bot.getFileLink(bestPhoto.file_id);
        const filename = `tg_${Date.now()}_${Math.round(Math.random() * 1e3)}.jpg`;
        const localPath = path.join(destInboxDir, filename);

        const response = await axios({ url: fileUrl, method: 'GET', responseType: 'stream' });
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const rawCaption = msg.caption || '';
        const parsedSeo = this.parseCaptionToSeo(rawCaption, `${dest.name} - Live Travel Post`);

        // Enforce the 3 Master Links policy
        if (!parsedSeo.caption.includes('bookings.lexatrip.com')) {
          parsedSeo.caption += `\n\n🌐 बुकिंग पोर्टल: https://bookings.lexatrip.com/\n🌐 आधिकारिक वेबसाइट: https://www.lexatrip.com/\n📞 व्हाट्सएप / कॉल: +91 90798 54982`;
        }

        session.photos.push({
          localPath,
          rawCaption,
          seo: parsedSeo,
          timestamp: new Date().toISOString()
        });

        // 1. Process to HD 4:5 vertical portrait
        const processedDir = path.join(__dirname, '..', 'generated', 'live_dispatches');
        fs.mkdirSync(processedDir, { recursive: true });
        const processedFilename = `live_${Date.now()}_4x5.jpg`;
        const processedPath = path.join(processedDir, processedFilename);
        await imageProcessor.processTo4x5(localPath, processedPath);

        // 2. Immediately acknowledge receipt and announce instant dispatch to Telegram
        const singleTargets = this.resolveSinglePostTargets(dest);
        const targetNames = singleTargets.map(t => telegramNotifier.formatPlatformName(t)).join(', ');
        await this.sendDualMessage(
          chatId,
          `📸 *[लाइव फ़ोटो व SEO प्राप्त]* 🐪\n\n` +
          `📌 *टाइटल:* ${parsedSeo.title}\n` +
          `📍 *डेस्टिनेशन:* ${dest.name}\n\n` +
          `🚀 *लाइव पब्लिशिंग इंजन सक्रिय...* कनेक्टेड सोशल मीडिया पेजेस (${targetNames}) पर अभी लाइव पब्लिश किया जा रहा है!`,
          { parse_mode: 'Markdown' }
        );

        // 3. Immediately queue and dispatch Post (4:5) to all active, verified channels
        const queueRecord = {
          id: `q_instant_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          batchId: `batch_live_${Date.now()}`,
          destinationId: dest.id,
          destinationName: dest.name,
          itemType: 'post',
          index: session.photos.length,
          title: parsedSeo.title,
          caption: parsedSeo.caption,
          mediaPath: processedPath,
          scheduledTime: new Date(Date.now() - 5000).toISOString(),
          status: 'publishing',
          targets: singleTargets,
          createdAt: new Date().toISOString()
        };

        db.addToQueue(queueRecord);
        let postResult = null;
        try {
          postResult = await scheduler.publishItemNow(queueRecord.id);
        } catch (pErr) {
          postResult = {
            status: 'failed',
            publishResults: [{ platform: 'system', status: 'failed', error: pErr.message }]
          };
        }

        // 4. Deliver truthful report for Post
        const publishedTargets = (postResult?.publishResults || []).filter(r => r.status === 'published' || r.status === 'success');
        const failedTargets = (postResult?.publishResults || []).filter(r => r.status === 'failed');
        const skippedTargets = (postResult?.publishResults || []).filter(r => r.status === 'skipped');

        let reportMsg = '';
        if (publishedTargets.length > 0 && failedTargets.length === 0) {
          // 100% Genuine Success
          reportMsg = `✅ *[लाइव पब्लिशिंग संपन्न]* 🐪\n\n` +
            `📍 *डेस्टिनेशन:* ${dest.name}\n` +
            `📝 *पोस्ट:* ${parsedSeo.title} (4:5 HD)\n` +
            `🕒 *समय:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n\n` +
            `🔗 *वेरिफाइड लाइव पोस्ट लिंक्स (सीधे क्लिक करें):*\n`;

          for (const r of publishedTargets) {
            const icon = telegramNotifier.getPlatformIcon(r.platform);
            const name = telegramNotifier.formatPlatformName(r.platform);
            const postUrl = r.details?.postUrl || r.postUrl;
            if (postUrl) {
              reportMsg += `• [${icon} ${name} Live Post](${postUrl})\n`;
            } else {
              const chanUrl = telegramNotifier.getChannelUrl(dest, r.platform);
              reportMsg += chanUrl ? `• [${icon} ${name} Profile](${chanUrl})\n` : `• ${icon} ${name}: लाइव पब्लिश संपन्न ✅\n`;
            }
          }

          // Channel Status Advisory for Pending / Batch Channels
          reportMsg += `\n📋 *अन्य चैनल्स स्थिति:*\n`;
          const ch = dest.channels || {};
          if (ch.pinterest?.credentials?.status === 'trial_access_pending' || !singleTargets.includes('pinterest')) {
            reportMsg += `• ⏳ 📌 Pinterest: नया ऐप (ID ${ch.pinterest?.credentials?.appId || '1642972'}) Pinterest रिव्यू में है (Standard Access अप्रूवल के बाद पब्लिशिंग स्वतः शुरू होगी)\n`;
          }
          if (ch.blogger?.enabled) {
            reportMsg += `• 📰 Blogger: 5-फ़ोटो बैच आर्टिकल इंजन के लिए आरक्षित (सिंगल फ़ोटो सोशल फ़ीड के लिए नहीं)\n`;
          }
        } else if (publishedTargets.length > 0 && failedTargets.length > 0) {
          // Partial Success
          reportMsg = `⚠️ *[आंशिक पब्लिशिंग सूचना]* 🐪\n\n` +
            `📍 *डेस्टिनेशन:* ${dest.name}\n` +
            `📝 *कंटेंट:* ${parsedSeo.title}\n` +
            `🕒 *समय:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n\n` +
            `*सफल चैनल्स:*\n`;

          for (const r of publishedTargets) {
            const icon = telegramNotifier.getPlatformIcon(r.platform);
            const name = telegramNotifier.formatPlatformName(r.platform);
            const postUrl = r.details?.postUrl || r.postUrl;
            reportMsg += postUrl ? `• ✅ [${icon} ${name} Live Post](${postUrl})\n` : `• ✅ ${icon} ${name}: लाइव पब्लिश संपन्न\n`;
          }

          reportMsg += `\n*विफल चैनल्स (एरर विवरणी):*\n`;
          for (const r of failedTargets) {
            const icon = telegramNotifier.getPlatformIcon(r.platform);
            const name = telegramNotifier.formatPlatformName(r.platform);
            reportMsg += `• ❌ ${icon} ${name}: \`${r.error || 'अज्ञात त्रुटि'}\`\n`;
          }

          // Channel Status Advisory for Pending / Batch Channels
          reportMsg += `\n📋 *अन्य चैनल्स स्थिति:*\n`;
          const ch = dest.channels || {};
          if (ch.pinterest?.credentials?.status === 'trial_access_pending' || !singleTargets.includes('pinterest')) {
            reportMsg += `• ⏳ 📌 Pinterest: नया ऐप (ID ${ch.pinterest?.credentials?.appId || '1642972'}) Pinterest रिव्यू में है\n`;
          }
          if (ch.blogger?.enabled) {
            reportMsg += `• 📰 Blogger: 5-फ़ोटो बैच आर्टिकल इंजन के लिए आरक्षित\n`;
          }

          if (skippedTargets.length > 0) {
            reportMsg += `\n*स्किप किए गए चैनल्स:*\n`;
            for (const r of skippedTargets) {
              const icon = telegramNotifier.getPlatformIcon(r.platform);
              const name = telegramNotifier.formatPlatformName(r.platform);
              reportMsg += `• ⏸️ ${icon} ${name}: ${r.reason || 'Skipped'}\n`;
            }
          }
          reportMsg += `\n🛠️ *समाधान:* विफल चैनल्स के क्रेडेंशियल्स डैशबोर्ड से जांचें।\n`;
        } else {
          // Complete Failure
          reportMsg = `🚨 *[पब्लिशिंग विफलता अलर्ट]* 🐪\n\n` +
            `📍 *डेस्टिनेशन:* ${dest.name}\n` +
            `📝 *कंटेंट:* ${parsedSeo.title}\n` +
            `🕒 *समय:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n\n` +
            `🛑 *सभी चैनल्स पर पब्लिशिंग विफल रही:*\n`;

          for (const r of failedTargets) {
            const icon = telegramNotifier.getPlatformIcon(r.platform);
            const name = telegramNotifier.formatPlatformName(r.platform);
            reportMsg += `• ❌ ${icon} ${name}: \`${r.error || 'अज्ञात विफलता'}\`\n`;
          }
          reportMsg += `\n⚠️ *कोई भी पोस्ट लाइव नहीं हुई।* कृपया डैशबोर्ड के 🔐 सीक्रेट API वॉल्ट से टोकन रीफ्रेश करें।\n`;
        }

        reportMsg += `\n🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

        await this.sendDualMessage(chatId, reportMsg, {
          parse_mode: 'Markdown',
          reply_markup: this.buildDashboardKeyboard(dest.id)
        });

        // 5. In background: Also generate an Ultra HD 9:16 Vertical Reel (8s) and publish asynchronously
        setImmediate(async () => {
          if (process.env.DISABLE_CLOUD_VIDEO === 'true') {
            console.log('[TelegramBot] Cloud video disabled via DISABLE_CLOUD_VIDEO.');
            return;
          }

          const reelFilename = `live_${Date.now()}_reel.mp4`;
          const reelPath = path.join(processedDir, reelFilename);
          try {
            console.log('[TelegramBot] Background generating 9:16 Ultra HD motion Reel...');
            await videoEngine.generateSingleReel({
              imagePath: processedPath,
              outputPath: reelPath,
              duration: 8.0,
              brandText: (dest.name.split('(')[0] || 'LEXA TRIP').trim().toUpperCase(),
              tagline: '✦ Luxury Desert Camping & Experiential Travel ✦'
            });

            console.log('[TelegramBot] Background Single Reel successfully generated at:', reelPath);

            // Dynamically determine reel targets based on destination enabled channels and credentials
            const reelTargets = [];
            if (dest.channels?.facebook?.enabled !== false && dest.channels?.facebook?.credentials?.pageAccessToken) {
              reelTargets.push('facebook');
            }
            if (dest.channels?.instagram?.enabled !== false && (dest.channels?.instagram?.credentials?.accessToken || dest.channels?.instagram?.credentials?.pageAccessToken)) {
              reelTargets.push('instagram');
            }
            if (dest.channels?.youtube?.enabled === true && (dest.channels?.youtube?.credentials?.accessToken || dest.channels?.youtube?.credentials?.refreshToken)) {
              reelTargets.push('youtube');
            }
            const targets = reelTargets.length > 0 ? reelTargets : ['facebook', 'instagram'];

            const reelRecord = {
              id: `q_reel_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              batchId: `batch_live_${Date.now()}`,
              destinationId: dest.id,
              destinationName: dest.name,
              itemType: 'reel',
              index: session.photos.length,
              title: `Reel: ${parsedSeo.title}`,
              caption: parsedSeo.caption,
              mediaPath: reelPath,
              scheduledTime: new Date().toISOString(),
              status: 'publishing',
              targets: targets,
              createdAt: new Date().toISOString()
            };
            db.addToQueue(reelRecord);
            const reelResult = await scheduler.publishItemNow(reelRecord.id);

            const rPublished = (reelResult?.publishResults || []).filter(r => r.status === 'published' || r.status === 'success');
            const rFailed = (reelResult?.publishResults || []).filter(r => r.status === 'failed');

            if (reelResult?.status === 'queued') {
              // Transient failure triggered automatic retry
              let rMsg = `🔄 *[9:16 मोशन रील पुनः प्रयास शेड्यूल्ड]* 🐪\n\n` +
                `📍 *डेस्टिनेशन:* ${dest.name}\n` +
                `📌 *टाइटल:* Reel: ${parsedSeo.title}\n` +
                `⏱ *प्रयास:* ${reelResult.retryCount || 1}/3 (अस्थायी विलंब/ट्रांसकोडिंग के कारण पुनः प्रयास)\n\n`;
              if (rPublished.length > 0) {
                rMsg += `*लाइव चैनल्स:*\n`;
                for (const r of rPublished) {
                  const icon = telegramNotifier.getPlatformIcon(r.platform);
                  const name = telegramNotifier.formatPlatformName(r.platform);
                  const postUrl = r.details?.reelUrl || r.details?.postUrl || r.details?.watchUrl || r.details?.permalink || r.postUrl || r.reelUrl;
                  rMsg += postUrl ? `• [${icon} ${name} Reel](${postUrl})\n` : `• ✅ ${icon} ${name}: रील लाइव\n`;
                }
              }
              if (rFailed.length > 0) {
                rMsg += `\n*पुनः प्रयास किए जाने वाले चैनल्स:*\n`;
                for (const r of rFailed) {
                  const icon = telegramNotifier.getPlatformIcon(r.platform);
                  const name = telegramNotifier.formatPlatformName(r.platform);
                  rMsg += `• ⏳ ${icon} ${name}: \`${r.error || 'अस्थायी त्रुटि'}\`\n`;
                }
              }
              await this.sendDualMessage(chatId, rMsg, { parse_mode: 'Markdown' });
            } else if (rPublished.length > 0) {
              let rMsg = `🎬 *[9:16 मोशन रील लाइव पब्लिश संपन्न]* 🐪\n\n` +
                `📍 *डेस्टिनेशन:* ${dest.name}\n` +
                `📌 *टाइटल:* Reel: ${parsedSeo.title}\n\n` +
                `*रील लाइव चैनल्स:*\n`;
              for (const r of rPublished) {
                const icon = telegramNotifier.getPlatformIcon(r.platform);
                const name = telegramNotifier.formatPlatformName(r.platform);
                const postUrl = r.details?.reelUrl || r.details?.postUrl || r.details?.watchUrl || r.details?.permalink || r.postUrl || r.reelUrl;
                rMsg += postUrl ? `• [${icon} ${name} Reel](${postUrl})\n` : `• ✅ ${icon} ${name}: रील लाइव\n`;
              }
              if (rFailed.length > 0) {
                rMsg += `\n*विफल रील चैनल्स:*\n`;
                for (const r of rFailed) {
                  const icon = telegramNotifier.getPlatformIcon(r.platform);
                  const name = telegramNotifier.formatPlatformName(r.platform);
                  rMsg += `• ❌ ${icon} ${name}: \`${r.error || 'त्रुटि'}\`\n`;
                }
              }
              await this.sendDualMessage(chatId, rMsg, { parse_mode: 'Markdown' });
            } else {
              // All targets failed (rPublished.length === 0)
              let failMsg = `🚨 *[9:16 मोशन रील पब्लिश विफलता]*\n\n` +
                `📍 *डेस्टिनेशन:* ${dest.name}\n` +
                `📌 *टाइटल:* Reel: ${parsedSeo.title}\n\n` +
                `*विफल रील चैनल्स:*\n`;
              if (rFailed.length > 0) {
                for (const r of rFailed) {
                  const icon = telegramNotifier.getPlatformIcon(r.platform);
                  const name = telegramNotifier.formatPlatformName(r.platform);
                  failMsg += `• ❌ ${icon} ${name}: \`${r.error || 'त्रुटि'}\`\n`;
                }
              } else {
                failMsg += `• ❌ सभी रील चैनल्स पर प्रकाशन विफल रहा।\n`;
              }
              failMsg += `\nकृपया क्रेडेंशियल्स व नेटवर्क कनेक्शन जांचें।`;
              await this.sendDualMessage(chatId, failMsg, { parse_mode: 'Markdown' });
            }
          } catch (rErr) {
            console.error('[TelegramBot] Background Single Reel render error:', rErr);
            try {
              await this.sendDualMessage(
                chatId,
                `🚨 *[9:16 मोशन रील निर्माण विफलता]* 🐪\n\n` +
                `📍 *डेस्टिनेशन:* ${dest.name}\n` +
                `🛑 *त्रुटि:* \`${rErr.message}\`\n\n` +
                `वीडियो रेंडरिंग प्रक्रिया विफल हो गई।`,
                { parse_mode: 'Markdown' }
              );
            } catch (e) {
              console.error('[TelegramBot] Error sending reel render alert:', e.message);
            }
          }
        });

        // 5. If this is part of a 5-photo batch with combined SEO, trigger full pipeline
        if (session.photos.length >= 5 && session.combinedSeo) {
          await this.triggerFullPipeline(chatId, session, dest);
        }
      } catch (err) {
        console.error('Telegram photo download error:', err);
        this.sendDualMessage(chatId, `⚠️ फ़ोटो डाउनलोड में त्रुटि: ${err.message}`);
      }
    };

    // 9. Incoming Text Handler (Detect "कंबाइंड SEO")
    const handleTextMessage = async (msg) => {
      const text = (msg.text || '').trim();
      if (!text || text.startsWith('/')) return;

      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      const dedupeKey = `${chatId}_${messageId}`;

      if (this.processedMessages.has(dedupeKey)) {
        return;
      }
      this.processedMessages.set(dedupeKey, Date.now());
      if (this.processedMessages.size > 500) {
        const oldestKey = this.processedMessages.keys().next().value;
        this.processedMessages.delete(oldestKey);
      }

      const dest = this.resolveDestination(msg, text);
      const session = this.getSession(chatId, dest);

      const isCombinedSeo = /^(कंबाइंड\s*SEO|combined\s*seo|combinedseo)/i.test(text);

      if (isCombinedSeo) {
        const cleanedText = text.replace(/^(कंबाइंड\s*SEO|combined\s*seo)\s*[:：\-]?\s*/i, '').trim();
        const parsedCombinedSeo = this.parseCaptionToSeo(cleanedText, `5 Highlights of ${dest.name} [Carousel & Reel]`);

        session.combinedSeo = parsedCombinedSeo;

        if (session.photos.length < 5) {
          const remaining = 5 - session.photos.length;
          return this.sendDualMessage(
            chatId,
            `📑 *कंबाइंड SEO सेव हो गया!*\n` +
            `टाइटल: *${parsedCombinedSeo.title}*\n\n` +
            `⚠️ अभी केवल *${session.photos.length}/5 फ़ोटोज़* मिली हैं। कृपया बाकी *${remaining} फ़ोटो* भेजें ताकि ऑटोमेशन तुरंत चालू हो सके।`,
            { parse_mode: 'Markdown' }
          );
        }

        await this.triggerFullPipeline(chatId, session, dest);
      } else if (session.photos && session.photos.length > 0) {
        // Fallback: If user sends SEO/Caption text in a separate message after uploading a photo
        const cleanedText = text.replace(/^(एसईओ|seo|टाइटल|title)\s*[:：\-]?\s*/i, '').trim();
        const parsedSeo = this.parseCaptionToSeo(cleanedText, `${dest.name} - Live Travel Post`);
        if (!parsedSeo.caption.includes('bookings.lexatrip.com')) {
          parsedSeo.caption += `\n\n🌐 बुकिंग पोर्टल: https://bookings.lexatrip.com/\n🌐 आधिकारिक वेबसाइट: https://www.lexatrip.com/\n📞 व्हाट्सएप / कॉल: +91 90798 54982`;
        }

        const lastPhoto = session.photos[session.photos.length - 1];
        lastPhoto.rawCaption = text;
        lastPhoto.seo = parsedSeo;

        await this.sendDualMessage(
          chatId,
          `📝 *[SEO टेक्स्ट प्राप्त]* 🐪\n\n` +
          `📌 *टाइटल:* ${parsedSeo.title}\n` +
          `📍 *डेस्टिनेशन:* ${dest.name}\n\n` +
          `🚀 ताज़ा SEO के साथ सोशल मीडिया चैनल्स पर लाइव पब्लिश किया जा रहा है...`,
          { parse_mode: 'Markdown' }
        );

        const singleTargets = this.resolveSinglePostTargets(dest);
        const queueRecord = {
          id: `q_instant_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          batchId: `batch_live_${Date.now()}`,
          destinationId: dest.id,
          destinationName: dest.name,
          itemType: 'post',
          index: session.photos.length,
          title: parsedSeo.title,
          caption: parsedSeo.caption,
          mediaPath: lastPhoto.localPath,
          scheduledTime: new Date(Date.now() - 5000).toISOString(),
          status: 'queued',
          targets: singleTargets,
          createdAt: new Date().toISOString()
        };

        db.addToQueue(queueRecord);
        try {
          await scheduler.publishItemNow(queueRecord.id);
        } catch (pErr) {
          console.error('[TelegramBot Text Publish Error]:', pErr.message);
        }
      }
    };

    this.bot.on('photo', handlePhotoMessage);
    this.bot.on('text', handleTextMessage);

    this.bot.on('channel_post', async (msg) => {
      if (msg.photo) {
        await handlePhotoMessage(msg);
      } else if (msg.text) {
        await handleTextMessage(msg);
      }
    });
  }

  /**
   * 🚀 Full Autonomous Pipeline Triggered from Telegram
   */
  async triggerFullPipeline(chatId, session, dest) {
    try {
      await this.sendDualMessage(
        chatId,
        `🚀 *[ऑटोमेशन शुरू]* 5 फोटोज़ और कंबाइंड SEO मिल चुके हैं!\n` +
        `⏳ 4:5 इमेजेस, कर्सल और रील्स तैयार की जा रही हैं... कृपया 30 सेकंड इंतज़ार करें।`,
        { parse_mode: 'Markdown' }
      );

      const batchId = 'batch_' + Date.now();
      const batchDir = path.join(__dirname, '..', 'generated', batchId);
      fs.mkdirSync(batchDir, { recursive: true });

      const englishBrand = (dest.name.match(/\((.*?)\)/)?.[1] || dest.name).replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase() || 'LEXA TRIP';
      const cleanTagline = '✦ LUXURY TRAVEL & EXPERIENCES ✦';

      // 1. Process 5 Images to 4:5
      const processedPosts = [];
      const photosToUse = session.photos.slice(0, 5);

      for (let i = 0; i < 5; i++) {
        const item = photosToUse[i];
        const outPath = path.join(batchDir, `post_${i + 1}_4x5.jpg`);
        await imageProcessor.processTo4x5(item.localPath, outPath);

        processedPosts.push({
          index: i + 1,
          imagePath: `/generated/${batchId}/post_${i + 1}_4x5.jpg`,
          diskPath: outPath,
          seo: {
            postIndex: i + 1,
            topic: item.seo?.title || `Post ${i + 1}`,
            title: item.seo?.title || `Post ${i + 1} - ${dest.name}`,
            caption: item.seo?.caption || `Experience ${dest.name}!`,
            hashtags: item.seo?.hashtags || []
          },
          targetChannels: dest.defaultChannels?.post || ['instagram', 'facebook', 'linkedin', 'pinterest']
        });
      }

      // 2. Build Combined Carousel
      const carouselCollage = path.join(batchDir, 'carousel_preview.jpg');
      await imageProcessor.generateCarouselCollage(processedPosts.map(p => p.diskPath), carouselCollage);

      // 3. Render 5 Individual Reels (11.5s each)
      const generatedSingleReels = [];
      for (let i = 0; i < 5; i++) {
        const reelFilename = `reel_${i + 1}_1080x1920.mp4`;
        const reelDiskPath = path.join(batchDir, reelFilename);

        try {
          await videoEngine.generateSingleReel({
            imagePath: processedPosts[i].diskPath,
            outputPath: reelDiskPath,
            duration: 11.5,
            brandText: englishBrand,
            tagline: cleanTagline
          });

          generatedSingleReels.push({
            index: i + 1,
            reelPath: `/generated/${batchId}/${reelFilename}`,
            reelDiskPath: reelDiskPath,
            duration: 11.5,
            seo: processedPosts[i].seo,
            targetChannels: dest.defaultChannels?.reel || ['instagram', 'facebook', 'youtube', 'pinterest']
          });
        } catch (reelErr) {
          console.warn(`Single Reel ${i + 1} notice:`, reelErr.message);
        }
      }

      // 4. Render 1 Combined 12s Reel
      const combinedReelFilename = `combined_12s_reel.mp4`;
      const combinedReelDiskPath = path.join(batchDir, combinedReelFilename);

      let hasCombinedReel = false;
      try {
        await videoEngine.generateCombined12sReel({
          imagePaths: processedPosts.map(p => p.diskPath),
          outputPath: combinedReelDiskPath,
          durations: [2, 2, 2, 2, 4],
          brandText: englishBrand,
          tagline: cleanTagline,
          style: 'contain_blur'
        });
        hasCombinedReel = true;
      } catch (combErr) {
        console.warn('Combined 12s Reel notice:', combErr.message);
      }

      // 5. Construct Batch Record
      const newBatch = {
        id: batchId,
        destinationId: dest.id,
        destinationName: dest.name,
        destinationSlug: dest.slug,
        title: session.combinedSeo?.title || `Campaign ${new Date().toLocaleDateString('en-IN')}`,
        status: 'ready',
        createdAt: new Date().toISOString(),
        posts: processedPosts,
        carousel: {
          title: session.combinedSeo?.title || `5 Highlights of ${dest.name}`,
          slideCount: 5,
          previewPath: carouselCollage,
          seo: session.combinedSeo,
          targetChannels: dest.defaultChannels?.carousel || ['instagram', 'facebook', 'linkedin']
        },
        reels: generatedSingleReels,
        singleReels: generatedSingleReels,
        combined12sReel: hasCombinedReel ? {
          title: `12s Cinematic Highlight: ${dest.name}`,
          duration: 12.0,
          videoPath: `/generated/${batchId}/${combinedReelFilename}`,
          diskPath: combinedReelDiskPath,
          seo: session.combinedSeo,
          targetChannels: dest.defaultChannels?.reel || ['instagram', 'facebook', 'youtube']
        } : null
      };

      db.saveBatch(newBatch);

      // 6. Schedule across daylight queue
      const scheduledItems = scheduler.scheduleBatch(batchId);

      // 7. Reset session for next day
      this.resetSession(chatId);

      // 8. Send Telegram Report with Interactive Buttons
      let timetableMsg = `🎉 *[सफलतापूर्वक शेड्यूल्ड!]* ${dest.name}\n\n` +
        `📁 *बैच ID:* \`${batchId}\`\n` +
        `📸 *5 पोस्ट्स + 📑 1 कर्सल + 🎬 रील्स* तैयार होकर एंटी-स्पैम टाइमिंग में शेड्यूल हो गई हैं।\n\n` +
        `📅 *आज का पोस्टिंग टाइमटेबल:*\n`;

      scheduledItems.forEach((item, idx) => {
        const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const typeLabel = item.itemType === 'reel' ? '🎬 12s रील' : item.itemType === 'carousel' ? '📑 5-स्लाइड कर्सल' : `📸 पोस्ट #${item.index}`;
        timetableMsg += `${idx + 1}. ${typeLabel} ➔ *${time}*\n`;
      });

      timetableMsg += `\n🛡️ *हर पोस्ट पब्लिश होते ही आपको यहाँ लाइव रिपोर्ट व प्रिव्यू मिल जाएगा।*\n` +
        `🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

      await this.sendDualMessage(chatId, timetableMsg, {
        parse_mode: 'Markdown',
        reply_markup: this.buildDashboardKeyboard(dest.id)
      });
    } catch (err) {
      console.error('triggerFullPipeline error:', err);
      this.sendDualMessage(chatId, `⚠️ ऑटोमेशन प्रोसेस में त्रुटि: ${err.message}`);
    }
  }
}

module.exports = new TelegramBotService();
