const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'buildUpgradedMasterTheme.js');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Remove announcement-bar CSS
const oldAnnounceCss = `  /* Announcements Bar */
  .announcement-bar {
    background: #090D16;
    color: #E2E8F0;
    font-size: 12px;
    padding: 6px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .announcement-flex {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .announcement-flex a {
    color: #FFA000;
    text-decoration: none;
    font-weight: 600;
  }
  .announcement-flex a:hover {
    text-decoration: underline;
  }`;

const newAnnounceCss = `  /* Top Header Layout Section */
  #top-banner-ads {
    width: 100%;
  }`;

if (code.includes(oldAnnounceCss)) {
  code = code.replace(oldAnnounceCss, newAnnounceCss);
  console.log('1. announcement-bar CSS replaced.');
} else {
  console.log('1. Warning: oldAnnounceCss not found.');
}

// 2. Update Mobile Bottom Bar CSS
const oldBottomCss = `  /* Persistent Mobile Bottom Action Bar (Fixed at bottom) */
  .mobile-bottom-bar {
    display: none;
  }
  @media (max-width: 768px) {
    .mobile-bottom-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: #FFFFFF;
      border-top: 1px solid var(--border);
      box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.12);
      z-index: 9999;
    }
    .bar-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      text-decoration: none;
      font-size: 11px;
      font-weight: 700;
      transition: background 0.15s;
    }
    .bar-btn-call {
      color: var(--navy);
      background: #F8FAFC;
    }
    .bar-btn-wa {
      color: #15803D;
      background: #F0FDF4;
    }
    .bar-btn-book {
      color: #FFFFFF;
      background: var(--primary);
    }
    .bar-btn-app {
      color: #FFFFFF;
      background: var(--navy);
    }
    .bar-icon {
      font-size: 18px;
    }
  }`;

