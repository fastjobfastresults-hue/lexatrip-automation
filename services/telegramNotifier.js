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
   * 1. Send Batch Creation Alert
   */
  async notifyBatchCreated(destination, batch) {
    try {
      const token = this.getTokenForDestination(destination);
      const chatId = this.getChatIdForDestination(destination);
      if (!token || !chatId) return;

      const message = `✨ *[नया बैच तैयार]* ${destination.name}\n\n` +
        `📁 *कैम्पेन:* ${batch.title}\n` +
        `📸 *5 पोस्ट्स (4:5):* तैयार हैं\n` +
        `📑 *1 कर्सल पोस्ट (5 स्लाइड्स):* तैयार है\n` +
        `🎬 *1 कम्बाइंड 12s रील (Ultra HD):* तैयार है\n\n` +
        `🚀 *अगला कदम:* डैशबोर्ड से 1-क्लिक में शेड्यूल करें (1-1.5 घंटे का एंटी-स्पैम गैप)।`;

      if (batch.carousel?.previewPath && fs.existsSync(batch.carousel.previewPath)) {
        await this.sendPhoto(token, chatId, batch.carousel.previewPath, { caption: message, parse_mode: 'Markdown' });
      } else {
        await this.sendMessage(token, chatId, message, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('[TelegramNotifier notifyBatchCreated]:', err.message);
    }
  }

  /**
   * 2. Send Schedule Timetable Alert
   */
  async notifyBatchScheduled(destination, batch, scheduledItems) {
    try {
      const token = this.getTokenForDestination(destination);
      const chatId = this.getChatIdForDestination(destination);
      if (!token || !chatId) return;

      let msg = `📅 *[शेड्यूलिंग टाइमटेबल]* ${destination.name}\n\n` +
        `बैच: *${batch.title}*\n` +
        `कुल आइटम्स: *${scheduledItems.length}*\n` +
        `एंटी-स्पैम डिले: *1 से 1.5 घंटे रैंडम अंतराल*\n\n` +
        `*आगामी पोस्ट्स की टाइमिंग:*\n`;

      scheduledItems.forEach((item, i) => {
        const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const date = new Date(item.scheduledTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const typeName = item.itemType === 'reel' ? '🎬 12s रील' : item.itemType === 'carousel' ? '📑 कर्सल' : `📸 पोस्ट #${item.index}`;
        const channels = (item.targets || []).join(', ');
        msg += `${i + 1}. ${typeName} ➔ *${time}* (${date})\n   🎯 चैनल्स: ${channels}\n`;
      });

      msg += `\n🛡️ *हर पोस्ट पब्लिश होते ही आपको यहाँ लाइव रिपोर्ट मिलेगी।*`;

      await this.sendMessage(token, chatId, msg, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[TelegramNotifier notifyBatchScheduled]:', err.message);
    }
  }

  /**
   * 3. Send Post / Reel Published Alert
   */
  async notifyItemPublished(destination, item, results) {
    try {
      const token = this.getTokenForDestination(destination);
      const chatId = this.getChatIdForDestination(destination);
      if (!token || !chatId) return;

      const typeLabel = item.itemType === 'reel' ? '🎬 12-सेकंड अल्ट्रा HD रील' : item.itemType === 'carousel' ? '📑 5-स्लाइड कर्सल' : `📸 पोस्ट #${item.index} (4:5)`;

      let platformList = '';
      results.forEach(r => {
        const icon = r.status === 'published' ? '✅' : r.status === 'skipped' ? '⚪' : '❌';
        platformList += `  ${icon} *${r.platform.toUpperCase()}:* ${r.status.toUpperCase()} ${r.details?.simulated ? '(Simulation Ready)' : ''}\n`;
      });

      const msg = `🎉 *[पब्लिशिंग रिपोर्ट]* ${destination?.name || 'Lexa Trip'}\n\n` +
        `📌 *कंटेंट:* ${typeLabel}\n` +
        `📝 *टाइटल:* ${item.title}\n` +
        `🕒 *समय:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n\n` +
        `*सोशल मीडिया स्टेटस:*\n${platformList}\n` +
        `💬 *कैप्शन:* ${item.caption.slice(0, 140)}...`;

      // If item has image/video file, send preview with caption
      if (item.mediaPath && fs.existsSync(item.mediaPath)) {
        if (item.itemType === 'reel') {
          await this.sendVideo(token, chatId, item.mediaPath, { caption: msg.slice(0, 1024), parse_mode: 'Markdown' });
        } else {
          await this.sendPhoto(token, chatId, item.mediaPath, { caption: msg.slice(0, 1024), parse_mode: 'Markdown' });
        }
      } else {
        await this.sendMessage(token, chatId, msg, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('[TelegramNotifier notifyItemPublished]:', err.message);
    }
  }

  /**
   * 4. Send Error Alert
   */
  async notifyError(destination, item, errorText) {
    try {
      const token = this.getTokenForDestination(destination);
      const chatId = this.getChatIdForDestination(destination);
      if (!token || !chatId) return;

      const msg = `⚠️ *[त्रुटि अलर्ट / Publishing Error]* ${destination.name}\n\n` +
        `कंटेंट: *${item.title}*\n` +
        `कारण: \`${errorText}\`\n\n` +
        `कृपया डैशबोर्ड में जाकर टोकन या नेटवर्क चेक करें।`;

      await this.sendMessage(token, chatId, msg, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[TelegramNotifier notifyError]:', err.message);
    }
  }
}

module.exports = new TelegramNotifier();
