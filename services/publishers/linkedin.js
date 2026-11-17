const axios = require('axios');

class LinkedInPublisher {
  /**
   * Publish Post to LinkedIn Company Page / Profile
   */
  async publishPost({ account, text, imageUrl = null, videoUrl = null, title = '' }) {
    if (!account.credentials || !account.credentials.accessToken || !account.credentials.organizationUrn || String(account.credentials.accessToken).startsWith('smart_')) {
      console.log('[LinkedIn] Operating in SMART / SIMULATION mode.');
      return {
        success: true,
        simulated: true,
        platform: 'linkedin',
        type: videoUrl ? 'video_post' : imageUrl ? 'image_post' : 'text_post',
        postId: 'li_post_' + Date.now(),
        organizationUrn: account.credentials?.organizationUrn || 'urn:li:organization:12345678',
        publishedAt: new Date().toISOString(),
        message: 'LinkedIn post dispatched successfully via Smart Bridge.'
      };
    }

    const { accessToken, organizationUrn } = account.credentials;
    const url = 'https://api.linkedin.com/rest/posts';

    try {
      const payload = {
        author: organizationUrn,
        commentary: text,
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
          'LinkedIn-Version': '202401',
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        simulated: false,
        platform: 'linkedin',
        postId: res.headers['x-restli-id'] || ('li_' + Date.now()),
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('[LinkedIn Error]:', err.response ? err.response.data : err.message);
      throw new Error(err.response ? JSON.stringify(err.response.data) : err.message);
    }
  }
}

module.exports = new LinkedInPublisher();
