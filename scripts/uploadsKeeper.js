const fs = require('fs');
const path = require('path');

const srcLogo = path.resolve(__dirname, '../public/images/lexatrip_logo.jpg');
const srcBanner = path.resolve(__dirname, '../public/images/lexatrip_youtube_banner.jpg');
const srcFaviconPng = path.resolve(__dirname, '../public/images/lexatrip_favicon.png');
const srcFaviconJpg = path.resolve(__dirname, '../public/images/lexatrip_favicon.jpg');

const targetDir = 'C:\\Users\\imran\\.gemini\\antigravity\\brain\\880516ee-b068-4c79-a8a9-da055918a37f\\browser_sandbox\\uploads';
const targetLogo = path.join(targetDir, 'lexatrip_logo.jpg');
const targetBanner = path.join(targetDir, 'lexatrip_youtube_banner.jpg');
const targetFaviconPng = path.join(targetDir, 'lexatrip_favicon.png');
const targetFaviconJpg = path.join(targetDir, 'lexatrip_favicon.jpg');

function sync() {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    if (!fs.existsSync(targetLogo) && fs.existsSync(srcLogo)) {
      fs.copyFileSync(srcLogo, targetLogo);
    }
    if (!fs.existsSync(targetBanner) && fs.existsSync(srcBanner)) {
      fs.copyFileSync(srcBanner, targetBanner);
    }
    if (!fs.existsSync(targetFaviconPng) && fs.existsSync(srcFaviconPng)) {
      fs.copyFileSync(srcFaviconPng, targetFaviconPng);
    }
    if (!fs.existsSync(targetFaviconJpg) && fs.existsSync(srcFaviconJpg)) {
      fs.copyFileSync(srcFaviconJpg, targetFaviconJpg);
    }
  } catch (err) {
    // ignore transient locks
  }
}

sync();
setInterval(sync, 400);
