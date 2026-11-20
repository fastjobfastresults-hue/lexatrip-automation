/**
 * Lexa Trip Social Media Automation System
 * Tier 2 Test Suite: Boundary & Corner Cases
 * 
 * Verifies edge cases, null/empty parameters, upstream API error status codes (401, 403, 429, 500, 503),
 * corrupt media paths, network timeouts, ChannelTester verification guards, and subsystem boundaries.
 * 
 * Invariants Enforced:
 * 1. Zero external network calls (pure mockHttp interception).
 * 2. Zero simulation fallbacks (simulated: true and mock IDs strictly rejected).
 * 3. Zero disk mutation of database/data.json (verified via SHA-256 before & after).
 * 4. Zero external test framework dependencies (native node:test and node:assert/strict).
 */

const { describe, it, beforeEach, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Helpers
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

// Publishers
const facebookPublisher = require('../../services/publishers/facebook');
const instagramPublisher = require('../../services/publishers/instagram');
const linkedinPublisher = require('../../services/publishers/linkedin');
const pinterestPublisher = require('../../services/publishers/pinterest');
const bloggerPublisher = require('../../services/publishers/blogger');
const youtubePublisher = require('../../services/publishers/youtube');
const twitterPublisher = require('../../services/publishers/twitter');
const redditPublisher = require('../../services/publishers/reddit');
const threadsPublisher = require('../../services/publishers/threads');
const googleBusinessPublisher = require('../../services/publishers/googleBusiness');
const blogPublisher = require('../../services/publishers/blog');
const customPublisher = require('../../services/publishers/custom');

// Subsystems
const channelTester = require('../../services/channelTester');
const scheduler = require('../../services/scheduler');
const storageManager = require('../../services/storageManager');
const telegramNotifier = require('../../services/telegramNotifier');
const db = require('../../database/db');
const tunnelService = require('../../services/tunnelService');

describe('Tier 2: Boundary & Corner Cases Test Suite', () => {
  const DB_FILE = path.join(__dirname, '..', '..', 'database', 'data.json');
  let initialDbHash = null;
  const zeroByteFiles = new Set();

  function createZeroByteMedia(ext = '.jpg') {
    const filename = `test_zero_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`;
    const tempPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempPath, Buffer.alloc(0));
    zeroByteFiles.add(tempPath);
    return tempPath;
  }

  function cleanupZeroByteMedia() {
    for (const f of zeroByteFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    }
    zeroByteFiles.clear();
  }

  beforeEach(() => {
    initialDbHash = crypto.createHash('sha256').update(fs.readFileSync(DB_FILE)).digest('hex');
    isolateDatabase();
    resetAllSubsystems();
    mockHttp.enable();
    mockHttp.reset();
    mockHttp.setupDefaultPlatformMocks();

    // Reset reddit cache to ensure fresh authentication checks
    redditPublisher.cachedToken = null;
    redditPublisher.tokenExpiresAt = 0;
  });

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
    mockHttp.disable();
    restoreDatabase();
    resetAllSubsystems();
    cleanupDummyMedia();
    cleanupZeroByteMedia();

    // Invariant check: database/data.json must be 100% untouched
    const currentDbHash = crypto.createHash('sha256').update(fs.readFileSync(DB_FILE)).digest('hex');
    assert.strictEqual(currentDbHash, initialDbHash, 'Zero-mutation invariant violated: database/data.json was modified on disk!');
  });

  // =========================================================================
  // SUITE 1: Missing, Null & Malformed Credentials Across Publishers
  // =========================================================================
  describe('1. Missing, Null & Malformed Credentials Across Publishers', () => {
    // 1.1 - 1.4: Facebook Photo
    it('1.1 Facebook Photo rejects null credentials', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await facebookPublisher.publishPhoto({ account: { credentials: null }, filePath: media, caption: 'Test' });
        },
        /pageAccessToken and pageId are required/i
      );
    });

    it('1.2 Facebook Photo rejects missing pageAccessToken', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await facebookPublisher.publishPhoto({ account: { credentials: { pageId: '12345' } }, filePath: media, caption: 'Test' });
        },
        /pageAccessToken and pageId are required/i
      );
    });

    it('1.3 Facebook Photo rejects missing pageId', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await facebookPublisher.publishPhoto({ account: { credentials: { pageAccessToken: 'tok' } }, filePath: media, caption: 'Test' });
        },
        /pageAccessToken and pageId are required/i
      );
    });

    it('1.4 Facebook Photo rejects smart_ token', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await facebookPublisher.publishPhoto({
            account: { credentials: { pageAccessToken: 'smart_token_123', pageId: '12345' } },
            filePath: media,
            caption: 'Test'
          });
        },
        /smart_ placeholder tokens cannot be used/i
      );
    });

    // 1.5 - 1.6: Facebook Reel
    it('1.5 Facebook Reel rejects null credentials', async () => {
      const media = createDummyMedia('video');
      await assert.rejects(
        async () => {
          await facebookPublisher.publishReel({ account: { credentials: null }, videoPath: media, caption: 'Test' });
        },
        /pageAccessToken and pageId are required/i
      );
    });

    it('1.6 Facebook Reel rejects smart_ token', async () => {
      const media = createDummyMedia('video');
      await assert.rejects(
        async () => {
          await facebookPublisher.publishReel({
            account: { credentials: { pageAccessToken: 'smart_reel_token', pageId: '12345' } },
            videoPath: media,
            caption: 'Test'
          });
        },
        /smart_ placeholder tokens cannot be used/i
      );
    });

    // 1.7 - 1.10: Instagram Image
    it('1.7 Instagram Image rejects null credentials', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await instagramPublisher.publishImage({ account: { credentials: null }, mediaPath: media, caption: 'Test' });
        },
        /accessToken and instagramAccountId are required/i
      );
    });

    it('1.8 Instagram Image rejects missing accessToken', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await instagramPublisher.publishImage({
            account: { credentials: { instagramAccountId: '178414000' } },
            mediaPath: media,
            caption: 'Test'
          });
        },
        /accessToken and instagramAccountId are required/i
      );
    });

    it('1.9 Instagram Image rejects missing accountId', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await instagramPublisher.publishImage({
            account: { credentials: { accessToken: 'valid_tok' } },
            mediaPath: media,
            caption: 'Test'
          });
        },
        /accessToken and instagramAccountId are required/i
      );
    });

    it('1.10 Instagram Image rejects smart_ token', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await instagramPublisher.publishImage({
            account: { credentials: { accessToken: 'smart_ig_token', instagramAccountId: '178414000' } },
            mediaPath: media,
            caption: 'Test'
          });
        },
        /smart_ placeholder tokens cannot be used/i
      );
    });

    // 1.11 - 1.12: Instagram Carousel & Reel credentials
    it('1.11 Instagram Carousel rejects null credentials', async () => {
      const media1 = createDummyMedia('image');
      const media2 = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await instagramPublisher.publishCarousel({
            account: { credentials: null },
            mediaPaths: [media1, media2],
            caption: 'Test'
          });
        },
        /accessToken and instagramAccountId are required/i
      );
    });

    it('1.12 Instagram Reel rejects null credentials', async () => {
      const media = createDummyMedia('video');
      await assert.rejects(
        async () => {
          await instagramPublisher.publishReel({ account: { credentials: null }, videoPath: media, caption: 'Test' });
        },
        /accessToken and instagramAccountId are required/i
      );
    });

    // 1.13 - 1.15: LinkedIn Post
    it('1.13 LinkedIn Post rejects null credentials', async () => {
      await assert.rejects(
        async () => {
          await linkedinPublisher.publishPost({ account: { credentials: null }, text: 'Test' });
        },
        /accessToken is required/i
      );
    });

    it('1.14 LinkedIn Post rejects smart_ token', async () => {
      await assert.rejects(
        async () => {
          await linkedinPublisher.publishPost({
            account: { credentials: { accessToken: 'smart_li_tok' } },
            text: 'Test'
          });
        },
        /smart_ placeholder tokens cannot be used/i
      );
    });

    it('1.15 LinkedIn Post rejects when author URN cannot be determined', async () => {
      mockHttp.onGet('https://api.linkedin.com/v2/userinfo', {}, 401);
      await assert.rejects(
        async () => {
          await linkedinPublisher.publishPost({
            account: { credentials: { accessToken: 'valid_tok_without_sub' } },
            text: 'Test'
          });
        },
        /unable to determine author URN/i
      );
    });

    // 1.16 - 1.18: Pinterest Pin
    it('1.16 Pinterest Pin rejects null credentials', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await pinterestPublisher.publishPin({ account: { credentials: null }, imageUrl: media, title: 'Pin' });
        },
        /accessToken and boardId are required/i
      );
    });

    it('1.17 Pinterest Pin rejects missing boardId', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await pinterestPublisher.publishPin({
            account: { credentials: { accessToken: 'valid_tok' } },
            imageUrl: media,
            title: 'Pin'
          });
        },
        /accessToken and boardId are required/i
      );
    });

    it('1.18 Pinterest Pin rejects smart_ token', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await pinterestPublisher.publishPin({
            account: { credentials: { accessToken: 'smart_pin_tok', boardId: 'board123' } },
            imageUrl: media,
            title: 'Pin'
          });
        },
        /smart_ placeholder tokens cannot be used/i
      );
    });

    // 1.19 - 1.21: Blogger Post
    it('1.19 Blogger Post rejects null credentials', async () => {
      await assert.rejects(
        async () => {
          await bloggerPublisher.publishPost({ account: { credentials: null }, title: 'Blog', caption: 'Text' });
        },
        /blogId and OAuth2 accessToken\/apiKey are required/i
      );
    });

    it('1.20 Blogger Post rejects missing apiKey/accessToken', async () => {
      await assert.rejects(
        async () => {
          await bloggerPublisher.publishPost({
            account: { credentials: { blogId: 'blog123' } },
            title: 'Blog',
            caption: 'Text'
          });
        },
        /blogId and OAuth2 accessToken\/apiKey are required/i
      );
    });

    it('1.21 Blogger Post rejects smart_ token', async () => {
      await assert.rejects(
        async () => {
          await bloggerPublisher.publishPost({
            account: { credentials: { blogId: 'blog123', apiKey: 'smart_blogger_key' } },
            title: 'Blog',
            caption: 'Text'
          });
        },
        /smart_ placeholder tokens cannot be used/i
      );
    });

    // 1.22 - 1.25: YouTube Short
    it('1.22 YouTube Short rejects null credentials', async () => {
      const media = createDummyMedia('video');
      await assert.rejects(
        async () => {
          await youtubePublisher.uploadShort({ account: { credentials: null }, videoPath: media, title: 'Short' });
        },
        /Missing OAuth 2\.0 Access Token|OAuth 2\.0 User Access Token required/i
      );
    });

    it('1.23 YouTube Short rejects smart_ token', async () => {
      const media = createDummyMedia('video');
      await assert.rejects(
        async () => {
          await youtubePublisher.uploadShort({
            account: { credentials: { accessToken: 'smart_yt_tok' } },
            videoPath: media,
            title: 'Short'
          });
        },
        /Synthetic 'smart_' tokens are not permitted/i
      );
    });

    it('1.24 YouTube Short rejects API key only (read-only key cannot upload)', async () => {
      const media = createDummyMedia('video');
      await assert.rejects(
        async () => {
          await youtubePublisher.uploadShort({
            account: { credentials: { apiKey: 'AIzaSy_fake_public_key' } },
            videoPath: media,
            title: 'Short'
          });
        },
        /cannot upload videos to YouTube/i
      );
    });

    it('1.25 YouTube Short rejects when token refresh fails', async () => {
      mockHttp.onPost('https://oauth2.googleapis.com/token', { error: 'invalid_grant' }, 400);
      const media = createDummyMedia('video');
      await assert.rejects(
        async () => {
          await youtubePublisher.uploadShort({
            account: { credentials: { refreshToken: 'ref_tok', clientId: 'cid', clientSecret: 'cs' } },
            videoPath: media,
            title: 'Short'
          });
        },
        /Missing OAuth 2\.0 Access Token/i
      );
    });

    // 1.26 - 1.28: Twitter / X
    it('1.26 Twitter Tweet rejects null credentials', async () => {
      await assert.rejects(
        async () => {
          await twitterPublisher.publishTweet({ account: { credentials: null }, text: 'Tweet' });
        },
        /Twitter credentials missing/i
      );
    });

    it('1.27 Twitter Tweet rejects incomplete OAuth 1.0a credentials', async () => {
      await assert.rejects(
        async () => {
          await twitterPublisher.publishTweet({
            account: { credentials: { apiKey: 'tw_key_only' } },
            text: 'Tweet'
          });
        },
        /Twitter credentials incomplete/i
      );
    });

    it('1.28 Twitter Tweet rejects smart_ token', async () => {
      await assert.rejects(
        async () => {
          await twitterPublisher.publishTweet({
            account: { credentials: { bearerToken: 'smart_tw_token' } },
            text: 'Tweet'
          });
        },
        /Synthetic 'smart_' tokens are not permitted/i
      );
    });

    // 1.29 - 1.30: Reddit Submit
    it('1.29 Reddit Submit rejects null credentials', async () => {
      await assert.rejects(
        async () => {
          await redditPublisher.submitPost({ account: { credentials: null }, title: 'Reddit Title', text: 'Body' });
        },
        /Missing Reddit credentials/i
      );
    });

    it('1.30 Reddit Submit rejects smart_ token in credentials', async () => {
      await assert.rejects(
        async () => {
          await redditPublisher.submitPost({
            account: {
              credentials: { clientId: 'smart_client', clientSecret: 'secret', username: 'user', password: 'pwd' }
            },
            title: 'Reddit Title',
            text: 'Body'
          });
        },
        /smart_ placeholder tokens cannot be used/i
      );
    });

    // 1.31 - 1.32: Threads Post
    it('1.31 Threads Post rejects null credentials', async () => {
      await assert.rejects(
        async () => {
          await threadsPublisher.publishPost({ account: { credentials: null }, text: 'Threads post' });
        },
        /accessToken is required/i
      );
    });

    it('1.32 Threads Post rejects smart_ token', async () => {
      await assert.rejects(
        async () => {
          await threadsPublisher.publishPost({
            account: { credentials: { accessToken: 'smart_threads_tok' } },
            text: 'Threads post'
          });
        },
        /smart_ placeholder tokens cannot be used/i
      );
    });

    // 1.33 - 1.34: Google Business Profile
    it('1.33 Google Business rejects null credentials', async () => {
      await assert.rejects(
        async () => {
          await googleBusinessPublisher.publishPost({ account: { credentials: null }, title: 'GMB Post' });
        },
        /accessToken and locationId are required/i
      );
    });

    it('1.34 Google Business rejects smart_ token', async () => {
      await assert.rejects(
        async () => {
          await googleBusinessPublisher.publishPost({
            account: { credentials: { accessToken: 'smart_gmb_tok', locationId: 'locations/123' } },
            title: 'GMB Post'
          });
        },
        /smart_ placeholder tokens cannot be used/i
      );
    });

    // 1.35 - 1.37: WordPress / Blog
    it('1.35 WordPress article rejects null credentials', async () => {
      await assert.rejects(
        async () => {
          await blogPublisher.publishArticle({ account: { credentials: null }, title: 'Article', content: 'Body' });
        },
        /username and applicationPassword are required/i
      );
    });

    it('1.36 WordPress article rejects official_live_token placeholder', async () => {
      await assert.rejects(
        async () => {
          await blogPublisher.publishArticle({
            account: { credentials: { username: 'admin', applicationPassword: 'official_live_token' } },
            title: 'Article',
            content: 'Body'
          });
        },
        /placeholder tokens cannot be used/i
      );
    });

    it('1.37 WordPress article rejects smart_ token', async () => {
      await assert.rejects(
        async () => {
          await blogPublisher.publishArticle({
            account: { credentials: { username: 'admin', applicationPassword: 'smart_wp_pass' } },
            title: 'Article',
            content: 'Body'
          });
        },
        /placeholder tokens cannot be used/i
      );
    });

    // 1.38 - 1.39: Custom Webhook
    it('1.38 Custom Webhook rejects missing endpointUrl', async () => {
      await assert.rejects(
        async () => {
          await customPublisher.publish({ account: { credentials: {} }, payload: { test: true } });
        },
        /endpointUrl is missing/i
      );
    });

    it('1.39 Custom Webhook rejects smart_ endpointUrl or authToken', async () => {
      await assert.rejects(
        async () => {
          await customPublisher.publish({
            account: { credentials: { endpointUrl: 'smart_url_endpoint' } },
            payload: { test: true }
          });
        },
        /smart_ placeholder tokens cannot be used/i
      );
    });
  });

  // =========================================================================
  // SUITE 2: Upstream API Error Status Codes (401, 403, 429, 500, 503)
  // =========================================================================
  describe('2. Upstream API Error Status Codes (401, 403, 429, 500, 503)', () => {
    it('2.1 Facebook Photo 401 Session Expired fails explicitly without simulation', async () => {
      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/photos/, {
        error: { message: 'Session has expired.', type: 'OAuthException', code: 190 }
      }, 401);

      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await facebookPublisher.publishPhoto({
            account: { credentials: getValidCredentials('facebook') },
            filePath: media,
            caption: 'Safari'
          });
        },
        /Session has expired/i
      );
    });

    it('2.2 Instagram Image 401 Invalid Token fails explicitly', async () => {
      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/media$/, {
        error: { message: 'Invalid OAuth access token.', code: 190 }
      }, 401);

      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await instagramPublisher.publishImage({
            account: { credentials: getValidCredentials('instagram') },
            mediaPath: media,
            caption: 'Desert sunset'
          });
        },
        /Invalid OAuth access token/i
      );
    });

    it('2.3 LinkedIn Post 401 Expired Token fails explicitly', async () => {
      mockHttp.onPost('https://api.linkedin.com/rest/posts', {
        message: 'Expired access token',
        status: 401
      }, 401);

      await assert.rejects(
        async () => {
          await linkedinPublisher.publishPost({
            account: { credentials: getValidCredentials('linkedin') },
            text: 'B2B Tourism update'
          });
        },
        /Expired access token/i
      );
    });

    it('2.4 Twitter Tweet 401 Unauthorized fails explicitly', async () => {
      mockHttp.onPost('https://api.twitter.com/2/tweets', {
        title: 'Unauthorized',
        detail: 'Invalid or expired token.'
      }, 401);

      await assert.rejects(
        async () => {
          await twitterPublisher.publishTweet({
            account: { credentials: getValidCredentials('twitter') },
            text: 'Live tweet'
          });
        },
        /Unauthorized|Invalid or expired token/i
      );
    });

    it('2.5 Facebook Photo 403 Missing Permission (requires pages_manage_posts)', async () => {
      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/photos/, {
        error: { message: 'Permissions error: (#200) Requires pages_manage_posts.', code: 200 }
      }, 403);

      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await facebookPublisher.publishPhoto({
            account: { credentials: getValidCredentials('facebook') },
            filePath: media,
            caption: 'Permission check'
          });
        },
        /Requires pages_manage_posts/i
      );
    });

    it('2.6 YouTube 403 Upload Limit Exceeded fails explicitly', async () => {
      mockHttp.onPost(/www\.googleapis\.com\/upload\/youtube\/v3\/videos/, {
        error: { code: 403, message: 'Upload limit exceeded.', errors: [{ reason: 'uploadLimitExceeded' }] }
      }, 403);

      const media = createDummyMedia('video');
      await assert.rejects(
        async () => {
          await youtubePublisher.uploadShort({
            account: { credentials: getValidCredentials('youtube') },
            videoPath: media,
            title: 'Exceeded Short'
          });
        },
        /Upload limit exceeded|uploadLimitExceeded/i
      );
    });

    it('2.7 Pinterest 403 Forbidden Board Access fails explicitly', async () => {
      mockHttp.onPost('https://api.pinterest.com/v5/pins', {
        code: 403,
        message: 'User does not have permission to pin to this board.'
      }, 403);

      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await pinterestPublisher.publishPin({
            account: { credentials: getValidCredentials('pinterest') },
            imageUrl: media,
            title: 'Desert pin'
          });
        },
        /permission/i
      );
    });

    it('2.8 WordPress 403 REST Forbidden fails explicitly', async () => {
      mockHttp.onPost('https://lexatrip.com/wp-json/wp/v2/posts', {
        code: 'rest_cannot_create',
        message: 'Sorry, you are not allowed to create posts as this user.'
      }, 403);

      await assert.rejects(
        async () => {
          await blogPublisher.publishArticle({
            account: { credentials: getValidCredentials('blog') },
            title: 'Heritage Post',
            content: 'Body text'
          });
        },
        /rest_cannot_create|not allowed/i
      );
    });

    it('2.9 Twitter Tweet 429 Rate Limit Exceeded fails explicitly', async () => {
      mockHttp.onPost('https://api.twitter.com/2/tweets', {
        title: 'Too Many Requests',
        detail: 'Rate limit exceeded for endpoint.'
      }, 429);

      await assert.rejects(
        async () => {
          await twitterPublisher.publishTweet({
            account: { credentials: getValidCredentials('twitter') },
            text: 'Rate limited tweet'
          });
        },
        /Rate limit exceeded|Too Many Requests/i
      );
    });

    it('2.10 Reddit 429 Rate Limit Array in response triggers explicit error', async () => {
      mockHttp.onPost('https://oauth.reddit.com/api/submit', {
        json: { errors: [['RATELIMIT', 'Take a break for 10 minutes', 'ratelimit']] }
      });

      await assert.rejects(
        async () => {
          await redditPublisher.submitPost({
            account: { credentials: getValidCredentials('reddit') },
            title: 'Reddit rate limit test',
            text: 'Body'
          });
        },
        /RATELIMIT/i
      );
    });

    it('2.11 Facebook 429 Request Limit Reached fails explicitly', async () => {
      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/videos/, {
        error: { message: 'Application request limit reached.', code: 4 }
      }, 429);

      const media = createDummyMedia('video');
      await assert.rejects(
        async () => {
          await facebookPublisher.publishReel({
            account: { credentials: getValidCredentials('facebook') },
            videoPath: media,
            caption: 'Reel rate limited'
          });
        },
        /request limit reached/i
      );
    });

    it('2.12 Blogger 500 Internal Backend Error fails explicitly', async () => {
      mockHttp.onPost(/www\.googleapis\.com\/blogger\/v3\/blogs\/.*\/posts/, {
        error: { code: 500, message: 'Backend Error encountered in Blogger cluster.' }
      }, 500);

      await assert.rejects(
        async () => {
          await bloggerPublisher.publishPost({
            account: { credentials: getValidCredentials('blogger') },
            title: 'Blogger Title',
            caption: 'Body'
          });
        },
        /Backend Error/i
      );
    });

    it('2.13 Custom Webhook 500 Internal Error fails explicitly', async () => {
      mockHttp.onPost('https://api.example.com/social/webhook', {
        status: 'error',
        error: 'Database transaction timeout on external receiver.'
      }, 500);

      await assert.rejects(
        async () => {
          await customPublisher.publish({
            account: { credentials: getValidCredentials('custom') },
            payload: { message: 'test' }
          });
        },
        /transaction timeout/i
      );
    });

    it('2.14 Threads 503 Service Unavailable fails explicitly', async () => {
      mockHttp.onPost(/graph\.threads\.net\/v1\.0\/.*\/threads$/, {
        error: { message: 'Meta Threads service temporarily unavailable for maintenance.' }
      }, 503);

      await assert.rejects(
        async () => {
          await threadsPublisher.publishPost({
            account: { credentials: getValidCredentials('threads') },
            text: 'Threads maintenance test'
          });
        },
        /temporarily unavailable/i
      );
    });

    it('2.15 Google Business 503 Service Outage fails explicitly', async () => {
      mockHttp.onPost(/mybusiness\.googleapis\.com\/v4\/.*\/localPosts/, {
        error: { code: 503, message: 'The Google My Business service is currently unavailable.' }
      }, 503);

      await assert.rejects(
        async () => {
          await googleBusinessPublisher.publishPost({
            account: { credentials: getValidCredentials('google_business') },
            title: 'GMB Outage Test'
          });
        },
        /currently unavailable/i
      );
    });
  });

  // =========================================================================
  // SUITE 3: Media File Boundaries & Corrupt Media Handling
  // =========================================================================
  describe('3. Media File Boundaries & Corrupt Media Handling', () => {
    it('3.1 Facebook Photo rejects non-existent file path', async () => {
      await assert.rejects(
        async () => {
          await facebookPublisher.publishPhoto({
            account: { credentials: getValidCredentials('facebook') },
            filePath: path.join(os.tmpdir(), 'missing_fb_photo_999.jpg'),
            caption: 'Missing file'
          });
        },
        /file does not exist/i
      );
    });

    it('3.2 Facebook Reel rejects non-existent video path', async () => {
      await assert.rejects(
        async () => {
          await facebookPublisher.publishReel({
            account: { credentials: getValidCredentials('facebook') },
            videoPath: path.join(os.tmpdir(), 'missing_fb_reel_999.mp4'),
            caption: 'Missing video'
          });
        },
        /video file does not exist/i
      );
    });

    it('3.3 YouTube Short rejects non-existent video path', async () => {
      await assert.rejects(
        async () => {
          await youtubePublisher.uploadShort({
            account: { credentials: getValidCredentials('youtube') },
            videoPath: path.join(os.tmpdir(), 'missing_yt_video_999.mp4'),
            title: 'Missing'
          });
        },
        /Video file not found/i
      );
    });

    it('3.4 Twitter Tweet rejects non-existent media path', async () => {
      await assert.rejects(
        async () => {
          await twitterPublisher.uploadMedia({
            credentials: getValidCredentials('twitter'),
            mediaPath: path.join(os.tmpdir(), 'missing_tw_media_999.jpg')
          });
        },
        /file not found/i
      );
    });

    it('3.5 YouTube Short rejects 0-byte video file', async () => {
      const zeroFile = createZeroByteMedia('.mp4');
      await assert.rejects(
        async () => {
          await youtubePublisher.uploadShort({
            account: { credentials: getValidCredentials('youtube') },
            videoPath: zeroFile,
            title: 'Empty Short'
          });
        },
        /is empty \(0 bytes\)/i
      );
    });

    it('3.6 Twitter Tweet rejects 0-byte media file', async () => {
      const zeroFile = createZeroByteMedia('.jpg');
      await assert.rejects(
        async () => {
          await twitterPublisher.uploadMedia({
            credentials: getValidCredentials('twitter'),
            mediaPath: zeroFile
          });
        },
        /is 0 bytes/i
      );
    });

    it('3.7 Instagram Image rejects unresolvable / non-HTTP URL', async () => {
      await assert.rejects(
        async () => {
          await instagramPublisher.publishImage({
            account: { credentials: getValidCredentials('instagram') },
            mediaPath: '',
            caption: 'Non-HTTP test'
          });
        },
        /Instagram requires a public HTTP\/HTTPS image URL/i
      );
    });

    it('3.8 Pinterest Pin rejects unresolvable / non-HTTP URL', async () => {
      await assert.rejects(
        async () => {
          await pinterestPublisher.publishPin({
            account: { credentials: getValidCredentials('pinterest') },
            imageUrl: '',
            title: 'Non-HTTP test'
          });
        },
        /Pinterest requires a publicly accessible HTTP\/HTTPS image URL/i
      );
    });

    it('3.9 Threads Post rejects unresolvable / non-HTTP URL', async () => {
      const origResolve = tunnelService.resolvePublicMediaUrl;
      try {
        tunnelService.resolvePublicMediaUrl = () => '';
        await assert.rejects(
          async () => {
            await threadsPublisher.publishPost({
              account: { credentials: getValidCredentials('threads') },
              imageUrl: 'unresolvable_image.jpg',
              text: 'Non-HTTP test'
            });
          },
          /Threads image requires a public HTTP\/HTTPS URL/i
        );
      } finally {
        tunnelService.resolvePublicMediaUrl = origResolve;
      }
    });

    it('3.10 Instagram Carousel rejects empty mediaPaths array', async () => {
      await assert.rejects(
        async () => {
          await instagramPublisher.publishCarousel({
            account: { credentials: getValidCredentials('instagram') },
            mediaPaths: [],
            caption: 'Empty carousel'
          });
        },
        /Instagram carousel requires at least 2 media items/i
      );
    });

    it('3.11 Instagram Carousel rejects single media item array', async () => {
      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await instagramPublisher.publishCarousel({
            account: { credentials: getValidCredentials('instagram') },
            mediaPaths: [media],
            caption: 'Single item carousel'
          });
        },
        /Instagram carousel requires at least 2 media items/i
      );
    });

    it('3.12 Telegram Notifier sendPhoto resolves null safely on non-existent file', async () => {
      const res = await telegramNotifier.sendPhoto(
        '123456:bot_token',
        '-100123456789',
        path.join(os.tmpdir(), 'missing_tg_photo_999.jpg')
      );
      assert.strictEqual(res, null, 'sendPhoto must resolve to null safely on missing file');
    });
  });

  // =========================================================================
  // SUITE 4: Network Faults, Timeouts & Polling Expiry
  // =========================================================================
  describe('4. Network Faults, Timeouts & Polling Expiry', () => {
    it('4.1 Facebook Photo network timeout throws explicit timeout error', async () => {
      mockHttp.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/photos/, () => {
        const err = new Error('timeout of 60000ms exceeded');
        err.code = 'ECONNABORTED';
        throw err;
      });

      const media = createDummyMedia('image');
      await assert.rejects(
        async () => {
          await facebookPublisher.publishPhoto({
            account: { credentials: getValidCredentials('facebook') },
            filePath: media,
            caption: 'Timeout test'
          });
        },
        /timeout of 60000ms exceeded/i
      );
    });

    it('4.2 Twitter Tweet connection refused throws explicit ECONNREFUSED error', async () => {
      mockHttp.onPost('https://api.twitter.com/2/tweets', () => {
        const err = new Error('connect ECONNREFUSED 104.244.42.1:443');
        err.code = 'ECONNREFUSED';
        throw err;
      });

      await assert.rejects(
        async () => {
          await twitterPublisher.publishTweet({
            account: { credentials: getValidCredentials('twitter') },
            text: 'Refused test'
          });
        },
        /ECONNREFUSED/i
      );
    });

    it('4.3 Custom Webhook DNS failure throws explicit ENOTFOUND error', async () => {
      mockHttp.onPost('https://api.fakehost.internal/social/webhook', () => {
        const err = new Error('getaddrinfo ENOTFOUND api.fakehost.internal');
        err.code = 'ENOTFOUND';
        throw err;
      });

      await assert.rejects(
        async () => {
          await customPublisher.publish({
            account: { credentials: { endpointUrl: 'https://api.fakehost.internal/social/webhook' } },
            payload: { ping: true }
          });
        },
        /ENOTFOUND/i
      );
    });

    it('4.4 Instagram container polling timeout throws explicit timeout error', async () => {
      mockHttp.onGet(/graph\.facebook\.com\/v\d+\.\d+\/container_timeout_123/, {
        status_code: 'IN_PROGRESS'
      });

      await assert.rejects(
        async () => {
          await instagramPublisher.pollContainerStatus('container_timeout_123', 'tok', 2, 10);
        },
        /Instagram container container_timeout_123 processing timed out/i
      );
    });

    it('4.5 Instagram container remote failure throws explicit status error', async () => {
      mockHttp.onGet(/graph\.facebook\.com\/v\d+\.\d+\/container_err_456/, {
        status_code: 'ERROR',
        status: 'Corrupt video header'
      });

      await assert.rejects(
        async () => {
          await instagramPublisher.pollContainerStatus('container_err_456', 'tok', 2, 10);
        },
        /Instagram container container_err_456 processing failed: Corrupt video header/i
      );
    });

    it('4.6 Threads container polling timeout throws explicit timeout error', async () => {
      // Mock Threads container creation and check returning IN_PROGRESS
      mockHttp.onPost(/graph\.threads\.net\/v1\.0\/.*\/threads$/, {
        id: 'th_container_poll_timeout'
      });
      mockHttp.onGet(/graph\.threads\.net\/v1\.0\/th_container_poll_timeout/, {
        status: 'IN_PROGRESS'
      });

      const media = createDummyMedia('video');
      const origSetTimeout = global.setTimeout;
      try {
        // Accelerate poll delays in test
        global.setTimeout = (fn, ms) => origSetTimeout(fn, 1);
        await assert.rejects(
          async () => {
            await threadsPublisher.publishPost({
              account: { credentials: getValidCredentials('threads') },
              videoUrl: media,
              text: 'Poll timeout test'
            });
          },
          /Threads container processing timed out/i
        );
      } finally {
        global.setTimeout = origSetTimeout;
      }
    });
  });

  // =========================================================================
  // SUITE 5: ChannelTester Boundary & Malformed Token Handling
  // =========================================================================
  describe('5. ChannelTester Boundary & Malformed Token Handling', () => {
    it('5.1 ChannelTester rejects null credentials with explicit error', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('facebook', null);
        },
        /No credentials provided/i
      );
    });

    it('5.2 ChannelTester rejects undefined credentials with explicit error', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('instagram', undefined);
        },
        /No credentials provided/i
      );
    });

    it('5.3 ChannelTester rejects empty credentials for Facebook', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('facebook', {});
        },
        /Facebook requires Page Access Token and Page ID/i
      );
    });

    it('5.4 ChannelTester rejects empty credentials for Instagram', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('instagram', {});
        },
        /Instagram requires an Access Token and Instagram Business Account ID/i
      );
    });

    it('5.5 ChannelTester rejects empty credentials for YouTube', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('youtube', {});
        },
        /YouTube verification requires an OAuth2 Access Token/i
      );
    });

    it('5.6 ChannelTester rejects empty credentials for Pinterest', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('pinterest', {});
        },
        /Pinterest requires an API Access Token/i
      );
    });

    it('5.7 ChannelTester rejects empty credentials for LinkedIn', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('linkedin', {});
        },
        /LinkedIn requires an OAuth Access Token/i
      );
    });

    it('5.8 ChannelTester rejects empty credentials for Telegram', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('telegram', {});
        },
        /Telegram requires a Bot Token/i
      );
    });

    it('5.9 ChannelTester rejects empty credentials for Blogger', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('blogger', {});
        },
        /Blogger requires a Blog ID/i
      );
    });

    it('5.10 ChannelTester rejects empty credentials for Threads', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('threads', {});
        },
        /Threads requires a Meta Access Token/i
      );
    });

    it('5.11 ChannelTester rejects empty credentials for Website (WordPress)', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('website', {});
        },
        /Website requires siteUrl/i
      );
    });

    it('5.12 ChannelTester rejects empty credentials for Twitter', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('twitter', {});
        },
        /Twitter credentials missing/i
      );
    });

    it('5.13 ChannelTester rejects empty credentials for Reddit', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('reddit', {});
        },
        /Reddit requires clientId, clientSecret, username, and password/i
      );
    });

    it('5.14 ChannelTester rejects empty credentials for Google Business', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('google_business', {});
        },
        /Google Business Profile requires an OAuth2 Access Token/i
      );
    });

    it('5.15 ChannelTester rejects isSmartConnect flag across channels', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('facebook', { isSmartConnect: true, pageAccessToken: 'smart_tok' });
        },
        /Synthetic\/smart credentials are not permitted/i
      );
    });

    it('5.16 ChannelTester rejects mode: smart_connect across channels', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('blogger', { mode: 'smart_connect', blogId: '123' });
        },
        /Synthetic\/smart credentials are not permitted/i
      );
    });

    it('5.17 Quora assisted mode rejects malformed space URL', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('quora', { spaceUrl: 'not_a_valid_http_url' });
        },
        /Invalid Quora Space or Profile URL provided/i
      );
    });

    it('5.18 Quora assisted mode accepts empty space URL as assisted default', async () => {
      const res = await channelTester.testChannel('quora', { spaceUrl: '' });
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.isAssisted, true);
      assert.strictEqual(res.handle, 'quora.com');
    });

    it('5.19 ChannelTester rejects unsupported platform', async () => {
      await assert.rejects(
        async () => {
          await channelTester.testChannel('tiktok', { accessToken: 'tok' });
        },
        /Unsupported platform: tiktok/i
      );
    });

    it('5.20 ChannelTester surfaces upstream 401 error message authentically', async () => {
      mockHttp.onGet(/graph\.facebook\.com\/v\d+\.\d+\/12345/, {
        error: { message: 'Invalid OAuth access token signature.', code: 190 }
      }, 401);

      await assert.rejects(
        async () => {
          await channelTester.testChannel('facebook', { pageAccessToken: 'invalid_tok', pageId: '12345' });
        },
        /Invalid OAuth access token signature/i
      );
    });
  });

  // =========================================================================
  // SUITE 6: Core Subsystem Boundaries & Edge Cases
  // =========================================================================
  describe('6. Core Subsystem Boundaries & Edge Cases', () => {
    it('6.1 Database getQueueItem returns null for non-existent ID', () => {
      const item = db.getQueueItem('non_existent_item_id_999');
      assert.strictEqual(item, null);
    });

    it('6.2 Database updateQueueItem returns null without error for non-existent ID', () => {
      const updated = db.updateQueueItem('non_existent_item_id_999', { status: 'failed' });
      assert.strictEqual(updated, null);
    });

    it('6.3 Database getDestination returns undefined for unknown slug or ID', () => {
      const dest = db.getDestination('completely_unknown_destination_slug');
      assert.strictEqual(dest, undefined);
    });

    it('6.4 Database read recovers safely with defaultData on corrupt JSON', () => {
      const DatabaseClass = db.constructor;
      const testDb = new DatabaseClass();
      testDb.save = () => {}; // prevent any disk write

      const origReadFileSync = fs.readFileSync;
      try {
        fs.readFileSync = (file, enc) => {
          if (String(file).includes('data.json')) {
            return '{ corrupt: syntax { invalid json ';
          }
          return origReadFileSync(file, enc);
        };
        const recovered = testDb.read();
        assert.ok(recovered);
        assert.ok(Array.isArray(recovered.destinations));
        assert.strictEqual(recovered.settings.brandName, 'Lexa Trip');
      } finally {
        fs.readFileSync = origReadFileSync;
      }
    });

    it('6.5 Database getQueue returns empty array when filtering for non-existent status', () => {
      const filtered = db.getQueue(null, 'non_existent_status_xyz');
      assert.deepStrictEqual(filtered, []);
    });

    it('6.6 Scheduler publishItemNow rejects with error for non-existent item ID', async () => {
      await assert.rejects(
        async () => {
          await scheduler.publishItemNow('non_existent_queue_id_999');
        },
        /Queue item not found/i
      );
    });

    it('6.7 Scheduler dispatchSingleQueueItem handles empty targets array gracefully', async () => {
      const item = createFixtureQueueItem({ targets: [] });
      db.addToQueue(item);

      const result = await scheduler.dispatchSingleQueueItem(item);
      assert.strictEqual(result.status, 'failed', 'Item with 0 targets must be marked failed');
      assert.notStrictEqual(result.status, 'published');
    });

    it('6.8 Scheduler dispatchSingleQueueItem skips disabled channels in destination', async () => {
      const dest = createFixtureDestination();
      dest.channels.facebook.enabled = false;
      db.saveDestination(dest);

      const item = createFixtureQueueItem({
        destinationId: dest.id,
        targets: ['facebook']
      });
      db.addToQueue(item);

      const result = await scheduler.dispatchSingleQueueItem(item);
      const fbRes = result.publishResults.find(r => r.platform === 'facebook');
      assert.ok(fbRes);
      assert.strictEqual(fbRes.status, 'skipped');
      assert.ok(fbRes.reason.includes('disabled'));
    });

    it('6.9 Scheduler calculateNextScheduleTime preserves same day during morning hours (08:00)', () => {
      const morningTime = new Date(2026, 10, 20, 8, 0, 0);
      const nextTime = scheduler.calculateNextScheduleTime(morningTime);
      assert.strictEqual(nextTime.getDate(), morningTime.getDate(), 'Must stay on same day');
      assert.ok(nextTime.getHours() >= 8 && nextTime.getHours() <= 10, 'Must schedule within daylight hours');
    });

    it('6.10 Scheduler calculateNextScheduleTime rolls over to next morning when called at night (23:15)', () => {
      const lateTime = new Date(2026, 10, 20, 23, 15, 0);
      const nextTime = scheduler.calculateNextScheduleTime(lateTime);
      assert.strictEqual(nextTime.getDate(), lateTime.getDate() + 1, 'Must roll over to the following day');
      assert.strictEqual(nextTime.getHours(), 8, 'Must schedule starting at activeHoursStart (08:00)');
    });

    it('6.11 StorageManager getDirStats returns zero metrics for non-existent directory', () => {
      const stats = storageManager.getDirStats(path.join(os.tmpdir(), 'non_existent_storage_dir_xyz_999'));
      assert.deepStrictEqual(stats, { fileCount: 0, totalBytes: 0, totalMB: '0.00' });
    });

    it('6.12 StorageManager normalizeLocalPath returns null for empty, null, and HTTP URLs', () => {
      assert.strictEqual(storageManager.normalizeLocalPath(null), null);
      assert.strictEqual(storageManager.normalizeLocalPath(undefined), null);
      assert.strictEqual(storageManager.normalizeLocalPath(''), null);
      assert.strictEqual(storageManager.normalizeLocalPath('https://example.com/image.jpg'), null);
      assert.strictEqual(storageManager.normalizeLocalPath('http://example.com/image.jpg'), null);
    });

    it('6.13 StorageManager isAuthenticallyPublished returns false for invalid states and simulation', () => {
      assert.strictEqual(storageManager.isAuthenticallyPublished(null), false);
      assert.strictEqual(storageManager.isAuthenticallyPublished({ status: 'failed' }), false);
      assert.strictEqual(storageManager.isAuthenticallyPublished({ status: 'partial_or_failed' }), false);
      assert.strictEqual(storageManager.isAuthenticallyPublished({ status: 'publishing' }), false);
      assert.strictEqual(storageManager.isAuthenticallyPublished({ status: 'published', publishResults: [] }), false);
      assert.strictEqual(
        storageManager.isAuthenticallyPublished({
          status: 'published',
          publishResults: [{ platform: 'facebook', status: 'published', details: { simulated: true, postId: 'sim_123' } }]
        }),
        false
      );
      assert.strictEqual(
        storageManager.isAuthenticallyPublished({
          status: 'published',
          publishResults: [{ platform: 'facebook', status: 'published', details: { postId: 'mock_post_id' } }]
        }),
        false
      );
    });

    it('6.14 TelegramNotifier sendMessage resolves null without network call when credentials are unset', async () => {
      const res = await telegramNotifier.sendMessage(null, null, 'Hello');
      assert.strictEqual(res, null);
      const tgRequests = mockHttp.filterRequests('api.telegram.org');
      assert.strictEqual(tgRequests.length, 0);
    });

    it('6.15 TelegramNotifier isDuplicate suppresses duplicate alert keys within TTL', () => {
      const key = `test_key_dedup_${Date.now()}`;
      const first = telegramNotifier.isDuplicate(key, 60);
      assert.strictEqual(first, false, 'First check must not be duplicate');

      const second = telegramNotifier.isDuplicate(key, 60);
      assert.strictEqual(second, true, 'Immediate second check must be flagged as duplicate');
    });
  });
});
