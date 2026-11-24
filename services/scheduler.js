const db = require('../database/db');
const instagramPublisher = require('./publishers/instagram');
const facebookPublisher = require('./publishers/facebook');
const pinterestPublisher = require('./publishers/pinterest');
const linkedinPublisher = require('./publishers/linkedin');
const youtubePublisher = require('./publishers/youtube');
const twitterPublisher = require('./publishers/twitter');
const redditPublisher = require('./publishers/reddit');
const bloggerPublisher = require('./publishers/blogger');
const threadsPublisher = require('./publishers/threads');
const googleBusinessPublisher = require('./publishers/googleBusiness');
const blogPublisher = require('./publishers/blog');
const customPublisher = require('./publishers/custom');
const tunnelService = require('./tunnelService');
const telegramNotifier = require('./telegramNotifier');
const storageManager = require('./storageManager');

class Scheduler {
  constructor() {
    this.timer = null;
    this.digestTimer = null;
    this.isProcessing = false;
    this.wsBroadcast = null;
  }

  setWsBroadcast(fn) {
    this.wsBroadcast = fn;
  }

  init() {
    return this.recoverOrphanedJobs();
  }

  /**
   * Startup & Crash Recovery Sweep:
   * Finds any items stuck in 'publishing' status from unexpected shutdown or container restart
   * and safely resets them to 'queued' (or marks 'failed' if retries exhausted).
   */
  recoverOrphanedJobs(maxRetries = 3) {
    const queue = db.getQueue();
    const orphaned = queue.filter(q => q.status === 'publishing');
    if (!orphaned || orphaned.length === 0) return [];

    console.log(`🧹 [Scheduler] Detected ${orphaned.length} orphaned job(s) in 'publishing' status. Starting recovery sweep...`);
    const recovered = [];

    for (const item of orphaned) {
      // Do not re-publish instant or partially published jobs on container reboot to avoid duplicate posts
      if (item.publishResults && item.publishResults.some(r => r.status === 'published' || r.status === 'success')) {
        const note = 'Preserved as published/partial after container restart (duplicate prevention).';
        db.updateQueueItem(item.id, {
          status: 'partial_or_failed',
          recoveryNote: note
        });
        recovered.push({ id: item.id, status: 'partial_or_failed', note });
        continue;
      }
      if (item.id && (item.id.startsWith('q_instant_') || item.id.startsWith('q_reel_'))) {
        const note = 'Instant Telegram pipeline job dropped after restart to avoid duplicate posts.';
        db.updateQueueItem(item.id, {
          status: 'failed',
          recoveryNote: note,
          lastError: note
        });
        recovered.push({ id: item.id, status: 'failed', note });
        continue;
      }

      const currentRetries = Number(item.retryCount || 0);
      const nextRetries = currentRetries + 1;

      if (nextRetries > maxRetries) {
        const note = `Failed: Exceeded maximum recovery attempts (${maxRetries}) after unexpected process crash or shutdown.`;
        const updates = {
          status: 'failed',
          retryCount: nextRetries,
          recoveryNote: note,
          lastError: note,
          failedAt: new Date().toISOString()
        };
        db.updateQueueItem(item.id, updates);
        db.addLog({
          type: 'orphan_recovery_failed',
          queueId: item.id,
          title: item.title,
          retryCount: nextRetries,
          message: note
        });
        recovered.push({ id: item.id, status: 'failed', retryCount: nextRetries, note });
      } else {
        const note = `Recovered: Reset from stalled 'publishing' status to 'queued' after process restart (recovery attempt ${nextRetries}/${maxRetries}).`;
        const updates = {
          status: 'queued',
          retryCount: nextRetries,
          recoveryNote: note,
          scheduledTime: new Date(Date.now() + 5000).toISOString() // 5s backoff to avoid race conditions
        };
        db.updateQueueItem(item.id, updates);
        db.addLog({
          type: 'orphan_recovery',
          queueId: item.id,
          title: item.title,
          retryCount: nextRetries,
          message: note
        });
        recovered.push({ id: item.id, status: 'queued', retryCount: nextRetries, note });
      }
    }

    console.log(`✅ [Scheduler] Orphan recovery sweep complete. Processed ${recovered.length} item(s).`);
    return recovered;
  }

  start() {
    // 1. Recover orphaned publishing jobs from previous crashes
    this.recoverOrphanedJobs();

    // 2. Start queue timer
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.processQueue(), 20000);
    console.log('⚡ Multi-Destination Anti-Spam Scheduler active. Checking queue every 20s.');

