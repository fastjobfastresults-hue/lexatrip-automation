const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

class FacebookPublisher {
  /**
   * Direct binary upload of photo to Facebook Page
   */
  async publishPhoto({ account, filePath, caption }) {
    const creds = account?.credentials || {};
    const { pageAccessToken, pageId } = creds;

    if (!pageAccessToken || !pageId) {
      throw new Error('Facebook Page credentials missing: pageAccessToken and pageId are required.');
    }

    if (String(pageAccessToken).startsWith('smart_')) {
      throw new Error('Invalid Facebook credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`Facebook Photo upload failed: file does not exist at "${filePath}".`);
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      const form = new FormData();
      if (caption) {
        form.append('caption', caption);
      }
      form.append('access_token', pageAccessToken);
      form.append('source', fs.createReadStream(filePath));

      const res = await axios.post(url, form, {
        headers: form.getHeaders(),
        timeout: 60000
      });

      return {
        success: true,
        simulated: false,
        platform: 'facebook',
        postId: res.data.id || res.data.post_id,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errDetail = err.response?.data?.error?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Facebook Photo Error]:', errDetail);
      throw new Error(`Facebook Photo publish failed: ${errDetail}`);
    }
  }

  /**
   * Direct binary upload of Reel / Video to Facebook Page
   */
  async publishReel({ account, videoPath, caption }) {
    const creds = account?.credentials || {};
    const { pageAccessToken, pageId } = creds;

    if (!pageAccessToken || !pageId) {
      throw new Error('Facebook Reel credentials missing: pageAccessToken and pageId are required.');
    }

    if (String(pageAccessToken).startsWith('smart_')) {
      throw new Error('Invalid Facebook credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    if (!videoPath || !fs.existsSync(videoPath)) {
      throw new Error(`Facebook Reel upload failed: video file does not exist at "${videoPath}".`);
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${pageId}/videos`;
      const form = new FormData();
      if (caption) {
        form.append('description', caption);
      }
      form.append('access_token', pageAccessToken);
      form.append('source', fs.createReadStream(videoPath));

      const res = await axios.post(url, form, {
        headers: form.getHeaders(),
        timeout: 120000
      });

      return {
        success: true,
        simulated: false,
        platform: 'facebook',
        type: 'reel',
        postId: res.data.id,
        videoId: res.data.id,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errDetail = err.response?.data?.error?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Facebook Reel Error]:', errDetail);
      throw new Error(`Facebook Reel publish failed: ${errDetail}`);
    }
  }
}

module.exports = new FacebookPublisher();
