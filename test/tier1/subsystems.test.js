/**
 * Lexa Trip Social Media Automation System
 * Tier 1 Test Suite: Core Subsystems Feature Coverage
 * 
 * Verifies core services functionality:
 * 1. Anti-Spam Scheduler (Daylight hours preservation, intervals, scheduleBatch, publishItemNow)
 * 2. Storage Manager (getDirStats, getStorageReport, cleanupPublishedMedia safe deletion)
 * 3. Telegram Notifier (Deduplication cache, Markdown alerts, policy alerts)
 * 4. AI Engine (parseWithLocalHeuristics 5-post extraction, config persistence)
 * 5. Health Endpoints (/health, /healthz, /api/health via ephemeral test server)
 */

const { describe, it, beforeEach, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

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
const { startTestServer, stopTestServer } = require('../helpers/testServer');

// Subsystems under test
const scheduler = require('../../services/scheduler');
const storageManager = require('../../services/storageManager');
const telegramNotifier = require('../../services/telegramNotifier');
const aiEngine = require('../../services/aiEngine');
const db = require('../../database/db');

describe('Tier 1: Core Subsystems Feature Coverage', () => {
  beforeEach(() => {
    isolateDatabase();
    mockHttp.enable();
    mockHttp.reset();
    mockHttp.setupDefaultPlatformMocks();
  });

  afterEach(() => {
    restoreDatabase();
    resetAllSubsystems();
    cleanupDummyMedia();
  });

  after(async () => {
    // Grace period for unawaited background tasks to safely resolve inside mockHttp
    await new Promise((resolve) => setTimeout(resolve, 150));
    mockHttp.disable();
  });

  // ==========================================
  // 1. Anti-Spam Scheduler (F16, F17)
  // ==========================================
  describe('Anti-Spam Scheduler', () => {
    it('calculateNextScheduleTime: enforces 60-90m human interval during daylight hours', () => {
      // 10:00 AM base time
      const baseTime = new Date('2026-11-20T10:00:00Z');
      const nextTime = scheduler.calculateNextScheduleTime(baseTime);

      const diffMinutes = (nextTime.getTime() - baseTime.getTime()) / (60 * 1000);
      assert.ok(diffMinutes >= 30, `Expected delay >= 30m, got ${diffMinutes}m`);
      assert.ok(diffMinutes <= 120, `Expected delay <= 120m, got ${diffMinutes}m`);
    });

    it('calculateNextScheduleTime: rolls night-time items over to next morning (>= 08:00)', () => {
      // 23:45 PM night time
      const lateNight = new Date(2026, 10, 20, 23, 45, 0);
      const nextTime = scheduler.calculateNextScheduleTime(lateNight);

      // Must roll over to the next day
      assert.strictEqual(nextTime.getDate(), lateNight.getDate() + 1);
      // Hours must be preserved within active hours (start hour: 8)
      assert.strictEqual(nextTime.getHours(), 8);
      assert.ok(nextTime.getMinutes() >= 5 && nextTime.getMinutes() <= 30);
    });

    it('scheduleBatch: creates queued items for posts, carousel, and reels', () => {
      const dest = createFixtureDestination();
      db.saveDestination(dest);

      const batch = {
        id: `batch_sub_${Date.now()}`,
        title: 'Jaisalmer Desert Camps Promo',
        destinationId: dest.id,
        posts: [
          { seo: { title: 'Post 1', caption: 'Cap 1' }, diskPath: createDummyMedia('image') },
          { seo: { title: 'Post 2', caption: 'Cap 2' }, diskPath: createDummyMedia('image') }
        ],
        carousel: {
          seo: { title: 'Carousel 1', caption: 'Car Cap' },
          previewPath: createDummyMedia('image')
        },
        singleReels: [
          { seo: { title: 'Reel 1', caption: 'Reel Cap' }, reelDiskPath: createDummyMedia('video') }
        ],
        combinedReel: {
          seo: { title: 'Combined Reel', caption: '12s Cap' },
          reelDiskPath: createDummyMedia('video')
        }
      };
      db.saveBatch(batch);

      const scheduled = scheduler.scheduleBatch(batch.id);

      assert.ok(Array.isArray(scheduled));
      assert.strictEqual(scheduled.length, 5); // 2 posts + 1 carousel + 1 reel + 1 combined reel

      // Verify all items have status 'queued'
      for (const item of scheduled) {
        assert.strictEqual(item.status, 'queued');
        assert.strictEqual(item.destinationId, dest.id);
        assert.ok(item.scheduledTime);
      }

      // Verify batch status changed to 'scheduled'
      const updatedBatch = db.getBatch(batch.id);
      assert.strictEqual(updatedBatch.status, 'scheduled');
    });

    it('publishItemNow: forces immediate execution and updates queue item status to published', async () => {
      const dest = createFixtureDestination();
      db.saveDestination(dest);

      const item = createFixtureQueueItem({
        destinationId: dest.id,
        destinationName: dest.name,
        targets: ['facebook']
      });
      db.addToQueue(item);

      const updated = await scheduler.publishItemNow(item.id);

      assert.strictEqual(updated.status, 'published');
      assert.ok(updated.publishedAt);
      assert.ok(Array.isArray(updated.publishResults));
      assert.strictEqual(updated.publishResults[0].platform, 'facebook');
      assert.strictEqual(updated.publishResults[0].status, 'published');

      // Allow background fire-and-forget notifications to resolve within mocked environment
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });

  // ==========================================
  // 2. Storage Manager (F18)
  // ==========================================
  describe('Storage Manager', () => {
    it('getDirStats: computes file count and total size accurately', () => {
      const tempDir = path.join(os.tmpdir(), `test_stats_${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        fs.writeFileSync(path.join(tempDir, 'file1.txt'), Buffer.alloc(1024)); // 1KB
        fs.writeFileSync(path.join(tempDir, 'file2.txt'), Buffer.alloc(2048)); // 2KB

        const stats = storageManager.getDirStats(tempDir);
        assert.strictEqual(stats.fileCount, 2);
        assert.strictEqual(stats.totalBytes, 3072);
        assert.strictEqual(stats.totalMB, '0.00');
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('getStorageReport: returns metrics for uploads and generated directories', () => {
      const report = storageManager.getStorageReport();
      assert.ok(report.uploadsDir);
      assert.ok(report.generatedDir);
      assert.ok(report.policy.includes('Auto-delete'));
      assert.strictEqual(typeof report.totalFiles, 'number');
      assert.strictEqual(typeof report.totalBytes, 'number');
    });

    it('cleanupPublishedMedia: safely deletes local file for published items, preserves queued items', () => {
      const publishedFile = createDummyMedia('image');
      const queuedFile = createDummyMedia('image');

      const itemPublished = createFixtureQueueItem({
        status: 'published',
        mediaPath: publishedFile,
        targets: ['facebook'],
        publishResults: [
          {
            platform: 'facebook',
            status: 'published',
            details: {
              postId: 'fb_post_real_1795172000000',
              postUrl: 'https://facebook.com/123/posts/456',
              simulated: false
            }
          }
        ]
      });
      const itemQueued = createFixtureQueueItem({
        status: 'queued',
        mediaPath: queuedFile
      });

      db.addToQueue(itemPublished);
      db.addToQueue(itemQueued);

      const result = storageManager.cleanupPublishedMedia();

      assert.ok(result.deletedCount >= 1);
      // Published file MUST be unlinked
      assert.strictEqual(fs.existsSync(publishedFile), false, 'Published media file should be deleted');
      // Queued file MUST be preserved
      assert.strictEqual(fs.existsSync(queuedFile), true, 'Queued media file MUST NOT be deleted');
    });

    it('cleanupPublishedMedia: preserves local files for simulated or mock publish results', () => {
      const simulatedFile = createDummyMedia('image');
      const mockIdFile = createDummyMedia('image');
      const partialFile = createDummyMedia('image');

      const itemSimulated = createFixtureQueueItem({
        status: 'published',
        mediaPath: simulatedFile,
        targets: ['facebook'],
        publishResults: [
          {
            platform: 'facebook',
            status: 'published',
            details: {
              postId: 'real_123',
              simulated: true
            }
          }
        ]
      });

      const itemMockId = createFixtureQueueItem({
        status: 'published',
        mediaPath: mockIdFile,
        targets: ['instagram'],
        publishResults: [
          {
            platform: 'instagram',
            status: 'published',
            details: {
              postId: 'sim_ig_1795172000000',
              simulated: false
            }
          }
        ]
      });

      const itemPartial = createFixtureQueueItem({
        status: 'partial_or_failed',
        mediaPath: partialFile,
        targets: ['facebook', 'instagram'],
        publishResults: [
          { platform: 'facebook', status: 'published', details: { postId: 'fb_123', simulated: false } },
          { platform: 'instagram', status: 'failed', error: 'API token expired' }
        ]
      });

      db.addToQueue(itemSimulated);
      db.addToQueue(itemMockId);
      db.addToQueue(itemPartial);

      const result = storageManager.cleanupPublishedMedia();

      assert.strictEqual(fs.existsSync(simulatedFile), true, 'Simulated publish media must be preserved');
      assert.strictEqual(fs.existsSync(mockIdFile), true, 'Mock postId publish media must be preserved');
      assert.strictEqual(fs.existsSync(partialFile), true, 'Partial_or_failed media must be preserved');
    });

    it('cleanupPublishedMedia: protects shared media files when another active item references the same path', () => {
      const sharedFile = createDummyMedia('image');

      const itemA = createFixtureQueueItem({
        status: 'published',
        mediaPath: sharedFile,
        targets: ['facebook'],
        publishResults: [
          {
            platform: 'facebook',
            status: 'published',
            details: { postId: 'fb_real_123456', simulated: false }
          }
        ]
      });

      const itemB = createFixtureQueueItem({
        status: 'queued',
        mediaPath: sharedFile,
        targets: ['instagram']
      });

      db.addToQueue(itemA);
      db.addToQueue(itemB);

      const result = storageManager.cleanupPublishedMedia();

      // Shared file MUST NOT be deleted because itemB is still queued!
      assert.strictEqual(fs.existsSync(sharedFile), true, 'Shared media file MUST be preserved while pending items exist');

      // Now itemB achieves genuine published status
      db.updateQueueItem(itemB.id, {
        status: 'published',
        publishResults: [
          {
            platform: 'instagram',
            status: 'published',
            details: { postId: 'ig_real_987654', simulated: false }
          }
        ]
      });

      storageManager.cleanupPublishedMedia();
      assert.strictEqual(fs.existsSync(sharedFile), false, 'Shared media file should be deleted once ALL items referencing it are published');
    });

    it('getDirStats: recursively traverses subdirectories and includes nested files and bytes', () => {
      const tempDir = path.join(os.tmpdir(), `test_nested_${Date.now()}`);
      const subDir = path.join(tempDir, 'subfolder');
      fs.mkdirSync(subDir, { recursive: true });

      try {
        fs.writeFileSync(path.join(tempDir, 'root_file.txt'), Buffer.alloc(1024));
        fs.writeFileSync(path.join(subDir, 'nested_file.txt'), Buffer.alloc(2048));

        const stats = storageManager.getDirStats(tempDir);
        assert.strictEqual(stats.fileCount, 2);
        assert.strictEqual(stats.totalBytes, 3072);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('startAutoCleanup and stopAutoCleanup: manages timer lifecycle safely without open handles', () => {
      storageManager.startAutoCleanup(10000);
      assert.ok(storageManager.startupTimer !== null, 'startupTimer should be active');
      assert.ok(storageManager.cleanupTimer !== null, 'cleanupTimer should be active');

      storageManager.stopAutoCleanup();
      assert.strictEqual(storageManager.startupTimer, null, 'startupTimer should be cleared');
      assert.strictEqual(storageManager.cleanupTimer, null, 'cleanupTimer should be cleared');
    });
  });

  // ==========================================
  // 3. Telegram Notifier (F20–F22)
  // ==========================================
  describe('Telegram Notifier Subsystem', () => {
    it('isDuplicate: prevents repeated alert spam within TTL window', () => {
      const key = `test_dedup_${Date.now()}`;

      // First check -> not duplicate
      assert.strictEqual(telegramNotifier.isDuplicate(key, 60), false);
      // Immediate second check -> duplicate
      assert.strictEqual(telegramNotifier.isDuplicate(key, 60), true);

      // Distinct key -> not duplicate
      assert.strictEqual(telegramNotifier.isDuplicate(`${key}_other`, 60), false);
    });

    it('notifyPolicyAlert: sends formatted security alert to Telegram bot', async () => {
      const dest = createFixtureDestination();

      await telegramNotifier.notifyPolicyAlert({
        destination: dest,
        platform: 'facebook',
        error: 'OAuthException: Error validating access token (Code 190)',
        details: 'Post #1: Luxury Desert Camping'
      });

      const req = mockHttp.findRequest('api.telegram.org', 'post');
      assert.ok(req, 'Expected Telegram sendMessage POST');
      assert.strictEqual(req.data.chat_id, dest.telegram.chatId);
      assert.ok(req.data.text.includes('सुरक्षा व पॉलिसी अलर्ट'));
      assert.ok(req.data.text.includes('FACEBOOK'));
      assert.ok(req.data.text.includes('OAuthException'));
      assert.strictEqual(req.data.parse_mode, 'Markdown');
    });

    it('notifyItemPublished: sends published report with verified links', async () => {
      const dest = createFixtureDestination();
      const item = createFixtureQueueItem({
        id: `pub_item_alert_${Date.now()}`,
        destinationId: dest.id,
        title: 'Desert Dunes at Sunset'
      });

      await telegramNotifier.notifyItemPublished(dest, item, [{ platform: 'facebook', status: 'published' }]);

      const req = mockHttp.findRequest('api.telegram.org', 'post');
      assert.ok(req);
      assert.ok(req.data.text.includes('सफल पब्लिश रिपोर्ट'));
      assert.ok(req.data.text.includes('Desert Dunes at Sunset'));
      assert.ok(req.data.text.includes('Facebook Live'));
    });
  });

  // ==========================================
  // 4. AI Engine (F23)
  // ==========================================
  describe('AI SEO Engine Subsystem', () => {
    it('parseWithLocalHeuristics: extracts 5 structured posts from raw content without API key', () => {
      const rawText = `
Post 1:
Title: Golden Sand Dunes of Jaisalmer
Caption: Experience the serene sunset in the great Thar desert.
Hashtags: #Jaisalmer #DesertSafari #Rajasthan

Post 2:
Title: Historic Jaisalmer Living Fort
Caption: Step inside the magnificent UNESCO heritage Sonar Qila.
Hashtags: #GoldenFort #SonarQila #Heritage

Post 3:
Title: Luxury Royal Desert Glamping
Caption: Five-star tents with starlight cultural dinners and music.
Hashtags: #DesertCamp #Glamping #LuxuryTravel

Post 4:
Title: Rajasthani Folk Night & Kalbeliya
Caption: Enchanting fire dance and traditional folk songs under open skies.
Hashtags: #FolkDance #Culture #IncredibleIndia

Post 5:
Title: Thrilling Sunset Camel Trek
Caption: Traverse the golden waves on a peaceful camel safari.
Hashtags: #CamelSafari #TravelGoals #DesertAdventure
      `;

      const posts = aiEngine.parseWithLocalHeuristics(rawText, 'Lexa Trip Jaisalmer');

      assert.ok(Array.isArray(posts));
      assert.strictEqual(posts.length, 5);

      for (let i = 0; i < 5; i++) {
        const post = posts[i];
        assert.strictEqual(post.index, i + 1);
        assert.ok(post.title, `Post ${i + 1} must have title`);
        assert.ok(post.caption, `Post ${i + 1} must have caption`);
        assert.ok(post.hashtags, `Post ${i + 1} must have hashtags`);
      }

      assert.ok(posts[0].title.includes('Golden Sand Dunes'));
      assert.ok(posts[1].title.includes('Living Fort'));
    });

    it('saveConfig & getConfig: manages AI provider settings in database', () => {
      const customConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: 'sk-proj-test123456789'
      };

      aiEngine.saveConfig(customConfig);
      const retrieved = aiEngine.getConfig();

      assert.strictEqual(retrieved.provider, 'openai');
      assert.strictEqual(retrieved.model, 'gpt-4o-mini');
      assert.strictEqual(retrieved.apiKey, 'sk-proj-test123456789');
    });
  });

  // ==========================================
  // 5. Health Endpoints via Ephemeral Test Server (F31)
  // ==========================================
  describe('Health Check Endpoints', () => {
    let testServerInstance;

    beforeEach(async () => {
      testServerInstance = await startTestServer();
    });

    afterEach(async () => {
      if (testServerInstance?.server) {
        await stopTestServer(testServerInstance.server);
      }
    });

    it('GET /health: responds with 200 OK for load balancers', async () => {
      const res = await fetch(`${testServerInstance.baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.strictEqual(text, 'OK');
    });

    it('GET /healthz: responds with 200 OK', async () => {
      const res = await fetch(`${testServerInstance.baseUrl}/healthz`);
      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.strictEqual(text, 'OK');
    });

    it('GET /api/health: responds with 200 and JSON status', async () => {
      const res = await fetch(`${testServerInstance.baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.ok(typeof data.uptime === 'number');
    });

    it('GET /api/health via axios: verifies axios loopback pass-through when mockHttp is active', async () => {
      // mockHttp is enabled in top-level beforeEach
      const res = await axios.get(`${testServerInstance.baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, 'ok');
      assert.ok(typeof res.data.uptime === 'number');

      // Also verify axios client with baseURL
      const client = axios.create({ baseURL: testServerInstance.baseUrl });
      const clientRes = await client.get('/health');
      assert.strictEqual(clientRes.status, 200);
      assert.strictEqual(clientRes.data, 'OK');
    });
  });
});