    // 3. Daily Tri-Digest Reporter (Morning 09:00 AM, Afternoon 02:00 PM, Evening 08:00 PM IST)
    if (this.digestTimer) clearInterval(this.digestTimer);
    this.digestTimer = setInterval(() => this.checkDailyDigestSchedule(), 60000);

    // 4. Auto-clean storage of published media
    storageManager.startAutoCleanup();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.digestTimer) {
      clearInterval(this.digestTimer);
      this.digestTimer = null;
    }
  }

  checkDailyDigestSchedule() {
    const now = new Date();
    // Indian Standard Time (UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const hour = istTime.getUTCHours();
    const minute = istTime.getUTCMinutes();

    let slot = null;
    if (hour === 9 && minute === 0) slot = '🌅 प्रातःकालीन सारांश (Morning Digest)';
    else if (hour === 14 && minute === 0) slot = '☀️ दोपहर सारांश (Afternoon Digest)';
    else if (hour === 20 && minute === 0) slot = '🌙 सांध्यकालीन सारांश (Evening Digest)';

    if (slot) {
      console.log(`📢 [Scheduler] Dispatching ${slot} to Telegram...`);
      const destinations = db.getDestinations();
      for (const dest of destinations) {
        telegramNotifier.notifyDailyDigest(dest, slot);
      }
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
    const singleReelsList = batch.singleReels || batch.reels;
    if (singleReelsList && Array.isArray(singleReelsList)) {
      singleReelsList.forEach((r, idx) => {
        queueItem(
          'reel',
          idx + 1,
          `Reel #${idx + 1}: ${r.seo?.title || r.title || 'Desert Adventure'}`,
          r.seo?.caption || r.caption || '',
          r.reelDiskPath || r.reelPath || r.diskPath,
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
      const dueItems = queue.filter(q => q.status === 'queued' && new Date(q.scheduledTime) <= now);

      for (const item of dueItems) {
        await this.dispatchSingleQueueItem(item);
      }
    } catch (err) {
      console.error('Scheduler processQueue error:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Determine whether an error is transient (temporary network/timeout/rate-limit/transcoding delay)
   * vs permanent (auth/permissions/missing credentials/invalid parameters/simulated).
   */
  isTransientError(errorMsg) {
    if (!errorMsg || typeof errorMsg !== 'string') return false;
    const permanentRegex = /(oauth|permission|invalid.*token|token.*expired|unauthorized|401|403|unsupported\s*platform|simulated|missing.*credential)/i;
    if (permanentRegex.test(errorMsg)) {
      return false;
    }
    const transientRegex = /(429|rate\s*limit|too\s*many\s*requests|500|502|503|504|timeout|timed\s*out|transcoding|processing\s*timed\s*out|in_progress|transient|temporary|service\s*unavailable|network\s*error|econnreset|econnrefused|etimedout|socket\s*hang\s*up)/i;
    return transientRegex.test(errorMsg);
  }

  /**
   * Smart YouTube Quota Sentinel:
   * Enforces 10,000 daily units limit (1,600 units per video upload).
   * Prioritizes:
   * 1. Combined 12s Cinematic Highlight Reels
   * 2. Direct user-uploaded ready-to-use custom reels
   * Gracefully skips low-priority single-image reels when approaching the daily ceiling (>= 4 uploads),
   * while allowing Instagram, Facebook, Threads, LinkedIn & Pinterest to publish without failure.
   */
  checkYouTubeDailyQuota(destinationId, item) {
    const usage = db.getDailyQuotaUsage('youtube');
    const uploadCount = usage.uploadCount || 0;
    const unitsUsed = usage.unitsUsed || (uploadCount * 1600);
    const MAX_DAILY_UPLOADS = 6;

    const titleLower = (item.title || '').toLowerCase();
    const isCombinedOrCustom = item.isCombinedReel ||
                               item.isCustomReel ||
                               item.itemType === 'custom_reel' ||
                               titleLower.includes('combined') ||
                               titleLower.includes('12s cinematic') ||
                               titleLower.includes('highlight');

    // Hard ceiling: 6 uploads reached (9,600+ units used)
    if (uploadCount >= MAX_DAILY_UPLOADS) {
      return {
        shouldSkip: true,
        reason: `Daily YouTube API quota ceiling reached (${uploadCount}/${MAX_DAILY_UPLOADS} uploads, ${unitsUsed} units used today). Skipped gracefully to protect Google Cloud quota limit.`,
        uploadCount,
        unitsRemaining: Math.max(0, 10000 - unitsUsed)
      };
    }

    // Soft ceiling: 4 uploads reached
    // If not a combined or custom priority reel, reserve the remaining slots and skip single image reels
    if (uploadCount >= 4 && !isCombinedOrCustom) {
      return {
        shouldSkip: true,
        reason: `Daily YouTube quota budget reserved for Combined Highlight Reel & Custom Reels (${uploadCount} uploads today). Skipped single image reel to protect quota while other platforms publish.`,
        uploadCount,
        unitsRemaining: Math.max(0, 10000 - unitsUsed)
      };
    }

    return {
      shouldSkip: false,
      uploadCount,
      unitsRemaining: Math.max(0, 10000 - unitsUsed)
    };
  }

  /**
   * Dispatch a single queue item to all target platforms
   */
  async dispatchSingleQueueItem(item) {
    console.log(`🚀 Dispatching: [${item.destinationName}] ${item.itemType} #${item.index} - ${item.title}`);
    db.updateQueueItem(item.id, { status: 'publishing' });

    if (this.wsBroadcast) {
      this.wsBroadcast({ type: 'QUEUE_PROGRESS', item });
    }

    const destinations = db.getDestinations();
    const destination = destinations.find(d => d.id === item.destinationId) || destinations[0];
    const publishResults = [];
    let allSuccess = true;
    let lastError = null;

    for (const targetPlatform of item.targets) {
      // If item is being retried, check if targetPlatform already succeeded authentically in previous attempt
      const existingSuccess = (item.publishResults || []).find(
        r => r.platform === targetPlatform && (r.status === 'published' || r.status === 'success') && r.details && !r.details.simulated
      );
      if (existingSuccess) {
        console.log(`⏩ [Scheduler] Skipping already published platform "${targetPlatform}" for [${item.id}]`);
        publishResults.push(existingSuccess);
        continue;
      }

      const channelConfig = destination?.channels ? destination.channels[targetPlatform] : null;

      if (channelConfig && channelConfig.enabled === false) {
        publishResults.push({ platform: targetPlatform, status: 'skipped', reason: 'Channel disabled in destination settings' });
        continue;
      }

      if (targetPlatform === 'quora') {
        publishResults.push({
          platform: 'quora',
          status: 'skipped',
          reason: 'Quora operates in Assisted Copy/Paste mode. Dispatched to AI Q&A queue.'
        });
        continue;
      }

      // --- SMART YOUTUBE QUOTA SENTINEL ---
      if (targetPlatform === 'youtube') {
        const quotaCheck = this.checkYouTubeDailyQuota(destination?.id, item);
        if (quotaCheck.shouldSkip) {
          console.log(`[Scheduler] 🛡️ YouTube Quota Sentinel: ${quotaCheck.reason}`);
          publishResults.push({
            platform: 'youtube',
            status: 'skipped',
            reason: quotaCheck.reason,
            quotaLimitReached: true,
            uploadCountToday: quotaCheck.uploadCount,
            unitsRemaining: quotaCheck.unitsRemaining
          });
          continue;
        }
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
          } else if (targetPlatform === 'reddit') {
            const subreddit = channelConfig?.subreddit || channelConfig?.credentials?.subreddit || destination.channels?.reddit?.credentials?.subreddit || 'IndiaTravel';
            const hasMedia = !!item.mediaPath;
            const publicMediaUrl = hasMedia ? tunnelService.resolvePublicMediaUrl(item.mediaPath) : undefined;
            res = await redditPublisher.submitPost({
              account: accountAdapter,
              subreddit,
              title: item.title,
              text: item.caption,
              url: publicMediaUrl,
              kind: (hasMedia && publicMediaUrl) ? 'link' : 'self'
            });
          } else if (targetPlatform === 'twitter') {
            res = await twitterPublisher.publishTweet({
              account: accountAdapter,
              text: item.caption,
              title: item.title,
              mediaPath: item.mediaPath
            });
          } else if (targetPlatform === 'youtube') {
            res = await youtubePublisher.uploadShort({
              account: accountAdapter,
              videoPath: item.mediaPath,
              title: item.title,
              description: item.caption
            });
            db.recordQuotaUsage('youtube', 1600);
          } else if (targetPlatform === 'custom') {
            res = await customPublisher.publish({
              account: accountAdapter,
              payload: {
                itemType: item.itemType,
                title: item.title,
                caption: item.caption,
                mediaPath: item.mediaPath
              }
            });
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
          } else if (targetPlatform === 'pinterest') {
            res = await pinterestPublisher.publishPin({ account: accountAdapter, imageUrl: item.mediaPath, title: item.title, description: item.caption });
          } else if (targetPlatform === 'twitter') {
            res = await twitterPublisher.publishTweet({
              account: accountAdapter,
              text: item.caption,
              title: item.title,
              mediaPath: item.mediaPath
            });
          } else if (targetPlatform === 'blogger') {
            res = await bloggerPublisher.publishPost({ account: accountAdapter, title: item.title, caption: item.caption, hashtags: item.hashtags || '', mediaPath: item.mediaPath, destinationName: destination.name });
          } else if (targetPlatform === 'custom') {
            res = await customPublisher.publish({
              account: accountAdapter,
              payload: {
                itemType: item.itemType,
                title: item.title,
                caption: item.caption,
                mediaPath: item.mediaPath
              }
            });
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
            db.recordQuotaUsage('youtube', 1600);
          } else if (targetPlatform === 'pinterest') {
            res = await pinterestPublisher.publishPin({ account: accountAdapter, imageUrl: item.mediaPath, videoUrl: item.mediaPath, title: item.title, description: item.caption });
          } else if (targetPlatform === 'twitter') {
            res = await twitterPublisher.publishTweet({
              account: accountAdapter,
              text: item.caption,
              title: item.title,
              mediaPath: item.mediaPath
            });
          } else if (targetPlatform === 'linkedin') {
            res = await linkedinPublisher.publishPost({ account: accountAdapter, text: `${item.title}\n\n${item.caption}`, videoUrl: item.mediaPath });
          } else if (targetPlatform === 'custom') {
            res = await customPublisher.publish({
              account: accountAdapter,
              payload: {
                itemType: item.itemType,
                title: item.title,
                caption: item.caption,
                mediaPath: item.mediaPath
              }
            });
          }
        }

        if (!res) {
          throw new Error(`Platform "${targetPlatform}" does not support item type "${item.itemType}" or returned no result.`);
        }

        // Strict Authenticity & Simulation Purge
        const rawId = String(res.postId || res.id || res.pinId || res.videoId || '');
        const isMockId = typeof rawId === 'string' && (rawId.toLowerCase().startsWith('sim_') || rawId.toLowerCase().includes('mock') || rawId.toLowerCase().includes('simulat'));
        const isSimulated = res.simulated === true || res.isSimulated === true || isMockId || String(res.message || '').toLowerCase().includes('simulat');
        const hasAuthenticId = !isMockId && !!(res.postId || res.id || res.postUrl || res.pinId || res.videoId || res.url);
        const isSuccess = res.success !== false;

        if (isSimulated || !hasAuthenticId || !isSuccess) {
          const failReason = isSimulated 
            ? `Publisher returned simulated response for ${targetPlatform} (simulated: true). Genuine live API publishing required.`
            : (!hasAuthenticId 
                ? `Publisher response for ${targetPlatform} missing authentic postId or URL.`
                : `Publisher reported failure: ${res.error || res.message || 'Unknown API error'}`);

          publishResults.push({
            platform: targetPlatform,
            status: 'failed',
            error: failReason,
            details: res
          });
          allSuccess = false;
          lastError = failReason;
        } else {
          // Normalize post identifiers so downstream consumers always find postId & postUrl
          const normalizedDetails = {
            ...res,
            postId: res.postId || res.pinId || res.id || res.videoId,
            postUrl: res.postUrl || res.reelUrl || res.watchUrl || res.permalink || res.url || res.liveUrl || res.searchUrl
          };
          publishResults.push({
            platform: targetPlatform,
            status: 'published',
            details: normalizedDetails
          });
        }
      } catch (err) {
        console.error(`Error publishing to ${targetPlatform}:`, err.message);
        publishResults.push({ platform: targetPlatform, status: 'failed', error: err.message });
        allSuccess = false;
        lastError = err.message;

        // Trigger instant security & policy alert if error involves permissions, review or community guidelines
        const isInstantTelegramPost = String(item.id).startsWith('q_instant_');
        const isPolicyIssue = /permission|OAuthException|policy|review|deprecated|restricted|community|guideline|checkpoint|strike|blocked|auth.*fail/i.test(err.message);
        if (isPolicyIssue && !isInstantTelegramPost) {
          telegramNotifier.notifyPolicyAlert({
            destination,
            platform: targetPlatform,
            error: err.message,
            details: `Task: ${item.title} (Type: ${item.itemType})`
          }).catch(e => console.error('notifyPolicyAlert error:', e));
        }
      }
    }

    // Filter results by verified authenticity
    const authenticPublished = publishResults.filter(r => {
      if (r.status !== 'published' || !r.details) return false;
      if (r.details.simulated === true || r.details.isSimulated === true) return false;
      const id = String(r.details.postId || r.details.id || r.details.pinId || r.details.videoId || '');
      if (id.toLowerCase().startsWith('sim_') || id.toLowerCase().includes('mock') || id.toLowerCase().includes('simulat')) return false;
      return !!(id || r.details.postUrl || r.details.url);
    });
    const failedResults = publishResults.filter(r => r.status === 'failed');
    const skippedResults = publishResults.filter(r => r.status === 'skipped');

    let finalStatus = 'failed';
    if (authenticPublished.length > 0 && failedResults.length === 0) {
      finalStatus = 'published';
    } else if (authenticPublished.length > 0 && failedResults.length > 0) {
      finalStatus = 'partial_or_failed';
    } else if (authenticPublished.length === 0 && failedResults.length > 0) {
      finalStatus = 'failed';
    } else if (authenticPublished.length === 0 && failedResults.length === 0 && skippedResults.length > 0) {
      finalStatus = 'skipped';
    } else {
      finalStatus = 'failed';
    }

    allSuccess = (finalStatus === 'published');

    // Transient failure retry engine (Automatic retry for Reels & retryable pipeline items)
    const MAX_RETRIES = 3;
    const currentRetries = Number(item.retryCount || 0);
    const isRetryableItem = item.itemType === 'reel' || item.itemType === 'single_reel' || item.id?.startsWith('q_reel_') || item.retryEnabled === true;
    const hasTransientFailure = failedResults.some(r => this.isTransientError(r.error)) || this.isTransientError(lastError);

    if (isRetryableItem && !item.disableRetry && !allSuccess && hasTransientFailure && currentRetries < MAX_RETRIES) {
      const nextRetries = currentRetries + 1;
      const backoffMs = Math.pow(2, currentRetries) * 15000; // 15s, 30s, 60s
      const nextScheduledTime = new Date(Date.now() + backoffMs).toISOString();
      const errorSummary = failedResults.length > 0 
        ? failedResults.map(r => `[${r.platform}] ${r.error}`).join('; ')
        : (lastError || 'Transient error during publishing.');

      const retryUpdates = {
        status: 'queued',
        retryCount: nextRetries,
        scheduledTime: nextScheduledTime,
        lastError: errorSummary,
        publishResults
      };

      Object.assign(item, retryUpdates);
      const updated = db.updateQueueItem(item.id, retryUpdates);

      db.addLog({
        type: 'retry_scheduled',
        queueId: item.id,
        destination: destination.name,
        itemType: item.itemType,
        title: item.title,
        retryCount: nextRetries,
        scheduledTime: nextScheduledTime,
        lastError: errorSummary
      });

      if (this.wsBroadcast) {
        this.wsBroadcast({ type: 'ITEM_RETRY_SCHEDULED', item, retryCount: nextRetries });
      }

      console.log(`🔁 [Scheduler] Transient error detected for [${item.id}]. Re-queued with backoff (${backoffMs / 1000}s, attempt ${nextRetries}/${MAX_RETRIES}): ${errorSummary}`);

      return updated || item;
    }

    const errorSummary = failedResults.length > 0 
      ? failedResults.map(r => `[${r.platform}] ${r.error}`).join('; ')
      : (lastError || 'One or more channels failed.');

    const updates = {
      status: finalStatus,
      publishedAt: new Date().toISOString(),
      publishResults,
      retryCount: currentRetries,
      lastError: allSuccess ? null : errorSummary
    };

    Object.assign(item, updates);
    const updated = db.updateQueueItem(item.id, updates);

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
      const isInstantTelegramPost = String(item.id).startsWith('q_instant_');
      if (!isInstantTelegramPost) {
        if (currentRetries >= MAX_RETRIES && typeof telegramNotifier.notifyPersistentFailure === 'function') {
          telegramNotifier.notifyPersistentFailure(destination, item, errorSummary);
        }
        telegramNotifier.notifyError(destination, item, errorSummary);
      }
    }

    return updated || item;
  }

  async publishItemNow(queueId) {
    const item = db.getQueueItem(queueId) || db.getQueue().find(q => q.id === queueId);
    if (!item) throw new Error('Queue item not found: ' + queueId);
    return await this.dispatchSingleQueueItem(item);
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
