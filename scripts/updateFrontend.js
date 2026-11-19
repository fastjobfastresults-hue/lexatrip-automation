const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'public', 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1. Add active/inactive nav tab styles if not present
const styleAddition = `
    .active-nav-tab {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.1) 100%) !important;
      border: 1px solid rgba(212, 175, 55, 0.7) !important;
      color: #FFF !important;
      box-shadow: 0 0 16px rgba(212, 175, 55, 0.25) !important;
    }
    .inactive-nav-tab {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #9CA3AF;
    }
    .inactive-nav-tab:hover {
      background: rgba(255, 255, 255, 0.07);
      color: #FFF;
    }
    .role-btn.active {
      background: #D4AF37 !important;
      color: #000 !important;
      font-weight: 800 !important;
    }
`;

if (!indexHtml.includes('.active-nav-tab')) {
  indexHtml = indexHtml.replace('</style>', `${styleAddition}\n  </style>`);
}

// 2. Locate header and replace with clean Top Header + 3-Tier Role Switcher + Primary Nav Dock
const oldHeaderRegex = /<header class="sticky top-0[\s\S]*?<\/header>[\s\S]*?<!-- DESTINATIONS BAR -->[\s\S]*?<\/section>/;

const newHeaderNav = `<!-- TOP HEADER -->
  <header class="sticky top-0 z-50 border-b border-white/10 bg-[#06070B]/90 backdrop-blur-2xl px-6 py-3">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
      
      <!-- Brand Logo -->
      <div class="flex items-center space-x-3.5">
        <div onclick="triggerLogoUpload()" title="Click to upload custom brand logo" class="cursor-pointer group relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-apple-gold to-yellow-200 flex items-center justify-center text-apple-bg font-black text-xl shadow-lg shadow-amber-500/20 overflow-hidden border border-white/20">
          <img id="brand-logo-img" class="w-full h-full object-cover hidden" alt="Brand Logo" />
          <i id="brand-logo-icon" class="fa-solid fa-compass group-hover:scale-110 transition-transform"></i>
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px]">
            <i class="fa-solid fa-camera"></i>
          </div>
        </div>
        <input type="file" id="brand-logo-file" accept="image/*" class="hidden" onchange="uploadBrandLogo(event)" />
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-base font-extrabold tracking-tight text-white cursor-pointer hover:text-apple-gold transition" onclick="switchView('dashboard')">LEXA TRIP</h1>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-apple-gold/15 text-apple-gold border border-apple-gold/30 font-bold uppercase tracking-wider">Social OS</span>
          </div>
          <p class="text-[11px] text-gray-400">100+ Destinations ➔ 24/7 Multi-Channel Autopilot</p>
        </div>
      </div>

      <!-- THREE-TIER ROLE SELECTOR (Admin / Vendor / Guest) -->
      <div class="flex items-center bg-white/[0.04] border border-white/10 rounded-full p-1 text-xs">
        <button onclick="switchRole('admin')" id="role-btn-admin" class="role-btn active px-3 py-1 rounded-full transition flex items-center space-x-1.5 font-bold">
          <i class="fa-solid fa-crown text-xs"></i>
          <span>👑 सुपर एडमिन</span>
        </button>
        <button onclick="switchRole('vendor')" id="role-btn-vendor" class="role-btn px-3 py-1 rounded-full text-gray-400 hover:text-white transition flex items-center space-x-1.5">
          <i class="fa-solid fa-handshake text-xs"></i>
          <span>🤝 वेंडर पैनल</span>
        </button>
        <button onclick="switchRole('guest')" id="role-btn-guest" class="role-btn px-3 py-1 rounded-full text-gray-400 hover:text-white transition flex items-center space-x-1.5">
          <i class="fa-solid fa-globe text-xs"></i>
          <span>🌐 गेस्ट व्यू</span>
        </button>
      </div>

      <!-- Right Controls: Cloud Status & Telegram Bot -->
      <div class="flex items-center space-x-2.5 text-xs">
        <a href="https://t.me/lexatrip_auto_bot" target="_blank" class="px-3.5 py-1.5 rounded-full bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] border border-[#229ED9]/30 font-bold transition flex items-center space-x-1.5 shadow-sm">
          <i class="fa-brands fa-telegram"></i>
          <span>@lexatrip_auto_bot</span>
        </a>
        <div id="user-auth-pill" onclick="openAdminProfileModal()" class="cursor-pointer flex items-center space-x-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3 py-1.5 rounded-full transition group" title="Click to edit Administrator Profile">
          <img id="user-auth-avatar" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80" class="w-5 h-5 rounded-full object-cover border border-amber-400/40" />
          <span class="text-gray-200 font-semibold text-xs hidden md:inline" id="user-auth-name">Lexa Admin</span>
        </div>
      </div>

    </div>
  </header>

  <!-- PRIMARY NAVIGATION DOCK (APPLE VISION STYLE FLOATING TABS) -->
  <nav class="border-b border-white/10 bg-[#080910]/95 backdrop-blur-md px-6 py-2.5 sticky top-[57px] z-40">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto">
      <div class="flex items-center space-x-2">
        <button onclick="switchView('dashboard')" id="nav-tab-dashboard" class="nav-tab active-nav-tab px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2">
          <i class="fa-solid fa-chart-pie text-apple-gold"></i>
          <span>📊 लाइव डैशबोर्ड</span>
        </button>
        <button onclick="switchView('destinations')" id="nav-tab-destinations" class="nav-tab inactive-nav-tab px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2">
          <i class="fa-solid fa-map-location-dot"></i>
          <span>🗺️ डेस्टिनेशंस हब (100+)</span>
        </button>
        <button onclick="switchView('studio')" id="nav-tab-studio" class="nav-tab inactive-nav-tab px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span>✨ 5-स्टेप स्टूडियो</span>
        </button>
        <button onclick="switchView('crm')" id="nav-tab-crm" class="nav-tab inactive-nav-tab px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2">
          <i class="fa-solid fa-comments"></i>
          <span>💬 सोशल CRM & लीड्स</span>
        </button>
        <button onclick="switchView('vault')" id="nav-tab-vault" class="nav-tab inactive-nav-tab px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 text-rose-300">
          <i class="fa-solid fa-lock"></i>
          <span>🔐 सीक्रेट API वॉल्ट</span>
        </button>
      </div>

      <div class="flex items-center space-x-2 shrink-0">
        <span class="text-[11px] text-gray-400 hidden lg:inline">सक्रिय:</span>
        <select id="header-dest-selector" onchange="onHeaderDestinationChange(this.value)" class="bg-[#121420] text-amber-300 text-xs font-bold border border-amber-500/30 rounded-xl px-3 py-1.5 focus:outline-none">
          <!-- Populated by JS -->
        </select>
        <button onclick="publishAllQueueNow()" class="gold-btn px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md">
          <i class="fa-solid fa-bolt"></i>
          <span>1-Click पब्लिश</span>
        </button>
      </div>
    </div>
  </nav>`;

if (oldHeaderRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(oldHeaderRegex, newHeaderNav);
  console.log('Replaced Header & Navigation successfully.');
} else {
  console.log('Could not match old header regex, inspecting...');
}

fs.writeFileSync(indexPath, indexHtml, 'utf8');
