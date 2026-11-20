const axios = require('axios');
const tunnelService = require('../tunnelService');

class BloggerPublisher {
  /**
   * Publish SEO Travel Article to Google Blogger (.blogspot.com)
   * via official Google Blogger API v3
   */
  async publishPost({ account, title, caption, hashtags = '', mediaPath = null, destinationName = 'Lexa Trip' }) {
    const creds = account?.credentials || {};
    const blogId = creds.blogId || account?.handle || '';
    const apiKey = creds.accessToken || creds.apiKey || '';

    if (!blogId || !apiKey) {
      throw new Error('Blogger credentials missing: blogId and OAuth2 accessToken/apiKey are required.');
    }

    if (String(apiKey).startsWith('smart_')) {
      throw new Error('Invalid Blogger credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    try {
      // Clean blog ID (numbers only or handle)
      const cleanBlogId = blogId.replace(/[^0-9]/g, '') || blogId;
      const url = `https://www.googleapis.com/blogger/v3/blogs/${cleanBlogId}/posts/`;

      // Extract labels from hashtags
      const labels = (hashtags || '')
        .split(/\s+/)
        .filter(t => t.startsWith('#'))
        .map(t => t.replace('#', ''))
        .slice(0, 10);

      // Resolve public image URL if available
      let imageHtml = '';
      if (mediaPath) {
        const publicMediaUrl = tunnelService.resolvePublicMediaUrl(mediaPath);
        if (publicMediaUrl) {
          imageHtml = `
            <div class="separator" style="clear: both; text-align: center; margin-bottom: 20px;">
              <img border="0" src="${publicMediaUrl}" alt="${title}" style="max-width: 100%; height: auto; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />
            </div>
          `;
        }
      }

      // Generate engaging, SEO-optimized HTML travel blog post
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #2d3748; font-size: 16px;">
          ${imageHtml}
          
          <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; margin-top: 10px; margin-bottom: 16px;">
            ✦ ${title} ✦
          </h2>
          
          <p style="font-size: 17px; margin-bottom: 20px; color: #4a5568;">
            ${(caption || '').replace(/\n/g, '<br/>')}
          </p>

          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 5px solid #d97706; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 18px; font-weight: 700;">
              ✈️ Plan Your Unforgettable Journey to ${destinationName}
            </h4>
            <p style="margin: 0; color: #78350f; font-size: 14px;">
              Lexa Trip offers personalized royal itineraries, luxury desert camping, seamless sightseeing, and unforgettable travel experiences.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #718096;">
            <b>Tags:</b> ${labels.map(l => `<span style="background: #edf2f7; padding: 4px 10px; border-radius: 20px; margin-right: 6px; display: inline-block; margin-top: 5px;">#${l}</span>`).join(' ')}
          </div>
        </div>
      `;

      const headers = { 'Content-Type': 'application/json' };
      const params = {};

      if (apiKey.startsWith('AIzaSy')) {
        params.key = apiKey;
      } else {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const res = await axios.post(url, {
        kind: 'blogger#post',
        title: title,
        content: htmlContent,
        labels: labels
      }, {
        headers,
        params,
        timeout: 25000
      });

      return {
        success: true,
        simulated: false,
        platform: 'blogger',
        postId: res.data.id,
        url: res.data.url,
        publishedAt: res.data.published || new Date().toISOString()
      };
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Blogger API Error]:', errMsg);
      throw new Error(`Blogger post publish failed: ${errMsg}`);
    }
  }
}

module.exports = new BloggerPublisher();
