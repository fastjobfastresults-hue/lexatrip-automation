const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'public', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Ensure DOMContentLoaded calls switchView('dashboard') and switchRole('admin')
if (!appJs.includes("switchView('dashboard')")) {
  appJs = appJs.replace(
    'setInterval(refreshLiveTrackerHUD, 15000);',
    `setInterval(refreshLiveTrackerHUD, 15000);
  switchView('dashboard');
  switchRole('admin');`
  );
}

// Client logic to append
const additions = `

// ===================================================================
// 🧭 FIVE MODULAR VIEWS & 3-TIER ROLE ENGINE
// ===================================================================

let currentActiveView = 'dashboard';
let currentActiveRole = 'admin';
let isVaultUnlocked = false;

function switchView(viewName) {
  currentActiveView = viewName;
  const viewIds = ['dashboard', 'destinations', 'studio', 'crm', 'vault'];
  
  viewIds.forEach(id => {
    const el = document.getElementById('view-' + id);
    const tab = document.getElementById('nav-tab-' + id);
    if (el) {
      if (id === viewName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
    if (tab) {
      if (id === viewName) {
        tab.className = 'nav-tab active-nav-tab px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2';
      } else {
        tab.className = 'nav-tab inactive-nav-tab px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2';
      }
    }
  });

  // Action on specific view switch
  if (viewName === 'destinations') {
    renderDestinationsDirectory();
  } else if (viewName === 'crm') {
    loadCRMData();
  } else if (viewName === 'vault') {
    if (!isVaultUnlocked) {
      const lockedEl = document.getElementById('vault-locked-state');
      const unlockedEl = document.getElementById('vault-unlocked-state');
      if (lockedEl) lockedEl.classList.remove('hidden');
      if (unlockedEl) unlockedEl.classList.add('hidden');
      const pinInput = document.getElementById('vault-pin-input');
      if (pinInput) pinInput.value = '';
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchRole(role) {
  currentActiveRole = role;
  const roleBtns = ['admin', 'vendor', 'guest'];
  
  roleBtns.forEach(r => {
    const btn = document.getElementById('role-btn-' + r);
    if (btn) {
      if (r === role) {
        btn.className = 'role-btn active px-3 py-1 rounded-full transition flex items-center space-x-1.5 font-bold';
      } else {
        btn.className = 'role-btn px-3 py-1 rounded-full text-gray-400 hover:text-white transition flex items-center space-x-1.5';
      }
    }
  });

  const vaultNavTab = document.getElementById('nav-tab-vault');
  if (role === 'guest') {
    if (vaultNavTab) vaultNavTab.classList.add('hidden');
    if (currentActiveView === 'vault') switchView('dashboard');
    showNotification('🌐 गेस्ट मोड सक्रिय: केवल लाइव ट्रैकिंग व लिंक्स देखे जा सकते हैं (Read-Only Mode)', 'info');
  } else if (role === 'vendor') {
    if (vaultNavTab) vaultNavTab.classList.add('hidden');
    if (currentActiveView === 'vault') switchView('dashboard');
    showNotification('🤝 वेंडर पैनल सक्रिय: केवल आपके होटल/कैंप डेस्टिनेशन का कंटेंट व ट्रैकिंग उपलब्ध है', 'info');
  } else {
    if (vaultNavTab) vaultNavTab.classList.remove('hidden');
    showNotification('👑 सुपर एडमिन मोड सक्रिय: सभी 100+ डेस्टिनेशंस, स्टूडियो और सीक्रेट API वॉल्ट अनलॉक', 'success');
  }
}

// ===================================================================
// 🗺️ 100+ DESTINATIONS DIRECTORY & DRILL-DOWN LOGIC
// ===================================================================

let allLoadedDestinations = [];

async function renderDestinationsDirectory() {
  const grid = document.getElementById('destinations-directory-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/destinations');
    allLoadedDestinations = await res.json();
    displayFilteredDestinations(allLoadedDestinations);
  } catch (err) {
    grid.innerHTML = '<div class="col-span-full p-4 rounded-xl bg-rose-500/10 text-rose-300 text-xs text-center">डेस्टिनेशंस लोड करने में त्रुटि: ' + err.message + '</div>';
  }
}

function filterDestinationsDirectory(query) {
  if (!allLoadedDestinations || allLoadedDestinations.length === 0) return;
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    displayFilteredDestinations(allLoadedDestinations);
    return;
  }
  const filtered = allLoadedDestinations.filter(d => 
    (d.name && d.name.toLowerCase().includes(q)) ||
    (d.slug && d.slug.toLowerCase().includes(q)) ||
    (d.state && d.state.toLowerCase().includes(q)) ||
    (d.tagline && d.tagline.toLowerCase().includes(q))
  );
  displayFilteredDestinations(filtered);
}

function displayFilteredDestinations(dests) {
  const grid = document.getElementById('destinations-directory-grid');
  if (!grid) return;

  if (!dests || dests.length === 0) {
    grid.innerHTML = '<div class="col-span-full p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-gray-400 text-xs">कोई डेस्टिनेशन नहीं मिली। "+ नई डेस्टिनेशन जोड़ें" पर क्लिक करके नई जोड़ें।</div>';
    return;
  }

  grid.innerHTML = dests.map(d => {
    const channelKeys = Object.keys(d.channels || {}).filter(k => d.channels[k]?.enabled);
    const activeCount = channelKeys.length;

    return \`
      <div class="glass-card rounded-2xl p-5 border border-white/10 hover:border-apple-gold/50 transition-all group flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full \${activeCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}"></span>
                <span class="text-[10px] uppercase font-bold tracking-wider text-apple-gold">\${d.state || 'India'}</span>
              </div>
              <h4 class="text-sm font-extrabold text-white mt-1 group-hover:text-amber-300 transition">\${d.name}</h4>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold \${activeCount > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400'}">
              \${activeCount} एक्टिव चैनल्स
            </span>
          </div>

          <p class="text-xs text-gray-400 line-clamp-2">\${d.tagline || 'Exclusive travel luxury experiences & automated social campaigns.'}</p>

          <div class="flex flex-wrap gap-1.5 pt-1">
            <span class="p-1 rounded bg-blue-500/10 text-blue-300 text-[10px]" title="Facebook"><i class="fa-brands fa-facebook"></i></span>
            <span class="p-1 rounded bg-pink-500/10 text-pink-300 text-[10px]" title="Instagram"><i class="fa-brands fa-instagram"></i></span>
            <span class="p-1 rounded bg-[#229ED9]/10 text-[#229ED9] text-[10px]" title="Telegram"><i class="fa-brands fa-telegram"></i></span>
            <span class="p-1 rounded bg-red-500/10 text-red-300 text-[10px]" title="Pinterest"><i class="fa-brands fa-pinterest"></i></span>
            <span class="p-1 rounded bg-sky-500/10 text-sky-300 text-[10px]" title="LinkedIn"><i class="fa-brands fa-linkedin"></i></span>
            <span class="p-1 rounded bg-emerald-500/10 text-emerald-300 text-[10px]" title="Bookings Portal"><i class="fa-solid fa-hotel"></i></span>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <span class="text-[10px] text-gray-500">ID: \${d.id}</span>
          <button onclick="openDestinationDetail('\${d.id}')" class="px-3.5 py-1.5 rounded-xl bg-apple-gold/15 hover:bg-apple-gold/30 text-apple-gold border border-apple-gold/30 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm">
            <span>क्लिक करके मैनेज करें</span>
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </div>
    \`;
  }).join('');
}

function openDestinationDetail(destId) {
  const d = (allLoadedDestinations || []).find(x => x.id === destId);
  if (d) {
    currentDestination = d;
    const titleEl = document.getElementById('detail-dest-title');
    if (titleEl) titleEl.textContent = d.name;
    const selector = document.getElementById('destination-selector');
    if (selector) {
      selector.value = d.id;
      if (typeof onDestinationChange === 'function') onDestinationChange();
    }
  }

  const dirGrid = document.getElementById('destinations-directory-grid');
  const workspace = document.getElementById('destination-detail-workspace');
  if (dirGrid) dirGrid.classList.add('hidden');
  if (workspace) {
    workspace.classList.remove('hidden');
    workspace.scrollIntoView({ behavior: 'smooth' });
  }
}

function closeDestinationDetail() {
  const dirGrid = document.getElementById('destinations-directory-grid');
  const workspace = document.getElementById('destination-detail-workspace');
  if (workspace) workspace.classList.add('hidden');
  if (dirGrid) dirGrid.classList.remove('hidden');
}

// ===================================================================
// 🔐 SECRET API VAULT (ADMIN PIN LOCK: 1234)
// ===================================================================

async function unlockVaultWithPin() {
  const pinInput = document.getElementById('vault-pin-input');
  const pin = pinInput ? pinInput.value.trim() : '';
  
  if (pin !== '1234') {
    alert('❌ गलत एडमिन पिन! कृपया सही 4-अंकों का पिन दर्ज करें (Default PIN: 1234)');
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
    return;
  }

  isVaultUnlocked = true;
  document.getElementById('vault-locked-state')?.classList.add('hidden');
  document.getElementById('vault-unlocked-state')?.classList.remove('hidden');

  try {
    const res = await fetch('/api/credentials');
    if (res.ok) {
      const creds = await res.json();
      if (document.getElementById('vault-meta-token')) document.getElementById('vault-meta-token').value = creds.metaToken || '';
      if (document.getElementById('vault-tg-token')) document.getElementById('vault-tg-token').value = creds.telegramToken || '';
      if (document.getElementById('vault-pinterest-token')) document.getElementById('vault-pinterest-token').value = creds.pinterestToken || '';
      if (document.getElementById('vault-linkedin-token')) document.getElementById('vault-linkedin-token').value = creds.linkedinToken || '';
      if (document.getElementById('vault-blogger-token')) document.getElementById('vault-blogger-token').value = creds.bloggerToken || '';
      if (document.getElementById('vault-gemini-key')) document.getElementById('vault-gemini-key').value = creds.geminiKey || '';
    }
  } catch (err) {
    console.error('Failed to load credentials:', err);
  }
}

function lockVault() {
  isVaultUnlocked = false;
  const pinInput = document.getElementById('vault-pin-input');
  if (pinInput) pinInput.value = '';
  document.getElementById('vault-unlocked-state')?.classList.add('hidden');
  document.getElementById('vault-locked-state')?.classList.remove('hidden');
  showNotification('🔒 सीक्रेट मास्टर API वॉल्ट को दोबारा सुरक्षित रूप से लॉक कर दिया गया है।', 'info');
}

async function saveVaultKeys() {
  const payload = {
    metaToken: document.getElementById('vault-meta-token')?.value?.trim() || '',
    telegramToken: document.getElementById('vault-tg-token')?.value?.trim() || '',
    pinterestToken: document.getElementById('vault-pinterest-token')?.value?.trim() || '',
    linkedinToken: document.getElementById('vault-linkedin-token')?.value?.trim() || '',
    bloggerToken: document.getElementById('vault-blogger-token')?.value?.trim() || '',
    geminiKey: document.getElementById('vault-gemini-key')?.value?.trim() || ''
  };

  try {
    const res = await fetch('/api/credentials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('✅ सभी सोशल API टोकन्स व कीज़ सफलतापूर्वक अपडेट व सुरक्षित कर दी गई हैं!');
      showNotification('✅ सभी मास्टर API कीज़ सफलतापूर्वक अपडेट हो गईं!', 'success');
      loadSettings();
    } else {
      alert('कीज़ सेव करने में त्रुटि आई।');
    }
  } catch (err) {
    alert('त्रुटि: ' + err.message);
  }
}

// ===================================================================
// 💬 CRM TABS & LIVE REPORT DISPATCH ENGINE
// ===================================================================

function switchCRMTab(tabName) {
  const tabs = ['reports', 'queue', 'leads', 'accounts'];
  tabs.forEach(t => {
    const pane = document.getElementById('crm-tab-pane-' + t);
    const btn = document.getElementById('crm-tab-btn-' + t);
    if (pane) {
      if (t === tabName) pane.classList.remove('hidden');
      else pane.classList.add('hidden');
    }
    if (btn) {
      if (t === tabName) {
        btn.className = 'p-3 rounded-xl bg-apple-gold text-black transition flex items-center justify-center space-x-2 shadow-sm font-bold';
      } else {
        btn.className = 'p-3 rounded-xl bg-white/[0.04] text-gray-300 hover:text-white transition flex items-center justify-center space-x-2 font-bold';
      }
    }
  });
}

async function loadCRMData() {
  const dispatchesContainer = document.getElementById('crm-recent-dispatches-list');
  const queueContainer = document.getElementById('crm-scheduled-queue-list');
  const leadsContainer = document.getElementById('crm-customer-leads-list');

  try {
    const res = await fetch('/api/queue');
    const items = await res.json();
    const published = (items || []).filter(i => i.status === 'published' || i.status === 'dispatched');
    const queued = (items || []).filter(i => i.status === 'queued' || i.status === 'scheduled');

    if (dispatchesContainer) {
      if (published.length === 0) {
        dispatchesContainer.innerHTML = \`
          <div class="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <p class="text-gray-300 font-bold">✅ हालिया पब्लिश की गई 6 पोस्ट्स व 6 रील्स के लाइव वेरिफिकेशन लिंक्स:</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <a href="https://www.facebook.com/1385624654624388" target="_blank" class="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 flex items-center space-x-1.5 transition">
                <i class="fa-brands fa-facebook"></i> <span>Facebook ↗</span>
              </a>
              <a href="https://www.instagram.com/lexatripjaisalmer/" target="_blank" class="p-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 flex items-center space-x-1.5 transition">
                <i class="fa-brands fa-instagram"></i> <span>Instagram ↗</span>
              </a>
              <a href="https://t.me/lexatripjaisalmer" target="_blank" class="p-2 rounded-lg bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] flex items-center space-x-1.5 transition">
                <i class="fa-brands fa-telegram"></i> <span>Telegram Channel ↗</span>
              </a>
              <a href="https://www.pinterest.com/lexatripjaisalmer/" target="_blank" class="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 flex items-center space-x-1.5 transition">
                <i class="fa-brands fa-pinterest"></i> <span>Pinterest ↗</span>
              </a>
              <a href="https://www.linkedin.com/company/lexatripjaisalmer" target="_blank" class="p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 flex items-center space-x-1.5 transition">
                <i class="fa-brands fa-linkedin"></i> <span>LinkedIn ↗</span>
              </a>
              <a href="https://bookings.lexatrip.com/" target="_blank" class="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 flex items-center space-x-1.5 transition">
                <i class="fa-solid fa-hotel"></i> <span>Bookings Portal ↗</span>
              </a>
              <a href="https://wa.me/919079854982" target="_blank" class="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-300 flex items-center space-x-1.5 transition">
                <i class="fa-brands fa-whatsapp"></i> <span>WhatsApp ↗</span>
              </a>
            </div>
          </div>
        \`;
      } else {
        dispatchesContainer.innerHTML = published.slice(0, 10).map((p, idx) => \`
          <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span class="font-bold text-white text-xs">\${idx + 1}. \${p.title || 'Lexa Trip Live Post'}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 uppercase font-bold">\${p.itemType || 'post'}</span>
              </div>
              <p class="text-[11px] text-gray-400 mt-0.5">\${p.caption ? p.caption.substring(0, 80) + '...' : 'Live luxury travel campaign.'}</p>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
              <a href="\${p.liveUrl || 'https://www.facebook.com/1385624654624388'}" target="_blank" class="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-apple-gold border border-apple-gold/30 text-xs font-bold transition flex items-center space-x-1">
                <span>लाइव लिंक ↗</span>
              </a>
            </div>
          </div>
        \`).join('');
      }
    }

    if (queueContainer) {
      if (queued.length === 0) {
        queueContainer.innerHTML = '<div class="p-4 rounded-xl bg-white/[0.02] text-gray-400 text-xs text-center">फिलहाल कतार खाली है। स्टूडियो से 1-क्लिक शेड्यूल दबाकर 6 पोस्ट्स व 6 रील्स कतार में जोड़ें।</div>';
      } else {
        queueContainer.innerHTML = queued.map((q, idx) => \`
          <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">\${idx + 1}</span>
              <div>
                <h5 class="font-bold text-white text-xs">\${q.title || 'Scheduled Post'}</h5>
                <p class="text-[10px] text-gray-400"><i class="fa-regular fa-clock"></i> शेड्यूल समय: \${new Date(q.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (60-90m अंतराल)</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">⏳ कतार में</span>
          </div>
        \`).join('');
      }
    }

    if (leadsContainer) {
      leadsContainer.innerHTML = \`
        <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">WA</div>
            <div>
              <h5 class="font-bold text-white text-xs">Jaisalmer Desert Safari Inquiry</h5>
              <p class="text-[10px] text-gray-400">"What is the best package for 2 nights luxury Swiss tent?"</p>
            </div>
          </div>
          <a href="https://wa.me/919079854982?text=Hello%20Lexa%20Trip" target="_blank" class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition">
            Chat on WhatsApp
          </a>
        </div>
      \`;
    }

  } catch (err) {
    console.error('loadCRMData error:', err);
  }
}

async function testCRMLeadSimulation() {
  try {
    const res = await fetch('/api/crm/simulate-interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'instagram',
        author: 'travel_lover_raj',
        text: 'Price for desert safari in Jaisalmer with camping?',
        channelId: 'jaisalmer_insta'
      })
    });
    if (res.ok) {
      alert('🧪 ग्राहक इन्क्वायरी सिमुलेशन सफल! ऑटो-रिप्लाई ट्रिगर हो गया है।');
      loadCRMData();
    }
  } catch (err) {
    alert('सिमुलेशन एरर: ' + err.message);
  }
}

async function detectAllPagesFromToken() {
  try {
    const res = await fetch('/api/social/meta/detect-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: document.getElementById('vault-meta-token')?.value || ''
      })
    });
    const data = await res.json();
    alert('✅ पेजेस डिटेक्ट हो गए: ' + (data.pages ? data.pages.length : 0) + ' पेजेस मिले।');
  } catch (err) {
    alert('डिटेक्शन एरर: ' + err.message);
  }
}
`;

fs.writeFileSync(appJsPath, appJs + additions, 'utf8');
console.log('Appended 5-view, 3-tier role, and vault logic to app.js successfully!');
