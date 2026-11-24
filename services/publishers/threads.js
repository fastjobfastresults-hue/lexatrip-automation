const axios = require('axios');
const tunnelService = require('../tunnelService');
const { sanitizePostText } = require('../textSanitizer');

class ThreadsPublisher {
  /**
   * Publish Post (Text, Image, or Video) to Threads via Meta Threads API
   * Endpoint: https://graph.threads.net/v1.0/
   */
  async publishPost({ account, text, imageUrl, videoUrl }) {
    const creds = account?.credentials || {};
    const accessToken = creds.accessToken || creds.pageAccessToken;
    const userId = creds.threadsUserId || creds.instagramAccountId || 'me';

    if (!accessToken) {
      throw new Error('Threads credentials missing: accessToken is required.');
    }

    if (String(accessToken).startsWith('smart_')) {
      throw new Error('Invalid Threads credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    try {
      const cleanText = sanitizePostText(text || '');
      let mediaType = 'TEXT';
      const containerParams = {
        access_token: accessToken,
        text: cleanText
      };

      if (videoUrl) {
        mediaType = 'VIDEO';
        containerParams.media_type = 'VIDEO';
        const publicVidUrl = tunnelService.resolvePublicMediaUrl(videoUrl);
        if (!publicVidUrl || (!publicVidUrl.startsWith('http://') && !publicVidUrl.startsWith('https://'))) {
          throw new Error(`Threads video requires a public HTTP/HTTPS URL. Resolved: "${publicVidUrl}"`);
        }
        containerParams.video_url = publicVidUrl;
      } else if (imageUrl) {
        mediaType = 'IMAGE';
        containerParams.media_type = 'IMAGE';
        const publicImgUrl = tunnelService.resolvePublicMediaUrl(imageUrl);
        if (!publicImgUrl || (!publicImgUrl.startsWith('http://') && !publicImgUrl.startsWith('https://'))) {
          throw new Error(`Threads image requires a public HTTP/HTTPS URL. Resolved: "${publicImgUrl}"`);
        }
        containerParams.image_url = publicImgUrl;
      } else {
        containerParams.media_type = 'TEXT';
      }

      console.log(`[Threads] Creating ${mediaType} container for ${userId}...`);

      // 1. Create Media Container on Threads API
      const containerRes = await axios.post(`https://graph.threads.net/v1.0/${userId}/threads`, null, {
        params: containerParams,
        timeout: 30000
      });

      const creationId = containerRes.data?.id;
      if (!creationId) {
        throw new Error('Failed to create Threads container: No container ID returned.');
      }

      // If video, poll status until finished
      if (mediaType === 'VIDEO') {
        let attempts = 0;
        let status = 'IN_PROGRESS';
        while (status === 'IN_PROGRESS' && attempts < 15) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          const check = await axios.get(`https://graph.threads.net/v1.0/${creationId}`, {
            params: { fields: 'status,error_message', access_token: accessToken },
            timeout: 10000
          });
          status = check.data?.status;
          if (status === 'FINISHED') break;
          if (status === 'ERROR') {
            throw new Error(`Threads container processing failed: ${check.data?.error_message || 'ERROR'}`);
          }
          attempts++;
        }
        if (status !== 'FINISHED' && attempts >= 15) {
          throw new Error('Threads container processing timed out.');
        }
      }

      // 2. Publish Container
      console.log(`[Threads] Publishing container ${creationId}...`);
      const publishRes = await axios.post(`https://graph.threads.net/v1.0/${userId}/threads_publish`, null, {
        params: {
          creation_id: creationId,
          access_token: accessToken
        },
        timeout: 30000
      });

      const postId = publishRes.data?.id || creationId;
      const cleanHandle = (account.handle || '').replace(/^threads\.net\/@?/, '').replace(/^@/, '');

      return {
        success: true,
        simulated: false,
        platform: 'threads',
        postId: postId,
        url: cleanHandle ? `https://www.threads.net/@${cleanHandle}/post/${postId}` : `https://www.threads.net/post/${postId}`,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      const errData = err.response?.data?.error?.message || (err.response ? JSON.stringify(err.response.data) : err.message);
      console.error('[Threads API Error]:', errData);
      throw new Error(`Threads publish failed: ${errData}`);
    }
  }
}

module.exports = new ThreadsPublisher();
