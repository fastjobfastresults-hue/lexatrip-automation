const fs = require('fs');
const path = require('path');

// Load Base64 Logo Assets
const logoData = JSON.parse(fs.readFileSync(path.join(__dirname, 'logoB64.json'), 'utf8'));
const LOGO_B64 = logoData.logoB64;       // Full 240x240 logo
const EMBLEM_B64 = logoData.emblemB64;   // 160x160 circular emblem

// English Legal Pages Content
const legalPagesEn = {
  aboutUs: {
    title: 'About Us - LexaTrip™',
    content: `
      <h2>Welcome to LexaTrip™</h2>
      <p>LexaTrip™ Technologies Pvt. Ltd. is India's leading experiential luxury travel and hospitality network. We specialize in curating verified luxury desert camps, heritage palace hotels, boutique homestays, and immersive cultural expeditions across India's most iconic destinations.</p>
      
      <h3>Our Core Philosophy: Book. Explore. Repeat.</h3>
      <p>At LexaTrip, we believe true luxury lies in authentic, stress-free experiences. Whether you are gazing at the starlit desert sky from a luxury Swiss tent in the Sam Sand Dunes of Jaisalmer or cruising along Lake Pichola in Udaipur, every LexaTrip property is 100% physically verified for safety, comfort, premium hygiene, and exceptional hospitality.</p>

      <h3>Why Travelers Trust LexaTrip:</h3>
      <ul>
        <li><strong>100% Verified Properties:</strong> Every camp, resort, and heritage hotel is audited and quality-certified by our local hospitality experts.</li>
        <li><strong>Best Rate Guarantee:</strong> Direct booking partnerships ensure exclusive discounts of up to 50-60% off rack rates.</li>
        <li><strong>24/7 Dedicated Concierge:</strong> Instant assistance via phone (+91 90798 54982) and official WhatsApp quote desk.</li>
        <li><strong>Seamless Online Booking:</strong> Real-time inventory and instant vouchers through <a href="https://bookings.lexatrip.com" target="_blank">bookings.lexatrip.com</a>.</li>
      </ul>

      <h3>Corporate Headquarters & Contact</h3>
      <p><strong>LexaTrip Technologies Private Limited</strong><br/>
      Official Portals: <a href="https://bookings.lexatrip.com">bookings.lexatrip.com</a> | <a href="https://www.lexatrip.com">lexatrip.com</a> | <a href="https://www.lexatrip.in">lexatrip.in</a><br/>
      24/7 Helplines: <a href="tel:+919079854982">+91 90798 54982</a>, <a href="tel:+919079017880">+91 90790 17880</a><br/>
      Official Email: <a href="mailto:info@lexatrip.com">info@lexatrip.com</a></p>
    `
  },
  contactUs: {
    title: 'Contact Us - LexaTrip™',
    content: `
      <h2>Get in Touch with LexaTrip™ Concierge</h2>
      <p>Our dedicated 24/7 travel concierge and guest support team is available around the clock to assist you with tour planning, hotel reservations, luxury desert camp bookings, and custom travel itineraries.</p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin:24px 0;">
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
          <h4 style="margin:0 0 8px; color:#FF6B00;">📞 24/7 Priority Helpline 1</h4>
          <p style="margin:0; font-size:16px; font-weight:700;"><a href="tel:+919079854982" style="color:#0F172A; text-decoration:none;">+91 90798 54982</a></p>
          <small style="color:#64748B;">Instant Call & Assistance</small>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
          <h4 style="margin:0 0 8px; color:#FF6B00;">📞 24/7 Priority Helpline 2</h4>
          <p style="margin:0; font-size:16px; font-weight:700;"><a href="tel:+919079017880" style="color:#0F172A; text-decoration:none;">+91 90790 17880</a></p>
          <small style="color:#64748B;">Direct Line & WhatsApp</small>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
          <h4 style="margin:0 0 8px; color:#25D366;">💬 Official WhatsApp Desk</h4>
          <p style="margin:0; font-size:16px; font-weight:700;"><a href="https://wa.me/919079854982?text=Hello%20LexaTrip,%20I%20would%20like%20to%20inquire%20about%20bookings" target="_blank" style="color:#0F172A; text-decoration:none;">Chat on WhatsApp</a></p>
          <small style="color:#64748B;">Instant Quotes & Itineraries</small>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
          <h4 style="margin:0 0 8px; color:#0F172A;">✉️ Email Support</h4>
          <p style="margin:0; font-size:16px; font-weight:700;"><a href="mailto:info@lexatrip.com" style="color:#0F172A; text-decoration:none;">info@lexatrip.com</a></p>
          <small style="color:#64748B;">Official Inquiries & Bookings</small>
        </div>
      </div>

      <h3>Official Web Portals</h3>
      <ul>
        <li><strong>Online Reservations:</strong> <a href="https://bookings.lexatrip.com" target="_blank">bookings.lexatrip.com</a></li>
        <li><strong>Corporate Portal:</strong> <a href="https://www.lexatrip.com" target="_blank">lexatrip.com</a></li>
        <li><strong>National Domain:</strong> <a href="https://www.lexatrip.in" target="_blank">lexatrip.in</a></li>
        <li><strong>Mobile App:</strong> <a href="https://www.lexatrip.com/app" target="_blank">Download LexaTrip Mobile App</a></li>
      </ul>
    `
  },
  privacyPolicy: {
    title: 'Privacy Policy - LexaTrip™',
    content: `
      <h2>Privacy Policy</h2>
      <p><em>Last Updated: 2026 | LexaTrip™ Technologies Pvt. Ltd.</em></p>
      
      <p>At LexaTrip™ (accessible from lexatrip.com, bookings.lexatrip.com, lexatrip.in, and our official destination blogs), the privacy of our visitors and guests is of extreme importance to us. This Privacy Policy outlines the types of personal information collected, how it is used, and the security measures we employ to safeguard your data.</p>

      <h3>1. Information We Collect</h3>
      <p>When you browse our guides, submit an inquiry, or book travel packages through LexaTrip, we may collect the following details:</p>
      <ul>
        <li>Full Name, Contact Number, and Email Address</li>
        <li>Travel Dates (Check-in / Check-out) and Number of Guests (Pax)</li>
        <li>Selected Destination, Room or Camp Category preferences</li>
        <li>Standard technical log data (IP address, browser type, device information) for security and analytical optimization</li>
      </ul>

      <h3>2. How We Use Your Information</h3>
      <ul>
        <li>To confirm hotel reservations, desert camp bookings, and safari vouchers.</li>
        <li>To provide real-time updates and customer support via WhatsApp, phone, or email.</li>
        <li>To communicate exclusive discounts, promo codes, and special seasonal travel offers.</li>
        <li>To prevent fraud, verify transactions, and maintain platform integrity.</li>
      </ul>

      <h3>3. 256-Bit SSL Data Security</h3>
      <p>All sensitive communications, bookings, and customer interactions are encrypted using industry-standard 256-bit SSL encryption. We never sell, rent, or trade your personal data to unauthorized third parties.</p>

      <h3>4. Third-Party Integrations</h3>
      <p>We work with trusted partners including Google, Meta, verified payment gateways, and WhatsApp Business API to deliver seamless travel services. These providers maintain strict data privacy compliance standards.</p>

      <h3>5. Contact Our Data Protection Officer</h3>
      <p>For any questions regarding our Privacy Policy or your personal information, please email us at <a href="mailto:info@lexatrip.com">info@lexatrip.com</a>.</p>
    `
  },
  termsConditions: {
    title: 'Terms & Conditions - LexaTrip™',
    content: `
      <h2>Terms and Conditions</h2>
      <p><em>Last Updated: 2026 | LexaTrip™ Technologies Pvt. Ltd.</em></p>

      <p>Please read these Terms and Conditions carefully before booking any tour packages, desert camps, or hotel stays through LexaTrip™ websites, blogs, or mobile platforms.</p>

      <h3>1. Booking and Confirmation</h3>
      <ul>
        <li>All reservations made through <a href="https://bookings.lexatrip.com">bookings.lexatrip.com</a> or our WhatsApp desk are subject to availability and formal confirmation via booking voucher.</li>
        <li>Promotional coupon codes (such as LEXA50ACTIVE or dynamic seasonal discounts) are valid only during specified promotional periods.</li>
      </ul>

      <h3>2. Check-in, Check-out &amp; Guest Verification</h3>
      <ul>
        <li>Standard check-in is 12:00 PM and check-out is 10:00 AM (or as designated by the specific resort/camp).</li>
        <li>All Indian citizens must present government-approved photo ID (Aadhaar Card, Driving License, or Passport). Foreign nationals must present a valid Passport and Visa. Pan Cards are not accepted for hotel check-ins under local laws.</li>
      </ul>

      <h3>3. Cancellation and Refund Policy</h3>
      <ul>
        <li>Cancellations made 7 or more days prior to check-in date: 90% refund (10% processing fee).</li>
        <li>Cancellations made 3 to 6 days prior to check-in: 50% refund.</li>
        <li>Cancellations made within 48 hours of check-in or no-shows: Non-refundable.</li>
      </ul>

      <h3>4. Desert Safari &amp; Adventure Activities</h3>
      <p>Participation in adventure activities such as jeep dune bashing, camel safaris, and parasailing is undertaken at the guest's discretion. Guests are advised to follow safety instructions issued by certified safari pilots.</p>

      <h3>5. Governing Law and Jurisdiction</h3>
      <p>These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Rajasthan, India.</p>
    `
  }
};

