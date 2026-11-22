/**
 * Lexa Trip Social Media Automation System
 * Tier 1 Test Suite: Social Media Publishers Feature Coverage (F1–F14)
 * 
 * Verifies genuine API contracts across all platforms:
 * 1. Facebook (Photo & Reel binary upload)
 * 2. Instagram (Image, Carousel, Reel)
 * 3. LinkedIn (REST Posts API)
 * 4. Pinterest (v5 Pins API)
 * 5. Blogger (v3 API)
 * 6. YouTube Shorts (v3 Resumable Upload)
 * 7. Twitter / X (v2 Tweets API & v1.1 Media Upload)
 * 8. Reddit (OAuth2 Token & Submit Post/Comment)
 * 9. Threads (Meta Threads API Container & Publish)
 * 10. Google Business Profile (My Business v4 Local Posts)
 * 11. WordPress / Blog (REST API)
 * 12. Custom Webhook (Generic Endpoint)
 * 13. Tunnel Service (Public Media URL Resolution)
 * 
 * Strict Assertion: simulated === false and NEVER simulated === true.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const mockHttp = require('../helpers/mockHttp');
const {
  isolateDatabase,
  restoreDatabase,
  getValidCredentials,
  createDummyMedia,
  cleanupDummyMedia
} = require('../helpers/testFixtures');

// Import target publishers
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
const tunnelService = require('../../services/tunnelService');

describe('Tier 1: Social Media Publishers Feature Coverage', () => {
  beforeEach(() => {
    isolateDatabase();
    mockHttp.enable();
    mockHttp.reset();
    mockHttp.setupDefaultPlatformMocks();
  });

  afterEach(() => {
    mockHttp.disable();
    restoreDatabase();
    cleanupDummyMedia();
  });

  // ==========================================
  // 1. Facebook Publisher (F1)
  // ==========================================
  describe('Facebook Publisher', () => {
    it('publishPhoto: performs genuine binary upload to Graph API and returns authentic postId', async () => {
      const imagePath = createDummyMedia('image');
      const account = {
        name: 'Facebook Page - Lexa Trip Jaisalmer',
        platform: 'facebook',
        credentials: getValidCredentials('facebook')
      };

      const result = await facebookPublisher.publishPhoto({
        account,
        filePath: imagePath,
        caption: 'Luxury desert camping in Jaisalmer dunes'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'facebook');
      assert.ok(result.postId, 'Must return a valid postId');
      assert.strictEqual(result.postId, 'fb_photo_id_101');

      // Verify HTTP call was made to Facebook Graph API
      const req = mockHttp.findRequest('graph.facebook.com', 'post');
      assert.ok(req, 'Expected POST to graph.facebook.com');
      assert.match(req.url, new RegExp(account.credentials.pageId));
      assert.match(req.url, /\/photos$/);
    });

    it('publishReel: uploads video to Facebook Page videos endpoint and returns authentic videoId', async () => {
      const videoPath = createDummyMedia('video');
      const account = {
        name: 'Facebook Page - Lexa Trip Jaisalmer',
        platform: 'facebook',
        credentials: getValidCredentials('facebook')
      };

      const result = await facebookPublisher.publishReel({
        account,
        videoPath,
        caption: 'Cinematic 12s Reel of Jaisalmer Desert'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'facebook');
      assert.strictEqual(result.type, 'reel');
      assert.strictEqual(result.videoId, 'fb_video_id_102');

      const req = mockHttp.findRequest('/video_reels', 'post') || mockHttp.findRequest('/videos', 'post');
      assert.ok(req, 'Expected POST to /video_reels or /videos endpoint');
    });
  });

  // ==========================================
  // 2. Instagram Publisher (F2)
  // ==========================================
  describe('Instagram Publisher', () => {
    it('publishImage: creates container and publishes single 4:5 image', async () => {
      const imagePath = createDummyMedia('image');
      const account = {
        name: 'Instagram - Lexa Trip Jaisalmer',
        platform: 'instagram',
        credentials: getValidCredentials('instagram')
      };

      const result = await instagramPublisher.publishImage({
        account,
        mediaPath: imagePath,
        caption: 'Golden fort of Jaisalmer'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'instagram');
      assert.strictEqual(result.type, 'image');
      assert.strictEqual(result.postId, 'ig_published_post_id_202');

      // Verify media container creation and publish call
      const containerReq = mockHttp.findRequest('/media', 'post');
      assert.ok(containerReq);
      const publishReq = mockHttp.findRequest('/media_publish', 'post');
      assert.ok(publishReq);
    });

    it('publishCarousel: creates multiple item containers and publishes carousel', async () => {
      const img1 = createDummyMedia('image');
      const img2 = createDummyMedia('image');
      const account = {
        name: 'Instagram - Lexa Trip Jaisalmer',
        platform: 'instagram',
        credentials: getValidCredentials('instagram')
      };

      const result = await instagramPublisher.publishCarousel({
        account,
        mediaPaths: [img1, img2],
        caption: '5 Highlights of Jaisalmer'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'instagram');
      assert.strictEqual(result.type, 'carousel');
      assert.strictEqual(result.postId, 'ig_published_post_id_202');
    });

    it('publishReel: creates reel container, polls status, and publishes video reel', async () => {
      const videoPath = createDummyMedia('video');
      const account = {
        name: 'Instagram - Lexa Trip Jaisalmer',
        platform: 'instagram',
        credentials: getValidCredentials('instagram')
      };

      const result = await instagramPublisher.publishReel({
        account,
        videoPath,
        caption: 'Ultra HD 9:16 Reel: Desert Dunes'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'instagram');
      assert.strictEqual(result.type, 'reel');
      assert.strictEqual(result.postId, 'ig_published_post_id_202');
    });
  });

  // ==========================================
  // 3. LinkedIn Publisher (F3)
  // ==========================================
  describe('LinkedIn Publisher', () => {
    it('publishPost: auto-resolves author URN and publishes post to LinkedIn REST Posts API', async () => {
      const imagePath = createDummyMedia('image');
      const account = {
        name: 'LinkedIn - Lexa Trip Jaisalmer',
        platform: 'linkedin',
        credentials: getValidCredentials('linkedin')
      };

      const result = await linkedinPublisher.publishPost({
        account,
        text: 'Lexa Trip expands luxury travel operations in Western Rajasthan.',
        imageUrl: imagePath,
        title: 'Expansion Announcement'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'linkedin');
      assert.strictEqual(result.postId, 'urn:li:share:301987654');
      assert.strictEqual(result.author, 'urn:li:person:li_user_sub_301');

      // Verify headers sent to LinkedIn
      const postReq = mockHttp.findRequest('api.linkedin.com/rest/posts', 'post');
      assert.ok(postReq);
      assert.strictEqual(postReq.headers['X-Restli-Protocol-Version'], '2.0.0');
      assert.strictEqual(postReq.data.lifecycleState, 'PUBLISHED');
      assert.strictEqual(postReq.data.commentary, 'Lexa Trip expands luxury travel operations in Western Rajasthan.');
    });
  });

  // ==========================================
  // 4. Pinterest Publisher (F4)
  // ==========================================
  describe('Pinterest Publisher', () => {
    it('publishPin: posts image pin with boardId and link to Pinterest v5 API', async () => {
      const imagePath = createDummyMedia('image');
      const account = {
        name: 'Pinterest - Lexa Trip Jaisalmer',
        platform: 'pinterest',
        credentials: getValidCredentials('pinterest')
      };

      const result = await pinterestPublisher.publishPin({
        account,
        imageUrl: imagePath,
        title: 'Jaisalmer Desert Dunes Safari',
        description: 'Explore royal desert tents in Jaisalmer.',
        link: 'https://lexatrip.com/jaisalmer'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'pinterest');
      assert.strictEqual(result.pinId, 'pin_id_401');

      const pinReq = mockHttp.findRequest('api.pinterest.com/v5/pins', 'post');
      assert.ok(pinReq);
      assert.strictEqual(pinReq.data.board_id, '1131740650051300286');
      assert.strictEqual(pinReq.data.title, 'Jaisalmer Desert Dunes Safari');
    });
  });

  // ==========================================
  // 5. Blogger Publisher (F5)
  // ==========================================
  describe('Blogger Publisher', () => {
    it('publishPost: creates HTML article with labels and posts to Google Blogger v3 API', async () => {
      const imagePath = createDummyMedia('image');
      const account = {
        name: 'Blogger - Lexa Trip Jaisalmer',
        platform: 'blogger',
        credentials: getValidCredentials('blogger')
      };

      const result = await bloggerPublisher.publishPost({
        account,
        title: 'Jaisalmer Royal Tour Itinerary',
        caption: 'Detailed 3-day travel itinerary for Jaisalmer royal trip.',
        hashtags: '#Jaisalmer #RoyalRajasthan #DesertSafari',
        mediaPath: imagePath,
        destinationName: 'Lexa Trip Jaisalmer'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'blogger');
      assert.strictEqual(result.postId, 'blogger_post_id_501');
      assert.ok(result.url.includes('jaisalmer-royal-tour'));

      const blogReq = mockHttp.findRequest('/posts', 'post');
      assert.ok(blogReq);
      assert.strictEqual(blogReq.data.title, 'Jaisalmer Royal Tour Itinerary');
      assert.ok(blogReq.data.content.includes('Jaisalmer Royal Tour Itinerary'));
      assert.deepStrictEqual(blogReq.data.labels, ['Jaisalmer', 'RoyalRajasthan', 'DesertSafari']);
    });
  });

  // ==========================================
  // 6. YouTube Shorts Publisher (F6)
  // ==========================================
  describe('YouTube Shorts Publisher', () => {
    it('uploadShort: initiates resumable upload session and streams video bytes', async () => {
      const videoPath = createDummyMedia('video');
      const account = {
        name: 'YouTube - Lexa Trip Jaisalmer',
        platform: 'youtube',
        credentials: getValidCredentials('youtube')
      };

      const result = await youtubePublisher.uploadShort({
        account,
        videoPath,
        title: 'Desert Dunes in Jaisalmer',
        description: 'Luxury desert experiences with Lexa Trip #Shorts',
        tags: ['Jaisalmer', 'Shorts', 'Travel']
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'youtube');
      assert.strictEqual(result.type, 'shorts');
      assert.strictEqual(result.videoId, 'yt_video_id_601');
      assert.strictEqual(result.postUrl, 'https://youtube.com/shorts/yt_video_id_601');

      // Verify two-step resumable upload was executed
      const sessionReq = mockHttp.findRequest('/upload/youtube/v3/videos', 'post');
      assert.ok(sessionReq, 'Session initiation POST required');
      const streamReq = mockHttp.findRequest('upload_id=yt_session_601', 'put');
      assert.ok(streamReq, 'Video binary stream PUT required');
    });
  });

  // ==========================================
  // 7. Twitter / X Publisher (F7)
  // ==========================================
  describe('Twitter / X Publisher', () => {
    it('publishTweet: uploads media to v1.1 and posts tweet to API v2', async () => {
      const imagePath = createDummyMedia('image');
      const account = {
        name: 'Twitter - Lexa Trip Jaisalmer',
        platform: 'twitter',
        credentials: getValidCredentials('twitter')
      };

      const result = await twitterPublisher.publishTweet({
        account,
        text: 'Experience the golden dunes of Jaisalmer with Lexa Trip.',
        mediaPath: imagePath
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'twitter');
      assert.strictEqual(result.postId, '1859012345678901234');
      assert.strictEqual(result.postUrl, 'https://x.com/i/status/1859012345678901234');

      const mediaReq = mockHttp.findRequest('upload.twitter.com/1.1/media/upload.json', 'post');
      assert.ok(mediaReq, 'Media upload POST expected');
      const tweetReq = mockHttp.findRequest('api.twitter.com/2/tweets', 'post');
      assert.ok(tweetReq, 'Tweet creation POST expected');
      assert.strictEqual(tweetReq.data.text, 'Experience the golden dunes of Jaisalmer with Lexa Trip.');
      assert.deepStrictEqual(tweetReq.data.media.media_ids, ['tw_media_id_701']);
    });
  });

  // ==========================================
  // 8. Reddit Publisher (F8)
  // ==========================================
  describe('Reddit Publisher', () => {
    it('submitPost: retrieves OAuth token and submits post to target subreddit', async () => {
      const account = {
        name: 'Reddit - Lexa Trip',
        platform: 'reddit',
        credentials: getValidCredentials('reddit')
      };

      const result = await redditPublisher.submitPost({
        account,
        subreddit: 'IndiaTravel',
        title: 'Complete Jaisalmer Travel Guide 2026',
        text: 'Here is everything you need to know about visiting Jaisalmer in winter.'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'reddit');
      assert.strictEqual(result.postId, 't3_rd_post_802');
      assert.strictEqual(result.subreddit, 'IndiaTravel');
      assert.ok(result.postUrl.includes('rd_post_802'));

      // Verify access_token request
      const tokenReq = mockHttp.findRequest('www.reddit.com/api/v1/access_token', 'post');
      assert.ok(tokenReq, 'Expected Reddit OAuth token request');

      // Verify post submission with Bearer token
      const submitReq = mockHttp.findRequest('oauth.reddit.com/api/submit', 'post');
      assert.ok(submitReq, 'Expected Reddit submit post request');
      assert.strictEqual(submitReq.headers.Authorization, 'bearer reddit_bearer_token_801');
    });

    it('submitComment: submits comment reply to parent thread', async () => {
      const account = {
        name: 'Reddit - Lexa Trip',
        platform: 'reddit',
        credentials: getValidCredentials('reddit')
      };

      const result = await redditPublisher.submitComment({
        account,
        parentThingId: 't3_parent_123',
        text: 'The best time for camel safari in Sam dunes is 4:30 PM!'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'reddit');
      assert.strictEqual(result.commentId, 't1_rd_comment_803');
    });
  });

  // ==========================================
  // 9. Threads Publisher (F10)
  // ==========================================
  describe('Threads Publisher', () => {
    it('publishPost: creates media container and publishes to Meta Threads API', async () => {
      const imagePath = createDummyMedia('image');
      const account = {
        name: 'Threads - Lexa Trip Jaisalmer',
        platform: 'threads',
        credentials: getValidCredentials('threads')
      };

      const result = await threadsPublisher.publishPost({
        account,
        text: 'Exploring the golden streets of Jaisalmer.',
        imageUrl: imagePath
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'threads');
      assert.strictEqual(result.postId, 'threads_post_id_902');
      assert.ok(result.url.includes('threads_post_id_902'));

      const containerReq = mockHttp.findRequest('graph.threads.net/v1.0/17841400000000/threads', 'post');
      assert.ok(containerReq);
      const publishReq = mockHttp.findRequest('graph.threads.net/v1.0/17841400000000/threads_publish', 'post');
      assert.ok(publishReq);
    });
  });

  // ==========================================
  // 10. Google Business Profile Publisher (F11)
  // ==========================================
  describe('Google Business Profile Publisher', () => {
    it('publishPost: posts local post with CTA to Google My Business v4 API', async () => {
      const imagePath = createDummyMedia('image');
      const account = {
        name: 'Google Business Profile - Lexa Trip Jaisalmer',
        platform: 'google_business',
        credentials: getValidCredentials('google_business')
      };

      const result = await googleBusinessPublisher.publishPost({
        account,
        title: 'Special Winter Desert Camping Offers',
        caption: 'Book direct with Lexa Trip for complimentary camel safari.',
        mediaPath: imagePath,
        destinationName: 'Lexa Trip Jaisalmer'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'google_business');
      assert.strictEqual(result.postId, 'accounts/123/locations/456/localPosts/gmb_post_id_1001');

      const gmbReq = mockHttp.findRequest('mybusiness.googleapis.com', 'post');
      assert.ok(gmbReq);
      assert.strictEqual(gmbReq.data.topicType, 'STANDARD');
      assert.strictEqual(gmbReq.data.callToAction.actionType, 'BOOK');
    });
  });

  // ==========================================
  // 11. WordPress / Blog Publisher (F12)
  // ==========================================
  describe('WordPress / Blog Publisher', () => {
    it('publishArticle: encodes Basic Auth correctly and posts to WordPress REST API', async () => {
      const account = {
        name: 'Website Blog - Lexa Trip',
        platform: 'blog',
        credentials: getValidCredentials('blog')
      };

      const result = await blogPublisher.publishArticle({
        account,
        title: 'Luxury Camping Guide Jaisalmer',
        content: '<p>Top 5 luxury desert camp spots in Jaisalmer.</p>',
        excerpt: 'Jaisalmer camping guide'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.platform, 'blog');
      assert.strictEqual(result.postId, 1101);
      assert.strictEqual(result.url, 'https://lexatrip.com/blog/jaisalmer-luxury-camps/');

      const wpReq = mockHttp.findRequest('/posts', 'post');
      assert.ok(wpReq);
      assert.strictEqual(wpReq.data.title, 'Luxury Camping Guide Jaisalmer');
      assert.strictEqual(wpReq.data.status, 'publish');
      assert.ok(wpReq.headers.Authorization.startsWith('Basic '));
    });
  });

  // ==========================================
  // 12. Custom Webhook Publisher (F13)
  // ==========================================
  describe('Custom Webhook Publisher', () => {
    it('publish: posts payload to custom endpoint with authorization and custom headers', async () => {
      mockHttp.onPost('https://api.example.com/social/webhook', {
        id: 'cust_hook_1201',
        status: 'received'
      });

      const account = {
        name: 'Custom Webhook Integration',
        platform: 'custom',
        credentials: getValidCredentials('custom')
      };

      const result = await customPublisher.publish({
        account,
        payload: {
          event: 'new_trip_post',
          destination: 'Jaisalmer',
          timestamp: new Date().toISOString()
        }
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.notStrictEqual(result.simulated, true);
      assert.strictEqual(result.postId, 'cust_hook_1201');

      const hookReq = mockHttp.findRequest('api.example.com/social/webhook', 'post');
      assert.ok(hookReq);
      assert.strictEqual(hookReq.headers.Authorization, 'Bearer custom_secret_bearer_token_123');
      assert.strictEqual(hookReq.headers['X-Lexa-Signature'], 'sig_valid_12345');
    });
  });

  // ==========================================
  // 13. Tunnel Service (F14)
  // ==========================================
  describe('Tunnel Service Media URL Resolution', () => {
    it('resolvePublicMediaUrl: normalizes disk paths and eliminates Windows backslashes and drive letters', () => {
      const baseUrl = tunnelService.getPublicUrl().replace(/\/$/, '');

      // Windows absolute path
      const winPath = 'D:\\lexa automation web and app\\generated\\reel_12345.mp4';
      const url1 = tunnelService.resolvePublicMediaUrl(winPath);
      assert.strictEqual(url1, `${baseUrl}/generated/reel_12345.mp4`);

      // Relative path
      const relPath = 'uploads/photo_5678.jpg';
      const url2 = tunnelService.resolvePublicMediaUrl(relPath);
      assert.strictEqual(url2, `${baseUrl}/uploads/photo_5678.jpg`);

      // Already public URL
      const httpsUrl = 'https://cdn.example.com/media/banner.png';
      const url3 = tunnelService.resolvePublicMediaUrl(httpsUrl);
      assert.strictEqual(url3, httpsUrl);
    });
  });
});
