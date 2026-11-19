const axios = require('axios');
const querystring = require('querystring');
const db = require('../../database/db');

class RedditPublisher {
  constructor() {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Get OAuth2 Access Token for Reddit Script App
   */
  async getAccessToken({ clientId, clientSecret, username, password }) {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.cachedToken;
    }

    if (!clientId || !clientSecret || !username || !password) {
      throw new Error('Missing Reddit credentials (clientId, clientSecret, username, or password).');
    }

    const authHeader = 'Basic ' + Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
    const userAgent = `web:LexaTripAutomation:v1.0 (by /u/${username.trim()})`;

    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      querystring.stringify({
        grant_type: 'password',
        username: username.trim(),
        password: password.trim()
      }),
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': userAgent
        },
        timeout: 15000
      }
    );

    if (response.data && response.data.access_token) {
      this.cachedToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;
      return this.cachedToken;
    } else {
      throw new Error('Failed to retrieve Reddit access token: ' + JSON.stringify(response.data));
    }
  }

  /**
   * Submit Text or Link Post to Subreddit or User Profile
   */
  async submitPost({ account, subreddit = 'IndiaTravel', title, text, url, kind = 'self' }) {
    const creds = account.credentials || {};
    const clientId = creds.clientId;
    const clientSecret = creds.clientSecret;
    const username = creds.username;
    const password = creds.password;

    const token = await this.getAccessToken({ clientId, clientSecret, username, password });
    const userAgent = `web:LexaTripAutomation:v1.0 (by /u/${username.trim()})`;

    const postPayload = {
      api_type: 'json',
      sr: subreddit.replace(/^r\//, '').trim(),
      kind: kind === 'link' ? 'link' : 'self',
      title: title.trim(),
      resubmit: 'true',
      sendreplies: 'true'
    };

    if (kind === 'link' && url) {
      postPayload.url = url;
    } else {
      postPayload.text = text;
    }

    const res = await axios.post(
      'https://oauth.reddit.com/api/submit',
      querystring.stringify(postPayload),
      {
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': userAgent
        },
        timeout: 20000
      }
    );

    const json = res.data?.json;
    if (json?.errors && json.errors.length > 0) {
      throw new Error('Reddit submit error: ' + JSON.stringify(json.errors));
    }

    const postUrl = json?.data?.url || `https://www.reddit.com/r/${subreddit}/`;
    const postId = json?.data?.id || json?.data?.name;

    return {
      success: true,
      platform: 'reddit',
      postId,
      postUrl,
      subreddit
    };
  }

  /**
   * Submit Comment Reply (for Q&A responses)
   */
  async submitComment({ account, parentThingId, text }) {
    const creds = account.credentials || {};
    const clientId = creds.clientId;
    const clientSecret = creds.clientSecret;
    const username = creds.username;
    const password = creds.password;

    const token = await this.getAccessToken({ clientId, clientSecret, username, password });
    const userAgent = `web:LexaTripAutomation:v1.0 (by /u/${username.trim()})`;

    const res = await axios.post(
      'https://oauth.reddit.com/api/comment',
      querystring.stringify({
        api_type: 'json',
        thing_id: parentThingId,
        text: text
      }),
      {
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': userAgent
        },
        timeout: 20000
      }
    );

    const json = res.data?.json;
    if (json?.errors && json.errors.length > 0) {
      throw new Error('Reddit comment error: ' + JSON.stringify(json.errors));
    }

    return {
      success: true,
      platform: 'reddit',
      commentId: json?.data?.things?.[0]?.data?.id
    };
  }
}

module.exports = new RedditPublisher();
