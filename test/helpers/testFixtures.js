/**
 * Lexa Trip Social Media Automation System
 * Test Fixtures & In-Memory Database Isolation Harness
 * 
 * Features:
 * - isolateDatabase() & restoreDatabase(): 100% in-memory cloning of db.read and db.save
 *   guaranteeing database/data.json on disk is NEVER modified during tests.
 * - Platform credential factories for all 11 platforms (valid, missing, smart, expired).
 * - Dummy media generators (createDummyMedia, cleanupDummyMedia).
 * - Fixture factories for Queue Items, Destinations, and Batches.
 * - Subsystem reset hooks for test isolation.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const db = require('../../database/db');

// Track temp files created for cleanup
const createdMediaFiles = new Set();

// Database isolation state
let inMemoryDbState = null;
let originalDbRead = null;
let originalDbSave = null;

/**
 * Patches db.read and db.save to operate in-memory only.
 * data.json on disk remains completely untouched.
 */
function isolateDatabase() {
  if (!originalDbRead) {
    originalDbRead = db.read.bind(db);
    originalDbSave = db.save.bind(db);
  }

  // Deep clone current database state
  const diskState = originalDbRead();
  inMemoryDbState = JSON.parse(JSON.stringify(diskState));

  // Patch methods
  db.read = () => {
    return JSON.parse(JSON.stringify(inMemoryDbState));
  };

  db.save = (data) => {
    inMemoryDbState = JSON.parse(JSON.stringify(data));
  };
}

/**
 * Restores original db.read and db.save methods.
 */
function restoreDatabase() {
  if (originalDbRead) {
    db.read = originalDbRead;
    db.save = originalDbSave;
    originalDbRead = null;
    originalDbSave = null;
    inMemoryDbState = null;
  }
}

/**
 * Returns in-memory state copy for test inspection
 */
function getInMemoryDb() {
  return inMemoryDbState ? JSON.parse(JSON.stringify(inMemoryDbState)) : null;
}

/**
 * Factory for complete, authentic credentials per platform
 */
function getValidCredentials(platform) {
  const norm = (platform || '').toLowerCase().trim();
  switch (norm) {
    case 'facebook':
      return {
        pageAccessToken: 'EAAB_valid_facebook_live_token_1234567890',
        pageId: '123456789012345',
        pageName: 'Lexa Trip Facebook Page'
      };
    case 'instagram':
      return {
        accessToken: 'EAAB_valid_instagram_access_token_1234567890',
        instagramAccountId: '17841400000000',
        handle: '@lexatripjaisalmer'
      };
    case 'linkedin':
      return {
        accessToken: 'AQV_valid_linkedin_oauth_token_1234567890',
        organizationUrn: 'urn:li:organization:12345678'
      };
    case 'pinterest':
      return {
        accessToken: 'pina_valid_pinterest_live_token_1234567890',
        boardId: '1131740650051300286',
        boardName: 'LexaTrip Jaisalmer'
      };
    case 'blogger':
      return {
        blogId: '8765432109876543210',
        apiKey: 'valid_blogger_oauth2_token_1234567890'
      };
    case 'youtube':
      return {
        accessToken: 'ya29.valid_youtube_oauth2_token_1234567890',
        apiKey: 'AIzaSy_valid_google_api_key_1234567890',
        channelId: 'UC_valid_lexatrip_channel_123'
      };
    case 'twitter':
      return {
        apiKey: 'tw_valid_consumer_key_123',
        apiSecret: 'tw_valid_consumer_secret_456',
        accessToken: 'tw_valid_user_access_token_789',
        accessTokenSecret: 'tw_valid_user_token_secret_012',
        bearerToken: 'tw_valid_bearer_token_345'
      };
    case 'reddit':
      return {
        clientId: 'reddit_valid_client_id_123',
        clientSecret: 'reddit_valid_client_secret_456',
        username: 'LexaTripOfficial',
        password: 'reddit_valid_secure_password_789'
      };
    case 'threads':
      return {
        accessToken: 'TH_valid_threads_oauth_token_1234567890',
        threadsUserId: '17841400000000',
        threadsHandle: '@lexatripjaisalmer'
      };
    case 'google_business':
    case 'gmb':
      return {
        accessToken: 'ya29.valid_gmb_oauth_token_1234567890',
        locationId: 'locations/1234567890123456789',
        accountId: 'accounts/109876543210987654321',
        businessName: 'Lexa Trip Jaisalmer Desert Camps'
      };
    case 'blog':
    case 'website':
      return {
        username: 'admin',
        applicationPassword: 'wp_app_valid_pass_1234_5678',
        siteUrl: 'https://lexatrip.com',
        apiUrl: 'https://lexatrip.com/wp-json/wp/v2'
      };
    case 'custom':
      return {
        endpointUrl: 'https://api.example.com/social/webhook',
        authToken: 'custom_secret_bearer_token_123',
        customHeaderKey: 'X-Lexa-Signature',
        customHeaderValue: 'sig_valid_12345'
      };
    case 'telegram':
      return {
        botToken: '1234567890:ABCDefGhIJklMNopQRstUVwxyz_123456',
        chatId: '-1001234567890',
        channelId: '@lexatripjaisalmer'
      };
    default:
      return { accessToken: 'valid_generic_token_123' };
  }
}

