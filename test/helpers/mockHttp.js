/**
 * Lexa Trip Social Media Automation System
 * Pure Node.js Axios Adapter Interceptor & HTTP Recorder (MockHttp)
 * 
 * Features:
 * - Zero external dependencies (uses native Node.js and axios.defaults.adapter)
 * - Route registration (onGet, onPost, onPut, onDelete, on) with string/RegExp/function matchers
 * - Full request capturing (method, url, params, parsed json data, rawData, headers)
 * - AxiosError simulation for non-2xx status codes
 * - Reverse-order route matching (later routes override earlier default mocks)
 * - Pre-configured default platform mocks for all 11 social APIs + Telegram + AI
 */

const axios = require('axios');

class MockHttp {
  constructor() {
    this.originalAdapter = null;
    this.routes = [];
    this.requests = [];
  }

  /**
   * Installs the custom adapter on axios.defaults.adapter
   */
  enable() {
    if (!this.originalAdapter) {
      this.originalAdapter = axios.defaults.adapter;
    }
    this.requests = [];
    axios.defaults.adapter = async (config) => {
      // If request body is a readable stream, consume it cleanly to prevent dangling file handles
      if (config.data && typeof config.data.pipe === 'function' && typeof config.data.resume === 'function') {
        await new Promise((resolve) => {
          config.data.on('end', resolve);
          config.data.on('error', () => resolve());
          config.data.on('close', resolve);
          config.data.resume();
        });
      }

      let parsedData = config.data;
      if (typeof config.data === 'string') {
        try {
          parsedData = JSON.parse(config.data);
        } catch {
          // Keep original string if not valid JSON (e.g. form-urlencoded)
        }
      }

      const capturedReq = {
        method: (config.method || 'get').toLowerCase(),
        url: config.url,
        params: config.params || {},
        data: parsedData,
        rawData: config.data,
        headers: config.headers || {}
      };
      this.requests.push(capturedReq);

      const reqMethod = capturedReq.method;

      // Reverse iteration so newly registered overrides take precedence
      for (let i = this.routes.length - 1; i >= 0; i--) {
        const route = this.routes[i];
        const methodMatch = !route.method || route.method.toLowerCase() === reqMethod;
        let urlMatch = false;

        if (typeof route.urlMatcher === 'string') {
          urlMatch = config.url.includes(route.urlMatcher);
        } else if (route.urlMatcher instanceof RegExp) {
          urlMatch = route.urlMatcher.test(config.url);
        } else if (typeof route.urlMatcher === 'function') {
          urlMatch = route.urlMatcher(config.url, config);
        }

        if (methodMatch && urlMatch) {
          let responseData;
          let statusCode = route.status || 200;
          let responseHeaders = { ...(route.headers || {}) };

          if (typeof route.handler === 'function') {
            try {
              const res = await route.handler(config);
              if (res && typeof res === 'object' && res.status !== undefined) {
                statusCode = res.status;
                responseData = res.data !== undefined ? res.data : res;
                if (res.headers) responseHeaders = { ...responseHeaders, ...res.headers };
              } else {
                responseData = res;
              }
            } catch (err) {
              if (err.response) throw err;
              const axiosErr = new Error(err.message || 'Handler threw an error');
              axiosErr.name = 'AxiosError';
              axiosErr.isAxiosError = true;
              axiosErr.config = config;
              axiosErr.response = {
                status: err.status || 500,
                statusText: 'Internal Server Error',
                headers: {},
                config,
                data: err.data || { error: err.message }
              };
              throw axiosErr;
            }
          } else {
            responseData = route.data;
          }

          // If status code is non-2xx, throw AxiosError
          if (statusCode < 200 || statusCode >= 300) {
            const axiosErr = new Error(`Request failed with status code ${statusCode}`);
            axiosErr.name = 'AxiosError';
            axiosErr.isAxiosError = true;
            axiosErr.config = config;
            axiosErr.response = {
              status: statusCode,
              statusText: statusCode === 401 ? 'Unauthorized' : statusCode === 403 ? 'Forbidden' : statusCode === 404 ? 'Not Found' : 'Error',
              headers: responseHeaders,
              config,
              data: responseData
            };
            throw axiosErr;
          }

          return {
            status: statusCode,
            statusText: 'OK',
            headers: responseHeaders,
            config,
            data: responseData
          };
        }
      }

      // If loopback / local test server request, pass through to original adapter safely
      let isLoopback = false;
      try {
        const fullUrl = config.baseURL ? (config.baseURL.replace(/\/+$/, '') + '/' + (config.url || '').replace(/^\/+/, '')) : config.url;
        const parsedUrl = new URL(fullUrl, 'http://127.0.0.1');
        isLoopback = parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname === 'localhost';
      } catch {
        isLoopback = false;
      }

      if (isLoopback && this.originalAdapter) {
        const adapter = typeof this.originalAdapter === 'function'
          ? this.originalAdapter
          : axios.getAdapter(this.originalAdapter);
        return await adapter(config);
      }

      // If no route matched
      const notFoundErr = new Error(`MockHttp: Unhandled request ${config.method?.toUpperCase()} ${config.url}`);
      notFoundErr.name = 'AxiosError';
      notFoundErr.isAxiosError = true;
      notFoundErr.config = config;
      notFoundErr.response = {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config,
        data: { error: `Not Found in MockHttp: ${config.url}` }
      };
      throw notFoundErr;
    };
  }

