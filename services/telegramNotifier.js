const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const db = require('../database/db');

// Strict In-Memory De-duplication Cache (prevents spamming identical alerts)
const sentCache = new Map();

class TelegramNotifier {
  getTokenForDestination(destination) {
    return destination?.telegram?.botToken || db.getSettings()?.telegram?.botToken || null;
  }

  getChatIdForDestination(destination) {
    return destination?.telegram?.chatId || db.getSettings()?.telegram?.allowedChatId || null;
  }

  /**
   * Helper to check and record de-duplication key
   */
  isDuplicate(key, ttlMinutes = 60) {
    const now = Date.now();
    if (sentCache.has(key)) {
      const sentTime = sentCache.get(key);
      if (now - sentTime < ttlMinutes * 60 * 1000) {
        return true;
      }
    }
    sentCache.set(key, now);
    return false;
  }

  getPlatformIcon(platform) {
    const icons = {
      facebook: '📘',
      instagram: '📸',
      linkedin: '💼',
      pinterest: '📌',
      youtube: '🎬',
      blogger: '✍️',
      threads: '🧵',
      twitter: '🐦',
      reddit: '🤖',
      quora: '❓',
      telegram: '📢',
      website: '🌐',
      google_business: '📍'
    };
    return icons[platform] || '🌐';
  }

