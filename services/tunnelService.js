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

  resolvePublicMediaUrl(relativePath) {
    if (!relativePath) return '';
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    const base = this.getPublicUrl().replace(/\/$/, '');
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${base}${cleanPath}`;
  }
}

module.exports = new TunnelService();