const newBottomCss = `  /* =======================================================================
     LUXURY ULTRA-PREMIUM BOTTOM ACTION BAR (Animated & Eye-Catching)
     ======================================================================= */
  .mobile-bottom-bar {
    display: grid;
    grid-template-columns: 1fr 1fr 1.35fr 1fr;
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 92%;
    max-width: 580px;
    height: 72px;
    background: rgba(10, 15, 29, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid rgba(255, 107, 0, 0.45);
    border-radius: 22px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55), 0 0 25px rgba(255, 107, 0, 0.22);
    z-index: 9999;
    padding: 6px 10px;
    gap: 8px;
    align-items: center;
    box-sizing: border-box;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .bar-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-decoration: none;
    font-size: 11px;
    font-weight: 700;
    height: 56px;
    border-radius: 14px;
    transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
    position: relative;
    overflow: hidden;
  }
  .bar-btn:active {
    transform: scale(0.93);
  }
  
  /* Call Button */
  .bar-btn-call {
    color: #F8FAFC;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .bar-btn-call:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  @keyframes phoneWiggle {
    0%, 75%, 100% { transform: rotate(0deg) scale(1); }
    80% { transform: rotate(-18deg) scale(1.15); }
    85% { transform: rotate(18deg) scale(1.15); }
    90% { transform: rotate(-12deg) scale(1.08); }
    95% { transform: rotate(10deg) scale(1.05); }
  }
  .icon-call-svg {
    animation: phoneWiggle 3.5s ease-in-out infinite;
    transform-origin: center;
  }

  /* WhatsApp Button */
  .bar-btn-wa {
    color: #FFFFFF;
    background: rgba(37, 211, 102, 0.12);
    border: 1px solid rgba(37, 211, 102, 0.35);
  }
  .bar-btn-wa:hover {
    background: rgba(37, 211, 102, 0.22);
  }
  @keyframes waPulseGlow {
    0%, 100% {
      transform: scale(1);
      filter: drop-shadow(0 0 2px rgba(37, 211, 102, 0.4));
    }
    50% {
      transform: scale(1.12);
      filter: drop-shadow(0 0 10px rgba(37, 211, 102, 0.95));
    }
  }
  .icon-wa-svg {
    animation: waPulseGlow 2.6s ease-in-out infinite;
    transform-origin: center;
  }
  .online-indicator {
    position: absolute;
    top: 4px;
    right: 8px;
    width: 6px;
    height: 6px;
    background: #25D366;
    border-radius: 50%;
    box-shadow: 0 0 6px #25D366;
    animation: blinkIndicator 1.4s ease-in-out infinite;
  }
  @keyframes blinkIndicator {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(0.7); }
  }

  /* Book Now Button (Hero CTA) */
  .bar-btn-book {
    color: #FFFFFF !important;
    background: linear-gradient(135deg, #FF6B00 0%, #FF9033 50%, #FF6B00 100%) !important;
    background-size: 200% 100% !important;
    border: 1.5px solid rgba(255, 255, 255, 0.4) !important;
    box-shadow: 0 4px 18px rgba(255, 107, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
    animation: shimmerSlide 3s linear infinite, bookFloat 2.8s ease-in-out infinite !important;
  }
  @keyframes shimmerSlide {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes bookFloat {
    0%, 100% { transform: translateY(0); box-shadow: 0 4px 18px rgba(255, 107, 0, 0.55); }
    50% { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(255, 107, 0, 0.85); }
  }
  .deal-tag {
    font-size: 8px;
    background: rgba(0, 0, 0, 0.35);
    padding: 1px 5px;
    border-radius: 6px;
    font-weight: 800;
    letter-spacing: 0.3px;
    margin-top: -1px;
  }

  /* Get App Button */
  .bar-btn-app {
    color: #E2E8F0;
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.35);
  }
  .bar-btn-app:hover {
    background: rgba(99, 102, 241, 0.22);
  }
  @keyframes appDownloadSlide {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(3px); }
  }
  .app-download-arrow {
    animation: appDownloadSlide 1.8s ease-in-out infinite;
  }

  .bar-btn .bar-label {
    line-height: 1;
    font-size: 11px;
    letter-spacing: 0.2px;
  }

  @media (max-width: 768px) {
    .mobile-bottom-bar {
      width: 100%;
      max-width: 100%;
      left: 0;
      right: 0;
      bottom: 0;
      transform: none;
      border-radius: 0;
      border-left: none;
      border-right: none;
      border-bottom: none;
      padding: 6px 8px calc(6px + env(safe-area-inset-bottom, 0px));
      height: 68px;
      gap: 6px;
    }
  }`;

if (code.includes(oldBottomCss)) {
  code = code.replace(oldBottomCss, newBottomCss);
  console.log('2. mobile-bottom-bar CSS replaced.');
} else {
  console.log('2. Warning: oldBottomCss not found.');
}

// 3. Replace Top Announcement Bar & Hero HTML with Header at very top and new layout sections
const oldTopHtml = `  <!-- =======================================================================
       1. TOP ANNOUNCEMENT BAR
       ======================================================================= -->
  <div class='announcement-bar'>
    <div class='announcement-flex'>
      <span>⭐ <strong>LexaTrip™ Official Verified Destination:</strong> Exclusive Rates &amp; Verified Stays</span>
      <div>
        <span>24/7 Helpline: </span>
        <a href='tel:+919079854982'>+91 90798 54982</a> | 
        <a href='tel:+919079017880'>+91 90790 17880</a>
      </div>
    </div>
  </div>

  <!-- Optional Top Ad Banner Section (Blogger Layout Customizable) -->
  <b:section id='header-ads' name='Header Banner / Ads (Top)' maxwidgets='3' showaddelement='yes'/>`;

const newTopHtml = `  <!-- =======================================================================
       TOP CUSTOMIZABLE GADGETS & ADS (Blogger Layout Editable)
       ======================================================================= -->
  <b:section id='top-banner-ads' name='[Top of Page] Ads &amp; Announcement Gadgets' maxwidgets='5' showaddelement='yes'/>`;

