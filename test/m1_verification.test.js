const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { isolateDatabase, restoreDatabase } = require('./helpers/testFixtures');

beforeEach(() => {
  isolateDatabase();
});

afterEach(() => {
  restoreDatabase();
});

// Import modules under test
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
const tunnel = require('../services/tunnelService');
const channelTester = require('../services/channelTester');
const scheduler = require('../services/scheduler');
const db = require('../database/db');

describe('Milestone 1: Publishers Simulation Purge & Credential Rejection', () => {
  test('Facebook rejects missing credentials and smart_ tokens', async () => {
    await assert.rejects(
      fb.publishPhoto({ account: { credentials: {} }, filePath: 'test.jpg' }),
      /credentials missing/i
    );
    await assert.rejects(
      fb.publishPhoto({ account: { credentials: { pageAccessToken: 'smart_fb_tok', pageId: '123' } }, filePath: 'test.jpg' }),
      /invalid facebook credentials.*smart_/i
    );
    await assert.rejects(
      fb.publishReel({ account: { credentials: {} }, videoPath: 'test.mp4' }),
      /credentials missing/i
    );
    await assert.rejects(
      fb.publishReel({ account: { credentials: { pageAccessToken: 'smart_fb_tok', pageId: '123' } }, videoPath: 'test.mp4' }),
      /invalid facebook credentials.*smart_/i
    );
  });

  test('Instagram rejects missing credentials and smart_ tokens', async () => {
    await assert.rejects(
      ig.publishImage({ account: { credentials: {} }, mediaPath: 'test.jpg' }),
      /credentials missing/i
    );
    await assert.rejects(
      ig.publishImage({ account: { credentials: { accessToken: 'smart_ig_tok', instagramAccountId: '123' } }, mediaPath: 'test.jpg' }),
      /invalid instagram credentials.*smart_/i
    );
    await assert.rejects(
      ig.publishCarousel({ account: { credentials: {} }, mediaPaths: ['a.jpg', 'b.jpg'] }),
      /credentials missing/i
    );
    await assert.rejects(
      ig.publishCarousel({ account: { credentials: { accessToken: 'smart_ig_tok', instagramAccountId: '123' } }, mediaPaths: ['a.jpg', 'b.jpg'] }),
      /invalid instagram credentials.*smart_/i
    );
    await assert.rejects(
      ig.publishReel({ account: { credentials: {} }, videoPath: 'test.mp4' }),
      /credentials missing/i
    );
    await assert.rejects(
      ig.publishReel({ account: { credentials: { accessToken: 'smart_ig_tok', instagramAccountId: '123' } }, videoPath: 'test.mp4' }),
      /invalid instagram credentials.*smart_/i
    );
  });

  test('LinkedIn rejects missing credentials and smart_ tokens', async () => {
    await assert.rejects(
      li.publishPost({ account: { credentials: {} }, text: 'Hello' }),
      /credentials missing/i
    );
    await assert.rejects(
      li.publishPost({ account: { credentials: { accessToken: 'smart_li_tok' } }, text: 'Hello' }),
      /invalid linkedin credentials.*smart_/i
    );
  });

  test('Pinterest rejects missing credentials and smart_ tokens', async () => {
    await assert.rejects(
      pin.publishPin({ account: { credentials: {} }, imageUrl: 'test.jpg' }),
      /credentials missing/i
    );
    await assert.rejects(
      pin.publishPin({ account: { credentials: { accessToken: 'smart_pin_tok', boardId: '123' } }, imageUrl: 'test.jpg' }),
      /invalid pinterest credentials.*smart_/i
    );
  });

  test('Blogger rejects missing credentials and smart_ tokens', async () => {
    await assert.rejects(
      bg.publishPost({ account: { credentials: {} }, title: 'Hello' }),
      /credentials missing/i
    );
    await assert.rejects(
      bg.publishPost({ account: { credentials: { blogId: '123', apiKey: 'smart_bg_tok' } }, title: 'Hello' }),
      /invalid blogger credentials.*smart_/i
    );
  });

  test('Threads rejects missing credentials and smart_ tokens', async () => {
    await assert.rejects(
      th.publishPost({ account: { credentials: {} }, text: 'Hello' }),
      /credentials missing/i
    );
    await assert.rejects(
      th.publishPost({ account: { credentials: { accessToken: 'smart_th_tok' } }, text: 'Hello' }),
      /invalid threads credentials.*smart_/i
    );
  });

  test('Google Business rejects missing credentials and smart_ tokens', async () => {
    await assert.rejects(
      gmb.publishPost({ account: { credentials: {} }, title: 'Hello' }),
      /credentials missing/i
    );
    await assert.rejects(
      gmb.publishPost({ account: { credentials: { accessToken: 'smart_gmb_tok', locationId: '123' } }, title: 'Hello' }),
      /invalid google business profile credentials.*smart_/i
    );
  });

  test('WordPress / Blog fixes ReferenceError and rejects placeholder tokens', async () => {
    await assert.rejects(
      blog.publishArticle({ account: { credentials: {} }, title: 'Hello' }),
      /credentials missing/i
    );
    await assert.rejects(
      blog.publishArticle({ account: { credentials: { username: 'admin', applicationPassword: 'smart_pw' } }, title: 'Hello' }),
      /invalid wordpress credentials.*placeholder/i
    );
    await assert.rejects(
      blog.publishArticle({ account: { credentials: { username: 'admin', applicationPassword: 'official_live_token' } }, title: 'Hello' }),
      /invalid wordpress credentials.*placeholder/i
    );
  });

  test('Custom platform rejects missing endpointUrl and smart_ tokens', async () => {
    await assert.rejects(
      custom.publish({ account: { name: 'test', credentials: {} } }),
      /endpointUrl is missing/i
    );
    await assert.rejects(
      custom.publish({ account: { name: 'test', credentials: { endpointUrl: 'smart_endpoint' } } }),
      /invalid custom publisher credentials.*smart_/i
    );
  });

  test('YouTube rejects missing credentials, smart_ tokens, and raw API key without OAuth2', async () => {
    await assert.rejects(
      yt.uploadShort({ account: { credentials: {} }, videoPath: 'test.mp4', title: 'Test' }),
      /credentials missing/i
    );
    await assert.rejects(
      yt.uploadShort({ account: { credentials: { accessToken: 'smart_yt_tok' } }, videoPath: 'test.mp4', title: 'Test' }),
      /synthetic 'smart_' tokens/i
    );
    await assert.rejects(
      yt.uploadShort({ account: { credentials: { apiKey: 'AIzaSyTestKey' } }, videoPath: 'test.mp4', title: 'Test' }),
      /simple google api key.*cannot upload videos/i
    );
  });

  test('Twitter rejects missing credentials and smart_ tokens', async () => {
    await assert.rejects(
      twitter.publishTweet({ account: { credentials: {} }, text: 'Test' }),
      /credentials missing/i
    );
    await assert.rejects(
      twitter.publishTweet({ account: { credentials: { bearerToken: 'smart_tw_tok' } }, text: 'Test' }),
      /synthetic 'smart_' tokens/i
    );
    await assert.rejects(
      twitter.publishTweet({ account: { credentials: { apiKey: 'some_key' } }, text: 'Test' }),
      /credentials incomplete/i
    );
  });

  test('Reddit rejects missing credentials and smart_ tokens', async () => {
    await assert.rejects(
      reddit.submitPost({ account: { credentials: {} }, title: 'Test', text: 'Body' }),
      /missing reddit credentials/i
    );
    await assert.rejects(
      reddit.submitPost({ account: { credentials: { clientId: 'smart_client', clientSecret: 'sec', username: 'u', password: 'p' } }, title: 'Test' }),
      /invalid reddit credentials.*smart_/i
    );
  });
});

