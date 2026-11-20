/**
 * Lexa Trip Social Media Automation System
 * Tier 1 Test Suite: Channel Tester Authenticity & Verification Coverage (F15)
 * 
 * Verifies authentic API testing across all 12 channels:
 * 1. Facebook
 * 2. Instagram
 * 3. YouTube
 * 4. Pinterest
 * 5. LinkedIn
 * 6. Telegram
 * 7. Blogger
 * 8. Threads
 * 9. Google Business Profile
 * 10. Twitter / X
 * 11. Reddit
 * 12. Quora (Assisted Mode Transparency)
 * 
 * Invariants:
 * - Elimination of all smart_ bypasses (throws explicit error on smart_ / synthetic tokens)
 * - Auto-detection of Meta Pages & Instagram Business accounts
 * - Auto-detection of Pinterest user boards
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const mockHttp = require('../helpers/mockHttp');
const {
  isolateDatabase,
  restoreDatabase,
  getValidCredentials,
  getInvalidCredentials
} = require('../helpers/testFixtures');

const channelTester = require('../../services/channelTester');

describe('Tier 1: Channel Tester Authenticity & Channel Verification', () => {
  beforeEach(() => {
    isolateDatabase();
    mockHttp.enable();
    mockHttp.reset();
    mockHttp.setupDefaultPlatformMocks();
  });

  afterEach(() => {
    mockHttp.disable();
    restoreDatabase();
  });

  // ==========================================
  // 1. Elimination of smart_ Bypasses
  // ==========================================
  describe('Purge of Simulated / Smart Bypasses', () => {
    it('rejects smart_ tokens on Facebook with explicit error', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('facebook', getInvalidCredentials('facebook', 'smart'));
        },
        (err) => {
          assert.match(err.message, /Synthetic\/smart credentials are not permitted/i);
          return true;
        }
      );
    });

    it('rejects isSmartConnect flag on Instagram with explicit error', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('instagram', { isSmartConnect: true, accessToken: 'smart_token_123' });
        },
        (err) => {
          assert.match(err.message, /Synthetic\/smart credentials are not permitted/i);
          return true;
        }
      );
    });

    it('rejects official_live_token on blog / website', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('website', {
            username: 'admin',
            applicationPassword: 'official_live_token'
          });
        },
        (err) => {
          assert.match(err.message, /Synthetic\/smart credentials are not permitted/i);
          return true;
        }
      );
    });

    it('throws error when credentials object is null or missing', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('facebook', null);
        },
        (err) => {
          assert.match(err.message, /No credentials provided/i);
          return true;
        }
      );
    });

    // Comprehensive synthetic / smart credential rejection across all 11 social platforms
    const syntheticPlatforms = [
      'facebook',
      'instagram',
      'youtube',
      'pinterest',
      'linkedin',
      'telegram',
      'blogger',
      'threads',
      'google_business',
      'twitter',
      'reddit'
    ];

    for (const platform of syntheticPlatforms) {
      it(`rejects synthetic/smart credentials on ${platform}`, async () => {
        await assert.rejects(
          async () => {
            await channelTester.testChannel(platform, { isSmartConnect: true, accessToken: 'smart_token' });
          },
          (err) => {
            assert.match(err.message, /Synthetic\/smart credentials are not permitted/i);
            return true;
          }
        );
      });
    }
  });

  // ==========================================
  // 2. Channel Verification Across Platforms
  // ==========================================
  describe('Authentic Channel Verification', () => {
    it('verifies Facebook Page credentials via Graph API', async () => {
      mockHttp.onGet(/graph\.facebook\.com\/v\d+\.\d+\/123456789012345/, {
        id: '123456789012345',
        name: 'Lexa Trip Facebook Page',
        fan_count: 5200
      });

      const result = await channelTester.testChannel('facebook', getValidCredentials('facebook'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'facebook');
      assert.strictEqual(result.accountName, 'Lexa Trip Facebook Page');
      assert.ok(result.details.includes('5200'));

      const req = mockHttp.findRequest('graph.facebook.com', 'get');
      assert.ok(req);
    });

    it('verifies Instagram Business account via Graph API', async () => {
      mockHttp.onGet(/graph\.facebook\.com\/v\d+\.\d+\/17841400000000/, {
        id: '17841400000000',
        name: 'Lexa Trip Instagram',
        username: 'lexatripjaisalmer',
        followers_count: 12500,
        profile_picture_url: 'https://example.com/ig.jpg'
      });

      const result = await channelTester.testChannel('instagram', getValidCredentials('instagram'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'instagram');
      assert.strictEqual(result.accountName, 'Lexa Trip Instagram');
      assert.strictEqual(result.handle, '@lexatripjaisalmer');
      assert.ok(result.details.includes('12500'));
    });

    it('verifies YouTube channel via YouTube Data API v3', async () => {
      const result = await channelTester.testChannel('youtube', getValidCredentials('youtube'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'youtube');
      assert.strictEqual(result.accountName, 'Lexa Trip Official');
      assert.strictEqual(result.handle, '@lexatripofficial');
      assert.ok(result.details.includes('18500'));
    });

    it('verifies Pinterest account and destination board', async () => {
      const result = await channelTester.testChannel('pinterest', getValidCredentials('pinterest'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'pinterest');
      assert.strictEqual(result.accountName, '@Lexatripofficial');
      assert.ok(result.details.includes('LexaTrip Jaisalmer'));
    });

    it('verifies LinkedIn member / company credentials', async () => {
      const result = await channelTester.testChannel('linkedin', getValidCredentials('linkedin'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'linkedin');
      assert.strictEqual(result.accountName, 'Lexa Trip Founder');
      assert.strictEqual(result.handle, 'admin@lexatrip.com');
    });

    it('verifies Telegram alert bot token', async () => {
      const result = await channelTester.testChannel('telegram', getValidCredentials('telegram'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'telegram');
      assert.strictEqual(result.accountName, 'Lexa Trip Alert Bot');
      assert.strictEqual(result.handle, '@lexatrip_alert_bot');
    });

    it('verifies Google Blogger blog connection', async () => {
      const result = await channelTester.testChannel('blogger', getValidCredentials('blogger'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'blogger');
      assert.strictEqual(result.accountName, 'Lexa Trip Travel Blog');
      assert.ok(result.details.includes('38'));
    });

    it('verifies Meta Threads account handle', async () => {
      const result = await channelTester.testChannel('threads', getValidCredentials('threads'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'threads');
      assert.strictEqual(result.accountName, 'Lexa Trip Threads');
      assert.strictEqual(result.handle, 'threads.net/@lexatripjaisalmer');
    });

    it('verifies Google Business Profile connection', async () => {
      const result = await channelTester.testChannel('google_business', getValidCredentials('google_business'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'google_business');
      assert.strictEqual(result.accountName, 'Lexa Trip Business Profile');
      assert.strictEqual(result.handle, 'locations/1234567890123456789');
    });

    it('verifies Twitter / X API v2 credentials', async () => {
      const result = await channelTester.testChannel('twitter', getValidCredentials('twitter'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'twitter');
      assert.strictEqual(result.accountName, 'Lexa Trip Official');
      assert.strictEqual(result.handle, '@LexaTrip');
    });

    it('verifies Reddit account connection via OAuth2 identity', async () => {
      const result = await channelTester.testChannel('reddit', getValidCredentials('reddit'));

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'reddit');
      assert.strictEqual(result.accountName, 'LexaTripOfficial');
      assert.strictEqual(result.handle, 'u/LexaTripOfficial');
    });

    it('verifies Quora operates with transparency in assisted copy/paste mode', async () => {
      const result = await channelTester.testChannel('quora', {
        name: 'Lexa Trip Desert Space',
        spaceUrl: 'https://lexatripdesert.quora.com'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.platform, 'quora');
      assert.strictEqual(result.isAssisted, true);
      assert.strictEqual(result.accountName, 'Lexa Trip Desert Space');
      assert.ok(result.details.includes('Assisted Copy/Paste mode'));
    });
  });

  // ==========================================
  // 3. Auto-Detect Features
  // ==========================================
  describe('Auto-Detection Utilities', () => {
    it('detectMetaAccounts: auto-detects Facebook Pages and linked Instagram accounts', async () => {
      const result = await channelTester.detectMetaAccounts('valid_meta_master_token_123');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.pages.length, 1);
      assert.strictEqual(result.pages[0].pageId, '123456789');
      assert.strictEqual(result.pages[0].pageName, 'Lexa Trip Facebook Page');
      assert.strictEqual(result.pages[0].hasInstagram, true);
      assert.strictEqual(result.pages[0].instagram.username, 'lexatripjaisalmer');
      assert.ok(result.masterToken);
    });

    it('detectPinterestBoards: auto-detects user profile and destination boards', async () => {
      const result = await channelTester.detectPinterestBoards('valid_pinterest_master_token_123');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.user.username, 'Lexatripofficial');
      assert.strictEqual(result.user.accountType, 'BUSINESS');
      assert.strictEqual(result.boards.length, 1);
      assert.strictEqual(result.boards[0].id, '1131740650051300286');
      assert.strictEqual(result.boards[0].name, 'LexaTrip Jaisalmer');
    });
  });
});
