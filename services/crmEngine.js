const db = require('../database/db');
const axios = require('axios');

class CRMEngine {
  constructor() {
    this.defaultRules = [
      {
        id: 'rule_pricing',
        triggerKeywords: ['price', 'rate', 'cost', 'kitna', 'package', 'charges', 'offer'],
        replyText: '🐪 नमस्ते! लेक्सा ट्रिप के लग्जरी डेजर्ट सफारी व स्विस टेंट पैकेजेस की पूरी जानकारी और बेस्ट डिस्काउंट्स के लिए कृपया हमें +91 98765 43210 पर कॉल/व्हाट्सएप करें या बायो में दिए लिंक से बुक करें! ✨',
        sendDm: true,
        dmText: 'हेलो! लेक्सा ट्रिप में आपकी रुचि के लिए धन्यवाद। हमारा स्पेशल रॉयल डेजर्ट पैकेज ₹1,999 से शुरू है (कैमल सफारी, जीप सफारी, डिनर व लोकनृत्य शामिल)। अधिक जानकारी के लिए सीधे संपर्क करें: +91 98765 43210'
      },
      {
        id: 'rule_booking',
        triggerKeywords: ['book', 'booking', 'reservation', 'available', 'dates', 'karna hai'],
        replyText: '✨ आपका स्वागत है! अपनी बुकिंग कन्फर्म करने के लिए हमारी वेबसाइट https://lexatrip.com पर जाएं या तुरंत कॉल करें: +91 98765 43210 🐪',
        sendDm: true,
        dmText: 'नमस्ते! आज ही अपनी लेक्सा ट्रिप बुकिंग पर स्पेशल 15% डिस्काउंट पाएं। क्या आप अपनी यात्रा की तारीख बता सकते हैं?'
      },
      {
        id: 'rule_general',
        triggerKeywords: ['info', 'details', 'location', 'kahan hai', 'jaisalmer', 'mount abu'],
        replyText: '🙏 धन्यवाद! लेक्सा ट्रिप आपको शाही राजस्थानी आतिथ्य और अविस्मरणीय अनुभव प्रदान करता है। पूरी जानकारी के लिए DM चेक करें या हमें +91 98765 43210 पर संपर्क करें।',
        sendDm: true,
        dmText: 'नमस्ते! लेक्सा ट्रिप से जुड़ने के लिए धन्यवाद। हमारी टीम जल्द ही आपसे संपर्क करेगी।'
      }
    ];
  }

  getCRMData() {
    const data = db.getRawData ? db.getRawData() : {};
    return {
      autoReplyEnabled: data.crmSettings?.autoReplyEnabled ?? true,
      autoDmEnabled: data.crmSettings?.autoDmEnabled ?? true,
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
      status: 'Auto-Replied',
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
