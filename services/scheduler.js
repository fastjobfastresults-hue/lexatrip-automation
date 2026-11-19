const db = require('../database/db');
const instagramPublisher = require('./publishers/instagram');
const facebookPublisher = require('./publishers/facebook');
const pinterestPublisher = require('./publishers/pinterest');
const linkedinPublisher = require('./publishers/linkedin');
const youtubePublisher = require('./publishers/youtube');
const bloggerPublisher = require('./publishers/blogger');
const threadsPublisher = require('./publishers/threads');
const googleBusinessPublisher = require('./publishers/googleBusiness');
const blogPublisher = require('./publishers/blog');
const customPublisher = require('./publishers/custom');
const telegramNotifier = require('./telegramNotifier');

class Scheduler {
  constructor() {
    this.timer = null;
    this.isProcessing = false;
    this.wsBroadcast = null;
  }

  setWsBroadcast(fn) {
    this.wsBroadcast = fn;
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.processQueue(), 20000);
    console.log('⚡ Multi-Destination Anti-Spam Scheduler active. Checking queue every 20s.');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  calculateNextScheduleTime(baseTime) {
    const settings = db.getSettings();
    const minMins = settings.minIntervalMinutes || 60;
    const maxMins = settings.maxIntervalMinutes || 90;
    const jitterMins = settings.jitterMinutes || 10;
    const startHour = settings.activeHoursStart !== undefined ? settings.activeHoursStart : 8;
    const endHour = settings.activeHoursEnd !== undefined ? settings.activeHoursEnd : 23;

    const randomBase = Math.floor(Math.random() * (maxMins - minMins + 1)) + minMins;
    const jitter = Math.floor(Math.random() * (jitterMins * 2 + 1)) - jitterMins;
    const totalMinutesToAdd = Math.max(30, randomBase + jitter);

    let next = new Date(baseTime.getTime() + totalMinutesToAdd * 60000);

    const hours = next.getHours();
    if (hours >= endHour || hours < startHour) {
      if (hours >= endHour) next.setDate(next.getDate() + 1);
      next.setHours(startHour, Math.floor(Math.random() * 25) + 5, 0, 0);
    }

    return next;
  }

