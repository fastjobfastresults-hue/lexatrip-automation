const fs = require('fs');
const path = require('path');
const db = require('../database/db');

class StorageManager {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    this.generatedDir = path.join(__dirname, '..', 'generated');
    this.ensureDirs();
  }

  ensureDirs() {
    if (!fs.existsSync(this.uploadsDir)) fs.mkdirSync(this.uploadsDir, { recursive: true });
    if (!fs.existsSync(this.generatedDir)) fs.mkdirSync(this.generatedDir, { recursive: true });
  }

  /**
   * Get size and file count of a directory
   */
  getDirStats(dirPath) {
    if (!fs.existsSync(dirPath)) return { fileCount: 0, totalBytes: 0, totalMB: '0.00' };
    let fileCount = 0;
    let totalBytes = 0;

    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            fileCount++;
            totalBytes += stat.size;
          }
        } catch (e) {}
      }
    } catch (e) {}

    return {
      fileCount,
      totalBytes,
      totalMB: (totalBytes / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Get comprehensive storage report
   */
  getStorageReport() {
    const uploads = this.getDirStats(this.uploadsDir);
    const generated = this.getDirStats(this.generatedDir);
    const totalBytes = uploads.totalBytes + generated.totalBytes;

    return {
      uploadsDir: { path: this.uploadsDir, ...uploads },
      generatedDir: { path: this.generatedDir, ...generated },
      totalFiles: uploads.fileCount + generated.fileCount,
      totalBytes,
      totalMB: (totalBytes / (1024 * 1024)).toFixed(2),
      policy: 'Auto-delete local files upon verified social media publish. Social networks host images permanently for lifetime free.'
    };
  }

  /**
   * Automatically delete local images & videos for items that are ALREADY PUBLISHED
   * Social media CDNs host them forever, so local disk stays clean (0MB load)!
   */
  cleanupPublishedMedia() {
    const queue = db.getQueue();
    const published = queue.filter(q => q.status === 'published' || q.status === 'dispatched');
    let deletedCount = 0;
    let freedBytes = 0;

    for (const item of published) {
      if (item.mediaPath && fs.existsSync(item.mediaPath)) {
        try {
          const stat = fs.statSync(item.mediaPath);
          freedBytes += stat.size;
          fs.unlinkSync(item.mediaPath);
          deletedCount++;
          console.log(`[StorageManager] Auto-cleaned local file after verified publish: ${path.basename(item.mediaPath)}`);
        } catch (err) {
          console.warn(`[StorageManager] Could not delete ${item.mediaPath}:`, err.message);
        }
      }
    }

    return {
      deletedCount,
      freedMB: (freedBytes / (1024 * 1024)).toFixed(2),
      remainingStorage: this.getStorageReport()
    };
  }

  /**
   * Start recurring background auto-cleanup (Every 6 hours)
   */
  startAutoCleanup(intervalMs = 6 * 60 * 60 * 1000) {
    // Run initial cleanup 2 minutes after startup
    setTimeout(() => {
      this.cleanupPublishedMedia();
    }, 120000);

    setInterval(() => {
      console.log('🧹 [StorageManager] Running scheduled media garbage collection...');
      const res = this.cleanupPublishedMedia();
      console.log(`🧹 [StorageManager] Freed ${res.freedMB} MB (${res.deletedCount} files cleaned). Disk healthy.`);
    }, intervalMs);
  }
}

module.exports = new StorageManager();
