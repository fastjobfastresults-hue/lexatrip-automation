const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Find <main ...> ... </main>
const mainStartIdx = html.indexOf('<main');
const mainEndIdx = html.indexOf('</main>');

if (mainStartIdx === -1 || mainEndIdx === -1) {
  console.error('Could not locate <main> tag in index.html');
  process.exit(1);
}

// Extract components from current main
// 1. Mini Tracker HUD
const hudStart = html.indexOf('<section id="mini-live-tracker-hud"');
const hudEnd = html.indexOf('</section>', hudStart) + 10;
const hudHtml = html.substring(hudStart, hudEnd);

// 2. Destination Command Center
const destCommandStart = html.indexOf('<!-- 1. DESTINATION STATUS & INTERACTIVE CLICKABLE SOCIAL CHANNELS -->');
const destCommandEnd = html.indexOf('<!-- 2. FIVE DEDICATED IMAGE + SEO UPLOAD CARDS -->');
const destCommandHtml = html.substring(destCommandStart, destCommandEnd);

// 3. Five Posts & AI SEO
const fivePostsStart = destCommandEnd;
const fivePostsEnd = html.indexOf('<!-- 3. REVIEW & MEDIA ASSETS PREVIEW PANEL -->');
const fivePostsHtml = html.substring(fivePostsStart, fivePostsEnd);

// 4. Batch Preview Panel
const previewStart = fivePostsEnd;
const previewEnd = html.indexOf('<!-- 4. FUTURISTIC SCHEDULING TASK MANAGER (QUEUE & TIMELINE) -->');
const previewHtml = html.substring(previewStart, previewEnd);

// 5. Scheduling Task Manager
const taskManagerStart = previewEnd;
const taskManagerEnd = html.indexOf('</main>');
const taskManagerHtml = html.substring(taskManagerStart, taskManagerEnd);

