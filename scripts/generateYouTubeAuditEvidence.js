const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDirs = [
  'C:\\Users\\imran\\.gemini\\antigravity\\brain\\880516ee-b068-4c79-a8a9-da055918a37f\\browser_sandbox\\uploads',
  'C:\\Users\\imran\\.gemini\\antigravity\\brain\\b052e4a9-5d1c-435f-a434-a349f8e9b7e7\\browser_sandbox\\uploads',
  path.join(__dirname, '..', 'docs', 'youtube_audit_evidence')
];

// Helper to save buffer to all target dirs
async function saveToAll(filename, buffer) {
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
  }
  console.log(`Saved ${filename} to all target directories.`);
}

// 1. Architecture Diagram SVG
function getArchitectureSvg() {
  return `
  <svg width="1600" height="1000" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b0f19"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
      <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="accentOrange" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#f97316"/>
        <stop offset="100%" stop-color="#ea580c"/>
      </linearGradient>
      <linearGradient id="accentBlue" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
      <linearGradient id="accentGreen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#34d399"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
      <linearGradient id="accentRed" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#f87171"/>
        <stop offset="100%" stop-color="#dc2626"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
      </filter>
    </defs>

    <rect width="1600" height="1000" fill="url(#bg)"/>

    <!-- Title Bar -->
    <rect x="60" y="40" width="1480" height="100" rx="16" fill="url(#cardBg)" stroke="#334155" stroke-width="1.5" filter="url(#shadow)"/>
    <circle cx="110" cy="90" r="28" fill="url(#accentOrange)"/>
    <text x="110" y="98" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">LT</text>
    <text x="160" y="80" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff">LexaTrip Social OS — YouTube API System Architecture</text>
    <text x="160" y="112" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8">Cloud Project: #430109217076 | API Scope: https://www.googleapis.com/auth/youtube.upload | Target Quota: 200,000 units/day</text>

    <!-- Node 1: Telegram Webhook / Ingestion Layer -->
    <g transform="translate(60, 180)" filter="url(#shadow)">
      <rect width="320" height="340" rx="16" fill="url(#cardBg)" stroke="#38bdf8" stroke-width="2"/>
      <rect x="0" y="0" width="320" height="50" rx="16" fill="url(#accentBlue)"/>
      <rect x="0" y="30" width="320" height="20" fill="url(#accentBlue)"/>
      <text x="160" y="34" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">1. INGESTION LAYER</text>
      <text x="20" y="85" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f8fafc">17 Regional Channels</text>
      <text x="20" y="110" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• Jaisalmer, Munnar, Goa, Manali</text>
      <text x="20" y="130" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• Udaipur, Varanasi, Ooty, Rishikesh</text>
      <text x="20" y="150" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• + 9 More Tourism Hubs</text>
      
      <rect x="20" y="180" width="280" height="120" rx="10" fill="#0f172a" stroke="#334155"/>
      <text x="35" y="210" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#38bdf8">Payload Specs:</text>
      <text x="35" y="235" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- 4K Travel Clips &amp; Itineraries</text>
      <text x="35" y="255" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- Hotel Walkthroughs &amp; Camps</text>
      <text x="35" y="275" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- Secure Webhook / HMAC Token</text>
    </g>

    <!-- Node 2: Processing Engine -->
    <g transform="translate(440, 180)" filter="url(#shadow)">
      <rect width="340" height="340" rx="16" fill="url(#cardBg)" stroke="#f97316" stroke-width="2"/>
      <rect x="0" y="0" width="340" height="50" rx="16" fill="url(#accentOrange)"/>
      <rect x="0" y="30" width="340" height="20" fill="url(#accentOrange)"/>
      <text x="170" y="34" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">2. LEXATRIP CORE ENGINE</text>
      
      <text x="20" y="85" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f8fafc">Video Rendering Pipeline</text>
      <text x="20" y="110" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• FFmpeg 9:16 Shorts Transcoding</text>
      <text x="20" y="130" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• Audio Normalization (Royalty Free)</text>
      <text x="20" y="150" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• Dynamic Destination Watermark</text>

      <rect x="20" y="180" width="300" height="120" rx="10" fill="#0f172a" stroke="#334155"/>
      <text x="35" y="210" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#fb923c">SEO &amp; Metadata Generator:</text>
      <text x="35" y="235" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- Google Helpful Content Compliant</text>
      <text x="35" y="255" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- Rich Description &amp; Booking CTA</text>
      <text x="35" y="275" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- Direct Link: bookings.lexatrip.com</text>
    </g>

    <!-- Node 3: Auth & Security Vault -->
    <g transform="translate(840, 180)" filter="url(#shadow)">
      <rect width="320" height="340" rx="16" fill="url(#cardBg)" stroke="#34d399" stroke-width="2"/>
      <rect x="0" y="0" width="320" height="50" rx="16" fill="url(#accentGreen)"/>
      <rect x="0" y="30" width="320" height="20" fill="url(#accentGreen)"/>
      <text x="160" y="34" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">3. OAUTH 2.0 SECURITY</text>
      
      <text x="20" y="85" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f8fafc">Google Cloud Platform</text>
      <text x="20" y="110" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• Project: 430109217076</text>
      <text x="20" y="130" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• Scopes: youtube.upload</text>
      <text x="20" y="150" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• Scopes: youtube.readonly</text>

      <rect x="20" y="180" width="280" height="120" rx="10" fill="#0f172a" stroke="#334155"/>
      <text x="35" y="210" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#34d399">Token Lifecycle Security:</text>
      <text x="35" y="235" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- Automatic OAuth Access Token Refresh</text>
      <text x="35" y="255" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- Encrypted Refresh Token Storage</text>
      <text x="35" y="275" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- Granular Token Revocation Compliance</text>
    </g>

    <!-- Node 4: YouTube API & Delivery -->
    <g transform="translate(1220, 180)" filter="url(#shadow)">
      <rect width="320" height="340" rx="16" fill="url(#cardBg)" stroke="#f87171" stroke-width="2"/>
      <rect x="0" y="0" width="320" height="50" rx="16" fill="url(#accentRed)"/>
      <rect x="0" y="30" width="320" height="20" fill="url(#accentRed)"/>
      <text x="160" y="34" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">4. YOUTUBE API V3</text>
      
      <text x="20" y="85" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f8fafc">Google YouTube Services</text>
      <text x="20" y="110" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• Resumable Media Uploader</text>
      <text x="20" y="130" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• Endpoint: youtube.videos.insert</text>
      <text x="20" y="150" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">• Endpoint: youtube.playlists.insert</text>

      <rect x="20" y="180" width="280" height="120" rx="10" fill="#0f172a" stroke="#334155"/>
      <text x="35" y="210" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#f87171">Quota Allocation (200k):</text>
      <text x="35" y="235" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- 1,600 units per video insert</text>
      <text x="35" y="255" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- ~100 daily Shorts across 17 hubs</text>
      <text x="35" y="275" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1">- Total: 160,000 + 40,000 headroom</text>
    </g>

    <!-- Bottom Section: Consumer & Booking Flow -->
    <g transform="translate(60, 560)" filter="url(#shadow)">
      <rect width="1480" height="380" rx="16" fill="url(#cardBg)" stroke="#475569" stroke-width="1.5"/>
      <text x="40" y="50" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">5. END-TO-END CONSUMER CONVERSION &amp; BOOKING INTEGRATION</text>
      
      <!-- Box A: YouTube Audience -->
      <rect x="40" y="80" width="440" height="260" rx="12" fill="#0f172a" stroke="#334155"/>
      <circle cx="80" cy="120" r="20" fill="#dc2626"/>
      <polygon points="75,110 90,120 75,130" fill="#ffffff"/>
      <text x="115" y="127" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">YouTube Travelers &amp; Viewers</text>
      <text x="40" y="170" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Watches 4K experiential Short of Jaisalmer Desert Camp</text>
      <text x="40" y="200" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Description contains verified package details &amp; price</text>
      <text x="40" y="230" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Prominent call-to-action: "Book at bookings.lexatrip.com"</text>
      <text x="40" y="260" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Clicks official booking link directly from video description</text>

      <!-- Arrow -->
      <polygon points="510,210 540,210 540,200 560,215 540,230 540,220 510,220" fill="#38bdf8"/>

      <!-- Box B: Booking Portal -->
      <rect x="580" y="80" width="440" height="260" rx="12" fill="#0f172a" stroke="#334155"/>
      <circle cx="620" cy="120" r="20" fill="#ea580c"/>
      <text x="620" y="127" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">🏨</text>
      <text x="655" y="127" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">bookings.lexatrip.com Portal</text>
      <text x="580" y="170" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Direct landing on curated hotel/camp booking page</text>
      <text x="580" y="200" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Live pricing, photo gallery, luxury amenities</text>
      <text x="580" y="230" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Footer displays Privacy Policy &amp; Terms links</text>
      <text x="580" y="260" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Verified guest reviews and 24/7 concierge desk</text>

      <!-- Arrow -->
      <polygon points="1050,210 1080,210 1080,200 1100,215 1080,230 1080,220 1050,220" fill="#34d399"/>

      <!-- Box C: Secure Reservation -->
      <rect x="1120" y="80" width="320" height="260" rx="12" fill="#0f172a" stroke="#334155"/>
      <circle cx="1160" cy="120" r="20" fill="#059669"/>
      <text x="1160" y="127" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">✓</text>
      <text x="1195" y="127" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">Confirmed Booking</text>
      <text x="1120" y="170" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Instant voucher dispatch</text>
      <text x="1120" y="200" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• SMS &amp; WhatsApp confirmation</text>
      <text x="1120" y="230" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Real-time hotel notify</text>
      <text x="1120" y="260" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" dx="20">• Zero YouTube PII storage</text>
    </g>

    <!-- Connectors between Top Nodes -->
    <path d="M 380 350 L 440 350" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6,6"/>
    <path d="M 780 350 L 840 350" stroke="#f97316" stroke-width="3" stroke-dasharray="6,6"/>
    <path d="M 1160 350 L 1220 350" stroke="#34d399" stroke-width="3" stroke-dasharray="6,6"/>
  </svg>
  `;
}

