const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpegStatic = require('ffmpeg-static');

class VideoEngine {
  constructor() {
    this.ffmpegPath = process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg';
  }

  /**
   * Return a default copyright-free travel audio track
   */
  getDefaultAudioTrack() {
    const audioDir = path.join(__dirname, '..', 'audio');
    if (!fs.existsSync(audioDir)) return null;
    const candidates = [
      'lexatrip_travel_beat.mp3',
      'lexatrip_adventure_beat.mp3',
      'lexatrip_chill_beat.mp3'
    ];
    for (const name of candidates) {
      const fullPath = path.join(audioDir, name);
      if (fs.existsSync(fullPath)) return fullPath;
    }
    try {
      const anyMp3 = fs.readdirSync(audioDir).find(f => f.endsWith('.mp3'));
      return anyMp3 ? path.join(audioDir, anyMp3) : null;
    } catch {
      return null;
    }
  }

  /**
   * Generate 12-Second Combined Ultra HD 9:16 Reel from 5 Images
   * Slide 1-4: 2.0s each
   * Slide 5 (Climax/CTA): 4.0s
   * Total = 12.0 Seconds
   * Input: 5 images
   * Output: 1080x1920 (9:16 vertical) centered with pure black framing or ambient blur
   */
  async generateCombined12sReel({
    imagePaths,
    outputPath,
    durations = [2, 2, 2, 2, 4], // 12 seconds total
    brandText = 'LEXA TRIP JAISALMER',
    tagline = '✦ Desert Safari & Royal Camping ✦',
    style = 'contain_black',
    audioPath = null,
    onProgress = null
  }) {
    return new Promise((resolve, reject) => {
      if (!imagePaths || imagePaths.length < 5) {
        return reject(new Error('At least 5 images required for 12-second combined reel.'));
      }

      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const totalDuration = durations.reduce((a, b) => a + b, 0); // 12s
      const args = ['-threads', '1'];

      // 1. Loop each of the 5 images for their respective duration
      for (let i = 0; i < 5; i++) {
        args.push('-loop', '1', '-t', durations[i].toString(), '-i', imagePaths[i]);
      }

      // 2. Audio input (custom track or default royalty-free travel beat)
      const effectiveAudio = (audioPath && fs.existsSync(audioPath))
        ? audioPath
        : this.getDefaultAudioTrack();

      if (effectiveAudio && fs.existsSync(effectiveAudio)) {
        args.push('-stream_loop', '-1', '-i', effectiveAudio);
      } else {
        args.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
      }

      // 3. Build Filter Complex
      // For each image:
      // - Background: black or soft ambient blur
      // - Foreground: scale to 1080x1920 max with aspect ratio decrease to NEVER crop logo/text
      // - Overlay centered: (W-w)/2 : (H-h)/2
      let filterStr = '';
      for (let i = 0; i < 5; i++) {
        if (style === 'contain_blur') {
          filterStr +=
            `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5,eq=brightness=-0.25[bg${i}];` +
            `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg${i}];` +
            `[bg${i}][fg${i}]overlay=(W-w)/2:(H-h)/2[v${i}];`;
        } else {
          filterStr +=
            `color=c=black:s=1080x1920:d=${durations[i]}[bg${i}];` +
            `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg${i}];` +
            `[bg${i}][fg${i}]overlay=(W-w)/2:(H-h)/2[v${i}];`;
        }
      }

      // Concatenate the 5 processed segments into 1 seamless video
      filterStr += `[v0][v1][v2][v3][v4]concat=n=5:v=1:a=0[v]`;

      args.push('-filter_complex', filterStr);
      args.push('-map', '[v]');
      args.push('-map', '5:a'); // Audio is index 5

      // Audio fade out filter
      if (effectiveAudio && fs.existsSync(effectiveAudio)) {
        args.push('-af', `volume=0.85,afade=t=out:st=${Math.max(0, totalDuration - 1.5)}:d=1.5`);
      }

      // 4. Video encoding parameters for Ultra HD clarity
      args.push(
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '24',
        '-b:v', '2500k',
        '-maxrate', '3500k',
        '-bufsize', '3500k',
        '-pix_fmt', 'yuv420p',
        '-r', '24',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        '-t', totalDuration.toString(),
        '-movflags', '+faststart',
        '-y',
        outputPath
      );

      console.log(`[VideoEngine] Rendering 12s Combined Reel for ${brandText}...`);
      const proc = spawn(this.ffmpegPath, args);

      let stderrData = '';
      proc.stderr.on('data', chunk => {
        const text = chunk.toString();
        stderrData += text;
        const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (timeMatch && onProgress) {
          const currentSec = parseInt(timeMatch[1], 10) * 3600 + parseInt(timeMatch[2], 10) * 60 + parseFloat(timeMatch[3]);
          const pct = Math.min(100, Math.round((currentSec / totalDuration) * 100));
          onProgress(pct);
        }
      });

      proc.on('close', code => {
        if (code === 0) {
          console.log(`[VideoEngine] 12s Combined Reel Success: ${outputPath}`);
          resolve({
            success: true,
            outputPath,
            duration: totalDuration,
            resolution: '1080x1920',
            fps: 30
          });
        } else {
          console.error(`[VideoEngine] FFmpeg error code ${code}:\n${stderrData}`);
          reject(new Error(`FFmpeg error ${code}: ${stderrData.slice(-300)}`));
        }
      });

      proc.on('error', err => reject(err));
    });
  }

