const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const imageProcessor = require('./imageProcessor');
const videoEngine = require('./videoEngine');
const seoGenerator = require('./seoGenerator');

class FolderWatcher {
  constructor() {
    this.watcher = null;
    this.watchPath = path.join(__dirname, '..', 'watch_folder');
    this.isProcessing = false;
  }

  start() {
    if (!fs.existsSync(this.watchPath)) {
      fs.mkdirSync(this.watchPath, { recursive: true });
    }

    // Write a helpful instructions file in watch_folder
    const readmePath = path.join(this.watchPath, 'INSTRUCTIONS.txt');
    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(
        readmePath,
        `============================================================\n` +
        `LEXA TRIP JAISALMER - AUTOMATIC HOT FOLDER\n` +
        `============================================================\n\n` +
        `Drop 5 images here (e.g. 1.jpg, 2.jpg, 3.jpg, 4.jpg, 5.jpg) or\n` +
        `create a folder like "batch_desert_safari" with your 5 images.\n\n` +
        `The system will automatically:\n` +
        ` 1. Convert them to standardized 4:5 Instagram/Social format\n` +
        ` 2. Generate 5 Ultra HD 11.5s Reels (1080x1920 centered)\n` +
        ` 3. Assemble the 5-slide Carousel\n` +
        ` 4. Generate complete SEO for all 5 posts + combined carousel\n` +
        ` 5. Stage the batch ready for 1-click scheduling or auto-post!\n`
      );
    }

    this.watcher = chokidar.watch(this.watchPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      depth: 2,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 500
      }
    });

    this.watcher.on('add', (filePath) => this.checkFolderForBatches());
    console.log(`📁 Hot-folder watcher active on: ${this.watchPath}`);
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  async checkFolderForBatches() {
    if (this.isProcessing) return;

    try {
      // Find valid images in watch folder root or subdirectories
      const entries = fs.readdirSync(this.watchPath, { withFileTypes: true });

      // Check subdirectories first
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDir = path.join(this.watchPath, entry.name);
          const images = this.getImageFiles(subDir);
          if (images.length >= 5) {
            await this.processBatchFromFolder(subDir, entry.name, images.slice(0, 5));
            return;
          }
        }
      }

      // Check root watch folder
      const rootImages = this.getImageFiles(this.watchPath);
      if (rootImages.length >= 5) {
        await this.processBatchFromFolder(this.watchPath, 'Root_Batch_' + Date.now(), rootImages.slice(0, 5));
      }
    } catch (err) {
      console.error('FolderWatcher error:', err);
    }
  }

  getImageFiles(dir) {
    try {
      const files = fs.readdirSync(dir);
      const exts = ['.jpg', '.jpeg', '.png', '.webp'];
      return files
        .filter(f => exts.includes(path.extname(f).toLowerCase()) && !f.startsWith('.'))
        .sort()
        .map(f => path.join(dir, f));
    } catch (e) {
      return [];
    }
  }

  async processBatchFromFolder(folderPath, folderName, imagePaths) {
    this.isProcessing = true;
    console.log(`🚀 Hot folder detected 5 images in ${folderName}. Auto-processing batch...`);

    try {
      const batchId = 'batch_' + Date.now();
      const outputDir = path.join(__dirname, '..', 'generated', batchId);
      fs.mkdirSync(outputDir, { recursive: true });

      // 1. Process 5 images to 4:5 ratio
      const processedPosts = [];
      for (let i = 0; i < 5; i++) {
        const originalPath = imagePaths[i];
        const outImg = path.join(outputDir, `post_${i + 1}_4x5.jpg`);
        await imageProcessor.processTo4x5(originalPath, outImg);

        const seo = seoGenerator.generatePostSEO(i + 1);
        processedPosts.push({
          index: i + 1,
          originalPath,
          imagePath: outImg,
          seo
        });
      }

      // 2. Generate Carousel Collage preview
      const carouselPreview = path.join(outputDir, 'carousel_preview.jpg');
      await imageProcessor.generateCarouselCollage(
        processedPosts.map(p => p.imagePath),
        carouselPreview
      );
      const combinedCarouselSEO = seoGenerator.generateCombinedCarouselSEO();

      // 3. Generate 5 Ultra HD Reels
      console.log(`🎬 Generating 5 Ultra HD 11-12s Reels for batch ${batchId}...`);
      const generatedReels = [];
      for (let i = 0; i < 5; i++) {
        const outReel = path.join(outputDir, `reel_${i + 1}_1080x1920.mp4`);
        await videoEngine.generateReel({
          imagePath: processedPosts[i].imagePath,
          outputPath: outReel,
          duration: 11.5,
          style: 'contain_blur'
        });
        generatedReels.push({
          index: i + 1,
          reelPath: outReel,
          seo: processedPosts[i].seo
        });
      }

      // 4. Save Batch to Database
      const newBatch = {
        id: batchId,
        title: `Auto-Batch: ${folderName}`,
        destination: 'Jaisalmer',
        source: 'watch_folder',
        status: 'ready',
        posts: processedPosts,
        carousel: {
          previewPath: carouselPreview,
          seo: combinedCarouselSEO
        },
        reels: generatedReels,
        createdAt: new Date().toISOString()
      };

      db.saveBatch(newBatch);
      db.addLog({
        type: 'batch_created',
        batchId,
        message: `Auto-created batch "${newBatch.title}" with 5 posts, 1 carousel, and 5 Ultra HD reels from folder.`
      });

      console.log(`✅ Batch ${batchId} ready for scheduling!`);

      // Archive / clean processed images so we don't loop
      const processedArchive = path.join(folderPath, 'processed_' + batchId);
      fs.mkdirSync(processedArchive, { recursive: true });
      for (const img of imagePaths) {
        const base = path.basename(img);
        fs.renameSync(img, path.join(processedArchive, base));
      }
    } catch (err) {
      console.error('Failed to process batch from folder:', err);
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = new FolderWatcher();