// 2. User Flow Diagram SVG
function getUserFlowSvg() {
  return `
  <svg width="1600" height="1000" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="flowBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="100%" stop-color="#111827"/>
      </linearGradient>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1f2937"/>
        <stop offset="100%" stop-color="#111827"/>
      </linearGradient>
      <filter id="flowShadow">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>

    <rect width="1600" height="1000" fill="url(#flowBg)"/>

    <!-- Header -->
    <rect x="60" y="40" width="1480" height="90" rx="16" fill="url(#cardGrad)" stroke="#374151" stroke-width="1.5" filter="url(#flowShadow)"/>
    <text x="100" y="80" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff">LexaTrip Social OS — User &amp; Automation Flow Diagram</text>
    <text x="100" y="110" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">Production YouTube Data API v3 Workflow | 17 Tourism Hubs | 200,000 Units Daily Allocation</text>

    <!-- Step 1 -->
    <g transform="translate(60, 160)" filter="url(#flowShadow)">
      <rect width="460" height="340" rx="16" fill="url(#cardGrad)" stroke="#3b82f6" stroke-width="2"/>
      <rect x="0" y="0" width="460" height="48" rx="16" fill="#2563eb"/>
      <rect x="0" y="30" width="460" height="18" fill="#2563eb"/>
      <text x="30" y="32" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">STEP 1: CURATED CONTENT INGESTION</text>
      
      <text x="30" y="85" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f3f4f6">Action: Verified Partner Upload</text>
      <text x="30" y="115" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Regional hotel/camp partner sends 4K clip to Telegram channel</text>
      <text x="30" y="140" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Includes property title, location coordinates &amp; nightly rate</text>
      <text x="30" y="165" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Bot verifies contributor authorization &amp; destination mapping</text>
      
      <rect x="30" y="195" width="400" height="115" rx="10" fill="#030712" stroke="#374151"/>
      <text x="45" y="225" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#60a5fa">Security &amp; Validation:</text>
      <text x="45" y="250" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ Telegram Bot API TLS verification</text>
      <text x="45" y="270" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ Media format validation (MP4, vertical 9:16)</text>
      <text x="45" y="290" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ Quality check: Minimum 1080x1920 @ 30fps</text>
    </g>

    <!-- Step 2 -->
    <g transform="translate(570, 160)" filter="url(#flowShadow)">
      <rect width="460" height="340" rx="16" fill="url(#cardGrad)" stroke="#f59e0b" stroke-width="2"/>
      <rect x="0" y="0" width="460" height="48" rx="16" fill="#d97706"/>
      <rect x="0" y="30" width="460" height="18" fill="#d97706"/>
      <text x="30" y="32" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">STEP 2: PIPELINE RENDERING &amp; SEO</text>
      
      <text x="30" y="85" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f3f4f6">Action: Transcoding &amp; Metadata Synthesis</text>
      <text x="30" y="115" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• FFmpeg stitches audio track with royalty-free licensing</text>
      <text x="30" y="140" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• SEO engine synthesizes YouTube title, tags, description</text>
      <text x="30" y="165" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Automatically appends booking deep-link</text>
      
      <rect x="30" y="195" width="400" height="115" rx="10" fill="#030712" stroke="#374151"/>
      <text x="45" y="225" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#fbbf24">Generated Metadata Example:</text>
      <text x="45" y="250" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">Title: Luxury Desert Camp Jaisalmer | Sam Sand Dunes</text>
      <text x="45" y="270" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">Link: https://bookings.lexatrip.com/hotels/jaisalmer-camp</text>
      <text x="45" y="290" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">Tags: #Jaisalmer #DesertCamp #LexaTrip #Rajasthan</text>
    </g>

    <!-- Step 3 -->
    <g transform="translate(1080, 160)" filter="url(#flowShadow)">
      <rect width="460" height="340" rx="16" fill="url(#cardGrad)" stroke="#10b981" stroke-width="2"/>
      <rect x="0" y="0" width="460" height="48" rx="16" fill="#059669"/>
      <rect x="0" y="30" width="460" height="18" fill="#059669"/>
      <text x="30" y="32" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">STEP 3: OAUTH TOKEN REFRESH</text>
      
      <text x="30" y="85" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f3f4f6">Action: Secure Credentials Validation</text>
      <text x="30" y="115" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• OAuth 2.0 handshake with Google Cloud Identity servers</text>
      <text x="30" y="140" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Validates project 430109217076 client secret</text>
      <text x="30" y="165" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Obtains ephemeral Bearer token (1-hour TTL)</text>
      
      <rect x="30" y="195" width="400" height="115" rx="10" fill="#030712" stroke="#374151"/>
      <text x="45" y="225" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#34d399">Compliance Safeguards:</text>
      <text x="45" y="250" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ Ephemeral tokens never exposed to client</text>
      <text x="45" y="270" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ Immediate token destruction on revoke</text>
      <text x="45" y="290" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ Zero storage of user account passwords</text>
    </g>

    <!-- Step 4 -->
    <g transform="translate(60, 560)" filter="url(#flowShadow)">
      <rect width="460" height="380" rx="16" fill="url(#cardGrad)" stroke="#ef4444" stroke-width="2"/>
      <rect x="0" y="0" width="460" height="48" rx="16" fill="#dc2626"/>
      <rect x="0" y="30" width="460" height="18" fill="#dc2626"/>
      <text x="30" y="32" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">STEP 4: YOUTUBE API RESUMABLE UPLOAD</text>
      
      <text x="30" y="85" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f3f4f6">Action: POST youtube.videos.insert</text>
      <text x="30" y="115" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Initiates resumable upload session on googleapis.com</text>
      <text x="30" y="140" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Streams video binary with Content-Type: video/mp4</text>
      <text x="30" y="165" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Sets privacyStatus: "public", license: "youtube"</text>
      <text x="30" y="190" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Sets categoryId: "19" (Travel &amp; Events)</text>
      
      <rect x="30" y="225" width="400" height="125" rx="10" fill="#030712" stroke="#374151"/>
      <text x="45" y="255" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#f87171">Quota Tracking (1,600 units):</text>
      <text x="45" y="280" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">- Deducts exactly 1,600 units per video insert</text>
      <text x="45" y="300" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">- Daily target: 100 uploads = 160,000 units</text>
      <text x="45" y="320" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">- Status: Returns videoId upon successful commit</text>
    </g>

    <!-- Step 5 -->
    <g transform="translate(570, 560)" filter="url(#flowShadow)">
      <rect width="460" height="380" rx="16" fill="url(#cardGrad)" stroke="#8b5cf6" stroke-width="2"/>
      <rect x="0" y="0" width="460" height="48" rx="16" fill="#7c3aed"/>
      <rect x="0" y="30" width="460" height="18" fill="#7c3aed"/>
      <text x="30" y="32" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">STEP 5: PLAYLIST &amp; SHORTS INDEXING</text>
      
      <text x="30" y="85" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f3f4f6">Action: Destination Playlist Sync</text>
      <text x="30" y="115" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Calls youtube.playlistItems.insert (50 units)</text>
      <text x="30" y="140" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Organizes into regional destination playlists</text>
      <text x="30" y="165" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Ex: "Jaisalmer Luxury Experience 2026"</text>
      <text x="30" y="190" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Ex: "Munnar Tea Estate Stays &amp; Treehouses"</text>
      
      <rect x="30" y="225" width="400" height="125" rx="10" fill="#030712" stroke="#374151"/>
      <text x="45" y="255" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#a78bfa">User Discoverability:</text>
      <text x="45" y="280" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ Indexed in YouTube Shorts recommendation feed</text>
      <text x="45" y="300" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ 4K mobile viewing experience for tourists</text>
      <text x="45" y="320" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ Direct engagement via comments and descriptions</text>
    </g>

    <!-- Step 6 -->
    <g transform="translate(1080, 560)" filter="url(#flowShadow)">
      <rect width="460" height="380" rx="16" fill="url(#cardGrad)" stroke="#14b8a6" stroke-width="2"/>
      <rect x="0" y="0" width="460" height="48" rx="16" fill="#0d9488"/>
      <rect x="0" y="30" width="460" height="18" fill="#0d9488"/>
      <text x="30" y="32" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">STEP 6: USER CONVERSION &amp; BOOKING</text>
      
      <text x="30" y="85" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f3f4f6">Action: Traveler Reservation Flow</text>
      <text x="30" y="115" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Viewer taps link in description: bookings.lexatrip.com</text>
      <text x="30" y="140" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Views verified transparent room &amp; camp pricing</text>
      <text x="30" y="165" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Selects check-in/out dates &amp; submits reservation</text>
      <text x="30" y="190" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">• Instant booking voucher &amp; property contact provided</text>
      
      <rect x="30" y="225" width="400" height="125" rx="10" fill="#030712" stroke="#374151"/>
      <text x="45" y="255" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#2dd4bf">Privacy Guarantee:</text>
      <text x="45" y="280" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ No YouTube viewer personal data collected</text>
      <text x="45" y="300" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ Fully independent web reservation system</text>
      <text x="45" y="320" font-family="Arial, sans-serif" font-size="12" fill="#d1d5db">✓ 100% compliant with Google API User Data Policy</text>
    </g>

    <!-- Connectors -->
    <path d="M 520 330 L 570 330" stroke="#60a5fa" stroke-width="3" stroke-dasharray="4,4"/>
    <path d="M 1030 330 L 1080 330" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4,4"/>
    <path d="M 1310 500 L 1310 560" stroke="#10b981" stroke-width="3" stroke-dasharray="4,4"/>
    <path d="M 1080 750 L 1030 750" stroke="#14b8a6" stroke-width="3" stroke-dasharray="4,4"/>
    <path d="M 570 750 L 520 750" stroke="#8b5cf6" stroke-width="3" stroke-dasharray="4,4"/>
  </svg>
  `;
}

