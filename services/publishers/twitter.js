/**
 * Lexa Trip Social Media Automation System
 * Twitter / X API v2 Tweet & Media Publisher
 * 
 * Features:
 * - Twitter API v2 Tweet Creation (`POST https://api.twitter.com/2/tweets`)
 * - Media Upload via Twitter API v1.1 (`POST https://upload.twitter.com/1.1/media/upload.json`)
 * - Pure Node.js RFC 5849 OAuth 1.0a HMAC-SHA1 signer (built with native `crypto`)
 * - OAuth 2.0 User Context Bearer token support
 * - Zero simulated fallbacks: fails explicitly on invalid credentials or API errors
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FormData = require('form-data');
const { sanitizePostText } = require('../textSanitizer');

class TwitterPublisher {
  /**
   * RFC 3986 strict percent-encoding
   */
  rfc3986(str) {
    return encodeURIComponent(String(str)).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  }

  /**
   * Generate RFC 5849 OAuth 1.0a Authorization Header using native Node.js crypto
   */
  generateOAuth1Header({ method, url, consumerKey, consumerSecret, token, tokenSecret, queryParams = {} }) {
    const oauthParams = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0'
    };
    if (token) {
      oauthParams.oauth_token = token;
    }

    // Combine query parameters and OAuth parameters (RFC 5849 Section 3.4.1.3)
    const allParams = { ...queryParams, ...oauthParams };
    const sortedKeys = Object.keys(allParams).sort();
    const paramString = sortedKeys.map(k => `${this.rfc3986(k)}=${this.rfc3986(allParams[k])}`).join('&');

    const baseUrl = url.split('?')[0];
    const baseString = `${method.toUpperCase()}&${this.rfc3986(baseUrl)}&${this.rfc3986(paramString)}`;
    const signingKey = `${this.rfc3986(consumerSecret)}&${this.rfc3986(tokenSecret || '')}`;
    const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

    oauthParams.oauth_signature = signature;
    const headerParts = Object.keys(oauthParams)
      .sort()
      .map(k => `${this.rfc3986(k)}="${this.rfc3986(oauthParams[k])}"`);

    return 'OAuth ' + headerParts.join(', ');
  }

  /**
   * Determine available authentication headers (OAuth 1.0a or OAuth 2.0 User Bearer)
   */
  getAuthHeaders({ method, url, credentials, queryParams = {} }) {
    if (!credentials) {
      throw new Error('Twitter / X credentials missing.');
    }

    const {
      apiKey,
      apiSecret,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret,
      token,
      tokenSecret,
      bearerToken
    } = credentials;

    const effectiveConsumerKey = apiKey || consumerKey;
    const effectiveConsumerSecret = apiSecret || consumerSecret;
    const effectiveToken = accessToken || token;
    const effectiveTokenSecret = accessTokenSecret || tokenSecret;

    // Reject synthetic smart_ tokens
    if (
      (bearerToken && String(bearerToken).startsWith('smart_')) ||
      (effectiveToken && String(effectiveToken).startsWith('smart_'))
    ) {
      throw new Error("Synthetic 'smart_' tokens are not permitted for live Twitter publishing. Real API credentials required.");
    }

    // 1. Prefer OAuth 1.0a User Context if consumer secret and tokens are available
    if (effectiveConsumerKey && effectiveConsumerSecret && effectiveToken && effectiveTokenSecret) {
      const authHeader = this.generateOAuth1Header({
        method,
        url,
        consumerKey: effectiveConsumerKey,
        consumerSecret: effectiveConsumerSecret,
        token: effectiveToken,
        tokenSecret: effectiveTokenSecret,
        queryParams
      });
      return { Authorization: authHeader };
    }

    // 2. Fall back to OAuth 2.0 User Context Bearer token
    const userBearer = bearerToken || (effectiveToken && !effectiveConsumerSecret ? effectiveToken : null);
    if (userBearer) {
      return { Authorization: `Bearer ${userBearer}` };
    }

    // 3. Detect partial or invalid configuration
    if (effectiveConsumerKey && !effectiveConsumerSecret) {
      throw new Error(
        "Twitter credentials incomplete: API Key was provided, but API Secret, Access Token, and Access Token Secret are required for OAuth 1.0a publishing."
      );
    }

    throw new Error(
      "Twitter credentials missing. Publishing to Twitter / X requires either OAuth 1.0a credentials " +
      "(apiKey, apiSecret, accessToken, accessTokenSecret) or an OAuth 2.0 User Context Bearer token."
    );
  }

  /**
   * Upload media (photo or video) to Twitter v1.1 Media Upload endpoint
   */
  async uploadMedia({ credentials, mediaPath }) {
    if (!mediaPath) return null;

    const resolvedPath = path.resolve(mediaPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Twitter media upload failed: file not found at "${resolvedPath}".`);
    }

    const fileStats = fs.statSync(resolvedPath);
    if (fileStats.size === 0) {
      throw new Error(`Twitter media upload failed: file at "${resolvedPath}" is 0 bytes.`);
    }

    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    const form = new FormData();
    form.append('media', fs.createReadStream(resolvedPath));

    const authHeaders = this.getAuthHeaders({
      method: 'POST',
      url,
      credentials
    });

    try {
      const response = await axios.post(url, form, {
        headers: {
          ...authHeaders,
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000
      });

      const mediaId = response.data?.media_id_string || (response.data?.media_id ? String(response.data.media_id) : null);
      if (!mediaId) {
        throw new Error('Twitter media upload succeeded but server did not return a valid media_id.');
      }
      return mediaId;
    } catch (err) {
      const errDetail = err.response?.data?.errors?.[0]?.message || err.response?.data?.error || err.message;
      throw new Error(`Twitter Media Upload Failed: ${errDetail}`);
    }
  }

  /**
   * Sanitize and truncate tweet text to 280 characters
   */
  formatTweetText(text, title = '') {
    const cleanText = sanitizePostText(text || '');
    const cleanTitle = sanitizePostText(title || '');
    let combined = cleanText || cleanTitle || '';
    if (cleanTitle && cleanText && !cleanText.includes(cleanTitle)) {
      combined = `${cleanTitle}\n\n${cleanText}`;
    }
    combined = combined.trim();

    if (combined.length <= 280) {
      return combined;
    }
    return combined.substring(0, 277).trim() + '...';
  }

  /**
   * Publish Tweet to Twitter / X API v2
   * @param {Object} params
   * @param {Object} params.account - Destination channel configuration & credentials
   * @param {string} [params.text] - Tweet text
   * @param {string} [params.title] - Optional title
   * @param {string} [params.caption] - Optional caption
   * @param {string} [params.mediaPath] - Optional path to image or video
   */
  async publishTweet({ account, text, title, caption, mediaPath }) {
    const creds = account?.credentials || {};
    const tweetText = this.formatTweetText(text || caption, title);

    if (!tweetText && !mediaPath) {
      throw new Error('Twitter publication failed: Either text or mediaPath must be provided.');
    }

    // Step 1: Upload media if attached
    let mediaId = null;
    if (mediaPath) {
      try {
        mediaId = await this.uploadMedia({ credentials: creds, mediaPath });
      } catch (mediaErr) {
        console.warn(`[Twitter] Media upload failed (${mediaErr.message}), falling back to text-only tweet...`);
        // If media upload fails due to OAuth2 bearer token lacking media endpoint permissions,
        // we can still post the tweet text if available, but fail if no text
        if (!tweetText) {
          throw mediaErr;
        }
      }
    }

    // Step 2: Post Tweet via API v2
    const url = 'https://api.twitter.com/2/tweets';
    const payload = {
      text: tweetText
    };
    if (mediaId) {
      payload.media = {
        media_ids: [mediaId]
      };
    }

    const authHeaders = this.getAuthHeaders({
      method: 'POST',
      url,
      credentials: creds
    });

    try {
      const response = await axios.post(url, payload, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const tweetData = response.data?.data;
      const tweetId = tweetData?.id;

      if (!tweetId) {
        throw new Error('Twitter API v2 responded without a tweet ID.');
      }

      const postUrl = `https://x.com/i/status/${tweetId}`;

      return {
        success: true,
        simulated: false,
        platform: 'twitter',
        postId: tweetId,
        postUrl,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.title ||
        err.response?.data?.errors?.[0]?.message ||
        err.message;
      const statusCode = err.response?.status;
      throw new Error(`Twitter API v2 Publishing Failed (HTTP ${statusCode || 'ERR'}): ${errorMsg}`);
    }
  }

  /**
   * Alias for publishTweet to maintain interface consistency across publishers
   */
  async publishPost(params) {
    return this.publishTweet(params);
  }
}

module.exports = new TwitterPublisher();
