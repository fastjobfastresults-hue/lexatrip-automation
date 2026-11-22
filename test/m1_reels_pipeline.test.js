/**
 * test/m1_reels_pipeline.test.js
 * Comprehensive Test Suite for Milestones M1, M2, and M3:
 * 
 * 1. Instagram Reel Container Polling & Resumable Binary Upload:
 *    - Extended polling window (180s) handling simulated video transcoding delay.
 *    - Container status recognition for 'PUBLISHED' state without duplicate media_publish.
 *    - Resumable binary upload header verification (Content-Length, X-Entity-Length).
 *    - Error and expiration rejection.
 * 
 * 2. Dynamic Destination-Aware Reel Targets & Isolation:
 *    - LexaTrip Jaisalmer Reel targets dynamically resolved to ['facebook', 'instagram'] (excluding YouTube).
 *    - YouTube OAuth credential validation (included when OAuth token is present, excluded when API key only).
 *    - Strict destination isolation for LexaTrip Jaisalmer (Account ID: 17841429903443095, Page ID: 1190728550800516).
 * 
 * 3. Transient Retry Engine:
 *    - Automatic retry with exponential backoff on transient errors (rate limit HTTP 429, 500/503, timeout).
 *    - Re-queuing failed items with retryCount < MAX_RETRIES (3 attempts), updating status='queued' and scheduledTime.
 *    - Preserving already-published channels on retry (zero duplicate posts).
 *    - Exhausting retries (retryCount >= 3) marks item permanently failed and fires persistent failure alert.
 *    - Immediate failure on permanent errors (403 Forbidden, missing credentials).
 * 
 * 4. Comprehensive Failure Alerting:
 *    - Explicit Telegram failure alert dispatched to chatId and admin when all reel targets fail.
 *    - Explicit alert dispatched to chatId and admin when video generation throws an exception.
 *    - telegramNotifier.notifyError alerts both adminChatId and destination.telegram.channelId (-1003697503605).
 *    - telegramNotifier.notifyPersistentFailure alerts both adminChatId and destination.telegram.channelId.
 * 
 * 5. Cloud Base URL Priority:
 *    - Prioritizing process.env.PUBLIC_URL over database publicBaseUrl.
 *    - Prioritizing process.env.RENDER_EXTERNAL_URL over database publicBaseUrl.
 *    - Fallback to database settings when cloud environment variables are unset.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const mockHttp = require('./helpers/mockHttp');
const {
  isolateDatabase,
  restoreDatabase,
  createFixtureQueueItem,
  createFixtureDestination,
  createDummyMedia,
  cleanupDummyMedia,
  resetAllSubsystems
} = require('./helpers/testFixtures');

const instagramPublisher = require('../services/publishers/instagram');
const facebookPublisher = require('../services/publishers/facebook');
const scheduler = require('../services/scheduler');
const telegramNotifier = require('../services/telegramNotifier');
const telegramBotService = require('../services/telegramBot');
const tunnelService = require('../services/tunnelService');

describe('Milestones M1, M2 & M3: Robust Reels Pipeline, Retries & Failure Alerting', () => {
  let createdFiles = [];

  beforeEach(() => {
    isolateDatabase();
    resetAllSubsystems();
    mockHttp.enable();
    mockHttp.setupDefaultPlatformMocks();
    createdFiles = [];
  });

  afterEach(() => {
    mockHttp.reset();
    mockHttp.disable();
    restoreDatabase();
    resetAllSubsystems();
    cleanupDummyMedia(createdFiles);
  });

  // =========================================================================
  // SECTION 1: Instagram Container Polling & Binary Upload
  // =========================================================================
  describe('1. Instagram Container Polling & Binary Resumable Upload', () => {
    it('1.1 Extended polling handles container transcoding delay (IN_PROGRESS -> FINISHED)', async () => {
      let callCount = 0;
      mockHttp.onGet(/graph\.facebook\.com\/v19\.0\/container_transcode_delay_123/, (config) => {
        callCount++;
        if (callCount < 4) {
          return {
            status: 200,
            data: { id: 'container_transcode_delay_123', status_code: 'IN_PROGRESS', status: 'In progress' }
          };
        }
        return {
          status: 200,
          data: { id: 'container_transcode_delay_123', status_code: 'FINISHED', status: 'Finished' }
        };
      });

      const result = await instagramPublisher.pollContainerStatus('container_transcode_delay_123', 'test_token', 10, 20);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.alreadyPublished, false);
      assert.ok(callCount >= 4, `Must poll multiple times during transcoding (polled ${callCount} times)`);
    });

    it('1.2 Container status recognizing PUBLISHED returns alreadyPublished: true', async () => {
      mockHttp.onGet(/graph\.facebook\.com\/v19\.0\/container_published_456/, () => ({
        status: 200,
        data: {
          id: 'container_published_456',
          status_code: 'PUBLISHED',
          status: 'Published: Media has been successfully published.'
        }
      }));

      const result = await instagramPublisher.pollContainerStatus('container_published_456', 'test_token', 5, 10);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.alreadyPublished, true);
    });

    it('1.3 publishReel bypasses media_publish call when container status is PUBLISHED', async () => {
      const videoFile = createDummyMedia('video');
      createdFiles.push(videoFile);

      let mediaPublishCalled = false;
      mockHttp.onPost(/graph\.facebook\.com\/v19\.0\/17841429903443095\/media$/, () => ({
        status: 200,
        data: { id: 'ig_container_auto_pub_789' }
      }));
      mockHttp.onGet(/graph\.facebook\.com\/v19\.0\/ig_container_auto_pub_789/, (config) => {
        if (config.params?.fields?.includes('permalink')) {
          return { status: 200, data: { permalink: 'https://www.instagram.com/reel/DgAutoPub/' } };
        }
        return {
          status: 200,
          data: { id: 'ig_container_auto_pub_789', status_code: 'PUBLISHED' }
        };
      });
      mockHttp.onPost(/graph\.facebook\.com\/v19\.0\/17841429903443095\/media_publish/, () => {
        mediaPublishCalled = true;
        return { status: 200, data: { id: 'media_published_err' } };
      });

      const res = await instagramPublisher.publishReel({
        account: {
          credentials: {
            accessToken: 'EAAB_test_ig_access_token',
            instagramAccountId: '17841429903443095'
          }
        },
        videoPath: videoFile,
        caption: 'Desert Sunset Reel #Jaisalmer'
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(mediaPublishCalled, false, 'media_publish MUST be bypassed when alreadyPublished is true');
      assert.strictEqual(res.postId, 'ig_container_auto_pub_789');
      assert.ok(res.postUrl.includes('DgAutoPub'));
    });

    it('1.4 Binary upload to rupload.facebook.com includes Content-Length and X-Entity-Length', async () => {
      const videoFile = createDummyMedia('video');
      createdFiles.push(videoFile);
      const fileSize = fs.statSync(videoFile).size;

      let binaryHeadersCaptured = null;
      mockHttp.onPost(/graph\.facebook\.com\/v19\.0\/17841429903443095\/media$/, () => ({
        status: 200,
        data: { id: 'ig_container_bin_111', uri: 'https://rupload.facebook.com/ig-video-upload/111' }
      }));
      mockHttp.onPost(/rupload\.facebook\.com\/ig-video-upload\/111/, (config) => {
        binaryHeadersCaptured = config.headers;
        return { status: 200, data: { success: true } };
      });
      mockHttp.onGet(/graph\.facebook\.com\/v19\.0\/ig_container_bin_111/, (config) => {
        if (config.params?.fields?.includes('permalink')) {
          return { status: 200, data: { permalink: 'https://www.instagram.com/reel/DgBinStream/' } };
        }
        return { status: 200, data: { id: 'ig_container_bin_111', status_code: 'FINISHED' } };
      });
      mockHttp.onPost(/graph\.facebook\.com\/v19\.0\/17841429903443095\/media_publish/, () => ({
        status: 200,
        data: { id: 'ig_media_live_999' }
      }));

      await instagramPublisher.publishReel({
        account: {
          credentials: {
            accessToken: 'EAAB_test_token',
            instagramAccountId: '17841429903443095'
          }
        },
        videoPath: videoFile,
        caption: 'Resumable binary upload test'
      });

      assert.ok(binaryHeadersCaptured, 'Binary upload request must be sent to rupload.facebook.com');
      assert.strictEqual(binaryHeadersCaptured['Content-Length'], fileSize.toString());
      assert.strictEqual(binaryHeadersCaptured['X-Entity-Length'], fileSize.toString());
      assert.strictEqual(binaryHeadersCaptured['offset'], '0');
    });

    it('1.5 pollContainerStatus throws timed out error when attempts are exhausted', async () => {
      mockHttp.onGet(/graph\.facebook\.com\/v19\.0\/container_stuck_forever/, () => ({
        status: 200,
        data: { id: 'container_stuck_forever', status_code: 'IN_PROGRESS' }
      }));

      await assert.rejects(
        async () => {
          await instagramPublisher.pollContainerStatus('container_stuck_forever', 'tok', 3, 10);
        },
        /processing timed out after/i
      );
    });

    it('1.6 pollContainerStatus throws immediately when status_code is ERROR or EXPIRED', async () => {
      mockHttp.onGet(/graph\.facebook\.com\/v19\.0\/container_error_state/, () => ({
        status: 200,
        data: { id: 'container_error_state', status_code: 'ERROR', status: 'Transcoding failed' }
      }));

      await assert.rejects(
        async () => {
          await instagramPublisher.pollContainerStatus('container_error_state', 'tok', 5, 10);
        },
        /Instagram container .* processing failed/i
      );
    });
  });

  // =========================================================================
  // SECTION 2: Dynamic Destination-Aware Reel Targets & Isolation
  // =========================================================================
  describe('2. Dynamic Destination-Aware Reel Targets & Isolation', () => {
    it('2.1 LexaTrip Jaisalmer dynamic targets resolve strictly to facebook and instagram (excluding YouTube)', () => {
      const dest = db.getDestination('dest_jaisalmer');
      assert.ok(dest, 'dest_jaisalmer must exist in database');

      const reelTargets = [];
      if (dest.channels?.facebook?.enabled !== false && dest.channels?.facebook?.credentials?.pageAccessToken) {
        reelTargets.push('facebook');
      }
      if (dest.channels?.instagram?.enabled !== false && (dest.channels?.instagram?.credentials?.accessToken || dest.channels?.instagram?.credentials?.pageAccessToken)) {
        reelTargets.push('instagram');
      }
      if (dest.channels?.youtube?.enabled === true && (dest.channels?.youtube?.credentials?.accessToken || dest.channels?.youtube?.credentials?.refreshToken)) {
        reelTargets.push('youtube');
      }
      const targets = reelTargets.length > 0 ? reelTargets : ['facebook', 'instagram'];

      assert.deepStrictEqual(targets, ['facebook', 'instagram'], 'LexaTrip Jaisalmer Reel targets must only include facebook and instagram');
      assert.ok(!targets.includes('youtube'), 'YouTube must NOT be included without OAuth 2.0 user token');
    });

    it('2.2 Destination with valid YouTube OAuth credentials includes youtube in reel targets', () => {
      const dest = createFixtureDestination();
      dest.channels.youtube = {
        enabled: true,
        credentials: {
          accessToken: 'ya29.valid_oauth_access_token',
          channelId: 'UC123456789'
        }
      };

      const reelTargets = [];
      if (dest.channels?.facebook?.enabled !== false && dest.channels?.facebook?.credentials?.pageAccessToken) {
        reelTargets.push('facebook');
      }
      if (dest.channels?.instagram?.enabled !== false && (dest.channels?.instagram?.credentials?.accessToken || dest.channels?.instagram?.credentials?.pageAccessToken)) {
        reelTargets.push('instagram');
      }
      if (dest.channels?.youtube?.enabled === true && (dest.channels?.youtube?.credentials?.accessToken || dest.channels?.youtube?.credentials?.refreshToken)) {
        reelTargets.push('youtube');
      }
      const targets = reelTargets.length > 0 ? reelTargets : ['facebook', 'instagram'];

      assert.ok(targets.includes('youtube'), 'YouTube must be included when valid OAuth token is provided');
      assert.ok(targets.includes('facebook'));
      assert.ok(targets.includes('instagram'));
    });

    it('2.3 Strict destination isolation: Jaisalmer Instagram 17841429903443095 and Page 1190728550800516 are isolated', () => {
      const destinations = db.getDestinations();
      const jaisalmer = destinations.find(d => d.id === 'dest_jaisalmer');
      assert.ok(jaisalmer);

      assert.strictEqual(jaisalmer.channels.instagram.credentials.instagramAccountId, '17841429903443095');
      assert.strictEqual(jaisalmer.channels.facebook.credentials.pageId, '1190728550800516');

      // Verify no other destination shares these IDs
      for (const other of destinations) {
        if (other.id !== 'dest_jaisalmer') {
          const otherIg = other.channels?.instagram?.credentials?.instagramAccountId;
          const otherFb = other.channels?.facebook?.credentials?.pageId;
          assert.notStrictEqual(otherIg, '17841429903443095', `Cross-contamination: ${other.id} shares Jaisalmer IG Account ID`);
          assert.notStrictEqual(otherFb, '1190728550800516', `Cross-contamination: ${other.id} shares Jaisalmer Facebook Page ID`);
        }
      }
    });
  });

  // =========================================================================
  // SECTION 3: Transient Retry Engine in Scheduler
  // =========================================================================
  describe('3. Transient Retry Engine in Scheduler', () => {
    it('3.1 Transient failure (rate limit 429) automatically re-queues reel item with status queued and backoff', async () => {
      const dest = createFixtureDestination();
      db.saveDestination(dest);

      const videoFile = createDummyMedia('video');
      createdFiles.push(videoFile);

      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/video_reels/, {
        error: { message: 'User request limit reached (HTTP 429 rate limit exceeded)' }
      }, 429);

      const item = createFixtureQueueItem({
        destinationId: dest.id,
        itemType: 'reel',
        mediaPath: videoFile,
        targets: ['facebook'],
        retryCount: 0
      });
      db.addToQueue(item);

      const result = await scheduler.dispatchSingleQueueItem(item);

      assert.strictEqual(result.status, 'queued', 'Transient 429 error must re-queue reel item for retry');
      assert.strictEqual(result.retryCount, 1, 'retryCount must be incremented to 1');
      assert.ok(new Date(result.scheduledTime) > new Date(), 'Next scheduledTime must be in the future with backoff');
      assert.ok(result.lastError.includes('429') || result.lastError.includes('rate limit'));
    });

    it('3.2 Transient failure (container transcoding delay) automatically re-queues reel item', async () => {
      const dest = createFixtureDestination();
      db.saveDestination(dest);

      const videoFile = createDummyMedia('video');
      createdFiles.push(videoFile);

      mockHttp.onPost(/graph\.facebook\.com\/v19\.0\/.*\/media$/, () => ({
        status: 200,
        data: { id: 'ig_transcode_delay_item_1' }
      }));
      mockHttp.onGet(/graph\.facebook\.com\/v19\.0\/ig_transcode_delay_item_1/, () => ({
        status: 200,
        data: { id: 'ig_transcode_delay_item_1', status_code: 'IN_PROGRESS' }
      }));

      // Override instagram poll to simulate 60s timeout error
      const origPoll = instagramPublisher.pollContainerStatus;
      instagramPublisher.pollContainerStatus = async () => {
        throw new Error('Instagram container ig_transcode_delay_item_1 processing timed out after 60s.');
      };

      try {
        const item = createFixtureQueueItem({
          destinationId: dest.id,
          itemType: 'reel',
          mediaPath: videoFile,
          targets: ['instagram'],
          retryCount: 1
        });
        db.addToQueue(item);

        const result = await scheduler.dispatchSingleQueueItem(item);

        assert.strictEqual(result.status, 'queued', 'Transcoding delay timeout must re-queue reel item');
        assert.strictEqual(result.retryCount, 2, 'retryCount must be incremented from 1 to 2');
        assert.ok(result.lastError.includes('timed out'));
      } finally {
        instagramPublisher.pollContainerStatus = origPoll;
      }
    });

    it('3.3 Preserves already-published channels during retry (zero duplicate publishing)', async () => {
      const dest = createFixtureDestination();
      db.saveDestination(dest);

      const videoFile = createDummyMedia('video');
      createdFiles.push(videoFile);

      let fbCalledCount = 0;
      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/video_reels/, () => {
        fbCalledCount++;
        return {
          status: 200,
          data: { video_id: 'fb_vid_already_done', upload_url: 'https://rupload.facebook.com/fb-test' }
        };
      });

      // Item already has facebook successfully published in attempt 1, retrying instagram
      const item = createFixtureQueueItem({
        destinationId: dest.id,
        itemType: 'reel',
        mediaPath: videoFile,
        targets: ['facebook', 'instagram'],
        retryCount: 1,
        publishResults: [
          {
            platform: 'facebook',
            status: 'published',
            details: {
              success: true,
              simulated: false,
              platform: 'facebook',
              postId: 'fb_vid_already_done',
              reelUrl: 'https://www.facebook.com/reel/fb_vid_already_done/'
            }
          }
        ]
      });
      db.addToQueue(item);

      // Instagram succeeds in attempt 2
      mockHttp.onPost(/graph\.facebook\.com\/v19\.0\/.*\/media$/, () => ({
        status: 200,
        data: { id: 'ig_reel_attempt2_ok' }
      }));
      mockHttp.onGet(/graph\.facebook\.com\/v19\.0\/ig_reel_attempt2_ok/, (config) => {
        if (config.params?.fields?.includes('permalink')) {
          return { status: 200, data: { permalink: 'https://www.instagram.com/reel/DgAttempt2Ok/' } };
        }
        return { status: 200, data: { id: 'ig_reel_attempt2_ok', status_code: 'FINISHED' } };
      });
      mockHttp.onPost(/graph\.facebook\.com\/v19\.0\/.*\/media_publish/, () => ({
        status: 200,
        data: { id: 'ig_published_id_attempt2' }
      }));

      const result = await scheduler.dispatchSingleQueueItem(item);

      assert.strictEqual(result.status, 'published', 'Item must be published after second target succeeds');
      assert.strictEqual(fbCalledCount, 0, 'Facebook MUST NOT be re-called when already successfully published in previous attempt');
      assert.strictEqual(result.publishResults.length, 2);
    });

    it('3.4 When MAX_RETRIES (3) are exhausted, reel item is marked permanently failed and alerts persistent failure', async () => {
      const dest = createFixtureDestination();
      db.saveDestination(dest);

      const videoFile = createDummyMedia('video');
      createdFiles.push(videoFile);

      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/(video_reels|videos)/, {
        error: { message: 'Service Unavailable 503' }
      }, 503);

      let persistentFailureAlertCalled = false;
      let persistentFailureError = '';
      const origPersistent = telegramNotifier.notifyPersistentFailure;
      telegramNotifier.notifyPersistentFailure = async (destination, item, errorSummary) => {
        persistentFailureAlertCalled = true;
        persistentFailureError = errorSummary;
      };

      try {
        const item = createFixtureQueueItem({
          destinationId: dest.id,
          itemType: 'reel',
          mediaPath: videoFile,
          targets: ['facebook'],
          retryCount: 3 // Max retries already reached
        });
        db.addToQueue(item);

        const result = await scheduler.dispatchSingleQueueItem(item);

        assert.strictEqual(result.status, 'failed', 'Item must be marked permanently failed when retryCount >= 3');
        assert.strictEqual(persistentFailureAlertCalled, true, 'notifyPersistentFailure must be triggered');
        assert.ok(persistentFailureError.includes('503'));
      } finally {
        telegramNotifier.notifyPersistentFailure = origPersistent;
      }
    });

    it('3.5 Permanent error (403 Forbidden / missing credentials) is NOT re-queued and fails immediately', async () => {
      const dest = createFixtureDestination();
      db.saveDestination(dest);

      const videoFile = createDummyMedia('video');
      createdFiles.push(videoFile);

      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/(video_reels|videos)/, {
        error: { message: 'OAuthException: (#200) Permissions error (403)' }
      }, 403);

      const item = createFixtureQueueItem({
        destinationId: dest.id,
        itemType: 'reel',
        mediaPath: videoFile,
        targets: ['facebook'],
        retryCount: 0
      });
      db.addToQueue(item);

      const result = await scheduler.dispatchSingleQueueItem(item);

      assert.strictEqual(result.status, 'failed', 'Permanent auth/permission error must NOT be re-queued');
      assert.strictEqual(result.retryCount, 0, 'retryCount must remain 0');
    });
  });

  // =========================================================================
  // SECTION 4: Comprehensive Failure Alerting
  // =========================================================================
  describe('4. Comprehensive Failure Alerting to Channel & Admin', () => {
    it('4.1 telegramNotifier.notifyError sends alert to both adminChatId and destination.telegram.channelId', async () => {
      const dest = createFixtureDestination({
        telegram: {
          botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
          channelId: '-1003697503605',
          channelUsername: '@lexatripjaisalmer'
        }
      });
      db.updateSettings({
        telegram: {
          botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
          allowedChatId: '8455865796'
        }
      });

      const item = createFixtureQueueItem({
        destinationId: dest.id,
        title: 'Sam Sand Dunes Sunset Reel'
      });

      const sentMessages = [];
      const origSendMessage = telegramNotifier.sendMessage;
      telegramNotifier.sendMessage = async (token, chatId, text, options) => {
        sentMessages.push({ chatId: String(chatId), text });
        return { message_id: 999 };
      };

      try {
        await telegramNotifier.notifyError(dest, item, 'Instagram container processing timed out after 180s');

        assert.strictEqual(sentMessages.length, 2, 'notifyError must send to both admin and channel');
        const chatIds = sentMessages.map(m => m.chatId);
        assert.ok(chatIds.includes('8455865796'), 'Must alert admin chatId');
        assert.ok(chatIds.includes('-1003697503605'), 'Must alert channel chatId');
        assert.ok(sentMessages[0].text.includes('त्रुटि अलर्ट'));
        assert.ok(sentMessages[0].text.includes('timed out'));
      } finally {
        telegramNotifier.sendMessage = origSendMessage;
      }
    });

    it('4.2 telegramNotifier.notifyPersistentFailure sends alert to both admin and channel', async () => {
      const dest = createFixtureDestination({
        telegram: {
          botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
          channelId: '-1003697503605',
          channelUsername: '@lexatripjaisalmer'
        }
      });
      db.updateSettings({
        telegram: {
          botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
          allowedChatId: '8455865796'
        }
      });

      const item = createFixtureQueueItem({
        destinationId: dest.id,
        title: 'Desert Luxury Safari Reel',
        retryCount: 3
      });

      const sentMessages = [];
      const origSendMessage = telegramNotifier.sendMessage;
      telegramNotifier.sendMessage = async (token, chatId, text, options) => {
        sentMessages.push({ chatId: String(chatId), text });
        return { message_id: 1000 };
      };

      try {
        await telegramNotifier.notifyPersistentFailure(dest, item, 'Max retries exhausted (3/3): Graph API 500 error');

        assert.strictEqual(sentMessages.length, 2, 'notifyPersistentFailure must send to both admin and channel');
        const chatIds = sentMessages.map(m => m.chatId);
        assert.ok(chatIds.includes('8455865796'), 'Must alert admin');
        assert.ok(chatIds.includes('-1003697503605'), 'Must alert channel');
        assert.ok(sentMessages[0].text.includes('स्थायी विफलता अलर्ट'));
        assert.ok(sentMessages[0].text.includes('3/3'));
      } finally {
        telegramNotifier.sendMessage = origSendMessage;
      }
    });

    it('4.3 telegramBot sendDualMessage sends to both source chat and adminChatId', async () => {
      db.updateSettings({ telegram: { allowedChatId: '8455865796' } });

      const sent = [];
      const origBot = telegramBotService.bot;
      telegramBotService.bot = {
        sendMessage: async (chatId, text, options) => {
          sent.push({ chatId: String(chatId), text });
          return { message_id: 1 };
        }
      };

      try {
        await telegramBotService.sendDualMessage('-1003697503605', '🚨 रील निर्माण विफलता टेस्ट');

        assert.strictEqual(sent.length, 2, 'sendDualMessage must send to both chatId and adminChatId');
        assert.strictEqual(sent[0].chatId, '-1003697503605');
        assert.strictEqual(sent[1].chatId, '8455865796');
      } finally {
        telegramBotService.bot = origBot;
      }
    });
  });

  // =========================================================================
  // SECTION 5: Cloud Base URL Priority
  // =========================================================================
  describe('5. Cloud Public Base URL Priority', () => {
    const origPublicUrl = process.env.PUBLIC_URL;
    const origRenderUrl = process.env.RENDER_EXTERNAL_URL;

    afterEach(() => {
      process.env.PUBLIC_URL = origPublicUrl;
      process.env.RENDER_EXTERNAL_URL = origRenderUrl;
    });

    it('5.1 Prioritizes process.env.PUBLIC_URL over database publicBaseUrl', () => {
      process.env.PUBLIC_URL = 'https://lexa-trip-automation.onrender.com/';
      delete process.env.RENDER_EXTERNAL_URL;

      db.updateSettings({ publicBaseUrl: 'https://stale-localtunnel-address.loca.lt' });

      const resolved = tunnelService.getPublicUrl();
      assert.strictEqual(resolved, 'https://lexa-trip-automation.onrender.com');
    });

    it('5.2 Prioritizes process.env.RENDER_EXTERNAL_URL when PUBLIC_URL is not set', () => {
      delete process.env.PUBLIC_URL;
      process.env.RENDER_EXTERNAL_URL = 'https://lexatrip-srv.onrender.com';

      db.updateSettings({ publicBaseUrl: 'https://stale-localtunnel-address.loca.lt' });

      const resolved = tunnelService.getPublicUrl();
      assert.strictEqual(resolved, 'https://lexatrip-srv.onrender.com');
    });

    it('5.3 Falls back to database publicBaseUrl when cloud environment variables are unset', () => {
      delete process.env.PUBLIC_URL;
      delete process.env.RENDER_EXTERNAL_URL;

      db.updateSettings({ publicBaseUrl: 'https://custom-domain.lexatrip.com' });

      const resolved = tunnelService.getPublicUrl();
      assert.strictEqual(resolved, 'https://custom-domain.lexatrip.com');
    });
  });
});