  /**
   * Restores the original axios adapter
   */
  disable() {
    if (this.originalAdapter) {
      axios.defaults.adapter = this.originalAdapter;
      this.originalAdapter = null;
    }
    this.routes = [];
    this.requests = [];
  }

  /**
   * Clears registered routes and captured requests
   */
  reset() {
    this.routes = [];
    this.requests = [];
  }

  /**
   * Clears only recorded requests, retaining route definitions
   */
  clearRequests() {
    this.requests = [];
  }

  on(method, urlMatcher, handlerOrData, status = 200, headers = {}) {
    if (typeof handlerOrData === 'function') {
      this.routes.push({ method, urlMatcher, handler: handlerOrData, headers });
    } else {
      this.routes.push({ method, urlMatcher, data: handlerOrData, status, headers });
    }
    return this;
  }

  onGet(urlMatcher, handlerOrData, status = 200, headers = {}) {
    return this.on('get', urlMatcher, handlerOrData, status, headers);
  }

  onPost(urlMatcher, handlerOrData, status = 200, headers = {}) {
    return this.on('post', urlMatcher, handlerOrData, status, headers);
  }

  onPut(urlMatcher, handlerOrData, status = 200, headers = {}) {
    return this.on('put', urlMatcher, handlerOrData, status, headers);
  }

  onDelete(urlMatcher, handlerOrData, status = 200, headers = {}) {
    return this.on('delete', urlMatcher, handlerOrData, status, headers);
  }

  getRequests() {
    return [...this.requests];
  }

  findRequest(urlMatcher, method = null) {
    return this.requests.find(r => {
      const matchMethod = !method || r.method === method.toLowerCase();
      const matchUrl = typeof urlMatcher === 'string'
        ? r.url.includes(urlMatcher)
        : urlMatcher instanceof RegExp
        ? urlMatcher.test(r.url)
        : urlMatcher(r.url);
      return matchMethod && matchUrl;
    });
  }

  filterRequests(urlMatcher, method = null) {
    return this.requests.filter(r => {
      const matchMethod = !method || r.method === method.toLowerCase();
      const matchUrl = typeof urlMatcher === 'string'
        ? r.url.includes(urlMatcher)
        : urlMatcher instanceof RegExp
        ? urlMatcher.test(r.url)
        : urlMatcher(r.url);
      return matchMethod && matchUrl;
    });
  }

