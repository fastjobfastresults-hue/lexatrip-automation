const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const db = require('./database/db');
const imageProcessor = require('./services/imageProcessor');
const videoEngine = require('./services/videoEngine');
const seoGenerator = require('./services/seoGenerator');
const scheduler = require('./services/scheduler');
const folderWatcher = require('./services/folderWatcher');
const telegramBot = require('./services/telegramBot');
const telegramNotifier = require('./services/telegramNotifier');
const channelTester = require('./services/channelTester');
const tunnelService = require('./services/tunnelService');
const aiEngine = require('./services/aiEngine');
const crmEngine = require('./services/crmEngine');
const QAEngine = require('./services/qaEngine');
const qaEngine = new QAEngine();
const { deepHealthHandler } = require('./services/deepHealth');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check for Cloud Load Balancers & Render
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
app.get('/health/deep', deepHealthHandler);

// Cache-Control headers to prevent browser from caching stale files
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/generated', express.static(path.join(__dirname, 'generated')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === 1) c.send(msg);
  });
}
scheduler.setWsBroadcast(broadcast);

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Lexa Trip Destination Hub Connected' }));
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const d = path.join(__dirname, 'uploads');
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    cb(null, d);
  },
  filename: (req, file, cb) => {
    cb(null, `raw_${Date.now()}_${Math.round(Math.random() * 1e4)}${path.extname(file.originalname).toLowerCase()}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 40 * 1024 * 1024 } });

// Dashboard Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- AUTH & GOOGLE SSO ---
app.get('/api/auth/user', (req, res) => {
  res.json(db.getUser());
});

app.post('/api/auth/google', (req, res) => {
  const profile = {
    isLoggedIn: true,
    provider: 'google',
    name: req.body.name || 'Lexa Trip Administrator',
    email: req.body.email || 'admin@lexatrip.com',
    avatar: req.body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    connectedAt: new Date().toISOString()
  };
  db.setUser(profile);
  res.json({ success: true, user: profile });
});

app.post('/api/auth/logout', (req, res) => {
  const guest = {
    isLoggedIn: false,
    name: 'Lexa Trip Guest',
    email: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
  };
  db.setUser(guest);
  res.json({ success: true, user: guest });
});

// --- DESTINATIONS API ---
app.get('/api/destinations', (req, res) => {
  res.json(db.getDestinations());
});

app.get('/api/destinations/:id', (req, res) => {
  const dest = db.getDestination(req.params.id);
  if (!dest) return res.status(404).json({ error: 'Destination not found' });
  res.json(dest);
});

app.post('/api/destinations', (req, res) => {
  try {
    const slug = req.body.slug || 'destination';
    const newDest = {
      id: 'dest_' + slug,
      name: req.body.name || 'New Destination',
      slug: slug,
      state: req.body.state || 'Rajasthan',
      tagline: req.body.tagline || 'Experience unforgettable journeys',
      website: req.body.website || `https://lexatrip.com/${slug}`,
      phone: req.body.phone || '+91 98765 43210',
      proxy: req.body.proxy || '',
      telegram: req.body.telegram || { enabled: true, botToken: '', chatId: '' },
      defaultChannels: {
        post: ['instagram', 'facebook', 'linkedin', 'pinterest', 'blogger'],
        reel: ['instagram', 'facebook', 'youtube', 'pinterest'],
        carousel: ['instagram', 'facebook', 'linkedin']
      },
      channels: req.body.channels || {
        facebook: { enabled: true, name: `Facebook Page - ${req.body.name}`, handle: `facebook.com/lexatrip${slug}`, authType: 'api_token', credentials: {}, supports: ['post', 'carousel', 'reel'] },
        instagram: { enabled: true, name: `Instagram - ${req.body.name}`, handle: `@lexatrip${slug}`, authType: 'api_token', credentials: {}, supports: ['post', 'carousel', 'reel'] },
        linkedin: { enabled: true, name: `LinkedIn - ${req.body.name}`, handle: `linkedin.com/company/lexatrip${slug}`, authType: 'api_token', credentials: {}, supports: ['post', 'carousel'] },
        pinterest: { enabled: true, name: `Pinterest - ${req.body.name}`, handle: `pinterest.com/lexatrip${slug}`, authType: 'api_token', credentials: {}, supports: ['post', 'reel'] },
        youtube: { enabled: true, name: `YouTube - ${req.body.name}`, handle: `youtube.com/@lexatrip${slug}`, authType: 'api_token', credentials: {}, supports: ['reel'] },
        blogger: { enabled: true, name: `Blogger (.blogspot.com) - ${req.body.name}`, handle: `lexatrip${slug}.blogspot.com`, authType: 'api_token', credentials: { blogId: '', apiKey: '' }, supports: ['post'] },
        twitter: { enabled: false, isComingSoon: true, name: `X / Twitter (Future Ready)`, handle: `@lexatrip${slug}`, authType: 'api_token', credentials: { apiKey: '', apiSecret: '', bearerToken: '' }, supports: ['post', 'reel'] }
      },
      customChannels: []
    };
    db.saveDestination(newDest);
    res.json(newDest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/destinations/:id', (req, res) => {
  const dest = db.getDestination(req.params.id);
  if (!dest) return res.status(404).json({ error: 'Destination not found' });
  const updated = { ...dest, ...req.body, id: dest.id };
  db.saveDestination(updated);
  res.json(updated);
});

