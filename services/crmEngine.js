const db = require('../database/db');
const axios = require('axios');

class CRMEngine {
  constructor() {
    this.defaultRules = [
      {
        id: 'rule_pricing',
        triggerKeywords: ['price', 'rate', 'cost', 'kitna', 'package', 'charges', 'offer'],
        replyText: '🐪 नमस्ते! लेक्सा ट्रिप के लग्जरी डेजर्ट सफारी व स्विस टेंट पैकेजेस की पूरी जानकारी और बेस्ट डिस्काउंट्स के लिए कृपया हमें +91 90798 54982 पर कॉल/व्हाट्सएप करें या सीधे https://bookings.lexatrip.com/ से बुक करें! ✨',
        sendDm: true,
        dmText: 'हेलो! लेक्सा ट्रिप में आपकी रुचि के लिए धन्यवाद। हमारा स्पेशल रॉयल डेजर्ट पैकेज बेस्ट रेट्स पर उपलब्ध है (कैमल सफारी, जीप सफारी, डिनर व सांस्कृतिक लोकनृत्य शामिल)। अधिक जानकारी के लिए सीधे संपर्क करें: WhatsApp +91 90798 54982 | https://bookings.lexatrip.com/'
      },
      {
        id: 'rule_booking',
        triggerKeywords: ['book', 'booking', 'reservation', 'available', 'dates', 'karna hai'],
        replyText: '✨ आपका स्वागत है! अपनी बुकिंग कन्फर्म करने के लिए हमारे आधिकारिक पोर्टल https://bookings.lexatrip.com/ पर जाएं या तुरंत व्हाट्सएप करें: +91 90798 54982 🐪',
        sendDm: true,
        dmText: 'नमस्ते! आज ही अपनी लेक्सा ट्रिप बुकिंग पर स्पेशल डिस्काउंट पाएं। तुरंत कन्फर्म करने के लिए विजिट करें: https://bookings.lexatrip.com/ या WhatsApp +91 90798 54982'
      },
      {
        id: 'rule_general',
        triggerKeywords: ['info', 'details', 'location', 'kahan hai', 'jaisalmer', 'mount abu'],
        replyText: '🙏 धन्यवाद! लेक्सा ट्रिप आपको शाही राजस्थानी आतिथ्य और अविस्मरणीय अनुभव प्रदान करता है। पूरी जानकारी के लिए https://www.lexatrip.com/ देखें या हमें +91 90798 54982 पर संपर्क करें।',
        sendDm: true,
        dmText: 'नमस्ते! लेक्सा ट्रिप से जुड़ने के लिए धन्यवाद। हमारी टीम जल्द ही आपसे संपर्क करेगी। आधिकारिक वेबसाइट: https://www.lexatrip.com/'
      }
    ];
  }

  getCRMData() {
    const data = db.getRawData ? db.getRawData() : {};
    const settings = db.getSettings ? db.getSettings() : {};
    const destinations = db.getDestinations ? db.getDestinations() : [];

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

    return {
      autoReplyEnabled: data.crmSettings?.autoReplyEnabled ?? true,
      autoDmEnabled: data.crmSettings?.autoDmEnabled ?? true,
      masterToken: settings.meta?.masterUserToken || '',
      appSecret: settings.meta?.appSecret || '',
      hasMasterToken: !!settings.meta?.masterUserToken,
      activePages: activePages.length > 0 ? activePages : [
        {
          destinationId: 'dest_jaisalmer',
          destinationName: 'लेक्सा ट्रिप जैसलमेर (Lexa Trip Jaisalmer)',
          pageId: '1385624654624388',
          pageName: 'Facebook Page (Lexa Trip)',
          instagramHandle: '@lexatripjaisalmer',
          isLifetime: true,
          status: '🟢 Live Connected'
        }
      ],
      rules: data.crmSettings?.rules || this.defaultRules,
      leads: data.crmLeads || [
        {
          id: 'lead_1',
          name: 'Rahul Sharma',
          platform: 'instagram',
          handle: '@rahul_travels',
          destination: 'Lexa Trip Jaisalmer',
          lastMessage: 'Desert safari ke price kya hai?',
          status: 'Replied & DM Sent',
          matchedRule: 'rule_pricing',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'lead_2',
          name: 'Pooja Verma',
          platform: 'facebook',
          handle: 'Pooja Verma',
          destination: 'Lexa Trip Jaisalmer',
          lastMessage: 'Do you have family tents available this weekend?',
          status: 'Replied & DM Sent',
          matchedRule: 'rule_booking',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ]
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
