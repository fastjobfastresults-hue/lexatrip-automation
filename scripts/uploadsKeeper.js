const fs = require('fs');
const path = require('path');

const srcLogo = path.resolve(__dirname, '../public/images/lexatrip_logo.jpg');
const srcBanner = path.resolve(__dirname, '../public/images/lexatrip_youtube_banner.jpg');
const targetDir = 'C:\\Users\\imran\\.gemini\\antigravity\\brain\\880516ee-b068-4c79-a8a9-da055918a37f\\browser_sandbox\\uploads';
const targetLogo = path.join(targetDir, 'lexatrip_logo.jpg');
const targetBanner = path.join(targetDir, 'lexatrip_youtube_banner.jpg');

function sync() {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    if (!fs.existsSync(targetLogo)) {
      fs.copyFileSync(srcLogo, targetLogo);
    }
    if (!fs.existsSync(targetBanner)) {
      fs.copyFileSync(srcBanner, targetBanner);
    }
  } catch (err) {
    // ignore transient locks
  }
}

sync();
setInterval(sync, 400);
