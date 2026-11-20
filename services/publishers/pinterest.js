const axios = require('axios');
const tunnelService = require('../tunnelService');

class PinterestPublisher {
  /**
   * Publish Pin (Image or Video) to Pinterest Board
   */
  async publishPin({ account, imageUrl, videoUrl = null, title, description, link }) {
    const creds = account?.credentials || {};
    const { accessToken, boardId } = creds;

    if (!accessToken || !boardId) {
      throw new Error('Pinterest credentials missing: accessToken and boardId are required.');
    }

    if (String(accessToken).startsWith('smart_')) {
      throw new Error('Invalid Pinterest credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    const publicImageUrl = tunnelService.resolvePublicMediaUrl(imageUrl);
    if (!publicImageUrl || (!publicImageUrl.startsWith('http://') && !publicImageUrl.startsWith('https://'))) {
      throw new Error(`Pinterest requires a publicly accessible HTTP/HTTPS image URL. Resolved: "${publicImageUrl}"`);
    }

    const url = 'https://api.pinterest.com/v5/pins';

    try {
      const payload = {
        board_id: boardId,
        title: title || 'Lexa Trip Travel Experience',
        description: description || 'Experience the wonders of luxury travel with Lexa Trip.',
        link: link || 'https://lexatrip.com',
        media_source: {
          source_type: 'image_url',
          url: publicImageUrl
        }
      };

      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return {
        success: true,
        simulated: false,
        platform: 'pinterest',
        type: 'standard_pin',
        pinId: res.data.id,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errMsg = err.response?.data?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Pinterest Error]:', errMsg);
      throw new Error(`Pinterest pin publish failed: ${errMsg}`);
    }
  }
}

module.exports = new PinterestPublisher();
