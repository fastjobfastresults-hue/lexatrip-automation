/**
 * Lexa Trip Social Media Automation System
 * Zero-Memory-Bloat Firebase Storage CDN Adapter
 * 
 * Features:
 * - Enterprise-grade Google Cloud CDN media hosting for social publishing (Instagram, Pinterest, Google Business)
 * - Zero heavy SDK imports (NO firebase-admin, NO @google-cloud/storage) to strictly respect the 256MB container memory cap
 * - Native Node.js crypto RS256 JWT service account token minting
 * - HTTP streaming upload via fs.createReadStream (zero heap buffering)
 * - Transparent fallback to local tunnelService when unconfigured or on upload failure
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const tunnelService = require('./tunnelService');

class FirebaseStorageAdapter {
  constructor() {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Returns sanitized bucket name or null
   * @returns {string|null}
   */
  getBucket() {
    const raw = process.env.FIREBASE_STORAGE_BUCKET;
    if (!raw || typeof raw !== 'string') return null;
    const clean = raw.trim().replace(/^gs:\/\//i, '').replace(/\/+$/, '');
    return clean || null;
  }

  /**
   * Checks if Firebase Storage CDN credentials and bucket are configured
   * @returns {boolean}
   */
  isConfigured() {
    const bucket = this.getBucket();
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    return !!(bucket && serviceAccount && serviceAccount.trim().length > 0);
  }

  /**
   * Resolves service account credentials from env string or file path
   * @private
   * @returns {{ client_email: string, private_key: string, project_id?: string }}
   */
  _loadCredentials() {
    const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }

    let parsed = null;
    if (raw.startsWith('{')) {
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${err.message}`);
      }
    } else {
      const resolvedPath = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`FIREBASE_SERVICE_ACCOUNT credentials file not found at: ${resolvedPath}`);
      }
      try {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        parsed = JSON.parse(fileContent);
      } catch (err) {
        throw new Error(`Failed to read/parse FIREBASE_SERVICE_ACCOUNT file at ${resolvedPath}: ${err.message}`);
      }
    }

    if (!parsed || !parsed.client_email || !parsed.private_key) {
      throw new Error('Invalid service account JSON: "client_email" and "private_key" are required');
    }

    return parsed;
  }

  /**
   * Generates or retrieves a valid Google OAuth2 Bearer Access Token via RS256 JWT
   * @returns {Promise<string>}
   */
  async getAccessToken() {
    // If cached token is valid for at least 5 more minutes, reuse it
    const nowMs = Date.now();
    if (this.cachedToken && this.tokenExpiresAt && nowMs < (this.tokenExpiresAt - 300000)) {
      return this.cachedToken;
    }

    const creds = this._loadCredentials();
    const nowSec = Math.floor(nowMs / 1000);

    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const claimSet = {
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/devstorage.read_write',
      aud: 'https://oauth2.googleapis.com/token',
      exp: nowSec + 3600,
      iat: nowSec
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const claimB64 = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
    const signingInput = `${headerB64}.${claimB64}`;

    // Ensure private_key has proper newline formatting
    const normalizedPrivateKey = creds.private_key.replace(/\\n/g, '\n');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    const signatureB64 = signer.sign(normalizedPrivateKey, 'base64url');

    const assertionJwt = `${signingInput}.${signatureB64}`;

    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertionJwt
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      }
    );

    const accessToken = tokenRes.data?.access_token;
    const expiresIn = tokenRes.data?.expires_in || 3600;

    if (!accessToken) {
      throw new Error('OAuth2 token endpoint returned no access_token');
    }

    this.cachedToken = accessToken;
    this.tokenExpiresAt = Date.now() + (expiresIn * 1000);

    return accessToken;
  }

  /**
   * Determines MIME content type from file extension
   * @private
   * @param {string} filePath 
   * @returns {string}
   */
  _detectMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      case '.mp4':
        return 'video/mp4';
      case '.mov':
        return 'video/quicktime';
      case '.webm':
        return 'video/webm';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Streams a media file to Firebase Storage CDN via Google Cloud Storage JSON API
   * Falls back gracefully to tunnelService on upload failure or when unconfigured.
   * 
   * @param {string} filePath - Absolute or relative local path to media file
   * @param {object} [options]
   * @param {string} [options.destinationPath] - Custom destination object path in bucket
   * @param {string} [options.contentType] - Explicit MIME type override
   * @param {number} [options.timeout] - Request timeout in milliseconds (default: 30000)
   * @returns {Promise<{ success: boolean, url: string, provider: 'firebase' | 'tunnel', destinationPath?: string, downloadToken?: string, error?: string }>}
   */
  async uploadFile(filePath, options = {}) {
    if (!filePath || typeof filePath !== 'string') {
      return {
        success: false,
        url: '',
        provider: 'tunnel',
        error: 'Missing or invalid filePath parameter'
      };
    }

    // If Firebase Storage is not configured, fallback instantly to tunnelService
    if (!this.isConfigured()) {
      return {
        success: true,
        url: tunnelService.resolvePublicMediaUrl(filePath),
        provider: 'tunnel'
      };
    }

    // Verify local file exists
    if (!fs.existsSync(filePath)) {
      const fallbackUrl = tunnelService.resolvePublicMediaUrl(filePath);
      return {
        success: false,
        url: fallbackUrl,
        provider: 'tunnel',
        error: `File not found at path: ${filePath}`
      };
    }

    const bucket = this.getBucket();
    const prefix = process.env.FIREBASE_STORAGE_PREFIX || 'uploads';
    const safeBaseName = path.basename(filePath).replace(/[^a-zA-Z0-9._-]/g, '_');
    const destinationPath = options.destinationPath || `${prefix}/${Date.now()}_${safeBaseName}`;
    const contentType = options.contentType || this._detectMimeType(filePath);
    const downloadToken = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const timeout = options.timeout || 30000;

    try {
      const accessToken = await this.getAccessToken();
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // REST upload endpoint: multipart/media stream
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(destinationPath)}`;

      const fileStream = fs.createReadStream(filePath);

      await axios.post(uploadUrl, fileStream, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': contentType,
          'Content-Length': fileSize,
          'x-goog-meta-firebasestoragedownloadtokens': downloadToken
        },
        timeout,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      // Firebase Storage CDN download URL
      const cdnUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(destinationPath)}?alt=media&token=${downloadToken}`;

      return {
        success: true,
        url: cdnUrl,
        provider: 'firebase',
        destinationPath,
        downloadToken
      };
    } catch (err) {
      console.warn(`[FirebaseStorage] Upload failed: ${err.message}. Falling back to local tunnelService URL.`);
      const fallbackUrl = tunnelService.resolvePublicMediaUrl(filePath);
      return {
        success: true,
        url: fallbackUrl,
        provider: 'tunnel',
        error: err.message
      };
    }
  }

  /**
   * Primary resolver for public media URLs.
   * If Firebase Storage CDN is configured, uploads file and returns CDN URL.
   * Otherwise falls back to tunnelService.
   * 
   * @param {string} filePath
   * @param {object} [options]
   * @returns {Promise<string>}
   */
  async resolvePublicUrl(filePath, options = {}) {
    if (!filePath || typeof filePath !== 'string') return '';

    // If already a remote URL, return as-is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    if (!this.isConfigured()) {
      return tunnelService.resolvePublicMediaUrl(filePath);
    }

    const uploadRes = await this.uploadFile(filePath, options);
    return uploadRes.url || tunnelService.resolvePublicMediaUrl(filePath);
  }

  /**
   * Deletes an uploaded file from Firebase Storage CDN
   * @param {string} destinationPath - Object path in bucket
   * @returns {Promise<boolean>}
   */
  async deleteFile(destinationPath) {
    if (!this.isConfigured() || !destinationPath) return false;

    try {
      const accessToken = await this.getAccessToken();
      const bucket = this.getBucket();
      const deleteUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(destinationPath)}`;

      await axios.delete(deleteUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 10000
      });

      return true;
    } catch (err) {
      console.warn(`[FirebaseStorage] Delete failed for ${destinationPath}: ${err.message}`);
      return false;
    }
  }

  /**
   * Returns telemetry on Firebase Storage configuration and cache status
   * @returns {{ configured: boolean, bucket: string | null, provider: 'firebase' | 'tunnel', tokenCached: boolean }}
   */
  getStatus() {
    const configured = this.isConfigured();
    return {
      configured,
      bucket: this.getBucket(),
      provider: configured ? 'firebase' : 'tunnel',
      tokenCached: !!(this.cachedToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt)
    };
  }
}

const singleton = new FirebaseStorageAdapter();
singleton.FirebaseStorageAdapter = FirebaseStorageAdapter;

module.exports = singleton;
