const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const db = require('../database/db');
const imageProcessor = require('./imageProcessor');
const videoEngine = require('./videoEngine');
const seoGenerator = require('./seoGenerator');
const scheduler = require('./scheduler');
const telegramNotifier = require('./telegramNotifier');

class TelegramBotService {
  constructor() {
    this.bot = null;
    // Map: key = destinationId || chatId -> { photos: [{ localPath, seo, rawCaption }], combinedSeo: null, batchDate: string }
    this.sessions = new Map();
    this.inbox = new Map(); // destinationId -> Array<{ path, url, timestamp }>
  }

  start() {
    const settings = db.getSettings();
    const token = settings.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.log('🤖 Telegram Bot token not configured yet. (Configure via Settings / Telegram Modal)');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      this.bot.on('polling_error', (err) => {
        // Quietly handle routine network/polling jitter
      });
      this.setupHandlers();
      console.log('🤖 Telegram Bot active: 5-Post + Combined SEO Pipeline Listening!');
    } catch (err) {
      console.error('Error starting Telegram Bot:', err.message);
    }
  }

  stop() {
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

    // 1. Match by saved channelId or chatId
    for (const d of destinations) {
      if (d.telegram?.channelId && String(d.telegram.channelId) === chatId) return d;
      if (d.telegram?.chatId && String(d.telegram.chatId) === chatId) return d;
    }

    // 2. Smart Match by Destination Name or Slug (e.g. "Jaisalmer", "Mount Abu", "Udaipur")
    for (const d of destinations) {
      const slug = (d.slug || '').toLowerCase();
      const name = (d.name || '').toLowerCase();
      const city = name.replace(/lexa\s*trip/i, '').trim();
      if (city && (chatTitle.includes(city) || chatUsername.includes(city))) {
        // Auto-bind channel ID to this destination for future
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

    // 3. Fallback to session destination or default
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

    // Extract hashtags
    const hashRegex = /#[\w\u0900-\u097F_]+/g;
    const foundHashes = caption.match(hashRegex) || [];
    hashtags = foundHashes;

    // Check if first line contains title
    if (lines.length > 0) {
      const firstLine = lines[0].replace(/^(शीर्षक|टाइटल|title)\s*[:：\-]\s*/i, '').trim();
      if (firstLine.length > 3 && firstLine.length < 120) {
        title = firstLine;
      }
    }

    return {
      title,
      caption: lines.join('\n'),
      hashtags
    };
  }

  setupHandlers() {
    // 1. Welcome / Help Command
    this.bot.onText(/\/start|\/help/, (msg) => {
      const chatId = msg.chat.id;
      const welcome = `🐪 *Lexa Trip Multi-Destination Telegram Engine* ✨\n\n` +
        `अब आप अपने फ़ोन से सीधे 5 फोटोज़ + SEO भेजकर 24/7 ऑटोमेशन चला सकते हैं:\n\n` +
        `*डेली वर्कफ़्लो (Fixed Process):*\n` +
        `1️⃣ *फोटो 1* भेजें + साथ में उसका SEO (कैप्शन/हैशटैग)\n` +
        `2️⃣ *फोटो 2* भेजें + उसका SEO\n` +
        `3️⃣ *फोटो 3* भेजें + उसका SEO\n` +
        `4️⃣ *फोटो 4* भेजें + उसका SEO\n` +
        `5️⃣ *फोटो 5* भेजें + उसका SEO\n` +
        `6️⃣ एक टेक्स्ट मैसेज भेजें जिसकी शुरुआत में *कंबाइंड SEO* लिखा हो।\n\n` +
        `⚡ *सिस्टम अपने-आप:*\n` +
        `• 5 ब्रांडेड पोस्ट्स (4:5 Ratio)\n` +
        `• 1 कर्सल पोस्ट (5 स्लाइड्स) कंबाइंड SEO के साथ\n` +
        `• 5 इंडिविजुअल अल्ट्रा HD रील्स\n` +
        `• 1 कंबाइंड 12-सेकंड अल्ट्रा HD रील\n` +
        `• 1 से 1.5 घंटे के एंटी-स्पैम टाइमिंग में सभी सोशल मीडिया पर ऑटो-शेड्यूल कर देगा!\n\n` +
        `*कमांड्स:*\n` +
        `• /status - एक्टिव बैच व क्यू देखें\n` +
        `• /reset - आज का अनसेव्ड इनबॉक्स रीसेट करें\n` +
        `• /destinations - सभी डेस्टिनेशन्स की लिस्ट देखें\n` +
        `• /switch <id> - डेस्टिनेशन बदलें (जैसे /switch dest_jaisalmer)`;

      this.bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });
    });

    // 2. View Status
    this.bot.onText(/\/status/, (msg) => {
      const session = this.getSession(msg.chat.id);
      const queue = db.getQueue();
      const pending = queue.filter(q => q.status === 'queued');

      let reply = `📊 *Lexa Trip Bot Status:*\n\n` +
        `📍 *सक्रिय डेस्टिनेशन:* ${session.destinationId}\n` +
        `📸 *इनबॉक्स फोटोज़:* ${session.photos.length}/5 प्राप्त\n` +
        `📑 *कंबाइंड SEO:* ${session.combinedSeo ? '✅ प्राप्त' : '⏳ प्रतीक्षारत'}\n` +
        `⏳ *क्यू में शेड्यूल पोस्ट्स:* ${pending.length}\n`;

      if (pending.length > 0) {
        reply += `\n*आगामी पोस्ट्स:*\n`;
        pending.slice(0, 5).forEach((item, i) => {
          const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          reply += `${i + 1}. [${item.itemType.toUpperCase()}] ${item.title.slice(0, 30)}...\n   ⏰ ${time}\n`;
        });
      }

      this.bot.sendMessage(msg.chat.id, reply, { parse_mode: 'Markdown' });
    });

    // 3. Reset command
    this.bot.onText(/\/reset/, (msg) => {
      this.resetSession(msg.chat.id);
      this.bot.sendMessage(msg.chat.id, '🔄 आपका फ़ोटो व SEO बफ़र रीसेट कर दिया गया है। नई 5 फोटोज़ भेजना शुरू करें।');
    });

    // 4. Switch Destination
    this.bot.onText(/\/switch\s+(.+)/, (msg, match) => {
      const destId = match[1].trim();
      const dest = db.getDestination(destId);
      if (!dest) {
        return this.bot.sendMessage(msg.chat.id, `❌ डेस्टिनेशन '${destId}' नहीं मिला। /destinations टाइप करके मान्य ID देखें।`);
      }
      const session = this.getSession(msg.chat.id);
      session.destinationId = dest.id;
      this.bot.sendMessage(msg.chat.id, `✅ सक्रिय डेस्टिनेशन अब बदल दिया गया है: *${dest.name}*`, { parse_mode: 'Markdown' });
    });

    // 5. Destination List
    this.bot.onText(/\/destinations/, (msg) => {
      const destinations = db.getDestinations();
      let reply = `📍 *उपलब्ध डेस्टिनेशन्स:*\n\n`;
      destinations.forEach((d, i) => {
        reply += `${i + 1}. *${d.name}* (ID: \`${d.id}\`)\n   टैगलाइन: ${d.tagline}\n\n`;
      });
      reply += `स्विच करने के लिए टाइप करें: \`/switch <id>\``;
      this.bot.sendMessage(msg.chat.id, reply, { parse_mode: 'Markdown' });
    });

    // 6. Incoming Photo Handler (Single Post with SEO Caption)
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

        // Parse Caption if provided
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
            `अब कृपया अंतिम टेक्स्ट मैसेज भेजें जिसकी शुरुआत में *कंबाइंड SEO* लिखा हो (जैसे: \`कंबाइंड SEO: लेक्सा ट्रिप जैसलमेर 5 बेस्ट हाइलाइट्स...\`)।\n` +
            `इसके बाद ऑटोमैटिक शेड्यूलिंग शुरू हो जाएगी!`;
        }

        await this.bot.sendMessage(chatId, responseMsg, { parse_mode: 'Markdown' });

        // If 5 photos + combined SEO already present, trigger batch!
        if (session.photos.length >= 5 && session.combinedSeo) {
          await this.triggerFullPipeline(chatId, session, dest);
        }
      } catch (err) {
        console.error('Telegram photo download error:', err);
        this.bot.sendMessage(chatId, `⚠️ फ़ोटो डाउनलोड में त्रुटि: ${err.message}`);
      }
    };

    // 7. Incoming Text Handler (Detect "कंबाइंड SEO")
    const handleTextMessage = async (msg) => {
      const text = (msg.text || '').trim();
      if (!text || text.startsWith('/')) return;

      const chatId = msg.chat.id;
      const dest = this.resolveDestination(msg);
      const session = this.getSession(chatId, dest);

      // Check if this is the Combined SEO message
      const isCombinedSeo = /^(कंबाइंड\s*SEO|combined\s*seo|combinedseo)/i.test(text);

      if (isCombinedSeo) {
        const cleanedText = text.replace(/^(कंबाइंड\s*SEO|combined\s*seo)\s*[:：\-]\s*/i, '').trim();
        const parsedCombinedSeo = this.parseCaptionToSeo(cleanedText, `5 Highlights of ${dest.name} [Carousel & Reel]`);

        session.combinedSeo = parsedCombinedSeo;

        if (session.photos.length < 5) {
          const remaining = 5 - session.photos.length;
          return this.bot.sendMessage(
            chatId,
            `📑 *कंबाइंड SEO सेव हो गया!*\n` +
            `टाइटल: *${parsedCombinedSeo.title}*\n\n` +
            `⚠️ अभी केवल *${session.photos.length}/5 फ़ोटोज़* मिली हैं। कृपया बाकी *${remaining} फ़ोटो* भेजें ताकि ऑटोमेशन तुरंत चालू हो सके।`,
            { parse_mode: 'Markdown' }
          );
        }

        // We have 5 photos AND combined SEO! Trigger full pipeline!
        await this.triggerFullPipeline(chatId, session, dest);
      }
    };

    this.bot.on('photo', handlePhotoMessage);
    this.bot.on('text', handleTextMessage);

    // Also support Telegram Channels where the bot is added as Administrator!
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
      this.bot.sendMessage(
        chatId,
        `🚀 *[ऑटोमेशन शुरू]* 5 फोटोज़ और कंबाइंड SEO मिल चुके हैं!\n` +
        `⏳ 4:5 इमेजेस, कर्सल, 5 रील्स और 12s अल्ट्रा HD रील बनाई जा रही है... कृपया 1 मिनट इंतज़ार करें।`,
        { parse_mode: 'Markdown' }
      );

      const batchId = 'batch_' + Date.now();
      const batchDir = path.join(__dirname, '..', 'generated', batchId);
      fs.mkdirSync(batchDir, { recursive: true });

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

        await videoEngine.generateSingleReel({
          imagePath: processedPosts[i].diskPath,
          outputPath: reelDiskPath,
          duration: 11.5,
          brandText: dest.name.split('(')[0].trim().toUpperCase(),
          tagline: `✦ ${dest.tagline.slice(0, 35)} ✦`
        });

        generatedSingleReels.push({
          index: i + 1,
          reelPath: `/generated/${batchId}/${reelFilename}`,
          reelDiskPath: reelDiskPath,
          duration: 11.5,
          seo: processedPosts[i].seo,
          targetChannels: dest.defaultChannels?.reel || ['instagram', 'facebook', 'youtube', 'pinterest']
        });
      }

      // 4. Render 1 Combined 12s Reel
      const combinedReelFilename = `combined_12s_reel.mp4`;
      const combinedReelDiskPath = path.join(batchDir, combinedReelFilename);

      await videoEngine.generateCombined12sReel({
        imagePaths: processedPosts.map(p => p.diskPath),
        outputPath: combinedReelDiskPath,
        durations: [2, 2, 2, 2, 4],
        brandText: dest.name.split('(')[0].trim().toUpperCase(),
        tagline: `✦ ${dest.tagline.slice(0, 35)} ✦`,
        style: 'contain_blur'
      });

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
        combined12sReel: {
          title: `12s Cinematic Highlight: ${dest.name}`,
          duration: 12.0,
          videoPath: `/generated/${batchId}/${combinedReelFilename}`,
          diskPath: combinedReelDiskPath,
          seo: session.combinedSeo,
          targetChannels: dest.defaultChannels?.reel || ['instagram', 'facebook', 'youtube']
        }
      };

      db.saveBatch(newBatch);

      // 6. Schedule across daylight queue
      const scheduledItems = scheduler.scheduleBatch(batchId);

      // 7. Reset session for next day
      this.resetSession(chatId);

      // 8. Send Telegram Report
      let timetableMsg = `🎉 *[सफलतापूर्वक शेड्यूल्ड!]* ${dest.name}\n\n` +
        `📁 *बैच ID:* \`${batchId}\`\n` +
        `📸 *5 पोस्ट्स + 📑 1 कर्सल + 🎬 12s रील* तैयार होकर एंटी-स्पैम टाइमिंग में शेड्यूल हो गई हैं।\n\n` +
        `📅 *आज का पोस्टिंग टाइमटेबल:*\n`;

      scheduledItems.forEach((item, idx) => {
        const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const typeLabel = item.itemType === 'reel' ? '🎬 12s रील' : item.itemType === 'carousel' ? '📑 5-स्लाइड कर्सल' : `📸 पोस्ट #${item.index}`;
        timetableMsg += `${idx + 1}. ${typeLabel} ➔ *${time}*\n`;
      });

      timetableMsg += `\n🛡️ *हर पोस्ट पब्लिश होते ही आपको यहाँ लाइव रिपोर्ट व प्रीव्यू मिल जाएगा।*\n` +
        `🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

      await this.bot.sendMessage(chatId, timetableMsg, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('triggerFullPipeline error:', err);
      this.bot.sendMessage(chatId, `⚠️ ऑटोमेशन प्रोसेस में त्रुटि: ${err.message}`);
    }
  }
}

module.exports = new TelegramBotService();