if (code.includes(oldTopHtml)) {
  code = code.replace(oldTopHtml, newTopHtml);
  console.log('3. Top announcement bar HTML replaced with top-banner-ads b:section.');
} else {
  console.log('3. Warning: oldTopHtml not found.');
}

// 4. Remove hero compact and replace with above-posts layout section
const oldHeroHtml = `  <!-- =======================================================================
       4. COMPACT LUXURY HERO BANNER (English)
       ======================================================================= -->
  <b:if cond='data:view.isMultipleItems'>
    <div class='hero-compact'>
      <div class='hero-container'>
        <span class='hero-badge-pill'>✦ Verified Experiential Luxury Travel &amp; Camps ✦</span>
        <h1 class='hero-compact-title'>\${destTitle}</h1>
        <p class='hero-compact-desc'>
          \${destDesc}
        </p>
      </div>
    </div>
  </b:if>

  <!-- Optional Blogger Layout In-Hero Widgets -->
  <b:section id='homepage-hero-widgets' name='Hero Section Extra Widgets' maxwidgets='5' showaddelement='yes'/>`;

const newHeroHtml = `  <!-- =======================================================================
       ABOVE POSTS ADS & PROMO (Blogger Layout Editable)
       ======================================================================= -->
  <b:section id='above-posts-ads' name='[Above Posts] Promo Banner &amp; Sponsored Ads' maxwidgets='5' showaddelement='yes'/>`;

if (code.includes(oldHeroHtml)) {
  code = code.replace(oldHeroHtml, newHeroHtml);
  console.log('4. Hero compact HTML replaced with above-posts-ads b:section.');
} else {
  console.log('4. Warning: oldHeroHtml not found.');
}

// 5. Replace Mobile Bottom Bar HTML with official SVGs and animated micro-interactions
const oldBottomHtml = `  <!-- =======================================================================
       7. PERSISTENT MOBILE BOTTOM ACTION BAR (Fixed at bottom)
       ======================================================================= -->
  <div class='mobile-bottom-bar'>
    <a class='bar-btn bar-btn-call' href='tel:+919079854982' onclick='handleCallClick(event)'>
      <span class='bar-icon'>📞</span>
      <span class='bar-text'>Call</span>
    </a>
    <a class='bar-btn bar-btn-wa' href='https://wa.me/919079854982?text=Hello%20LexaTrip,%20I%20would%20like%20to%20inquire%20about%20\${destBadge}%20packages' target='_blank'>
      <span class='bar-icon'>💬</span>
      <span class='bar-text'>WhatsApp</span>
    </a>
    <a class='bar-btn bar-btn-book' href='https://bookings.lexatrip.com/' target='_blank'>
      <span class='bar-icon'>🏨</span>
      <span class='bar-text'>Book Now</span>
    </a>
    <a class='bar-btn bar-btn-app' href='https://www.lexatrip.com/app' target='_blank'>
      <span class='bar-icon'>📲</span>
      <span class='bar-text'>Get App</span>
    </a>
  </div>`;

