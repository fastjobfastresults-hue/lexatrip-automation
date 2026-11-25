const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'services', 'publishers', 'facebook.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Fix Phase 1 start
const targetStart = `      const initRes = await axios.post(\`https://graph.facebook.com/v19.0/\${pageId}/video_reels\`, {
        upload_phase: 'start',
        access_token: pageAccessToken
      }, { timeout: 30000 });`;

const replacementStart = `      const initRes = await axios.post(\`https://graph.facebook.com/v19.0/\${pageId}/video_reels\`, null, {
        params: {
          upload_phase: 'start',
          access_token: pageAccessToken
        },
        timeout: 30000
      });`;

// 2. Fix Phase 3 finish
const targetFinish = `        const finishRes = await axios.post(\`https://graph.facebook.com/v19.0/\${pageId}/video_reels\`, {
          upload_phase: 'finish',
          access_token: pageAccessToken,
          video_id: videoId,
          video_state: 'PUBLISHED',
          description: cleanCaption
        }, { timeout: 45000 });`;

const replacementFinish = `        const finishRes = await axios.post(\`https://graph.facebook.com/v19.0/\${pageId}/video_reels\`, null, {
          params: {
            upload_phase: 'finish',
            access_token: pageAccessToken,
            video_id: videoId,
            video_state: 'PUBLISHED',
            description: cleanCaption
          },
          timeout: 45000
        });`;

// 3. Fallback flags
const targetFallback = `      form.append('access_token', pageAccessToken);`;
const replacementFallback = `      form.append('access_token', pageAccessToken);
      form.append('publish_to_reels', 'true');
      form.append('is_reel', 'true');`;

if (code.includes('upload_phase: \'start\'')) {
  code = code.replace(targetStart, replacementStart);
  code = code.replace(targetFinish, replacementFinish);
  code = code.replace(targetFallback, replacementFallback);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully patched services/publishers/facebook.js for Facebook Reels Tab!');
} else {
  console.log('Target string not found in facebook.js');
}
