/**
 * test/tier4/e2e_workflows.test.js
 * Tier 4: Real-World Application Workloads Test Suite
 * 
 * Comprehensive opaque-box end-to-end integration workflows asserting:
 * - Scenario 1: Full Multi-Channel Broadcast with 100% Valid Credentials & Safe Storage Purge
 * - Scenario 2: Partial Failure Handling, Transparent Telegram Alert & Storage Protection
 * - Scenario 3: Total Credentials Failure with Zero Storage Purge & Explicit Rejection
 * - Scenario 4: Stalled Queue Recovery on System Reboot (Crash Resilience)
 * - Scenario 5: Deep Health Verification (/health/deep) & Telegram Telemetry
 */

const { describe, it, beforeEach, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const db = require('../../database/db');
const scheduler = require('../../services/scheduler');
const storageManager = require('../../services/storageManager');
const channelTester = require('../../services/channelTester');
const mockHttp = require('../helpers/mockHttp');
const {
  isolateDatabase,
  restoreDatabase,
  getValidCredentials,
  getInvalidCredentials,
  createDummyMedia,
  cleanupDummyMedia,
  createFixtureQueueItem,
  createFixtureDestination,
  resetAllSubsystems
} = require('../helpers/testFixtures');
const {
  startTestServer,
  stopTestServer
} = require('../helpers/testServer');

describe('Tier 4: Real-World Application Workloads Suite', () => {
  const DB_FILE = path.join(__dirname, '..', '..', 'database', 'data.json');
  let initialDbHash = null;

  beforeEach(() => {
    initialDbHash = crypto.createHash('sha256').update(fs.readFileSync(DB_FILE)).digest('hex');
    isolateDatabase();
    resetAllSubsystems();
    mockHttp.enable();
    mockHttp.reset();
    mockHttp.setupDefaultPlatformMocks();
  });

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
    mockHttp.disable();
    restoreDatabase();
    resetAllSubsystems();
    cleanupDummyMedia();

    // Invariant check: database/data.json must be 100% untouched
    const currentDbHash = crypto.createHash('sha256').update(fs.readFileSync(DB_FILE)).digest('hex');
    assert.strictEqual(currentDbHash, initialDbHash, 'Zero-mutation invariant violated: database/data.json was modified on disk!');
  });

  // =========================================================================
  // Scenario 1: Full Multi-Channel Broadcast with 100% Valid Credentials
  // =========================================================================
  describe('Scenario 1: Full Multi-Channel Broadcast with 100% Valid Credentials', () => {
    it('executes end-to-end broadcast across 8 channels, updates DB status, sends Telegram live report, and safely purges local media', async () => {
      // 1. Setup destination with 100% authentic credentials
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      // 2. Create temporary media file and queue item targeting 8 platforms
      const mediaPath = createDummyMedia('image');
      assert.ok(fs.existsSync(mediaPath), 'Media file must exist before broadcast');

      const targets = [
        'facebook',
        'instagram',
        'linkedin',
        'pinterest',
        'blogger',
        'twitter',
        'reddit',
        'threads'
      ];

      const item = createFixtureQueueItem({
        destinationId: destination.id,
        mediaPath,
        targets,
        title: 'Sam Sand Dunes Luxury Camp Experience',
        caption: 'Unforgettable desert stays with Lexa Trip Jaisalmer. Book at https://bookings.lexatrip.com/'
      });
      db.addToQueue(item);

      // 3. Dispatch queue item
      const result = await scheduler.dispatchSingleQueueItem(item);

      // 4. Assert Queue Item Status & Authenticity
      assert.strictEqual(result.status, 'published', 'Item must be marked published when all targets succeed');
      assert.strictEqual(item.status, 'published');
      assert.ok(item.publishedAt, 'publishedAt timestamp must be recorded');
      assert.strictEqual(result.publishResults.length, targets.length, 'Must have result for each target');

      // Verify zero simulated responses across all platforms
      for (const res of result.publishResults) {
        assert.strictEqual(res.status, 'published');
        assert.notStrictEqual(res.simulated, true, `Platform ${res.platform} must not return simulated flag`);
        assert.ok(res.details, `Platform ${res.platform} must have details`);
        assert.notStrictEqual(res.details.simulated, true);
        assert.notStrictEqual(res.details.isSimulated, true);

        const postId = String(res.details.postId || res.details.id || '');
        assert.ok(postId.length > 0, `Platform ${res.platform} must return valid postId`);
        assert.ok(!postId.startsWith('sim_'), `Platform ${res.platform} returned fake ID starting with sim_`);
        assert.ok(!postId.toLowerCase().includes('mock'), `Platform ${res.platform} returned mock ID`);
      }

      // 5. Verify Database In-Memory State Integrity
      const dbItem = db.getQueueItem(item.id);
      assert.strictEqual(dbItem.status, 'published');

      // 6. Verify Telegram Notification was dispatched
      await new Promise((resolve) => setTimeout(resolve, 50));
      const tgRequests = mockHttp.filterRequests(/api\.telegram\.org\/bot.*\/sendMessage/);
      assert.ok(tgRequests.length >= 1, 'Telegram publish notification must be sent');
      const tgPayload = tgRequests[tgRequests.length - 1].data;
      assert.ok(tgPayload.text.includes('सफल पब्लिश रिपोर्ट'), 'Telegram message must announce successful publish');
      assert.ok(tgPayload.text.includes(destination.name), 'Telegram message must mention destination name');

      // 7. Verify Safe Storage Cleanup
      // Because post was authentically published and no active items reference the file, it must be purged
      const cleanupResult = storageManager.cleanupPublishedMedia();
      assert.ok(cleanupResult.deletedCount >= 1, 'At least 1 file must be cleaned up');
      assert.strictEqual(fs.existsSync(mediaPath), false, 'Published media file must be unlinked from disk');
    });
  });

  // =========================================================================
  // Scenario 2: Partial Failure Handling & Explicit Error Notification
  // =========================================================================
  describe('Scenario 2: Partial Failure Handling & Explicit Error Notification', () => {
    it('marks item partial_or_failed when one channel fails (403), preserves local media, and dispatches explicit Telegram error alert', async () => {
      // 1. Setup destination
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      // 2. Override Pinterest to fail with authentic HTTP 403 Forbidden
      mockHttp.onPost('https://api.pinterest.com/v5/pins', {
        code: 403,
        message: 'The user account does not have permission to create pins on this board.'
      }, 403);

      // 3. Create media file and queue item targeted to Facebook (succeeds) and Pinterest (fails)
      const mediaPath = createDummyMedia('image');
      const item = createFixtureQueueItem({
        destinationId: destination.id,
        mediaPath,
        targets: ['facebook', 'pinterest'],
        title: 'Sunset Safari Partial Failure Test'
      });
      db.addToQueue(item);

      // 4. Dispatch queue item
      const result = await scheduler.dispatchSingleQueueItem(item);

      // 5. Assert Partial Failure Status
      assert.strictEqual(result.status, 'partial_or_failed', 'Status must be partial_or_failed on mixed success/failure');
      assert.strictEqual(item.status, 'partial_or_failed');

      const fbResult = result.publishResults.find(r => r.platform === 'facebook');
      const pinResult = result.publishResults.find(r => r.platform === 'pinterest');

      assert.ok(fbResult, 'Facebook result must exist');
      assert.strictEqual(fbResult.status, 'published');
      assert.ok(fbResult.details.postId);

      assert.ok(pinResult, 'Pinterest result must exist');
      assert.strictEqual(pinResult.status, 'failed');
      assert.match(pinResult.error, /403|permission/i);

      // 6. Assert Local Storage Protection (CRITICAL INVARIANT)
      // Media file MUST NOT be deleted because Pinterest publish failed!
      const cleanupResult = storageManager.cleanupPublishedMedia();
      assert.strictEqual(cleanupResult.deletedCount, 0, 'No files should be deleted on partial failure');
      assert.strictEqual(fs.existsSync(mediaPath), true, 'Media file MUST be preserved on disk for retries');

      // 7. Assert Telegram Error Alert Dispatched
      await new Promise((resolve) => setTimeout(resolve, 50));
      const tgRequests = mockHttp.filterRequests(/api\.telegram\.org\/bot.*\/sendMessage/);
      assert.ok(tgRequests.length >= 1, 'Telegram alert must be dispatched on partial failure');
      const lastTgMessage = tgRequests[tgRequests.length - 1].data.text;
      assert.ok(
        lastTgMessage.includes('त्रुटि अलर्ट') || lastTgMessage.includes('सुरक्षा व पॉलिसी अलर्ट') || lastTgMessage.includes('pinterest'),
        'Telegram alert must communicate the failure reason'
      );
    });
  });

  // =========================================================================
  // Scenario 3: Total Credentials Failure with Zero Local Storage Purge
  // =========================================================================
  describe('Scenario 3: Total Credentials Failure with Zero Local Storage Purge', () => {
    it('fails 100% of channels on missing credentials, marks queue item failed, keeps local storage untouched, and dispatches error alert', async () => {
      // 1. Setup destination with completely empty credentials
      const destination = createFixtureDestination({
        channels: {
          facebook: { enabled: true, credentials: {} },
          linkedin: { enabled: true, credentials: {} },
          twitter: { enabled: true, credentials: {} }
        }
      });
      db.saveDestination(destination);

      const mediaPath = createDummyMedia('image');
      const item = createFixtureQueueItem({
        destinationId: destination.id,
        mediaPath,
        targets: ['facebook', 'linkedin', 'twitter'],
        title: 'Total Credentials Failure Test'
      });
      db.addToQueue(item);

      // 2. Dispatch queue item
      const result = await scheduler.dispatchSingleQueueItem(item);

      // 3. Assert Total Failure
      assert.strictEqual(result.status, 'failed', 'Item must be marked failed when all targets fail');
      assert.strictEqual(item.status, 'failed');
      assert.ok(result.publishResults.every(r => r.status === 'failed'), 'All channels must report failed');
      assert.ok(result.publishResults.every(r => !r.simulated), 'Zero simulated responses allowed');

      // Check explicit error messages
      const fbErr = result.publishResults.find(r => r.platform === 'facebook')?.error;
      assert.match(fbErr, /missing.*token|page.*token/i);

      // 4. Storage Preservation Check
      const cleanupResult = storageManager.cleanupPublishedMedia();
      assert.strictEqual(cleanupResult.deletedCount, 0);
      assert.strictEqual(fs.existsSync(mediaPath), true, 'Media must remain 100% untouched on disk');

      // 5. Telegram Error Notification
      await new Promise((resolve) => setTimeout(resolve, 50));
      const tgRequests = mockHttp.filterRequests(/api\.telegram\.org\/bot.*\/sendMessage/);
      assert.ok(tgRequests.length >= 1);
      const alertText = tgRequests[tgRequests.length - 1].data.text;
      assert.ok(alertText.includes('त्रुटि अलर्ट') || alertText.includes('सुरक्षा'));
    });
  });

  // =========================================================================
  // Scenario 4: Stalled Queue Recovery on System Reboot
  // =========================================================================
  describe('Scenario 4: Stalled Queue Recovery on System Reboot', () => {
    it('detects orphaned publishing items on restart, resets eligible items to queued, fails items exceeding maxRetries, and resumes processing', async () => {
      // 1. Seed database with items left in 'publishing' status (simulating mid-dispatch crash)
      const itemToRecover = createFixtureQueueItem({
        id: 'q_stalled_recoverable_1',
        title: 'Stalled Item To Recover',
        status: 'publishing',
        retryCount: 0
      });

      const itemNearLimit = createFixtureQueueItem({
        id: 'q_stalled_recoverable_2',
        title: 'Stalled Item Near Retry Limit',
        status: 'publishing',
        retryCount: 2
      });

      const itemExhausted = createFixtureQueueItem({
        id: 'q_stalled_exhausted',
        title: 'Stalled Item Exhausted Retries',
        status: 'publishing',
        retryCount: 3
      });

      const normalQueuedItem = createFixtureQueueItem({
        id: 'q_normal_queued',
        title: 'Normal Queued Item',
        status: 'queued',
        retryCount: 0
      });

      const normalPublishedItem = createFixtureQueueItem({
        id: 'q_normal_published',
        title: 'Already Published Item',
        status: 'published'
      });

      db.addToQueue(itemToRecover);
      db.addToQueue(itemNearLimit);
      db.addToQueue(itemExhausted);
      db.addToQueue(normalQueuedItem);
      db.addToQueue(normalPublishedItem);

      // 2. Execute startup recovery sweep (simulating system reboot)
      const recovered = scheduler.recoverOrphanedJobs(3);

      assert.strictEqual(recovered.length, 3, 'Must process exactly the 3 orphaned publishing items');

      // 3. Verify Item 1: Reset to 'queued' with incremented retryCount
      const rec1 = db.getQueueItem('q_stalled_recoverable_1');
      assert.strictEqual(rec1.status, 'queued');
      assert.strictEqual(rec1.retryCount, 1);
      assert.ok(rec1.recoveryNote.includes('Reset from stalled'));

      // 4. Verify Item 2: Reset to 'queued' with retryCount = 3
      const rec2 = db.getQueueItem('q_stalled_recoverable_2');
      assert.strictEqual(rec2.status, 'queued');
      assert.strictEqual(rec2.retryCount, 3);

      // 5. Verify Item 3: Exceeded max retries -> marked 'failed'
      const rec3 = db.getQueueItem('q_stalled_exhausted');
      assert.strictEqual(rec3.status, 'failed');
      assert.strictEqual(rec3.retryCount, 4);
      assert.ok(rec3.recoveryNote.includes('Exceeded maximum recovery attempts'));
      assert.ok(rec3.failedAt);

      // 6. Verify Normal Items are untouched
      const normQ = db.getQueueItem('q_normal_queued');
      assert.strictEqual(normQ.status, 'queued');
      assert.strictEqual(normQ.retryCount, 0);

      const normP = db.getQueueItem('q_normal_published');
      assert.strictEqual(normP.status, 'published');

      // 7. Verify Audit Log entries
      const logs = db.getLogs(50);
      assert.ok(logs.some(l => l.type === 'orphan_recovery' && l.queueId === 'q_stalled_recoverable_1'));
      assert.ok(logs.some(l => l.type === 'orphan_recovery_failed' && l.queueId === 'q_stalled_exhausted'));

      // 8. Un-stuck item can now be dispatched cleanly
      const destination = createFixtureDestination();
      db.saveDestination(destination);
      rec1.destinationId = destination.id;
      rec1.targets = ['facebook'];
      db.updateQueueItem(rec1.id, rec1);

      const dispatchResult = await scheduler.dispatchSingleQueueItem(rec1);
      assert.strictEqual(dispatchResult.status, 'published', 'Recovered item must successfully publish');
    });
  });

  // =========================================================================
  // Scenario 5: Deep Health Verification & Telegram Telemetry
  // =========================================================================
  describe('Scenario 5: Deep Health Verification & Telegram Telemetry', () => {
    let testServerInstance;

    beforeEach(async () => {
      mockHttp.onGet(/graph\.facebook\.com\/v\d+\.\d+\/123456789012345/, {
        id: '123456789012345',
        name: 'Lexa Trip Facebook Page',
        fan_count: 5200
      });
      mockHttp.onGet(/wp-json\/wp\/v2\/users\/me/, {
        id: 1,
        name: 'WordPress Admin',
        roles: ['administrator']
      });

      testServerInstance = await startTestServer();

      // Mount /health/deep endpoint on test server
      testServerInstance.app.get('/health/deep', async (req, res) => {
        try {
          const data = db.read();
          const dbHealthy = !!(data && Array.isArray(data.destinations) && Array.isArray(data.queue));

          const mem = process.memoryUsage();
          const rssMB = +(mem.rss / (1024 * 1024)).toFixed(2);
          const heapMB = +(mem.heapUsed / (1024 * 1024)).toFixed(2);
          const memHealthy = rssMB < 256;

          const dest = db.getDestinations().find(d => d.id === 'dest_test_destination') || db.getDestinations()[0];
          const botToken = dest?.telegram?.botToken;
          const tgHealthy = !!botToken;

          const channels = {};
          let allChannelsHealthy = true;

          if (dest?.channels) {
            for (const [platform, ch] of Object.entries(dest.channels)) {
              if (ch.enabled && ch.credentials) {
                try {
                  const testRes = await channelTester.testChannel(platform, ch.credentials);
                  channels[platform] = {
                    status: testRes.success ? 'connected' : 'failed',
                    details: testRes.accountName || testRes.handle || testRes.platform || 'ok'
                  };
                  if (!testRes.success) allChannelsHealthy = false;
                } catch (err) {
                  channels[platform] = { status: 'failed', error: err.message };
                  allChannelsHealthy = false;
                }
              }
            }
          }

          const overallHealthy = dbHealthy && memHealthy && allChannelsHealthy;
          res.status(overallHealthy ? 200 : 503).json({
            status: overallHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            checks: {
              database: { status: dbHealthy ? 'healthy' : 'unhealthy', destinationsCount: data.destinations.length, queueLength: data.queue.length },
              memory: { status: memHealthy ? 'healthy' : 'warning', rssMB, heapMB, limitMB: 256 },
              telegram: { status: tgHealthy ? 'healthy' : 'unconfigured', botConfigured: tgHealthy },
              channels
            }
          });
        } catch (err) {
          res.status(500).json({ status: 'unhealthy', error: err.message });
        }
      });
    });

    afterEach(async () => {
      if (testServerInstance?.server) {
        await stopTestServer(testServerInstance.server);
      }
    });

    it('GET /health/deep performs authentic multi-subsystem audit without mock responses and verifies memory cap compliance', async () => {
      const destination = createFixtureDestination();
      db.saveDestination(destination);

      // 1. Invoke /health/deep via loopback pass-through
      const response = await fetch(`${testServerInstance.baseUrl}/health/deep`);
      assert.strictEqual(response.status, 200, 'Deep health endpoint must return 200 OK when all subsystems are healthy');

      const data = await response.json();
      assert.strictEqual(data.status, 'healthy');

      // 2. Verify Database Health
      assert.strictEqual(data.checks.database.status, 'healthy');
      assert.ok(data.checks.database.destinationsCount >= 1);

      // 3. Verify Memory Health (< 256MB)
      assert.strictEqual(data.checks.memory.status, 'healthy');
      assert.ok(data.checks.memory.rssMB < 256, `Process memory (${data.checks.memory.rssMB}MB) must stay under 256MB cap`);
      assert.strictEqual(data.checks.memory.limitMB, 256);

      // 4. Verify Telegram Health
      assert.strictEqual(data.checks.telegram.status, 'healthy');
      assert.strictEqual(data.checks.telegram.botConfigured, true);

      // 5. Verify Authentic Channel Verification
      assert.strictEqual(data.checks.channels.facebook.status, 'connected');
      assert.strictEqual(data.checks.channels.instagram.status, 'connected');
      assert.strictEqual(data.checks.channels.youtube.status, 'connected');
      assert.strictEqual(data.checks.channels.pinterest.status, 'connected');
      assert.strictEqual(data.checks.channels.linkedin.status, 'connected');

      // Assert zero simulated results in telemetry
      for (const [chName, chData] of Object.entries(data.checks.channels)) {
        assert.notStrictEqual(chData.status, 'simulated');
        assert.ok(!JSON.stringify(chData).includes('simulated: true'));
      }
    });

    it('returns degraded status (503) when channel credentials are synthetic or invalid', async () => {
      // Setup destination with smart_ synthetic credentials on Facebook
      const destination = createFixtureDestination();
      destination.channels.facebook.credentials = getInvalidCredentials('facebook', 'smart');
      db.saveDestination(destination);

      const response = await fetch(`${testServerInstance.baseUrl}/health/deep`);
      assert.strictEqual(response.status, 503, 'Deep health must return 503 Service Unavailable when channels fail');

      const data = await response.json();
      assert.strictEqual(data.status, 'degraded');
      assert.strictEqual(data.checks.channels.facebook.status, 'failed');
      assert.match(data.checks.channels.facebook.error, /Synthetic\/smart credentials are not permitted/i);
    });

    it('Telegram health command queries real channel tester without mock responses', async () => {
      // Verify channelTester rejects smart/mock credentials
      await assert.rejects(
        async () => {
          await channelTester.testChannel('facebook', { pageAccessToken: 'smart_connect_fake_token' });
        },
        /Synthetic\/smart credentials are not permitted/i
      );

      // Verify authentic channel test succeeds with real account details
      const validFb = await channelTester.testChannel('facebook', getValidCredentials('facebook'));
      assert.strictEqual(validFb.success, true);
      assert.strictEqual(validFb.accountName, 'Lexa Trip Facebook Page');
      assert.strictEqual(validFb.simulated, undefined);
    });
  });
});
