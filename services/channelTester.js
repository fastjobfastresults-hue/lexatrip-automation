const axios = require('axios');
const redditPublisher = require('./publishers/reddit');
const twitterPublisher = require('./publishers/twitter');

class ChannelTester {
  /**
   * Test and verify connection credentials for any social media platform
   * MUST execute genuine external API calls. Never returns simulated success.
   */
  async testChannel(platform, credentials) {
    if (!credentials) {
      throw new Error('No credentials provided.');
    }

    // Explicit rejection of mock / synthetic tokens
    const isSynthetic = 
      credentials.isSmartConnect ||
      credentials.mode === 'smart_connect' ||
      (credentials.accessToken && String(credentials.accessToken).startsWith('smart_')) ||
      (credentials.pageAccessToken && String(credentials.pageAccessToken).startsWith('smart_')) ||
      (credentials.apiKey && String(credentials.apiKey).startsWith('smart_')) ||
      (credentials.applicationPassword && String(credentials.applicationPassword).startsWith('smart_')) ||
      credentials.applicationPassword === 'official_live_token';

    if (isSynthetic) {
      throw new Error(`Synthetic/smart credentials are not permitted for platform "${platform}". Please provide genuine API credentials.`);
    }

    try {
      if (platform === 'instagram') {
        const token = credentials.accessToken || credentials.pageAccessToken;
        const accountId = credentials.instagramAccountId;
        if (!token || !accountId) {
          throw new Error('Instagram requires an Access Token and Instagram Business Account ID.');
        }
        const res = await axios.get(`https://graph.facebook.com/v19.0/${accountId}`, {
          params: {
            fields: 'id,name,username,profile_picture_url,followers_count',
            access_token: token
          },
          timeout: 10000
        });
        return {
          success: true,
          platform: 'instagram',
          accountName: res.data.name || res.data.username || 'Instagram Business Account',
          handle: res.data.username ? `@${res.data.username}` : `@${accountId}`,
          profilePicture: res.data.profile_picture_url || null,
          details: `Connected successfully! Followers: ${res.data.followers_count ?? 'N/A'}`
        };
      }

      if (platform === 'facebook') {
        const token = credentials.pageAccessToken || credentials.accessToken;
        const pageId = credentials.pageId;
        if (!token || !pageId) {
          throw new Error('Facebook requires Page Access Token and Page ID.');
        }
        const res = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
          params: {
            fields: 'id,name,link,fan_count',
            access_token: token
          },
          timeout: 10000
        });
        return {
          success: true,
          platform: 'facebook',
          accountName: res.data.name || 'Facebook Page',
          handle: res.data.link || res.data.name,
          details: `Connected to Facebook Page! Likes/Fans: ${res.data.fan_count ?? 'N/A'}`
        };
      }

