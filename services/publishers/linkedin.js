const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sanitizePostText } = require('../textSanitizer');

class LinkedInPublisher {
  /**
   * Helper to fetch or read image buffer and detect MIME type
   */
  async getImageBuffer(mediaPath, imageUrl) {
    const target = mediaPath || imageUrl;
    if (!target) return null;

    try {
      if (typeof target === 'string' && fs.existsSync(target)) {
        const ext = path.extname(target).toLowerCase();
        let mime = 'image/jpeg';
        if (ext === '.png') mime = 'image/png';
        else if (ext === '.webp') mime = 'image/webp';
        else if (ext === '.gif') mime = 'image/gif';
        return { buffer: fs.readFileSync(target), mime };
      }

      if (typeof target === 'string' && target.startsWith('http')) {
        const resp = await axios.get(target, { responseType: 'arraybuffer', timeout: 15000 });
        const contentType = resp.headers['content-type'] || 'image/jpeg';
        return { buffer: Buffer.from(resp.data), mime: contentType.split(';')[0].trim() };
      }
    } catch (err) {
      console.warn('[LinkedIn] Could not load image for upload:', err.message);
    }
    return null;
  }

  /**
   * Upload image to LinkedIn DMS and return image URN (urn:li:image:...)
   */
  async uploadImage(accessToken, authorUrn, imageInfo) {
    if (!imageInfo || !imageInfo.buffer) return null;

    try {
      // Step 1: Initialize upload
      const initRes = await axios.post('https://api.linkedin.com/rest/images?action=initializeUpload', {
        initializeUploadRequest: {
          owner: authorUrn
        }
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'LinkedIn-Version': '202601',
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      const { uploadUrl, image } = initRes.data?.value || {};
      if (!uploadUrl || !image) {
        console.warn('[LinkedIn] Failed to get uploadUrl from initializeUpload');
        return null;
      }

      // Step 2: Upload image binary
      await axios.put(uploadUrl, imageInfo.buffer, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': imageInfo.mime || 'image/jpeg'
        },
        timeout: 30000
      });

      console.log(`[LinkedIn] Image uploaded successfully to LinkedIn: ${image}`);
      return image;
    } catch (err) {
      console.warn('[LinkedIn] Image upload failed:', err.response?.data?.message || err.message);
      return null;
    }
  }

  /**
   * Publish Post to LinkedIn Company Page / Profile with Full Photo & Formatting
   */
  async publishPost({ account, text, imageUrl = null, mediaPath = null, videoUrl = null, title = '' }) {
    if (!account?.credentials || !account.credentials.accessToken) {
      throw new Error('LinkedIn credentials missing: accessToken is required.');
    }

    if (String(account.credentials.accessToken).startsWith('smart_')) {
      throw new Error('Invalid LinkedIn credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    const { accessToken, organizationUrn } = account.credentials;
    const url = 'https://api.linkedin.com/rest/posts';
    const linkedinVersion = '202601';

    // Auto-detect member URN via OpenID userinfo
    let memberUrn = null;
    try {
      const userInfoRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000
      });
      const memberSub = userInfoRes.data?.sub;
      if (memberSub) {
        memberUrn = `urn:li:person:${memberSub}`;
      }
    } catch (e) {
      console.warn('[LinkedIn] Could not fetch userinfo:', e.message);
    }

    // Determine target author: try organization if requested or configured, otherwise personal member URN
    let targetAuthor = memberUrn || organizationUrn;
    if ((account.credentials.preferOrganization || account.credentials.publishAsOrganization || account.publishAsOrganization || account.isOrganization) && organizationUrn) {
      targetAuthor = organizationUrn;
    }
    if (!targetAuthor) {
      throw new Error('LinkedIn publish failed: unable to determine author URN. Please configure organizationUrn or ensure token has w_member_social/openid permissions.');
    }

    // Sanitize commentary and title against raw entity tags and formatting artifacts
    const cleanCommentary = sanitizePostText(text || title || '');
    const cleanPostTitle = sanitizePostText(title || 'Lexa Trip Destination');

    // Load image buffer if media is provided
    const imageInfo = await this.getImageBuffer(mediaPath, imageUrl);

    // Inner publish helper
    const attemptPublish = async (author) => {
      let imageUrn = null;
      if (imageInfo) {
        imageUrn = await this.uploadImage(accessToken, author, imageInfo);
      }

      const payload = {
        author: author,
        commentary: cleanCommentary,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false
      };

      if (imageUrn) {
        payload.content = {
          media: {
            id: imageUrn,
            title: cleanPostTitle
          }
        };
      }

      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': linkedinVersion,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      });

      const postId = res.headers['x-restli-id'] || ('li_' + Date.now());
      const postUrl = postId.startsWith('urn:li:') ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}/` : 'https://www.linkedin.com/feed/';
      console.log(`[LinkedIn] Post published successfully: ${postId} (Author: ${author}, HasImage: ${!!imageUrn}) Link: ${postUrl}`);

      return {
        success: true,
        simulated: false,
        platform: 'linkedin',
        postId: postId,
        postUrl: postUrl,
        author: author,
        hasImage: !!imageUrn,
        publishedAt: new Date().toISOString()
      };
    };

    try {
      return await attemptPublish(targetAuthor);
    } catch (err) {
      const errMsg = err.response?.data?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      
      // If organization permission is missing (requires w_organization_social via Community Management API),
      // only fall back to personal profile if explicitly allowed by destination credentials
      if (targetAuthor !== memberUrn && memberUrn && (err.response?.status === 400 || err.response?.status === 403)) {
        if (account.credentials?.allowPersonalFallback === true) {
          console.warn(`[LinkedIn] Organization publish not authorized for ${targetAuthor} (${errMsg}). Falling back to personal profile ${memberUrn}.`);
          try {
            const fallbackResult = await attemptPublish(memberUrn);
            fallbackResult.warning = `Posted to personal profile (${memberUrn}) because LinkedIn Company Page posting requires the Community Management API (w_organization_social scope).`;
            return fallbackResult;
          } catch (fallbackErr) {
            const fbMsg = fallbackErr.response?.data?.message || fallbackErr.message;
            throw new Error(`LinkedIn post failed: ${fbMsg}`);
          }
        } else {
          throw new Error(`LinkedIn Company Page (${targetAuthor}) प्रकाशन के लिए Community Management API (w_organization_social) LinkedIn द्वारा रिव्यू में है। पर्सनल प्रोफ़ाइल पर पोस्टिंग नीतिगत रूप से रोकी गई है।`);
        }
      }

      console.error('[LinkedIn Error]:', errMsg);
      throw new Error(`LinkedIn post failed: ${errMsg}`);
    }
  }
}

module.exports = new LinkedInPublisher();
