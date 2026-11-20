const localtunnel = require('localtunnel');
const db = require('../database/db');

class TunnelService {
  constructor() {
    this.tunnel = null;
    this.publicUrl = null;
    this.isStarting = false;
  }

  async start(port = 3800) {
    // If deployed on cloud (Render, Koyeb, Railway, VPS, etc.)
    const cloudUrl = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL;
    if (cloudUrl) {
      this.publicUrl = cloudUrl.replace(/\/$/, '');
      console.log(`✅ Using Cloud Environment Permanent HTTPS URL: ${this.publicUrl}`);
      db.updateSettings({ publicBaseUrl: this.publicUrl });
      return this.publicUrl;
    }

    if (this.tunnel) return this.publicUrl;
    if (this.isStarting) return null;

    this.isStarting = true;
    try {
      console.log('🌐 Starting free public HTTPS tunnel for Instagram/Meta Graph API...');
      
      const customSubdomain = 'lexatrip-' + Math.random().toString(36).substr(2, 6);
      this.tunnel = await localtunnel({ port, subdomain: customSubdomain });

      this.publicUrl = this.tunnel.url;
      console.log(`✅ Free Public HTTPS Tunnel Active: ${this.publicUrl}`);

      // Save to settings
      db.updateSettings({ publicBaseUrl: this.publicUrl });

      this.tunnel.on('close', () => {
        console.log('🌐 Tunnel closed.');
        this.tunnel = null;
        this.publicUrl = null;
      });

      this.tunnel.on('error', (err) => {
        console.error('🌐 Tunnel error:', err.message);
      });

      return this.publicUrl;
    } catch (err) {
      console.error('🌐 Tunnel start error:', err.message);
      return null;
    } finally {
      this.isStarting = false;
    }
  }

  stop() {
    if (this.tunnel) {
      this.tunnel.close();
      this.tunnel = null;
      this.publicUrl = null;
    }
  }

  getPublicUrl() {
    const settings = db.getSettings();
    return settings.publicBaseUrl || this.publicUrl || `http://localhost:${process.env.PORT || 3800}`;
  }

  resolvePublicMediaUrl(filePath) {
    if (!filePath) return '';
    if (typeof filePath !== 'string') return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    const base = this.getPublicUrl().replace(/\/$/, '');
    // Normalize backslashes to forward slashes
    const normalized = filePath.replace(/\\/g, '/');

    // Match known static mounts served by Express in server.js (/generated, /uploads, /public, /audio)
    const staticMatch = normalized.match(/(?:^|\/)(generated|uploads|public|audio)\/(.+)$/i);
    let urlPath = '';

    if (staticMatch) {
      urlPath = '/' + staticMatch[1].toLowerCase() + '/' + staticMatch[2];
    } else {
      // Strip Windows drive letter (e.g. D:/ or C:/) if present
      const stripped = normalized.replace(/^[a-zA-Z]:\/?/, '');
      urlPath = stripped.startsWith('/') ? stripped : '/' + stripped;
    }

    // URI-encode path segments while preserving slashes
    const encodedPath = urlPath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    return `${base}${encodedPath}`;
  }
}

module.exports = new TunnelService();