// Construct the 5 modular views:
const newMainContent = `  <main class="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">

    <!-- =================================================================== -->
    <!-- 📊 VIEW 1: EXECUTIVE LIVE DASHBOARD (DEFAULT VIEW ON MAIN SCREEN)   -->
    <!-- =================================================================== -->
    <div id="view-dashboard" class="view-panel space-y-6">

      <!-- Real-Time Radar & Metrics HUD -->
      ${hudHtml}

      <!-- VERIFIED LIVE DESTINATION DIRECT LINKS BAR -->
      <div class="glass-card rounded-2xl p-4 border border-white/10 bg-white/[0.02]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/5">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">
              🔗 लाइव डेस्टिनेशन वेरिफिकेशन लिंक्स (क्लिक करके सोशल मीडिया पर तुरंत देखें)
            </h4>
          </div>
          <span class="text-[11px] text-gray-400">डेस्टिनेशन: <b class="text-amber-300" id="dash-links-dest-name">लेक्सा ट्रिप जैसलमेर</b></span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          <a href="https://www.facebook.com/1385624654624388" target="_blank" class="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center space-x-2 transition font-bold shadow-sm">
            <i class="fa-brands fa-facebook"></i>
            <span>Facebook ↗</span>
          </a>
          <a href="https://www.instagram.com/lexatripjaisalmer/" target="_blank" class="p-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center justify-center space-x-2 transition font-bold shadow-sm">
            <i class="fa-brands fa-instagram"></i>
            <span>Instagram ↗</span>
          </a>
          <a href="https://t.me/lexatripjaisalmer" target="_blank" class="p-2.5 rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] border border-[#229ED9]/30 flex items-center justify-center space-x-2 transition font-bold shadow-sm">
            <i class="fa-brands fa-telegram"></i>
            <span>Telegram ↗</span>
          </a>
          <a href="https://www.pinterest.com/lexatripjaisalmer/" target="_blank" class="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 flex items-center justify-center space-x-2 transition font-bold shadow-sm">
            <i class="fa-brands fa-pinterest"></i>
            <span>Pinterest ↗</span>
          </a>
          <a href="https://www.linkedin.com/company/lexatripjaisalmer" target="_blank" class="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center space-x-2 transition font-bold shadow-sm">
            <i class="fa-brands fa-linkedin"></i>
            <span>LinkedIn ↗</span>
          </a>
          <a href="https://bookings.lexatrip.com/" target="_blank" class="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center space-x-2 transition font-bold shadow-sm">
            <i class="fa-solid fa-hotel"></i>
            <span>Bookings ↗</span>
          </a>
          <a href="https://wa.me/919079854982" target="_blank" class="p-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 flex items-center justify-center space-x-2 transition font-bold shadow-sm">
            <i class="fa-brands fa-whatsapp"></i>
            <span>WhatsApp ↗</span>
          </a>
        </div>
      </div>

      <!-- Quick Executive Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div onclick="switchView('studio')" class="apple-hero-card cursor-pointer rounded-2xl p-5 hover:border-amber-400/50 transition group">
          <div class="flex items-center space-x-3 mb-2">
            <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-lg">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-white group-hover:text-amber-300 transition">5-पोस्ट + 6-रील स्टूडियो</h4>
              <p class="text-[11px] text-gray-400">Step-by-Step AI Content Creation</p>
            </div>
          </div>
          <p class="text-xs text-gray-300">5 फ़ोटो अपलोड करें, AI से SEO बनाएं और 6 HD रील्स ऑटो-जनरेट करें।</p>
          <div class="mt-3 text-xs text-apple-gold font-bold flex items-center space-x-1">
            <span>स्टूडियो खोलें</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </div>
        </div>

        <div onclick="switchView('destinations')" class="apple-hero-card cursor-pointer rounded-2xl p-5 hover:border-blue-400/50 transition group">
          <div class="flex items-center space-x-3 mb-2">
            <div class="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-lg">
              <i class="fa-solid fa-map-location-dot"></i>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-white group-hover:text-blue-300 transition">डेस्टिनेशंस डायरेक्टरी (100+)</h4>
              <p class="text-[11px] text-gray-400">Multi-Destination Scalable Hub</p>
            </div>
          </div>
          <p class="text-xs text-gray-300">जैसलमेर, मनाली, ऋषिकेश, गोवा आदि 100+ शहरों का अलग-अलग सोशल सेटअप।</p>
          <div class="mt-3 text-xs text-blue-400 font-bold flex items-center space-x-1">
            <span>डेस्टिनेशंस एक्सप्लोर करें</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </div>
        </div>

        <div onclick="switchView('crm')" class="apple-hero-card cursor-pointer rounded-2xl p-5 hover:border-emerald-400/50 transition group">
          <div class="flex items-center space-x-3 mb-2">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg">
              <i class="fa-solid fa-comments"></i>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-white group-hover:text-emerald-300 transition">सोशल CRM & लीड्स हब</h4>
              <p class="text-[11px] text-gray-400">Direct WhatsApp & Auto-DM</p>
            </div>
          </div>
          <p class="text-xs text-gray-300">कमेंट्स, ग्राहक पूछताछ (+91 90798 54982) और ऑटो-डीएम का केंद्रीकृत हब।</p>
          <div class="mt-3 text-xs text-emerald-400 font-bold flex items-center space-x-1">
            <span>CRM कंसोल खोलें</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </div>
        </div>
      </div>

      <!-- Scheduling Task Manager & Queue -->
      ${taskManagerHtml}

    </div>

    <!-- =================================================================== -->
    <!-- 🗺️ VIEW 2: DESTINATIONS HUB (100+ DESTINATIONS DIRECTORY)            -->
    <!-- =================================================================== -->
    <div id="view-destinations" class="view-panel hidden space-y-6">
      
      <!-- Top Directory Header & Search -->
      <div class="glass-card-elevated rounded-3xl p-6 space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-lg font-extrabold text-white flex items-center space-x-2">
                <i class="fa-solid fa-map-location-dot text-apple-gold"></i>
                <span>Lexa Trip Destination Directory (100+ Destinations Ready)</span>
              </h3>
              <span class="px-2.5 py-0.5 rounded-full bg-apple-gold/15 text-apple-gold border border-apple-gold/30 text-[10px] font-bold">100+ Ready</span>
            </div>
            <p class="text-xs text-gray-400 mt-1">
              किसी भी डेस्टिनेशन पर क्लिक करने पर ही उसकी पूरी अंदरूनी सेटिंग्स और चैनल्स खुलेंगे।
            </p>
          </div>
          <button onclick="openNewDestinationModal()" class="gold-btn px-4 py-2 rounded-full font-bold text-xs flex items-center space-x-2 shadow-lg shrink-0">
            <i class="fa-solid fa-plus text-[10px]"></i>
            <span>+ नई डेस्टिनेशन जोड़ें</span>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="flex items-center space-x-3 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-2.5">
          <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
          <input type="text" id="dest-search-input" oninput="filterDestinationsDirectory(this.value)" placeholder="100+ डेस्टिनेशंस में खोजें... (जैसे: जैसलमेर, मनाली, ऋषिकेश, गोवा, उदयपुर)..." class="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full" />
        </div>
      </div>

      <!-- 100+ Destinations Cards Grid -->
      <div id="destinations-directory-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Rendered dynamically by JS -->
      </div>

      <!-- DESTINATION DETAIL WORKSPACE (COLLAPSED BY DEFAULT - OPENS ONLY ON CLICK) -->
      <div id="destination-detail-workspace" class="hidden space-y-6">
        <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div class="flex items-center space-x-2 text-xs text-amber-300 font-bold">
            <i class="fa-solid fa-location-dot"></i>
            <span>डेस्टिनेशन डिटेल व्यू सक्रिय: <span id="detail-dest-title" class="text-white">लेक्सा ट्रिप जैसलमेर</span></span>
          </div>
          <button onclick="closeDestinationDetail()" class="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center space-x-1">
            <i class="fa-solid fa-arrow-left text-[10px]"></i>
            <span>← सभी डेस्टिनेशंस पर वापस जाएं</span>
          </button>
        </div>

        ${destCommandHtml}
      </div>

    </div>

    <!-- =================================================================== -->
    <!-- ✨ VIEW 3: 5-POST + 6-REEL STUDIO (STEP 1 TO 5 GUIDED WIZARD)       -->
    <!-- =================================================================== -->
    <div id="view-studio" class="view-panel hidden space-y-6">

      <!-- Step-by-Step Progress Header -->
      <div class="glass-card rounded-2xl p-4 border border-apple-gold/30 bg-apple-gold/[0.02]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-apple-gold/20">
          <div>
            <h3 class="text-base font-extrabold text-white flex items-center space-x-2">
              <i class="fa-solid fa-wand-magic-sparkles text-apple-gold"></i>
              <span>✨ 5-पोस्ट + 6-रील स्टूडियो (Step-by-Step Workflow)</span>
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">5 पोस्ट्स (4:5) + 1 कंबाइंड कर्सल + 5 सिंगल रील्स (9:16) + 1 कंबाइंड 12s रील = 6 पोस्ट्स + 6 रील्स!</p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="switchView('dashboard')" class="px-3 py-1.5 rounded-full bg-white/[0.06] text-gray-300 hover:text-white text-xs font-bold transition">
              ← डैशबोर्ड
            </button>
          </div>
        </div>

        <!-- 5 Steps Flow -->
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-2 mt-3 text-xs">
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-apple-gold/30 flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-apple-gold text-black flex items-center justify-center font-bold text-xs shrink-0">1</span>
            <span class="text-white font-bold">डेस्टिनेशन चयन</span>
          </div>
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
            <span class="text-gray-300 font-semibold">5 फ़ोटो इनपुट</span>
          </div>
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
            <span class="text-gray-300 font-semibold">AI SEO & लिंक्स</span>
          </div>
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0">4</span>
            <span class="text-gray-300 font-semibold">6 रील्स प्रीव्यू</span>
          </div>
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0">5</span>
            <span class="text-gray-300 font-semibold">1-Click शेड्यूल</span>
          </div>
        </div>
      </div>

      <!-- Five Posts Upload & AI SEO -->
      ${fivePostsHtml}

      <!-- Review & Media Assets Preview Panel -->
      ${previewHtml}

    </div>

    <!-- =================================================================== -->
    <!-- 💬 VIEW 4: SOCIAL CRM & LEADS HUB                                   -->
    <!-- =================================================================== -->
    <div id="view-crm" class="view-panel hidden space-y-6">
      
      <!-- Top CRM Header -->
      <div class="glass-card-elevated rounded-3xl p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div class="flex items-center space-x-3.5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-black text-xl shadow-lg shadow-emerald-500/20">
              <i class="fa-solid fa-comments"></i>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-lg font-extrabold text-white">Social CRM & Customer Leads Hub</h3>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">24/7 Live</span>
              </div>
              <p class="text-xs text-gray-400 mt-0.5">Master Token · Auto-Reply to Inquiries · WhatsApp Bookings: +91 90798 54982</p>
            </div>
          </div>
          <button onclick="testCRMLeadSimulation()" class="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm">
            <i class="fa-solid fa-flask text-apple-gold"></i>
            <span>🧪 Simulate Customer Lead</span>
          </button>
        </div>

        <!-- 4 Wide Tabs for CRM -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 text-xs font-bold">
          <button onclick="switchCRMTab('reports')" id="crm-tab-btn-reports" class="p-3 rounded-xl bg-apple-gold text-black transition flex items-center justify-center space-x-2 shadow-sm">
            <i class="fa-solid fa-chart-line"></i>
            <span>📊 लाइव डिस्पैच रिपोर्ट & लिंक्स</span>
          </button>
          <button onclick="switchCRMTab('queue')" id="crm-tab-btn-queue" class="p-3 rounded-xl bg-white/[0.04] text-gray-300 hover:text-white transition flex items-center justify-center space-x-2">
            <i class="fa-regular fa-calendar-check"></i>
            <span>⏳ शेड्यूल्ड कतार (Queue)</span>
          </button>
          <button onclick="switchCRMTab('leads')" id="crm-tab-btn-leads" class="p-3 rounded-xl bg-white/[0.04] text-gray-300 hover:text-white transition flex items-center justify-center space-x-2">
            <i class="fa-solid fa-user-group"></i>
            <span>💬 कस्टमर लीड्स & ऑटो-डीएम</span>
          </button>
          <button onclick="switchCRMTab('accounts')" id="crm-tab-btn-accounts" class="p-3 rounded-xl bg-white/[0.04] text-gray-300 hover:text-white transition flex items-center justify-center space-x-2">
            <i class="fa-solid fa-link"></i>
            <span>⚙️ कनेक्टेड सोशल एकाउंट्स</span>
          </button>
        </div>

        <!-- Tab 1: Live Reports & Links -->
        <div id="crm-tab-pane-reports" class="space-y-4">
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span>हाल ही में डिस्पैच की गई पोस्ट्स के लाइव लिंक्स:</span>
              <button onclick="loadCRMData()" class="text-apple-gold hover:underline"><i class="fa-solid fa-arrows-rotate"></i> रीफ्रेश</button>
            </h4>
            <div id="crm-recent-dispatches-list" class="space-y-2 text-xs">
              <!-- Rendered by JS -->
            </div>
          </div>
        </div>

        <!-- Tab 2: Scheduled Queue -->
        <div id="crm-tab-pane-queue" class="space-y-4 hidden">
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 class="text-xs font-bold text-gray-300 uppercase tracking-wider">
              आगामी 7 शेड्यूल्ड पोस्ट्स व लाइव काउंटडाउन (60–90 मिनट एंटी-स्पैम अंतराल):
            </h4>
            <div id="crm-scheduled-queue-list" class="space-y-2 text-xs">
              <!-- Rendered by JS -->
            </div>
          </div>
        </div>

        <!-- Tab 3: Customer Leads & DMs -->
        <div id="crm-tab-pane-leads" class="space-y-4 hidden">
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-gray-300 uppercase tracking-wider">
                रियल-टाइम कस्टमर इन्क्वायरीज़ & ऑटो-रिप्लाई:
              </h4>
              <a href="https://wa.me/919079854982" target="_blank" class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center space-x-1">
                <i class="fa-brands fa-whatsapp"></i>
                <span>Direct WhatsApp: +91 90798 54982</span>
              </a>
            </div>
            <div id="crm-customer-leads-list" class="space-y-2 text-xs">
              <!-- Rendered by JS -->
            </div>
          </div>
        </div>

        <!-- Tab 4: Connected Accounts -->
        <div id="crm-tab-pane-accounts" class="space-y-4 hidden">
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 class="text-xs font-bold text-gray-300 uppercase tracking-wider">
              मास्टर मेटा टोकन & ऑटो-डिटेक्टेड फेसबुक व इंस्टाग्राम पेजेस:
            </h4>
            <div class="space-y-2">
              <label class="block text-[11px] text-gray-400">Master User Token (EAAW...)</label>
              <input type="password" id="crm-view-master-token" readonly value="••••••••••••••••••••••••••••••••" class="w-full bg-[#0a0b12] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-400 font-mono" />
            </div>
            <div class="pt-2">
              <button onclick="detectAllPagesFromToken()" class="gold-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2">
                <i class="fa-solid fa-satellite-dish"></i>
                <span>⚡ 1-Click Detect All Pages</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- =================================================================== -->
    <!-- 🔐 VIEW 5: SECRET API VAULT (ADMIN PIN PROTECTED)                    -->
    <!-- =================================================================== -->
    <div id="view-vault" class="view-panel hidden space-y-6">

      <!-- PIN LOCKED STATE -->
      <div id="vault-locked-state" class="glass-card-elevated rounded-3xl p-8 max-w-lg mx-auto text-center space-y-5 my-10">
        <div class="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl mx-auto shadow-xl shadow-rose-500/10">
          <i class="fa-solid fa-lock"></i>
        </div>
        <div>
          <h3 class="text-lg font-extrabold text-white">🔐 सीक्रेट मास्टर API वॉल्ट लॉक है</h3>
          <p class="text-xs text-gray-400 mt-1">
            सुरक्षा व प्राइवेसी हेतु सभी मास्टर टोकन्स और API कीज़ सुरक्षित रूप से लॉक्ड हैं। केवल अधिकृत एडमिन ही इसे खोल सकते हैं।
          </p>
        </div>
        <div class="space-y-3">
          <label class="block text-xs font-bold text-gray-300">4-अंकों का एडमिन पिन दर्ज करें (Default: 1234):</label>
          <input type="password" id="vault-pin-input" maxlength="8" placeholder="••••" class="text-center text-lg tracking-[0.5em] font-mono w-48 bg-[#0a0b14] border border-apple-gold/50 rounded-2xl p-2.5 text-white focus:outline-none focus:border-apple-gold transition mx-auto" />
        </div>
        <div>
          <button onclick="unlockVaultWithPin()" class="gold-btn px-6 py-2.5 rounded-full font-bold text-xs flex items-center space-x-2 mx-auto shadow-lg">
            <i class="fa-solid fa-key"></i>
            <span>वॉल्ट अनलॉक करें (Unlock Vault)</span>
          </button>
        </div>
      </div>

      <!-- UNLOCKED STATE (REVEALED ONLY AFTER CORRECT PIN) -->
      <div id="vault-unlocked-state" class="glass-card-elevated rounded-3xl p-6 space-y-6 hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div class="flex items-center space-x-3">
            <div class="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xl">
              <i class="fa-solid fa-lock-open"></i>
            </div>
            <div>
              <h3 class="text-base font-extrabold text-white">🔐 मास्टर API वॉल्ट (अनलॉक मोड)</h3>
              <p class="text-xs text-gray-400">सभी सोशल नेटवर्क्स के मास्टर टोकन्स और कीज़ को यहाँ सुरक्षित रूप से अपडेट करें।</p>
            </div>
          </div>
          <button onclick="lockVault()" class="px-4 py-2 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center space-x-1.5">
            <i class="fa-solid fa-lock"></i>
            <span>तुरंत लॉक करें (Lock Vault Now)</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <!-- Meta Token -->
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-brands fa-facebook text-blue-400"></i>
              <span>Meta Master User Token</span>
            </span>
            <input type="text" id="vault-meta-token" class="w-full bg-[#080910] border border-white/10 rounded-xl p-2.5 text-xs text-gray-200 font-mono" />
            <p class="text-[10px] text-gray-400">Never-expiring Master User Token for Facebook & Instagram.</p>
          </div>

          <!-- Telegram Bot Token -->
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-brands fa-telegram text-[#229ED9]"></i>
              <span>Telegram Bot Token</span>
            </span>
            <input type="text" id="vault-tg-token" class="w-full bg-[#080910] border border-white/10 rounded-xl p-2.5 text-xs text-gray-200 font-mono" />
            <p class="text-[10px] text-gray-400">Bot token for @lexatrip_auto_bot.</p>
          </div>

          <!-- Pinterest Access Token -->
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-brands fa-pinterest text-red-400"></i>
              <span>Pinterest Access Token</span>
            </span>
            <input type="text" id="vault-pinterest-token" class="w-full bg-[#080910] border border-white/10 rounded-xl p-2.5 text-xs text-gray-200 font-mono" />
            <p class="text-[10px] text-gray-400">Pinterest Developer v5 Bearer token.</p>
          </div>

          <!-- LinkedIn Access Token -->
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-brands fa-linkedin text-sky-400"></i>
              <span>LinkedIn OAuth Token</span>
            </span>
            <input type="text" id="vault-linkedin-token" class="w-full bg-[#080910] border border-white/10 rounded-xl p-2.5 text-xs text-gray-200 font-mono" />
            <p class="text-[10px] text-gray-400">LinkedIn v2 token for posts & organization updates.</p>
          </div>

          <!-- Google Blogger API / OAuth -->
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-brands fa-blogger text-amber-400"></i>
              <span>Google Blogger OAuth Token</span>
            </span>
            <input type="text" id="vault-blogger-token" class="w-full bg-[#080910] border border-white/10 rounded-xl p-2.5 text-xs text-gray-200 font-mono" />
            <p class="text-[10px] text-gray-400">OAuth2 Token with scope https://www.googleapis.com/auth/blogger.</p>
          </div>

          <!-- Gemini AI API Key -->
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-solid fa-sparkles text-purple-400"></i>
              <span>Google Gemini AI API Key</span>
            </span>
            <input type="text" id="vault-gemini-key" class="w-full bg-[#080910] border border-white/10 rounded-xl p-2.5 text-xs text-gray-200 font-mono" />
            <p class="text-[10px] text-gray-400">Used for auto-generating SEO titles, captions, and travel itineraries.</p>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
          <button onclick="saveVaultKeys()" class="gold-btn px-6 py-2.5 rounded-full font-bold text-xs flex items-center space-x-2 shadow-lg">
            <i class="fa-solid fa-floppy-disk"></i>
            <span>💾 सभी API कीज़ सुरक्षित सेव करें</span>
          </button>
        </div>
      </div>

    </div>

  </main>`;

const updatedHtml = html.substring(0, mainStartIdx) + newMainContent + html.substring(mainEndIdx + 7);
fs.writeFileSync(indexPath, updatedHtml, 'utf8');
console.log('Modularized <main> into 5 distinct views successfully!');
