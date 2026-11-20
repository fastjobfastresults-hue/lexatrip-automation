/**
 * test/tier1/scheduler.test.js
 * Comprehensive unit test suite for services/scheduler.js
 * 
 * Verifies:
 * 1. Authentic published status evaluation (all targets succeed)
 * 2. Partial or failed status evaluation (mixed success and failure)
 * 3. All targets failed status evaluation
 * 4. Simulated response rejection (res.simulated === true)
 * 5. Missing post ID / URL rejection
 * 6. Skipped channel handling (Quora assisted mode)
 * 7. Orphan recovery on startup (resets publishing to queued)
 * 8. Orphan recovery max retries exceeded (marks failed)
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../../database/db');
const scheduler = require('../../services/scheduler');
const facebookPublisher = require('../../services/publishers/facebook');
const linkedinPublisher = require('../../services/publishers/linkedin');
const telegramNotifier = require('../../services/telegramNotifier');
const {
  isolateDatabase,
  restoreDatabase,
  createFixtureQueueItem,
  resetAllSubsystems
} = require('../helpers/testFixtures');

describe('Anti-Spam Scheduler & Queue Integrity', () => {
  let origFbPublishPhoto;
  let origLiPublishPost;
  let origNotifyPublished;
  let origNotifyError;

  let notifyPublishedCalls = [];
  let notifyErrorCalls = [];

  beforeEach(() => {
    isolateDatabase();
    resetAllSubsystems();

    origFbPublishPhoto = facebookPublisher.publishPhoto;
    origLiPublishPost = linkedinPublisher.publishPost;
    origNotifyPublished = telegramNotifier.notifyItemPublished;
    origNotifyError = telegramNotifier.notifyError;

    notifyPublishedCalls = [];
    notifyErrorCalls = [];

    telegramNotifier.notifyItemPublished = (...args) => {
      notifyPublishedCalls.push(args);
    };
    telegramNotifier.notifyError = (...args) => {
      notifyErrorCalls.push(args);
    };
  });

  afterEach(() => {
    facebookPublisher.publishPhoto = origFbPublishPhoto;
    linkedinPublisher.publishPost = origLiPublishPost;
    telegramNotifier.notifyItemPublished = origNotifyPublished;
    telegramNotifier.notifyError = origNotifyError;

    restoreDatabase();
    resetAllSubsystems();
  });

  it('1. Authentic Published Status: marks item published when all targets succeed authentically', async () => {
    facebookPublisher.publishPhoto = async () => ({
      success: true,
      simulated: false,
      platform: 'facebook',
      postId: 'fb_post_real_999888',
      postUrl: 'https://facebook.com/posts/999888'
    });

    linkedinPublisher.publishPost = async () => ({
      success: true,
      simulated: false,
      platform: 'linkedin',
      postId: 'urn:li:share:777666',
      postUrl: 'https://linkedin.com/feed/update/urn:li:share:777666'
    });

    const item = createFixtureQueueItem({
      destinationId: 'dest_jaisalmer',
      targets: ['facebook', 'linkedin']
    });
    db.addToQueue(item);

    const result = await scheduler.dispatchSingleQueueItem(item);

    assert.strictEqual(result.status, 'published');
    assert.strictEqual(result.publishResults.length, 2);
    assert.ok(result.publishResults.every(r => r.status === 'published'));
    assert.strictEqual(notifyPublishedCalls.length, 1, 'telegramNotifier.notifyItemPublished should be called');
    assert.strictEqual(notifyErrorCalls.length, 0, 'telegramNotifier.notifyError should not be called');
  });

  it('2. Partial or Failed Status: marks item partial_or_failed when mixed success and failure occur', async () => {
    facebookPublisher.publishPhoto = async () => ({
      success: true,
      simulated: false,
      platform: 'facebook',
      postId: 'fb_post_real_111222',
      postUrl: 'https://facebook.com/posts/111222'
    });

    linkedinPublisher.publishPost = async () => {
      const err = new Error('LinkedIn REST API 403 Forbidden: Insufficient member permissions');
      throw err;
    };

    const item = createFixtureQueueItem({
      destinationId: 'dest_jaisalmer',
      targets: ['facebook', 'linkedin']
    });
    db.addToQueue(item);

    const result = await scheduler.dispatchSingleQueueItem(item);

    assert.strictEqual(result.status, 'partial_or_failed');
    assert.strictEqual(result.publishResults.length, 2);

    const fbRes = result.publishResults.find(r => r.platform === 'facebook');
    const liRes = result.publishResults.find(r => r.platform === 'linkedin');

    assert.ok(fbRes);
    assert.strictEqual(fbRes.status, 'published');
    assert.strictEqual(fbRes.details.postId, 'fb_post_real_111222');

    assert.ok(liRes);
    assert.strictEqual(liRes.status, 'failed');
    assert.ok(liRes.error.includes('403 Forbidden'));

    assert.strictEqual(notifyPublishedCalls.length, 0, 'notifyItemPublished MUST NOT be called on partial failure');
    assert.strictEqual(notifyErrorCalls.length, 1, 'notifyError MUST be called on partial failure');
    assert.ok(notifyErrorCalls[0][2].includes('403 Forbidden'), 'Error alert must detail exact platform failure');
  });

  it('3. All Targets Failed: marks item failed when all targets fail', async () => {
    facebookPublisher.publishPhoto = async () => {
      throw new Error('OAuthException: Session has expired or token is invalid');
    };

    const item = createFixtureQueueItem({
      destinationId: 'dest_jaisalmer',
      targets: ['facebook']
    });
    db.addToQueue(item);

    const result = await scheduler.dispatchSingleQueueItem(item);

    assert.strictEqual(result.status, 'failed');
    assert.strictEqual(result.publishResults.length, 1);
    assert.strictEqual(result.publishResults[0].status, 'failed');
    assert.ok(result.publishResults[0].error.includes('OAuthException'));

    assert.strictEqual(notifyPublishedCalls.length, 0);
    assert.strictEqual(notifyErrorCalls.length, 1);
  });

  it('4. Simulated Response Rejection: strictly marks failed if publisher returns simulated: true', async () => {
    facebookPublisher.publishPhoto = async () => ({
      success: true,
      simulated: true,
      platform: 'facebook',
      postId: 'sim_fb_mock_12345'
    });

    const item = createFixtureQueueItem({
      destinationId: 'dest_jaisalmer',
      targets: ['facebook']
    });
    db.addToQueue(item);

    const result = await scheduler.dispatchSingleQueueItem(item);

    assert.strictEqual(result.status, 'failed', 'Item must be marked failed when simulated');
    assert.strictEqual(result.publishResults[0].status, 'failed');
    assert.ok(result.publishResults[0].error.includes('simulated response'), 'Failure reason must cite simulated rejection');
    assert.strictEqual(notifyPublishedCalls.length, 0);
    assert.strictEqual(notifyErrorCalls.length, 1);
  });

  it('4a. Simulated Response Rejection: strictly marks failed if publisher returns postId starting with sim_', async () => {
    facebookPublisher.publishPhoto = async () => ({
      success: true,
      platform: 'facebook',
      postId: 'sim_facebook_123'
    });

    const item = createFixtureQueueItem({
      destinationId: 'dest_jaisalmer',
      targets: ['facebook']
    });
    db.addToQueue(item);

    const result = await scheduler.dispatchSingleQueueItem(item);

    assert.strictEqual(result.status, 'failed', 'Item must be marked failed when postId starts with sim_');
    assert.strictEqual(result.publishResults[0].status, 'failed');
    assert.ok(result.publishResults[0].error.includes('simulated response'), 'Failure reason must cite simulated rejection');
    assert.strictEqual(notifyPublishedCalls.length, 0);
    assert.strictEqual(notifyErrorCalls.length, 1);
  });

  it('4b. Mock Identifier Rejection: strictly marks failed if publisher returns postId containing mock', async () => {
    facebookPublisher.publishPhoto = async () => ({
      success: true,
      platform: 'facebook',
      postId: 'mock_post_999'
    });

    const item = createFixtureQueueItem({
      destinationId: 'dest_jaisalmer',
      targets: ['facebook']
    });
    db.addToQueue(item);

    const result = await scheduler.dispatchSingleQueueItem(item);

    assert.strictEqual(result.status, 'failed', 'Item must be marked failed when postId contains mock');
    assert.strictEqual(result.publishResults[0].status, 'failed');
    assert.ok(result.publishResults[0].error.includes('simulated response'), 'Failure reason must cite simulated rejection');
    assert.strictEqual(notifyPublishedCalls.length, 0);
    assert.strictEqual(notifyErrorCalls.length, 1);
  });

  it('4c. isSimulated Flag Rejection: strictly marks failed if publisher returns isSimulated: true', async () => {
    facebookPublisher.publishPhoto = async () => ({
      success: true,
      isSimulated: true,
      platform: 'facebook',
      postId: 'fb_post_real_looking_123'
    });

    const item = createFixtureQueueItem({
      destinationId: 'dest_jaisalmer',
      targets: ['facebook']
    });
    db.addToQueue(item);

    const result = await scheduler.dispatchSingleQueueItem(item);

    assert.strictEqual(result.status, 'failed', 'Item must be marked failed when isSimulated is true');
    assert.strictEqual(result.publishResults[0].status, 'failed');
    assert.ok(result.publishResults[0].error.includes('simulated response'), 'Failure reason must cite simulated rejection');
    assert.strictEqual(notifyPublishedCalls.length, 0);
    assert.strictEqual(notifyErrorCalls.length, 1);
  });

  it('5. Missing Post ID Rejection: strictly marks failed if publisher response lacks postId/URL', async () => {
    facebookPublisher.publishPhoto = async () => ({
      success: true,
      simulated: false,
      platform: 'facebook'
      // Missing postId and URL
    });

    const item = createFixtureQueueItem({
      destinationId: 'dest_jaisalmer',
      targets: ['facebook']
    });
    db.addToQueue(item);

    const result = await scheduler.dispatchSingleQueueItem(item);

    assert.strictEqual(result.status, 'failed');
    assert.strictEqual(result.publishResults[0].status, 'failed');
    assert.ok(result.publishResults[0].error.includes('missing authentic postId or URL'));
  });

  it('6. Skipped Channel Handling: marks published if active targets succeed and quora is skipped', async () => {
    facebookPublisher.publishPhoto = async () => ({
      success: true,
      simulated: false,
      platform: 'facebook',
      postId: 'fb_live_post_555'
    });

    const item = createFixtureQueueItem({
      destinationId: 'dest_jaisalmer',
      targets: ['facebook', 'quora']
    });
    db.addToQueue(item);

    const result = await scheduler.dispatchSingleQueueItem(item);

    assert.strictEqual(result.status, 'published');
    const fbRes = result.publishResults.find(r => r.platform === 'facebook');
    const quoraRes = result.publishResults.find(r => r.platform === 'quora');

    assert.ok(fbRes);
    assert.strictEqual(fbRes.status, 'published');
    assert.ok(quoraRes);
    assert.strictEqual(quoraRes.status, 'skipped');
    assert.ok(quoraRes.reason.includes('Quora operates in Assisted Copy/Paste mode'));

    assert.strictEqual(notifyPublishedCalls.length, 1);
  });

  it('7. Stalled Job Recovery: resets orphaned publishing items to queued on startup', () => {
    const stalledItem = createFixtureQueueItem({
      status: 'publishing',
      retryCount: 0
    });
    db.addToQueue(stalledItem);

    const recovered = scheduler.recoverOrphanedJobs(3);

    assert.strictEqual(recovered.length, 1);
    assert.strictEqual(recovered[0].id, stalledItem.id);
    assert.strictEqual(recovered[0].status, 'queued');
    assert.strictEqual(recovered[0].retryCount, 1);

    const updatedInDb = db.getQueueItem(stalledItem.id);
    assert.strictEqual(updatedInDb.status, 'queued');
    assert.strictEqual(updatedInDb.retryCount, 1);
    assert.ok(updatedInDb.recoveryNote.includes('Reset from stalled'));
  });

  it('8. Stalled Job Recovery Max Retries: marks failed when retryCount exceeds maxRetries', () => {
    const exhaustedItem = createFixtureQueueItem({
      status: 'publishing',
      retryCount: 3
    });
    db.addToQueue(exhaustedItem);

    const recovered = scheduler.recoverOrphanedJobs(3);

    assert.strictEqual(recovered.length, 1);
    assert.strictEqual(recovered[0].id, exhaustedItem.id);
    assert.strictEqual(recovered[0].status, 'failed');
    assert.strictEqual(recovered[0].retryCount, 4);

    const updatedInDb = db.getQueueItem(exhaustedItem.id);
    assert.strictEqual(updatedInDb.status, 'failed');
    assert.strictEqual(updatedInDb.retryCount, 4);
    assert.ok(updatedInDb.lastError.includes('Exceeded maximum recovery attempts'));
  });
});
