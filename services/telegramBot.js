const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const db = require('../database/db');
const imageProcessor = require('./imageProcessor');
const videoEngine = require('./videoEngine');
const seoGenerator = require('./seoGenerator');
const scheduler = require('./scheduler');

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.userSessions = new Map(); // chatId -> { images: [], timer: null }
    this.inbox = new Map(); // destinationId -> Array<{ path, url, timestamp }>
  }

  start() {
    const settings = db.getSettings();
    const token = settings.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.log('🤖 Telegram Bot not configured in Settings. (Can also be set per destination)');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      this.setupHandlers();
      console.log('🤖 Telegram Bot active and listening for mobile photo uploads!');
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

  setupHandlers() {
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcome = `🐪 *Welcome to Lexa Trip Automation Bot!* ✨\n\n` +
        `Send me 5 travel photos directly from your phone to automatically create:\n` +
        `• 5 Single Posts (4:5 Ratio) with Full SEO\n` +
        `• 1 Combined 5-Slide Carousel\n` +
        `• 5 Individual Ultra HD Reels\n` +
        `• 1 Combined 12s Cinematic Reel\n` +
        `• Anti-Spam Queue Scheduling (1 to 1.5h gap)\n\n` +
        `*Commands:*\n` +
        `• /status - View active queue & schedule\n` +
        `• /schedule - Auto-schedule latest batch\n` +
        `• /help - Instructions`;
      this.bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/status/, (msg) => {
      const queue = db.getQueue();
      const pending = queue.filter(q => q.status === 'queued');
      let reply = `📊 *Lexa Trip Active Queue Status:*\n\n` +
        `Total Pending Items: *${pending.length}*\n`;

      if (pending.length > 0) {
        reply += `\n*Upcoming Dispatches:*\n`;
        pending.slice(0, 5).forEach((item, i) => {
          const time = new Date(item.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          reply += `${i + 1}. [${item.itemType.toUpperCase()}] ${item.title.slice(0, 30)}...\n   ⏰ ${time}\n`;
        });
      } else {
        reply += `Queue is empty. Send 5 photos or upload on web dashboard!`;
      }
      this.bot.sendMessage(msg.chat.id, reply, { parse_mode: 'Markdown' });
    });

    this.bot.on('photo', async (msg) => {
      const chatId = msg.chat.id;
      const photoArray = msg.photo;
      const bestPhoto = photoArray[photoArray.length - 1];

      // Assign to first destination by default (e.g. dest_jaisalmer)
      const destinations = db.getDestinations();
      const dest = destinations[0] || { id: 'dest_jaisalmer', name: 'Lexa Trip Jaisalmer' };
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

        // Add to destination inbox
        const inbox = this.getInbox(dest.id);
        inbox.push({
          path: localPath,
          url: `/uploads/telegram_inbox/${dest.id}/${filename}`,
          timestamp: new Date().toISOString()
        });

        this.bot.sendMessage(
          chatId,
          `📸 *Received Photo (${inbox.length}/5) for ${dest.name}!*\n` +
          `It is now ready in your web dashboard under "Import from Telegram".`
        );

        // If exactly 5 images reached, notify user they can 1-click schedule
        if (inbox.length >= 5) {
          this.bot.sendMessage(
            chatId,
            `🎉 *5 Photos Collected for ${dest.name}!* \n\n` +
            `Open your dashboard at http://localhost:3800 to review or reply /schedule to auto-post with anti-spam 1-1.5h intervals.`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (err) {
        console.error('Telegram photo download error:', err);
      }
    });
  }
}

module.exports = new TelegramBotService();