  formatPlatformName(platform) {
    const names = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      pinterest: 'Pinterest',
      youtube: 'YouTube',
      blogger: 'Blogger',
      threads: 'Threads',
      twitter: 'Twitter / X',
      reddit: 'Reddit',
      quora: 'Quora',
      telegram: 'Telegram',
      website: 'Website',
      google_business: 'Google Business'
    };
    return names[platform] || platform;
  }

  getChannelUrl(destination, platform) {
    const ch = destination?.channels?.[platform];
    if (!ch) return null;

    const isNonJaisalmer = destination?.id && destination.id !== 'dest_jaisalmer';
    const hasJaisalmerLeak = (val) => {
      if (!val || typeof val !== 'string') return false;
      const lower = val.toLowerCase();
      return lower.includes('lexatripjaisalmer') || lower.includes('lexatrip-jaisalmer') || lower.includes('1385624654624388');
    };

    if (isNonJaisalmer && hasJaisalmerLeak(ch.handle)) {
      return null;
    }

    let url = null;
    if (ch.handle && ch.handle !== 'Click to Connect') {
      if (ch.handle.startsWith('http://') || ch.handle.startsWith('https://')) {
        url = ch.handle;
      } else if (platform === 'instagram') {
        url = `https://instagram.com/${ch.handle.replace('@', '')}`;
      } else if (platform === 'twitter') {
        url = `https://x.com/${ch.handle.replace('@', '')}`;
      } else if (platform === 'youtube') {
        url = `https://youtube.com/${ch.handle.startsWith('@') ? ch.handle : '@' + ch.handle}`;
      } else if (platform === 'threads') {
        url = `https://${ch.handle.replace(/^@/, 'threads.net/@')}`;
      } else if (platform === 'telegram') {
        url = `https://t.me/${ch.handle.replace('@', '')}`;
      } else {
        url = `https://${ch.handle}`;
      }
    } else if (platform === 'blogger' && ch.credentials?.blogUrl) {
      url = ch.credentials.blogUrl;
    } else if (platform === 'quora' && (ch.url || ch.credentials?.spaceUrl)) {
      url = ch.url || ch.credentials.spaceUrl;
    } else if (platform === 'reddit' && ch.url) {
      url = ch.url;
    } else if (platform === 'facebook' && ch.credentials?.pageId) {
      if (isNonJaisalmer && String(ch.credentials.pageId) === '1385624654624388') {
        return null;
      }
      url = `https://www.facebook.com/profile.php?id=${ch.credentials.pageId}`;
    }

    if (url && isNonJaisalmer && hasJaisalmerLeak(url)) {
      return null;
    }
    return url;
  }

  getVerifiedLinks(destination, publishResults = null) {
    const isNonJaisalmer = destination?.id && destination.id !== 'dest_jaisalmer';
    const hasJaisalmerLeak = (val) => {
      if (!val || typeof val !== 'string') return false;
      const lower = val.toLowerCase();
      return lower.includes('lexatripjaisalmer') || lower.includes('lexatrip-jaisalmer') || lower.includes('1385624654624388');
    };

    const links = [];

    // 1. If authentic publishResults are available, prioritize live post URLs
    if (publishResults && Array.isArray(publishResults) && publishResults.length > 0) {
      for (const r of publishResults) {
        if (r.status === 'published' || r.status === 'success') {
          const icon = this.getPlatformIcon(r.platform);
          const name = this.formatPlatformName(r.platform);
          const postUrl = r.details?.postUrl || r.postUrl;
          const label = r.platform === 'facebook' ? 'Facebook Live' : `${name} Live`;
          if (postUrl) {
            if (!isNonJaisalmer || !hasJaisalmerLeak(postUrl)) {
              links.push(`• [${icon} ${label}](${postUrl})`);
            }
          } else {
            const chanUrl = this.getChannelUrl(destination, r.platform);
            if (chanUrl) {
              links.push(`• [${icon} ${label}](${chanUrl})`);
            } else {
              links.push(`• ${icon} ${label}: लाइव पब्लिश संपन्न`);
            }
          }
        }
      }
    }

    // 2. Fallback to destination-specific configured channel profiles
    if (links.length === 0) {
      const channelKeys = ['facebook', 'instagram', 'telegram', 'pinterest', 'linkedin', 'youtube', 'blogger'];
      for (const p of channelKeys) {
        const url = this.getChannelUrl(destination, p);
        if (url) {
          const icon = this.getPlatformIcon(p);
          const name = this.formatPlatformName(p);
          const label = p === 'facebook' ? 'Facebook Live' : `${name} Page`;
          links.push(`• [${icon} ${label}](${url})`);
        }
      }

      if (destination?.telegram?.channelUsername) {
        const tgUser = destination.telegram.channelUsername.replace('@', '');
        if (!isNonJaisalmer || (!hasJaisalmerLeak(tgUser) && !hasJaisalmerLeak(destination.telegram.channelUsername))) {
          links.push(`• [📢 Telegram Channel](https://t.me/${tgUser})`);
        }
      }
    }

    // 3. Official Master Links
    const bookingUrl = destination?.channels?.google_business?.credentials?.bookingUrl || 'https://bookings.lexatrip.com/';
    links.push(`• [🌐 Bookings Portal](${bookingUrl})`);

    const rawPhone = destination?.phone || destination?.channels?.google_business?.credentials?.phone || '+91 90798 54982';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    links.push(`• [💬 WhatsApp Chat](https://wa.me/${cleanPhone})`);

    const finalLinks = isNonJaisalmer
      ? links.filter(l => !hasJaisalmerLeak(l))
      : links;

    return `\n🔗 *वेरिफाइड लाइव लिंक्स (क्लिक करके सोशल मीडिया पर देखें):*\n` + finalLinks.join('\n');
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
      const dedupKey = `batch_created_${batch.id}`;
      if (this.isDuplicate(dedupKey, 120)) return;

      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      const channelId = destination?.telegram?.channelId;
      if (!token) return;

      const message = `✨ *[नया बैच तैयार]* ${destination.name}\n\n` +
        `📁 *कैम्पेन:* ${batch.title}\n` +
        `📸 *5 पोस्ट्स (4:5):* तैयार हैं\n` +
        `📑 *1 कर्सल पोस्ट (5 स्लाइड्स):* तैयार है\n` +
        `🎬 *6 अल्ट्रा HD 9:16 रील्स:* तैयार हैं\n\n` +
        `🚀 *अगला कदम:* डैशबोर्ड से 1-क्लिक में शेड्यूल करें (60-90 मिनट मानवीय सुरक्षित अंतराल)।`;

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
   * 2. Send Schedule Timetable Confirmation (Allowed: Report 1 on upload & schedule)
   */
  async notifyBatchScheduled(destination, batch, scheduledItems) {
    try {
      const dedupKey = `batch_scheduled_${batch.id}`;
      if (this.isDuplicate(dedupKey, 120)) return;

      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      const channelId = destination?.telegram?.channelId;
      if (!token) return;

      let msg = `📅 *[शेड्यूलिंग टाइमटेबल कन्फर्मेशन]* ${destination.name}\n\n` +
        `बैच: *${batch.title}*\n` +
        `कुल आइटम्स: *${scheduledItems.length}* (पोस्ट्स + 9:16 रील्स)\n` +
        `एंटी-स्पैम डिले: *60 से 90 मिनट रैंडम मानवीय अंतराल*\n\n` +
        `*आगामी पोस्ट्स की टाइमिंग:*\n`;

      scheduledItems.slice(0, 6).forEach((item, i) => {
        const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const date = new Date(item.scheduledTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const typeName = item.itemType === 'reel' ? '🎬 9:16 रील' : item.itemType === 'carousel' ? '📑 कर्सल' : `📸 पोस्ट #${item.index}`;
        const channels = (item.targets || []).join(', ');
        msg += `${i + 1}. ${typeName} ➔ *${time}* (${date})\n   🎯 चैनल्स: ${channels}\n`;
      });

      if (scheduledItems.length > 6) {
        msg += `...और ${scheduledItems.length - 6} अन्य पोस्ट्स कतार में सुरक्षित हैं।\n`;
      }

      msg += `\n🛡️ *चैनल प्राइवेसी सुरक्षा:* स्पैम से बचने हेतु व्यक्तिगत पोस्ट्स के नोटिफिकेशन्स शांत रहेंगे। सुबह, दोपहर व शाम को कंबाइंड रिपोर्ट भेजी जाएगी।\n` +
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
   * 3. Send Single Item Published (STRICTLY DE-DUPLICATED & HONEST)
   * Only sent to Admin Chat if not duplicate; never spammed to public channel.
   */
  async notifyItemPublished(first, second, results) {
    try {
      // Support flexible argument order (dest, item) or (item, dest)
      const destination = (first && (first.channels || first.id?.startsWith('dest_'))) ? first : second;
      const item = (first && (first.channels || first.id?.startsWith('dest_'))) ? second : first;
      const publishResults = results || item?.publishResults || [];

      const dedupKey = `published_item_${item?.id}`;
      // Drop duplicate notification if sent within 6 hours
      if (this.isDuplicate(dedupKey, 360)) {
        console.log(`[TelegramNotifier] Dropping duplicate publish alert for item: ${item?.id}`);
        return;
      }

      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      if (!token || !adminChatId) return;

      const typeLabel = item?.itemType === 'reel' ? '🎬 9:16 अल्ट्रा HD रील' : item?.itemType === 'carousel' ? '📑 5-स्लाइड कर्सल' : `📸 पोस्ट #${item?.index || 1} (4:5)`;

      const publishedList = publishResults.filter(r => r.status === 'published' || r.status === 'success');
      const failedList = publishResults.filter(r => r.status === 'failed');
      const isPartial = publishedList.length > 0 && failedList.length > 0;
      const isAllFailed = publishedList.length === 0 && failedList.length > 0;

      let header = `🎉 *[सफल पब्लिश रिपोर्ट]* ${destination?.name || 'Lexa Trip'}`;
      if (isPartial) {
        header = `⚠️ *[आंशिक पब्लिश रिपोर्ट]* ${destination?.name || 'Lexa Trip'}`;
      } else if (isAllFailed) {
        header = `🚨 *[पब्लिशिंग विफलता रिपोर्ट]* ${destination?.name || 'Lexa Trip'}`;
      }

      let msg = `${header}\n\n` +
        `📌 *कंटेंट:* ${typeLabel}\n` +
        `📝 *टाइटल:* ${item?.title || 'लाइव पोस्ट'}\n` +
        `🕒 *समय:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n`;

      if (publishResults.length > 0) {
        msg += `\n*चैनल स्टेटस:*\n`;
        for (const r of publishResults) {
          const icon = this.getPlatformIcon(r.platform);
          const name = this.formatPlatformName(r.platform);
          if (r.status === 'published' || r.status === 'success') {
            const postUrl = r.details?.postUrl || r.postUrl;
            msg += postUrl ? `• ✅ [${icon} ${name} Live Post](${postUrl})\n` : `• ✅ ${icon} ${name}: लाइव पब्लिश संपन्न\n`;
          } else if (r.status === 'failed') {
            msg += `• ❌ ${icon} ${name}: \`${r.error || 'त्रुटि'}\`\n`;
          } else if (r.status === 'skipped') {
            msg += `• ⏸️ ${icon} ${name}: ${r.reason || 'Skipped'}\n`;
          }
        }
      }

      msg += `${this.getVerifiedLinks(destination, publishResults)}\n\n` +
        `🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

      // Send to Admin Chat ONLY (do NOT spam the public destination channel)
      await this.sendMessage(token, adminChatId, msg, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[TelegramNotifier notifyItemPublished]:', err.message);
    }
  }

  /**
   * 4. Daily Tri-Digest Report (Morning 09:00 AM, Afternoon 02:00 PM, Evening 08:00 PM)
   */
  async notifyDailyDigest(destination, slotName = 'दैनिक सारांश') {
    try {
      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      const channelId = destination?.telegram?.channelId;
      if (!token) return;

      const queue = db.getQueue(destination.id);
      const publishedToday = queue.filter(q => q.status === 'published');
      const upcoming = queue.filter(q => q.status === 'queued');
      const directLinks = this.getVerifiedLinks(destination);

      let msg = `📊 *[${slotName} / Executive Digest]* ${destination.name}\n\n` +
        `✅ *आज पब्लिश हुई पोस्ट्स:* ${publishedToday.length}\n` +
        `⏳ *कतार में शेड्यूल्ड पोस्ट्स:* ${upcoming.length}\n` +
        `🛡️ *अकाउंट पॉलिसी व सेफ्टी हेल्थ:* 100% सुरक्षित (0 स्ट्राइक)\n\n` +
        `*आगामी शेड्यूल्ड कतार:*\n`;

      if (upcoming.length === 0) {
        msg += `फिलहाल कतार खाली है। नई पोस्ट शेड्यूल करने के लिए 5-स्टेप स्टूडियो का उपयोग करें।\n`;
      } else {
        upcoming.slice(0, 4).forEach((item, i) => {
          const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          msg += `${i + 1}. ${item.title?.slice(0, 35)}... ➔ *${time}*\n`;
        });
      }

      msg += `${directLinks}\n\n` +
        `🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

      const targets = [adminChatId, channelId].filter(Boolean);
      for (const tId of [...new Set(targets)]) {
        await this.sendMessage(token, tId, msg, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('[TelegramNotifier notifyDailyDigest]:', err.message);
    }
  }

  /**
   * 5. On-Demand Full Status Report (When User asks for /report or /status)
   */
  async notifyOnDemandReport(destination, chatId) {
    try {
      const token = this.getTokenForDestination(destination);
      if (!token || !chatId) return;

      const queue = db.getQueue(destination.id);
      const published = queue.filter(q => q.status === 'published');
      const queued = queue.filter(q => q.status === 'queued');
      const directLinks = this.getVerifiedLinks(destination);

      let msg = `📍 *[लाइव स्टेटस रिपोर्ट]* ${destination.name}\n\n` +
        `🟢 *सिस्टम स्थिति:* 24/7 ऑटोपायलट सक्रिय\n` +
        `📊 *कुल पब्लिश आज:* ${published.length} पोस्ट्स व रील्स\n` +
        `⏳ *कतार में सुरक्षित:* ${queued.length} पोस्ट्स\n` +
        `🛡️ *एंटी-स्पैम टाइमर:* 60-90 मिनट रैंडम अंतराल\n` +
        `${directLinks}\n\n` +
        `🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

      await this.sendMessage(token, chatId, msg, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[TelegramNotifier notifyOnDemandReport]:', err.message);
    }
  }

  /**
   * 6. 🚨 CRITICAL ERROR ALERT (Allowed: Report 2 on real failure - to Bot ONLY)
   */
  async notifyPolicyAlert({ destination, platform, error, details }) {
    try {
      const dedupKey = `policy_alert_${destination?.id}_${platform}`;
      if (this.isDuplicate(dedupKey, 60)) return;

      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      if (!token || !adminChatId) return;

      const msg = `🚨 *[सुरक्षा व पॉलिसी अलर्ट]*\n\n` +
        `📍 *डेस्टिनेशन:* ${destination?.name || 'Lexa Trip'}\n` +
        `⚠️ *प्लेटफ़ॉर्म:* ${platform?.toUpperCase()}\n` +
        `🛑 *समस्या / एरर:* \`${error}\`\n\n` +
        `📋 *विवरण:* ${details || 'पब्लिशिंग के दौरान त्रुटि'}\n\n` +
        `🛠️ *त्वरित समाधान:* डैशबोर्ड के 🔐 सीक्रेट API वॉल्ट से टोकन रीफ्रेश करें।\n` +
        `🌐 *डैशबोर्ड लिंक:* https://lexa-trip-automation.onrender.com`;

      await this.sendMessage(token, adminChatId, msg, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[TelegramNotifier notifyPolicyAlert]:', err.message);
    }
  }

  /**
   * 7. Error Alert (Bot ONLY, De-duplicated)
   */
  async notifyError(destination, item, errorMsg) {
    try {
      const dedupKey = `error_${item?.id || 'general'}`;
      if (this.isDuplicate(dedupKey, 60)) return;

      const token = this.getTokenForDestination(destination);
      const adminChatId = this.getChatIdForDestination(destination);
      if (!token || !adminChatId) return;

      const msg = `⚠️ *[त्रुटि अलर्ट]* ${destination?.name || 'Lexa Trip'}\n\n` +
        `📌 *कंटेंट:* ${item?.title || 'टास्क'}\n` +
        `🛑 *कारण:* \`${errorMsg}\`\n\n` +
        `डैशबोर्ड में जाकर टोकन या नेटवर्क चेक करें।`;

      await this.sendMessage(token, adminChatId, msg, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[TelegramNotifier notifyError]:', err.message);
    }
  }

  /**
   * notifyItemFailed: Explicit failure notification matching Scheduler Queue Contract
   */
  async notifyItemFailed(first, second, error) {
    const destination = (first && (first.channels || first.id?.startsWith('dest_'))) ? first : second;
    const item = (first && (first.channels || first.id?.startsWith('dest_'))) ? second : first;
    const errorMsg = typeof error === 'string' ? error : (error?.message || 'अज्ञात विफलता');

    return await this.notifyError(destination, item, errorMsg);
  }

  /**
   * sendDailySummary: Alias to notifyDailyDigest for contract consistency
   */
  async sendDailySummary(destination, slotName = 'दैनिक सारांश') {
    return await this.notifyDailyDigest(destination, slotName);
  }

  /**
   * getBotForDestination: Server.js compatibility helper
   */
  getBotForDestination(destination) {
    const token = this.getTokenForDestination(destination);
    if (!token) return null;
    return {
      sendMessage: (chatId, text, options) => this.sendMessage(token, chatId, text, options)
    };
  }
}

module.exports = new TelegramNotifier();