function generateMasterThemeXml(options = {}) {
  const destBadge = options.badge || 'JAISALMER';
  const destTitle = options.title || 'Jaisalmer Luxury Stays, Desert Camps & Fort Heritage Guide';
  const destDesc = options.desc || 'Discover verified luxury Swiss tent camps at Sam Sand Dunes, heritage fort stays, and desert camel safaris in Jaisalmer with LexaTrip.';
  const destCode = options.destCode || 'JAISALMER';
  const destTag = options.destTag || 'Jaisalmer Luxury Travel Guide';
  const legalPages = options.legalPages || legalPagesEn;

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgetversion='2' b:layoutsversion='3' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <b:include data='blog' name='all-head-content'/>
  <meta content='width=device-width, initial-scale=1, maximum-scale=5' name='viewport'/>
  <title><data:blog.pageTitle/></title>
  
  <!-- Favicon & Canonical -->
  <link href='https://bookings.lexatrip.com/favicon.ico' rel='icon' type='image/x-icon'/>
  <link href='https://bookings.lexatrip.com/favicon.ico' rel='shortcut icon' type='image/x-icon'/>
  <link href='https://fonts.googleapis.com' rel='preconnect'/>
  <link crossorigin='' href='https://fonts.gstatic.com' rel='preconnect'/>
  <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;family=Outfit:wght@500;600;700;800;900&amp;display=swap' rel='stylesheet'/>

  <!-- SEO & Social OpenGraph Tags -->
  <meta content='LexaTrip - India Premier Experiential Luxury Travel Network' name='description'/>
  <meta content='summary_large_image' name='twitter:card'/>
  <meta content='LexaTrip™' property='og:site_name'/>
  <meta expr:content='data:blog.pageTitle' property='og:title'/>
  <meta expr:content='data:blog.canonicalUrl' property='og:url'/>

  <b:skin><![CDATA[
  /* ==========================================================================
     LEXATRIP ULTRA-LUXURY EXPERIENTIAL MASTER THEME (2026 EDITION)
     Solid Navy (#0F172A), Sunset Orange (#FF6B00), Amber (#FFA000)
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

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: var(--bg-page);
    color: var(--text-main);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    padding-bottom: 76px; /* space for sticky mobile bottom bar */
  }

  /* Top Header Layout Section */
  #top-banner-ads {
    width: 100%;
  }

  /* Main Luxury Header */
  .main-header {
    background: #FFFFFF;
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  }
  .header-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  /* Brand Logo & Typography */
  .brand-logo-link {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .brand-logo-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #FFFFFF;
    border: 2px solid #FF6B00;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(255, 107, 0, 0.2);
    flex-shrink: 0;
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
    font-family: 'Outfit', 'Inter', sans-serif;
    font-size: 26px;
    font-weight: 900;
    color: var(--navy);
    letter-spacing: 0.5px;
  }
  /* Official Dual-line / Outline Orange TRIP */
  .brand-word-trip {
    font-family: 'Outfit', 'Inter', sans-serif;
    font-size: 26px;
    font-weight: 900;
    color: #FFFFFF;
    -webkit-text-stroke: 1.8px #FF6B00;
    letter-spacing: 2px;
    display: inline-block;
    text-shadow: 0 0 1px #FF6B00, 1px 1px 0px rgba(255, 107, 0, 0.35);
  }
  .brand-dest-badge {
    background: var(--navy);
    color: #FFA000;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1px;
    padding: 3px 8px;
    border-radius: 4px;
    margin-left: 4px;
    text-transform: uppercase;
  }
  .brand-tagline {
    font-size: 9px;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 2px;
    margin-top: 2px;
    text-transform: uppercase;
  }

  /* Header Quick Action Buttons */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .btn-header {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    padding: 8px 14px;
    border-radius: 20px;
    text-decoration: none;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .btn-header-book {
    background: var(--primary);
    color: #FFFFFF;
    box-shadow: 0 2px 8px rgba(255, 107, 0, 0.3);
  }
  .btn-header-book:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
  }
  .btn-header-wa {
    background: #25D366;
    color: #FFFFFF;
  }
  .btn-header-wa:hover {
    background: #1EBE5B;
  }
  .btn-header-app {
    background: var(--navy);
    color: #FFFFFF;
  }
  .btn-header-app:hover {
    background: var(--navy-light);
  }

  /* Language Switcher Button */
  .lang-switcher {
    position: relative;
    cursor: pointer;
    background: #F1F5F9;
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    color: var(--navy);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    user-select: none;
  }
  .lang-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 6px;
    background: #FFFFFF;
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    min-width: 140px;
    z-index: 1001;
    overflow: hidden;
  }
  .lang-dropdown a {
    display: block;
    padding: 8px 14px;
    font-size: 13px;
    color: var(--text-main);
    text-decoration: none;
  }
  .lang-dropdown a:hover, .lang-dropdown a.active {
    background: var(--primary-light);
    color: var(--primary);
    font-weight: 700;
  }

  /* Category Navigation Bar (Horizontally Scrollable) */
  .category-nav-wrapper {
    background: #FFFFFF;
    border-bottom: 1px solid var(--border);
    position: relative;
    display: flex;
    align-items: center;
  }
  .category-nav-container {
    max-width: 1280px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    display: flex;
    align-items: center;
  }
  .cat-nav-scroll-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #FFFFFF;
    border: 1px solid var(--border);
    color: var(--navy);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    z-index: 5;
    flex-shrink: 0;
    margin: 0 4px;
    font-weight: 900;
    user-select: none;
  }
  .cat-nav-scroll-btn:hover {
    background: var(--primary-light);
    color: var(--primary);
  }
  .category-nav-flex {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    padding: 10px 12px;
    white-space: nowrap;
    scrollbar-width: thin;
    scrollbar-color: #CBD5E1 transparent;
    flex-grow: 1;
  }
  .category-nav-flex::-webkit-scrollbar {
    height: 3px;
  }
  .category-nav-flex::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 3px;
  }
  .cat-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #F8FAFC;
    color: var(--text-main);
    border: 1px solid var(--border);
    padding: 8px 16px;
    border-radius: 24px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .cat-pill:hover, .cat-pill.active {
    background: var(--navy);
    color: #FFFFFF;
    border-color: var(--navy);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
  }
  .cat-pill.active {
    background: var(--primary);
    border-color: var(--primary);
  }

  /* Compact Luxury Hero Section */
  .hero-compact {
    background: linear-gradient(135deg, #090D16 0%, #0F172A 60%, #1E293B 100%);
    color: #FFFFFF;
    padding: 24px 20px;
    text-align: center;
    border-bottom: 2px solid var(--primary);
  }
  .hero-container {
    max-width: 900px;
    margin: 0 auto;
  }
  .hero-badge-pill {
    display: inline-block;
    background: rgba(255, 107, 0, 0.15);
    border: 1px solid rgba(255, 107, 0, 0.4);
    color: #FFA000;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    padding: 4px 14px;
    border-radius: 20px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .hero-compact-title {
    font-family: 'Outfit', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: #FFFFFF;
    margin-bottom: 8px;
    line-height: 1.25;
  }
  .hero-compact-desc {
    font-size: 14px;
    color: #CBD5E1;
    line-height: 1.5;
    max-width: 780px;
    margin: 0 auto;
  }

  /* Main Content Layout */
  .content-wrapper {
    max-width: 1280px;
    margin: 24px auto;
    padding: 0 16px;
  }

  /* 4:5 Vertical Aspect Ratio Post Card Grid */
  .post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 22px;
  }
  .post-card {
    background: #FFFFFF;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-sm);
    transition: all 0.25s ease;
    position: relative;
  }
  .post-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: #CBD5E1;
  }

  /* Strict 4:5 Media Container */
  .card-media-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 5;
    background: #0F172A;
    overflow: hidden;
  }
  .card-media-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
    display: block;
  }
  .post-card:hover .card-media-img {
    transform: scale(1.05);
  }

  /* Card Badges */
  .card-badge-cat {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(4px);
    color: #FFA000;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    z-index: 2;
  }
  .card-badge-discount {
    position: absolute;
    top: 12px;
    right: 12px;
    background: var(--primary);
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 900;
    padding: 4px 10px;
    border-radius: 20px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    z-index: 2;
  }

  .card-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  .card-title {
    font-family: 'Outfit', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: var(--navy);
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
    flex-grow: 1;
  }
  .card-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: auto;
  }
  .card-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 700;
    padding: 9px 12px;
    border-radius: 8px;
    text-decoration: none;
    text-align: center;
    transition: all 0.2s ease;
  }
  .card-btn-book {
    background: var(--navy);
    color: #FFFFFF;
  }
  .card-btn-book:hover {
    background: var(--primary);
  }
  .card-btn-wa {
    background: #E8F5E9;
    color: #1B5E20;
    border: 1px solid #C8E6C9;
  }
  .card-btn-wa:hover {
    background: #25D366;
    color: #FFFFFF;
  }

  /* Single Article View & In-Article Booking Engine */
  .article-container {
    max-width: 860px;
    margin: 0 auto;
    background: #FFFFFF;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 32px 28px;
    box-shadow: var(--shadow-sm);
  }
  .article-category {
    color: var(--primary);
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    display: block;
  }
  .article-title {
    font-family: 'Outfit', sans-serif;
    font-size: 30px;
    font-weight: 900;
    color: var(--navy);
    line-height: 1.25;
    margin-bottom: 14px;
  }
  .article-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: var(--text-muted);
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .author-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: var(--navy);
  }
  .author-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--primary);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
  }

  /* Interactive Booking Engine Card */
  .booking-engine-box {
    background: linear-gradient(135deg, #FFF5EB 0%, #FFFFFF 100%);
    border: 2px solid var(--primary);
    border-radius: var(--radius-md);
    padding: 24px;
    margin: 28px 0;
    box-shadow: var(--shadow-md);
  }
  .booking-box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .booking-box-title {
    font-family: 'Outfit', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--navy);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .booking-box-tag {
    background: var(--primary);
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 12px;
    text-transform: uppercase;
  }
  .booking-fields-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }
  .booking-field label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: var(--navy);
    margin-bottom: 6px;
  }
  .booking-field input, .booking-field select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    background: #FFFFFF;
    color: var(--navy);
  }
  .booking-engine-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .engine-btn {
    flex: 1;
    min-width: 180px;
    padding: 12px 18px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: 800;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
  }
  .engine-btn-book {
    background: var(--primary);
    color: #FFFFFF;
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }
  .engine-btn-book:hover {
    background: var(--primary-dark);
  }
  .engine-btn-wa {
    background: #25D366;
    color: #FFFFFF;
    box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);
  }
  .engine-btn-wa:hover {
    background: #1EBE5B;
  }

  /* Compact Sleek Footer */
  .main-footer {
    background: #090D16;
    color: #CBD5E1;
    padding: 40px 20px 24px;
    border-top: 3px solid var(--primary);
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
    gap: 10px;
  }
  .footer-brand-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .footer-desc {
    font-size: 13px;
    color: #94A3B8;
    max-width: 720px;
    line-height: 1.5;
  }

  /* Official Portals as Premium Pill Buttons */
  .footer-portals-section {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 20px;
  }
  .footer-heading {
    color: #FFA000;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .footer-portal-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }
  .portal-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s ease;
  }
  .portal-btn:hover {
    background: rgba(255, 107, 0, 0.15);
    border-color: var(--primary);
    transform: translateY(-2px);
  }
  .portal-btn-icon {
    font-size: 20px;
    flex-shrink: 0;
  }
  .portal-btn-info {
    display: flex;
    flex-direction: column;
  }
  .portal-btn-title {
    color: #FFFFFF;
    font-size: 13px;
    font-weight: 700;
  }
  .portal-btn-sub {
    color: #94A3B8;
    font-size: 11px;
  }

  /* 24/7 Helpline & Concierge Row */
  .footer-support-section {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 20px;
  }
  .footer-contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }
  .contact-pill {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px 14px;
    text-decoration: none;
    color: #E2E8F0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: all 0.2s ease;
  }
  .contact-pill:hover {
    border-color: var(--primary);
    background: rgba(255, 107, 0, 0.1);
  }
  .contact-pill span {
    font-size: 11px;
    color: #94A3B8;
  }
  .contact-pill strong {
    font-size: 13px;
    color: #FFA000;
  }

  /* Footer Legal & Copyright */
  .footer-legal-bar {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 18px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .legal-links-row {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .legal-links-row a {
    color: #CBD5E1;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
  }
  .legal-links-row a:hover {
    color: var(--primary);
    text-decoration: underline;
  }
  .legal-links-row .sep {
    color: #475569;
  }
  .copyright-text {
    font-size: 12px;
    color: #64748B;
  }

  /* =======================================================================
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
  }

  /* Desktop Call Prompt Modal */
  .call-modal-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .call-modal-box {
    background: #FFFFFF;
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 400px;
    width: 100%;
    text-align: center;
    box-shadow: 0 16px 40px rgba(0,0,0,0.25);
  }
  ]]></b:skin>