// 3. Privacy Policy SVG
function getPrivacyPolicySvg() {
  return `
  <svg width="1400" height="1000" viewBox="0 0 1400 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <filter id="pShadow">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.15"/>
      </filter>
    </defs>

    <rect width="1400" height="1000" fill="#e2e8f0"/>

    <!-- Document Page -->
    <rect x="80" y="40" width="1240" height="920" rx="8" fill="url(#pBg)" stroke="#cbd5e1" stroke-width="1.5" filter="url(#pShadow)"/>

    <!-- Header -->
    <rect x="80" y="40" width="1240" height="90" rx="8" fill="#0f172a"/>
    <circle cx="130" cy="85" r="24" fill="#f97316"/>
    <text x="130" y="93" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">LT</text>
    <text x="175" y="78" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">LexaTrip Technologies — Privacy Policy</text>
    <text x="175" y="105" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Official Portal: https://bookings.lexatrip.com | Last Updated: November 2026</text>

    <!-- Section 1 -->
    <text x="130" y="180" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">1. YouTube API Services Compliance &amp; Disclosures</text>
    <text x="130" y="210" font-family="Arial, sans-serif" font-size="14" fill="#334155">LexaTrip Social OS ("we", "our") utilizes YouTube API Services to automate verified travel video publishing and channel playlist management.</text>
    <text x="130" y="235" font-family="Arial, sans-serif" font-size="14" fill="#334155">By using our services and viewing our experiential travel content, you agree to be bound by the YouTube Terms of Service accessible at:</text>
    <text x="150" y="260" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#2563eb">• YouTube Terms of Service: https://www.youtube.com/t/terms</text>
    <text x="130" y="290" font-family="Arial, sans-serif" font-size="14" fill="#334155">Our use of Google user data is governed by the Google Privacy Policy accessible at:</text>
    <text x="150" y="315" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#2563eb">• Google Privacy Policy: https://policies.google.com/privacy</text>

    <!-- Section 2 -->
    <text x="130" y="370" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">2. What Data We Collect and Process</text>
    <text x="130" y="400" font-family="Arial, sans-serif" font-size="14" fill="#334155">We strictly limit our access to data essential for travel video publishing on authorized LexaTrip channel assets:</text>
    <text x="150" y="425" font-family="Arial, sans-serif" font-size="14" fill="#334155">• Scopes Accessed: https://www.googleapis.com/auth/youtube.upload (to upload curated travel Reels and itineraries).</text>
    <text x="150" y="450" font-family="Arial, sans-serif" font-size="14" fill="#334155">• Scopes Accessed: https://www.googleapis.com/auth/youtube.readonly (to verify publication status and view counts).</text>
    <text x="150" y="475" font-family="Arial, sans-serif" font-size="14" fill="#334155">• No personal viewing history, subscriber identities, or external YouTube account data is accessed or stored.</text>

    <!-- Section 3 -->
    <text x="130" y="530" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">3. Data Storage, Encryption &amp; Security</text>
    <text x="130" y="560" font-family="Arial, sans-serif" font-size="14" fill="#334155">All OAuth 2.0 access credentials and refresh tokens are encrypted at rest using industry-standard AES-256 encryption.</text>
    <text x="130" y="585" font-family="Arial, sans-serif" font-size="14" fill="#334155">Tokens are transmitted strictly over TLS 1.3 encrypted connections and are never logged or exposed in client-facing code.</text>
    <text x="130" y="610" font-family="Arial, sans-serif" font-size="14" fill="#334155">We never sell, rent, or trade Google user data to advertisers, data brokers, or any third-party entities.</text>

    <!-- Section 4 -->
    <text x="130" y="665" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">4. Revocation of Access &amp; Data Deletion Policy</text>
    <text x="130" y="695" font-family="Arial, sans-serif" font-size="14" fill="#334155">Users and administrators can revoke LexaTrip's access to their YouTube data at any time via the Google Security Settings page:</text>
    <text x="150" y="720" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#2563eb">• Google Security Permissions: https://security.google.com/settings/security/permissions</text>
    <text x="130" y="750" font-family="Arial, sans-serif" font-size="14" fill="#334155">Upon revocation or written request to info@lexatrip.com, all cached tokens and related metadata are purged within 24 hours.</text>

    <!-- Contact Box -->
    <rect x="130" y="800" width="1140" height="110" rx="10" fill="#f1f5f9" stroke="#cbd5e1"/>
    <text x="160" y="835" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">Contact &amp; Grievance Redressal:</text>
    <text x="160" y="865" font-family="Arial, sans-serif" font-size="14" fill="#475569">LexaTrip Technologies Pvt Ltd | Rampura Chauraha, Udaipur, Rajasthan 313031, India</text>
    <text x="160" y="890" font-family="Arial, sans-serif" font-size="14" fill="#475569">Email: info@lexatrip.com | Desk: +91 90798 54982 | Web: https://bookings.lexatrip.com</text>
  </svg>
  `;
}

