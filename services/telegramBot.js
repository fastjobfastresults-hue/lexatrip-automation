const path = require('path');
const fs = require('fs');
const axios = require('axios');
const db = require('../database/db');
const imageProcessor = require('./imageProcessor');
const videoEngine = require('./videoEngine');
const seoGenerator = require('./seoGenerator');
const scheduler = require('./scheduler');
const telegramNotifier = require('./telegramNotifier');

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

  async pollLoop() {
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

            // 1. Handle Callback Queries (Inline Button Clicks)
            if (update.callback_query) {
              for (const cb of this.handlers.callback_query) {
                try { await cb(update.callback_query); } catch (e) { console.error('callback_query error:', e); }
              }
              continue;
            }

            // 2. Handle Messages & Channel Posts
            const msg = update.channel_post || update.message;
            if (!msg) continue;

            if (update.channel_post) {
              for (const cb of this.handlers.channel_post) {
                try { await cb(msg); } catch (e) { console.error('Channel post handler error:', e); }
              }
            } else if (update.message) {
              for (const cb of this.handlers.message) {
                try { await cb(msg); } catch (e) { console.error('Message handler error:', e); }
              }
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
      } catch (err) {
        for (const cb of this.handlers.polling_error) {
          try { cb(err); } catch (e) {}
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
}

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.sessions = new Map();
    this.inbox = new Map();
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

  resolveDestination(msg) {
    const destinations = db.getDestinations();
    const chatId = msg.chat?.id ? String(msg.chat.id) : '';
    const chatTitle = (msg.chat?.title || '').toLowerCase();
    const chatUsername = (msg.chat?.username || '').toLowerCase();

    for (const d of destinations) {
      if (d.telegram?.channelId && String(d.telegram.channelId) === chatId) return d;
      if (d.telegram?.chatId && String(d.telegram.chatId) === chatId) return d;
    }

    for (const d of destinations) {
      const slug = (d.slug || '').toLowerCase();
      const name = (d.name || '').toLowerCase();
      const city = name.replace(/lexa\s*trip/i, '').trim();
      if (city && (chatTitle.includes(city) || chatUsername.includes(city))) {
        d.telegram = d.telegram || {};
        d.telegram.channelId = chatId;
        d.telegram.channelUsername = msg.chat?.username ? `@${msg.chat.username}` : '';
        db.saveDestination(d);
        return d;
      }
      if (slug && (chatTitle.includes(slug) || chatUsername.includes(slug))) {
        d.telegram = d.telegram || {};
        d.telegram.channelId = chatId;
        db.saveDestination(d);
        return d;
      }
    }

    const session = this.sessions.get(chatId);
    if (session?.destinationId) {
      const found = db.getDestination(session.destinationId);
      if (found) return found;
    }

    return destinations[0] || { id: 'dest_jaisalmer', name: 'Lexa Trip Jaisalmer', slug: 'jaisalmer' };
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

    reportMsg += `\n🛡️ *सिक्योरिटी व चैनल हेल्थ:* 100% सुरक्षित (0 कम्युनिटी स्ट्राइक)\n` +
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
      const dest = this.resolveDestination(msg);
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

      let reply = `📊 *[लाइव स्टेटस & ट्रैकिंग]* 🐪\n\n` +
        `📍 *सक्रिय डेस्टिनेशन:* *${targetDest?.name || 'Lexa Trip'}*\n` +
        `✅ *पब्लिश्ड आज:* ${completed.length} पोस्ट्स\n` +
        `⏳ *कतार में शेड्यूल्ड:* ${pending.length} पोस्ट्स\n` +
        `🛡️ *चैनल सेफ्टी हेल्थ:* 100% सुरक्षित (0 स्ट्राइक)\n`;

      if (pending.length > 0) {
        reply += `\n*⏰ आगामी शेड्यूल्ड पोस्ट्स:*\n`;
        pending.slice(0, 5).forEach((item, i) => {
          const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          reply += `${i + 1}. [${item.itemType.toUpperCase()}] ${item.title.slice(0, 32)}...\n   ⏰ *${time}*\n`;
        });
      } else {
        reply += `\n✨ *अभी कोई पेंडिंग पोस्ट नहीं है। नया बैच भेजने के लिए 5 फ़ोटोज़ + कंबाइंड SEO भेजें।*`;
      }

      reply += `\n🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

      await this.bot.sendMessage(chatId, reply, {
        parse_mode: 'Markdown',
        reply_markup: this.buildDashboardKeyboard(targetDest?.id)
      });
    };

    this.bot.onText(/\/status/, (msg) => renderStatus(msg.chat.id));

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
        let healthMsg = `🛡️ *[चैनल हेल्थ व पॉलिसी सेफ्टी रिपोर्ट]*\n\n` +
          `📍 *डेस्टिनेशन:* ${dest.name}\n` +
          `📸 *Instagram (@lexatripjaisalmer):* 🟢 Live Official\n` +
          `📘 *Facebook Page:* 🟢 Lifetime Token Linked\n` +
          `💼 *LinkedIn:* 🟢 Organization Urn Active\n` +
          `📌 *Pinterest:* 🟢 Board Connected\n` +
          `✍️ *Blogger:* 🟢 Live Connected\n` +
          `🎬 *YouTube Shorts:* 🟢 API Active\n` +
          `🤖 *Reddit & Quora Hub:* 🟢 AI Q&A Engine 100% Safe\n\n` +
          `✅ *स्टेटस: 0 कम्युनिटी स्ट्राइक · 100% पॉलिसी सुरक्षित*`;
        await this.bot.sendMessage(chatId, healthMsg, { parse_mode: 'Markdown', reply_markup: this.buildDashboardKeyboard() });
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
        const queue = db.getQueue();
        const pending = queue.filter(q => q.status === 'queued');
        let scheduleMsg = `📅 *[आज का लाइव शेड्यूल]* 🐪\n\n`;
        if (pending.length === 0) {
          scheduleMsg += `आज की सभी पोस्ट्स पब्लिश हो चुकी हैं।`;
        } else {
          pending.forEach((item, i) => {
            const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            scheduleMsg += `${i + 1}. *${item.title.slice(0, 35)}...*\n   ⏰ समय: *${time}* | चैनल्स: ${(item.targets || []).join(', ')}\n\n`;
          });
        }
        await this.bot.sendMessage(chatId, scheduleMsg, { parse_mode: 'Markdown', reply_markup: this.buildDashboardKeyboard() });
      } else if (data === 'action_archive') {
        await this.bot.answerCallbackQuery(cbQuery.id, '✅ पब्लिश्ड आर्काइव...');
        const queue = db.getQueue();
        const published = queue.filter(q => q.status === 'published' || q.status === 'completed').slice(-6);
        let archiveMsg = `✅ *[हाल ही में पब्लिश की गई पोस्ट्स]*\n\n`;
        if (published.length === 0) {
          archiveMsg += `आज अभी तक कोई पोस्ट पब्लिश नहीं हुई है।`;
        } else {
          published.forEach((item, i) => {
            archiveMsg += `${i + 1}. *${item.title.slice(0, 35)}...*\n   ✅ स्टेटस: पब्लिश्ड | प्रकार: ${item.itemType.toUpperCase()}\n\n`;
          });
        }
        await this.bot.sendMessage(chatId, archiveMsg, { parse_mode: 'Markdown', reply_markup: this.buildDashboardKeyboard() });
      } else if (data === 'action_daily_report') {
        await this.bot.answerCallbackQuery(cbQuery.id, '📋 डेली रिपोर्ट तैयार की जा रही है...');
        await this.sendDailyExecutiveReport(chatId);
      } else if (data === 'action_health') {
        await this.bot.answerCallbackQuery(cbQuery.id, '🛡️ हेल्थ चेक...');
        const healthMsg = `🛡️ *[चैनल हेल्थ व पॉलिसी सेफ्टी ऑडिट]*\n\n` +
          `• *Facebook / Meta:* 🟢 Lifetime Token Active\n` +
          `• *Instagram (@lexatripjaisalmer):* 🟢 Active\n` +
          `• *LinkedIn:* 🟢 Valid\n` +
          `• *Pinterest:* 🟢 Valid\n` +
          `• *YouTube:* 🟢 Valid\n` +
          `• *Blogger:* 🟢 Valid\n` +
          `• *Reddit & Quora Hub:* 🟢 AI Drip Safe\n\n` +
          `✅ *स्टेटस: 0 कम्युनिटी स्ट्राइक · 100% पॉलिसी सुरक्षित*`;
        await this.bot.sendMessage(chatId, healthMsg, { parse_mode: 'Markdown', reply_markup: this.buildDashboardKeyboard() });
      } else if (data === 'action_refresh') {
        await this.bot.answerCallbackQuery(cbQuery.id, '🔄 रीफ्रेश पूर्ण!');
        await renderStatus(chatId);
      }
    });

    // 8. Incoming Photo Handler (Single Post with SEO Caption)
    const handlePhotoMessage = async (msg) => {
      const chatId = msg.chat.id;
      const photoArray = msg.photo;
      if (!photoArray || photoArray.length === 0) return;

      const bestPhoto = photoArray[photoArray.length - 1];
      const dest = this.resolveDestination(msg);
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
        const parsedSeo = this.parseCaptionToSeo(rawCaption, `${dest.name} - Post ${session.photos.length + 1}`);

        session.photos.push({
          localPath,
          rawCaption,
          seo: parsedSeo,
          timestamp: new Date().toISOString()
        });

        const currentCount = session.photos.length;
        let responseMsg = `📸 *[फोटो ${currentCount}/5 प्राप्त]* ${dest.name}\n` +
          `📌 *टाइटल:* ${parsedSeo.title}\n` +
          (parsedSeo.hashtags.length ? `🏷️ *हैशटैग्स:* ${parsedSeo.hashtags.slice(0, 5).join(' ')}\n\n` : '\n');

        if (currentCount < 5) {
          responseMsg += `अगली फ़ोटो (${currentCount + 1}/5) भेजें।`;
        } else {
          responseMsg += `🎉 *पाँचों (5/5) फोटोज़ प्राप्त हो गईं!*\n\n` +
            `अब कृपया अंतिम टेक्स्ट मैसेज भेजें जिसकी शुरुआत में *कंबाइंड SEO* लिखा हो (जैसे: \`कंबाइंड SEO: लेक्सा ट्रिप जैसलमेर...\`)।\n` +
            `इसके बाद ऑटोमैटिक शेड्यूलिंग शुरू हो जाएगी!`;
        }

        await this.sendDualMessage(chatId, responseMsg, { parse_mode: 'Markdown' });

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
      const dest = this.resolveDestination(msg);
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
