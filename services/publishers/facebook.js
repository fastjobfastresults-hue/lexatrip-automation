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

      const rawPostId = res.data.id || res.data.post_id;
      const cleanPostId = rawPostId?.includes('_') ? rawPostId.split('_')[1] : rawPostId;
      const photoId = res.data.id || cleanPostId;
      
      // Query Graph API for the direct canonical photo link
      let postUrl = `https://www.facebook.com/photo.php?fbid=${photoId}`;
      try {
        const photoInfo = await axios.get(`https://graph.facebook.com/v19.0/${photoId}`, {
          params: { fields: 'link', access_token: pageAccessToken },
          timeout: 10000
        });
        if (photoInfo.data?.link) {
          postUrl = photoInfo.data.link;
        }
      } catch (e) {
        console.warn('[Facebook Photo link fetch warning]:', e.message);
      }

      return {
        success: true,
        simulated: false,
        platform: 'facebook',
        postId: rawPostId,
        photoId,
        postUrl,
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

      const rawVideoId = res.data.id;
      // Direct Facebook Reel permalink from Graph API
      let reelUrl = `https://www.facebook.com/reel/${rawVideoId}/`;
      try {
        const vidInfo = await axios.get(`https://graph.facebook.com/v19.0/${rawVideoId}`, {
          params: { fields: 'permalink_url', access_token: pageAccessToken },
          timeout: 10000
        });
        if (vidInfo.data?.permalink_url) {
          reelUrl = vidInfo.data.permalink_url.startsWith('http')
            ? vidInfo.data.permalink_url
            : `https://www.facebook.com${vidInfo.data.permalink_url}`;
        }
      } catch (e) {
        console.warn('[Facebook Reel permalink fetch warning]:', e.message);
      }

      return {
        success: true,
        simulated: false,
        platform: 'facebook',
        type: 'reel',
        postId: rawVideoId,
        videoId: rawVideoId,
        reelUrl: reelUrl,
        watchUrl: reelUrl,
        postUrl: reelUrl,
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
