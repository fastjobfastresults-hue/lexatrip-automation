const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'buildUpgradedMasterTheme.js');
let code = fs.readFileSync(filePath, 'utf8');

// Inside function generateMasterThemeXml(options = {})
// Add const legalPages = options.legalPages || legalPagesEn; right after const destTag
const targetHook = `  const destTag = options.destTag || 'Jaisalmer Luxury Travel Guide';`;
const newHook = `  const destTag = options.destTag || 'Jaisalmer Luxury Travel Guide';\n  const legalPages = options.legalPages || legalPagesEn;`;

code = code.replace(targetHook, newHook);

// Replace the 4 renderLegalStaticPage lines
code = code.replace(
  'renderLegalStaticPage(container, ${JSON.stringify(legalPagesEn.aboutUs.title)}, ${JSON.stringify(legalPagesEn.aboutUs.content)});',
  'renderLegalStaticPage(container, ${JSON.stringify(legalPages.aboutUs.title)}, ${JSON.stringify(legalPages.aboutUs.content)});'
);

code = code.replace(
  'renderLegalStaticPage(container, ${JSON.stringify(legalPagesEn.contactUs.title)}, ${JSON.stringify(legalPagesEn.contactUs.content)});',
  'renderLegalStaticPage(container, ${JSON.stringify(legalPages.contactUs.title)}, ${JSON.stringify(legalPages.contactUs.content)});'
);

code = code.replace(
  'renderLegalStaticPage(container, ${JSON.stringify(legalPagesEn.privacyPolicy.title)}, ${JSON.stringify(legalPagesEn.privacyPolicy.content)});',
  'renderLegalStaticPage(container, ${JSON.stringify(legalPages.privacyPolicy.title)}, ${JSON.stringify(legalPages.privacyPolicy.content)});'
);

code = code.replace(
  'renderLegalStaticPage(container, ${JSON.stringify(legalPagesEn.termsConditions.title)}, ${JSON.stringify(legalPagesEn.termsConditions.content)});',
  'renderLegalStaticPage(container, ${JSON.stringify(legalPages.termsConditions.title)}, ${JSON.stringify(legalPages.termsConditions.content)});'
);

fs.writeFileSync(filePath, code);
console.log('Successfully hooked dynamic legalPages in buildUpgradedMasterTheme.js!');