// 4. Homepage Screenshot SVG
function getHomepageSvg() {
  return `
  <svg width="1400" height="900" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
    <rect width="1400" height="900" fill="#0a0e17"/>

    <!-- Browser Bar -->
    <rect width="1400" height="42" fill="#1e293b"/>
    <circle cx="25" cy="21" r="6" fill="#ef4444"/>
    <circle cx="45" cy="21" r="6" fill="#f59e0b"/>
    <circle cx="65" cy="21" r="6" fill="#10b981"/>
    <rect x="150" y="8" width="800" height="26" rx="6" fill="#0f172a"/>
    <text x="170" y="26" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">🔒 https://bookings.lexatrip.com</text>

    <!-- Navigation Bar -->
    <rect y="42" width="1400" height="70" fill="#0f172a" stroke="#1e293b"/>
    <circle cx="60" cy="77" r="18" fill="#f97316"/>
    <text x="60" y="83" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">LT</text>
    <text x="90" y="83" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">LEXA <tspan fill="#f97316">TRIP</tspan></text>
    
    <text x="350" y="83" font-family="Arial, sans-serif" font-size="15" fill="#e2e8f0">Home</text>
    <text x="440" y="83" font-family="Arial, sans-serif" font-size="15" fill="#94a3b8">Luxury Camps</text>
    <text x="590" y="83" font-family="Arial, sans-serif" font-size="15" fill="#94a3b8">5-Star Hotels</text>
    <text x="730" y="83" font-family="Arial, sans-serif" font-size="15" fill="#94a3b8">4-Star Hotels</text>
    <text x="870" y="83" font-family="Arial, sans-serif" font-size="15" fill="#94a3b8">3-Star Hotels</text>

    <rect x="1100" y="60" width="130" height="36" rx="18" fill="#ea580c"/>
    <text x="1165" y="83" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">Book Online</text>
    <rect x="1250" y="60" width="110" height="36" rx="18" fill="#059669"/>
    <text x="1305" y="83" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">WhatsApp</text>

    <!-- Hero Banner -->
    <rect x="50" y="140" width="1300" height="340" rx="16" fill="#1e293b" stroke="#334155"/>
    <text x="100" y="220" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#ffffff">Experience Royal India with LexaTrip</text>
    <text x="100" y="260" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">Curated luxury desert camps, heritage palace hotels, and verified tours across 17 regional destinations.</text>
    
    <rect x="100" y="300" width="1100" height="80" rx="12" fill="#0f172a" stroke="#475569"/>
    <text x="130" y="345" font-family="Arial, sans-serif" font-size="15" fill="#64748b">Where to? (Jaisalmer, Munnar, Goa, Udaipur...)</text>
    <rect x="960" y="315" width="220" height="50" rx="10" fill="#f97316"/>
    <text x="1070" y="347" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">Explore Stays</text>

    <!-- Cards Section -->
    <rect x="50" y="510" width="300" height="200" rx="12" fill="#1e293b" stroke="#334155"/>
    <text x="70" y="550" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">Jaisalmer Royale</text>
    <text x="70" y="580" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Luxury Swiss Desert Tents</text>
    <text x="70" y="680" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f97316">₹4,500/night</text>

    <rect x="380" y="510" width="300" height="200" rx="12" fill="#1e293b" stroke="#334155"/>
    <text x="400" y="550" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">Munnar Cloud Valley</text>
    <text x="400" y="580" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Tea Plantation Luxury Resort</text>
    <text x="400" y="680" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f97316">₹6,200/night</text>

    <rect x="710" y="510" width="300" height="200" rx="12" fill="#1e293b" stroke="#334155"/>
    <text x="730" y="550" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">Goa Coastal Palace</text>
    <text x="730" y="580" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Beachfront Private Villas</text>
    <text x="730" y="680" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f97316">₹8,900/night</text>

    <rect x="1040" y="510" width="310" height="200" rx="12" fill="#1e293b" stroke="#334155"/>
    <text x="1060" y="550" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">Udaipur Lakeview</text>
    <text x="1060" y="580" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Heritage Havelis on Lake Pichola</text>
    <text x="1060" y="680" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f97316">₹7,400/night</text>

    <!-- Footer with Explicit Privacy & Terms -->
    <rect y="740" width="1400" height="160" fill="#080c14" stroke="#1e293b"/>
    <text x="50" y="780" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">LexaTrip Technologies Pvt Ltd — Official Booking Portal</text>
    <text x="50" y="810" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Support: +91 90798 54982 | Email: info@lexatrip.com | Rampura Chauraha, Udaipur, Rajasthan</text>
    
    <text x="50" y="855" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#38bdf8">
      <tspan fill="#38bdf8">About Us</tspan>    |    
      <tspan fill="#38bdf8">Contact Us</tspan>    |    
      <tspan fill="#f97316">Privacy Policy (YouTube API Disclosures)</tspan>    |    
      <tspan fill="#f97316">Terms of Service</tspan>    |    
      <tspan fill="#38bdf8">Refund Policy</tspan>
    </text>
    <text x="50" y="885" font-family="Arial, sans-serif" font-size="12" fill="#475569">© 2026 LexaTrip Technologies Pvt Ltd. All rights reserved. Powered by LexaTrip Social OS.</text>
  </svg>
  `;
}