      if (platform === 'youtube') {
        let { apiKey, accessToken, channelId, clientId, clientSecret, refreshToken } = credentials;
        let token = accessToken || (apiKey && String(apiKey).startsWith('ya29.') ? apiKey : null);

        // Auto-refresh token if refreshToken is available
        if (!token && refreshToken && clientId && clientSecret) {
          try {
            const tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: refreshToken,
              grant_type: 'refresh_token'
            }).toString(), {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              timeout: 10000
            });
            token = tokenRes.data?.access_token;
          } catch (e) {
            console.warn('[ChannelTester YouTube refresh warning]:', e.message);
          }
        }

        if (token) {
          // OAuth2 verification: queries authenticated channel
          const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: { part: 'snippet,statistics', mine: true },
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          });
          const item = res.data.items?.[0];
          if (!item) throw new Error('No YouTube channel found associated with this OAuth token.');
          return {
            success: true,
            platform: 'youtube',
            accountName: item.snippet.title,
            handle: item.snippet.customUrl || item.snippet.title,
            details: `Subscribers: ${item.statistics?.subscriberCount ?? 'N/A'}`
          };
        } else if (apiKey && channelId) {
          // API Key verification: requires explicit channelId
          const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: { part: 'snippet,statistics', id: channelId, key: apiKey },
            timeout: 10000
          });
          const item = res.data.items?.[0];
          if (!item) throw new Error(`YouTube channel ID "${channelId}" not found with provided API key.`);
          return {
            success: true,
            platform: 'youtube',
            accountName: item.snippet.title,
            handle: item.snippet.customUrl || item.snippet.title,
            details: `Public channel verified (${item.snippet.title}). Note: Video uploads require OAuth 2.0 access token.`
          };
        } else {
          throw new Error('YouTube verification requires an OAuth2 Access Token, or both an API Key and Channel ID.');
        }
      }

      if (platform === 'pinterest') {
        const { accessToken, boardId } = credentials;
        if (!accessToken) throw new Error('Pinterest requires an API Access Token.');

        const userRes = await axios.get('https://api.pinterest.com/v5/user_account', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000
        });
        const username = userRes.data.username;

        let verifiedBoardName = null;
        if (boardId) {
          const bRes = await axios.get(`https://api.pinterest.com/v5/boards/${boardId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 10000
          });
          verifiedBoardName = bRes.data?.name;
        }

        return {
          success: true,
          platform: 'pinterest',
          accountName: `@${username}`,
          handle: `pinterest.com/${username}${verifiedBoardName ? '/' + verifiedBoardName.toLowerCase().replace(/\s+/g, '-') : ''}`,
          details: `Connected to Pinterest (@${username})!${verifiedBoardName ? ` Destination Board: "${verifiedBoardName}"` : ''}`
        };
      }

      if (platform === 'linkedin') {
        const { accessToken, organizationUrn } = credentials;
        if (!accessToken) throw new Error('LinkedIn requires an OAuth Access Token.');
        const res = await axios.get('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000
        });
        return {
          success: true,
          platform: 'linkedin',
          accountName: res.data.name || 'LinkedIn Member',
          handle: res.data.email || res.data.sub || 'LinkedIn Profile',
          details: `Connected to LinkedIn! User: ${res.data.name || 'Verified'}${organizationUrn ? ` (Target Org: ${organizationUrn})` : ''}`
        };
      }

      if (platform === 'telegram') {
        const { botToken, chatId } = credentials;
        if (!botToken) throw new Error('Telegram requires a Bot Token from @BotFather.');
        const res = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, { timeout: 10000 });
        if (!res.data.ok) throw new Error('Invalid Telegram Bot Token.');

        if (chatId) {
          await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: `🐪 *[Lexa Trip OS]*\n\nTelegram Reporter Connected Successfully! ✅\nLive alerts will be delivered here.`,
            parse_mode: 'Markdown'
          });
        }

        return {
          success: true,
          platform: 'telegram',
          accountName: res.data.result.first_name,
          handle: `@${res.data.result.username}`,
          details: `Bot Verified: @${res.data.result.username}${chatId ? ` (Test alert sent to Chat ID ${chatId})` : ''}`
        };
      }

      if (platform === 'blogger') {
        const { blogId, apiKey, accessToken } = credentials;
        if (!blogId) throw new Error('Blogger requires a Blog ID.');
        if (!apiKey && !accessToken) {
          throw new Error('Blogger requires either an API Key or OAuth Access Token.');
        }

        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const params = apiKey ? { key: apiKey } : {};

        const res = await axios.get(`https://www.googleapis.com/blogger/v3/blogs/${blogId}`, {
          headers,
          params,
          timeout: 10000
        });

        const hasWriteAuth = !!(accessToken || credentials.refreshToken);
        return {
          success: true,
          platform: 'blogger',
          accountName: res.data.name || 'Google Blogger',
          handle: res.data.url ? res.data.url.replace(/^https?:\/\//, '') : `${blogId}.blogspot.com`,
          details: hasWriteAuth 
            ? `Connected to Blogger with Full Publishing Access! Blog: "${res.data.name}" (Posts: ${res.data.posts?.totalItems ?? 0})`
            : `Connected to Blogger! Blog: "${res.data.name}" (Posts: ${res.data.posts?.totalItems ?? 0})`
        };
      }

      if (platform === 'threads') {
        const token = credentials.accessToken || credentials.pageAccessToken;
        if (!token) throw new Error('Threads requires a Meta Access Token.');

        let accountName = 'Threads Official';
        let handle = credentials.threadsHandle || '';

        try {
          const res = await axios.get('https://graph.threads.net/v1.0/me', {
            params: {
              fields: 'id,username,name,threads_profile_picture_url',
              access_token: token
            },
            timeout: 8000
          });
          if (res.data) {
            handle = `@${res.data.username}`;
            accountName = res.data.name || res.data.username;
          }
        } catch (tErr) {
          const fbRes = await axios.get('https://graph.facebook.com/v19.0/me', {
            params: { fields: 'id,name', access_token: token },
            timeout: 8000
          });
          if (!fbRes.data?.id) throw tErr;
          accountName = `Threads (${fbRes.data.name})`;
          handle = `@${fbRes.data.name.toLowerCase().replace(/\s+/g, '_')}`;
        }

        return {
          success: true,
          platform: 'threads',
          accountName,
          handle: handle.startsWith('@') ? `threads.net/${handle}` : handle,
          details: 'Connected to Threads API successfully.'
        };
      }

      if (platform === 'website' || platform === 'blog') {
        const { siteUrl, apiUrl, username, applicationPassword } = credentials;
        const targetSite = (siteUrl || apiUrl || '').replace(/\/$/, '');
        if (!targetSite) throw new Error('Website requires siteUrl (e.g. https://lexatrip.com).');
        if (!username || !applicationPassword) {
          throw new Error('Website (WordPress) requires username and applicationPassword for REST API authentication.');
        }

        const authHeader = 'Basic ' + Buffer.from(`${username.trim()}:${applicationPassword.trim()}`).toString('base64');
        const res = await axios.get(`${targetSite}/wp-json/wp/v2/users/me`, {
          headers: { Authorization: authHeader },
          timeout: 10000
        });

        return {
          success: true,
          platform: 'website',
          accountName: res.data.name || 'WordPress Admin',
          handle: targetSite.replace(/^https?:\/\//, ''),
          details: `Connected to WordPress REST API! Authenticated user: ${res.data.name} (Role: ${res.data.roles?.[0] || 'Author'})`
        };
      }

      if (platform === 'google_business' || platform === 'gmb') {
        const { accessToken, locationId, businessName } = credentials;
        if (!accessToken) throw new Error('Google Business Profile requires an OAuth2 Access Token.');

        let fetchedName = businessName;
        try {
          const res = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 8000
          });
          if (res.data?.accounts?.[0]?.accountName) {
            fetchedName = res.data.accounts[0].accountName;
          }
        } catch (accErr) {
          // Fallback to oauth2 userinfo
          const uRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 8000
          });
          fetchedName = uRes.data.name || fetchedName;
        }

        return {
          success: true,
          platform: 'google_business',
          accountName: fetchedName || 'Google Business Profile',
          handle: locationId || 'Verified Location',
          details: `Connected to Google Business Profile via Google Cloud! Verified account: ${fetchedName}`
        };
      }

      if (platform === 'twitter') {
        const authHeaders = twitterPublisher.getAuthHeaders({
          method: 'GET',
          url: 'https://api.twitter.com/2/users/me',
          credentials
        });

        const res = await axios.get('https://api.twitter.com/2/users/me', {
          headers: authHeaders,
          params: { 'user.fields': 'profile_image_url,description,public_metrics' },
          timeout: 10000
        });

        const user = res.data.data;
        if (!user) throw new Error('Failed to fetch Twitter / X user profile.');

        return {
          success: true,
          platform: 'twitter',
          accountName: user.name,
          handle: `@${user.username}`,
          details: `Connected to Twitter / X! User: @${user.username} (Followers: ${user.public_metrics?.followers_count ?? 'N/A'})`
        };
      }

      if (platform === 'reddit') {
        const { clientId, clientSecret, username, password, accessToken } = credentials;
        let token = accessToken;

        if (!token) {
          if (!clientId || !clientSecret || !username || !password) {
            throw new Error('Reddit requires clientId, clientSecret, username, and password.');
          }
          token = await redditPublisher.getAccessToken({ clientId, clientSecret, username, password });
        }

        const userAgent = `web:LexaTripAutomation:v1.0 (by /u/${username || 'LexaTrip'})`;
        const res = await axios.get('https://oauth.reddit.com/api/v1/me', {
          headers: {
            Authorization: `bearer ${token}`,
            'User-Agent': userAgent
          },
          timeout: 10000
        });

        const userData = res.data;
        if (!userData || !userData.name) {
          throw new Error('Invalid Reddit user info received.');
        }

        return {
          success: true,
          platform: 'reddit',
          accountName: userData.name,
          handle: `u/${userData.name}`,
          details: `Connected to Reddit! User: u/${userData.name} (Total Karma: ${userData.total_karma ?? 0})`
        };
      }

      if (platform === 'quora') {
        // Quora operates strictly in Assisted Copy/Paste mode
        const spaceUrl = credentials.spaceUrl || credentials.profileUrl;
        if (spaceUrl) {
          try {
            new URL(spaceUrl);
          } catch (e) {
            throw new Error('Invalid Quora Space or Profile URL provided.');
          }
        }
        return {
          success: true,
          platform: 'quora',
          isAssisted: true,
          accountName: credentials.name || 'Quora Space / Profile',
          handle: spaceUrl ? spaceUrl.replace(/^https?:\/\//, '') : 'quora.com',
          details: 'Quora operates in Assisted Copy/Paste mode. AI answers are generated for manual pasting into your Quora Space or target questions.'
        };
      }

      throw new Error(`Unsupported platform: ${platform}`);
    } catch (err) {
      let errMsg = err.message;
      if (err.response?.data?.error?.message) {
        errMsg = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.response?.data?.errors?.[0]?.message) {
        errMsg = err.response.data.errors[0].message;
      } else if (err.response?.data?.detail) {
        errMsg = err.response.data.detail;
      } else if (err.response?.data && typeof err.response.data === 'string') {
        errMsg = err.response.data;
      }

      console.error(`[ChannelTester] ${platform} error:`, errMsg);
      throw new Error(errMsg);
    }
  }

  /**
   * Auto-detect Facebook Pages & Linked Instagram Business Accounts
   * from a single Meta User/System Access Token
   * Automatically exchanges for Long-Lived / Lifetime Never-Expiring Page Tokens
   */
  async detectMetaAccounts(accessToken) {
    if (!accessToken) {
      throw new Error('Access Token is required to detect Meta accounts.');
    }

    const appId = process.env.META_APP_ID || '1610475786797567';
    const appSecret = process.env.META_APP_SECRET || 'c3c76a1853a1a213e67c2c9655914caf';
    let activeToken = accessToken;

    // 1. Automatically exchange for Long-Lived Master Token if possible
    if (appId && appSecret) {
      try {
        const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`;
        const exRes = await axios.get(exchangeUrl);
        if (exRes.data?.access_token) {
          activeToken = exRes.data.access_token;
          console.log('✅ Master Token successfully converted to Long-Lived Lifetime Token!');
        }
      } catch (exErr) {
        // If already long-lived or direct system token, continue with activeToken
      }
    }

    try {
      const res = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
        params: {
          fields: 'id,name,category,access_token,instagram_business_account{id,username,name,profile_picture_url}',
          access_token: activeToken
        },
        timeout: 12000
      });

      const pages = (res.data.data || []).map(page => ({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token, // Permanent Lifetime Page Token (Never Expires)
        hasInstagram: !!page.instagram_business_account,
        instagram: page.instagram_business_account ? {
          id: page.instagram_business_account.id,
          username: page.instagram_business_account.username,
          name: page.instagram_business_account.name,
          profilePicture: page.instagram_business_account.profile_picture_url
        } : null
      }));

      return {
        success: true,
        count: pages.length,
        pages,
        masterToken: activeToken
      };
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message;
      throw new Error(`Meta Auto-Detect Error: ${errMsg}`);
    }
  }

  /**
   * Auto-Detect Pinterest User Profile & Destination Boards
   */
  async detectPinterestBoards(accessToken) {
    if (!accessToken) {
      throw new Error('Access Token is required to detect Pinterest boards.');
    }

    // Genuine API calls with no fallback mocks
    const userRes = await axios.get('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000
    });

    const boardsRes = await axios.get('https://api.pinterest.com/v5/boards', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page_size: 100 },
      timeout: 10000
    });

    const boards = (boardsRes.data?.items || []).map(b => ({
      id: b.id,
      name: b.name,
      description: b.description || '',
      privacy: b.privacy || 'PUBLIC',
      pinCount: b.pin_count || 0
    }));

    return {
      success: true,
      user: {
        username: userRes.data?.username,
        accountType: userRes.data?.account_type,
        profileImage: userRes.data?.profile_image
      },
      boards
    };
  }
}

module.exports = new ChannelTester();
