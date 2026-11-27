const axios = require('axios');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const tunnelService = require('../tunnelService');
const seoGenerator = require('../seoGenerator');
const { sanitizePostText } = require('../textSanitizer');

let db = null;
try {
  db = require('../../database/db');
} catch (e) {
  try {
    db = require('../database/db');
  } catch (e2) {}
}

class BloggerPublisher {
  /**
   * Publish SEO Travel Article to Google Blogger (.blogspot.com)
   * Supports DUAL LIFETIME PUBLISHING ENGINES:
   * 1. Google Blogger API v3 via Lifetime OAuth2 Auto-Refresh Token
   * 2. Mail2Blogger (Publish via Secret Email - 100% Zero-Maintenance Native Blogger Feature)
   */
  async publishPost({ account, title, caption, hashtags = '', mediaPath = null, imageUrl = null, destinationName = 'Lexa Trip', destination = null }) {
    // 1. Auto-resolve destination if omitted
    if (!destination && db && typeof db.getDestinations === 'function') {
      try {
        const allDests = db.getDestinations();
        destination = allDests.find(d => 
          d.name === destinationName || 
          d.channels?.blogger?.credentials?.blogId === account?.credentials?.blogId ||
          d.channels?.blogger?.handle === account?.handle
        ) || allDests[0];
      } catch (dErr) {}
    }

    const creds = account?.credentials || destination?.channels?.blogger?.credentials || {};
    const blogId = creds.blogId || account?.handle || destination?.channels?.blogger?.credentials?.blogId || '';
    let apiKey = creds.accessToken || creds.apiKey || '';
    const secretEmail = creds.secretEmail || creds.email || null;

    // Multi-Tier OAuth Token Resolution:
    // Tier 1: Direct blogger credentials
    // Tier 2: Destination YouTube credentials
    // Tier 3: Database Jaisalmer master credentials
    const ytCreds = destination?.channels?.youtube?.credentials;
    let jMasterCreds = null;
    try {
      if (db && typeof db.getDestinations === 'function') {
        jMasterCreds = db.getDestinations().find(d => d.id === 'dest_jaisalmer')?.channels?.blogger?.credentials;
      }
    } catch (e) {}

    const refreshToken = creds.refreshToken || ytCreds?.refreshToken || jMasterCreds?.refreshToken || process.env.GOOGLE_REFRESH_TOKEN;
    const clientId = creds.clientId || ytCreds?.clientId || jMasterCreds?.clientId || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = creds.clientSecret || ytCreds?.clientSecret || jMasterCreds?.clientSecret || process.env.GOOGLE_CLIENT_SECRET;

    // Helper: Refresh OAuth token on demand
    const refreshAccessToken = async () => {
      if (refreshToken && clientId && clientSecret) {
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }, { timeout: 10000 });
        if (tokenRes.data?.access_token) {
          return tokenRes.data.access_token;
        }
      }
      return null;
    };

    // Guaranteed Google Blogger OAuth Access Token from Master Auth:
    if (!apiKey || apiKey.startsWith('AIzaSy') || !apiKey.startsWith('ya29.')) {
      try {
        const googleMasterAuth = require('../googleMasterAuth');
        const masterToken = await googleMasterAuth.getBloggerAccessToken();
        if (masterToken) apiKey = masterToken;
      } catch (gErr) {
        console.warn('[Blogger Publisher] Master auth error:', gErr.message);
      }
    }

    if (String(apiKey).startsWith('smart_')) {
      throw new Error('Invalid Blogger credentials: smart_ placeholder tokens cannot be used for live publishing.');
    }

    // Determine Publishing Mode:
    // If Mail2Blogger is explicitly preferred AND real SMTP is available
    const hasSmtp = !!(creds.smtp?.host || process.env.SMTP_HOST);
    const preferMail = creds.publishMethod === 'mail' && hasSmtp && secretEmail;
    if (preferMail) {
      console.log(`[Blogger Publisher] Using Mail2Blogger Secret Mail Engine for ${destinationName} -> ${secretEmail}`);
      return await this.publishViaEmail({
        account,
        secretEmail,
        title,
        caption,
        hashtags,
        mediaPath: mediaPath || imageUrl,
        destinationName,
        destination,
        smtpConfig: creds.smtp || null
      });
    }

    if (!blogId || !apiKey) {
      throw new Error(`Blogger credentials missing: blogId (${blogId || 'none'}) and OAuth2 accessToken/apiKey are required.`);
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
      let publicMediaUrl = null;
      const mediaTarget = mediaPath || imageUrl;
      if (mediaTarget) {
        if (typeof mediaTarget === 'string' && mediaTarget.startsWith('http')) {
          publicMediaUrl = mediaTarget;
        } else {
          publicMediaUrl = tunnelService.resolvePublicMediaUrl(mediaTarget);
        }
        if (publicMediaUrl) {
          imageHtml = `
            <div class="separator" style="clear: both; text-align: center; margin-bottom: 20px;">
              <img border="0" src="${publicMediaUrl}" alt="${title}" style="max-width: 100%; height: auto; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />
            </div>
          `;
        }
      }

      // Sanitize title and caption against entity markers and bracket artifacts
      const cleanTitle = sanitizePostText(title || `${destinationName} Royal Travel Guide`);
      const cleanCaption = sanitizePostText(caption || '');

      // Generate a 100% Human-Friendly, Google Helpful Content E-E-A-T Compliant Blog Article
      let htmlContent = '';
      let finalTitle = cleanTitle;
      let finalLabels = labels;

      if (cleanCaption && (cleanCaption.includes('<article') || (cleanCaption.includes('<div') && cleanCaption.includes('<h2')))) {
        htmlContent = cleanCaption;
      } else {
        const fullArticle = seoGenerator.generateDestinationHumanBlogArticle({
          destination: destination || { name: destinationName, slug: destinationName.toLowerCase().replace(/[^a-z0-9]/g, '') },
          title: cleanTitle,
          caption: cleanCaption,
          mediaUrl: publicMediaUrl
        });
        htmlContent = fullArticle.htmlContent;
        if (fullArticle.title) finalTitle = fullArticle.title;
        if (Array.isArray(fullArticle.tags) && fullArticle.tags.length > 0) {
          const combined = Array.from(new Set([...finalLabels, ...fullArticle.tags]));
          finalLabels = combined.slice(0, 15);
        }
      }

      const headers = { 'Content-Type': 'application/json' };
      const params = {};

      if (apiKey.startsWith('AIzaSy')) {
        params.key = apiKey;
      } else {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      let res;
      try {
        res = await axios.post(url, {
          kind: 'blogger#post',
          title: finalTitle,
          content: htmlContent,
          labels: finalLabels
        }, {
          headers,
          params,
          timeout: 25000
        });
      } catch (postErr) {
        // If network reset or timeout, retry once after 1s
        if (postErr.code === 'ECONNRESET' || postErr.code === 'ETIMEDOUT' || postErr.message?.includes('socket') || postErr.message?.includes('timeout')) {
          console.log('[Blogger Publisher] Transient network glitch (' + postErr.message + '), retrying in 1.5s...');
          await new Promise(r => setTimeout(r, 1500));
          res = await axios.post(url, {
            kind: 'blogger#post',
            title: finalTitle,
            content: htmlContent,
            labels: finalLabels
          }, {
            headers,
            params,
            timeout: 30000
          });
        }
        // If 401 Unauthorized, attempt forced token refresh from Master Auth and retry once
        else if (postErr.response?.status === 401) {
          console.log('[Blogger Publisher] Received 401, forcing fresh OAuth2 token exchange from Master Auth...');
          let retryToken = null;
          try {
            const googleMasterAuth = require('../googleMasterAuth');
            googleMasterAuth._bloggerTokenCache = null;
            retryToken = await googleMasterAuth.getBloggerAccessToken();
          } catch (rErr) {
            retryToken = await refreshAccessToken();
          }
          if (retryToken) {
            headers.Authorization = `Bearer ${retryToken}`;
            res = await axios.post(url, {
              kind: 'blogger#post',
              title: finalTitle,
              content: htmlContent,
              labels: finalLabels
            }, {
              headers,
              params: {},
              timeout: 30000
            });
          } else {
            throw postErr;
          }
        } else {
          throw postErr;
        }
      }

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

      // Automated Fallback Engine: If real SMTP credentials exist, attempt Mail2Blogger
      if (secretEmail && (creds.smtp?.host || process.env.SMTP_HOST)) {
        console.log(`[Blogger Publisher] Primary API failed. Engaging Fallback Engine: Mail2Blogger for ${destinationName}...`);
        try {
          return await this.publishViaEmail({
            account,
            secretEmail,
            title,
            caption,
            hashtags,
            mediaPath: mediaPath || imageUrl,
            destinationName,
            destination,
            smtpConfig: creds.smtp || null
          });
        } catch (mErr) {
          console.warn('[Blogger Fallback Mail2Blogger Warning]:', mErr.message);
        }
      }

      if (err.response?.status === 403 && apiKey.startsWith('AIzaSy')) {
        throw new Error(`Blogger post publish failed: Google API Key (AIzaSy...) cannot publish blog posts. Google Blogger API requires OAuth2 Access Token with scope https://www.googleapis.com/auth/blogger.`);
      }
      throw new Error(`Blogger post publish failed: ${errMsg}`);
    }
  }

  /**
   * Mail2Blogger: Publish Article via Official Google Blogger Secret Email
   */
  async publishViaEmail({ account, secretEmail, title, caption, hashtags = '', mediaPath = null, destinationName = 'Lexa Trip', destination = null, smtpConfig = null }) {
    if (!secretEmail) {
      throw new Error('Mail2Blogger requires secretEmail.');
    }

    const host = smtpConfig?.host || process.env.SMTP_HOST;
    const port = smtpConfig?.port || process.env.SMTP_PORT || 587;
    const user = smtpConfig?.user || process.env.SMTP_USER;
    const pass = smtpConfig?.pass || process.env.SMTP_PASS;

    let transporter;
    if (host && user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass }
      });
    } else {
      throw new Error('Mail2Blogger requires configured SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS). Direct Google Blogger API v3 is the recommended zero-maintenance publishing engine.');
    }

    const attachments = [];
    let imageCid = '';
    if (mediaPath && fs.existsSync(mediaPath)) {
      imageCid = 'blogger_hero_img_' + Date.now();
      attachments.push({
        filename: path.basename(mediaPath),
        path: mediaPath,
        cid: imageCid
      });
    }

    let imageHtml = '';
    if (imageCid) {
      imageHtml = `<div style="text-align: center; margin-bottom: 25px;"><img src="cid:${imageCid}" style="max-width: 100%; border-radius: 12px;" /></div>`;
    }

    const cleanTitle = sanitizePostText(title || `${destinationName} Royal Travel Experience`);
    const cleanCaption = sanitizePostText(caption || '');

    const fullArticle = seoGenerator.generateDestinationHumanBlogArticle({
      destination: destination || { name: destinationName, slug: destinationName.toLowerCase().replace(/[^a-z0-9]/g, '') },
      title: cleanTitle,
      caption: cleanCaption,
      mediaUrl: null
    });

    const htmlBody = fullArticle.htmlContent;

    const mailOptions = {
      from: user || 'concierge@lexatrip.com',
      to: secretEmail,
      subject: cleanTitle,
      html: htmlBody,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    const mockPostId = 'mail_post_' + Date.now();
    const destBlogUrl = account?.credentials?.blogUrl || (account?.handle ? (account.handle.startsWith('http') ? account.handle : `https://${account.handle}/`) : null);
    const postUrl = destBlogUrl || `https://${secretEmail.split('@')[0].split('.')[0] || 'lexatrip'}.blogspot.com/`;

    return {
      success: true,
      simulated: false,
      platform: 'blogger',
      method: 'mail2blogger',
      postId: mockPostId,
      url: postUrl,
      postUrl: postUrl,
      secretEmail: secretEmail,
      publishedAt: new Date().toISOString()
    };
  }
}

module.exports = new BloggerPublisher();