describe('Milestone 1: Tunnel Service Path Resolution', () => {
  test('Sanitizes Windows absolute drive path with backslashes', () => {
    const raw = 'D:\\lexa automation web and app\\generated\\batch_1794714417140\\post_1_4x5.jpg';
    const resolved = tunnel.resolvePublicMediaUrl(raw);
    assert.ok(resolved.includes('/generated/batch_1794714417140/post_1_4x5.jpg'), 'Expected URL path: ' + resolved);
    assert.ok(!resolved.includes('D:'), 'Should not contain drive letter: ' + resolved);
    assert.ok(!resolved.includes('\\'), 'Should not contain backslashes: ' + resolved);
  });

  test('Handles relative paths with forward and backslashes', () => {
    const r1 = 'uploads/sample.jpg';
    const resolved1 = tunnel.resolvePublicMediaUrl(r1);
    assert.ok(resolved1.includes('/uploads/sample.jpg'), 'Expected URL: ' + resolved1);

    const r2 = 'public\\img\\banner.png';
    const resolved2 = tunnel.resolvePublicMediaUrl(r2);
    assert.ok(resolved2.includes('/public/img/banner.png'), 'Expected URL: ' + resolved2);
    assert.ok(!resolved2.includes('\\'), 'Should not contain backslashes');
  });

  test('Passes through HTTP and HTTPS URLs unaltered', () => {
    const url = 'https://images.unsplash.com/photo-1548013146-72479768bada';
    assert.strictEqual(tunnel.resolvePublicMediaUrl(url), url);
  });
});

