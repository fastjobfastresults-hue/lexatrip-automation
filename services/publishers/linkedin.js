const axios = require('axios');

class LinkedInPublisher {
  /**
   * Publish Post to LinkedIn Company Page / Profile
   */
  async publishPost({ account, text, imageUrl = null, videoUrl = null, title = '' }) {
    if (!account?.credentials || !account.credentials.accessToken) {
      throw new Error('LinkedIn credentials missing: accessToken is required.');
    }

    if (String(account.credentials.accessToken).startsWith('smart_')) {
      throw new Error('Invalid LinkedIn credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    const { accessToken, organizationUrn } = account.credentials;
    const url = 'https://api.linkedin.com/rest/posts';
    const linkedinVersion = '202601';

    // Auto-detect author: use member URN (urn:li:person:...) since personal token has w_member_social
    let authorUrn = organizationUrn;
    try {
      const userInfoRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000
      });
      const memberSub = userInfoRes.data?.sub;
      if (memberSub) {
        authorUrn = `urn:li:person:${memberSub}`;
      }
    } catch (e) {
      console.warn('[LinkedIn] Could not fetch userinfo, checking configured author:', authorUrn);
    }

    if (!authorUrn) {
      throw new Error('LinkedIn publish failed: unable to determine author URN. Please configure organizationUrn or ensure token has w_member_social/openid permissions.');
    }

    try {
      const payload = {
        author: authorUrn,
        commentary: text || title || '',
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false
      };

      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': linkedinVersion,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      });

      const postId = res.headers['x-restli-id'] || ('li_' + Date.now());
      console.log(`[LinkedIn] Post published successfully: ${postId} (Author: ${authorUrn})`);

      return {
        success: true,
        simulated: false,
        platform: 'linkedin',
        postId: postId,
        author: authorUrn,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errMsg = err.response?.data?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[LinkedIn Error]:', errMsg);
      throw new Error(`LinkedIn post failed: ${errMsg}`);
    }
  }
}

module.exports = new LinkedInPublisher();
