const sharp = require('sharp');
sharp.cache(false);
sharp.concurrency(1);
const fs = require('fs');
const path = require('path');

class ImageProcessor {
  /**
   * Process and standardize image to 4:5 ratio (1080x1350)
   * High quality JPEG output with zero distortion
   */
  async processTo4x5(inputPath, outputPath, options = {}) {
    try {
      const targetWidth = options.width || 1080;
      const targetHeight = options.height || 1350; // exact 4:5 ratio

      const metadata = await sharp(inputPath).metadata();
      const currentRatio = metadata.width / metadata.height;
      const targetRatio = 4 / 5;

      let pipeline = sharp(inputPath)
        .rotate(); // auto-orient based on EXIF

      // Resize to exact 1080x1350 (4:5) using contain with black canvas to guarantee 0% cropping of logos/text
      pipeline = pipeline.resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 },
        position: 'center'
      });

      // Output ultra high quality
      await pipeline
        .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
        .toFile(outputPath);

      return {
        path: outputPath,
        width: targetWidth,
        height: targetHeight,
        ratio: '4:5',
        originalDimensions: {
          width: metadata.width,
          height: metadata.height
        }
      };
    } catch (err) {
      console.error('ImageProcessor processTo4x5 error:', err);
      throw err;
    }
  }

  /**
   * Generate a carousel teaser collage preview showing all 5 images
   */
  async generateCarouselCollage(imagePaths, outputPath) {
    try {
      if (!imagePaths || imagePaths.length === 0) return null;

      // Create a 1080x1080 preview grid for the 5 posts
      const thumbWidth = 340;
      const thumbHeight = 425; // 4:5 thumbs

      const processedThumbs = await Promise.all(
        imagePaths.slice(0, 5).map(async (p, idx) => {
          const buf = await sharp(p)
            .resize(thumbWidth, thumbHeight, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toBuffer();
          return { buffer: buf, index: idx };
        })
      );

      // Canvas background
      const canvas = sharp({
        create: {
          width: 1080,
          height: 1080,
          channels: 4,
          background: { r: 18, g: 18, b: 24, alpha: 1 }
        }
      });

      // Place images neatly
      const composites = [];
      const positions = [
        { left: 30, top: 50 },
        { left: 370, top: 50 },
        { left: 710, top: 50 },
        { left: 200, top: 550 },
        { left: 540, top: 550 }
      ];

      for (let i = 0; i < processedThumbs.length && i < 5; i++) {
        composites.push({
          input: processedThumbs[i].buffer,
          top: positions[i].top,
          left: positions[i].left
        });
      }

      await canvas
        .composite(composites)
        .jpeg({ quality: 92 })
        .toFile(outputPath);

      return outputPath;
    } catch (err) {
      console.error('Carousel collage error:', err);
      return null;
    }
  }
}

module.exports = new ImageProcessor();
