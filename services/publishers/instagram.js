const axios = require('axios');
const fs = require('fs');
const tunnelService = require('../tunnelService');

class InstagramPublisher {
  /**
   * Helper method to poll Instagram container status until processing completes
   */
  async pollContainerStatus(creationId, accessToken, maxAttempts = 20, delayMs = 3000) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, delayMs));
      const check = await axios.get(`https://graph.facebook.com/v19.0/${creationId}`, {
        params: { fields: 'status_code,status', access_token: accessToken },
        timeout: 15000
      });
      const status = check.data?.status_code;
      if (status === 'FINISHED') {
        return true;
      }
      if (status === 'ERROR') {
        throw new Error(`Instagram container ${creationId} processing failed: ${check.data?.status || 'ERROR'}`);
      }
      if (status === 'EXPIRED') {
        throw new Error(`Instagram container ${creationId} expired before publishing.`);
      }
      attempts++;
    }
    throw new Error(`Instagram container ${creationId} processing timed out after ${maxAttempts * (delayMs / 1000)}s.`);
  }

  /**
   * Publish Single Image Post (4:5) to Instagram
   */
  async publishImage({ account, mediaPath, caption }) {
    const creds = account?.credentials || {};
    const { accessToken, instagramAccountId } = creds;

    if (!accessToken || !instagramAccountId) {
      throw new Error('Instagram credentials missing: accessToken and instagramAccountId are required.');
    }

    if (String(accessToken).startsWith('smart_')) {
      throw new Error('Invalid Instagram credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    try {
      // Meta Graph API requires a publicly resolvable HTTPS URL
      const publicImageUrl = tunnelService.resolvePublicMediaUrl(mediaPath);
      if (!publicImageUrl || (!publicImageUrl.startsWith('http://') && !publicImageUrl.startsWith('https://'))) {
        throw new Error(`Instagram requires a public HTTP/HTTPS image URL. Resolved: "${publicImageUrl}"`);
      }

      const url = `https://graph.facebook.com/v19.0/${instagramAccountId}`;

      // Step 1: Create Media Container
      const containerRes = await axios.post(`${url}/media`, null, {
        params: {
          image_url: publicImageUrl,
          caption: caption,
          access_token: accessToken
        },
        timeout: 30000
      });
      const creationId = containerRes.data?.id;
      if (!creationId) {
        throw new Error('Instagram failed to create media container: no ID returned.');
      }

      // Step 2: Publish Media Container
      const publishRes = await axios.post(`${url}/media_publish`, null, {
        params: {
          creation_id: creationId,
          access_token: accessToken
        },
        timeout: 30000
      });

      const mediaId = publishRes.data?.id || creationId;
      let permalink = null;
      try {
        const mediaCheck = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
          params: { fields: 'permalink', access_token: accessToken },
          timeout: 10000
        });
        permalink = mediaCheck.data?.permalink;
      } catch (e) {
        console.warn('[Instagram Image permalink warning]:', e.message);
      }

      return {
        success: true,
        simulated: false,
        platform: 'instagram',
        type: 'image',
        postId: mediaId,
        postUrl: permalink || 'https://www.instagram.com/lexatripjaisalmer/',
        permalink: permalink,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errData = err.response?.data?.error?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Instagram Image Error]:', errData);
      throw new Error(`Instagram image publish failed: ${errData}`);
    }
  }

  /**
   * Publish Combined 5-Slide Carousel to Instagram
   */
  async publishCarousel({ account, mediaPaths, caption }) {
    const creds = account?.credentials || {};
    const { accessToken, instagramAccountId } = creds;

    if (!accessToken || !instagramAccountId) {
      throw new Error('Instagram credentials missing: accessToken and instagramAccountId are required.');
    }

    if (String(accessToken).startsWith('smart_')) {
      throw new Error('Invalid Instagram credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    if (!Array.isArray(mediaPaths) || mediaPaths.length < 2) {
      throw new Error('Instagram carousel requires at least 2 media items.');
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${instagramAccountId}`;
      const childrenIds = [];

      for (const p of mediaPaths) {
        const publicUrl = tunnelService.resolvePublicMediaUrl(p);
        if (!publicUrl || (!publicUrl.startsWith('http://') && !publicUrl.startsWith('https://'))) {
          throw new Error(`Instagram carousel requires public HTTP/HTTPS URLs. Resolved: "${publicUrl}"`);
        }

        const itemRes = await axios.post(`${url}/media`, null, {
          params: {
            image_url: publicUrl,
            is_carousel_item: true,
            access_token: accessToken
          },
          timeout: 30000
        });
        childrenIds.push(itemRes.data.id);
      }

      const carouselRes = await axios.post(`${url}/media`, null, {
        params: {
          media_type: 'CAROUSEL',
          children: childrenIds.join(','),
          caption: caption,
          access_token: accessToken
        },
        timeout: 30000
      });

      const carouselId = carouselRes.data.id;
      // Wait for carousel container processing
      await this.pollContainerStatus(carouselId, accessToken, 15, 2000);

      const publishRes = await axios.post(`${url}/media_publish`, null, {
        params: {
          creation_id: carouselId,
          access_token: accessToken
        },
        timeout: 30000
      });

      return {
        success: true,
        simulated: false,
        platform: 'instagram',
        type: 'carousel',
        postId: publishRes.data?.id || carouselId,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errData = err.response?.data?.error?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Instagram Carousel Error]:', errData);
      throw new Error(`Instagram carousel publish failed: ${errData}`);
    }
  }

  /**
   * Publish 12-Second Combined Ultra HD Reel to Instagram
   * Supports both Direct Resumable Binary Upload & Public Tunnel URL
   */
  async publishReel({ account, videoPath, caption }) {
    const creds = account?.credentials || {};
    const { accessToken, instagramAccountId } = creds;

    if (!accessToken || !instagramAccountId) {
      throw new Error('Instagram credentials missing: accessToken and instagramAccountId are required.');
    }

    if (String(accessToken).startsWith('smart_')) {
      throw new Error('Invalid Instagram credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${instagramAccountId}`;
      let creationId = null;

      // Attempt 1: Direct Resumable Binary Upload (Streams directly from disk to Graph API!)
      try {
        console.log('[Instagram Reel] Initializing direct binary resumable upload...');
        const initRes = await axios.post(`${url}/media`, null, {
          params: {
            media_type: 'REELS',
            upload_type: 'resumable',
            caption: caption,
            share_to_feed: true,
            access_token: accessToken
          },
          timeout: 30000
        });

        creationId = initRes.data?.id;
        const uploadUrl = initRes.data?.uri;

        if (uploadUrl && videoPath && fs.existsSync(videoPath)) {
          const stats = fs.statSync(videoPath);
          const videoStream = fs.createReadStream(videoPath);

          await axios.post(uploadUrl, videoStream, {
            headers: {
              Authorization: `OAuth ${accessToken}`,
              offset: '0',
              file_size: stats.size.toString(),
              'Content-Type': 'application/octet-stream'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 120000
          });
          console.log('[Instagram Reel] Binary stream uploaded successfully!');
        }
      } catch (binaryErr) {
        console.log('[Instagram Reel] Direct binary upload fallback to public URL:', binaryErr.message);
        // Fallback to Public URL via Tunnel
        const publicVideoUrl = tunnelService.resolvePublicMediaUrl(videoPath);
        if (!publicVideoUrl || (!publicVideoUrl.startsWith('http://') && !publicVideoUrl.startsWith('https://'))) {
          throw new Error(`Instagram Reel requires a public HTTP/HTTPS URL or valid video path. Binary error: ${binaryErr.message}`);
        }

        const containerRes = await axios.post(`${url}/media`, null, {
          params: {
            media_type: 'REELS',
            video_url: publicVideoUrl,
            caption: caption,
            share_to_feed: true,
            access_token: accessToken
          },
          timeout: 45000
        });
        creationId = containerRes.data?.id;
      }

      if (!creationId) {
        throw new Error('Instagram failed to initiate Reel container: no ID returned.');
      }

      // Step 2: Poll Container Status until ready
      await this.pollContainerStatus(creationId, accessToken, 20, 3000);

      // Step 3: Publish Reel
      const publishRes = await axios.post(`${url}/media_publish`, null, {
        params: {
          creation_id: creationId,
          access_token: accessToken
        },
        timeout: 45000
      });

      const mediaId = publishRes.data?.id || creationId;
      let permalink = null;
      try {
        const mediaCheck = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
          params: { fields: 'permalink', access_token: accessToken },
          timeout: 10000
        });
        permalink = mediaCheck.data?.permalink;
      } catch (e) {
        console.warn('[Instagram Reel permalink warning]:', e.message);
      }

      return {
        success: true,
        simulated: false,
        platform: 'instagram',
        type: 'reel',
        postId: mediaId,
        videoId: mediaId,
        reelUrl: permalink || 'https://www.instagram.com/lexatripjaisalmer/reels/',
        postUrl: permalink || 'https://www.instagram.com/lexatripjaisalmer/reels/',
        permalink: permalink,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errData = err.response?.data?.error?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Instagram Reel Error]:', errData);
      throw new Error(`Instagram Reel publish failed: ${errData}`);
    }
  }
}

module.exports = new InstagramPublisher();
