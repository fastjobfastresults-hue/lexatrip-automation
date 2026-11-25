const fs = require('fs');
const path = require('path');

// 1. Load Base64 Logo Assets
const logoData = JSON.parse(fs.readFileSync(path.join(__dirname, 'logoB64.json'), 'utf8'));
const EMBLEM_B64 = logoData.emblemB64;

// 2. Load Legal Pages (Bilingual Jaisalmer Specific)
let legalData = {};
try {
  legalData = JSON.parse(fs.readFileSync(path.join(__dirname, 'legalPagesData.json'), 'utf8'));
} catch (e) {
  console.warn('Could not read legalPagesData.json, using fallback');
}

const destBadge = 'JAISALMER';
const destTitle = 'LexaTrip Jaisalmer | Luxury Desert Camps, Golden Fort & Heritage Stays';
const destDesc = 'स्वर्ण नगरी जैसलमेर में लक्ज़री टेंट कैंप्स, हेरिटेज फोर्ट होटल्स और डेज़र्ट सफारी का सबसे विश्वसनीय अनुभव। 100% वेरिफाइड प्रॉपर्टीज और 24/7 सहायता।';
const destPhone1 = '+91 90798 54982';
const destPhone2 = '+91 90790 17880';
const destWaNum = '919079854982';