  /**
   * Pre-registers standard 200 OK mocks for all 11 social platforms + Telegram + AI
   */
  setupDefaultPlatformMocks() {
    // 1. Facebook
    this.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/photos/, {
      id: 'fb_photo_id_101',
      post_id: 'fb_post_id_101'
    });
    this.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/video_reels/, (config) => {
      let data = {};
      try {
        data = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
      } catch (e) {
        data = config.data || {};
      }
      if (data.upload_phase === 'start') {
        return {
          video_id: 'fb_video_id_102',
          upload_url: 'https://rupload.facebook.com/video-upload/v27.0/fb_video_id_102'
        };
      }
      return {
        success: true,
        post_id: 'fb_post_id_102'
      };
    });
    this.onPost(/rupload\.facebook\.com\/video-upload/, {
      success: true
    });
    this.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/videos/, {
      id: 'fb_video_id_102'
    });
    this.onGet(/graph\.facebook\.com\/v\d+\.\d+\/fb_photo_id_101/, {
      id: 'fb_photo_id_101',
      link: 'https://www.facebook.com/photo.php?fbid=fb_photo_id_101'
    });
    this.onGet(/graph\.facebook\.com\/v\d+\.\d+\/fb_video_id_102/, {
      id: 'fb_video_id_102',
      permalink_url: '/reel/fb_video_id_102/'
    });
    this.onGet(/graph\.facebook\.com\/v\d+\.\d+\/ig_published_post_id_202/, {
      id: 'ig_published_post_id_202',
      permalink: 'https://www.instagram.com/p/ig_mock_permalink_202/'
    });
    this.onGet(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/accounts/, {
      data: [{
        id: '123456789',
        name: 'Lexa Trip Facebook Page',
        access_token: 'page_token_abc',
        category: 'Travel Company',
        instagram_business_account: {
          id: '17841400000000',
          username: 'lexatripjaisalmer',
          name: 'Lexa Trip Jaisalmer',
          profile_picture_url: 'https://example.com/ig.jpg'
        }
      }]
    });
    this.onGet(/graph\.facebook\.com\/v\d+\.\d+\/oauth\/access_token/, {
      access_token: 'long_lived_meta_master_token_xyz',
      token_type: 'bearer'
    });
    this.onGet(/graph\.facebook\.com\/v\d+\.\d+\/me(?:\?|$)/, {
      id: 'meta_user_id_103',
      name: 'Lexa Trip Admin'
    });

    // 2. Instagram
    this.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/media$/, {
      id: 'ig_container_id_201',
      uri: 'https://graph.facebook.com/v19.0/upload_session_201'
    });
    this.onPost('upload_session_201', { success: true });
    this.onGet(/graph\.facebook\.com\/v\d+\.\d+\/ig_container_id_201/, {
      status_code: 'FINISHED'
    });
    this.onPost(/graph\.facebook\.com\/v\d+\.\d+\/[^/]+\/media_publish/, {
      id: 'ig_published_post_id_202'
    });
    this.onGet(/graph\.facebook\.com\/v\d+\.\d+\/178414/, {
      id: '17841400000000',
      name: 'Lexa Trip Instagram',
      username: 'lexatripjaisalmer',
      followers_count: 14500,
      profile_picture_url: 'https://example.com/ig_avatar.jpg'
    });

    // 3. LinkedIn
    this.onGet('https://api.linkedin.com/v2/userinfo', {
      sub: 'li_user_sub_301',
      name: 'Lexa Trip Founder',
      email: 'admin@lexatrip.com'
    });
    this.onPost('https://api.linkedin.com/rest/posts', (config) => {
      return {
        status: 201,
        headers: { 'x-restli-id': 'urn:li:share:301987654' },
        data: { id: 'urn:li:share:301987654' }
      };
    });

    // 4. Pinterest
    this.onPost('https://api.pinterest.com/v5/pins', {
      id: 'pin_id_401',
      title: 'Lexa Trip Desert Safari',
      link: 'https://lexatrip.com/jaisalmer'
    });
    this.onGet('https://api.pinterest.com/v5/user_account', {
      username: 'Lexatripofficial',
      account_type: 'BUSINESS',
      pin_count: 50,
      profile_image: 'https://example.com/pin_profile.jpg'
    });
    this.onGet('https://api.pinterest.com/v5/boards', {
      items: [
        {
          id: '1131740650051300286',
          name: 'LexaTrip Jaisalmer',
          description: 'Official luxury desert camps board',
          privacy: 'PUBLIC',
          pin_count: 24
        }
      ]
    });
    this.onGet(/api\.pinterest\.com\/v5\/boards\/113174/, {
      id: '1131740650051300286',
      name: 'LexaTrip Jaisalmer',
      privacy: 'PUBLIC'
    });

    // 5. Blogger
    this.onPost(/www\.googleapis\.com\/blogger\/v3\/blogs\/[^/]+\/posts/, {
      id: 'blogger_post_id_501',
      url: 'https://lexatrip.blogspot.com/2026/11/jaisalmer-royal-tour.html',
      title: 'Jaisalmer Royal Tour',
      published: new Date().toISOString()
    });
    this.onGet(/www\.googleapis\.com\/blogger\/v3\/blogs\/[^/]+$/, {
      id: '8765432109876543210',
      name: 'Lexa Trip Travel Blog',
      url: 'https://lexatrip.blogspot.com',
      posts: { totalItems: 38 }
    });

    // 6. YouTube Data API v3
    this.onPost(/www\.googleapis\.com\/upload\/youtube\/v3\/videos/, (config) => {
      return {
        status: 200,
        headers: { location: 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=yt_session_601' },
        data: {}
      };
    });
    this.onPut(/www\.googleapis\.com\/upload\/youtube\/v3\/videos\?upload_id=/, {
      id: 'yt_video_id_601',
      snippet: {
        title: 'Desert Dunes in Jaisalmer #Shorts',
        publishedAt: new Date().toISOString()
      }
    });
    this.onGet(/www\.googleapis\.com\/youtube\/v3\/channels/, {
      items: [
        {
          snippet: { title: 'Lexa Trip Official', customUrl: '@lexatripofficial' },
          statistics: { subscriberCount: '18500' }
        }
      ]
    });
    this.onPost('https://oauth2.googleapis.com/token', {
      access_token: 'ya29.refreshed_oauth_token_602',
      expires_in: 3600,
      token_type: 'Bearer'
    });

    // 7. Twitter / X API v2
    this.onPost('https://upload.twitter.com/1.1/media/upload.json', {
      media_id_string: 'tw_media_id_701',
      size: 10240
    });
    this.onPost('https://api.twitter.com/2/tweets', {
      data: {
        id: '1859012345678901234',
        text: 'Experience the golden dunes of Jaisalmer with Lexa Trip.'
      }
    });
    this.onGet('https://api.twitter.com/2/users/me', {
      data: {
        id: 'tw_user_id_701',
        name: 'Lexa Trip Official',
        username: 'LexaTrip'
      }
    });

    // 8. Reddit
    this.onPost('https://www.reddit.com/api/v1/access_token', {
      access_token: 'reddit_bearer_token_801',
      token_type: 'bearer',
      expires_in: 3600,
      scope: 'submit identity'
    });
    this.onPost('https://oauth.reddit.com/api/submit', {
      json: {
        errors: [],
        data: {
          id: 't3_rd_post_802',
          name: 't3_rd_post_802',
          url: 'https://www.reddit.com/r/IndiaTravel/comments/rd_post_802/jaisalmer_guide/'
        }
      }
    });
    this.onPost('https://oauth.reddit.com/api/comment', {
      json: {
        errors: [],
        data: {
          things: [{ data: { id: 't1_rd_comment_803' } }]
        }
      }
    });
    this.onGet('https://oauth.reddit.com/api/v1/me', {
      id: 'reddit_user_801',
      name: 'LexaTripOfficial'
    });

    // 9. Threads
    this.onPost(/graph\.threads\.net\/v1\.0\/[^/]+\/threads$/, {
      id: 'threads_container_id_901'
    });
    this.onPost(/graph\.threads\.net\/v1\.0\/[^/]+\/threads_publish$/, {
      id: 'threads_post_id_902'
    });
    this.onGet(/graph\.threads\.net\/v1\.0\/me/, {
      id: 'threads_user_901',
      username: 'lexatripjaisalmer',
      name: 'Lexa Trip Threads'
    });

    // 10. Google Business Profile
    this.onPost(/mybusiness\.googleapis\.com\/v4\/.*localPosts/, {
      name: 'accounts/123/locations/456/localPosts/gmb_post_id_1001',
      searchUrl: 'https://maps.google.com/?cid=456',
      state: 'LIVE'
    });
    this.onGet('https://www.googleapis.com/oauth2/v3/userinfo', {
      sub: 'google_user_1001',
      name: 'Lexa Trip Business Profile'
    });

    // 11. WordPress / Blog
    this.onPost(/lexatrip\.com\/wp-json\/wp\/v2\/posts/, {
      id: 1101,
      link: 'https://lexatrip.com/blog/jaisalmer-luxury-camps/',
      status: 'publish',
      title: { rendered: 'Jaisalmer Luxury Camps' }
    });

    // 12. Telegram Bot API
    this.onGet(/api\.telegram\.org\/bot[^/]+\/getMe/, {
      ok: true,
      result: {
        id: 998877665,
        is_bot: true,
        first_name: 'Lexa Trip Alert Bot',
        username: 'lexatrip_alert_bot'
      }
    });
    this.onPost(/api\.telegram\.org\/bot[^/]+\/sendMessage/, {
      ok: true,
      result: {
        message_id: 123456,
        date: Math.floor(Date.now() / 1000),
        chat: { id: -1001234567890, title: 'Lexa Trip Alerts' },
        text: 'Alert text'
      }
    });
    this.onPost(/api\.telegram\.org\/bot[^/]+\/sendPhoto/, {
      ok: true,
      result: {
        message_id: 123457,
        date: Math.floor(Date.now() / 1000),
        chat: { id: -1001234567890, title: 'Lexa Trip Alerts' }
      }
    });
    this.onPost(/api\.telegram\.org\/bot[^/]+\/sendVideo/, {
      ok: true,
      result: {
        message_id: 123458,
        date: Math.floor(Date.now() / 1000),
        chat: { id: -1001234567890, title: 'Lexa Trip Alerts' }
      }
    });

    // 13. AI Engine (Gemini & OpenAI)
    const mockPostsJson = JSON.stringify({
      posts: [
        { index: 1, title: 'Golden Dunes Magic', caption: 'Witness the serene golden desert of Jaisalmer.', hashtags: '#Jaisalmer #DesertSafari' },
        { index: 2, title: 'Royal Fort Exploration', caption: 'Step inside the living fort of Jaisalmer.', hashtags: '#GoldenFort #TravelIndia' },
        { index: 3, title: 'Luxury Tent Stay', caption: 'Experience five-star hospitality under star-filled skies.', hashtags: '#DesertCamp #LuxuryTravel' },
        { index: 4, title: 'Cultural Folk Nights', caption: 'Enchanting Rajasthani dance and music in the sand.', hashtags: '#RajasthaniFolk #Culture' },
        { index: 5, title: 'Camel Safari Adventure', caption: 'Glide across dunes on an unforgettable camel trek.', hashtags: '#CamelSafari #IncredibleIndia' }
      ]
    });

    this.onPost(/generativelanguage\.googleapis\.com\/v1beta\/models\/.*:generateContent/, {
      candidates: [{
        content: {
          parts: [{ text: mockPostsJson }]
        }
      }]
    });
    this.onPost('https://api.openai.com/v1/chat/completions', {
      choices: [{
        message: { content: mockPostsJson }
      }]
    });

    return this;
  }
}

module.exports = new MockHttp();