  /**
   * Schedule Batch: 5 Posts + 1 Carousel + 5 Individual Reels + 1 Combined 12s Reel
   */
  scheduleBatch(batchId, customStartTime = null) {
    const batch = db.getBatch(batchId);
    if (!batch) throw new Error(`Batch not found: ${batchId}`);

    const destination = db.getDestination(batch.destinationId || 'dest_jaisalmer') || db.getDestinations()[0];
    let cursor = customStartTime ? new Date(customStartTime) : new Date(Date.now() + 60000);

    const scheduledItems = [];

    const queueItem = (itemType, index, title, caption, mediaPath, targets) => {
      const scheduledTime = new Date(cursor.getTime());
      const queueRecord = {
        id: `q_${batch.id}_${itemType}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        batchId: batch.id,
        destinationId: destination.id,
        destinationName: destination.name,
        itemType, // 'post', 'carousel', 'reel', 'single_reel'
        index,
        title,
        caption,
        mediaPath,
        scheduledTime: scheduledTime.toISOString(),
        status: 'queued',
        targets: targets || ['instagram', 'facebook', 'linkedin'],
        createdAt: new Date().toISOString()
      };

      db.addToQueue(queueRecord);
      scheduledItems.push(queueRecord);

      // Advance cursor with human jitter (1 to 1.5 hr)
      cursor = this.calculateNextScheduleTime(cursor);
    };

    // 1. Schedule 5 Individual Posts
    if (batch.posts && Array.isArray(batch.posts)) {
      batch.posts.forEach((p, idx) => {
        queueItem(
          'post',
          idx + 1,
          p.seo?.title || `Post ${idx + 1} - ${destination.name}`,
          p.seo?.caption || '',
          p.diskPath || p.imagePath,
          p.targetChannels || destination.defaultChannels?.post || ['instagram', 'facebook', 'linkedin', 'pinterest']
        );
      });
    }

    // 2. Schedule Combined Carousel
    if (batch.carousel) {
      queueItem(
        'carousel',
        0,
        batch.carousel.seo?.title || `5 Highlights of ${destination.name} [Carousel]`,
        batch.carousel.seo?.caption || '',
        batch.carousel.previewPath || (batch.posts ? batch.posts[0]?.diskPath : ''),
        batch.carousel.targetChannels || destination.defaultChannels?.carousel || ['instagram', 'facebook', 'linkedin']
      );
    }

    // 3. Schedule 5 Individual Ultra HD Reels (if generated)
    if (batch.singleReels && Array.isArray(batch.singleReels)) {
      batch.singleReels.forEach((r, idx) => {
        queueItem(
          'reel',
          idx + 1,
          `Reel #${idx + 1}: ${r.seo?.title || 'Desert Adventure'}`,
          r.seo?.caption || '',
          r.reelDiskPath || r.reelPath,
          r.targetChannels || destination.defaultChannels?.reel || ['instagram', 'facebook', 'youtube', 'pinterest']
        );
      });
    }

    // 4. Schedule 12-Second Combined Reel
    if (batch.combinedReel) {
      queueItem(
        'reel',
        0,
        batch.combinedReel.seo?.title || `12s Cinematic Reel: 5 Best Experiences in ${destination.name}`,
        batch.combinedReel.seo?.caption || '',
        batch.combinedReel.reelDiskPath || batch.combinedReel.reelPath,
        batch.combinedReel.targetChannels || destination.defaultChannels?.reel || ['instagram', 'facebook', 'youtube', 'pinterest']
      );
    }

    batch.status = 'scheduled';
    batch.scheduledAt = new Date().toISOString();
    db.saveBatch(batch);

    db.addLog({
      type: 'schedule',
      batchId: batch.id,
      destination: destination.name,
      message: `Batch "${batch.title}" for ${destination.name} scheduled with ${scheduledItems.length} items using human anti-spam intervals.`
    });

    if (this.wsBroadcast) {
      this.wsBroadcast({ type: 'BATCH_SCHEDULED', batchId: batch.id, count: scheduledItems.length });
    }

    // Send Real-Time Telegram Timetable Alert
    telegramNotifier.notifyBatchScheduled(destination, batch, scheduledItems);

    return scheduledItems;
  }

  /**
   * Process due items in the queue
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      const queue = db.getQueue();
      const destinations = db.getDestinations();

      const dueItems = queue.filter(q => q.status === 'queued' && new Date(q.scheduledTime) <= now);

      for (const item of dueItems) {
        console.log(`🚀 Dispatching: [${item.destinationName}] ${item.itemType} #${item.index} - ${item.title}`);
        db.updateQueueItem(item.id, { status: 'publishing' });

        if (this.wsBroadcast) {
          this.wsBroadcast({ type: 'QUEUE_PROGRESS', item });
        }

        const destination = destinations.find(d => d.id === item.destinationId) || destinations[0];
        const publishResults = [];
        let allSuccess = true;
        let lastError = null;

        for (const targetPlatform of item.targets) {
          const channelConfig = destination?.channels ? destination.channels[targetPlatform] : null;

          if (channelConfig && channelConfig.enabled === false) {
            publishResults.push({ platform: targetPlatform, status: 'skipped', reason: 'Channel disabled in destination settings' });
            continue;
          }

          const accountAdapter = {
            name: `${destination.name} - ${targetPlatform}`,
            platform: targetPlatform,
            credentials: channelConfig ? channelConfig.credentials : {},
            proxy: destination.proxy || ''
          };

          try {
            let res;
            if (item.itemType === 'post') {
              if (targetPlatform === 'instagram') {
                res = await instagramPublisher.publishImage({ account: accountAdapter, mediaPath: item.mediaPath, caption: item.caption });
              } else if (targetPlatform === 'facebook') {
                res = await facebookPublisher.publishPhoto({ account: accountAdapter, filePath: item.mediaPath, caption: `${item.title}\n\n${item.caption}` });
              } else if (targetPlatform === 'threads') {
                res = await threadsPublisher.publishPost({ account: accountAdapter, text: `${item.title}\n\n${item.caption}`, imageUrl: item.mediaPath });
              } else if (targetPlatform === 'website' || targetPlatform === 'blog') {
                res = await blogPublisher.publishArticle({ account: accountAdapter, title: item.title, content: item.caption, excerpt: item.title });
              } else if (targetPlatform === 'pinterest') {
                res = await pinterestPublisher.publishPin({ account: accountAdapter, imageUrl: item.mediaPath, title: item.title, description: item.caption });
              } else if (targetPlatform === 'linkedin') {
                res = await linkedinPublisher.publishPost({ account: accountAdapter, text: `${item.title}\n\n${item.caption}`, imageUrl: item.mediaPath });
              } else if (targetPlatform === 'blogger') {
                res = await bloggerPublisher.publishPost({ account: accountAdapter, title: item.title, caption: item.caption, hashtags: item.hashtags || '', mediaPath: item.mediaPath, destinationName: destination.name });
              } else if (targetPlatform === 'google_business' || targetPlatform === 'gmb') {
                res = await googleBusinessPublisher.publishPost({
                  account: accountAdapter,
                  title: item.title,
                  caption: item.caption,
                  mediaPath: item.mediaPath,
                  destinationName: destination.name,
                  websiteUrl: destination.channels?.website?.credentials?.siteUrl
                });
              } else if (targetPlatform === 'twitter') {
                res = { success: true, simulated: true, platform: 'twitter', message: 'Twitter standing by (future ready).' };
              }
            } else if (item.itemType === 'carousel') {
              if (targetPlatform === 'instagram') {
                const batch = db.getBatch(item.batchId);
                const allImages = batch?.posts?.map(p => p.diskPath || p.imagePath) || [item.mediaPath];
                res = await instagramPublisher.publishCarousel({ account: accountAdapter, mediaPaths: allImages, caption: item.caption });
              } else if (targetPlatform === 'facebook') {
                res = await facebookPublisher.publishPhoto({ account: accountAdapter, filePath: item.mediaPath, caption: item.caption });
              } else if (targetPlatform === 'threads') {
                res = await threadsPublisher.publishPost({ account: accountAdapter, text: item.caption, imageUrl: item.mediaPath });
              } else if (targetPlatform === 'website' || targetPlatform === 'blog') {
                res = await blogPublisher.publishArticle({ account: accountAdapter, title: item.title || 'Travel Photo Story', content: item.caption, excerpt: item.title });
              } else if (targetPlatform === 'linkedin') {
                res = await linkedinPublisher.publishPost({ account: accountAdapter, text: item.caption, imageUrl: item.mediaPath });
              }
            } else if (item.itemType === 'reel') {
              if (targetPlatform === 'instagram') {
                res = await instagramPublisher.publishReel({ account: accountAdapter, videoPath: item.mediaPath, caption: item.caption });
              } else if (targetPlatform === 'facebook') {
                res = await facebookPublisher.publishReel({ account: accountAdapter, videoPath: item.mediaPath, caption: item.caption });
              } else if (targetPlatform === 'threads') {
                res = await threadsPublisher.publishPost({ account: accountAdapter, text: `${item.title}\n\n${item.caption}`, videoUrl: item.mediaPath });
              } else if (targetPlatform === 'youtube') {
                res = await youtubePublisher.uploadShort({ account: accountAdapter, videoPath: item.mediaPath, title: item.title, description: item.caption });
              } else if (targetPlatform === 'pinterest') {
                res = await pinterestPublisher.publishPin({ account: accountAdapter, imageUrl: item.mediaPath, videoUrl: item.mediaPath, title: item.title, description: item.caption });
              }
            }

            publishResults.push({ platform: targetPlatform, status: 'published', details: res });
          } catch (err) {
            console.error(`Error publishing to ${targetPlatform}:`, err.message);
            publishResults.push({ platform: targetPlatform, status: 'failed', error: err.message });
            allSuccess = false;
            lastError = err.message;

            // Trigger instant security & policy alert if error involves permissions, review or community guidelines
            const isPolicyIssue = /permission|OAuthException|policy|review|deprecated|restricted|community|guideline|checkpoint|strike|blocked|auth.*fail/i.test(err.message);
            if (isPolicyIssue) {
              telegramNotifier.notifyPolicyAlert({
                destination,
                platform: targetPlatform,
                error: err.message,
                details: `Task: ${item.title} (Type: ${item.itemType})`
              }).catch(e => console.error('notifyPolicyAlert error:', e));
            }
          }
        }

        db.updateQueueItem(item.id, {
          status: allSuccess ? 'published' : 'partial_or_failed',
          publishedAt: new Date().toISOString(),
          publishResults
        });

        db.addLog({
          type: 'publish',
          queueId: item.id,
          destination: destination.name,
          itemType: item.itemType,
          title: item.title,
          status: allSuccess ? 'success' : 'failed',
          results: publishResults
        });

        if (this.wsBroadcast) {
          this.wsBroadcast({ type: 'ITEM_PUBLISHED', item, results: publishResults });
        }

        // Send Telegram Real-Time Live Report
        if (allSuccess) {
          telegramNotifier.notifyItemPublished(destination, item, publishResults);
        } else {
          telegramNotifier.notifyError(destination, item, lastError || 'One or more channels failed.');
        }
      }
    } catch (err) {
      console.error('Scheduler processQueue error:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  async publishItemNow(queueId) {
    const item = db.getQueue().find(q => q.id === queueId);
    if (!item) throw new Error('Queue item not found: ' + queueId);
    db.updateQueueItem(item.id, { scheduledTime: new Date(Date.now() - 5000).toISOString() });
    await this.processQueue();
    const updated = db.getQueue().find(q => q.id === queueId) || item;
    return updated;
  }

  async publishAllQueueNow(destinationId) {
    const queue = db.getQueue(destinationId);
    const queuedItems = queue.filter(q => q.status === 'queued');
    for (const item of queuedItems) {
      db.updateQueueItem(item.id, { scheduledTime: new Date(Date.now() - 5000).toISOString() });
    }
    await this.processQueue();
    return db.getQueue(destinationId);
  }
}

module.exports = new Scheduler();