function generateJaisalmerXml() {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgetversion='2' b:layoutsversion='3' b:responsive='true' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <b:include data='blog' name='all-head-content'/>
  <meta content='width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes' name='viewport'/>
  <meta content='True' name='HandheldFriendly'/>
  <meta content='320' name='MobileOptimized'/>
  <meta content='telephone=no' name='format-detection'/>
  <meta content='#0F172A' name='theme-color'/>
  
  <title><data:blog.pageTitle/></title>
  
  <!-- Lifetime Mobile Template Bypass Script: Forces Full Responsive Theme on All Devices (?m=1 -> ?m=0) -->
  <script type='text/javascript'>
  //<![CDATA[
    (function() {
      var u = window.location.href;
      if (u.indexOf('m=1') !== -1) {
        var clean = u.replace(/([?&])m=1(&|$)/, '$1m=0$2').replace(/[?&]$/, '');
        window.location.replace(clean);
      }
    })();
  //]]>
  </script>

  <!-- Favicon & Canonical -->
  <link href='https://bookings.lexatrip.com/favicon.ico' rel='icon' type='image/x-icon'/>
  <link href='https://bookings.lexatrip.com/favicon.ico' rel='shortcut icon' type='image/x-icon'/>
  <link href='https://fonts.googleapis.com' rel='preconnect'/>
  <link crossorigin='' href='https://fonts.gstatic.com' rel='preconnect'/>
  <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;family=Outfit:wght@500;600;700;800;900&amp;family=Noto+Sans+Devanagari:wght@400;500;600;700;800&amp;display=swap' rel='stylesheet'/>

  <!-- SEO & Social OpenGraph Tags -->
  <meta content='LexaTrip Jaisalmer - Official Verified Desert Camps, Luxury Stays &amp; Fort Safaris' name='description'/>
  <meta content='summary_large_image' name='twitter:card'/>
  <meta content='LexaTrip™ Jaisalmer' property='og:site_name'/>
  <meta expr:content='data:blog.pageTitle' property='og:title'/>
  <meta expr:content='data:blog.canonicalUrl' property='og:url'/>

  <b:skin><![CDATA[
  /* ==========================================================================
     LEXATRIP ULTRA-LUXURY ALL-DEVICE MASTER THEME (2026 UNIVERSAL EDITION)
     Solid Navy (#0F172A), Sunset Orange (#FF6B00), Amber (#FFA000)
     100% Fluid Auto-Responsive on Mobile, Tablet, iOS, Android, Desktop & PC
     ========================================================================== */
  :root {
    --primary: #FF6B00;
    --primary-dark: #E65100;
    --primary-light: #FFF5EB;
    --accent: #FFA000;
    --navy: #0F172A;
    --navy-light: #1E293B;
    --navy-dark: #090D16;
    --bg-page: #F8FAFC;
    --card-bg: #FFFFFF;
    --text-main: #1E293B;
    --text-muted: #64748B;
    --border: #E2E8F0;
    --radius-lg: 16px;
    --radius-md: 12px;
    --radius-sm: 8px;
    --shadow-sm: 0 2px 4px rgba(15, 23, 42, 0.05);
    --shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
    --shadow-lg: 0 16px 36px rgba(255, 107, 0, 0.16);
  }

  /* Universal Reset & Zero Horizontal Overflow */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
    margin: 0;
    padding: 0;
    font-family: 'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: var(--bg-page);
    color: var(--text-main);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    padding-bottom: 84px; /* Space for bottom dock */
  }

  /* =======================================================================
     1. LAYOUT SECTION GADGETS (Configurable in Blogger Layout Editor)
     ======================================================================= */
  .layout-widget-zone {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 16px;
  }

  /* =======================================================================
     2. MASTER HEADER (Fully Responsive on Mobile, Tablet & PC)
     ======================================================================= */
  .main-header {
    background: #FFFFFF;
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    width: 100%;
  }
  .header-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  /* Brand Logo with 100% Lifetime Base64 Emblem */
  .brand-logo-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .brand-logo-circle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    background: #FFFFFF;
    border: 2px solid #FF6B00;
    box-shadow: 0 2px 8px rgba(255, 107, 0, 0.25);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .brand-logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .brand-text {
    display: flex;
    flex-direction: column;
  }
  .brand-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 1.1;
  }
  .brand-word-lexa {
    font-family: 'Outfit', sans-serif;
    font-weight: 900;
    font-size: 20px;
    letter-spacing: 0.5px;
    color: #0F1E36;
  }
  .brand-word-trip {
    font-family: 'Outfit', sans-serif;
    font-weight: 900;
    font-size: 20px;
    letter-spacing: 0.5px;
    color: transparent;
    -webkit-text-stroke: 1.5px #FF6B00;
    text-stroke: 1.5px #FF6B00;
    position: relative;
  }
  .brand-dest-badge {
    background: #0F172A;
    color: #FFA000;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 6px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    margin-left: 2px;
  }
  .brand-tagline {
    font-size: 9.5px;
    font-weight: 700;
    color: #64748B;
    letter-spacing: 1.2px;
    margin-top: 2px;
  }

  /* Header Right Actions */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .btn-header {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .btn-header-lang {
    background: #F1F5F9;
    color: #0F172A;
    border: 1px solid #CBD5E1;
  }
  .btn-header-book {
    background: linear-gradient(135deg, #FF6B00, #E65100);
    color: #FFFFFF;
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.25);
  }
  .btn-header-wa {
    background: #25D366;
    color: #FFFFFF;
  }
  .btn-header-app {
    background: #0F172A;
    color: #FFFFFF;
  }

  /* Language Dropdown */
  .lang-dropdown {
    position: relative;
    display: inline-block;
  }
  .lang-menu {
    display: none;
    position: absolute;
    right: 0;
    top: 100%;
    margin-top: 6px;
    background: #FFFFFF;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-md);
    min-width: 130px;
    z-index: 1001;
    overflow: hidden;
  }
  .lang-item {
    display: block;
    padding: 8px 14px;
    font-size: 13px;
    color: var(--text-main);
    text-decoration: none;
    transition: background 0.15s;
  }
  .lang-item:hover {
    background: var(--primary-light);
    color: var(--primary);
  }

  /* =======================================================================
     3. CATEGORY NAVIGATION BAR (Smooth Native Touch Swipe on Mobile)
     ======================================================================= */
  .cat-nav-wrapper {
    background: #FFFFFF;
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 65px;
    z-index: 990;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    width: 100%;
  }
  .cat-nav-flex {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    position: relative;
    padding: 6px 12px;
  }
  .cat-scroll-btn {
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    font-size: 14px;
    flex-shrink: 0;
    color: #0F172A;
    transition: background 0.2s;
  }
  .cat-scroll-btn:hover {
    background: #F1F5F9;
  }
  .cat-nav-bar {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    scroll-behavior: smooth;
    padding: 4px 6px;
    width: 100%;
  }
  .cat-nav-bar::-webkit-scrollbar {
    display: none;
  }
  .cat-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 24px;
    font-size: 13px;
    font-weight: 700;
    color: #475569;
    background: #F1F5F9;
    text-decoration: none;
    white-space: nowrap;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    flex-shrink: 0;
    cursor: pointer;
  }
  .cat-pill:hover, .cat-pill.active {
    background: linear-gradient(135deg, #FF6B00, #E65100);
    color: #FFFFFF;
    border-color: #E65100;
    box-shadow: 0 3px 10px rgba(255, 107, 0, 0.25);
  }

  /* =======================================================================
     4. HERO SECTION (Jaisalmer Exclusive)
     ======================================================================= */
  .hero-section {
    background: linear-gradient(145deg, #090D16 0%, #0F172A 60%, #1A2234 100%);
    color: #FFFFFF;
    padding: 36px 20px;
    text-align: center;
    position: relative;
    overflow: hidden;
    border-bottom: 2px solid #FF6B00;
  }
  .hero-badge {
    display: inline-block;
    background: rgba(255, 107, 0, 0.15);
    border: 1px solid rgba(255, 107, 0, 0.4);
    color: #FFA000;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 14px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
  }
  .hero-title {
    font-family: 'Outfit', 'Noto Sans Devanagari', sans-serif;
    font-size: 28px;
    font-weight: 900;
    margin-bottom: 10px;
    line-height: 1.25;
    color: #FFFFFF;
  }
  .hero-subtitle {
    font-size: 14px;
    color: #94A3B8;
    max-width: 680px;
    margin: 0 auto;
    line-height: 1.5;
  }

  /* Floating Exclusive Offer Pill */
  .hero-offer-banner {
    margin-top: 18px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 107, 0, 0.2);
    border: 1px dashed #FF6B00;
    padding: 8px 18px;
    border-radius: 30px;
    color: #FFD180;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .hero-offer-banner:hover {
    transform: scale(1.03);
    background: rgba(255, 107, 0, 0.3);
  }

  /* =======================================================================
     5. MAIN CONTAINER & 4:5 POST CARDS (Min 7-8 Posts + 3 Action Buttons)
     ======================================================================= */
  .main-wrapper {
    max-width: 1280px;
    margin: 24px auto;
    padding: 0 16px;
  }
  .post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 22px;
  }
  .post-card {
    background: #FFFFFF;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
  }
  .post-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  /* 4:5 Portrait Travel Media Ratio */
  .card-media-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    background: #0F172A;
  }
  .card-media-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }
  .post-card:hover .card-media-img {
    transform: scale(1.04);
  }
  .card-badge-cat {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(4px);
    color: #FFA000;
    font-size: 10.5px;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .card-badge-discount {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #FF6B00;
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 900;
    padding: 4px 9px;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  }

  .card-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    justify-content: space-between;
  }
  .card-title {
    font-family: 'Outfit', 'Noto Sans Devanagari', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: #0F172A;
    line-height: 1.35;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card-snippet {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
    margin-bottom: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* 3 Action Buttons per Card (Book Now, WhatsApp, Read Article) */
  .card-actions-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1.15fr;
    gap: 6px;
    margin-top: auto;
  }
  .card-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 4px;
    font-size: 11.5px;
    font-weight: 700;
    border-radius: 10px;
    text-decoration: none;
    text-align: center;
    transition: transform 0.15s ease, background 0.15s ease;
    white-space: nowrap;
  }
  .card-btn:active {
    transform: scale(0.96);
  }
  .card-btn-book {
    background: linear-gradient(135deg, #FF6B00, #E65100);
    color: #FFFFFF;
    box-shadow: 0 2px 8px rgba(255, 107, 0, 0.25);
  }
  .card-btn-wa {
    background: #25D366;
    color: #FFFFFF;
  }
  .card-btn-read {
    background: #0F172A;
    color: #FFFFFF;
    border: 1px solid #334155;
  }

  /* Load More Button */
  .load-more-box {
    text-align: center;
    margin: 32px 0 16px;
  }
  .btn-load-more {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #0F172A;
    color: #FFA000;
    font-size: 14px;
    font-weight: 800;
    padding: 12px 28px;
    border-radius: 30px;
    border: 1.5px solid #FF6B00;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);
    transition: all 0.2s ease;
  }
  .btn-load-more:hover {
    background: #FF6B00;
    color: #FFFFFF;
    transform: translateY(-2px);
  }

  /* =======================================================================
     6. ARTICLE DETAIL PAGE WITH DIRECT BOOKING ENGINE
     ======================================================================= */
  .article-container {
    max-width: 900px;
    margin: 0 auto;
    background: #FFFFFF;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 32px 28px;
    box-shadow: var(--shadow-sm);
  }
  .article-title {
    font-family: 'Outfit', 'Noto Sans Devanagari', sans-serif;
    font-size: 26px;
    font-weight: 900;
    color: #0F172A;
    margin-bottom: 16px;
    line-height: 1.3;
  }
  .article-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-muted);
    font-size: 13px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .article-hero-media {
    width: 100%;
    max-height: 520px;
    object-fit: cover;
    border-radius: var(--radius-md);
    margin-bottom: 24px;
  }
  .article-content {
    font-size: 15px;
    line-height: 1.8;
    color: #334155;
  }
  .article-content h2, .article-content h3 {
    color: #0F172A;
    margin: 28px 0 14px;
    font-family: 'Outfit', 'Noto Sans Devanagari', sans-serif;
  }
  .article-content p {
    margin-bottom: 16px;
  }
  .article-content ul, .article-content ol {
    margin: 0 0 18px 24px;
  }
  .article-content li {
    margin-bottom: 8px;
  }

  /* Interactive Booking Engine inside Article */
  .article-booking-card {
    background: linear-gradient(145deg, #090D16, #0F172A);
    color: #FFFFFF;
    border: 1.5px solid #FF6B00;
    border-radius: var(--radius-lg);
    padding: 24px;
    margin: 32px 0;
    box-shadow: var(--shadow-lg);
  }
  .engine-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    flex-wrap: wrap;
    gap: 10px;
  }
  .engine-title {
    font-size: 18px;
    font-weight: 800;
    color: #FFA000;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .engine-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }
  .engine-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .engine-field label {
    font-size: 11px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
  }
  .engine-input, .engine-select {
    background: #1E293B;
    border: 1px solid #334155;
    color: #FFFFFF;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
  }
  .engine-input:focus, .engine-select:focus {
    border-color: #FF6B00;
  }
  .engine-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .engine-btn {
    flex: 1;
    min-width: 160px;
    padding: 12px 18px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 13.5px;
    text-decoration: none;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: transform 0.15s ease;
  }
  .engine-btn-book {
    background: linear-gradient(135deg, #FF6B00, #E65100);
    color: #FFFFFF;
    box-shadow: 0 4px 14px rgba(255, 107, 0, 0.35);
  }
  .engine-btn-wa {
    background: #25D366;
    color: #FFFFFF;
  }

  /* =======================================================================
     7. EXCLUSIVE OFFER VIP LEAD POPUP MODAL
     ======================================================================= */
  .modal-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 100000;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
  }
  .modal-card {
    background: #FFFFFF;
    border-radius: 20px;
    max-width: 440px;
    width: 100%;
    padding: 28px 24px;
    position: relative;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
    border: 2px solid #FF6B00;
  }
  .modal-close-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    background: #F1F5F9;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    font-weight: 700;
    color: #64748B;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-title {
    font-family: 'Outfit', sans-serif;
    font-size: 20px;
    font-weight: 900;
    color: #0F172A;
    margin-bottom: 6px;
    text-align: center;
  }
  .modal-subtitle {
    font-size: 13px;
    color: #64748B;
    text-align: center;
    margin-bottom: 20px;
  }
  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .modal-input {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid #CBD5E1;
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
  }
  .modal-input:focus {
    border-color: #FF6B00;
  }
  .modal-submit-btn {
    background: linear-gradient(135deg, #FF6B00, #E65100);
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 800;
    padding: 12px 18px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(255, 107, 0, 0.3);
    margin-top: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  /* =======================================================================
     8. COMPACT LUXURY FOOTER (With Verified Brand Emblem & Portal Badges)
     ======================================================================= */
  .main-footer {
    background: #090D16;
    color: #E2E8F0;
    padding: 36px 20px 24px;
    border-top: 2px solid #FF6B00;
    margin-top: 40px;
  }
  .footer-container {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .footer-brand-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .footer-brand-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .footer-desc {
    color: #94A3B8;
    font-size: 13.5px;
    max-width: 600px;
    line-height: 1.6;
  }
  .footer-portals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }
  .portal-btn {
    background: #111827;
    border: 1px solid #1F2937;
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #FFFFFF;
    text-decoration: none;
    transition: all 0.2s;
  }
  .portal-btn:hover {
    border-color: #FF6B00;
    background: #1F2937;
  }
  .portal-btn-sub {
    font-size: 11px;
    color: #9CA3AF;
  }
  .footer-legal-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding-top: 18px;
    border-top: 1px solid #1E293B;
    font-size: 12px;
    color: #64748B;
  }
  .footer-legal-links {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  .footer-legal-link {
    color: #94A3B8;
    text-decoration: none;
    transition: color 0.2s;
  }
  .footer-legal-link:hover {
    color: #FF6B00;
  }

  /* =======================================================================
     9. ULTRA-COMPACT 4-BUTTON FIXED BOTTOM DOCK (100% Fit on ALL Devices)
     ======================================================================= */
  .mobile-bottom-bar {
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 20px);
    max-width: 520px;
    height: 64px;
    background: rgba(10, 15, 29, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid rgba(255, 107, 0, 0.5);
    border-radius: 20px;
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.55), 0 0 20px rgba(255, 107, 0, 0.25);
    z-index: 99999;
    display: grid;
    grid-template-columns: 1fr 1fr 1.25fr 1fr;
    gap: 4px;
    padding: 4px 6px;
    align-items: center;
    box-sizing: border-box;
  }
  .bar-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    text-decoration: none;
    font-size: 11px;
    font-weight: 700;
    height: 54px;
    border-radius: 12px;
    transition: transform 0.15s ease, background 0.15s ease;
    overflow: hidden;
  }
  .bar-btn:active {
    transform: scale(0.95);
  }
  .bar-icon {
    font-size: 19px;
    line-height: 1;
  }
  .bar-label {
    letter-spacing: 0.2px;
    white-space: nowrap;
  }
  .bar-btn-call {
    color: #FFA000;
  }
  .bar-btn-call:hover {
    background: rgba(255, 160, 0, 0.15);
  }
  .bar-btn-wa {
    color: #25D366;
  }
  .bar-btn-wa:hover {
    background: rgba(37, 211, 102, 0.15);
  }
  .bar-btn-book {
    background: linear-gradient(135deg, #FF6B00, #E65100);
    color: #FFFFFF;
    box-shadow: 0 3px 10px rgba(255, 107, 0, 0.35);
  }
  .bar-btn-book .bar-label {
    color: #FFFFFF;
    font-weight: 800;
  }
  .bar-btn-app {
    color: #60A5FA;
  }
  .bar-btn-app:hover {
    background: rgba(96, 165, 250, 0.15);
  }

  /* =======================================================================
     10. COMPREHENSIVE RESPONSIVE MEDIA QUERIES (Mobile, Tablet, Desktop)
     ======================================================================= */
  @media (max-width: 768px) {
    /* Header optimization for Mobile/Tablet */
    .header-container {
      padding: 8px 12px;
    }
    .brand-logo-circle {
      width: 38px;
      height: 38px;
    }
    .brand-word-lexa, .brand-word-trip {
      font-size: 17px;
    }
    .brand-tagline {
      display: none; /* Hide tagline on mobile to keep header clean */
    }
    .btn-header-wa, .btn-header-app {
      display: none; /* Already prominently visible in bottom bar */
    }
    .btn-header {
      padding: 6px 10px;
      font-size: 12px;
    }

    /* Hero section */
    .hero-section {
      padding: 28px 16px;
    }
    .hero-title {
      font-size: 22px;
    }
    .hero-subtitle {
      font-size: 13px;
    }

    /* Cards */
    .post-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .article-container {
      padding: 20px 14px;
    }
    .article-title {
      font-size: 20px;
    }

    /* Bottom dock on mobile */
    .mobile-bottom-bar {
      bottom: 8px;
      width: calc(100% - 16px);
      height: 60px;
      border-radius: 16px;
      padding: 3px 4px;
      gap: 3px;
    }
    .bar-btn {
      height: 50px;
      font-size: 10px;
    }
    .bar-icon {
      font-size: 17px;
    }
  }

  @media (max-width: 380px) {
    /* Ultra-small phones (e.g. iPhone SE) */
    .brand-dest-badge {
      display: none;
    }
    .btn-header-book span {
      display: none;
    }
    .mobile-bottom-bar {
      bottom: 6px;
      width: calc(100% - 10px);
      height: 56px;
      padding: 2px 3px;
      gap: 2px;
    }
    .bar-btn {
      height: 48px;
      font-size: 9px;
    }
    .bar-icon {
      font-size: 15px;
    }
    .card-actions-row {
      grid-template-columns: 1fr 1fr;
    }
    .card-btn-read {
      grid-column: span 2;
    }
  }
  ]]></b:skin>
