const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const db = require('../database/db');

class TelegramNotifier {
  getTokenForDestination(destination) {
    return destination?.telegram?.botToken || db.getSettings()?.telegram?.botToken || null;
  }

  getChatIdForDestination(destination) {
    return destination?.telegram?.chatId || db.getSettings()?.telegram?.allowedChatId || null;
  }

  async sendMessage(token, chatId, text, options = {}) {
    if (!token || !chatId) return null;
    const payload = { chat_id: chatId, text, ...options };
    try {
      const res = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload, { timeout: 15000 });
      return res.data;
    } catch (err) {
      if (options.parse_mode) {
        delete payload.parse_mode;
        try {
          const res2 = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload, { timeout: 15000 });
          return res2.data;
        } catch (e) {}
      }
      console.error('[TelegramNotifier sendMessage error]:', err.response?.data || err.message);
    }
  }

  async sendPhoto(token, chatId, filePath, options = {}) {
    if (!token || !chatId || !fs.existsSync(filePath)) return null;
    try {
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('photo', fs.createReadStream(filePath));
      if (options.caption) form.append('caption', options.caption);
      if (options.parse_mode) form.append('parse_mode', options.parse_mode);

      const res = await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, {
        headers: form.getHeaders(),
        timeout: 30000
      });
      return res.data;
    } catch (err) {
      console.error('[TelegramNotifier sendPhoto error]:', err.response?.data || err.message);
    }
  }

  async sendVideo(token, chatId, filePath, options = {}) {
    if (!token || !chatId || !fs.existsSync(filePath)) return null;
    try {
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('video', fs.createReadStream(filePath));
      if (options.caption) form.append('caption', options.caption);
      if (options.parse_mode) form.append('parse_mode', options.parse_mode);

      const res = await axios.post(`https://api.telegram.org/bot${token}/sendVideo`, form, {
        headers: form.getHeaders(),
        timeout: 60000
      });
      return res.data;
    } catch (err) {
      console.error('[TelegramNotifier sendVideo error]:', err.response?.data || err.message);
    }
  }

  /**
   * 1. Send Batch Creation Alert (To Admin Chat and Channel)
   */
  async notifyBatchCreated(destination, batch) {
    try {
      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      const channelId = destination?.telegram?.channelId;
      if (!token) return;

      const message = `✨ *[नया बैच तैयार]* ${destination.name}\n\n` +
        `📁 *कैम्पेन:* ${batch.title}\n` +
        `📸 *5 पोस्ट्स (4:5):* तैयार हैं\n` +
        `📑 *1 कर्सल पोस्ट (5 स्लाइड्स):* तैयार है\n` +
        `🎬 *1 कम्बाइंड 12s रील (Ultra HD):* तैयार है\n\n` +
        `🚀 *अगला कदम:* डैशबोर्ड से 1-क्लिक में शेड्यूल करें (1-1.5 घंटे का एंटी-स्पैम गैप)।`;

      const targets = [adminChatId, channelId].filter(Boolean);
      const uniqueTargets = [...new Set(targets)];

      for (const tId of uniqueTargets) {
        if (batch.carousel?.previewPath && fs.existsSync(batch.carousel.previewPath)) {
          await this.sendPhoto(token, tId, batch.carousel.previewPath, { caption: message, parse_mode: 'Markdown' });
        } else {
          await this.sendMessage(token, tId, message, { parse_mode: 'Markdown' });
        }
      }
    } catch (err) {
      console.error('[TelegramNotifier notifyBatchCreated]:', err.message);
    }
  }

  /**
   * 2. Send Schedule Timetable Alert (To Admin Chat and Channel)
   */
  async notifyBatchScheduled(destination, batch, scheduledItems) {
    try {
      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      const channelId = destination?.telegram?.channelId;
      if (!token) return;

      let msg = `📅 *[शेड्यूलिंग टाइमटेबल कन्फर्मेशन]* ${destination.name}\n\n` +
        `बैच: *${batch.title}*\n` +
        `कुल आइटम्स: *${scheduledItems.length}*\n` +
        `एंटी-स्पैम डिले: *60 से 90 मिनट रैंडम मानवीय अंतराल*\n\n` +
        `*आगामी पोस्ट्स की टाइमिंग:*\n`;

      scheduledItems.forEach((item, i) => {
        const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const date = new Date(item.scheduledTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const typeName = item.itemType === 'reel' ? '🎬 12s रील' : item.itemType === 'carousel' ? '📑 कर्सल' : `📸 पोस्ट #${item.index}`;
        const channels = (item.targets || []).join(', ');
        msg += `${i + 1}. ${typeName} ➔ *${time}* (${date})\n   🎯 चैनल्स: ${channels}\n`;
      });

      msg += `\n🛡️ *हर पोस्ट पब्लिश होते ही आपको यहाँ लाइव रिपोर्ट मिलेगी।*\n` +
        `🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

      const targets = [adminChatId, channelId].filter(Boolean);
      const uniqueTargets = [...new Set(targets)];

      for (const tId of uniqueTargets) {
        await this.sendMessage(token, tId, msg, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('[TelegramNotifier notifyBatchScheduled]:', err.message);
    }
  }

  /**
   * 3. Send Post / Reel Published Alert (To Admin Chat and Channel)
   */
  async notifyItemPublished(destination, item, results) {
    try {
      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      const channelId = destination?.telegram?.channelId;
      if (!token) return;

      const typeLabel = item.itemType === 'reel' ? '🎬 12-सेकंड अल्ट्रा HD रील' : item.itemType === 'carousel' ? '📑 5-स्लाइड कर्सल' : `📸 पोस्ट #${item.index} (4:5)`;

      let platformList = '';
      results.forEach(r => {
        const icon = r.status === 'published' ? '✅' : r.status === 'skipped' ? '⚪' : '❌';
        platformList += `  ${icon} *${r.platform.toUpperCase()}:* ${r.status.toUpperCase()} ${r.details?.simulated ? '(Simulation Ready)' : ''}\n`;
      });

      const directLinks = `\n🔗 *वेरिफिकेशन लिंक्स (सीधे लाइव देखें):*\n` +
        `• [📘 Facebook Live](https://www.facebook.com/1385624654624388)\n` +
        `• [📸 Instagram (@lexatripjaisalmer)](https://www.instagram.com/lexatripjaisalmer/)\n` +
        `• [📢 Telegram Channel](https://t.me/lexatripjaisalmer)\n` +
        `• [📌 Pinterest Board](https://www.pinterest.com/lexatripjaisalmer/)\n` +
        `• [💼 LinkedIn Company](https://www.linkedin.com/company/lexatripjaisalmer)\n` +
        `• [🌐 Bookings Portal](https://bookings.lexatrip.com/)\n` +
        `• [💬 WhatsApp Chat](https://wa.me/919079854982)`;

      const msg = `🎉 *[सफल पब्लिश रिपोर्ट]* ${destination?.name || 'Lexa Trip'}\n\n` +
        `📌 *कंटेंट:* ${typeLabel}\n` +
        `📝 *टाइटल:* ${item.title}\n` +
        `🕒 *समय:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n\n` +
        `*सोशल मीडिया स्टेटस:*\n${platformList}` +
        `${directLinks}\n\n` +
        `🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

      const targets = [adminChatId, channelId].filter(Boolean);
      const uniqueTargets = [...new Set(targets)];

      for (const tId of uniqueTargets) {
        if (item.mediaPath && fs.existsSync(item.mediaPath)) {
          if (item.itemType === 'reel') {
            await this.sendVideo(token, tId, item.mediaPath, { caption: msg.slice(0, 1024), parse_mode: 'Markdown' });
          } else {
            await this.sendPhoto(token, tId, item.mediaPath, { caption: msg.slice(0, 1024), parse_mode: 'Markdown' });
          }
        } else {
          await this.sendMessage(token, tId, msg, { parse_mode: 'Markdown' });
        }
      }
    } catch (err) {
      console.error('[TelegramNotifier notifyItemPublished]:', err.message);
    }
  }

  /**
   * 4. 🚨 CRITICAL POLICY & SECURITY ALERT (Community Guidelines / Policy / Permissions)
   */
  async notifyPolicyAlert({ destination, platform, error, details }) {
    try {
      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      const channelId = destination?.telegram?.channelId;
      if (!token) return;

      const alertMsg = `🚨 *[अति-महत्वपूर्ण: सुरक्षा व पॉलिसी अलर्ट / POLICY ALERT]* 🚨\n\n` +
        `📍 *डेस्टिनेशन:* ${destination?.name || 'Lexa Trip'}\n` +
        `⚠️ *प्लेटफ़ॉर्म:* *${platform.toUpperCase()}*\n` +
        `🛑 *समस्या / एरर:* \`${error}\`\n\n` +
        (details ? `📋 *तकनीकी विवरण:* ${String(details).slice(0, 250)}\n\n` : '') +
        `⚠️ *संभावित कारण:* App Review आवश्यकता, कम्युनिटी गाइडलाइन्स चेक, टोकन एक्सपायरी, या प्राइवेसी पॉलिसी वेरिफिकेशन।\n\n` +
        `🛠️ *त्वरित कदम:* कृपया अपने डेवलपर कंसोल या डैशबोर्ड में सेटिंग्स चेक करें।\n` +
        `🌐 *डैशबोर्ड लिंक:* https://lexa-trip-automation.onrender.com`;

      const targets = [adminChatId, channelId].filter(Boolean);
      const uniqueTargets = [...new Set(targets)];

      for (const tId of uniqueTargets) {
        await this.sendMessage(token, tId, alertMsg, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('[TelegramNotifier notifyPolicyAlert]:', err.message);
    }
  }

  /**
   * 5. General Error Alert
   */
  async notifyError(destination, item, errorText) {
    try {
      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      const channelId = destination?.telegram?.channelId;
      if (!token) return;

      const msg = `⚠️ *[त्रुटि अलर्ट / Publishing Error]* ${destination.name}\n\n` +
        `कंटेंट: *${item.title}*\n` +
        `कारण: \`${errorText}\`\n\n` +
        `कृपया डैशबोर्ड में जाकर टोकन या नेटवर्क चेक करें।`;

      const targets = [adminChatId, channelId].filter(Boolean);
      const uniqueTargets = [...new Set(targets)];

      for (const tId of uniqueTargets) {
        await this.sendMessage(token, tId, msg, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('[TelegramNotifier notifyError]:', err.message);
    }
  }
}

module.exports = new TelegramNotifier();
