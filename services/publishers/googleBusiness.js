const axios = require('axios');
const tunnelService = require('../tunnelService');

class GoogleBusinessPublisher {
  /**
   * Publish Local Post (What's New / Event / Offer) to Google Business Profile (GMB)
   * Official API: https://mybusiness.googleapis.com/v4/{parent=accounts/*/locations/*}/localPosts
   */
  async publishPost({ account, title, caption, mediaPath, destinationName, websiteUrl }) {
    const creds = account?.credentials || {};
    const { accessToken, locationId, accountId } = creds;
    const destUrl = websiteUrl || creds.bookingUrl || creds.websiteUrl || 'https://bookings.lexatrip.com/';
    const phone = creds.phone || '+91 90798 54982';

    if (!accessToken || !locationId) {
      throw new Error('Google Business Profile credentials missing: accessToken and locationId are required.');
    }

    if (String(accessToken).startsWith('smart_')) {
      throw new Error('Invalid Google Business Profile credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    try {
      let mediaItems = [];
      if (Array.isArray(mediaPath) && mediaPath.length > 0) {
        mediaItems = mediaPath.map(p => ({
          mediaFormat: 'PHOTO',
          sourceUrl: tunnelService.resolvePublicMediaUrl(p)
        }));
      } else if (mediaPath) {
        mediaItems = [
          {
            mediaFormat: 'PHOTO',
            sourceUrl: tunnelService.resolvePublicMediaUrl(mediaPath)
          }
        ];
      }

      let cleanSummary = `${title ? title + '\n\n' : ''}${caption || ''}`.trim();
      // Append booking info and WhatsApp contact if not already present
      if (!cleanSummary.includes('bookings.lexatrip.com') && !cleanSummary.includes('WhatsApp')) {
        cleanSummary += `\n\n🏨 Book Instant Deals: ${destUrl}\n💬 WhatsApp Inquiry: ${phone}`;
      }
      cleanSummary = cleanSummary.slice(0, 1500);

      const localPostPayload = {
        languageCode: 'en-US',
        summary: cleanSummary,
        callToAction: {
          actionType: creds.ctaType || 'BOOK',
          url: destUrl
        },
        topicType: 'STANDARD' // What's New / Hotel Offer post
      };

      if (mediaItems.length > 0) {
        localPostPayload.media = mediaItems;
      }

      const parentPath = locationId.startsWith('accounts/') 
        ? `${locationId}/localPosts` 
        : (accountId ? `accounts/${accountId}/${locationId}/localPosts` : `https://mybusiness.googleapis.com/v4/${locationId}/localPosts`);

      const url = parentPath.startsWith('http') ? parentPath : `https://mybusiness.googleapis.com/v4/${parentPath}`;

      console.log(`[Google Business Profile] Publishing Local Post to ${url}...`);

      const res = await axios.post(url, localPostPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      });

      return {
        success: true,
        simulated: false,
        platform: 'google_business',
        postId: res.data?.name || ('gmb_' + Date.now()),
        searchUrl: res.data?.searchUrl || `https://maps.google.com/?cid=${locationId}`,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errData = err.response?.data?.error?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Google Business Profile Error]:', errData);
      throw new Error(`Google Business Profile publish failed: ${errData}`);
    }
  }
}

module.exports = new GoogleBusinessPublisher();
