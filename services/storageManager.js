const fs = require('fs');
const path = require('path');
const db = require('../database/db');

class StorageManager {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    this.generatedDir = path.join(__dirname, '..', 'generated');
    this.projectRoot = path.join(__dirname, '..');
    this.startupTimer = null;
    this.cleanupTimer = null;
    this.ensureDirs();
  }

  ensureDirs() {
    if (!fs.existsSync(this.uploadsDir)) fs.mkdirSync(this.uploadsDir, { recursive: true });
    if (!fs.existsSync(this.generatedDir)) fs.mkdirSync(this.generatedDir, { recursive: true });
  }

  /**
   * Normalize any media path (absolute, relative, or mount-prefixed) to canonical absolute path
   */
  normalizeLocalPath(filePath) {
    if (!filePath || typeof filePath !== 'string') return null;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return null;
    const clean = filePath.replace(/^[\\\/]+/, '');
    if (path.isAbsolute(filePath)) {
      return path.normalize(filePath);
    }
    return path.normalize(path.resolve(this.projectRoot, clean));
  }

  /**
   * Determine if a queue item was authentically and genuinely published across all target platforms
   */
  isAuthenticallyPublished(item) {
    if (!item || item.status !== 'published') return false;
    if (!Array.isArray(item.publishResults) || item.publishResults.length === 0) return false;

    // If targets are specified, every target must be accounted for in publishResults
    if (Array.isArray(item.targets) && item.targets.length > 0) {
      for (const target of item.targets) {
        const found = item.publishResults.find(r => r.platform === target);
        if (!found) return false;
      }
    }

    let authenticCount = 0;
    for (const r of item.publishResults) {
      // Skipped channels (such as Quora in assisted mode or disabled channels)
      if (r.status === 'skipped') continue;

      if (r.status !== 'published' && r.status !== 'success') return false;
      if (r.error) return false;
      if (r.simulated === true || r.details?.simulated === true || r.details?.isSimulated === true) return false;

      const postId = r.details?.postId || r.details?.id || r.details?.videoId || r.details?.pinId || r.postId;
      if (!postId) return false;
      if (typeof postId === 'string' && (postId.startsWith('sim_') || postId.includes('mock') || postId.includes('simulated'))) {
        return false;
      }
      authenticCount++;
    }

    // Must have at least one authentic published channel
    return authenticCount > 0;
  }

  /**
   * Recursively get file count and total size of a directory
   */
  getDirStats(dirPath) {
    if (!fs.existsSync(dirPath)) return { fileCount: 0, totalBytes: 0, totalMB: '0.00' };
    let fileCount = 0;
    let totalBytes = 0;

    const traverse = (currentDir) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          try {
            if (entry.isFile()) {
              const stat = fs.statSync(fullPath);
              fileCount++;
              totalBytes += stat.size;
            } else if (entry.isDirectory()) {
              traverse(fullPath);
            }
          } catch (e) {}
        }
      } catch (e) {}
    };

    traverse(dirPath);

    return {
      fileCount,
      totalBytes,
      totalMB: (totalBytes / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Get comprehensive storage report with quota monitoring
   */
  getStorageReport(quotaMB = 500) {
    const uploads = this.getDirStats(this.uploadsDir);
    const generated = this.getDirStats(this.generatedDir);
    const totalBytes = uploads.totalBytes + generated.totalBytes;
    const totalMBFloat = totalBytes / (1024 * 1024);
    const totalMB = totalMBFloat.toFixed(2);
    const percentUsed = quotaMB > 0 ? ((totalMBFloat / quotaMB) * 100).toFixed(1) : '0.0';

    let status = 'healthy';
    if (totalMBFloat >= quotaMB) {
      status = 'critical';
    } else if (totalMBFloat >= quotaMB * 0.8) {
      status = 'warning';
    }

    return {
      uploadsDir: { path: this.uploadsDir, ...uploads },
      generatedDir: { path: this.generatedDir, ...generated },
      totalFiles: uploads.fileCount + generated.fileCount,
      totalBytes,
      totalMB,
      quotaMB,
      percentUsed: `${percentUsed}%`,
      status,
      policy: 'Auto-delete local files upon verified social media publish. Social networks host images permanently for lifetime free.'
    };
  }

  /**
   * Automatically delete local images & videos ONLY for items that are GENUINELY PUBLISHED
   */
  cleanupPublishedMedia() {
    const queue = db.getQueue();
    let deletedCount = 0;
    let freedBytes = 0;
    const deletedFiles = new Set();

    // 1. Identify active / pending paths and batches that MUST be preserved
    const activePaths = new Set();
    const activeBatchIds = new Set();

    for (const q of queue) {
      if (!this.isAuthenticallyPublished(q)) {
        if (q.batchId) activeBatchIds.add(q.batchId);
        const norm = this.normalizeLocalPath(q.mediaPath);
        if (norm) activePaths.add(norm.toLowerCase());
      }
    }

    // Protect all batch post images if the batch still has pending queue items
    for (const batchId of activeBatchIds) {
      const batch = db.getBatch(batchId);
      if (batch?.posts && Array.isArray(batch.posts)) {
        for (const p of batch.posts) {
          const pNorm = this.normalizeLocalPath(p.diskPath || p.imagePath);
          if (pNorm) activePaths.add(pNorm.toLowerCase());
        }
      }
    }

    // 2. Process genuinely published items
    const published = queue.filter(q => this.isAuthenticallyPublished(q));

    for (const item of published) {
      const resolvedPath = this.normalizeLocalPath(item.mediaPath);
      if (!resolvedPath) continue;

      const lowerPath = resolvedPath.toLowerCase();

      // Skip if already cleaned up during this pass
      if (deletedFiles.has(lowerPath)) continue;

      // Skip if file is needed by another active item or incomplete batch
      if (activePaths.has(lowerPath)) {
        continue;
      }
      if (item.batchId && activeBatchIds.has(item.batchId)) {
        continue;
      }

      if (fs.existsSync(resolvedPath)) {
        try {
          const stat = fs.statSync(resolvedPath);
          if (stat.isFile()) {
            freedBytes += stat.size;
            fs.unlinkSync(resolvedPath);
            deletedFiles.add(lowerPath);
            deletedCount++;
            console.log(`[StorageManager] Auto-cleaned local file after verified publish: ${path.basename(resolvedPath)}`);

            // Clean empty batch directory in generated/
            const parentDir = path.dirname(resolvedPath);
            const normGenDir = path.normalize(this.generatedDir);
            const normParentDir = path.normalize(parentDir);
            if (normParentDir.startsWith(normGenDir) && normParentDir !== normGenDir) {
              try {
                const remaining = fs.readdirSync(normParentDir);
                if (remaining.length === 0) {
                  fs.rmdirSync(normParentDir);
                  console.log(`[StorageManager] Cleaned empty batch folder: ${path.basename(normParentDir)}`);
                }
              } catch {}
            }
          }
        } catch (err) {
          console.warn(`[StorageManager] Could not delete ${resolvedPath}:`, err.message);
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
    this.stopAutoCleanup();

    // Run initial cleanup 2 minutes after startup
    this.startupTimer = setTimeout(() => {
      this.cleanupPublishedMedia();
    }, 120000);
    if (this.startupTimer && this.startupTimer.unref) this.startupTimer.unref();

    this.cleanupTimer = setInterval(() => {
      console.log('🧹 [StorageManager] Running scheduled media garbage collection...');
      const res = this.cleanupPublishedMedia();
      console.log(`🧹 [StorageManager] Freed ${res.freedMB} MB (${res.deletedCount} files cleaned). Disk healthy.`);
    }, intervalMs);
    if (this.cleanupTimer && this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  /**
   * Cleanly stop recurring cleanup timers
   */
  stopAutoCleanup() {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

module.exports = new StorageManager();
