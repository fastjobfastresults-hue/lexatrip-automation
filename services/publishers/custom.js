const axios = require('axios');

class CustomPublisher {
  /**
   * Publish to generic Webhook, Custom API, or Future Platform
   */
  async publish({ account, payload }) {
    if (!account.credentials || !account.credentials.endpointUrl) {
      console.log(`[Custom Platform: ${account.name}] Operating in SIMULATION mode.`);
      return {
        success: true,
        simulated: true,
        platform: account.platform || 'custom',
        postId: 'sim_custom_' + Date.now(),
        publishedAt: new Date().toISOString(),
        message: `Simulation for custom destination: ${account.name}`
      };
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (account.credentials.authToken) {
        headers['Authorization'] = `Bearer ${account.credentials.authToken}`;
      }
      if (account.credentials.customHeaderKey && account.credentials.customHeaderValue) {
        headers[account.credentials.customHeaderKey] = account.credentials.customHeaderValue;
      }

      const res = await axios.post(account.credentials.endpointUrl, payload, { headers });

      return {
        success: true,
        simulated: false,
        platform: account.platform,
        postId: res.data?.id || ('custom_' + Date.now()),
        response: res.data,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      console.error(`[Custom Platform Error ${account.name}]:`, err.message);
      throw err;
    }
  }
}

module.exports = new CustomPublisher();
