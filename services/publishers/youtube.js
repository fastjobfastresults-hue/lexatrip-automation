/**
 * Lexa Trip Social Media Automation System
 * YouTube Data API v3 Video / Shorts Publisher
 * 
 * Features:
 * - Two-step Google Resumable Video Upload protocol
 * - OAuth 2.0 Bearer authorization & optional automatic token refresh
 * - YouTube Shorts classification (1080x1920, #Shorts metadata, Category 19: Travel & Events)
 * - Zero simulated fallbacks: fails explicitly on invalid credentials or API errors
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class YouTubePublisher {
  /**
   * Refreshes OAuth2 access token if refreshToken is available
   */
  async refreshAccessToken({ clientId, clientSecret, refreshToken }) {
    if (!clientId || !clientSecret || !refreshToken) {
      return null;
    }
    try {
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000
        }
      );
      return response.data?.access_token || null;
    } catch (err) {
      console.error('[YouTube] Token refresh failed:', err.response?.data || err.message);
      return null;
    }
  }

  /**
   * Resolve a valid OAuth2 Access Token from credentials
   */
  async resolveAccessToken(credentials) {
    if (!credentials) {
      throw new Error('YouTube credentials missing. OAuth 2.0 User Access Token required.');
    }

    let token = credentials.accessToken || credentials.access_token || credentials.bearerToken;

    // Reject synthetic smart_ tokens
    if (token && String(token).startsWith('smart_')) {
      throw new Error("Synthetic 'smart_' tokens are not permitted for live YouTube publishing. Real OAuth 2.0 credentials required.");
    }

    // If access token is missing or if refresh token exists, attempt refresh
    if ((!token || credentials.refreshToken) && (credentials.clientId || credentials.client_id) && (credentials.refreshToken || credentials.refresh_token)) {
      const refreshedToken = await this.refreshAccessToken({
        clientId: credentials.clientId || credentials.client_id,
        clientSecret: credentials.clientSecret || credentials.client_secret,
        refreshToken: credentials.refreshToken || credentials.refresh_token
      });
      if (refreshedToken) {
        token = refreshedToken;
        credentials.accessToken = refreshedToken;
      }
    }

    // Check if only an API key is provided without any OAuth tokens
    if (!token && (credentials.apiKey || credentials.api_key) && !credentials.refreshToken) {
      throw new Error(
        "YouTube video upload requires an OAuth 2.0 User Access Token with 'https://www.googleapis.com/auth/youtube.upload' scope. " +
        "A simple Google API Key (AIzaSy...) only provides read-only access for public data and cannot upload videos to YouTube."
      );
    }

    if (!token) {
      throw new Error(
        "YouTube credentials missing: Missing OAuth 2.0 Access Token. Please authenticate with YouTube OAuth 2.0 (scope: 'youtube.upload')."
      );
    }

    return token;
  }

  /**
   * Format title to adhere to YouTube length limits (max 100 characters) and include #Shorts tag
   */
  formatShortsTitle(title) {
    const shortsTag = '#Shorts';
    let clean = (title || 'Travel Highlight').trim();
    if (!clean.includes(shortsTag)) {
      if (clean.length + 1 + shortsTag.length > 100) {
        clean = clean.substring(0, 100 - (shortsTag.length + 1)).trim();
      }
      return `${clean} ${shortsTag}`;
    }
    return clean.substring(0, 100);
  }

  /**
   * Upload video as YouTube Shorts
   * @param {Object} params
   * @param {Object} params.account - Destination channel configuration & credentials
   * @param {string} params.videoPath - Absolute or relative local path to the video file
   * @param {string} params.title - Video title
   * @param {string} params.description - Video description
   * @param {string[]} [params.tags] - Video tags
   * @param {string} [params.privacyStatus] - 'public' | 'unlisted' | 'private'
   */
  async uploadShort({ account, videoPath, title, description, tags = [], privacyStatus = 'public' }) {
    return this.publishVideo({
      account,
      videoPath,
      title: this.formatShortsTitle(title),
      description: description ? `${description}\n\n#Shorts` : '#Shorts',
      tags: Array.isArray(tags) ? Array.from(new Set([...tags, 'Shorts', 'travel'])) : ['Shorts', 'travel'],
      categoryId: '19', // Travel & Events
      privacyStatus,
      isShorts: true
    });
  }

  /**
   * Generic YouTube video upload using Resumable Upload protocol
   */
  async publishVideo({ account, videoPath, title, description, tags = [], categoryId = '19', privacyStatus = 'public', isShorts = false }) {
    const creds = account?.credentials || {};
    let accessToken = await this.resolveAccessToken(creds);

    // Validate video file
    if (!videoPath) {
      throw new Error('YouTube video upload failed: videoPath parameter is required.');
    }
    const resolvedPath = path.resolve(videoPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`YouTube video upload failed: Video file not found at "${resolvedPath}".`);
    }
    const fileStats = fs.statSync(resolvedPath);
    if (fileStats.size === 0) {
      throw new Error(`YouTube video upload failed: Video file at "${resolvedPath}" is empty (0 bytes).`);
    }

    const fileSize = fileStats.size;
    const formattedTitle = (title || 'Lexa Trip Travel Video').substring(0, 100);
    const formattedDescription = (description || '').substring(0, 5000);

    // Step 1: Initiate Resumable Upload Session
    const initUrl = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';
    const initPayload = {
      snippet: {
        title: formattedTitle,
        description: formattedDescription,
        tags: Array.isArray(tags) ? tags : [],
        categoryId: String(categoryId || '19')
      },
      status: {
        privacyStatus: privacyStatus || 'public',
        selfDeclaredMadeForKids: false,
        embeddable: true
      }
    };

    let sessionUploadUrl;
    try {
      const initRes = await axios.post(initUrl, initPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'video/mp4',
          'X-Upload-Content-Length': fileSize
        },
        timeout: 30000
      });

      sessionUploadUrl = initRes.headers['location'];
      if (!sessionUploadUrl) {
        throw new Error('Google YouTube upload initiation failed: Location header missing from server response.');
      }
    } catch (err) {
      // If 401 and refresh credentials available, try refreshing token once
      if (err.response?.status === 401 && creds.refreshToken) {
        console.warn('[YouTube] Access token expired, attempting automatic refresh...');
        const newToken = await this.refreshAccessToken({
          clientId: creds.clientId,
          clientSecret: creds.clientSecret,
          refreshToken: creds.refreshToken
        });
        if (newToken) {
          accessToken = newToken;
          creds.accessToken = newToken;
          // Retry initialization
          const retryRes = await axios.post(initUrl, initPayload, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json; charset=UTF-8',
              'X-Upload-Content-Type': 'video/mp4',
              'X-Upload-Content-Length': fileSize
            },
            timeout: 30000
          });
          sessionUploadUrl = retryRes.headers['location'];
        }
      }

      if (!sessionUploadUrl) {
        const errorDetail = err.response?.data?.error?.message || err.response?.data?.error || err.message;
        const statusCode = err.response?.status;
        if (statusCode === 403 && (typeof errorDetail === 'string' && (errorDetail.includes('quota') || errorDetail.includes('limit')))) {
          throw new Error(`YouTube API Quota Exceeded (HTTP 403): ${errorDetail}. Uploads require 1,600 quota units.`);
        }
        throw new Error(`YouTube Upload Session Initiation Failed (HTTP ${statusCode || 'ERR'}): ${errorDetail}`);
      }
    }

    // Step 2: Stream Video Binary Bytes via PUT to Session URL
    try {
      const fileStream = fs.createReadStream(resolvedPath);
      const uploadRes = await axios.put(sessionUploadUrl, fileStream, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': fileSize
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000 // 5 minutes upload timeout
      });

      const videoData = uploadRes.data;
      const videoId = videoData?.id;

      if (!videoId) {
        throw new Error('YouTube upload completed but server did not return a valid video ID.');
      }

      const postUrl = isShorts
        ? `https://youtube.com/shorts/${videoId}`
        : `https://www.youtube.com/watch?v=${videoId}`;

      return {
        success: true,
        simulated: false,
        platform: 'youtube',
        type: isShorts ? 'shorts' : 'video',
        postId: videoId,
        videoId: videoId,
        postUrl,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: videoData.snippet?.publishedAt || new Date().toISOString()
      };
    } catch (err) {
      const errorDetail = err.response?.data?.error?.message || err.response?.data?.error || err.message;
      throw new Error(`YouTube Video Binary Upload Failed: ${errorDetail}`);
    }
  }
}

module.exports = new YouTubePublisher();