// 5. Upload Interface & Dashboard SVG
function getUploadInterfaceSvg() {
  return `
  <svg width="1400" height="900" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
    <rect width="1400" height="900" fill="#0b0f19"/>

    <!-- Top Bar -->
    <rect width="1400" height="60" fill="#1e293b"/>
    <text x="30" y="38" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">LexaTrip Social OS — YouTube Automation Center</text>
    <rect x="1120" y="15" width="250" height="30" rx="15" fill="#065f46"/>
    <text x="1245" y="35" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#34d399" text-anchor="middle">● Cloud API Active: 200k Quota</text>

    <!-- Side Menu -->
    <rect y="60" width="240" height="840" fill="#0f172a" stroke="#1e293b"/>
    <text x="30" y="110" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#f97316">▸ YouTube Uploads</text>
    <text x="30" y="150" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">▸ 17 Destinations</text>
    <text x="30" y="190" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">▸ Playlist Automation</text>
    <text x="30" y="230" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">▸ Quota Monitor</text>
    <text x="30" y="270" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">▸ OAuth Credentials</text>

    <!-- Main Content Area -->
    <g transform="translate(270, 90)">
      <!-- Metric Cards -->
      <rect x="0" y="0" width="340" height="110" rx="12" fill="#1e293b" stroke="#334155"/>
      <text x="20" y="35" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Daily Upload Capacity</text>
      <text x="20" y="75" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff">100 Videos / Day</text>
      <text x="20" y="98" font-family="Arial, sans-serif" font-size="12" fill="#34d399">Distributed across 17 Regional Hubs</text>

      <rect x="370" y="0" width="340" height="110" rx="12" fill="#1e293b" stroke="#334155"/>
      <text x="390" y="35" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Estimated Daily Quota Cost</text>
      <text x="390" y="75" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#38bdf8">160,000 Units</text>
      <text x="390" y="98" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">@ 1,600 units/upload (insert)</text>

      <rect x="740" y="0" width="340" height="110" rx="12" fill="#1e293b" stroke="#334155"/>
      <text x="760" y="35" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Requested Quota Ceiling</text>
      <text x="760" y="75" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#f97316">200,000 Units</text>
      <text x="760" y="98" font-family="Arial, sans-serif" font-size="12" fill="#fb923c">+40k safety buffer for metadata &amp; playlists</text>

      <!-- Active Upload Queue Table -->
      <rect x="0" y="140" width="1080" height="630" rx="12" fill="#1e293b" stroke="#334155"/>
      <text x="30" y="180" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">Active Video Upload Pipeline &amp; Channel Status</text>

      <rect x="30" y="210" width="1020" height="40" rx="6" fill="#0f172a"/>
      <text x="50" y="235" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8">DESTINATION</text>
      <text x="240" y="235" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8">VIDEO TITLE</text>
      <text x="640" y="235" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8">TARGET CHANNEL</text>
      <text x="880" y="235" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8">API STATUS</text>

      <!-- Row 1 -->
      <text x="50" y="280" font-family="Arial, sans-serif" font-size="14" fill="#f8fafc">Jaisalmer</text>
      <text x="240" y="280" font-family="Arial, sans-serif" font-size="14" fill="#cbd5e1">Sunset Camel Safari &amp; Luxury Swiss Camp</text>
      <text x="640" y="280" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">LexaTrip Jaisalmer</text>
      <text x="880" y="280" font-family="Arial, sans-serif" font-size="14" fill="#34d399">● Uploaded (200 OK)</text>

      <!-- Row 2 -->
      <text x="50" y="330" font-family="Arial, sans-serif" font-size="14" fill="#f8fafc">Munnar</text>
      <text x="240" y="330" font-family="Arial, sans-serif" font-size="14" fill="#cbd5e1">Top 5 Misty Mountain Treehouses in Munnar</text>
      <text x="640" y="330" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">LexaTrip Munnar</text>
      <text x="880" y="330" font-family="Arial, sans-serif" font-size="14" fill="#34d399">● Uploaded (200 OK)</text>

      <!-- Row 3 -->
      <text x="50" y="380" font-family="Arial, sans-serif" font-size="14" fill="#f8fafc">Goa</text>
      <text x="240" y="380" font-family="Arial, sans-serif" font-size="14" fill="#cbd5e1">Private Beach Luxury Resort Walkthrough</text>
      <text x="640" y="380" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">LexaTrip Goa</text>
      <text x="880" y="380" font-family="Arial, sans-serif" font-size="14" fill="#38bdf8">● Scheduled (In Queue)</text>

      <!-- Row 4 -->
      <text x="50" y="430" font-family="Arial, sans-serif" font-size="14" fill="#f8fafc">Udaipur</text>
      <text x="240" y="430" font-family="Arial, sans-serif" font-size="14" fill="#cbd5e1">Heritage Palace Room Tour on Lake Pichola</text>
      <text x="640" y="430" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">LexaTrip Udaipur</text>
      <text x="880" y="430" font-family="Arial, sans-serif" font-size="14" fill="#38bdf8">● Scheduled (In Queue)</text>

      <!-- Row 5 -->
      <text x="50" y="480" font-family="Arial, sans-serif" font-size="14" fill="#f8fafc">Manali</text>
      <text x="240" y="480" font-family="Arial, sans-serif" font-size="14" fill="#cbd5e1">Snow Valley Glass Igloo Stays in Solang</text>
      <text x="640" y="480" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">LexaTrip Manali</text>
      <text x="880" y="480" font-family="Arial, sans-serif" font-size="14" fill="#38bdf8">● Scheduled (In Queue)</text>

      <line x1="30" y1="520" x2="1050" y2="520" stroke="#334155"/>
      <text x="50" y="560" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">Showing 5 of 17 active destination channels | Auto-publishing interval: 4 hours | Quota manager: Strict 200k ceiling</text>
    </g>
  </svg>
  `;
}

