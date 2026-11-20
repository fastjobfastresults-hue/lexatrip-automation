const axios = require('axios');

class CustomPublisher {
  /**
   * Publish to generic Webhook, Custom API, or Future Platform
   */
  async publish({ account, payload }) {
    const creds = account?.credentials || {};
    if (!creds.endpointUrl) {
      throw new Error(`Custom publisher endpointUrl is missing for account: ${account?.name || 'custom'}`);
    }

    if (String(creds.endpointUrl).startsWith('smart_') || (creds.authToken && String(creds.authToken).startsWith('smart_'))) {
      throw new Error('Invalid Custom publisher credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (creds.authToken) {
        headers['Authorization'] = `Bearer ${creds.authToken}`;
      }
      if (creds.customHeaderKey && creds.customHeaderValue) {
        headers[creds.customHeaderKey] = creds.customHeaderValue;
      }

      const res = await axios.post(creds.endpointUrl, payload, { headers, timeout: 30000 });

      return {
        success: true,
        simulated: false,
        platform: account?.platform || 'custom',
        postId: res.data?.id || ('custom_' + Date.now()),
        response: res.data,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errDetail = err.response?.data?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error(`[Custom Platform Error ${account?.name || 'custom'}]:`, errDetail);
      throw new Error(`Custom platform publish failed: ${errDetail}`);
    }
  }
}

module.exports = new CustomPublisher();
