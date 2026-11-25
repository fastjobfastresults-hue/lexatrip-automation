const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packDir = path.join(__dirname, '..', 'public', 'downloads', 'lexatrip_theme_pack');
if (fs.existsSync(packDir)) {
  fs.rmSync(packDir, { recursive: true, force: true });
}
fs.mkdirSync(packDir, { recursive: true });

// 1. Copy All Destination XML Themes
const themesDir = path.join(__dirname, '..', 'public', 'theme', 'destinations');
const xmlFiles = fs.readdirSync(themesDir).filter(f => f.endsWith('.xml'));
const themesOut = path.join(packDir, 'destination_themes_xml');
fs.mkdirSync(themesOut, { recursive: true });
xmlFiles.forEach(f => {
  fs.copyFileSync(path.join(themesDir, f), path.join(themesOut, f));
});
console.log(`Copied ${xmlFiles.length} destination XML themes.`);

// 2. Copy Universal Root Master Theme
fs.copyFileSync(
  path.join(__dirname, '..', 'public', 'theme', 'lexatrip_blogger_theme.xml'),
  path.join(packDir, 'lexatrip_universal_master_theme.xml')
);

// 3. Copy Setup Manual
fs.copyFileSync(
  path.join(__dirname, '..', 'docs', 'LEXATRIP_BLOGGER_MASTER_SETUP_MANUAL.md'),
  path.join(packDir, 'LEXATRIP_BLOGGER_MASTER_SETUP_MANUAL.md')
);

// 4. Copy Official Brand Assets
const assetsOut = path.join(packDir, 'brand_assets');
fs.mkdirSync(assetsOut, { recursive: true });
['lexatrip_official_logo.jpg', 'lexatrip_logo.jpg', 'lexatrip_emblem_clean.png', 'lexatrip_banner.jpg'].forEach(f => {
  const p = path.join(__dirname, '..', 'public', 'images', f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(assetsOut, f));
});

// 5. Create Quick Start Readme
const readmeContent = `====================================================================
LEXATRIP™ BLOGGER MASTER LUXURY THEME PACK (2026 UNIVERSAL EDITION)
====================================================================

इस पैकेज में शामिल हैं:
1. destination_themes_xml/  -> सभी 16 डेस्टिनेशन्स (जैसलमेर, मनाली, गोवा आदि) की तैयार XML फ़ाइलें।
2. lexatrip_universal_master_theme.xml -> किसी भी नए शहर के ब्लॉग के लिए मास्टर थीम कोड।
3. LEXATRIP_BLOGGER_MASTER_SETUP_MANUAL.md -> संपूर्ण लेआउट, मेनू, स्मार्ट लिंक और लीगल पेजेस सेटअप गाइड।
4. brand_assets/ -> आधिकारिक लोगो, एम्बलम और बैनर फ़ाइलें।

त्वरित इंस्टॉलेशन निर्देश:
1. Blogger.com में Theme > Edit HTML में जाएं।
2. अपनी डेस्टिनेशन की XML फ़ाइल का कोड पेस्ट करके Save करें।
3. Theme > Mobile settings में जाकर "Desktop" चुनें और Save करें।
4. विस्तृत गाइड के लिए LEXATRIP_BLOGGER_MASTER_SETUP_MANUAL.md पढ़ें।

© 2026 LexaTrip™ Technologies Private Limited. All rights reserved.
`;
fs.writeFileSync(path.join(packDir, 'README_QUICK_START.txt'), readmeContent, 'utf8');

// 6. Create ZIP Archive via PowerShell Compress-Archive
const zipDest = path.join(__dirname, '..', 'public', 'downloads', 'lexatrip_master_theme_pack.zip');
if (fs.existsSync(zipDest)) fs.unlinkSync(zipDest);

try {
  execSync(`powershell -Command "Compress-Archive -Path '${packDir}\\*' -DestinationPath '${zipDest}' -Force"`);
  console.log('✅ ZIP Archive successfully generated:', zipDest);
  const stat = fs.statSync(zipDest);
  console.log(`📦 ZIP Size: ${(stat.size / 1024).toFixed(1)} KB`);

  // Also copy to brain artifacts directory for easy download
  const brainArtifactPath = 'C:/Users/imran/.gemini/antigravity/brain/880516ee-b068-4c79-a8a9-da055918a37f/lexatrip_master_theme_pack.zip';
  fs.copyFileSync(zipDest, brainArtifactPath);
  console.log('✅ Also copied to brain artifact directory:', brainArtifactPath);
} catch (err) {
  console.error('Failed to create zip archive:', err.message);
}
