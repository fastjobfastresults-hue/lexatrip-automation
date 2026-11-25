const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'services', 'publishers', 'youtube.js');
let code = fs.readFileSync(filePath, 'utf8');

const target = `    const fileSize = fileStats.size;
    const formattedTitle = (title || 'Lexa Trip Travel Video').substring(0, 100);`;

const replacement = `    // Strict Channel Isolation Guard: Prevent cross-channel contamination
    if (creds.channelId && creds.channelId !== 'UCGoH0bF9aH2MVV0RupzsGqQ') {
      try {
        const chanCheck = await axios.get('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', {
          headers: { Authorization: \`Bearer \${accessToken}\` },
          timeout: 10000
        });
        const currentChannelId = chanCheck.data?.items?.[0]?.id;
        if (currentChannelId && currentChannelId !== creds.channelId) {
          throw new Error(
            \`YouTube channel mismatch: Destination expects channel "\${creds.handle || creds.channelId}", but authorized token belongs to "\${currentChannelId}" (LexaTrip Jaisalmer). Upload blocked to protect LexaTrip Jaisalmer channel.\`
          );
        }
      } catch (cErr) {
        if (cErr.message.includes('YouTube channel mismatch')) throw cErr;
      }
    }

    const fileSize = fileStats.size;
    const formattedTitle = (title || 'Lexa Trip Travel Video').substring(0, 100);`;

if (code.includes('const fileSize = fileStats.size;')) {
  code = code.replace(target, replacement);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully added Channel Isolation Guard to services/publishers/youtube.js!');
} else {
  console.log('Target string not found in youtube.js');
}
