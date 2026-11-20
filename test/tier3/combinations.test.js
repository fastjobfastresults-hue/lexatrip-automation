/**
 * Lexa Trip Social Media Automation System
 * Tier 3 Test Suite: Cross-Feature Combinations & Subsystem Interactions
 * 
 * Verifies combinatorial and pairwise cross-feature behaviors:
 * 1. Scheduler Queue Dispatch + Partial Failure Handling (Status = 'partial_or_failed')
 * 2. Safe Storage Cleanup (Media preserved on partial/total failure; purged only on 100% success)
 * 3. Stalled Queue Job Recovery on Startup (Recovers orphaned 'publishing' jobs; retry limits)
 * 4. Truthful Telegram Reporting (Explicit failure alerts; zero false success; policy alerts)
 * 5. Dynamic Destination Links & Multi-Destination Channel Isolation (Jaisalmer vs Mount Abu)
 * 6. In-Memory Database Isolation (Zero mutation of database/data.json verified via SHA-256)
 */

const { describe, it, beforeEach, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helpers
const mockHttp = require('../helpers/mockHttp');
const {
  isolateDatabase,
  restoreDatabase,
  getValidCredentials,
  createDummyMedia,
  cleanupDummyMedia,
  createFixtureQueueItem,
  createFixtureDestination,
  resetAllSubsystems
} = require('../helpers/testFixtures');

// Subsystems under test
const scheduler = require('../../services/scheduler');
const storageManager = require('../../services/storageManager');
const telegramNotifier = require('../../services/telegramNotifier');
const db = require('../../database/db');

// Publishers
const facebookPublisher = require('../../services/publishers/facebook');
const twitterPublisher = require('../../services/publishers/twitter');
const linkedinPublisher = require('../../services/publishers/linkedin');
const instagramPublisher = require('../../services/publishers/instagram');
const pinterestPublisher = require('../../services/publishers/pinterest');
const youtubePublisher = require('../../services/publishers/youtube');

describe('Tier 3: Cross-Feature Combinations Test Suite', () => {
  const DB_FILE = path.join(__dirname, '..', '..', 'database', 'data.json');
  let initialDbHash = null;

  beforeEach(() => {
    // Record DB hash to verify zero disk mutation
    initialDbHash = crypto.createHash('sha256').update(fs.readFileSync(DB_FILE)).digest('hex');

    isolateDatabase();
    resetAllSubsystems();
    mockHttp.enable();
    mockHttp.reset();
    mockHttp.setupDefaultPlatformMocks();
  });

  afterEach(async () => {
    // Grace period for any unawaited fire-and-forget background tasks
    await new Promise((resolve) => setTimeout(resolve, 60));

    mockHttp.disable();
    restoreDatabase();
    resetAllSubsystems();
    cleanupDummyMedia();

    // Verify database/data.json on disk was 100% untouched
    const currentDbHash = crypto.createHash('sha256').update(fs.readFileSync(DB_FILE)).digest('hex');
    assert.strictEqual(currentDbHash, initialDbHash, 'Zero-mutation invariant violated: database/data.json was modified on disk!');
  });

  // =========================================================================
  // SUITE 1: Scheduler Queue Dispatch + Partial Failure Handling
  // =========================================================================
  describe('1. Scheduler Queue Dispatch + Partial Failure Handling', () => {
    it('1.1 Pairwise Dispatch: Facebook 200 OK + Twitter 403 Forbidden marks item partial_or_failed', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      // Twitter API v2 fails with 403 Forbidden
      mockHttp.onPost('https://api.twitter.com/2/tweets', {
        errors: [{ message: 'Client forbidden from accessing endpoint' }]
      }, 403);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        targets: ['facebook', 'twitter']
      });
      db.addToQueue(item);

      const result = await scheduler.dispatchSingleQueueItem(item);

      assert.strictEqual(result.status, 'partial_or_failed', 'Queue item must be marked partial_or_failed');
      assert.strictEqual(result.publishResults.length, 2);

      const fb = result.publishResults.find(r => r.platform === 'facebook');
      const tw = result.publishResults.find(r => r.platform === 'twitter');

      assert.ok(fb);
      assert.strictEqual(fb.status, 'published');
      assert.strictEqual(fb.details.postId, 'fb_photo_id_101');

      assert.ok(tw);
      assert.strictEqual(tw.status, 'failed');
      assert.ok(tw.error.includes('403'), 'Twitter error must record 403 status code');

      // Verify database record persistence
      const persisted = db.getQueueItem(item.id);
      assert.strictEqual(persisted.status, 'partial_or_failed');
      assert.ok(persisted.publishedAt);
    });

    it('1.2 Multi-Channel Dispatch: Instagram 200 + Pinterest 200 + LinkedIn 401 Unauthorized', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      mockHttp.onPost('https://api.linkedin.com/rest/posts', {
        message: 'Invalid or expired access token'
      }, 401);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        targets: ['instagram', 'pinterest', 'linkedin']
      });
      db.addToQueue(item);

      const result = await scheduler.dispatchSingleQueueItem(item);

      assert.strictEqual(result.status, 'partial_or_failed');
      assert.strictEqual(result.publishResults.length, 3);

      const publishedTargets = result.publishResults.filter(r => r.status === 'published');
      const failedTargets = result.publishResults.filter(r => r.status === 'failed');

      assert.strictEqual(publishedTargets.length, 2);
      assert.strictEqual(failedTargets.length, 1);
      assert.strictEqual(failedTargets[0].platform, 'linkedin');
      assert.ok(
        failedTargets[0].error.includes('Invalid or expired access token') || failedTargets[0].error.includes('401'),
        'LinkedIn failure must report the token error or 401 status'
      );
    });

    it('1.3 Mixed Channel Dispatch with Quora Assisted Mode: Facebook 200 + Twitter 500 + Quora Skipped', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      mockHttp.onPost('https://api.twitter.com/2/tweets', {
        message: 'Internal Twitter server error'
      }, 500);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        targets: ['facebook', 'twitter', 'quora']
      });
      db.addToQueue(item);

      const result = await scheduler.dispatchSingleQueueItem(item);

      assert.strictEqual(result.status, 'partial_or_failed');

      const quoraRes = result.publishResults.find(r => r.platform === 'quora');
      assert.ok(quoraRes);
      assert.strictEqual(quoraRes.status, 'skipped');
      assert.ok(quoraRes.reason.includes('Quora operates in Assisted Copy/Paste mode'));

      const twRes = result.publishResults.find(r => r.platform === 'twitter');
      assert.strictEqual(twRes.status, 'failed');

      const fbRes = result.publishResults.find(r => r.platform === 'facebook');
      assert.strictEqual(fbRes.status, 'published');
    });

    it('1.4 Simulation Rejection: Instagram succeeds + Facebook returns simulated: true evaluates to partial_or_failed', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      // Mock Facebook returning simulated response
      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/photos/, {
        id: 'sim_fb_mock_999',
        simulated: true
      });

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        targets: ['instagram', 'facebook']
      });
      db.addToQueue(item);

      const result = await scheduler.dispatchSingleQueueItem(item);

      assert.strictEqual(result.status, 'partial_or_failed');
      const fb = result.publishResults.find(r => r.platform === 'facebook');
      assert.strictEqual(fb.status, 'failed');
      assert.ok(fb.error.includes('simulated response'), 'Facebook failure reason must cite simulated response');

      const ig = result.publishResults.find(r => r.platform === 'instagram');
      assert.strictEqual(ig.status, 'published');
    });

    it('1.5 Mock ID Rejection: Twitter succeeds + YouTube returns mock postId evaluates to partial_or_failed', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      // YouTube resumable put returns mock ID
      mockHttp.onPut(/www\.googleapis\.com\/upload\/youtube\/v3\/videos/, {
        id: 'sim_youtube_mock_video_123',
        snippet: { title: 'Mock Short' }
      });

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        targets: ['twitter', 'youtube']
      });
      db.addToQueue(item);

      const result = await scheduler.dispatchSingleQueueItem(item);

      assert.strictEqual(result.status, 'partial_or_failed');
      const yt = result.publishResults.find(r => r.platform === 'youtube');
      assert.strictEqual(yt.status, 'failed');
      assert.ok(yt.error.includes('simulated response') || yt.error.includes('missing authentic postId'));
    });

    it('1.6 Disabled Channel in Destination Settings: Facebook disabled + Twitter fails evaluates to failed', async () => {
      const dest = createFixtureDestination();
      dest.channels.facebook.enabled = false;
      db.saveDestination(dest);

      mockHttp.onPost('https://api.twitter.com/2/tweets', { error: 'Twitter down' }, 503);

      const item = createFixtureQueueItem({
        destinationId: dest.id,
        targets: ['facebook', 'twitter']
      });
      db.addToQueue(item);

      const result = await scheduler.dispatchSingleQueueItem(item);

      assert.strictEqual(result.status, 'failed');
      const fbRes = result.publishResults.find(r => r.platform === 'facebook');
      assert.strictEqual(fbRes.status, 'skipped');
      assert.ok(fbRes.reason.includes('disabled'));

      const twRes = result.publishResults.find(r => r.platform === 'twitter');
      assert.strictEqual(twRes.status, 'failed');
    });
  });

  // =========================================================================
  // SUITE 2: Queue Dispatch + Safe Storage Cleanup Safety
  // =========================================================================
  describe('2. Queue Dispatch + Safe Storage Cleanup Safety', () => {
    it('2.1 Multi-destination partial failure PRESERVES local media file on disk', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      const mediaFile = createDummyMedia('image');
      assert.strictEqual(fs.existsSync(mediaFile), true);

      // Twitter fails with 403 Forbidden
      mockHttp.onPost('https://api.twitter.com/2/tweets', { error: 'Forbidden' }, 403);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        mediaPath: mediaFile,
        targets: ['facebook', 'twitter']
      });
      db.addToQueue(item);

      await scheduler.dispatchSingleQueueItem(item);
      assert.strictEqual(db.getQueueItem(item.id).status, 'partial_or_failed');

      // Attempt garbage collection
      const cleanupRes = storageManager.cleanupPublishedMedia();

      // Local media file MUST remain intact on disk
      assert.strictEqual(fs.existsSync(mediaFile), true, 'Media file MUST NOT be deleted when publish partially fails');
      assert.strictEqual(cleanupRes.deletedCount, 0);
    });

    it('2.2 Multi-destination total failure PRESERVES local media file on disk', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      const mediaFile = createDummyMedia('image');

      // Both Facebook and Twitter fail
      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/photos/, { error: 'FB down' }, 500);
      mockHttp.onPost('https://api.twitter.com/2/tweets', { error: 'Twitter down' }, 500);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        mediaPath: mediaFile,
        targets: ['facebook', 'twitter']
      });
      db.addToQueue(item);

      await scheduler.dispatchSingleQueueItem(item);
      assert.strictEqual(db.getQueueItem(item.id).status, 'failed');

      const cleanupRes = storageManager.cleanupPublishedMedia();
      assert.strictEqual(fs.existsSync(mediaFile), true, 'Media file MUST NOT be deleted when publish totally fails');
      assert.strictEqual(cleanupRes.deletedCount, 0);
    });

    it('2.3 100% Genuine success across all targets SAFELY PURGES local media file', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      const mediaFile = createDummyMedia('image');
      assert.strictEqual(fs.existsSync(mediaFile), true);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        mediaPath: mediaFile,
        targets: ['facebook', 'twitter']
      });
      db.addToQueue(item);

      const dispatchRes = await scheduler.dispatchSingleQueueItem(item);
      assert.strictEqual(dispatchRes.status, 'published');
      assert.strictEqual(dispatchRes.publishResults.every(r => r.status === 'published'), true);

      const cleanupRes = storageManager.cleanupPublishedMedia();

      // Media file MUST be deleted cleanly
      assert.strictEqual(fs.existsSync(mediaFile), false, 'Media file must be purged when 100% of targets succeed');
      assert.ok(cleanupRes.deletedCount >= 1);
    });

    it('2.4 Retry Lifecycle: Media preserved on partial failure, purged after successful retry', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      const mediaFile = createDummyMedia('image');

      // Step 1: Dispatch with Twitter 403 failure
      mockHttp.onPost('https://api.twitter.com/2/tweets', { error: 'Forbidden' }, 403);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        mediaPath: mediaFile,
        targets: ['facebook', 'twitter']
      });
      db.addToQueue(item);

      await scheduler.dispatchSingleQueueItem(item);
      assert.strictEqual(db.getQueueItem(item.id).status, 'partial_or_failed');

      storageManager.cleanupPublishedMedia();
      assert.strictEqual(fs.existsSync(mediaFile), true, 'Media preserved after partial failure');

      // Step 2: Fix Twitter credentials / API mock to 200 OK
      mockHttp.onPost('https://api.twitter.com/2/tweets', {
        data: { id: 'tw_real_post_retry_101', text: 'Retry success' }
      });

      // Step 3: Re-dispatch item
      const retryResult = await scheduler.dispatchSingleQueueItem(item);
      assert.strictEqual(retryResult.status, 'published');

      // Step 4: Storage cleanup now purges the file
      storageManager.cleanupPublishedMedia();
      assert.strictEqual(fs.existsSync(mediaFile), false, 'Media must be unlinked once retry achieves 100% published status');
    });

    it('2.5 Shared Batch Media Protection: Post published, but shared Carousel queued retains image', () => {
      const sharedImage = createDummyMedia('image');
      const batchId = `batch_shared_${Date.now()}`;

      // Item 1: Post (already published, targets only facebook)
      const postItem = createFixtureQueueItem({
        batchId,
        mediaPath: sharedImage,
        status: 'published',
        targets: ['facebook'],
        publishResults: [{ platform: 'facebook', status: 'published', details: { postId: 'fb_101', simulated: false } }]
      });

      // Item 2: Carousel (still queued, referencing the same batch/image)
      const carouselItem = createFixtureQueueItem({
        batchId,
        mediaPath: sharedImage,
        status: 'queued',
        targets: ['facebook', 'instagram']
      });

      db.addToQueue(postItem);
      db.addToQueue(carouselItem);

      // Attempt cleanup
      storageManager.cleanupPublishedMedia();

      // Shared image MUST NOT be unlinked because carouselItem is still pending!
      assert.strictEqual(fs.existsSync(sharedImage), true, 'Shared image must be protected while another queue item needs it');

      // Now carousel publishes successfully
      db.updateQueueItem(carouselItem.id, {
        status: 'published',
        publishResults: [
          { platform: 'facebook', status: 'published', details: { postId: 'fb_102', simulated: false } },
          { platform: 'instagram', status: 'published', details: { postId: 'ig_102', simulated: false } }
        ]
      });

      // Cleanup again
      storageManager.cleanupPublishedMedia();
      assert.strictEqual(fs.existsSync(sharedImage), false, 'Shared image must be unlinked once ALL batch items are published');
    });

    it('2.6 Simulated response does NOT trigger media deletion', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      const mediaFile = createDummyMedia('image');

      // Facebook returns simulated response
      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/photos/, {
        id: 'sim_fb_photo_999',
        simulated: true
      });

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        mediaPath: mediaFile,
        targets: ['facebook']
      });
      db.addToQueue(item);

      await scheduler.dispatchSingleQueueItem(item);
      assert.strictEqual(db.getQueueItem(item.id).status, 'failed');

      storageManager.cleanupPublishedMedia();
      assert.strictEqual(fs.existsSync(mediaFile), true, 'Simulated responses must NEVER trigger storage deletion');
    });
  });

  // =========================================================================
  // SUITE 3: Stalled Queue Job Recovery + Storage Safety
  // =========================================================================
  describe('3. Stalled Queue Job Recovery + Storage Safety', () => {
    it('3.1 System Reboot: Orphaned publishing job is recovered to queued and media is preserved', () => {
      const mediaFile = createDummyMedia('image');

      const stalledItem = createFixtureQueueItem({
        mediaPath: mediaFile,
        status: 'publishing',
        retryCount: 0
      });
      db.addToQueue(stalledItem);

      // During stalled state, storage manager must not touch media
      storageManager.cleanupPublishedMedia();
      assert.strictEqual(fs.existsSync(mediaFile), true);

      // Simulate system reboot / scheduler startup
      const recovered = scheduler.recoverOrphanedJobs(3);

      assert.strictEqual(recovered.length, 1);
      assert.strictEqual(recovered[0].id, stalledItem.id);
      assert.strictEqual(recovered[0].status, 'queued');
      assert.strictEqual(recovered[0].retryCount, 1);
      assert.ok(recovered[0].note.includes('Reset from stalled'));

      const dbItem = db.getQueueItem(stalledItem.id);
      assert.strictEqual(dbItem.status, 'queued');
      assert.strictEqual(dbItem.retryCount, 1);
      assert.ok(new Date(dbItem.scheduledTime) > new Date(), 'Scheduled time must have backoff');

      // Media file must remain intact
      storageManager.cleanupPublishedMedia();
      assert.strictEqual(fs.existsSync(mediaFile), true);
    });

    it('3.2 Reboot Recovery Lifecycle: Stalled job recovers, executes, and purges media upon success', async () => {
      const mediaFile = createDummyMedia('image');

      const stalledItem = createFixtureQueueItem({
        mediaPath: mediaFile,
        status: 'publishing',
        retryCount: 1,
        targets: ['facebook']
      });
      db.addToQueue(stalledItem);

      // Recovery sweep on boot
      scheduler.recoverOrphanedJobs(3);
      assert.strictEqual(db.getQueueItem(stalledItem.id).status, 'queued');

      // Now item is picked up and published
      const publishRes = await scheduler.publishItemNow(stalledItem.id);
      assert.strictEqual(publishRes.status, 'published');

      // Storage cleanup runs after verified publishing
      storageManager.cleanupPublishedMedia();
      assert.strictEqual(fs.existsSync(mediaFile), false, 'Media file must be cleaned once recovered item successfully publishes');
    });

    it('3.3 Stalled Job Recovery: Exhausted retries (retryCount >= maxRetries) marks job failed and retains media', () => {
      const mediaFile = createDummyMedia('image');

      const exhaustedItem = createFixtureQueueItem({
        mediaPath: mediaFile,
        status: 'publishing',
        retryCount: 3
      });
      db.addToQueue(exhaustedItem);

      const recovered = scheduler.recoverOrphanedJobs(3);

      assert.strictEqual(recovered.length, 1);
      assert.strictEqual(recovered[0].status, 'failed');
      assert.strictEqual(recovered[0].retryCount, 4);

      const dbItem = db.getQueueItem(exhaustedItem.id);
      assert.strictEqual(dbItem.status, 'failed');
      assert.strictEqual(dbItem.retryCount, 4);
      assert.ok(dbItem.lastError.includes('Exceeded maximum recovery attempts'));

      // Storage manager must preserve media for post-mortem investigation
      storageManager.cleanupPublishedMedia();
      assert.strictEqual(fs.existsSync(mediaFile), true, 'Failed orphaned job media must be preserved');
    });

    it('3.4 Multi-Job Crash Recovery: Mixed stalled queue items recovered with independent counters', () => {
      const item1 = createFixtureQueueItem({ status: 'publishing', retryCount: 0 });
      const item2 = createFixtureQueueItem({ status: 'publishing', retryCount: 2 });
      const item3 = createFixtureQueueItem({ status: 'publishing', retryCount: 3 });
      const itemQueued = createFixtureQueueItem({ status: 'queued', retryCount: 0 });

      db.addToQueue(item1);
      db.addToQueue(item2);
      db.addToQueue(item3);
      db.addToQueue(itemQueued);

      const recovered = scheduler.recoverOrphanedJobs(3);

      assert.strictEqual(recovered.length, 3);
      assert.strictEqual(db.getQueueItem(item1.id).status, 'queued');
      assert.strictEqual(db.getQueueItem(item1.id).retryCount, 1);

      assert.strictEqual(db.getQueueItem(item2.id).status, 'queued');
      assert.strictEqual(db.getQueueItem(item2.id).retryCount, 3);

      assert.strictEqual(db.getQueueItem(item3.id).status, 'failed');
      assert.strictEqual(db.getQueueItem(item3.id).retryCount, 4);

      // Normal queued item must be completely unaffected
      assert.strictEqual(db.getQueueItem(itemQueued.id).status, 'queued');
      assert.strictEqual(db.getQueueItem(itemQueued.id).retryCount, 0);
    });
  });

  // =========================================================================
  // SUITE 4: Multi-Channel Dispatch + Truthful Telegram Reporting
  // =========================================================================
  describe('4. Multi-Channel Dispatch + Truthful Telegram Reporting', () => {
    it('4.1 Partial failure sends explicit failure alert to Telegram (Zero false success report)', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      mockHttp.onPost('https://api.twitter.com/2/tweets', {
        errors: [{ message: 'Rate limit exceeded on Twitter' }]
      }, 429);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        title: 'Sunset Camel Safari Tour',
        targets: ['facebook', 'twitter']
      });
      db.addToQueue(item);

      await scheduler.dispatchSingleQueueItem(item);

      // Allow background Telegram alerts to dispatch
      await new Promise((resolve) => setTimeout(resolve, 50));

      const telegramRequests = mockHttp.filterRequests('api.telegram.org', 'post');
      assert.ok(telegramRequests.length >= 1, 'Telegram notification must be sent');

      const messageBodies = telegramRequests.map(r => r.data.text || '');

      // MUST NOT send a false success report
      const falseSuccess = messageBodies.some(t => t.includes('सफल पब्लिश रिपोर्ट'));
      assert.strictEqual(falseSuccess, false, 'Must NOT send successful publish report when one target fails');

      // MUST send error alert detailing the exact failed platform
      const errorAlert = messageBodies.find(t => t.includes('त्रुटि अलर्ट'));
      assert.ok(errorAlert, 'Must send error alert on partial failure');
      assert.ok(errorAlert.includes('Sunset Camel Safari Tour'));
      assert.ok(errorAlert.includes('twitter') && errorAlert.includes('429'));
    });

    it('4.2 Policy Failure: OAuthException on Facebook triggers instant security & policy alert', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/photos/, {
        error: {
          message: 'OAuthException: Error validating access token: Session has expired.',
          type: 'OAuthException',
          code: 190
        }
      }, 400);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        title: 'Desert Glamping Luxury Stay',
        targets: ['facebook']
      });
      db.addToQueue(item);

      await scheduler.dispatchSingleQueueItem(item);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const telegramRequests = mockHttp.filterRequests('api.telegram.org', 'post');
      const policyAlert = telegramRequests.find(r => (r.data.text || '').includes('सुरक्षा व पॉलिसी अलर्ट'));

      assert.ok(policyAlert, 'Must send policy alert when OAuthException is detected');
      assert.ok(policyAlert.data.text.includes('FACEBOOK'));
      assert.ok(policyAlert.data.text.includes('OAuthException'));
      assert.ok(policyAlert.data.text.includes('Desert Glamping Luxury Stay'));
      assert.strictEqual(policyAlert.data.parse_mode, 'Markdown');
    });

    it('4.3 100% Genuine Multi-Channel Broadcast sends verified live report with direct links', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        title: 'Sonar Qila Heritage Walk',
        targets: ['facebook', 'linkedin']
      });
      db.addToQueue(item);

      await scheduler.dispatchSingleQueueItem(item);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const telegramRequests = mockHttp.filterRequests('api.telegram.org', 'post');
      const successAlert = telegramRequests.find(r => (r.data.text || '').includes('सफल पब्लिश रिपोर्ट'));

      assert.ok(successAlert, 'Must send live publish report when all targets succeed');
      assert.ok(successAlert.data.text.includes('Sonar Qila Heritage Walk'));
      assert.ok(successAlert.data.text.includes('वेरिफाइड लाइव लिंक्स'));
      assert.ok(successAlert.data.text.includes('Facebook Live'));

      // Error alert must NOT be sent
      const hasErrorAlert = telegramRequests.some(r => (r.data.text || '').includes('त्रुटि अलर्ट'));
      assert.strictEqual(hasErrorAlert, false, 'No error alert should be dispatched on 100% success');
    });

    it('4.4 Total Failure: Multiple platforms fail aggregate all platform errors into Telegram alert', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/photos/, { error: 'FB token invalid' }, 401);
      mockHttp.onPost('https://api.twitter.com/2/tweets', { error: 'Twitter down' }, 500);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        targets: ['facebook', 'twitter']
      });
      db.addToQueue(item);

      await scheduler.dispatchSingleQueueItem(item);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const telegramRequests = mockHttp.filterRequests('api.telegram.org', 'post');
      const errorAlert = telegramRequests.find(r => (r.data.text || '').includes('त्रुटि अलर्ट'));

      assert.ok(errorAlert);
      assert.ok(errorAlert.data.text.includes('[facebook]'));
      assert.ok(errorAlert.data.text.includes('[twitter]'));
    });

    it('4.5 Telegram Bot unconfigured: Gracefully handles missing token/chatId with zero exceptions', async () => {
      const dest = createFixtureDestination();
      dest.telegram = { botToken: '', chatId: '' };
      db.saveDestination(dest);

      // Clear settings telegram fallback as well
      const settings = db.getSettings();
      settings.telegram = { botToken: '', allowedChatId: '', enabled: false };
      db.updateSettings(settings);

      const item = createFixtureQueueItem({
        destinationId: dest.id,
        targets: ['facebook']
      });
      db.addToQueue(item);

      // Should complete without error
      const result = await scheduler.dispatchSingleQueueItem(item);
      assert.strictEqual(result.status, 'published');

      const telegramRequests = mockHttp.filterRequests('api.telegram.org');
      assert.strictEqual(telegramRequests.length, 0, 'No HTTP requests to Telegram should be made if credentials are unset');
    });
  });

  // =========================================================================
  // SUITE 5: Dynamic Destination Links & Multi-Destination Channel Isolation
  // =========================================================================
  describe('5. Dynamic Destination Links & Multi-Destination Channel Isolation', () => {
    it('5.1 Multi-Destination Routing: Mount Abu uses Mount Abu credentials and Telegram target', async () => {
      const mountAbu = createFixtureDestination({
        id: 'dest_mountabu',
        name: 'लेक्सा ट्रिप माउंट आबू (Lexa Trip Mount Abu)',
        slug: 'mountabu',
        channels: {
          facebook: {
            enabled: true,
            credentials: {
              pageAccessToken: 'EAAB_mountabu_live_token_777',
              pageId: 'page_abu_777'
            }
          }
        },
        telegram: {
          botToken: '987654321:AbuBotToken_XYZ',
          chatId: '-1009876543210'
        }
      });
      db.saveDestination(mountAbu);

      const item = createFixtureQueueItem({
        destinationId: mountAbu.id,
        destinationName: mountAbu.name,
        targets: ['facebook']
      });
      db.addToQueue(item);

      await scheduler.dispatchSingleQueueItem(item);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 1. Verify Facebook publisher was called with Mount Abu credentials
      const fbReq = mockHttp.findRequest('graph.facebook.com/v19.0/page_abu_777/photos', 'post');
      assert.ok(fbReq, 'Facebook upload must target Mount Abu pageId');

      // 2. Verify Telegram alert was addressed to Mount Abu chat and token
      const tgReq = mockHttp.findRequest('api.telegram.org/bot987654321:AbuBotToken_XYZ/sendMessage', 'post');
      assert.ok(tgReq, 'Telegram alert must target Mount Abu bot token');
      assert.strictEqual(tgReq.data.chat_id, '-1009876543210');
      assert.ok(tgReq.data.text.includes('Lexa Trip Mount Abu'));
    });

    it('5.2 Content Type Formatting: Formats labels accurately for Post, Carousel, and Reel', async () => {
      const dest = createFixtureDestination();
      db.saveDestination(dest);

      const reelItem = createFixtureQueueItem({
        destinationId: dest.id,
        itemType: 'reel',
        title: 'Desert Dunes in 4K',
        targets: ['facebook']
      });
      db.addToQueue(reelItem);

      await scheduler.dispatchSingleQueueItem(reelItem);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const tgReq = mockHttp.findRequest('api.telegram.org', 'post');
      assert.ok(tgReq);
      assert.ok(tgReq.data.text.includes('9:16 अल्ट्रा HD रील'), 'Reel content label must be formatted correctly');
    });

    it('5.3 Alert De-duplication Window: Suppresses duplicate identical item alerts within TTL', async () => {
      const dest = createFixtureDestination();
      const item = createFixtureQueueItem({
        id: `fixed_dedup_item_${Date.now()}`,
        destinationId: dest.id,
        title: 'Unique Desert Camel Safari'
      });

      // Send first notification
      await telegramNotifier.notifyItemPublished(dest, item, [{ platform: 'facebook', status: 'published' }]);

      const firstRequests = mockHttp.filterRequests('api.telegram.org', 'post');
      assert.strictEqual(firstRequests.length, 1);

      // Send immediate duplicate notification with same item ID
      await telegramNotifier.notifyItemPublished(dest, item, [{ platform: 'facebook', status: 'published' }]);

      const secondRequests = mockHttp.filterRequests('api.telegram.org', 'post');
      assert.strictEqual(secondRequests.length, 1, 'Duplicate publish notification should be suppressed within TTL window');

      // Send notification with new item ID
      const item2 = createFixtureQueueItem({
        id: `fixed_dedup_item_${Date.now()}_other`,
        destinationId: dest.id,
        title: 'Another Desert Tour'
      });
      await telegramNotifier.notifyItemPublished(dest, item2, [{ platform: 'facebook', status: 'published' }]);

      const thirdRequests = mockHttp.filterRequests('api.telegram.org', 'post');
      assert.strictEqual(thirdRequests.length, 2, 'Distinct item notification must be dispatched');
    });

    it('5.4 Network Resilience: Gracefully handles Telegram API 500 error without crashing dispatch', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      // Mock Telegram API failure
      mockHttp.onPost(/api\.telegram\.org\/bot[^/]+\/sendMessage/, { error: 'Telegram server error' }, 500);

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        targets: ['facebook']
      });
      db.addToQueue(item);

      // Dispatch should complete cleanly and return updated item
      const result = await scheduler.dispatchSingleQueueItem(item);
      assert.strictEqual(result.status, 'published');
      assert.strictEqual(db.getQueueItem(item.id).status, 'published');
    });
  });
});