</head>
<body>

  <!-- =======================================================================
       LAYOUT SECTION 1: TOP ADS & SMART LINKS (Blogger Layout Editable)
       ======================================================================= -->
  <b:section id='smart-links-top' name='[Smart Links &amp; Ads] Top Header Banner / Direct Link / Adsterra' showaddelement='yes'/>

  <!-- =======================================================================
       LAYOUT SECTION 2: HEADER CUSTOM OVERRIDES (Blogger Layout Editable)
       ======================================================================= -->
  <b:section id='header-branding-custom' name='[Header] Custom Logo, Title &amp; Description' showaddelement='yes'/>

  <!-- =======================================================================
       MAIN LUXURY HEADER (Always Centered, Responsive, Never Overflows)
       ======================================================================= -->
  <header class='main-header'>
    <div class='header-container'>
      
      <!-- Official Logo with Lifetime Base64 Emblem -->
      <a class='brand-logo-link' href='/'>
        <div class='brand-logo-circle'>
          <img alt='LexaTrip Emblem' class='brand-logo-img' src='${EMBLEM_B64}'/>
        </div>
        <div class='brand-text'>
          <div class='brand-name-row'>
            <span class='brand-word-lexa'>LEXA</span>
            <span class='brand-word-trip'>TRIP</span>
            <span class='brand-dest-badge'>${destBadge}</span>
          </div>
          <span class='brand-tagline'>BOOK. EXPLORE. REPEAT.</span>
        </div>
      </a>

      <!-- Header Action Buttons -->
      <div class='header-actions'>
        <!-- Language Switcher -->
        <div class='lang-dropdown'>
          <button class='btn-header btn-header-lang' onclick='toggleLangMenu(event)' type='button'>
            <span>🌐</span> EN ▾
          </button>
          <div class='lang-menu' id='langDropdown'>
            <a class='lang-item' href='#' onclick='selectLang(\"en\", event)'>English (EN)</a>
            <a class='lang-item' href='#' onclick='selectLang(\"hi\", event)'>हिन्दी (Hindi)</a>
          </div>
        </div>

        <a class='btn-header btn-header-book' href='https://bookings.lexatrip.com/' target='_blank'>
          <span>🏨</span> Book Online
        </a>
        <a class='btn-header btn-header-wa' href='https://wa.me/${destWaNum}?text=Hello%20LexaTrip%20Jaisalmer' target='_blank'>
          <span>💬</span> WhatsApp
        </a>
        <a class='btn-header btn-header-app' href='https://www.lexatrip.com/app' target='_blank'>
          <span>📲</span> App
        </a>
      </div>

    </div>
  </header>

  <!-- =======================================================================
       LAYOUT SECTION 3: MENU & CATEGORY LABELS (Blogger Layout Editable)
       ======================================================================= -->
  <b:section id='category-menu-custom' name='[Menu Bar] Custom Menu Links &amp; Category Labels (LinkList / Pages)' showaddelement='yes'/>

  <!-- =======================================================================
       CATEGORY NAVIGATION BAR (Smooth Native Touch Swipe on Mobile/Tablet)
       ======================================================================= -->
  <nav class='cat-nav-wrapper'>
    <div class='cat-nav-flex'>
      <button class='cat-scroll-btn' onclick='scrollCatNav(-200)' type='button'>‹</button>
      <div class='cat-nav-bar' id='categoryNav'>
        <a class='cat-pill active' href='#' onclick='filterCategory(\"all\", event)'>🏠 होम पेज</a>
        <a class='cat-pill' href='#' onclick='filterCategory(\"camp\", event)'>⛺ लक्ज़री कैंप्स</a>
        <a class='cat-pill' href='#' onclick='filterCategory(\"5-star\", event)'>⭐ 5-स्टार होटल्स</a>
        <a class='cat-pill' href='#' onclick='filterCategory(\"4-star\", event)'>🏨 4-स्टार होटल्स</a>
        <a class='cat-pill' href='#' onclick='filterCategory(\"3-star\", event)'>🛏️ 3-स्टार होटल्स</a>
        <a class='cat-pill' href='#' onclick='filterCategory(\"budget\", event)'>💰 बजट फ्रेंडली होटल</a>
      </div>
      <button class='cat-scroll-btn' onclick='scrollCatNav(200)' type='button'>›</button>
    </div>
  </nav>

  <!-- =======================================================================
       HERO BANNER SECTION
       ======================================================================= -->
  <section class='hero-section'>
    <span class='hero-badge'>✦ Verified Experiential Luxury Travel &amp; Camps ✦</span>
    <h1 class='hero-title'>जैसलमेर लक्ज़री स्टे व हेरिटेज गाइड</h1>
    <p class='hero-subtitle'>${destDesc}</p>
    
    <!-- Floating Lead Form Trigger Pill -->
    <div>
      <div class='hero-offer-banner' onclick='openVipOfferModal()'>
        <span>🎁</span>
        <span>एक्सक्लूसिव 50% छूट व सीक्रेट कूपन कोड प्राप्त करें (Click Here)</span>
      </div>
    </div>
  </section>

  <!-- =======================================================================
       LAYOUT SECTION 4: ADS ABOVE POSTS
       ======================================================================= -->
  <b:section id='smart-links-above-cards' name='[Smart Links &amp; Ads] Above Hotel Cards Banner' showaddelement='yes'/>

  <!-- =======================================================================
       MAIN CONTENT CONTAINER
       ======================================================================= -->
  <main class='main-wrapper'>
    <b:section id='main' name='Main Content Area' maxwidgets='1' showaddelement='no'>
      <b:widget id='Blog1' locked='true' title='Blog Posts' type='Blog' version='2'>
        <b:includable id='main' var='this'>
          <!-- Resilient Client-Side Hybrid Container -->
          <div id='lexa-dynamic-root'>
            <!-- Post Card Grid will be rendered dynamically here -->
            <div class='post-grid' id='postGrid'></div>
          </div>
        </b:includable>
      </b:widget>
    </b:section>
  </main>

  <!-- =======================================================================
       LAYOUT SECTION 5: IN-FEED / IN-ARTICLE ADS
       ======================================================================= -->
  <b:section id='smart-links-inside-article' name='[Smart Links &amp; Ads] Inside Article / Feed Banner' showaddelement='yes'/>

  <!-- =======================================================================
       LAYOUT SECTION 6: VIP LEAD POPUP / EXCLUSIVE OFFER FORM
       ======================================================================= -->
  <b:section id='vip-exclusive-lead-popup' name='[Popup &amp; Lead Form] Exclusive VIP Offer / Popup Modal' showaddelement='yes'/>

  <!-- =======================================================================
       EXCLUSIVE VIP OFFER LEAD CAPTURE MODAL (Built-in)
       ======================================================================= -->
  <div class='modal-overlay' id='vipOfferModal'>
    <div class='modal-card'>
      <button class='modal-close-btn' onclick='closeVipOfferModal()'>✕</button>
      <div style='font-size:36px; text-align:center; margin-bottom:8px;'>🎉</div>
      <h3 class='modal-title'>जैसलमेर एक्सक्लूसिव 50% ऑफर</h3>
      <p class='modal-subtitle'>नीचे अपना विवरण भरें—हमारा 24/7 डेस्क तुरंत आपको स्पेशल डिस्काउंट वाउचर व्हाट्सएप करेगा।</p>
      
      <form class='modal-form' onsubmit='handleLeadFormSubmit(event)'>
        <input class='modal-input' id='leadName' placeholder='आपका नाम (Full Name)' required='required' type='text'/>
        <input class='modal-input' id='leadPhone' placeholder='व्हाट्सएप नंबर (WhatsApp No.)' required='required' type='tel'/>
        <input class='modal-input' id='leadDate' placeholder='यात्रा की तारीख (Travel Date / Month)' type='text'/>
        <select class='modal-input' id='leadStayType'>
          <option value='Luxury Swiss Desert Camp'>लक्ज़री स्विस डेज़र्ट कैंप (Sam Dunes)</option>
          <option value='5-Star Heritage Palace'>5-स्टार हेरिटेज पैलेस होटल</option>
          <option value='4-Star Comfort Stay'>4-स्टार कंफर्ट होटल</option>
          <option value='Desert Safari Package'>डेज़र्ट सफारी व टूर पैकेज</option>
          <option value='Budget Stay'>बजट फ्रेंडली स्टे</option>
        </select>
        <button class='modal-submit-btn' type='submit'>
          <span>💬</span> व्हाट्सएप पर इंस्टेंट ऑफर पाएं
        </button>
      </form>
    </div>
  </div>

  <!-- Desktop Call Prompt Modal -->
  <div class='modal-overlay' id='callModal'>
    <div class='modal-card' style='text-align:center;'>
      <button class='modal-close-btn' onclick='document.getElementById(\"callModal\").style.display=\"none\"'>✕</button>
      <div style='font-size:38px; margin-bottom:10px;'>📞</div>
      <h3 class='modal-title'>LexaTrip 24/7 Helpline</h3>
      <p class='modal-subtitle'>तत्काल बुकिंग सहायता व पूछताछ के लिए हमारे हेल्पलाइन नंबर पर कॉल करें:</p>
      <div style='background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px; margin:16px 0;'>
        <p style='font-size:20px; font-weight:800; color:#FF6B00; margin-bottom:4px;'>${destPhone1}</p>
        <p style='font-size:16px; font-weight:700; color:#0F172A;'>${destPhone2}</p>
      </div>
      <a class='modal-submit-btn' href='tel:${destPhone1.replace(/\s+/g, '')}' style='text-decoration:none;'>
        <span>📞</span> अभी कॉल करें (Call Now)
      </a>
    </div>
  </div>

  <!-- =======================================================================
       COMPACT LUXURY FOOTER
       ======================================================================= -->
  <footer class='main-footer'>
    <div class='footer-container'>

      <!-- Top Row: Logo & Brand Description -->
      <div class='footer-brand-section'>
        <div class='footer-brand-row'>
          <div class='brand-logo-circle'>
            <img alt='LexaTrip Emblem' class='brand-logo-img' src='${EMBLEM_B64}'/>
          </div>
          <div class='brand-text'>
            <div class='brand-name-row'>
              <span class='brand-word-lexa' style='color:#FFFFFF;'>LEXA</span>
              <span class='brand-word-trip'>TRIP</span>
              <span class='brand-dest-badge'>${destBadge}</span>
            </div>
            <span class='brand-tagline' style='color:#94A3B8;'>BOOK. EXPLORE. REPEAT.</span>
          </div>
        </div>
        <p class='footer-desc'>
          भारत का प्रमुख एक्सपीरियंसियल ट्रैवल ब्रांड। जैसलमेर के सुनहरे थार रेगिस्तान में लक्ज़री टेंट कैंप्स, हेरिटेज फोर्ट्स, कैमल सफारी और एक्सक्लूसिव टूर पैकेजेस।
        </p>
      </div>

      <!-- Official Portals (Button-style pills) -->
      <div class='footer-portals-grid'>
        <a class='portal-btn' href='https://bookings.lexatrip.com/' target='_blank'>
          <span style='font-size:22px;'>🏨</span>
          <div>
            <strong>Online Reservations</strong><br/>
            <span class='portal-btn-sub'>bookings.lexatrip.com</span>
          </div>
        </a>
        <a class='portal-btn' href='https://www.lexatrip.com/' target='_blank'>
          <span style='font-size:22px;'>🌐</span>
          <div>
            <strong>Main Website</strong><br/>
            <span class='portal-btn-sub'>lexatrip.com</span>
          </div>
        </a>
        <a class='portal-btn' href='https://www.lexatrip.in/' target='_blank'>
          <span style='font-size:22px;'>🇮🇳</span>
          <div>
            <strong>National Portal</strong><br/>
            <span class='portal-btn-sub'>lexatrip.in</span>
          </div>
        </a>
        <a class='portal-btn' href='https://www.lexatrip.com/app' target='_blank'>
          <span style='font-size:22px;'>📲</span>
          <div>
            <strong>Mobile App</strong><br/>
            <span class='portal-btn-sub'>Android &amp; iOS App</span>
          </div>
        </a>
      </div>

      <!-- 24/7 Helpline Strip -->
      <div style='background:#111827; border:1px solid #1F2937; border-radius:12px; padding:16px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px;'>
        <div>
          <span style='color:#FFA000; font-size:12px; font-weight:800; text-transform:uppercase;'>24/7 HELPLINE &amp; GUEST SUPPORT</span><br/>
          <strong style='color:#FFFFFF; font-size:15px;'>${destPhone1} &nbsp;|&nbsp; ${destPhone2}</strong>
        </div>
        <div>
          <a href='https://wa.me/${destWaNum}' target='_blank' style='display:inline-flex; align-items:center; gap:6px; background:#25D366; color:#FFF; font-weight:700; font-size:12px; padding:8px 16px; border-radius:20px; text-decoration:none;'>
            <span>💬</span> Official WhatsApp Desk
          </a>
        </div>
      </div>

      <!-- Footer Bottom Legal & Links -->
      <div class='footer-legal-bar'>
        <div class='footer-legal-links'>
          <a class='footer-legal-link' href='/p/about-us.html'>About Us</a>
          <a class='footer-legal-link' href='/p/contact-us.html'>Contact Us</a>
          <a class='footer-legal-link' href='/p/privacy-policy.html'>Privacy Policy</a>
          <a class='footer-legal-link' href='/p/terms-conditions.html'>Terms &amp; Conditions</a>
        </div>
        <div>
          © 2026 LexaTrip™ Technologies Pvt. Ltd. All rights reserved. Book. Explore. Repeat.
        </div>
      </div>

    </div>
  </footer>

  <!-- =======================================================================
       LAYOUT SECTION 7: FOOTER SMART LINKS & TRACKING
       ======================================================================= -->
  <b:section id='footer-bottom-smart-links' name='[Footer] Bottom Smart Links &amp; Tracking Codes' showaddelement='yes'/>

  <!-- =======================================================================
       100% RESPONSIVE 4-BUTTON FIXED BOTTOM DOCK (Never Overflows, All 4 Fit)
       ======================================================================= -->
  <div class='mobile-bottom-bar' id='bottomBar'>
    <a class='bar-btn bar-btn-call' href='tel:${destPhone1.replace(/\s+/g, '')}' onclick='handleCallClick(event)' title='24/7 Call Support'>
      <span class='bar-icon'>📞</span>
      <span class='bar-label'>कॉल करें</span>
    </a>
    <a class='bar-btn bar-btn-wa' href='https://wa.me/${destWaNum}?text=Hello%20LexaTrip%20Jaisalmer' target='_blank' title='Direct WhatsApp Booking'>
      <span class='bar-icon'>💬</span>
      <span class='bar-label'>WhatsApp</span>
    </a>
    <a class='bar-btn bar-btn-book' href='https://bookings.lexatrip.com/' target='_blank' title='Instant Online Reservation'>
      <span class='bar-icon'>🏨</span>
      <span class='bar-label'>बुक नाउ</span>
    </a>
    <a class='bar-btn bar-btn-app' href='https://www.lexatrip.com/app' target='_blank' title='Download LexaTrip Mobile App'>
      <span class='bar-icon'>📲</span>
      <span class='bar-label'>ऐप डाउनलोड</span>
    </a>
  </div>

  <!-- =======================================================================
       HYBRID CLIENT-SIDE ENGINE (Dynamic Feed, Routing, Pagination & Modals)
       ======================================================================= -->
  <script type='text/javascript'>
  //<![CDATA[
    let allPostsData = [];
    let currentCategoryFilter = 'all';
    let displayedPostsCount = 8; // Shows minimum 7-8 cards by default

    // Touch / Button Category Scroll
    function scrollCatNav(offset) {
      const el = document.getElementById('categoryNav');
      if (el) el.scrollBy({ left: offset, behavior: 'smooth' });
    }

    // Call Action Handler
    function handleCallClick(e) {
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = 'tel:${destPhone1.replace(/\s+/g, '')}';
      } else {
        if (e) e.preventDefault();
        const modal = document.getElementById('callModal');
        if (modal) modal.style.display = 'flex';
      }
    }

    // VIP Offer Modal Open / Close
    function openVipOfferModal() {
      const m = document.getElementById('vipOfferModal');
      if (m) m.style.display = 'flex';
    }
    function closeVipOfferModal() {
      const m = document.getElementById('vipOfferModal');
      if (m) m.style.display = 'none';
    }

    // Lead Form Handler (Auto WhatsApp Concierge Connect)
    function handleLeadFormSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('leadName').value;
      const phone = document.getElementById('leadPhone').value;
      const date = document.getElementById('leadDate').value || 'Immediate';
      const stay = document.getElementById('leadStayType').value;

      const msg = '🎉 *New Exclusive 50% VIP Lead - Jaisalmer*' +
                  '\\n👤 Guest Name: ' + name +
                  '\\n📱 WhatsApp: ' + phone +
                  '\\n📅 Travel Date: ' + date +
                  '\\n🏨 Category: ' + stay;

      closeVipOfferModal();
      window.open('https://wa.me/${destWaNum}?text=' + encodeURIComponent(msg), '_blank');
    }

    // Language Toggle
    function toggleLangMenu(e) {
      if (e) e.stopPropagation();
      const dd = document.getElementById('langDropdown');
      if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    }
    document.addEventListener('click', () => {
      const dd = document.getElementById('langDropdown');
      if (dd) dd.style.display = 'none';
    });
    function selectLang(lang, e) {
      if (e) e.preventDefault();
      if (lang === 'hi') {
        window.location.href = 'https://translate.google.com/translate?sl=en&tl=hi&u=' + encodeURIComponent(window.location.href);
      } else {
        const dd = document.getElementById('langDropdown');
        if (dd) dd.style.display = 'none';
      }
    }

    // Dynamic Discount Generator (Randomized 35% - 60% Off)
    function getPostDiscount(title, id) {
      const match = (title + '').match(/(\\d{2})%\\s*off/i);
      if (match) return match[1] + '% Off';
      const discounts = ['35% Off', '40% Off', '45% Off', '50% Off', '55% Off', '60% Off'];
      let hash = 0;
      const str = (title || '') + (id || '');
      for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
      return discounts[hash % discounts.length];
    }

    // Main Engine Runner
    async function loadLexaBlogContent() {
      const container = document.getElementById('lexa-dynamic-root');
      if (!container) return;

      const currentPath = window.location.pathname;
      const lowPath = currentPath.toLowerCase();

      // 1. Legal Static Page Routing
      if (lowPath.includes('about-us')) {
        renderLegalStaticPage(container, ${JSON.stringify(legalData.aboutUs ? legalData.aboutUs.title : 'About Us')}, ${JSON.stringify(legalData.aboutUs ? legalData.aboutUs.content : '')});
        return;
      }
      if (lowPath.includes('contact-us')) {
        renderLegalStaticPage(container, ${JSON.stringify(legalData.contactUs ? legalData.contactUs.title : 'Contact Us')}, ${JSON.stringify(legalData.contactUs ? legalData.contactUs.content : '')});
        return;
      }
      if (lowPath.includes('privacy-policy')) {
        renderLegalStaticPage(container, ${JSON.stringify(legalData.privacyPolicy ? legalData.privacyPolicy.title : 'Privacy Policy')}, ${JSON.stringify(legalData.privacyPolicy ? legalData.privacyPolicy.content : '')});
        return;
      }
      if (lowPath.includes('terms-conditions') || lowPath.includes('terms')) {
        renderLegalStaticPage(container, ${JSON.stringify(legalData.termsConditions ? legalData.termsConditions.title : 'Terms & Conditions')}, ${JSON.stringify(legalData.termsConditions ? legalData.termsConditions.content : '')});
        return;
      }

      // 2. Fetch Blogger JSON Feed
      try {
        const res = await fetch('/feeds/posts/default?alt=json&max-results=50');
        if (res.ok) {
          const data = await res.json();
          allPostsData = (data.feed && data.feed.entry) ? data.feed.entry : [];
        }
      } catch (e) {
        console.warn('Feed fetch error:', e);
      }

      // 3. Route: Single Post vs Grid
      const isSinglePost = currentPath.endsWith('.html') && !currentPath.includes('/p/');
      if (isSinglePost) {
        renderSingleArticle(container, currentPath);
      } else {
        renderPostGrid(container, currentCategoryFilter);
      }
    }

    // Real-Time Category Filtering
    function filterCategory(cat, event) {
      if (event) event.preventDefault();
      currentCategoryFilter = cat;
      displayedPostsCount = 8; // Reset to 8 posts on category switch

      document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes("'" + cat + "'") || btn.getAttribute('onclick').includes('\"' + cat + '\"'));
      });

      const container = document.getElementById('lexa-dynamic-root');
      if (container) renderPostGrid(container, cat);
    }

    // Load More Posts Handler
    function loadMorePosts() {
      displayedPostsCount += 6;
      const container = document.getElementById('lexa-dynamic-root');
      if (container) renderPostGrid(container, currentCategoryFilter);
    }

    // Render 4:5 Card Grid (At least 7-8 Posts + 3 Action Buttons per Card)
    function renderPostGrid(container, cat) {
      let filtered = allPostsData;
      if (cat !== 'all') {
        filtered = allPostsData.filter(entry => {
          const catList = (entry.category || []).map(c => (c.term || '').toLowerCase());
          const title = ((entry.title && entry.title.$t) || '').toLowerCase();
          const content = ((entry.content && entry.content.$t) || '').toLowerCase();
          const target = cat.toLowerCase();

          if (target === 'camp') return catList.some(c => c.includes('camp') || c.includes('tent') || c.includes('कैंप')) || title.includes('camp') || content.includes('camp');
          if (target === '5-star') return catList.some(c => c.includes('5-star') || c.includes('5 star') || c.includes('luxury') || c.includes('5-स्टार')) || title.includes('5 star') || content.includes('5 star');
          if (target === '4-star') return catList.some(c => c.includes('4-star') || c.includes('4 star') || c.includes('premium') || c.includes('4-स्टार')) || title.includes('4 star') || content.includes('4 star');
          if (target === '3-star') return catList.some(c => c.includes('3-star') || c.includes('3 star') || c.includes('comfort') || c.includes('3-स्टार')) || title.includes('3 star') || content.includes('3 star');
          if (target === 'budget') return catList.some(c => c.includes('budget') || c.includes('affordable') || c.includes('बजट')) || title.includes('budget') || content.includes('budget');
          return true;
        });
      }

      if (filtered.length === 0) {
        container.innerHTML = 
          '<div style=\"text-align:center; padding:60px 20px; background:#FFFFFF; border-radius:16px; border:1px solid #E2E8F0; margin:20px 0;\">' +
            '<div style=\"font-size:48px; margin-bottom:12px;\">🏨</div>' +
            '<h3 style=\"font-size:20px; font-weight:800; color:#0F172A; margin-bottom:8px;\">इस श्रेणी में जल्द ही नए होटल्स और कैंप्स जोड़े जा रहे हैं।</h3>' +
            '<p style=\"color:#64748B; font-size:14px; max-width:500px; margin:0 auto 20px;\">तत्काल बुकिंग व पूछताछ के लिए हमारी 24/7 हेल्पलाइन पर संपर्क करें।</p>' +
            '<a href=\"https://wa.me/${destWaNum}\" target=\"_blank\" style=\"display:inline-block; background:#25D366; color:#FFF; font-weight:700; padding:10px 22px; border-radius:24px; text-decoration:none;\">💬 WhatsApp Concierge</a>' +
          '</div>';
        return;
      }

      // Slice to display min 7-8 posts
      const visiblePosts = filtered.slice(0, displayedPostsCount);

      let html = '<div class=\"post-grid\" id=\"postGrid\">';

      visiblePosts.forEach(entry => {
        const title = (entry.title && entry.title.$t) || 'LexaTrip Jaisalmer Stay';
        const postUrl = (entry.link && entry.link.find(l => l.rel === 'alternate')) ? entry.link.find(l => l.rel === 'alternate').href : '#';
        const rawContent = (entry.content && entry.content.$t) || (entry.summary && entry.summary.$t) || '';
        
        // Extract high quality image
        let imgUrl = 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80';
        const imgMatch = rawContent.match(/<img[^>]+src=[\"']([^\"']+)[\"']/i);
        if (imgMatch && imgMatch[1]) {
          imgUrl = imgMatch[1].replace('/s72-c/', '/w800-h1000-c/').replace('/s1600/', '/w800-h1000-c/');
        }

        const snippet = rawContent.replace(/<[^>]*>/g, '').replace(/\\s+/g, ' ').trim().slice(0, 110) + '...';
        const discountBadge = getPostDiscount(title, entry.id ? entry.id.$t : '');

        let catLabel = 'Desert Stay';
        if (title.toLowerCase().includes('camp') || title.includes('कैंप')) catLabel = 'Luxury Camp';
        else if (title.includes('5 Star') || title.includes('5-Star')) catLabel = '5-Star Luxury';
        else if (title.includes('4 Star') || title.includes('4-Star')) catLabel = '4-Star Premium';
        else if (title.includes('Fort') || title.includes('किला')) catLabel = 'Heritage Fort';

        html += 
          '<article class=\"post-card\">' +
            '<div class=\"card-media-wrapper\">' +
              '<span class=\"card-badge-cat\">' + catLabel + '</span>' +
              '<span class=\"card-badge-discount\">' + discountBadge + '</span>' +
              '<a href=\"' + postUrl + '\">' +
                '<img alt=\"' + title.replace(/\"/g, '&quot;') + '\" class=\"card-media-img\" loading=\"lazy\" src=\"' + imgUrl + '\"/>' +
              '</a>' +
            '</div>' +
            '<div class=\"card-body\">' +
              '<h3 class=\"card-title\"><a href=\"' + postUrl + '\" style=\"color:inherit; text-decoration:none;\">' + title + '</a></h3>' +
              '<p class=\"card-snippet\">' + snippet + '</p>' +
              
              '<!-- 3 Action Buttons per Card (Book Now, WhatsApp, Read Article) -->' +
              '<div class=\"card-actions-row\">' +
                '<a class=\"card-btn card-btn-book\" href=\"https://bookings.lexatrip.com/\" target=\"_blank\">🏨 बुक नाउ</a>' +
                '<a class=\"card-btn card-btn-wa\" href=\"https://wa.me/${destWaNum}?text=' + encodeURIComponent('नमस्ते LexaTrip, मुझे ' + title + ' की बुकिंग/रेट कोटेशन चाहिए।') + '\" target=\"_blank\">💬 WhatsApp</a>' +
                '<a class=\"card-btn card-btn-read\" href=\"' + postUrl + '\">📖 पूरा पढ़ें</a>' +
              '</div>' +
            '</div>' +
          '</article>';
      });
      html += '</div>';

      // Load More Button if remaining posts exist
      if (filtered.length > displayedPostsCount) {
        html += 
          '<div class=\"load-more-box\">' +
            '<button class=\"btn-load-more\" onclick=\"loadMorePosts()\" type=\"button\">' +
              '<span>📥</span> और देखें (Load More Hotels &amp; Camps)' +
            '</button>' +
          '</div>';
      }

      container.innerHTML = html;
    }

    // Render Single Article with Interactive Booking Engine
    function renderSingleArticle(container, currentPath) {
      let matched = null;
      for (const entry of allPostsData) {
        if (entry.link) {
          const altLink = entry.link.find(l => l.rel === 'alternate');
          if (altLink && (altLink.href.includes(currentPath) || currentPath.includes(new URL(altLink.href).pathname))) {
            matched = entry;
            break;
          }
        }
      }

      if (!matched && allPostsData.length > 0) matched = allPostsData[0];

      if (!matched) {
        container.innerHTML = '<div style=\"text-align:center; padding:50px;\">आर्टिकल लोड हो रहा है...</div>';
        return;
      }

      const title = (matched.title && matched.title.$t) || 'LexaTrip Jaisalmer Stay';
      const content = (matched.content && matched.content.$t) || '';
      const published = (matched.published && matched.published.$t) ? new Date(matched.published.$t).toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Verified Stay';
      const discount = getPostDiscount(title, matched.id ? matched.id.$t : '');

      let heroImg = 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200&q=80';
      const imgMatch = content.match(/<img[^>]+src=[\"']([^\"']+)[\"']/i);
      if (imgMatch && imgMatch[1]) heroImg = imgMatch[1];

      let cleanedContent = content.replace(/<img[^>]+>/i, '');

      container.innerHTML = 
        '<div class=\"article-container\">' +
          '<h1 class=\"article-title\">' + title + '</h1>' +
          '<div class=\"article-meta\">' +
            '<span>🗓️ ' + published + '</span>' +
            '<span>📍 Jaisalmer, Rajasthan</span>' +
            '<span>⭐ 100% LexaTrip Verified</span>' +
            '<span style=\"color:#FF6B00; font-weight:800;\">🏷️ ' + discount + '</span>' +
          '</div>' +
          '<img alt=\"' + title.replace(/\"/g, '&quot;') + '\" class=\"article-hero-media\" src=\"' + heroImg + '\"/>' +
          
          '<!-- Interactive Live Booking Engine -->' +
          '<div class=\"article-booking-card\">' +
            '<div class=\"engine-header\">' +
              '<div class=\"engine-title\"><span>⚡</span> इंस्टेंट चेक-इन व बुकिंग इंजन</div>' +
              '<div style=\"background:#FF6B00; color:#FFF; font-size:11px; font-weight:800; padding:4px 10px; border-radius:20px;\">' + discount + ' Special</div>' +
            '</div>' +
            '<div class=\"engine-grid\">' +
              '<div class=\"engine-field\">' +
                '<label>Check-In Date</label>' +
                '<input class=\"engine-input\" id=\"engineCheckIn\" type=\"date\"/>' +
              '</div>' +
              '<div class=\"engine-field\">' +
                '<label>Guests (Pax)</label>' +
                '<select class=\"engine-select\" id=\"enginePax\">' +
                  '<option value=\"2\">2 Adults (Couples)</option>' +
                  '<option value=\"1\">1 Adult (Solo)</option>' +
                  '<option value=\"3\">3 Adults (Triple Sharing)</option>' +
                  '<option value=\"4\">4+ Family / Group</option>' +
                '</select>' +
              '</div>' +
              '<div class=\"engine-field\">' +
                '<label>Room / Camp Category</label>' +
                '<select class=\"engine-select\" id=\"engineCategory\">' +
                  '<option value=\"Royal Swiss Desert Tent\">Royal Swiss Desert Tent</option>' +
                  '<option value=\"Luxury AC Swiss Cottage\">Luxury AC Swiss Cottage</option>' +
                  '<option value=\"Heritage Fort Palace Suite\">Heritage Fort Palace Suite</option>' +
                  '<option value=\"5-Star Pool Villa\">5-Star Luxury Stay</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class=\"engine-actions\">' +
              '<a class=\"engine-btn engine-btn-book\" href=\"https://bookings.lexatrip.com/\" onclick=\"triggerDirectBooking(event, \\'' + title.replace(/'/g, \"\\\\'\") + '\\')\">🏨 Book Online (Instant Voucher)</a>' +
              '<a class=\"engine-btn engine-btn-wa\" href=\"https://wa.me/${destWaNum}\" onclick=\"triggerDirectWa(event, \\'' + title.replace(/'/g, \"\\\\'\") + '\\')\">💬 WhatsApp Concierge Rate</a>' +
            '</div>' +
          '</div>' +

          '<div class=\"article-content\">' + cleanedContent + '</div>' +

          '<div style=\"margin-top:36px; padding:20px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; text-align:center;\">' +
            '<h4 style=\"margin-bottom:8px; color:#0F172A;\">इस प्रॉपर्टी के बारे में कोई सवाल है?</h4>' +
            '<p style=\"color:#64748B; font-size:13px; margin-bottom:14px;\">हमारे 24/7 स्थानीय विशेषज्ञ से सीधे बात करें या बेस्ट डिस्काउंट पर रूम ब्लॉक करवाएं।</p>' +
            '<a href=\"https://wa.me/${destWaNum}?text=' + encodeURIComponent('नमस्ते, मुझे ' + title + ' के बारे में विस्तृत जानकारी चाहिए।') + '\" target=\"_blank\" style=\"display:inline-block; background:#25D366; color:#FFF; font-weight:700; padding:10px 24px; border-radius:24px; text-decoration:none;\">💬 WhatsApp पर संपर्क करें</a>' +
          '</div>' +
        '</div>';

      // Set default check-in date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateInput = document.getElementById('engineCheckIn');
      if (dateInput) dateInput.value = tomorrow.toISOString().split('T')[0];
    }

    // Direct Booking Trigger
    function triggerDirectBooking(e, hotelTitle) {
      if (e) e.preventDefault();
      const checkIn = document.getElementById('engineCheckIn') ? document.getElementById('engineCheckIn').value : '';
      const pax = document.getElementById('enginePax') ? document.getElementById('enginePax').value : '2';
      const cat = document.getElementById('engineCategory') ? document.getElementById('engineCategory').value : '';

      const params = new URLSearchParams({
        hotel: hotelTitle,
        checkIn: checkIn,
        pax: pax,
        category: cat,
        source: 'jaisalmer_blog'
      });
      window.open('https://bookings.lexatrip.com/?' + params.toString(), '_blank');
    }

    // Direct WhatsApp Concierge Trigger
    function triggerDirectWa(e, hotelTitle) {
      if (e) e.preventDefault();
      const checkIn = document.getElementById('engineCheckIn') ? document.getElementById('engineCheckIn').value : 'Tomorrow';
      const pax = document.getElementById('enginePax') ? document.getElementById('enginePax').value : '2';
      const cat = document.getElementById('engineCategory') ? document.getElementById('engineCategory').value : '';

      const msg = 'नमस्ते LexaTrip Concierge, मुझे निम्नलिखित स्टे की तत्काल बुकिंग/रेट कोटेशन चाहिए:\\n\\n' +
                  '🏨 Property: ' + hotelTitle + '\\n' +
                  '📅 Check-In: ' + checkIn + '\\n' +
                  '👥 Guests: ' + pax + ' Person(s)\\n' +
                  '⛺ Preferred Stay: ' + cat;

      window.open('https://wa.me/${destWaNum}?text=' + encodeURIComponent(msg), '_blank');
    }

    // Render Legal / Static Page
    function renderLegalStaticPage(container, title, content) {
      container.innerHTML = 
        '<div class=\"article-container\">' +
          '<h1 class=\"article-title\">' + title + '</h1>' +
          '<div class=\"article-content\" style=\"margin-top:20px;\">' + content + '</div>' +
          '<div style=\"margin-top:40px; text-align:center;\">' +
            '<a href=\"/\" style=\"display:inline-block; background:#0F172A; color:#FFA000; font-weight:700; padding:10px 24px; border-radius:24px; text-decoration:none;\">← होम पेज पर वापस जाएं</a>' +
          '</div>' +
        '</div>';
    }

    // Initialize on DOM Ready
    window.addEventListener('DOMContentLoaded', loadLexaBlogContent);
  //]]>
  </script>

</body>
</html>`;
}

// Compile and write files
const jaisalmerXml = generateJaisalmerXml();
const publicPath = path.join(__dirname, '..', 'public', 'theme', 'destinations', 'lexatrip_theme_jaisalmer.xml');
fs.writeFileSync(publicPath, jaisalmerXml, 'utf8');
console.log('Successfully written to:', publicPath, '(Length:', jaisalmerXml.length, 'bytes)');

// Also stage to browser_sandbox/references for subagent / local inspection
const refPath = 'C:/Users/imran/.gemini/antigravity/brain/880516ee-b068-4c79-a8a9-da055918a37f/browser_sandbox/references/lexatrip_theme_jaisalmer.xml';
fs.writeFileSync(refPath, jaisalmerXml, 'utf8');
console.log('Staged in browser_sandbox/references/lexatrip_theme_jaisalmer.xml');

// Also update root theme
fs.writeFileSync(path.join(__dirname, '..', 'public', 'theme', 'lexatrip_blogger_theme.xml'), jaisalmerXml, 'utf8');
console.log('Updated public/theme/lexatrip_blogger_theme.xml');