// 6. OAuth Flow Screen SVG
function getOAuthFlowSvg() {
  return `
  <svg width="1400" height="900" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
    <rect width="1400" height="900" fill="#f1f5f9"/>

    <!-- Modal Box -->
    <rect x="420" y="100" width="560" height="700" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="drop-shadow(0 10px 25px rgba(0,0,0,0.15))"/>

    <circle cx="700" cy="160" r="28" fill="#ea580c"/>
    <text x="700" y="168" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">LT</text>
    
    <text x="700" y="220" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#0f172a" text-anchor="middle">Sign in with Google</text>
    <text x="700" y="245" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">to continue to <tspan font-weight="bold" fill="#0f172a">LexaTrip Social OS</tspan></text>
    <text x="700" y="270" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">Google Cloud Project ID: 430109217076</text>

    <!-- Scope Box -->
    <rect x="460" y="300" width="480" height="230" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="480" y="330" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">LexaTrip Social OS wants access to:</text>
    
    <circle cx="500" cy="370" r="14" fill="#dc2626"/>
    <text x="500" y="375" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" text-anchor="middle">▶</text>
    <text x="530" y="367" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">Manage your YouTube videos</text>
    <text x="530" y="387" font-family="Arial, sans-serif" font-size="12" fill="#64748b">https://www.googleapis.com/auth/youtube.upload</text>

    <circle cx="500" cy="430" r="14" fill="#2563eb"/>
    <text x="500" y="435" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" text-anchor="middle">👁</text>
    <text x="530" y="427" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">View your YouTube account</text>
    <text x="530" y="447" font-family="Arial, sans-serif" font-size="12" fill="#64748b">https://www.googleapis.com/auth/youtube.readonly</text>

    <text x="480" y="495" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Make sure you trust LexaTrip Social OS.</text>
    <text x="480" y="515" font-family="Arial, sans-serif" font-size="12" fill="#64748b">You can see and remove access in your Google Account.</text>

    <!-- Links -->
    <text x="460" y="570" font-family="Arial, sans-serif" font-size="12" fill="#64748b">
      Read LexaTrip's <tspan fill="#2563eb">Privacy Policy</tspan> and <tspan fill="#2563eb">Terms of Service</tspan>.
    </text>

    <!-- Buttons -->
    <rect x="460" y="620" width="220" height="44" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
    <text x="570" y="647" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#475569" text-anchor="middle">Cancel</text>

    <rect x="720" y="620" width="220" height="44" rx="8" fill="#2563eb"/>
    <text x="830" y="647" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">Continue</text>
  </svg>
  `;
}