const newBottomHtml = `  <!-- =======================================================================
       LUXURY ULTRA-PREMIUM BOTTOM ACTION BAR (Fixed, Eye-Catching & Animated)
       ======================================================================= -->
  <div class='mobile-bottom-bar'>
    <!-- 1. Call Button with Phone Wiggle -->
    <a class='bar-btn bar-btn-call' href='tel:+919079854982' onclick='handleCallClick(event)' title='Call LexaTrip 24/7 Helpline'>
      <svg class='icon-call-svg' viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='#FF6B00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
        <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'></path>
      </svg>
      <span class='bar-label'>Call</span>
    </a>

    <!-- 2. Official WhatsApp Button with Pulse Glow & Online Dot -->
    <a class='bar-btn bar-btn-wa' href='https://wa.me/919079854982?text=Hello%20LexaTrip,%20I%20would%20like%20to%20inquire%20about%20\${destBadge}%20packages' target='_blank' title='Direct WhatsApp Chat'>
      <span class='online-indicator'></span>
      <svg class='icon-wa-svg' viewBox='0 0 24 24' width='24' height='24' fill='none'>
        <circle cx='12' cy='12' r='12' fill='#25D366'/>
        <path d='M17.5 14.3c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1-.2.2-.6.7-.8.9-.1.1-.3.2-.5.1-.2-.1-.9-.3-1.7-1-.6-.5-1-1.2-1.1-1.4-.1-.2 0-.3.1-.4.1-.1.2-.2.3-.4.1-.1.1-.2.2-.3 0-.1 0-.3 0-.4 0-.1-.5-1.2-.7-1.6-.2-.4-.4-.3-.5-.3h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2 1 2.3.1.2 1.6 2.5 3.9 3.5.5.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.5-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.5-.3z' fill='#FFFFFF'/>
        <path d='M12 4a8 8 0 0 0-6.9 12L4 20l4.2-1.1A8 8 0 1 0 12 4zm0 14.5c-1.3 0-2.5-.4-3.6-1l-.3-.2-2.5.7.7-2.4-.2-.3a6.5 6.5 0 1 1 5.9 3.2z' fill='#FFFFFF'/>
      </svg>
      <span class='bar-label'>WhatsApp</span>
    </a>

    <!-- 3. Book Now Elevated Hero CTA with Shimmer Gradient -->
    <a class='bar-btn bar-btn-book' href='https://bookings.lexatrip.com/' target='_blank' title='Instant Online Reservation'>
      <svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='#FFFFFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
        <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
        <polyline points='9 22 9 12 15 12 15 22'></polyline>
      </svg>
      <span class='bar-label'>Book Now</span>
      <span class='deal-tag'>⚡ Instant</span>
    </a>

    <!-- 4. Get App Button with Animated Download -->
    <a class='bar-btn bar-btn-app' href='https://www.lexatrip.com/app' target='_blank' title='Download LexaTrip Mobile App'>
      <svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='#818CF8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
        <rect x='5' y='2' width='14' height='20' rx='2' ry='2'></rect>
        <line x1='12' y1='18' x2='12.01' y2='18'></line>
        <path class='app-download-arrow' d='M12 7v5m-2.5-2.5l2.5 2.5 2.5-2.5' stroke='#38BDF8'></path>
      </svg>
      <span class='bar-label'>Get App</span>
    </a>
  </div>`;

if (code.includes(oldBottomHtml)) {
  code = code.replace(oldBottomHtml, newBottomHtml);
  console.log('5. Bottom bar HTML replaced with official animated SVGs.');
} else {
  console.log('5. Warning: oldBottomHtml not found.');
}

// 6. Update Footer layout sections
code = code.replace(
  "<b:section id='footer-portal-custom' name='Footer Custom Links / Portals' maxwidgets='5' showaddelement='yes'/>",
  "<b:section id='footer-custom-links' name='[Footer Top] Custom Links, Social &amp; Partner Portals' maxwidgets='5' showaddelement='yes'/>"
);

code = code.replace(
  "<b:section id='footer-bottom-ad' name='Footer Bottom Ad Banner' maxwidgets='3' showaddelement='yes'/>",
  "<b:section id='footer-bottom-ads' name='[Footer Bottom] Custom Ads, Disclaimer &amp; Tracking Codes' maxwidgets='5' showaddelement='yes'/>"
);

code = code.replace(
  "<b:section id='in-article-promo' name='In-Feed Promo / Custom HTML Ads' maxwidgets='5' showaddelement='yes'/>",
  "<b:section id='in-feed-promo-ads' name='[Between Posts] In-Feed Promo &amp; Advertisements' maxwidgets='5' showaddelement='yes'/>"
);

fs.writeFileSync(targetFile, code);
console.log('Successfully updated buildUpgradedMasterTheme.js!');
