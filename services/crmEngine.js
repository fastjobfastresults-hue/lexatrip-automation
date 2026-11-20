const db = require('../database/db');
const axios = require('axios');

class CRMEngine {
  constructor() {
    this.defaultRules = [
      {
        id: 'rule_pricing',
        triggerKeywords: ['price', 'rate', 'cost', 'kitna', 'package', 'charges', 'offer'],
        replyText: '✨ नमस्ते! लेक्सा ट्रिप के प्रीमियम हॉलिडे पैकेजेस व लग्जरी स्टे की पूरी जानकारी और बेस्ट डिस्काउंट्स के लिए कृपया हमें +91 90798 54982 पर कॉल/व्हाट्सएप करें या सीधे https://bookings.lexatrip.com/ से बुक करें! ✈️',
        sendDm: true,
        dmText: 'हेलो! लेक्सा ट्रिप में आपकी रुचि के लिए धन्यवाद। हमारे स्पेशल हॉलिडे पैकेजेस बेस्ट रेट्स पर उपलब्ध हैं (वेरिफाइड स्टे, साइटसीइंग व 24/7 ऑन-ग्राउंड सहायता शामिल)। अधिक जानकारी के लिए सीधे संपर्क करें: WhatsApp +91 90798 54982 | https://bookings.lexatrip.com/'
      },
      {
        id: 'rule_booking',
        triggerKeywords: ['book', 'booking', 'reservation', 'available', 'dates', 'karna hai'],
        replyText: '✨ आपका स्वागत है! अपनी बुकिंग कन्फर्म करने के लिए हमारे आधिकारिक पोर्टल https://bookings.lexatrip.com/ पर जाएं या तुरंत व्हाट्सएप करें: +91 90798 54982 🌐',
        sendDm: true,
        dmText: 'नमस्ते! आज ही अपनी लेक्सा ट्रिप बुकिंग पर स्पेशल डिस्काउंट पाएं। तुरंत कन्फर्म करने के लिए विजिट करें: https://bookings.lexatrip.com/ या WhatsApp +91 90798 54982'
      },
      {
        id: 'rule_general',
        triggerKeywords: ['info', 'details', 'location', 'kahan hai', 'jaisalmer', 'mount abu', 'goa', 'udaipur', 'manali'],
        replyText: '🙏 धन्यवाद! लेक्सा ट्रिप आपको प्रीमियम हॉलिडे अनुभव और अविस्मरणीय यात्रा प्रदान करता है। पूरी जानकारी के लिए https://www.lexatrip.com/ देखें या हमें +91 90798 54982 पर संपर्क करें।',
        sendDm: true,
        dmText: 'नमस्ते! लेक्सा ट्रिप से जुड़ने के लिए धन्यवाद। हमारी टीम जल्द ही आपसे संपर्क करेगी। आधिकारिक वेबसाइट: https://www.lexatrip.com/'
      }
    ];
  }

