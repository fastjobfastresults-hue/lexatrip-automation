const fs = require('fs');

const legalPages = JSON.parse(fs.readFileSync('scripts/legalPagesData.json', 'utf8'));

// Read current working XML
let xml = fs.readFileSync('public/theme/lexatrip_blogger_theme.xml', 'utf8');

// The legal page routing code to inject into JS:
const legalRoutingCode = `
        const currentPath = window.location.pathname;
        const lowPath = currentPath.toLowerCase();

        // 1. Check for Legal / Static Pages
        if (lowPath.includes('about-us')) {
          renderLegalStaticPage(container, 'हमारे बारे में (About Us) - LexaTrip', ${JSON.stringify(legalPages.aboutUs.content)});
          return;
        }
        if (lowPath.includes('contact-us')) {
          renderLegalStaticPage(container, 'संपर्क करें (Contact Us) - LexaTrip', ${JSON.stringify(legalPages.contactUs.content)});
          return;
        }
        if (lowPath.includes('privacy-policy')) {
          renderLegalStaticPage(container, 'गोपनीयता नीति (Privacy Policy) - LexaTrip', ${JSON.stringify(legalPages.privacyPolicy.content)});
          return;
        }
        if (lowPath.includes('terms-conditions') || lowPath.includes('terms')) {
          renderLegalStaticPage(container, 'नियम व शर्तें (Terms & Conditions) - LexaTrip', ${JSON.stringify(legalPages.termsConditions.content)});
          return;
        }

        // 2. Single Post vs Homepage Grid
        const isSinglePost = currentPath.endsWith('.html') && !currentPath.includes('/p/');
        if (isSinglePost) {
          renderSingleArticle(container, currentPath);
        } else {
          renderPostGrid(container, currentFilter);
        }
`;

const legalFuncCode = `
    // Render Legal / Static Page
    function renderLegalStaticPage(container, title, content) {
      container.innerHTML = 
        '<article class="article-container">' +
          '<span class="article-category">LexaTrip Official Verified Page</span>' +
          '<h1 class="article-title">' + title + '</h1>' +
          '<div class="article-meta">' +
            '<div class="author-badge">' +
              '<div class="author-avatar">LT</div>' +
              '<span>LexaTrip Legal & Compliance Team</span>' +
            '</div>' +
            '<span>•</span>' +
            '<span>📅 अपडेटेड: 2026</span>' +
            '<span>•</span>' +
            '<span>★ Verified Official Policy</span>' +
          '</div>' +
          '<div class="article-content" style="font-size:15px; line-height:1.8;">' +
            content +
          '</div>' +
          '<div style="margin-top:30px; padding-top:20px; border-top:1px solid #E2E8F0; text-align:center;">' +
            '<a href="/" style="display:inline-block; background:#0F172A; color:#FFFFFF; font-weight:700; padding:10px 24px; border-radius:30px; text-decoration:none;">← वापस मुख्य पृष्ठ (Home) पर जाएं</a>' +
          '</div>' +
        '</article>';
    }
`;

// Replace in XML
const oldBlock = `        const currentPath = window.location.pathname;
        const isSinglePost = currentPath.endsWith('.html') && !currentPath.includes('/p/');

        if (isSinglePost) {
          renderSingleArticle(container, currentPath);
        } else {
          renderPostGrid(container, currentFilter);
        }`;

if (xml.includes(oldBlock)) {
  xml = xml.replace(oldBlock, legalRoutingCode);
  xml = xml.replace("    // Initialize on load", legalFuncCode + "\n    // Initialize on load");
  fs.writeFileSync('public/theme/lexatrip_blogger_theme.xml', xml, 'utf8');
  fs.writeFileSync('C:/Users/imran/.gemini/antigravity/brain/880516ee-b068-4c79-a8a9-da055918a37f/browser_sandbox/references/lexatrip_theme.xml', xml, 'utf8');
  console.log('XML updated cleanly with legal pages support!');
} else {
  console.log('Target block not found, checking if already injected...');
}