</head>
<body>

  <!-- =======================================================================
       TOP CUSTOMIZABLE GADGETS & ADS (Blogger Layout Editable)
       ======================================================================= -->
  <b:section id='top-banner-ads' name='[Top of Page] Ads &amp; Announcement Gadgets' maxwidgets='5' showaddelement='yes'/>

  <!-- =======================================================================
       2. MAIN LUXURY HEADER
       ======================================================================= -->
  <header class='main-header'>
    <div class='header-container'>
      
      <!-- Official Logo with Embedded Lifetime Base64 Data URI -->
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

      <!-- Quick Action Buttons -->
      <div class='header-actions'>
        <!-- Language Switcher -->
        <div class='lang-switcher' onclick='toggleLangMenu(event)'>
          <span>🌐</span>
          <span>EN</span>
          <span>▾</span>
          <div class='lang-dropdown' id='langDropdown'>
            <a class='active' href='#' onclick='selectLang("en", event)'>English (Default)</a>
            <a href='#' onclick='selectLang("hi", event)'>हिन्दी (Hindi)</a>
          </div>
        </div>

        <a class='btn-header btn-header-book' href='https://bookings.lexatrip.com/' target='_blank'>
          <span>🏨 Book Online</span>
        </a>
        <a class='btn-header btn-header-wa' href='https://wa.me/919079854982?text=Hello%20LexaTrip,%20I%20would%20like%20to%20inquire%20about%20${destBadge}%20stays' target='_blank'>
          <span>💬 WhatsApp</span>
        </a>
        <a class='btn-header btn-header-app' href='https://www.lexatrip.com/app' target='_blank'>
          <span>📲 App</span>
        </a>
      </div>

    </div>

    <!-- =======================================================================
         3. CATEGORY NAVIGATION BAR (Horizontally Scrollable in Pure English)
         ======================================================================= -->
    <div class='category-nav-wrapper'>
      <div class='category-nav-container'>
        <button class='cat-nav-scroll-btn' onclick='scrollCatNav(-180)' title='Scroll Left'>‹</button>
        <nav class='category-nav-flex' id='categoryNav'>
          <a class='cat-pill active' href='#' onclick='filterCategory("all", event)'>
            <span>🏠 Home</span>
          </a>
          <a class='cat-pill' href='#' onclick='filterCategory("camp", event)'>
            <span>⛺ Luxury Camps</span>
          </a>
          <a class='cat-pill' href='#' onclick='filterCategory("5-star", event)'>
            <span>⭐ 5-Star Hotels</span>
          </a>
          <a class='cat-pill' href='#' onclick='filterCategory("4-star", event)'>
            <span>🏨 4-Star Hotels</span>
          </a>
          <a class='cat-pill' href='#' onclick='filterCategory("3-star", event)'>
            <span>🛏️ 3-Star Hotels</span>
          </a>
          <a class='cat-pill' href='#' onclick='filterCategory("budget", event)'>
            <span>💰 Budget Friendly Hotels</span>
          </a>
        </nav>
        <button class='cat-nav-scroll-btn' onclick='scrollCatNav(180)' title='Scroll Right'>›</button>
      </div>
    </div>
  </header>

  <!-- =======================================================================
       ABOVE POSTS ADS & PROMO (Blogger Layout Editable)
       ======================================================================= -->
  <b:section id='above-posts-ads' name='[Above Posts] Promo Banner &amp; Sponsored Ads' maxwidgets='5' showaddelement='yes'/>

  <!-- =======================================================================
       5. MAIN CONTENT & BLOG WIDGET
       ======================================================================= -->
  <div class='content-wrapper'>
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
  </div>

  <!-- Optional In-Article / In-Feed Ads Section (Blogger Layout Customizable) -->
  <b:section id='in-feed-promo-ads' name='[Between Posts] In-Feed Promo &amp; Advertisements' maxwidgets='5' showaddelement='yes'/>

  <!-- =======================================================================
       6. COMPACT SLEEK FOOTER (English, No Bulky Categories, Button Portals)
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
          India's premier experiential luxury travel network. Curated luxury desert camps, heritage palace hotels, and verified tours in ${destBadge}.
        </p>
      </div>

      <!-- Official Portals (Button-style pills) -->
      <div class='footer-portals-section'>
        <h4 class='footer-heading'>OFFICIAL PORTALS</h4>
        <div class='footer-portal-buttons'>
          <a class='portal-btn' href='https://bookings.lexatrip.com/' target='_blank'>
            <span class='portal-btn-icon'>🏨</span>
            <div class='portal-btn-info'>
              <span class='portal-btn-title'>Online Reservations</span>
              <span class='portal-btn-sub'>bookings.lexatrip.com</span>
            </div>
          </a>
          <a class='portal-btn' href='https://www.lexatrip.com/' target='_blank'>
            <span class='portal-btn-icon'>🌐</span>
            <div class='portal-btn-info'>
              <span class='portal-btn-title'>Main Website</span>
              <span class='portal-btn-sub'>lexatrip.com</span>
            </div>
          </a>
          <a class='portal-btn' href='https://www.lexatrip.in/' target='_blank'>
            <span class='portal-btn-icon'>🇮🇳</span>
            <div class='portal-btn-info'>
              <span class='portal-btn-title'>National Portal</span>
              <span class='portal-btn-sub'>lexatrip.in</span>
            </div>
          </a>
          <a class='portal-btn' href='https://www.lexatrip.com/app' target='_blank'>
            <span class='portal-btn-icon'>📲</span>
            <div class='portal-btn-info'>
              <span class='portal-btn-title'>Mobile App</span>
              <span class='portal-btn-sub'>Android &amp; iOS App</span>
            </div>
          </a>
        </div>
      </div>

      <!-- Optional Customizable Portal Section in Blogger Layout -->
      <b:section id='footer-custom-links' name='[Footer Top] Custom Links, Social &amp; Partner Portals' maxwidgets='5' showaddelement='yes'/>

      <!-- 24/7 Helpline & Support -->
      <div class='footer-support-section'>
        <h4 class='footer-heading'>24/7 HELPLINE &amp; GUEST SUPPORT</h4>
        <div class='footer-contact-grid'>
          <a class='contact-pill' href='tel:+919079854982' onclick='handleCallClick(event)'>
            <span>📞 24/7 Priority Helpline 1</span>
            <strong>+91 90798 54982</strong>
          </a>
          <a class='contact-pill' href='tel:+919079017880' onclick='handleCallClick(event)'>
            <span>📞 24/7 Priority Helpline 2</span>
            <strong>+91 90790 17880</strong>
          </a>
          <a class='contact-pill' href='https://wa.me/919079854982?text=Hello%20LexaTrip,%20I%20need%20assistance' target='_blank'>
            <span>💬 Official WhatsApp Desk</span>
            <strong>+91 90798 54982</strong>
          </a>
          <a class='contact-pill' href='mailto:info@lexatrip.com'>
            <span>✉️ Official Email Desk</span>
            <strong>info@lexatrip.com</strong>
          </a>
        </div>
      </div>

      <!-- Legal Links & Copyright -->
      <div class='footer-legal-bar'>
        <div class='legal-links-row'>
          <a href='/p/about-us.html'>About Us</a>
          <span class='sep'>•</span>
          <a href='/p/contact-us.html'>Contact Us</a>
          <span class='sep'>•</span>
          <a href='/p/privacy-policy.html'>Privacy Policy</a>
          <span class='sep'>•</span>
          <a href='/p/terms-conditions.html'>Terms &amp; Conditions</a>
        </div>
        <p class='copyright-text'>
          © 2026 LexaTrip™ Technologies Pvt. Ltd. All rights reserved. Book. Explore. Repeat.
        </p>
      </div>

    </div>
  </footer>

  <!-- Optional Footer Bottom Ad Banner Section -->
  <b:section id='footer-bottom-ads' name='[Footer Bottom] Custom Ads, Disclaimer &amp; Tracking Codes' maxwidgets='5' showaddelement='yes'/>

  <!-- =======================================================================
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
    <a class='bar-btn bar-btn-wa' href='https://wa.me/919079854982?text=Hello%20LexaTrip,%20I%20would%20like%20to%20inquire%20about%20${destBadge}%20packages' target='_blank' title='Direct WhatsApp Chat'>
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
  </div>

  <!-- Desktop Call Dialog Modal -->
  <div class='call-modal-overlay' id='callModal' onclick='if(event.target===this)this.style.display=\"none\";'>
    <div class='call-modal-box'>
      <div style='font-size:36px; margin-bottom:12px;'>📞</div>
      <h3 style='margin-bottom:8px; color:#0F172A;'>LexaTrip™ 24/7 Helpline</h3>
      <p style='color:#64748B; font-size:13px; margin-bottom:20px;'>Connect directly with our destination travel concierge:</p>
      <div style='display:flex; flex-direction:column; gap:10px; margin-bottom:20px;'>
        <a href='tel:+919079854982' style='background:#FF6B00; color:#FFFFFF; padding:12px; border-radius:8px; font-weight:700; text-decoration:none;'>📞 Call +91 90798 54982</a>
        <a href='tel:+919079017880' style='background:#0F172A; color:#FFFFFF; padding:12px; border-radius:8px; font-weight:700; text-decoration:none;'>📞 Call +91 90790 17880</a>
        <a href='https://wa.me/919079854982' target='_blank' style='background:#25D366; color:#FFFFFF; padding:12px; border-radius:8px; font-weight:700; text-decoration:none;'>💬 Chat on WhatsApp</a>
      </div>
      <button onclick='document.getElementById(\"callModal\").style.display=\"none\";' style='background:#F1F5F9; border:none; padding:8px 20px; border-radius:20px; font-weight:700; color:#475569; cursor:pointer;'>Close</button>
    </div>
  </div>

  <!-- =======================================================================
       8. CLIENT-SIDE HYBRID ENGINE (Dynamic Discounts, Category Filter & Legal)
       ======================================================================= -->
  <script type='text/javascript'>
  //<![CDATA[
    let allPostsData = [];
    let currentCategoryFilter = 'all';

    // Horizontal Scroll for Category Pills
    function scrollCatNav(offset) {
      const el = document.getElementById('categoryNav');
      if (el) el.scrollBy({ left: offset, behavior: 'smooth' });
    }

    // Call Action Handler
    function handleCallClick(e) {
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = 'tel:+919079854982';
      } else {
        if (e) e.preventDefault();
        const modal = document.getElementById('callModal');
        if (modal) modal.style.display = 'flex';
      }
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

    // Dynamic Realistic Discount Generator
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

      // 1. Legal / Static Page Routing
      if (lowPath.includes('about-us')) {
        renderLegalStaticPage(container, ${JSON.stringify(legalPages.aboutUs.title)}, ${JSON.stringify(legalPages.aboutUs.content)});
        return;
      }
      if (lowPath.includes('contact-us')) {
        renderLegalStaticPage(container, ${JSON.stringify(legalPages.contactUs.title)}, ${JSON.stringify(legalPages.contactUs.content)});
        return;
      }
      if (lowPath.includes('privacy-policy')) {
        renderLegalStaticPage(container, ${JSON.stringify(legalPages.privacyPolicy.title)}, ${JSON.stringify(legalPages.privacyPolicy.content)});
        return;
      }
      if (lowPath.includes('terms-conditions') || lowPath.includes('terms')) {
        renderLegalStaticPage(container, ${JSON.stringify(legalPages.termsConditions.title)}, ${JSON.stringify(legalPages.termsConditions.content)});
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

      document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes("'" + cat + "'") || btn.getAttribute('onclick').includes('\"' + cat + '\"'));
      });

      const container = document.getElementById('lexa-dynamic-root');
      if (container) renderPostGrid(container, cat);
    }

    // Render 4:5 Card Grid
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
            '<h3 style=\"font-size:20px; font-weight:800; color:#0F172A; margin-bottom:8px;\">New verified hotels &amp; camps coming soon!</h3>' +
            '<p style=\"color:#64748B; font-size:14px; max-width:500px; margin:0 auto 20px;\">For immediate reservation quotes and priority bookings in this category, contact our 24/7 travel desk.</p>' +
            '<a href=\"https://wa.me/919079854982\" target=\"_blank\" style=\"display:inline-block; background:#25D366; color:#FFF; font-weight:700; padding:10px 22px; border-radius:24px; text-decoration:none;\">💬 WhatsApp Concierge</a>' +
          '</div>';
        return;
      }

      let html = '<div class=\"post-grid\" id=\"postGrid\">';
      filtered.forEach((entry, idx) => {
        const title = (entry.title && entry.title.$t) || 'LexaTrip Luxury Stay';
        const content = (entry.content && entry.content.$t) || (entry.summary && entry.summary.$t) || '';
        const id = (entry.id && entry.id.$t) || ('post_' + idx);
        
        let postUrl = '#';
        if (entry.link) {
          const altLink = entry.link.find(l => l.rel === 'alternate');
          if (altLink) postUrl = altLink.href;
        }

        // Image extraction
        let imgUrl = 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80';
        if (entry.media$thumbnail && entry.media$thumbnail.url) {
          imgUrl = entry.media$thumbnail.url.replace('/s72-c/', '/s800/').replace('/w72-h72-p-k-no-nu/', '/w800-h1000-c/');
        } else {
          const m = content.match(/<img[^>]+src=['\"]([^'\"]+)['\"]/i);
          if (m && m[1]) imgUrl = m[1];
        }

        // Category Tag
        let catLabel = 'Luxury Stay';
        if (entry.category && entry.category.length > 0) catLabel = entry.category[0].term;

        // Dynamic Realistic Discount
        const discountBadge = getPostDiscount(title, id);

        // Clean Snippet
        const tmp = document.createElement('div');
        tmp.innerHTML = content;
        const textOnly = (tmp.textContent || tmp.innerText || '').trim();
        const snippet = textOnly.slice(0, 110) + '...';

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
              '<div class=\"card-actions\">' +
                '<a class=\"card-btn card-btn-book\" href=\"https://bookings.lexatrip.com/\" target=\"_blank\">🏨 Book Now</a>' +
                '<a class=\"card-btn card-btn-wa\" href=\"https://wa.me/919079854982?text=' + encodeURIComponent('Hello LexaTrip, I would like to book: ' + title) + '\" target=\"_blank\">💬 WhatsApp</a>' +
              '</div>' +
            '</div>' +
          '</article>';
      });
      html += '</div>';

      container.innerHTML = html;
    }

    // Render Single Article with Interactive Booking Engine
    function renderSingleArticle(container, currentPath) {
      let matched = null;
      for (const entry of allPostsData) {
        if (entry.link) {
          const altLink = entry.link.find(l => l.rel === 'alternate');
          if (altLink && altLink.href && altLink.href.includes(currentPath)) {
            matched = entry;
            break;
          }
        }
      }

      const postTitle = matched ? ((matched.title && matched.title.$t) || '') : document.title;
      const postContent = matched ? ((matched.content && matched.content.$t) || '') : (document.querySelector('.post-body, .entry-content')?.innerHTML || '');
      const dynamicDiscount = getPostDiscount(postTitle, currentPath);

      container.innerHTML = 
        '<article class=\"article-container\">' +
          '<span class=\"article-category\">' + ${JSON.stringify(destTag)} + '</span>' +
          '<h1 class=\"article-title\">' + postTitle + '</h1>' +
          '<div class=\"article-meta\">' +
            '<div class=\"author-badge\">' +
              '<div class=\"author-avatar\">LT</div>' +
              '<span>LexaTrip™ Verified Concierge</span>' +
            '</div>' +
            '<span>•</span>' +
            '<span>⭐ Verified 5.0 Rating</span>' +
            '<span>•</span>' +
            '<span style=\"color:#FF6B00; font-weight:800;\">⚡ ' + dynamicDiscount + ' Available</span>' +
          '</div>' +

          // Interactive Booking Engine Card
          '<div class=\"booking-engine-box\">' +
            '<div class=\"booking-box-header\">' +
              '<div class=\"booking-box-title\">' +
                '<span>📅</span> Reserve Tour &amp; Check Availability' +
              '</div>' +
              '<span class=\"booking-box-tag\">' + dynamicDiscount + '</span>' +
            '</div>' +
            '<div class=\"booking-fields-grid\">' +
              '<div class=\"booking-field\">' +
                '<label>Check-in Date</label>' +
                '<input id=\"bookCheckIn\" type=\"date\"/>' +
              '</div>' +
              '<div class=\"booking-field\">' +
                '<label>Check-out Date</label>' +
                '<input id=\"bookCheckOut\" type=\"date\"/>' +
              '</div>' +
              '<div class=\"booking-field\">' +
                '<label>Guests (Pax)</label>' +
                '<select id=\"bookPax\">' +
                  '<option value=\"1 Adult\">1 Guest (Solo)</option>' +
                  '<option selected=\"selected\" value=\"2 Adults\">2 Guests (Couple)</option>' +
                  '<option value=\"3 Guests\">3 Guests</option>' +
                  '<option value=\"4 Guests (Family)\">4 Guests (Family)</option>' +
                  '<option value=\"5+ Guests (Group)\">5+ Guests (Group)</option>' +
                '</select>' +
              '</div>' +
              '<div class=\"booking-field\">' +
                '<label>Room / Camp Category</label>' +
                '<select id=\"bookRoomType\">' +
                  '<option value=\"Luxury Royal Camp\">Luxury Royal Camp (AC/Heater)</option>' +
                  '<option value=\"5-Star Palace Suite\">5-Star Palace Suite</option>' +
                  '<option value=\"4-Star Heritage Room\">4-Star Heritage Room</option>' +
                  '<option value=\"3-Star Deluxe Room\">3-Star Deluxe Room</option>' +
                  '<option value=\"Budget Friendly Room\">Budget Friendly Stay</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class=\"booking-engine-actions\">' +
              '<a class=\"engine-btn engine-btn-book\" href=\"https://bookings.lexatrip.com/\" onclick=\"triggerDirectBooking(event, \x27' + postTitle.replace(/\'/g, '\\\\\'') + '\x27)\">' +
                '<span>🏨 Instant Online Booking</span>' +
              '</a>' +
              '<a class=\"engine-btn engine-btn-wa\" href=\"#\" onclick=\"triggerWhatsAppBooking(event, \x27' + postTitle.replace(/\'/g, '\\\\\'') + '\x27)\">' +
                '<span>💬 Get Instant WhatsApp Quote</span>' +
              '</a>' +
            '</div>' +
          '</div>' +

          '<div class=\"article-content\" style=\"font-size:16px; line-height:1.8;\">' +
            postContent +
          '</div>' +

          '<div style=\"margin-top:40px; padding-top:24px; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;\">' +
            '<a href=\"/\" style=\"display:inline-block; background:#0F172A; color:#FFFFFF; font-weight:700; padding:10px 22px; border-radius:30px; text-decoration:none;\">← Back to All Stays</a>' +
            '<a href=\"https://bookings.lexatrip.com/\" target=\"_blank\" style=\"display:inline-block; background:#FF6B00; color:#FFFFFF; font-weight:700; padding:10px 22px; border-radius:30px; text-decoration:none;\">Explore More Destinations →</a>' +
          '</div>' +
        '</article>';

      // Set default check-in/out dates
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const inEl = document.getElementById('bookCheckIn');
      const outEl = document.getElementById('bookCheckOut');
      if (inEl) inEl.value = today.toISOString().split('T')[0];
      if (outEl) outEl.value = tomorrow.toISOString().split('T')[0];
    }

    // Direct Online Booking Trigger
    function triggerDirectBooking(event, title) {
      if (event) event.preventDefault();
      const checkIn = document.getElementById('bookCheckIn')?.value || '';
      const checkOut = document.getElementById('bookCheckOut')?.value || '';
      const pax = document.getElementById('bookPax')?.value || '2 Adults';
      const roomType = document.getElementById('bookRoomType')?.value || 'Luxury Camp';
      
      const params = new URLSearchParams({
        dest: ${JSON.stringify(destCode)},
        hotel: title,
        checkIn: checkIn,
        checkOut: checkOut,
        pax: pax,
        category: roomType,
        coupon: 'LEXA50ACTIVE'
      });
      window.open('https://bookings.lexatrip.com/?' + params.toString(), '_blank');
    }

    // Instant WhatsApp Quote Trigger
    function triggerWhatsAppBooking(event, title) {
      if (event) event.preventDefault();
      const checkIn = document.getElementById('bookCheckIn')?.value || '';
      const checkOut = document.getElementById('bookCheckOut')?.value || '';
      const pax = document.getElementById('bookPax')?.value || '2 Adults';
      const roomType = document.getElementById('bookRoomType')?.value || 'Luxury Camp';

      const waText = encodeURIComponent(
        'Hello LexaTrip Concierge! 🏨✨\\n\\n' +
        'I would like to book a verified stay in ' + ${JSON.stringify(destBadge)} + ':\\n\\n' +
        '📍 Hotel/Camp: ' + (title || 'Tour & Stay') + '\\n' +
        '🛏️ Category: ' + roomType + '\\n' +
        '📅 Check-in: ' + (checkIn || 'Earliest') + '\\n' +
        '📅 Check-out: ' + (checkOut || 'Next Day') + '\\n' +
        '👥 Number of Guests: ' + pax + '\\n' +
        '🏷️ Promo Code: LEXAACTIVE\\n\\n' +
        'Please confirm availability and the best discounted quotation!'
      );
      window.open('https://wa.me/919079854982?text=' + waText, '_blank');
    }

    // Render Legal / Static Page
    function renderLegalStaticPage(container, title, content) {
      container.innerHTML = 
        '<article class=\"article-container\">' +
          '<span class=\"article-category\">LexaTrip™ Official Verified Page</span>' +
          '<h1 class=\"article-title\">' + title + '</h1>' +
          '<div class=\"article-meta\">' +
            '<div class=\"author-badge\">' +
              '<div class=\"author-avatar\">LT</div>' +
              '<span>LexaTrip Legal &amp; Compliance Team</span>' +
            '</div>' +
            '<span>•</span>' +
            '<span>📅 Updated: 2026</span>' +
            '<span>•</span>' +
            '<span>★ Verified Official Policy</span>' +
          '</div>' +
          '<div class=\"article-content\" style=\"font-size:15px; line-height:1.8;\">' +
            content +
          '</div>' +
          '<div style=\"margin-top:30px; padding-top:20px; border-top:1px solid #E2E8F0; text-align:center;\">' +
            '<a href=\"/\" style=\"display:inline-block; background:#0F172A; color:#FFFFFF; font-weight:700; padding:10px 24px; border-radius:30px; text-decoration:none;\">← Back to Home</a>' +
          '</div>' +
        '</article>';
    }

    // Initialize on load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadLexaBlogContent);
    } else {
      loadLexaBlogContent();
    }
  //]]>
  </script>
