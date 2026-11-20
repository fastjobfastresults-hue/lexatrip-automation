const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const fb = require('../services/publishers/facebook');
const ig = require('../services/publishers/instagram');
const li = require('../services/publishers/linkedin');
const pin = require('../services/publishers/pinterest');
const bg = require('../services/publishers/blogger');
const th = require('../services/publishers/threads');
const gmb = require('../services/publishers/googleBusiness');
const blog = require('../services/publishers/blog');
const custom = require('../services/publishers/custom');
const yt = require('../services/publishers/youtube');
const twitter = require('../services/publishers/twitter');
const reddit = require('../services/publishers/reddit');
const channelTester = require('../services/channelTester');

// Temporary test file creation helper
const tmpFile = path.join(__dirname, 'test_media.mp4');
fs.writeFileSync(tmpFile, Buffer.from('fake mp4 video content'));

describe('Milestone 1: Error Propagation & Zero Simulation on API Failure', () => {
  test('Facebook re-throws API error and never returns simulated: true', async () => {
    const origPost = axios.post;
    axios.post = async () => {
      const err = new Error('Request failed with status code 400');
      err.response = { status: 400, data: { error: { message: 'Invalid OAuth access token' } } };
      throw err;
    };

    try {
      await assert.rejects(
        fb.publishPhoto({
          account: { credentials: { pageAccessToken: 'live_token', pageId: '123' } },
          filePath: tmpFile,
          caption: 'Test'
        }),
        /Facebook Photo publish failed: Invalid OAuth access token/
      );

      await assert.rejects(
        fb.publishReel({
          account: { credentials: { pageAccessToken: 'live_token', pageId: '123' } },
          videoPath: tmpFile,
          caption: 'Test'
        }),
        /Facebook Reel publish failed: Invalid OAuth access token/
      );
    } finally {
      axios.post = origPost;
    }
  });

  test('Instagram re-throws API error and never returns simulated: true', async () => {
    const origPost = axios.post;
    axios.post = async () => {
      const err = new Error('OAuthException');
      err.response = { status: 400, data: { error: { message: 'Permissions error' } } };
      throw err;
    };

    try {
      await assert.rejects(
        ig.publishImage({
          account: { credentials: { accessToken: 'live_token', instagramAccountId: '123' } },
          mediaPath: 'https://example.com/photo.jpg',
          caption: 'Test'
        }),
        /Instagram image publish failed: Permissions error/
      );
    } finally {
      axios.post = origPost;
    }
  });

  test('LinkedIn re-throws API error and never returns simulated: true', async () => {
    const origPost = axios.post;
    const origGet = axios.get;
    axios.get = async () => ({ data: { sub: 'member_123' } });
    axios.post = async () => {
      const err = new Error('LinkedIn REST API error');
      err.response = { status: 403, data: { message: 'ACCESS_DENIED' } };
      throw err;
    };

    try {
      await assert.rejects(
        li.publishPost({
          account: { credentials: { accessToken: 'live_token' } },
          text: 'Test post'
        }),
        /LinkedIn post failed: ACCESS_DENIED/
      );
    } finally {
      axios.post = origPost;
      axios.get = origGet;
    }
  });

  test('Pinterest re-throws API error and never returns simulated: true', async () => {
    const origPost = axios.post;
    axios.post = async () => {
      const err = new Error('Pinterest API error');
      err.response = { status: 401, data: { message: 'The token is not valid.' } };
      throw err;
    };

    try {
      await assert.rejects(
        pin.publishPin({
          account: { credentials: { accessToken: 'live_token', boardId: '123' } },
          imageUrl: 'https://example.com/pic.jpg',
          title: 'Pin Title'
        }),
        /Pinterest pin publish failed: The token is not valid/
      );
    } finally {
      axios.post = origPost;
    }
  });

  test('Blogger re-throws API error and never returns simulated: true', async () => {
    const origPost = axios.post;
    axios.post = async () => {
      const err = new Error('Google Blogger API error');
      err.response = { status: 403, data: { error: { message: 'We are sorry, but you do not have access to this service.' } } };
      throw err;
    };

    try {
      await assert.rejects(
        bg.publishPost({
          account: { credentials: { blogId: '123', accessToken: 'ya29.live_token' } },
          title: 'Blogger Title',
          caption: 'Caption'
        }),
        /Blogger post publish failed: We are sorry/
      );
    } finally {
      axios.post = origPost;
    }
  });

  test('Threads re-throws API error and never returns simulated: true', async () => {
    const origPost = axios.post;
    axios.post = async () => {
      const err = new Error('Threads Graph API error');
      err.response = { status: 400, data: { error: { message: 'Invalid parameter' } } };
      throw err;
    };

    try {
      await assert.rejects(
        th.publishPost({
          account: { credentials: { accessToken: 'live_token' } },
          text: 'Threads post'
        }),
        /Threads publish failed: Invalid parameter/
      );
    } finally {
      axios.post = origPost;
    }
  });

  test('Google Business re-throws API error and never returns simulated: true', async () => {
    const origPost = axios.post;
    axios.post = async () => {
      const err = new Error('Google My Business API error');
      err.response = { status: 404, data: { error: { message: 'Requested entity was not found.' } } };
      throw err;
    };

    try {
      await assert.rejects(
        gmb.publishPost({
          account: { credentials: { accessToken: 'live_token', locationId: 'locations/123' } },
          title: 'Offer',
          caption: 'Special'
        }),
        /Google Business Profile publish failed: Requested entity was not found/
      );
    } finally {
      axios.post = origPost;
    }
  });

  test('WordPress re-throws API error and never returns simulated: true', async () => {
    const origPost = axios.post;
    axios.post = async () => {
      const err = new Error('WP API error');
      err.response = { status: 401, data: { message: 'Sorry, you are not allowed to create posts as this user.' } };
      throw err;
    };

    try {
      await assert.rejects(
        blog.publishArticle({
          account: { credentials: { username: 'admin', applicationPassword: 'real_pw_123', siteUrl: 'https://example.com' } },
          title: 'Article',
          content: 'Content'
        }),
        /WordPress publish failed: Sorry, you are not allowed/
      );
    } finally {
      axios.post = origPost;
    }
  });
});

