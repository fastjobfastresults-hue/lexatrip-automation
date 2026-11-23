const axios = require('axios');
const db = require('../database/db');

class TokenLifetimeEngine {
  constructor() {
    this.metaAppId = process.env.META_APP_ID || '1610475786797567';
    this.metaAppSecret = process.env.META_APP_SECRET || 'c3c76a1853a1a213e67c2c9655914caf';
  }

  /**
   * Proactively inspect and ensure a Meta Page Access Token is permanent (Never Expiring).
   * If a User token is passed, automatically exchanges it for a Lifetime Page Token.
   */
  async ensureMetaLifetimeToken(token, pageId = null) {
    if (!token || typeof token !== 'string' || token.startsWith('smart_')) {
      return { valid: false, reason: 'Invalid or missing token' };
    }

    try {
      // 1. Inspect token via Meta debug_token endpoint
      const debugRes = await axios.get('https://graph.facebook.com/debug_token', {
        params: {
          input_token: token,
          access_token: `${this.metaAppId}|${this.metaAppSecret}`
        },
        timeout: 10000
      });

      const tokenData = debugRes.data?.data;
      if (!tokenData || !tokenData.is_valid) {
        return { valid: false, reason: 'Token is invalid or expired according to Meta.' };
      }

      const isPageToken = tokenData.type === 'PAGE';
      const isLifetime = tokenData.expires_at === 0;

      // If it's already a lifetime page token, return immediately
      if (isPageToken && isLifetime) {
        return {
          valid: true,
          isLifetime: true,
          type: 'PAGE',
          token,
          pageId: tokenData.profile_id || pageId,
          expiresAt: 'Never (Lifetime)',
          scopes: tokenData.scopes || []
        };
      }

      // 2. If it's a User token or has an expiration, exchange it for a 60-day Long-Lived Token first
      let longLivedToken = token;
      try {
        const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.metaAppId}&client_secret=${this.metaAppSecret}&fb_exchange_token=${token}`;
        const exRes = await axios.get(exchangeUrl, { timeout: 10000 });
        if (exRes.data?.access_token) {
          longLivedToken = exRes.data.access_token;
        }
      } catch (exErr) {
        console.warn('[TokenLifetimeEngine] Meta token exchange warning:', exErr.response?.data?.error?.message || exErr.message);
      }

      // 3. If target pageId is known, query /me/accounts to get the permanent Page token
      if (pageId) {
        try {
          const accountsRes = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
            params: {
              fields: 'id,name,access_token',
              access_token: longLivedToken
            },
            timeout: 10000
          });
          const matchingPage = (accountsRes.data?.data || []).find(p => String(p.id) === String(pageId));
          if (matchingPage?.access_token) {
            console.log(`[TokenLifetimeEngine] Successfully obtained Lifetime Page Token for Page ${pageId} (${matchingPage.name})`);
            return {
              valid: true,
              isLifetime: true,
              type: 'PAGE',
              token: matchingPage.access_token,
              pageId: matchingPage.id,
              expiresAt: 'Never (Lifetime)',
              scopes: tokenData.scopes || []
            };
          }
        } catch (accErr) {
          console.warn('[TokenLifetimeEngine] Could not retrieve accounts:', accErr.response?.data?.error?.message || accErr.message);
        }
      }

      return {
        valid: true,
        isLifetime: isLifetime,
        type: tokenData.type,
        token: longLivedToken,
        pageId: tokenData.profile_id || pageId,
        expiresAt: isLifetime ? 'Never (Lifetime)' : new Date(tokenData.expires_at * 1000).toISOString(),
        scopes: tokenData.scopes || []
      };
    } catch (err) {
      console.warn('[TokenLifetimeEngine] Meta debug error:', err.response?.data?.error?.message || err.message);
      return { valid: false, reason: err.response?.data?.error?.message || err.message };
    }
  }

  /**
   * Automatically refresh Pinterest Access Token using OAuth Refresh Token
   * Returns a fresh 30-day access token and a rolling 365-day refresh token.
   */
  async refreshPinterestToken({ appId, appSecret, refreshToken }) {
    if (!appId || !appSecret || !refreshToken) {
      throw new Error('Pinterest refresh requires appId, appSecret, and refreshToken.');
    }

    try {
      const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString('base64');
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);

      const res = await axios.post('https://api.pinterest.com/v5/oauth/token', params.toString(), {
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      });

      const { access_token, refresh_token, expires_in, refresh_token_expires_in } = res.data;
      console.log('✅ Pinterest Token successfully auto-refreshed via OAuth rolling refresh token!');

      return {
        success: true,
        accessToken: access_token,
        refreshToken: refresh_token || refreshToken,
        expiresIn: expires_in,
        refreshTokenExpiresIn: refresh_token_expires_in,
        refreshedAt: new Date().toISOString()
      };
    } catch (err) {
      const errMsg = err.response?.data?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[TokenLifetimeEngine] Pinterest refresh failed:', errMsg);
      throw new Error(`Pinterest token refresh failed: ${errMsg}`);
    }
  }

  /**
   * Automatically refresh Google Blogger OAuth2 Token using offline refresh token
   */
  async refreshGoogleBloggerToken({ clientId, clientSecret, refreshToken }) {
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Google OAuth refresh requires clientId, clientSecret, and refreshToken.');
    }

    try {
      const res = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }, { timeout: 10000 });

      return {
        success: true,
        accessToken: res.data.access_token,
        expiresIn: res.data.expires_in,
        tokenType: res.data.token_type,
        refreshedAt: new Date().toISOString()
      };
    } catch (err) {
      const errMsg = err.response?.data?.error_description || err.response?.data?.error || err.message;
      console.error('[TokenLifetimeEngine] Google Blogger refresh failed:', errMsg);
      throw new Error(`Google Blogger token refresh failed: ${errMsg}`);
    }
  }

  /**
   * Pre-flight Health Check across all channels for a given destination.
   * Runs non-destructive health checks so that scheduling or publishing never fails blind.
   */
  async preflightDestinationChannels(destination) {
    if (!destination || !destination.channels) {
      return { ok: false, reason: 'Destination has no channels configured' };
    }

    const report = {
      destinationId: destination.id,
      destinationName: destination.name,
      checkedAt: new Date().toISOString(),
      channels: {}
    };

    const channels = destination.channels;

    // 1. Facebook Check
    if (channels.facebook && channels.facebook.enabled !== false) {
      const fbCreds = channels.facebook.credentials || {};
      const token = fbCreds.pageAccessToken || fbCreds.accessToken;
      const pageId = fbCreds.pageId;
      if (!token || !pageId) {
        report.channels.facebook = { ok: false, error: 'Credentials missing (pageAccessToken/pageId)' };
      } else {
        try {
          const res = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
            params: { fields: 'id,name,is_published', access_token: token },
            timeout: 8000
          });
          report.channels.facebook = {
            ok: true,
            pageId: res.data.id,
            pageName: res.data.name,
            isPublished: res.data.is_published,
            isLifetime: fbCreds.isLifetime || true
          };
        } catch (e) {
          report.channels.facebook = { ok: false, error: e.response?.data?.error?.message || e.message };
        }
      }
    }

    // 2. Instagram Check
    if (channels.instagram && channels.instagram.enabled !== false) {
      const igCreds = channels.instagram.credentials || {};
      const token = igCreds.accessToken || igCreds.pageAccessToken;
      const igId = igCreds.instagramAccountId;
      if (!token || !igId) {
        report.channels.instagram = { ok: false, error: 'Credentials missing (accessToken/instagramAccountId)' };
      } else {
        try {
          const res = await axios.get(`https://graph.facebook.com/v19.0/${igId}`, {
            params: { fields: 'id,username,name', access_token: token },
            timeout: 8000
          });
          report.channels.instagram = {
            ok: true,
            instagramAccountId: res.data.id,
            username: res.data.username,
            name: res.data.name
          };
        } catch (e) {
          report.channels.instagram = { ok: false, error: e.response?.data?.error?.message || e.message };
        }
      }
    }

    // 3. LinkedIn Check
    if (channels.linkedin && channels.linkedin.enabled !== false) {
      const liCreds = channels.linkedin.credentials || {};
      const token = liCreds.accessToken;
      if (!token) {
        report.channels.linkedin = { ok: false, error: 'Credentials missing (accessToken)' };
      } else {
        try {
          const res = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000
          });
          report.channels.linkedin = {
            ok: true,
            author: res.data.name,
            sub: res.data.sub,
            email: res.data.email
          };
        } catch (e) {
          report.channels.linkedin = { ok: false, error: e.response?.data?.message || e.message };
        }
      }
    }

    // 4. Pinterest Check
    if (channels.pinterest && channels.pinterest.enabled !== false) {
      const pinCreds = channels.pinterest.credentials || {};
      const token = pinCreds.accessToken;
      if (!token) {
        report.channels.pinterest = { ok: false, error: 'Credentials missing (accessToken)' };
      } else {
        try {
          const res = await axios.get('https://api.pinterest.com/v5/user_account', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000
          });
          report.channels.pinterest = {
            ok: true,
            username: res.data.username,
            accountType: res.data.account_type
          };
        } catch (e) {
          const is401 = e.response?.status === 401;
          report.channels.pinterest = {
            ok: false,
            needsRefresh: is401,
            error: is401 ? 'Pinterest Token expired. Needs 1-click renewal.' : (e.response?.data?.message || e.message)
          };
        }
      }
    }

    return report;
  }
}

module.exports = new TokenLifetimeEngine();