app.delete('/api/destinations/:id', (req, res) => {
  db.deleteDestination(req.params.id);
  res.json({ success: true });
});

// Update Destination Master Default Channels (Always Select)
app.put('/api/destinations/:id/default-channels', (req, res) => {
  const dest = db.getDestination(req.params.id);
  if (!dest) return res.status(404).json({ error: 'Destination not found' });
  dest.defaultChannels = {
    post: req.body.post || ['instagram', 'facebook', 'linkedin', 'pinterest'],
    reel: req.body.reel || ['instagram', 'facebook', 'youtube', 'pinterest'],
    carousel: req.body.carousel || ['instagram', 'facebook', 'linkedin']
  };
  db.saveDestination(dest);
  res.json({ success: true, defaultChannels: dest.defaultChannels });
});

// ⚡ 1-Click Smart Quick-Connect Channel
app.post('/api/destinations/:id/quick-connect/:platform', async (req, res) => {
  try {
    const { id, platform } = req.params;
    const dest = db.getDestination(id);
    if (!dest) return res.status(404).json({ error: 'Destination not found' });

    const slug = dest.slug || 'official';
    const credentials = {
      isSmartConnect: true,
      destinationSlug: slug,
      accessToken: `smart_${platform}_token_${Date.now()}`,
      pageAccessToken: `smart_${platform}_token_${Date.now()}`,
      apiKey: `smart_${platform}_key_${Date.now()}`,
      pageId: `page_${slug}_${Math.floor(Math.random() * 100000)}`,
      instagramAccountId: `ig_${slug}_${Math.floor(Math.random() * 100000)}`,
      boardId: `board_${slug}`,
      channelId: `UC_${slug}_official`,
      organizationUrn: `urn:li:organization:lexatrip${slug}`
    };

    const testRes = await channelTester.testChannel(platform, credentials);

    if (platform === 'telegram') {
      dest.telegram = {
        enabled: true,
        botToken: req.body.botToken || `smart_bot_${Date.now()}`,
        chatId: req.body.chatId || '987654321'
      };
    } else {
      dest.channels = dest.channels || {};
      dest.channels[platform] = {
        enabled: true,
        name: testRes.accountName,
        handle: testRes.handle,
        authType: 'smart_oauth',
        credentials,
        supports: dest.channels[platform]?.supports || ['post', 'reel', 'carousel']
      };
    }

    db.saveDestination(dest);
    res.json({ success: true, platform, result: testRes, destination: dest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real-Time Social Media Connection Verification Tester
app.post('/api/destinations/:id/test-channel/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const credentials = req.body;
    const testResult = await channelTester.testChannel(platform, credentials);
    res.json(testResult);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Auto-Detect Meta (Facebook Pages & Instagram Accounts)
app.post('/api/social/meta/detect-accounts', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'Meta Access Token is required.' });
    const result = await channelTester.detectMetaAccounts(accessToken);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Auto-Detect Pinterest User Profile & Destination Boards
app.post('/api/social/pinterest/detect-boards', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'Pinterest Access Token is required.' });
    const result = await channelTester.detectPinterestBoards(accessToken);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ♾️ Master Lifetime Token Exchange (Converts short-lived to Permanent Never-Expiring Page Tokens)
app.post('/api/social/meta/exchange-long-lived', async (req, res) => {
  try {
    const { userToken, appId, appSecret } = req.body;
    if (!userToken) return res.status(400).json({ error: 'userToken is required' });

    let finalUserToken = userToken;
    let isLongLived = false;

    // If appSecret provided, exchange for 60-day long-lived user token
    if (appId && appSecret) {
      try {
        const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${userToken}`;
        const exchangeRes = await axios.get(exchangeUrl);
        if (exchangeRes.data?.access_token) {
          finalUserToken = exchangeRes.data.access_token;
          isLongLived = true;
        }
      } catch (exErr) {
        console.warn('Long-lived token exchange warning:', exErr.response?.data || exErr.message);
      }
    }

    // Now query /me/accounts using this token - Page Tokens will be LIFETIME (Expires: Never)!
    const detected = await channelTester.detectMetaAccounts(finalUserToken);
    res.json({
      success: true,
      isPermanentLifetime: isLongLived,
      longLivedUserToken: finalUserToken,
      ...detected
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CRM & AUTO-REPLY / AUTO-DM ENDPOINTS ---
app.get('/api/crm', (req, res) => {
  const destId = req.query.destinationId || 'dest_jaisalmer';
  res.json(crmEngine.getCRMData(destId));
});

app.put('/api/crm/settings', (req, res) => {
  try {
    const updated = crmEngine.saveCRMSettings(req.body);
    res.json({ success: true, crm: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/simulate-interaction', async (req, res) => {
  try {
    const result = await crmEngine.processIncomingInteraction(req.body);
    broadcast({ type: 'CRM_NEW_LEAD', lead: result.lead });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 LIVE PUBLISHING RADAR & REAL-TIME TRACKING HUD API
app.get('/api/tracking/live-radar', (req, res) => {
  try {
    const destId = req.query.destinationId || 'dest_jaisalmer';
    const dest = db.getDestination(destId) || db.getDestinations()[0] || { id: 'dest_jaisalmer', name: 'Lexa Trip Jaisalmer' };
    const queue = db.getQueue();
    const batches = db.getBatches();

    const destQueue = queue.filter(q => q.destinationId === dest.id);
    const queuedItems = destQueue.filter(q => q.status === 'queued' || q.status === 'publishing');
    const publishedItems = destQueue.filter(q => q.status === 'published' || q.status === 'completed' || q.status === 'success');
    const failedItems = destQueue.filter(q => q.status === 'failed' || q.status === 'partial_or_failed');

    // Next scheduled item sorted by time
    const sortedQueued = [...queuedItems].sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
    const nextItem = sortedQueued[0] || null;

    let minutesUntilNext = null;
    if (nextItem && nextItem.scheduledTime) {
      const diffMs = new Date(nextItem.scheduledTime) - new Date();
      minutesUntilNext = Math.max(0, Math.round(diffMs / 60000));
    }

    // Dynamic Platform Breakdown reflecting destination channels
    const channelsConfig = dest.channels || {};
    const defaultChannels = ['instagram', 'facebook', 'linkedin', 'pinterest', 'blogger', 'youtube'];
    const channelBreakdown = {};

    defaultChannels.forEach(ch => {
      const conf = channelsConfig[ch] || {};
      const creds = conf.credentials || {};
      const isConfigured = !!(creds.accessToken || creds.pageAccessToken || creds.apiKey || creds.botToken) &&
        !String(creds.accessToken || creds.pageAccessToken || creds.apiKey || '').startsWith('smart_');

      let name = ch.charAt(0).toUpperCase() + ch.slice(1);
      if (ch === 'youtube') name = 'YouTube Shorts';

      let handle = conf.handle || (conf.name ? conf.name : `@${dest.slug || 'lexatrip'}`);
      if (ch === 'facebook' && creds.pageId) handle = `Page ${creds.pageId}`;
      if (ch === 'instagram' && creds.instagramAccountId) handle = `@${creds.instagramAccountId}`;

      channelBreakdown[ch] = {
        name,
        handle,
        configured: isConfigured,
        live: 0,
        queued: 0,
        failed: 0
      };
    });

    destQueue.forEach(item => {
      const results = item.publishResults || [];
      (item.targets || []).forEach(ch => {
        if (channelBreakdown[ch]) {
          const match = results.find(r => r.platform === ch);
          if (match) {
            if (match.status === 'published' || match.status === 'success') {
              channelBreakdown[ch].live++;
            } else if (match.status === 'failed') {
              channelBreakdown[ch].failed++;
            }
          } else {
            if (item.status === 'published' || item.status === 'completed' || item.status === 'success') {
              channelBreakdown[ch].live++;
            } else if (item.status === 'failed') {
              channelBreakdown[ch].failed++;
            } else if (item.status === 'queued' || item.status === 'publishing') {
              channelBreakdown[ch].queued++;
            }
          }
        }
      });
    });

    // Compute authentic Health Score & Metrics
    const totalAttempted = publishedItems.length + failedItems.length;
    let healthScore = 100;
    let healthSubtext = '🛡️ 0 कम्युनिटी स्ट्राइक';

    if (totalAttempted > 0) {
      healthScore = Math.round((publishedItems.length / totalAttempted) * 100);
      if (failedItems.length > 0) {
        healthSubtext = `⚠️ ${failedItems.length} टास्क विफल (${publishedItems.length}/${totalAttempted} सफल)`;
      } else {
        healthSubtext = `✅ 100% पब्लिशिंग विश्वसनीयता (${publishedItems.length} टास्क)`;
      }
    } else {
      const configuredCount = Object.values(channelBreakdown).filter(c => c.configured).length;
      if (configuredCount === 0) {
        healthScore = 50;
        healthSubtext = '⚠️ कोई चैनल क्रेडेंशियल कॉन्फ़िगर नहीं';
      } else {
        healthScore = 100;
        healthSubtext = `🟢 ${configuredCount}/6 चैनल्स लाइव रेडी`;
      }
    }

    res.json({
      success: true,
      destinationId: dest.id,
      destinationName: dest.name,
      totalToday: destQueue.length,
      queuedCount: queuedItems.length,
      publishedCount: publishedItems.length,
      failedCount: failedItems.length,
      healthScore,
      healthSubtext,
      systemHealth: `${healthScore}% Reliable (${failedItems.length} Failures)`,
      nextItem: nextItem ? {
        id: nextItem.id,
        itemType: nextItem.itemType,
        index: nextItem.index,
        title: nextItem.title,
        scheduledTime: nextItem.scheduledTime,
        minutesUntilNext,
        targets: nextItem.targets || []
      } : null,
      channelBreakdown,
      latestBatch: batches.filter(b => b.destinationId === dest.id).pop() || null,
      recentPublished: publishedItems.slice(-3)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✨ AI SEO Pack Auto-Parser (Separates Title, Caption, Hashtags from combined raw text)
app.post('/api/ai/parse-seo', async (req, res) => {
  try {
    const { rawText, destinationName } = req.body;
    if (!rawText) return res.status(400).json({ error: 'rawText is required.' });
    const posts = await aiEngine.parseRawSeoPack({ rawText, destinationName });
    res.json({ success: true, count: posts.length, posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⚙️ AI Engine Configuration (Get / Save Endpoint & Keys)
app.get('/api/ai/config', (req, res) => {
  res.json(aiEngine.getConfig());
});

app.post('/api/ai/config', (req, res) => {
  try {
    const updated = aiEngine.saveConfig(req.body);
    res.json({ success: true, config: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🤖 Reddit & Quora AI Community Q&A & Anti-Spam Drip Engine Endpoints
app.post('/api/qa/generate', async (req, res) => {
  try {
    const { question, destination, category, customNotes, platform } = req.body;
    const result = await qaEngine.generateAnswer({ question, destination, category, customNotes, platform });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/qa/queue', (req, res) => {
  try {
    const queue = qaEngine.getQueue();
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/qa/queue', (req, res) => {
  try {
    const item = qaEngine.addToQueue(req.body);
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/qa/queue/:id', (req, res) => {
  try {
    const updated = qaEngine.updateQueueItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/qa/queue/:id', (req, res) => {
  try {
    qaEngine.deleteQueueItem(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/qa/knowledge', (req, res) => {
  try {
    const destination = req.query.destination;
    const kb = qaEngine.getKnowledgeBase(destination);
    res.json({
      totalLearned: kb.length,
      knowledge: kb.slice(-20),
      masterLinks: qaEngine.masterLinks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Telegram Inbox Endpoint (Auto-fetched photos from mobile)
app.get('/api/destinations/:id/telegram-inbox', (req, res) => {
  const inbox = telegramBot.getInbox(req.params.id);
  res.json(inbox);
});

app.post('/api/destinations/:id/telegram-inbox/clear', (req, res) => {
  telegramBot.clearInbox(req.params.id);
  res.json({ success: true });
});

// Test Telegram Notification
app.post('/api/telegram/test-alert', async (req, res) => {
  try {
    const s = db.getSettings();
    const token = s.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = s.telegram?.allowedChatId || '8455865796';
    if (!token) return res.status(400).json({ error: 'Telegram Bot Token not configured.' });
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(token, { polling: false });
    await bot.sendMessage(chatId, `🔔 *[Lexa Trip Master Bot Ping]*\n\n✅ Master Telegram Bot (@${s.telegram?.botUsername || 'lexatrip_auto_bot'}) is LIVE and successfully connected!\n\nAll destinations are synchronized with this Master Channel. 🚀`, { parse_mode: 'Markdown' });
    res.json({ success: true, message: `Ping sent successfully to Telegram user ${chatId}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test Destination Telegram Notification
app.post('/api/destinations/:id/test-telegram', async (req, res) => {
  try {
    const dest = db.getDestination(req.params.id);
    if (!dest) return res.status(404).json({ error: 'Destination not found' });
    const bot = telegramNotifier.getBotForDestination(dest);
    const chatId = telegramNotifier.getChatIdForDestination(dest);
    if (!bot || !chatId) {
      return res.status(400).json({ error: 'Telegram Bot Token or Chat ID is not configured for this destination yet. Click on Telegram in the social channels bar to configure.' });
    }
    await bot.sendMessage(chatId, `🔔 *[सत्यापन अलर्ट / Test Alert]*\n\n*${dest.name}* का टेलीग्राम रिपोर्टर सफलतापूर्वक कनेक्ट हो चुका है! ✅\n\nअब जब भी कोई 5-पोस्ट सेट, कर्सल या रील शेड्यूल या पब्लिश होगी, आपको यहाँ तुरंत लाइव रिपोर्ट मिलेगी। 🚀`, { parse_mode: 'Markdown' });
    res.json({ success: true, message: `Test alert sent to Telegram for ${dest.name}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- STATS ---
app.get('/api/stats', (req, res) => {
  const destinationId = req.query.destinationId;
  const batches = db.getBatches(destinationId);
  const queue = db.getQueue(destinationId);
  const destinations = db.getDestinations();

  res.json({
    totalDestinations: destinations.length,
    totalBatches: batches.length,
    queuedCount: queue.filter(q => q.status === 'queued').length,
    publishedCount: queue.filter(q => q.status === 'published').length
  });
});

// --- BATCHES API ---
app.get('/api/batches', (req, res) => {
  const destinationId = req.query.destinationId;
  res.json(db.getBatches(destinationId));
});

app.get('/api/batches/:id', (req, res) => {
  const batch = db.getBatch(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  res.json(batch);
});

// Upload 5 images with individual SEOs
// Generates: 5 Posts (4:5) + 1 Carousel + 5 Individual Reels + 1 Combined 12s Reel
app.post('/api/batches/upload', upload.array('images', 5), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length < 5) {
      return res.status(400).json({ error: 'Please select exactly 5 images.' });
    }

    const destinationId = req.body.destinationId || 'dest_jaisalmer';
    const dest = db.getDestination(destinationId) || db.getDestinations()[0];
    const batchTitle = req.body.title || `${dest.name} - Campaign ${new Date().toLocaleDateString('en-IN')}`;
    const autoSchedule = req.body.autoSchedule === 'true' || req.query.autoSchedule === 'true';

    // Parse custom SEO inputs if provided
    let customSEOs = [];
    try {
      if (req.body.customSEOs) {
        customSEOs = JSON.parse(req.body.customSEOs);
      }
    } catch (e) {}

    // Master Default Channels
    const defaultPostChannels = dest.defaultChannels?.post || ['instagram', 'facebook', 'linkedin', 'pinterest'];
    const defaultReelChannels = dest.defaultChannels?.reel || ['instagram', 'facebook', 'youtube', 'pinterest'];
    const defaultCarouselChannels = dest.defaultChannels?.carousel || ['instagram', 'facebook', 'linkedin'];

    const batchId = 'batch_' + Date.now();
    const batchDir = path.join(__dirname, 'generated', batchId);
    fs.mkdirSync(batchDir, { recursive: true });

    broadcast({ type: 'BATCH_PROGRESS', stage: 'images', percent: 15, message: 'Standardizing 5 images to 4:5 ratio...' });

    // 1. Process 5 Images to 4:5 Portrait
    const processedPosts = [];
    for (let i = 0; i < 5; i++) {
      const outPath = path.join(batchDir, `post_${i + 1}_4x5.jpg`);
      await imageProcessor.processTo4x5(files[i].path, outPath);

      // Use user-provided SEO or smart generated SEO
      let postSEO;
      if (customSEOs[i] && customSEOs[i].title && customSEOs[i].caption) {
        postSEO = {
          postIndex: i + 1,
          topic: customSEOs[i].title,
          title: customSEOs[i].title,
          caption: customSEOs[i].caption,
          hashtags: customSEOs[i].hashtags ? (Array.isArray(customSEOs[i].hashtags) ? customSEOs[i].hashtags : customSEOs[i].hashtags.split(' ')) : []
        };
      } else {
        postSEO = seoGenerator.generatePostSEO(i + 1, dest.slug);
      }

      processedPosts.push({
        index: i + 1,
        imagePath: `/generated/${batchId}/post_${i + 1}_4x5.jpg`,
        diskPath: outPath,
        seo: postSEO,
        targetChannels: defaultPostChannels
      });
    }

    // 2. Build Combined Carousel
    broadcast({ type: 'BATCH_PROGRESS', stage: 'carousel', percent: 35, message: 'Assembling 5-Slide Carousel...' });
    const carouselCollage = path.join(batchDir, 'carousel_preview.jpg');
    await imageProcessor.generateCarouselCollage(processedPosts.map(p => p.diskPath), carouselCollage);
    const combinedCarouselSEO = seoGenerator.generateCombinedCarouselSEO(dest.slug);

    // 3. Render 5 Individual Ultra HD Reels (11.5s each)
    broadcast({ type: 'BATCH_PROGRESS', stage: 'reels', percent: 50, message: 'Rendering 5 Individual Ultra HD Reels...' });
    const generatedSingleReels = [];
    for (let i = 0; i < 5; i++) {
      const singleReelFilename = `reel_${i + 1}_1080x1920.mp4`;
      const singleReelDiskPath = path.join(batchDir, singleReelFilename);

      await videoEngine.generateSingleReel({
        imagePath: processedPosts[i].diskPath,
        outputPath: singleReelDiskPath,
        duration: 11.5,
        brandText: dest.name.split('(')[0].trim().toUpperCase(),
        tagline: `✦ ${dest.tagline.slice(0, 35)} ✦`
      });

      generatedSingleReels.push({
        index: i + 1,
        reelPath: `/generated/${batchId}/${singleReelFilename}`,
        reelDiskPath: singleReelDiskPath,
        duration: 11.5,
        seo: processedPosts[i].seo,
        targetChannels: defaultReelChannels
      });

      broadcast({ type: 'BATCH_PROGRESS', stage: 'reels', percent: 50 + Math.round((i + 1) * 6), message: `Rendered Reel ${i + 1} of 5` });
    }

    // 4. Render 1 Combined 12-Second Cinematic Reel
    broadcast({ type: 'BATCH_PROGRESS', stage: 'combined_reel', percent: 85, message: 'Rendering 12-Second Combined Cinematic Reel...' });
    const combinedReelFilename = `combined_12s_reel.mp4`;
    const combinedReelDiskPath = path.join(batchDir, combinedReelFilename);

    await videoEngine.generateCombined12sReel({
      imagePaths: processedPosts.map(p => p.diskPath),
      outputPath: combinedReelDiskPath,
      durations: [2, 2, 2, 2, 4], // Exactly 12 seconds
      brandText: dest.name.split('(')[0].trim().toUpperCase(),
      tagline: `✦ ${dest.tagline.slice(0, 35)} ✦`,
      style: 'contain_blur'
    });

    const combined12sSEO = seoGenerator.generateCombined12sReelSEO(dest.slug);

    // Save complete Batch
    const newBatch = {
      id: batchId,
      destinationId: dest.id,
      destinationName: dest.name,
      destinationSlug: dest.slug,
      title: batchTitle,
      status: 'ready',
      posts: processedPosts,
      carousel: {
        previewPath: `/generated/${batchId}/carousel_preview.jpg`,
        diskPath: carouselCollage,
        seo: combinedCarouselSEO,
        targetChannels: defaultCarouselChannels
      },
      singleReels: generatedSingleReels,
      combinedReel: {
        reelPath: `/generated/${batchId}/${combinedReelFilename}`,
        reelDiskPath: combinedReelDiskPath,
        duration: 12.0,
        resolution: '1080x1920',
        seo: combined12sSEO,
        targetChannels: defaultReelChannels
      },
      createdAt: new Date().toISOString()
    };

    db.saveBatch(newBatch);
    db.addLog({
      type: 'batch_created',
      batchId,
      destination: dest.name,
      message: `Batch "${batchTitle}" created with 5 Posts (4:5), 1 Carousel, 5 Individual Reels, and 1 Combined 12s Reel.`
    });

    broadcast({ type: 'BATCH_COMPLETED', batch: newBatch });

    // Send Telegram Notification
    telegramNotifier.notifyBatchCreated(dest, newBatch);

    // If autoSchedule is true, immediately schedule all into queue
    if (autoSchedule) {
      const scheduledItems = scheduler.scheduleBatch(newBatch.id);
      return res.json({ ...newBatch, autoScheduled: true, scheduledCount: scheduledItems.length });
    }

    res.json(newBatch);
  } catch (err) {
    console.error('Batch upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update batch
app.put('/api/batches/:id', (req, res) => {
  const batch = db.getBatch(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  const updated = { ...batch, ...req.body, id: batch.id };
  db.saveBatch(updated);
  res.json(updated);
});

// Schedule Batch with Anti-Spam Human Jitter
app.post('/api/batches/:id/schedule', (req, res) => {
  try {
    const { startTime } = req.body;
    const items = scheduler.scheduleBatch(req.params.id, startTime);
    res.json({ success: true, count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Batch
app.delete('/api/batches/:id', (req, res) => {
  db.deleteBatch(req.params.id);
  res.json({ success: true });
});

// --- QUEUE & TASK SCHEDULING API ---
app.get('/api/queue', (req, res) => {
  const destinationId = req.query.destinationId;
  res.json(db.getQueue(destinationId));
});

// Publish single queue item immediately to ALL connected channels
app.post('/api/queue/:id/publish-now', async (req, res) => {
  try {
    const updated = await scheduler.publishItemNow(req.params.id);
    res.json({
      success: true,
      message: 'Item dispatched to all selected channels!',
      item: updated,
      results: updated.publishResults || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish ALL queued items for a destination immediately
app.post('/api/queue/publish-all', async (req, res) => {
  try {
    const destinationId = req.body.destinationId || null;
    const items = await scheduler.publishAllQueueNow(destinationId);
    res.json({ success: true, message: `Dispatched all queued items!`, count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reschedule queue item
app.post('/api/queue/:id/reschedule', (req, res) => {
  const { newTime } = req.body;
  if (!newTime) return res.status(400).json({ error: 'newTime is required' });
  const updated = db.updateQueueItem(req.params.id, {
    scheduledTime: new Date(newTime).toISOString(),
    status: 'queued'
  });
  if (!updated) return res.status(404).json({ error: 'Queue item not found' });
  res.json({ success: true, item: updated });
});

app.delete('/api/queue/:id', (req, res) => {
  db.removeFromQueue(req.params.id);
  res.json({ success: true });
});

app.post('/api/queue/clear', (req, res) => {
  const destinationId = req.body.destinationId || null;
  db.clearQueue(destinationId);
  res.json({ success: true });
});

// --- SCHEDULER CONTROLS ---
let schedulerPaused = false;
app.get('/api/scheduler/status', (req, res) => {
  res.json({ active: !schedulerPaused });
});

app.post('/api/scheduler/toggle', (req, res) => {
  schedulerPaused = !schedulerPaused;
  if (schedulerPaused) {
    scheduler.stop();
  } else {
    scheduler.start();
  }
  res.json({ active: !schedulerPaused });
});

// --- SETTINGS ---
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  telegramBot.stop();
  telegramBot.start();
  res.json(updated);
});

// --- SECRET API VAULT CREDENTIALS ---
app.get('/api/credentials', (req, res) => {
  const settings = db.getSettings();
  const dest = db.getDestination ? db.getDestination('dest_jaisalmer') : null;
  res.json({
    metaToken: settings.meta?.masterUserToken || settings.meta?.lifetimePageToken || '',
    telegramToken: settings.telegram?.botToken || '',
    pinterestToken: settings.pinterest?.masterAccessToken || '',
    linkedinToken: settings.linkedin?.accessToken || '',
    bloggerToken: dest?.channels?.blogger?.credentials?.apiKey || settings.blogger?.apiKey || '',
    geminiKey: settings.aiConfig?.apiKey || ''
  });
});

// --- STORAGE MANAGER & GARBAGE COLLECTION ---
const storageManager = require('./services/storageManager');

app.get('/api/storage', (req, res) => {
  res.json(storageManager.getStorageReport());
});

app.post('/api/storage/cleanup', (req, res) => {
  const result = storageManager.cleanupPublishedMedia();
  res.json({ success: true, ...result });
});

app.put('/api/credentials', (req, res) => {
  const { metaToken, telegramToken, pinterestToken, linkedinToken, bloggerToken, geminiKey } = req.body;
  const settings = db.getSettings();
  if (metaToken) {
    if (!settings.meta) settings.meta = {};
    settings.meta.masterUserToken = metaToken;
    settings.meta.lifetimePageToken = metaToken;
  }
  if (telegramToken) {
    if (!settings.telegram) settings.telegram = {};
    settings.telegram.botToken = telegramToken;
  }
  if (pinterestToken) {
    if (!settings.pinterest) settings.pinterest = {};
    settings.pinterest.masterAccessToken = pinterestToken;
  }
  if (linkedinToken) {
    if (!settings.linkedin) settings.linkedin = {};
    settings.linkedin.accessToken = linkedinToken;
  }
  if (geminiKey) {
    if (!settings.aiConfig) settings.aiConfig = {};
    settings.aiConfig.apiKey = geminiKey;
  }
  db.updateSettings(settings);

  try {
    const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, 'database', 'data.json'), 'utf8'));
    const jaisalmer = rawData.destinations?.find(d => d.id === 'dest_jaisalmer');
    if (jaisalmer) {
      if (metaToken && jaisalmer.channels?.facebook?.credentials) {
        jaisalmer.channels.facebook.credentials.pageAccessToken = metaToken;
      }
      if (metaToken && jaisalmer.channels?.instagram?.credentials) {
        jaisalmer.channels.instagram.credentials.accessToken = metaToken;
      }
      if (pinterestToken && jaisalmer.channels?.pinterest?.credentials) {
        jaisalmer.channels.pinterest.credentials.accessToken = pinterestToken;
      }
      if (linkedinToken && jaisalmer.channels?.linkedin?.credentials) {
        jaisalmer.channels.linkedin.credentials.accessToken = linkedinToken;
      }
      if (bloggerToken && jaisalmer.channels?.blogger?.credentials) {
        jaisalmer.channels.blogger.credentials.apiKey = bloggerToken;
      }
      fs.writeFileSync(path.join(__dirname, 'database', 'data.json'), JSON.stringify(rawData, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Error syncing credentials to destinations:', err.message);
  }

  res.json({ success: true, message: 'Credentials updated successfully' });
});

// --- LOGS ---
app.get('/api/logs', (req, res) => {
  res.json(db.getLogs(parseInt(req.query.limit, 10) || 100));
});

// Process Level Resilience & Memory Protection for Cloud Hosting
process.on('uncaughtException', (err) => {
  console.error('[Process UncaughtException]:', err.message, err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process UnhandledRejection]:', reason);
});

// Periodic Memory Monitor (Safely keeps memory inside 512MB container limit)
setInterval(() => {
  const mem = process.memoryUsage();
  const rssMB = Math.round(mem.rss / 1024 / 1024);
  const heapMB = Math.round(mem.heapUsed / 1024 / 1024);
  if (rssMB > 350) {
    console.warn(`[MemoryGuard Alert]: RSS is high (${rssMB}MB, Heap: ${heapMB}MB). Triggering cleanup...`);
    if (global.gc) global.gc();
  }
}, 45000);

// Start Server & Background Services
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`================================================================`);
  console.log(`🌟 LEXA TRIP MULTI-DESTINATION AUTOMATION ENGINE RUNNING 🌟`);
  console.log(`📡 Localhost URL: http://localhost:${PORT}`);
  console.log(`================================================================`);
  scheduler.start();
  folderWatcher.start();
  telegramBot.start();

  try {
    const publicUrl = await tunnelService.start(PORT);
    if (publicUrl) {
      console.log(`🔗 Meta/Instagram Graph API Public Callback: ${publicUrl}`);
    }
  } catch (err) {
    console.error('Tunnel notice:', err.message);
  }
});
