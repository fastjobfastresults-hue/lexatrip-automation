const axios = require('axios');
const tunnelService = require('../tunnelService');
const { sanitizePostText } = require('../textSanitizer');

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

    if (creds.status === 'trial_access_pending') {
      throw new Error(`Pinterest pin publish failed: Pinterest App (ID ${creds.appId || '1642972'}) is currently under Trial review by Pinterest. Pinterest requires Standard Access approval before allowing pin creation via API.`);
    }

    const publicImageUrl = tunnelService.resolvePublicMediaUrl(imageUrl);
    if (!publicImageUrl || (!publicImageUrl.startsWith('http://') && !publicImageUrl.startsWith('https://'))) {
      throw new Error(`Pinterest requires a publicly accessible HTTP/HTTPS image URL. Resolved: "${publicImageUrl}"`);
    }

    const url = 'https://api.pinterest.com/v5/pins';

    try {
      const cleanTitle = sanitizePostText(title || 'Lexa Trip Travel Experience');
      const cleanDesc = sanitizePostText(description || 'Experience the wonders of luxury travel with Lexa Trip.');
      const payload = {
        board_id: boardId,
        title: cleanTitle,
        description: cleanDesc,
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

      const pinId = res.data.id;
      const pinUrl = `https://www.pinterest.com/pin/${pinId}/`;
      return {
        success: true,
        simulated: false,
        platform: 'pinterest',
        type: 'standard_pin',
        pinId: pinId,
        pinUrl: pinUrl,
        postUrl: pinUrl,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errMsg = err.response?.data?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Pinterest Error]:', errMsg);
      if (err.response?.data?.code === 3 || String(errMsg).includes('consumer type is not supported')) {
        throw new Error('Pinterest pin publish failed: Your application is currently in Trial access on Pinterest. Pinterest requires Standard access approval before allowing pin creation via API.');
      }
      throw new Error(`Pinterest pin publish failed: ${errMsg}`);
    }
  }
}

module.exports = new PinterestPublisher();