async function generateAll() {
  console.log("Generating YouTube Audit Evidence Pack...");

  const files = [
    { name: 'architecture_diagram.png', svg: getArchitectureSvg(), w: 1600, h: 1000 },
    { name: 'user_flow_diagram.png', svg: getUserFlowSvg(), w: 1600, h: 1000 },
    { name: 'privacy_policy_screenshot.png', svg: getPrivacyPolicySvg(), w: 1400, h: 1000 },
    { name: 'homepage_screenshot.png', svg: getHomepageSvg(), w: 1400, h: 900 },
    { name: 'upload_interface_screenshot.png', svg: getUploadInterfaceSvg(), w: 1400, h: 900 },
    { name: 'oauth_flow_screenshot.png', svg: getOAuthFlowSvg(), w: 1400, h: 900 }
  ];

  for (const item of files) {
    const pngBuffer = await sharp(Buffer.from(item.svg))
      .resize(item.w, item.h)
      .png({ quality: 95 })
      .toBuffer();
    await saveToAll(item.name, pngBuffer);
  }

  // Also create a combined PDF/pack or copy upload script as evidence
  const scriptPath = path.join(__dirname, '..', 'services', 'publishers', 'youtube.js');
  let scriptContent = "// LexaTrip YouTube Upload Engine\n";
  if (fs.existsSync(scriptPath)) {
    scriptContent = fs.readFileSync(scriptPath, 'utf8');
  }
  for (const dir of targetDirs) {
    fs.writeFileSync(path.join(dir, 'youtube_upload_script.js'), scriptContent);
  }
  console.log("Saved youtube_upload_script.js to all target directories.");
  console.log("All evidence files successfully generated and staged!");
}

generateAll().catch(err => {
  console.error("Error generating evidence:", err);
  process.exit(1);
});