describe('Milestone 1: YouTube & Twitter Authentic Publishing Contracts', () => {
  test('YouTube Resumable Upload executes two-step protocol and returns authentic videoId', async () => {
    const origPost = axios.post;
    const origPut = axios.put;

    let initCalled = false;
    let uploadCalled = false;

    axios.post = async (url, payload, config) => {
      if (url.includes('uploadType=resumable')) {
        initCalled = true;
        assert.ok(config.headers['Authorization'] === 'Bearer ya29.test_token');
        assert.ok(payload.snippet.title.includes('#Shorts'));
        return {
          headers: { location: 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=session_abc_123' },
          data: {}
        };
      }
      return origPost(url, payload, config);
    };

    axios.put = async (url, stream, config) => {
      if (url.includes('session_abc_123')) {
        uploadCalled = true;
        return {
          data: {
            id: 'yt_vid_genuine_999',
            snippet: { publishedAt: '2026-11-20T10:00:00Z' }
          }
        };
      }
      return origPut(url, stream, config);
    };

    try {
      const result = await yt.uploadShort({
        account: { credentials: { accessToken: 'ya29.test_token' } },
        videoPath: tmpFile,
        title: 'Luxury Desert Camp',
        description: 'Jaisalmer dunes'
      });

      assert.strictEqual(initCalled, true, 'Step 1: Resumable session init must be called');
      assert.strictEqual(uploadCalled, true, 'Step 2: Binary stream upload must be called');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.strictEqual(result.platform, 'youtube');
      assert.strictEqual(result.videoId, 'yt_vid_genuine_999');
      assert.strictEqual(result.postId, 'yt_vid_genuine_999');
      assert.strictEqual(result.postUrl, 'https://youtube.com/shorts/yt_vid_genuine_999');
    } finally {
      axios.post = origPost;
      axios.put = origPut;
    }
  });

  test('Twitter API v2 executes tweet creation and returns authentic postUrl', async () => {
    const origPost = axios.post;

    axios.post = async (url, payload, config) => {
      if (url === 'https://api.twitter.com/2/tweets') {
        assert.ok(payload.text === 'Exploring Jaisalmer dunes!');
        return {
          data: {
            data: {
              id: '1855000000000000000',
              text: 'Exploring Jaisalmer dunes!'
            }
          }
        };
      }
      return origPost(url, payload, config);
    };

    try {
      const result = await twitter.publishTweet({
        account: { credentials: { bearerToken: 'user_bearer_token_123' } },
        text: 'Exploring Jaisalmer dunes!'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.simulated, false);
      assert.strictEqual(result.platform, 'twitter');
      assert.strictEqual(result.postId, '1855000000000000000');
      assert.strictEqual(result.postUrl, 'https://x.com/i/status/1855000000000000000');
    } finally {
      axios.post = origPost;
    }
  });

  test('Pinterest auto-detect boards re-throws 401 error and never returns fake mock board 1131740650051300286', async () => {
    const origGet = axios.get;
    axios.get = async () => {
      const err = new Error('Pinterest token invalid');
      err.response = { status: 401, data: { message: 'Authorization failed' } };
      throw err;
    };

    try {
      await assert.rejects(
        channelTester.detectPinterestBoards('invalid_token'),
        /Authorization failed|token invalid/
      );
    } finally {
      axios.get = origGet;
    }
  });
});