describe('Milestone 1: Twitter RFC 5849 OAuth 1.0a Signer', () => {
  test('Generates valid OAuth 1.0a header with HMAC-SHA1', () => {
    const header = twitter.generateOAuth1Header({
      method: 'POST',
      url: 'https://api.twitter.com/2/tweets',
      consumerKey: 'test_consumer_key',
      consumerSecret: 'test_consumer_secret',
      token: 'test_token',
      tokenSecret: 'test_token_secret'
    });

    assert.ok(header.startsWith('OAuth '), 'Header must start with "OAuth "');
    assert.ok(header.includes('oauth_consumer_key="test_consumer_key"'), 'Must contain consumer key');
    assert.ok(header.includes('oauth_signature_method="HMAC-SHA1"'), 'Must use HMAC-SHA1');
    assert.ok(header.includes('oauth_signature='), 'Must contain signature');
    assert.ok(header.includes('oauth_nonce='), 'Must contain nonce');
    assert.ok(header.includes('oauth_timestamp='), 'Must contain timestamp');
  });

  test('Truncates tweet text cleanly to 280 characters', () => {
    const longText = 'A'.repeat(300);
    const formatted = twitter.formatTweetText(longText);
    assert.ok(formatted.length <= 280, `Expected length <= 280, got ${formatted.length}`);
    assert.ok(formatted.endsWith('...'), 'Should end with ellipsis');
  });
});

