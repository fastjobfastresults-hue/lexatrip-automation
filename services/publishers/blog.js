const axios = require('axios');

class BlogPublisher {
  /**
   * Publish article to WordPress Blog via REST API
   */
  async publishArticle({ account, title, content, excerpt, categories = [], tags = [] }) {
    const creds = account?.credentials || {};
    const { username, applicationPassword } = creds;
    const siteUrl = creds.siteUrl || creds.apiUrl || 'https://lexatrip.com';
    const apiUrl = creds.apiUrl || `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2`;

    if (!username || !applicationPassword) {
      throw new Error('WordPress / Blog credentials missing: username and applicationPassword are required.');
    }

    if (applicationPassword === 'official_live_token' || String(applicationPassword).startsWith('smart_')) {
      throw new Error('Invalid WordPress credentials: placeholder tokens cannot be used for live publishing.');
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${applicationPassword}`).toString('base64');

    try {
      const endpoint = `${apiUrl.replace(/\/$/, '')}/posts`;
      const res = await axios.post(
        endpoint,
        {
          title: title,
          content: content,
          excerpt: excerpt,
          status: 'publish'
        },
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 25000
        }
      );

      return {
        success: true,
        simulated: false,
        platform: 'blog',
        postId: res.data.id,
        url: res.data.link,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errDetail = err.response?.data?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Blog Error]:', errDetail);
      throw new Error(`WordPress publish failed: ${errDetail}`);
    }
  }
}

module.exports = new BlogPublisher();