</body>
</html>`;

  return xml;
}

// Generate Jaisalmer Theme
const jaisalmerXml = generateMasterThemeXml({
  badge: 'JAISALMER',
  title: 'Jaisalmer Luxury Stays, Desert Camps & Fort Heritage Guide',
  desc: 'Discover verified luxury Swiss tent camps at Sam Sand Dunes, heritage fort stays, and desert camel safaris in the Golden City of Jaisalmer. Curated stays with exclusive rates and 24/7 concierge.',
  destCode: 'JAISALMER',
  destTag: 'Jaisalmer Luxury Travel & Stays'
});

const outputPath = path.join(__dirname, '..', 'public', 'theme', 'destinations', 'lexatrip_theme_jaisalmer.xml');
fs.writeFileSync(outputPath, jaisalmerXml, 'utf8');
console.log('Successfully generated upgraded Jaisalmer theme XML! Length:', jaisalmerXml.length);

// Also stage in references
const refPath = 'C:/Users/imran/.gemini/antigravity/brain/880516ee-b068-4c79-a8a9-da055918a37f/browser_sandbox/references/lexatrip_theme_jaisalmer.xml';
fs.writeFileSync(refPath, jaisalmerXml, 'utf8');
console.log('Staged in browser_sandbox/references/lexatrip_theme_jaisalmer.xml');

// Also update main template
fs.writeFileSync(path.join(__dirname, '..', 'public', 'theme', 'lexatrip_blogger_theme.xml'), jaisalmerXml, 'utf8');
fs.writeFileSync('C:/Users/imran/.gemini/antigravity/brain/880516ee-b068-4c79-a8a9-da055918a37f/browser_sandbox/references/lexatrip_theme.xml', jaisalmerXml, 'utf8');
console.log('Updated public/theme/lexatrip_blogger_theme.xml and lexatrip_theme.xml');

module.exports = { generateMasterThemeXml };
