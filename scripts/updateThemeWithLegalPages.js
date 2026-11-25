const fs = require('fs');

const legalPages = JSON.parse(fs.readFileSync('scripts/legalPagesData.json', 'utf8'));

let scriptContent = fs.readFileSync('scripts/buildMasterLuxuryTheme.js', 'utf8');

// Replace inside loadLexaBlogContent to handle legal pages
const oldRouting = `        const currentPath = window.location.pathname;
        const isSinglePost = currentPath.endsWith('.html') && !currentPath.includes('/p/');

        if (isSinglePost) {
          renderSingleArticle(container, currentPath);
        } else {
          renderPostGrid(container, currentFilter);
        }`;

const newRouting = `        const currentPath = window.location.pathname;
        const lowPath = currentPath.toLowerCase();

        // 1. Check for Legal / Static Pages
        if (lowPath.includes('about-us')) {
          renderLegalStaticPage(container, 'हमारे बारे में (About Us) - LexaTrip', \`${legalPages.aboutUs.content}\`);
          return;
        }
        if (lowPath.includes('contact-us')) {
          renderLegalStaticPage(container, 'संपर्क करें (Contact Us) - LexaTrip', \`${legalPages.contactUs.content}\`);
          return;
        }
        if (lowPath.includes('privacy-policy')) {
          renderLegalStaticPage(container, 'गोपनीयता नीति (Privacy Policy) - LexaTrip', \`${legalPages.privacyPolicy.content}\`);
          return;
        }
        if (lowPath.includes('terms-conditions') || lowPath.includes('terms')) {
          renderLegalStaticPage(container, 'नियम व शर्तें (Terms & Conditions) - LexaTrip', \`${legalPages.termsConditions.content}\`);
          return;
        }

        // 2. Single Post vs Homepage Grid
        const isSinglePost = currentPath.endsWith('.html') && !currentPath.includes('/p/');
        if (isSinglePost) {
          renderSingleArticle(container, currentPath);
        } else {
          renderPostGrid(container, currentFilter);
        }`;

scriptContent = scriptContent.replace(oldRouting, newRouting);

// Add renderLegalStaticPage function definition before //]]>
const legalFunc = `
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

scriptContent = scriptContent.replace("    // Initialize on load", legalFunc + "\n    // Initialize on load");

fs.writeFileSync('scripts/buildMasterLuxuryTheme.js', scriptContent, 'utf8');
console.log('buildMasterLuxuryTheme.js updated with legal page routing!');