/**
 * Factory for invalid, empty, or simulated credentials
 */
function getInvalidCredentials(platform, type = 'missing') {
  if (type === 'missing') {
    return {};
  }
  if (type === 'smart') {
    return {
      isSmartConnect: true,
      mode: 'smart_connect',
      accessToken: 'smart_connect_fake_token_123',
      pageAccessToken: 'smart_page_token_123',
      apiKey: 'smart_api_key_123'
    };
  }
  if (type === 'expired') {
    return {
      accessToken: 'expired_or_revoked_token_123',
      pageAccessToken: 'expired_fb_token_123',
      apiKey: 'revoked_key_123'
    };
  }
  return {};
}

/**
 * Creates a tiny valid dummy image (GIF/PNG) or video (MP4) in the OS temp directory
 */
function createDummyMedia(type = 'image', extension = null) {
  const ext = extension || (type === 'video' ? '.mp4' : '.jpg');
  const filename = `test_media_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`;
  const tempPath = path.join(os.tmpdir(), filename);

  if (type === 'video') {
    // Minimal valid MP4 container buffer (ftyp atom + moov header)
    const mp4Bytes = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // size 32, 'ftyp'
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00, // major brand 'isom', minor_version 512
      0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32, // compatible brands: isom, iso2
      0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31, // avc1, mp41
      0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65  // size 8, 'free'
    ]);
    fs.writeFileSync(tempPath, mp4Bytes);
  } else {
    // 1x1 transparent GIF bytes
    const gifBytes = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    fs.writeFileSync(tempPath, gifBytes);
  }

  createdMediaFiles.add(tempPath);
  return tempPath;
}

/**
 * Unlinks all dummy media files generated during testing
 */
function cleanupDummyMedia() {
  for (const filePath of createdMediaFiles) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Ignore cleanup error if already removed
    }
  }
  createdMediaFiles.clear();
}

/**
 * Factory for a valid Queue Item
 */
function createFixtureQueueItem(overrides = {}) {
  const dummyMedia = createDummyMedia('image');
  const now = new Date();
  return {
    id: `q_test_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    batchId: `batch_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    destinationId: 'dest_jaisalmer',
    destinationName: 'लेक्सा ट्रिप जैसलमेर (Lexa Trip Jaisalmer)',
    itemType: 'post', // 'post' | 'carousel' | 'reel'
    index: 1,
    title: 'Golden Sunset at Sam Sand Dunes',
    caption: 'Experience luxury desert camping with Lexa Trip in Jaisalmer.',
    hashtags: '#Jaisalmer #DesertSafari #LuxuryTravel',
    mediaPath: dummyMedia,
    scheduledTime: new Date(now.getTime() - 1000).toISOString(), // due immediately by default
    status: 'queued',
    targets: ['facebook', 'instagram', 'linkedin'],
    createdAt: now.toISOString(),
    ...overrides
  };
}

/**
 * Factory for a Destination with configured channels
 */
function createFixtureDestination(overrides = {}) {
  return {
    id: 'dest_test_destination',
    name: 'Test Destination (Lexa Trip)',
    slug: 'test_destination',
    state: 'Rajasthan',
    website: 'https://lexatrip.com',
    phone: '+91 90798 54982',
    channels: {
      facebook: { enabled: true, credentials: getValidCredentials('facebook') },
      instagram: { enabled: true, credentials: getValidCredentials('instagram') },
      linkedin: { enabled: true, credentials: getValidCredentials('linkedin') },
      pinterest: { enabled: true, credentials: getValidCredentials('pinterest') },
      blogger: { enabled: true, credentials: getValidCredentials('blogger') },
      youtube: { enabled: true, credentials: getValidCredentials('youtube') },
      twitter: { enabled: true, credentials: getValidCredentials('twitter') },
      reddit: { enabled: true, credentials: getValidCredentials('reddit') },
      threads: { enabled: true, credentials: getValidCredentials('threads') },
      google_business: { enabled: true, credentials: getValidCredentials('google_business') },
      website: { enabled: true, credentials: getValidCredentials('website') }
    },
    defaultChannels: {
      post: ['facebook', 'instagram', 'linkedin', 'pinterest'],
      reel: ['facebook', 'instagram', 'youtube'],
      carousel: ['facebook', 'instagram', 'linkedin']
    },
    telegram: getValidCredentials('telegram'),
    ...overrides
  };
}

/**
 * Resets state across singletons between test runs
 */
function resetAllSubsystems() {
  cleanupDummyMedia();

  try {
    const scheduler = require('../../services/scheduler');
    scheduler.isProcessing = false;
    scheduler.stop();
  } catch {}
}

module.exports = {
  isolateDatabase,
  restoreDatabase,
  getInMemoryDb,
  getValidCredentials,
  getInvalidCredentials,
  createDummyMedia,
  cleanupDummyMedia,
  createFixtureQueueItem,
  createFixtureDestination,
  resetAllSubsystems
};
