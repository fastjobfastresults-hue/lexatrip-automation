/**
 * Generate Upgraded Luxury Blogger Themes for ALL 102 LexaTrip Destinations
 * Embedded with Base64 LexaTrip Logo, Gold & Black Styling, WhatsApp Concierge,
 * Dynamic Legal Pages (Privacy Policy, Terms, Disclaimer, Contact Us)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const db = require('../database/db');
const { generateMasterThemeXml } = require('./buildUpgradedMasterTheme');

db.init();
const destinations = db.getDestinations();

function getCleanName(dest) {
  const match = dest.name.match(/\((?:Lexa\s*Trip\s*)?([^)]+)\)/i);
  if (match && match[1]) return match[1].replace(/Lexa\s*Trip\s*/i, '').trim();
  return dest.slug.charAt(0).toUpperCase() + dest.slug.slice(1);
}

const outDir = path.join(__dirname, '..', 'public', 'theme', 'destinations');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log(`Generating upgraded luxury themes for all ${destinations.length} destinations...`);

const generatedThemes = [];

for (const dest of destinations) {
  const cleanName = getCleanName(dest);
  const state = dest.state || 'India';
  const slug = dest.slug;

  const themeXml = generateMasterThemeXml({
    badge: cleanName.toUpperCase(),
    title: `LexaTrip ${cleanName} | Luxury Stays, Experiential Tours & Verified Heritage Guide`,
    desc: `Explore verified luxury stays, boutique resorts, and experiential tours in ${cleanName}, ${state} with LexaTrip. Book with 24/7 VIP concierge support.`,
    phone1: '+91 90798 54982',
    phone2: '+91 90790 17880',
    waNum: '919079854982'
  });

  const filePath = path.join(outDir, `lexatrip_theme_${slug}.xml`);
  fs.writeFileSync(filePath, themeXml, 'utf8');
  generatedThemes.push({ slug, cleanName, filePath });
}

console.log(`✅ Generated ${generatedThemes.length} XML theme files in ${outDir}`);

// Build Updated Master Theme Pack ZIP
const packDir = path.join(__dirname, '..', 'public', 'downloads', 'lexatrip_all_102_destinations_pack');
if (fs.existsSync(packDir)) {
  fs.rmSync(packDir, { recursive: true, force: true });
}
fs.mkdirSync(packDir, { recursive: true });

// Copy all destination XMLs
const themesOut = path.join(packDir, 'destination_themes_xml');
fs.mkdirSync(themesOut, { recursive: true });
generatedThemes.forEach(t => {
  fs.copyFileSync(t.filePath, path.join(themesOut, `lexatrip_theme_${t.slug}.xml`));
});

// Copy Master Universal Theme & Manual
fs.copyFileSync(
  path.join(__dirname, '..', 'public', 'theme', 'lexatrip_blogger_theme.xml'),
  path.join(packDir, 'lexatrip_universal_master_theme.xml')
);
fs.copyFileSync(
  path.join(__dirname, '..', 'docs', 'LEXATRIP_BLOGGER_MASTER_SETUP_MANUAL.md'),
  path.join(packDir, 'LEXATRIP_BLOGGER_MASTER_SETUP_MANUAL.md')
);

// Copy Brand Assets
const assetsOut = path.join(packDir, 'brand_assets');
fs.mkdirSync(assetsOut, { recursive: true });
['lexatrip_official_logo.jpg', 'lexatrip_logo.jpg', 'lexatrip_emblem_clean.png', 'lexatrip_banner.jpg'].forEach(f => {
  const p = path.join(__dirname, '..', 'public', 'images', f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(assetsOut, f));
});

// Write Readme
const readmeContent = `====================================================================
LEXATRIP™ ALL 102 DESTINATIONS BLOGGER LUXURY THEME PACK (2026 EDITION)
====================================================================

इस पैकेज में शामिल हैं:
1. destination_themes_xml/  -> भारत की सभी 102 डेस्टिनेशन्स (हरिद्वार, शिमला, कोलकाता, पुरी, मनाली, जैसलमेर, गोवा आदि) की तैयार XML फ़ाइलें।
2. lexatrip_universal_master_theme.xml -> किसी भी नए शहर के ब्लॉग के लिए मास्टर थीम कोड।
3. LEXATRIP_BLOGGER_MASTER_SETUP_MANUAL.md -> संपूर्ण लेआउट, मेनू, स्मार्ट लिंक और लीगल पेजेस सेटअप गाइड।
4. brand_assets/ -> आधिकारिक लोगो, एम्बलम और बैनर फ़ाइलें।

त्वरित इंस्टॉलेशन निर्देश:
1. Blogger.com में Theme > Edit HTML में जाएं।
2. अपनी डेस्टिनेशन की XML फ़ाइल का कोड कॉपी करके पेस्ट करें और Save करें।
3. Theme > Mobile settings में जाकर "Desktop" चुनें और Save करें।

© 2026 LexaTrip™ Technologies Private Limited. All rights reserved.
`;
fs.writeFileSync(path.join(packDir, 'README_QUICK_START.txt'), readmeContent, 'utf8');

// Compress Archive
const zipDest = path.join(__dirname, '..', 'public', 'downloads', 'lexatrip_all_102_destinations_theme_pack.zip');
if (fs.existsSync(zipDest)) fs.unlinkSync(zipDest);

try {
  execSync(`powershell -Command "Compress-Archive -Path '${packDir}\\*' -DestinationPath '${zipDest}' -Force"`);
  console.log('✅ ZIP Archive successfully generated:', zipDest);

  // Copy to Downloads & Desktop for immediate access
  const targetCopies = [
    'C:\\Users\\imran\\Downloads\\lexatrip_all_102_destinations_theme_pack.zip',
    'C:\\Users\\imran\\Desktop\\lexatrip_all_102_destinations_theme_pack.zip'
  ];

  targetCopies.forEach(cp => {
    try {
      fs.copyFileSync(zipDest, cp);
      console.log(`✅ Copied to: ${cp}`);
    } catch (e) {
      console.warn(`Could not copy to ${cp}:`, e.message);
    }
  });

} catch (err) {
  console.error('Failed to create zip archive:', err.message);
}