describe('Milestone 1: Channel Tester Overhaul & Mock Purge', () => {
  test('Rejects all synthetic smart_ tokens and isSmartConnect bypasses', async () => {
    await assert.rejects(
      channelTester.testChannel('facebook', { isSmartConnect: true }),
      /synthetic\/smart credentials are not permitted/i
    );
    await assert.rejects(
      channelTester.testChannel('instagram', { accessToken: 'smart_ig' }),
      /synthetic\/smart credentials are not permitted/i
    );
    await assert.rejects(
      channelTester.testChannel('youtube', { apiKey: 'smart_yt' }),
      /synthetic\/smart credentials are not permitted/i
    );
    await assert.rejects(
      channelTester.testChannel('website', { applicationPassword: 'smart_pass' }),
      /synthetic\/smart credentials are not permitted/i
    );
    await assert.rejects(
      channelTester.testChannel('website', { applicationPassword: 'official_live_token' }),
      /synthetic\/smart credentials are not permitted/i
    );
  });

  test('Quora is classified as Assisted Copy/Paste mode', async () => {
    const result = await channelTester.testChannel('quora', {
      spaceUrl: 'https://lexatrip.quora.com/'
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.platform, 'quora');
    assert.strictEqual(result.isAssisted, true);
    assert.ok(result.details.includes('Assisted Copy/Paste mode'));
  });

  test('YouTube channel tester requires channelId with API key', async () => {
    await assert.rejects(
      channelTester.testChannel('youtube', { apiKey: 'AIzaFakeKey' }),
      /requires an OAuth2 Access Token, or both an API Key and Channel ID/i
    );
  });

  test('Website channel tester requires username and applicationPassword', async () => {
    await assert.rejects(
      channelTester.testChannel('website', { siteUrl: 'https://example.com' }),
      /requires username and applicationPassword/i
    );
  });

  test('Reddit channel tester requires credentials', async () => {
    await assert.rejects(
      channelTester.testChannel('reddit', {}),
      /requires clientId, clientSecret, username, and password/i
    );
  });

  test('Twitter channel tester rejects missing credentials', async () => {
    await assert.rejects(
      channelTester.testChannel('twitter', {}),
      /credentials missing/i
    );
  });
});

describe('Milestone 1: Scheduler Dispatch Integration', () => {
  test('Unhandled platform throws and records status: failed instead of silently published', async () => {
    const testItem = {
      id: 'q_test_unhandled_' + Date.now(),
      batchId: 'batch_test',
      destinationId: 'dest_jaisalmer',
      destinationName: 'Lexa Trip Jaisalmer',
      itemType: 'post',
      index: 1,
      title: 'Unhandled Test Post',
      caption: 'Testing unhandled platform fail',
      mediaPath: 'sample.jpg',
      targets: ['nonexistent_platform'],
      scheduledTime: new Date().toISOString(),
      status: 'queued'
    };

    const res = await scheduler.dispatchSingleQueueItem(testItem);
    assert.strictEqual(res.status, 'failed');
    const result = res.publishResults.find(r => r.platform === 'nonexistent_platform');
    assert.ok(result, 'Expected result entry for nonexistent_platform');
    assert.strictEqual(result.status, 'failed');
    assert.ok(result.error.includes('does not support item type') || result.error.includes('not implemented') || result.error.includes('no result'));
  });

  test('Quora is marked skipped with Assisted mode note in scheduler', async () => {
    const testItem = {
      id: 'q_test_quora_' + Date.now(),
      batchId: 'batch_test',
      destinationId: 'dest_jaisalmer',
      destinationName: 'Lexa Trip Jaisalmer',
      itemType: 'post',
      index: 1,
      title: 'Quora Assisted Post',
      caption: 'Testing Quora skip',
      mediaPath: 'sample.jpg',
      targets: ['quora'],
      scheduledTime: new Date().toISOString(),
      status: 'queued'
    };

    const res = await scheduler.dispatchSingleQueueItem(testItem);
    assert.strictEqual(res.status, 'skipped');
    const quoraResult = res.publishResults.find(r => r.platform === 'quora');
    assert.ok(quoraResult, 'Expected result entry for quora');
    assert.strictEqual(quoraResult.status, 'skipped');
    assert.ok(quoraResult.reason.includes('Assisted Copy/Paste mode'));
  });

  test('Reddit dispatch attempts submitPost and fails truthfully when credentials missing', async () => {
    const testItem = {
      id: 'q_test_reddit_' + Date.now(),
      batchId: 'batch_test',
      destinationId: 'dest_jaisalmer',
      destinationName: 'Lexa Trip Jaisalmer',
      itemType: 'post',
      index: 1,
      title: 'Reddit Dispatch Test',
      caption: 'Testing reddit truthfulness',
      mediaPath: 'sample.jpg',
      targets: ['reddit'],
      scheduledTime: new Date().toISOString(),
      status: 'queued'
    };

    const res = await scheduler.dispatchSingleQueueItem(testItem);
    assert.strictEqual(res.status, 'failed');
    const redditResult = res.publishResults.find(r => r.platform === 'reddit');
    assert.ok(redditResult, 'Expected result entry for reddit');
    assert.strictEqual(redditResult.status, 'failed');
    assert.ok(redditResult.error.includes('Reddit') || redditResult.error.includes('Missing') || redditResult.error.includes('credentials'));
  });

  test('Twitter dispatch attempts publishTweet and fails truthfully when credentials missing', async () => {
    db.saveDestination({
      id: 'dest_test_tw',
      name: 'Test Destination TW',
      slug: 'test_tw',
      channels: {
        twitter: {
          enabled: true,
          credentials: {}
        }
      }
    });

    const testItem = {
      id: 'q_test_twitter_' + Date.now(),
      batchId: 'batch_test',
      destinationId: 'dest_test_tw',
      destinationName: 'Test Destination TW',
      itemType: 'post',
      index: 1,
      title: 'Twitter Dispatch Test',
      caption: 'Testing twitter truthfulness',
      mediaPath: 'sample.jpg',
      targets: ['twitter'],
      scheduledTime: new Date().toISOString(),
      status: 'queued'
    };

    try {
      const res = await scheduler.dispatchSingleQueueItem(testItem);
      assert.strictEqual(res.status, 'failed');
      const twResult = res.publishResults.find(r => r.platform === 'twitter');
      assert.ok(twResult, 'Expected result entry for twitter');
      assert.strictEqual(twResult.status, 'failed');
      assert.ok(twResult.error.includes('Twitter') || twResult.error.includes('credentials'));
    } finally {
      db.deleteDestination('dest_test_tw');
    }
  });
});
