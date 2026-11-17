const axios = require('axios');

class BlogPublisher {
  /**
   * Publish article to WordPress Blog via REST API
   */
  async publishArticle({ account, title, content, excerpt, categories = [], tags = [] }) {
    if (!account.credentials || !account.credentials.apiUrl || !account.credentials.username) {
      console.log('[Blog / WordPress] Operating in SIMULATION mode.');
      return {
        success: true,
        simulated: true,
        platform: 'blog',
        postId: 'sim_blog_' + Date.now(),
        url: 'https://lexatrip.com/blog/simulated-post',
        publishedAt: new Date().toISOString(),
        message: 'Blog post simulated for Lexa Trip Jaisalmer Blog.'
      };
    }

    const { apiUrl, username, applicationPassword } = account.credentials;
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
          }
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
      console.error('[Blog Error]:', err.response ? err.response.data : err.message);
      throw new Error(err.response ? JSON.stringify(err.response.data) : err.message);
    }
  }
}

module.exports = new BlogPublisher();
