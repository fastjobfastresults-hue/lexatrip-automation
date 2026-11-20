const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Add Live Work button in header
const buttonHtml = `        <!-- LIVE WORK TOGGLE BUTTON -->
        <button onclick="toggleLiveWorkDrawer()" id="btn-toggle-live-work" class="px-3.5 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <i class="fa-solid fa-bolt"></i>
          <span>⚡ लाइव वर्क (Live Work)</span>
        </button>
`;

if (!html.includes('id="btn-toggle-live-work"')) {
  html = html.replace(
    '<!-- Right Controls: Cloud Status & Telegram Bot -->\n      <div class="flex items-center space-x-2.5 text-xs">',
    `<!-- Right Controls: Cloud Status & Telegram Bot -->\n      <div class="flex items-center space-x-2.5 text-xs">\n${buttonHtml}`
  );
}

// 2. Add Live Work Drawer before </body>
const drawerHtml = `
  <!-- =================================================================== -->
  <!-- ⚡ LIVE WORK & BACKGROUND TASKS DRAWER / MODAL                     -->
  <!-- =================================================================== -->
  <div id="live-work-drawer" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md hidden flex items-center justify-center p-4">
    <div class="glass-card-elevated rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-amber-500/30 shadow-2xl relative animate-fade-in">
      
      <!-- Drawer Header -->
      <div class="flex items-center justify-between pb-3 border-b border-white/10">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg shadow-md">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div>
            <h3 class="text-base font-extrabold text-white flex items-center space-x-2">
              <span>बैकएंड लाइव वर्क व टास्क मॉनिटर</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">24/7 Autopilot</span>
            </h3>
            <p class="text-xs text-gray-400">रील जनरेशन, AI इंजन और ऑटो-स्टोरेज क्लीनअप की रियल-टाइम स्थिति</p>
          </div>
        </div>
        <button onclick="toggleLiveWorkDrawer()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition font-bold text-sm cursor-pointer">
          ✕
        </button>
      </div>

      <!-- Live Tasks Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        
        <!-- 1. Video Engine FFmpeg -->
        <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-solid fa-clapperboard text-amber-400"></i>
              <span>Ultra HD 9:16 Video Engine</span>
            </span>
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">Ready</span>
          </div>
          <p class="text-[11px] text-gray-400">FFmpeg 60fps Vertical Engine. 1 फ़ोटो ➔ 9:16 मोशन रील, 5 फ़ोटो ➔ 6 रील्स!</p>
          <div class="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div id="live-work-video-progress" class="bg-gradient-to-r from-amber-500 to-yellow-300 h-1.5 rounded-full" style="width: 100%;"></div>
          </div>
        </div>

        <!-- 2. AI SEO & Caption Generator -->
        <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-solid fa-brain text-purple-400"></i>
              <span>Google Gemini AI Engine</span>
            </span>
            <span class="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-bold text-[10px]">Active</span>
          </div>
          <p class="text-[11px] text-gray-400">ऑटोमैटिक 3 मास्टर लिंक्स, ट्रैवल हैशटैग्स और हाई-कन्वर्जन सीटीए जनरेशन।</p>
          <span class="text-[10px] text-gray-500 font-mono">Model: Gemini Flash Latest · Zero Latency</span>
        </div>

        <!-- 3. Scheduler & Human Anti-Spam Dispatch -->
        <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-solid fa-clock text-sky-400"></i>
              <span>Anti-Spam Human Dispatcher</span>
            </span>
            <span class="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 font-bold text-[10px]">60–90m Safe</span>
          </div>
          <p class="text-[11px] text-gray-400">सोशल मीडिया पॉलिसी सुरक्षा हेतु 1 से 1.5 घंटे का रैंडम मानवीय अंतराल।</p>
          <div class="text-[10px] text-gray-400" id="live-work-next-task">आगामी टास्क: 24/7 ऑटोपायलट कतार सक्रिय।</div>
        </div>

        <!-- 4. Storage Auto-Cleanup & 0MB Load -->
        <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-solid fa-hard-drive text-emerald-400"></i>
              <span>ऑटो-क्लीनअप (0MB Server Load)</span>
            </span>
            <button onclick="triggerStorageCleanupNow()" class="px-2 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] transition cursor-pointer">
              🧹 खाली करें
            </button>
          </div>
          <p class="text-[11px] text-gray-400">पब्लिश होते ही फ़ोटो/वीडियो ऑटो-डिलीट हो जाती हैं। सोशल मीडिया अपने सर्वर पर हमेशा होस्ट रखता है।</p>
          <div class="text-[10px] text-emerald-400 font-mono" id="live-work-storage-info">लोकल डिस्क: 100% स्वच्छ व सुरक्षित (0MB भार)</div>
        </div>

      </div>

      <!-- Drawer Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
        <span class="text-gray-400 text-[11px]">बैकएंड बैकग्राउंड में स्वतंत्र रूप से काम करता रहेगा।</span>
        <button onclick="toggleLiveWorkDrawer()" class="gold-btn px-5 py-2 rounded-full font-bold text-xs cursor-pointer">
          ✕ बंद करें (Close)
        </button>
      </div>

    </div>
  </div>
`;

if (!html.includes('id="live-work-drawer"')) {
  html = html.replace('</body>', `${drawerHtml}\n</body>`);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Added Live Work button and drawer to public/index.html successfully!');