  /**
   * Convert an image (4:5 or any ratio) into an Ultra HD 9:16 Reel
   * Preserves 100% of the image (0% cropping) with pure black canvas or ambient blur
   */
  async generateSingleReel({
    imagePath,
    outputPath,
    duration = 11.5,
    style = 'contain_black',
    audioPath = null,
    brandText = 'LEXA TRIP JAISALMER',
    tagline = '✦ Desert Safari & Royal Camping ✦',
    onProgress = null
  }) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(imagePath)) {
        return reject(new Error(`Image not found: ${imagePath}`));
      }

      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const args = ['-threads', '1'];
      args.push('-loop', '1', '-t', duration.toString(), '-i', imagePath);

      // Audio track: custom track or default royalty-free travel beat
      const effectiveAudio = (audioPath && fs.existsSync(audioPath))
        ? audioPath
        : this.getDefaultAudioTrack();

      if (effectiveAudio && fs.existsSync(effectiveAudio)) {
        args.push('-stream_loop', '-1', '-i', effectiveAudio);
      } else {
        args.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
      }

      // Filter complex: NEVER crop the primary image (scale decrease to fit 1080x1920, overlay centered)
      let filterComplex = '';
      if (style === 'contain_blur') {
        filterComplex = [
          `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5,eq=brightness=-0.25[bg]`,
          `[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg]`,
          `[bg][fg]overlay=(W-w)/2:(H-h)/2[v]`
        ].join(';');
      } else {
        filterComplex = [
          `color=c=black:s=1080x1920:d=${duration}[bg]`,
          `[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg]`,
          `[bg][fg]overlay=(W-w)/2:(H-h)/2[v]`
        ].join(';');
      }

      args.push('-filter_complex', filterComplex);
      args.push('-map', '[v]');
      args.push('-map', '1:a');

      // Audio fade out filter
      if (effectiveAudio && fs.existsSync(effectiveAudio)) {
        args.push('-af', `volume=0.85,afade=t=out:st=${Math.max(0, duration - 1.2)}:d=1.2`);
      }

      args.push(
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '24',
        '-b:v', '2500k',
        '-pix_fmt', 'yuv420p',
        '-r', '24',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        '-t', duration.toString(),
        '-movflags', '+faststart',
        '-y',
        outputPath
      );

      const proc = spawn(this.ffmpegPath, args);
      let stderrData = '';
      proc.stderr.on('data', chunk => {
        stderrData += chunk.toString();
        const timeMatch = stderrData.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (timeMatch && onProgress) {
          const currentSec = parseInt(timeMatch[1], 10) * 3600 + parseInt(timeMatch[2], 10) * 60 + parseFloat(timeMatch[3]);
          onProgress(Math.min(100, Math.round((currentSec / duration) * 100)));
        }
      });

      proc.on('close', code => {
        if (code === 0) {
          resolve({ success: true, outputPath, duration, resolution: '1080x1920', fps: 30 });
        } else {
          reject(new Error(`FFmpeg single reel error ${code}: ${stderrData.slice(-300)}`));
        }
      });
      proc.on('error', err => reject(err));
    });
  }
}

module.exports = new VideoEngine();