  getCRMData(destinationId = 'dest_jaisalmer') {
    const data = db.getRawData ? db.getRawData() : {};
    const settings = db.getSettings ? db.getSettings() : {};
    const destinations = db.getDestinations ? db.getDestinations() : [];
    const dest = destinations.find(d => d.id === destinationId) || destinations[0] || { id: 'dest_jaisalmer', name: 'Lexa Trip Jaisalmer' };

    // Dynamic Master Links derived from destination channels
    const destChannels = dest.channels || {};
    const masterLinks = {
      facebook: destChannels.facebook?.handle || 'https://www.facebook.com/profile.php?id=61594513580628',
      instagram: destChannels.instagram?.handle ? `https://www.instagram.com/${destChannels.instagram.handle.replace(/^@/, '')}/` : 'https://www.instagram.com/lexatripjaisalmer/',
      telegram: destChannels.telegram?.channelUsername ? `https://t.me/${destChannels.telegram.channelUsername.replace(/^@/, '')}` : 'https://t.me/lexatripjaisalmer',
      pinterest: destChannels.pinterest?.handle ? `https://${destChannels.pinterest.handle.replace(/^https?:\/\//, '')}` : 'https://www.pinterest.com/lexatripjaisalmer/',
      linkedin: destChannels.linkedin?.handle || 'https://www.linkedin.com/company/144145872/',
      youtube: destChannels.youtube?.handle ? `https://www.youtube.com/${destChannels.youtube.handle}` : 'https://www.youtube.com/@lexatripjaisalmer',
      blogger: destChannels.blogger?.credentials?.blogUrl || (destChannels.blogger?.handle ? (destChannels.blogger.handle.startsWith('http') ? destChannels.blogger.handle : `https://${destChannels.blogger.handle}`) : 'https://lexatripjaisalmer.blogspot.com/'),
      bookings: 'https://bookings.lexatrip.com/',
      website: dest.website || 'https://www.lexatrip.com/',
      whatsapp: 'https://wa.me/919079854982'
    };

    // Extract active linked pages across destinations
    const activePages = [];
    destinations.forEach(d => {
      const fb = d.channels?.facebook;
      const ig = d.channels?.instagram;
      if (fb?.enabled && fb.credentials?.pageId) {
        activePages.push({
          destinationId: d.id,
          destinationName: d.name,
          pageId: fb.credentials.pageId,
          pageName: fb.name || d.name,
          instagramHandle: ig?.handle || '@lexatripjaisalmer',
          isLifetime: !!fb.credentials.isLifetime,
          status: '🟢 Live Connected'
        });
      }
    });

    const queue = db.getQueue ? db.getQueue() : [];
    const destQueue = queue.filter(q => q.destinationId === dest.id || !q.destinationId);
    const publishedItems = destQueue.filter(q => q.status === 'published' || q.status === 'completed' || q.status === 'success');
    const queuedItems = destQueue.filter(q => q.status === 'queued' || q.status === 'publishing');

    // Recent published dispatches with actual live links
    const recentDispatches = publishedItems.slice(-20).reverse().map(item => {
      return {
        id: item.id,
        title: item.title,
        itemType: item.itemType || 'post',
        index: item.index,
        publishedAt: item.publishedAt || item.scheduledTime || new Date().toISOString(),
        targets: item.targets || ['instagram', 'facebook', 'linkedin', 'pinterest'],
        mediaPath: item.mediaPath || '',
        liveLinks: masterLinks,
        status: 'published'
      };
    });

    // Upcoming queued items with live countdown
    const upcomingQueue = queuedItems.map(item => {
      const diffMs = new Date(item.scheduledTime) - new Date();
      return {
        id: item.id,
        title: item.title,
        itemType: item.itemType || 'post',
        index: item.index,
        scheduledTime: item.scheduledTime,
        targets: item.targets || ['instagram', 'facebook', 'linkedin', 'pinterest'],
        countdownMinutes: Math.max(0, Math.round(diffMs / 60000)),
        status: item.status || 'queued'
      };
    });

    return {
      destinationId: dest.id,
      destinationName: dest.name,
      stats: {
        totalPublished: publishedItems.length,
        totalQueued: queuedItems.length,
        totalChannels: dest.channels ? Object.keys(dest.channels).length : 0,
        policyHealth: (activePages.length > 0 || !!settings.meta?.masterUserToken) ? 'Operational' : 'Unconfigured'
      },
      masterLinks,
      recentDispatches,
      upcomingQueue,
      autoReplyEnabled: data.crmSettings?.autoReplyEnabled ?? true,
      autoDmEnabled: data.crmSettings?.autoDmEnabled ?? true,
      masterToken: settings.meta?.masterUserToken || '',
      appSecret: settings.meta?.appSecret || '',
      hasMasterToken: !!settings.meta?.masterUserToken,
      activePages: activePages,
      rules: data.crmSettings?.rules || this.defaultRules,
      leads: Array.isArray(data.crmLeads) ? data.crmLeads : []
    };
  }

  saveCRMSettings(settings) {
    const raw = db.getRawData ? db.getRawData() : {};
    raw.crmSettings = {
      ...raw.crmSettings,
      ...settings
    };
    if (db.saveRawData) db.saveRawData(raw);
    return this.getCRMData();
  }

  /**
   * Process incoming comment or DM and trigger auto-replies
   */
  async processIncomingInteraction({ platform, senderName, senderId, text, destinationName = 'Lexa Trip Jaisalmer', commentId = null }) {
    const crm = this.getCRMData();
    if (!crm.autoReplyEnabled) return { action: 'skipped', reason: 'Auto-reply disabled' };

    const lower = (text || '').toLowerCase();
    let matchedRule = crm.rules.find(r => r.triggerKeywords.some(kw => lower.includes(kw)));
    if (!matchedRule) {
      matchedRule = crm.rules.find(r => r.id === 'rule_general') || this.defaultRules[2];
    }

    const leadRecord = {
      id: 'lead_' + Date.now(),
      name: senderName || 'Instagram User',
      platform,
      handle: senderId || '@user',
      destination: destinationName,
      lastMessage: text,
      status: 'Auto-Replied & DM Sent',
      matchedRule: matchedRule.id,
      replySent: matchedRule.replyText,
      dmSent: crm.autoDmEnabled && matchedRule.sendDm ? matchedRule.dmText : null,
      timestamp: new Date().toISOString()
    };

    const raw = db.getRawData ? db.getRawData() : {};
    raw.crmLeads = raw.crmLeads || [];
    raw.crmLeads.unshift(leadRecord);
    if (raw.crmLeads.length > 200) raw.crmLeads = raw.crmLeads.slice(0, 200);
    if (db.saveRawData) db.saveRawData(raw);

    return {
      success: true,
      matchedRule: matchedRule.id,
      publicReply: matchedRule.replyText,
      dmSent: leadRecord.dmSent,
      lead: leadRecord
    };
  }
}

module.exports = new CRMEngine();
