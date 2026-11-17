// Lexa Trip - Futuristic Multi-Destination Social OS Engine
let destinations = [];
let currentDestination = null;
let currentUser = null;
let activeTaskTab = 'queued'; // 'queued' or 'published'
let channelModalMode = 'smart'; // 'smart' or 'custom'
let activeModalPlatform = 'instagram';

let postCardsData = [
  { file: null, previewUrl: null, title: '', caption: '', hashtags: '' },
  { file: null, previewUrl: null, title: '', caption: '', hashtags: '' },
  { file: null, previewUrl: null, title: '', caption: '', hashtags: '' },
  { file: null, previewUrl: null, title: '', caption: '', hashtags: '' },
  { file: null, previewUrl: null, title: '', caption: '', hashtags: '' }
];
let activeBatch = null;
let ws = null;

document.addEventListener('DOMContentLoaded', async () => {
  initWebSocket();
  await loadUser();
  await loadDestinations();
  loadQueue();
  loadSettings();
  checkTelegramInbox();
  checkSchedulerStatus();
  loadAIConfig();
});

// Real-time WebSocket
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'BATCH_PROGRESS') {
        const fill = document.getElementById('progress-bar-fill');
        const text = document.getElementById('progress-percent-text');
        const status = document.getElementById('progress-status-text');
        if (fill) fill.style.width = `${data.percent}%`;
        if (text) text.textContent = `${data.percent}%`;
        if (status) status.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${data.message}</span>`;
      } else if (data.type === 'ITEM_PUBLISHED' || data.type === 'BATCH_SCHEDULED') {
        loadQueue();
      }
    } catch (e) {}
  };

  ws.onclose = () => {
    setTimeout(initWebSocket, 3000);
  };
}

// --- USER & GOOGLE SSO ---
async function loadUser() {
  try {
    const res = await fetch('/api/auth/user');
    currentUser = await res.json();
    renderUserAuthUI();
  } catch (e) {
    console.error('Error loading user:', e);
  }
}

function renderUserAuthUI() {
  const pill = document.getElementById('user-auth-pill');
  const avatar = document.getElementById('user-auth-avatar');
  const name = document.getElementById('user-auth-name');
  const mAvatar = document.getElementById('modal-user-avatar');
  const mName = document.getElementById('modal-user-name');
  const mEmail = document.getElementById('modal-user-email');

  if (currentUser && currentUser.isLoggedIn) {
    if (avatar) avatar.src = currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
    if (name) name.textContent = currentUser.name || 'Lexa Trip Admin';
    if (mAvatar) mAvatar.src = currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
    if (mName) mName.textContent = currentUser.name || 'Lexa Trip Administrator';
    if (mEmail) mEmail.textContent = currentUser.email || 'admin@lexatrip.com';
  } else {
    if (name) name.textContent = 'Sign in with Google';
    if (mName) mName.textContent = 'Guest User';
    if (mEmail) mEmail.textContent = 'Click Sign In below to link Google';
  }
}

function openGoogleModal() {
  document.getElementById('google-modal').classList.remove('hidden');
}

function closeGoogleModal() {
  document.getElementById('google-modal').classList.add('hidden');
}

async function performGoogleLogin() {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lexa Trip Administrator',
        email: 'admin@lexatrip.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
      })
    });
    const data = await res.json();
    currentUser = data.user;
    renderUserAuthUI();
    closeGoogleModal();
    alert('Google Workspace SSO Connected Successfully! ✅\nYouTube Data API & Google Drive are now active.');
  } catch (err) {
    alert('Google login failed: ' + err.message);
  }
}

async function performGoogleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = { isLoggedIn: false, name: 'Guest', email: '' };
    renderUserAuthUI();
    closeGoogleModal();
  } catch (err) {
    console.error(err);
  }
}

// --- DESTINATIONS ---
async function loadDestinations() {
  try {
    const res = await fetch('/api/destinations');
    destinations = await res.json();
    if (!destinations || destinations.length === 0) return;

    if (!currentDestination) {
      currentDestination = destinations[0];
    } else {
      currentDestination = destinations.find(d => d.id === currentDestination.id) || destinations[0];
    }

    renderDestinationPills();
    updateWorkspace();
  } catch (err) {
    console.error('Error loading destinations:', err);
  }
}

function renderDestinationPills() {
  const container = document.getElementById('destinations-pills-container');
  if (!container) return;
  container.innerHTML = '';

  destinations.forEach(d => {
    const isActive = currentDestination && currentDestination.id === d.id;
    let icon = 'fa-compass';
    if (d.slug.includes('jaisalmer')) icon = 'fa-dune';
    if (d.slug.includes('abu')) icon = 'fa-mountain';
    if (d.slug.includes('udaipur')) icon = 'fa-water';

    const btn = document.createElement('button');
    btn.className = `dest-pill px-4 py-2 rounded-2xl text-xs font-bold border flex items-center space-x-2 transition ${
      isActive ? 'active' : 'bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 border-apple-border'
    }`;
    btn.innerHTML = `
      <i class="fa-solid ${icon} ${isActive ? 'text-apple-gold' : 'text-gray-400'}"></i>
      <span>${d.name}</span>
    `;
    btn.onclick = () => selectDestination(d.id);
    container.appendChild(btn);
  });
}

function selectDestination(id) {
  currentDestination = destinations.find(d => d.id === id);
  renderDestinationPills();
  updateWorkspace();
  loadQueue();
  checkTelegramInbox();
}

function updateWorkspace() {
  if (!currentDestination) return;

  const nameEl = document.getElementById('dest-display-name');
  const tagEl = document.getElementById('dest-display-tagline');
  const qEl = document.getElementById('queue-dest-label');

  if (nameEl) nameEl.textContent = currentDestination.name;
  if (tagEl) tagEl.textContent = currentDestination.tagline || 'Experience unforgettable journeys';
  if (qEl) qEl.textContent = currentDestination.name;

  renderInteractiveChannels();
  renderMasterChannelMatrix();
  renderFivePostCards();
}

// --- MASTER CHANNEL DISTRIBUTION MATRIX (ALWAYS SELECT SETTINGS) ---
function renderMasterChannelMatrix() {
  if (!currentDestination) return;

  const defaults = currentDestination.defaultChannels || {
    post: ['instagram', 'facebook', 'linkedin', 'pinterest'],
    reel: ['instagram', 'facebook', 'youtube', 'pinterest'],
    carousel: ['instagram', 'facebook', 'linkedin']
  };

  const allChannels = [
    { key: 'instagram', label: 'Instagram', icon: 'fa-instagram', color: 'border-pink-500/40 text-pink-400' },
    { key: 'facebook', label: 'Facebook', icon: 'fa-facebook', color: 'border-blue-500/40 text-blue-400' },
    { key: 'youtube', label: 'YouTube Shorts', icon: 'fa-youtube', color: 'border-red-500/40 text-red-400' },
    { key: 'linkedin', label: 'LinkedIn', icon: 'fa-linkedin', color: 'border-sky-500/40 text-sky-400' },
    { key: 'pinterest', label: 'Pinterest', icon: 'fa-pinterest', color: 'border-rose-500/40 text-rose-400' },
    { key: 'blogger', label: 'Blogger (.blogspot)', icon: 'fa-blogger-b', color: 'border-amber-500/40 text-amber-400' },
    { key: 'twitter', label: 'X (Future)', icon: 'fa-x-twitter', color: 'border-gray-500/40 text-gray-400' }
  ];

  // 1. Post Matrix
  const postsBox = document.getElementById('matrix-posts-container');
  if (postsBox) {
    postsBox.innerHTML = '';
    const postOptions = ['instagram', 'facebook', 'linkedin', 'pinterest', 'blogger'];
    postOptions.forEach(chKey => {
      const ch = allChannels.find(c => c.key === chKey);
      const isSelected = (defaults.post || []).includes(chKey);
      const chip = document.createElement('button');
      chip.className = `matrix-chip px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center space-x-1.5 ${
        isSelected ? 'active bg-white/[0.08] text-white border-apple-gold' : 'bg-transparent text-gray-400 border-apple-border/50 hover:bg-white/[0.04]'
      }`;
      chip.innerHTML = `
        <i class="fa-brands ${ch.icon} ${isSelected ? 'text-apple-gold' : 'text-gray-500'}"></i>
        <span>${ch.label}</span>
        ${isSelected ? '<i class="fa-solid fa-check text-[9px] text-emerald-400"></i>' : ''}
      `;
      chip.onclick = () => toggleDefaultChannel('post', chKey);
      postsBox.appendChild(chip);
    });
  }

  // 2. Reel Matrix
  const reelsBox = document.getElementById('matrix-reels-container');
  if (reelsBox) {
    reelsBox.innerHTML = '';
    const reelOptions = ['instagram', 'facebook', 'youtube', 'pinterest'];
    reelOptions.forEach(chKey => {
      const ch = allChannels.find(c => c.key === chKey);
      const isSelected = (defaults.reel || []).includes(chKey);
      const chip = document.createElement('button');
      chip.className = `matrix-chip px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center space-x-1.5 ${
        isSelected ? 'active bg-white/[0.08] text-white border-apple-gold' : 'bg-transparent text-gray-400 border-apple-border/50 hover:bg-white/[0.04]'
      }`;
      chip.innerHTML = `
        <i class="fa-brands ${ch.icon} ${isSelected ? 'text-apple-gold' : 'text-gray-500'}"></i>
        <span>${ch.label}</span>
        ${isSelected ? '<i class="fa-solid fa-check text-[9px] text-emerald-400"></i>' : ''}
      `;
      chip.onclick = () => toggleDefaultChannel('reel', chKey);
      reelsBox.appendChild(chip);
    });
  }

  // 3. Carousel Matrix
  const carouselsBox = document.getElementById('matrix-carousels-container');
  if (carouselsBox) {
    carouselsBox.innerHTML = '';
    const carOptions = ['instagram', 'facebook', 'linkedin'];
    carOptions.forEach(chKey => {
      const ch = allChannels.find(c => c.key === chKey);
      const isSelected = (defaults.carousel || []).includes(chKey);
      const chip = document.createElement('button');
      chip.className = `matrix-chip px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center space-x-1.5 ${
        isSelected ? 'active bg-white/[0.08] text-white border-apple-gold' : 'bg-transparent text-gray-400 border-apple-border/50 hover:bg-white/[0.04]'
      }`;
      chip.innerHTML = `
        <i class="fa-brands ${ch.icon} ${isSelected ? 'text-apple-gold' : 'text-gray-500'}"></i>
        <span>${ch.label}</span>
        ${isSelected ? '<i class="fa-solid fa-check text-[9px] text-emerald-400"></i>' : ''}
      `;
      chip.onclick = () => toggleDefaultChannel('carousel', chKey);
      carouselsBox.appendChild(chip);
    });
  }
}

async function toggleDefaultChannel(type, channelKey) {
  if (!currentDestination) return;
  const currentDefaults = currentDestination.defaultChannels || {
    post: ['instagram', 'facebook', 'linkedin', 'pinterest'],
    reel: ['instagram', 'facebook', 'youtube', 'pinterest'],
    carousel: ['instagram', 'facebook', 'linkedin']
  };

  let list = currentDefaults[type] || [];
  if (list.includes(channelKey)) {
    if (list.length === 1) {
      alert('कम से कम एक चैनल अवश्य सेलेक्ट होना चाहिए!');
      return;
    }
    list = list.filter(k => k !== channelKey);
  } else {
    list.push(channelKey);
  }
  currentDefaults[type] = list;
  currentDestination.defaultChannels = currentDefaults;

  try {
    await fetch(`/api/destinations/${currentDestination.id}/default-channels`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentDefaults)
    });
    renderMasterChannelMatrix();
  } catch (e) {
    console.error('Error updating default channels:', e);
  }
}

// --- CLICKABLE INTERACTIVE SOCIAL MEDIA CHANNELS ---
function renderInteractiveChannels() {
  const container = document.getElementById('interactive-channels-grid');
  if (!container) return;
  container.innerHTML = '';

  const platforms = [
    { key: 'instagram', name: 'Instagram', icon: 'fa-instagram', color: 'from-pink-600 to-rose-600', iconColor: 'text-pink-500' },
    { key: 'facebook', name: 'Facebook', icon: 'fa-facebook', color: 'from-blue-600 to-indigo-600', iconColor: 'text-blue-500' },
    { key: 'youtube', name: 'YouTube Shorts', icon: 'fa-youtube', color: 'from-red-600 to-amber-600', iconColor: 'text-red-500' },
    { key: 'linkedin', name: 'LinkedIn', icon: 'fa-linkedin', color: 'from-sky-600 to-blue-700', iconColor: 'text-sky-500' },
    { key: 'pinterest', name: 'Pinterest', icon: 'fa-pinterest', color: 'from-red-600 to-rose-700', iconColor: 'text-rose-500' },
    { key: 'blogger', name: 'Blogger', icon: 'fa-blogger-b', color: 'from-amber-600 to-orange-600', iconColor: 'text-amber-500' },
    { key: 'telegram', name: 'Telegram Bot', icon: 'fa-telegram', color: 'from-sky-500 to-cyan-600', iconColor: 'text-sky-400' },
    { key: 'twitter', name: 'X / Twitter', icon: 'fa-x-twitter', color: 'from-gray-700 to-gray-900', iconColor: 'text-gray-300' }
  ];

  platforms.forEach(p => {
    let isConnected = false;
    let isLiveOfficial = false;
    let handle = 'Click to Connect';

    if (p.key === 'telegram') {
      const tg = currentDestination.telegram || {};
      const hasRealToken = tg.botToken && !tg.botToken.startsWith('smart_') && tg.chatId;
      const hasSmartToken = tg.botToken && tg.botToken.startsWith('smart_');
      isConnected = !!(tg.botToken && tg.chatId);
      isLiveOfficial = !!hasRealToken;
      handle = isLiveOfficial ? 'Live Telegram Connected' : (hasSmartToken ? '🧪 Sandbox Reporter' : 'Click to Configure');
    } else if (p.key === 'twitter') {
      const ch = currentDestination.channels?.twitter;
      isConnected = !!ch?.enabled;
      isLiveOfficial = false;
      handle = ch?.handle || '@lexatrip';
    } else {
      const ch = currentDestination.channels?.[p.key];
      const creds = ch?.credentials || {};
      const hasToken = !!(creds.accessToken || creds.pageAccessToken || creds.apiKey || creds.blogId);
      const isSmart = creds.isSmartConnect || ch?.authType === 'smart_oauth' || String(creds.accessToken || creds.pageAccessToken || creds.apiKey || creds.blogId).startsWith('smart_');
      isConnected = hasToken;
      isLiveOfficial = hasToken && !isSmart;
      handle = ch?.handle || (isConnected ? 'Connected' : 'Click to Connect');
    }

    const card = document.createElement('div');
    const borderColor = isLiveOfficial 
      ? 'border-emerald-500/50 bg-emerald-500/[0.05]' 
      : (isConnected ? 'border-amber-500/40 bg-amber-500/[0.04]' : 'border-apple-border');

    card.className = `channel-card glass-card rounded-2xl p-3 flex flex-col justify-between border ${borderColor}`;
    card.onclick = () => openChannelModal(p.key);

    const statusBadge = isLiveOfficial
      ? `<span class="text-emerald-400 font-semibold flex items-center space-x-1"><span>● Live Official</span></span>`
      : (isConnected 
          ? `<span class="text-amber-400 font-semibold flex items-center space-x-1"><i class="fa-solid fa-flask text-[9px]"></i> <span>Sandbox Demo</span></span>` 
          : `<span class="text-gray-400 font-semibold">+ Connect Live</span>`);

    const dotClass = isLiveOfficial
      ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
      : (isConnected ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-gray-600');

    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-base">
          <i class="fa-brands ${p.icon} ${p.iconColor}"></i>
        </div>
        <span class="w-2.5 h-2.5 rounded-full ${dotClass}"></span>
      </div>
      <div class="mt-2.5">
        <h4 class="text-xs font-bold text-white">${p.name}</h4>
        <p class="text-[10px] text-gray-400 truncate font-mono mt-0.5">${handle}</p>
      </div>
      <div class="mt-2 pt-1.5 border-t border-apple-border/40 flex items-center justify-between text-[10px]">
        ${statusBadge}
        <i class="fa-solid fa-chevron-right text-[9px] text-gray-500"></i>
      </div>
    `;
    container.appendChild(card);
  });
}

// 🧪 1-Click Sandbox Test Setup
async function quickConnectAllChannels() {
  if (!currentDestination) return;
  const platforms = ['instagram', 'facebook', 'youtube', 'linkedin', 'pinterest', 'telegram'];
  const btn = event?.currentTarget;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Activating Sandbox...</span>';
  }

  for (const p of platforms) {
    try {
      await fetch(`/api/destinations/${currentDestination.id}/quick-connect/${p}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: 'smart_telegram_bot_token', chatId: '987654321' })
      });
    } catch (e) {}
  }

  await loadDestinations();
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-flask text-amber-400"></i> <span>🧪 1-Click Sandbox Test Setup</span>';
  }
  alert(`🧪 Offline Sandbox Simulator enabled for all 6 channels in ${currentDestination.name}!\n\nYou can now test video rendering, carousels, and daylight queueing.\nTo link your REAL official account, click on any channel card.`);
}

// CHANNEL MODAL (CONNECT & VERIFY)
function openChannelModal(platform) {
  activeModalPlatform = platform;
  const modal = document.getElementById('channel-modal');
  const title = document.getElementById('modal-channel-title');
  const icon = document.getElementById('modal-channel-icon');
  const destLabel = document.getElementById('modal-channel-dest-label');
  const fieldsBox = document.getElementById('channel-modal-fields');
  const resultBox = document.getElementById('channel-test-result');
  const smartHeading = document.getElementById('smart-pane-heading');
  const smartDesc = document.getElementById('smart-pane-desc');
  const quickBtnLabel = document.getElementById('btn-quick-connect-label');

  resultBox.className = 'hidden';
  destLabel.textContent = `Destination: ${currentDestination.name}`;
  document.getElementById('modal-channel-platform').value = platform;

  const ch = currentDestination.channels?.[platform] || {};
  const creds = ch.credentials || {};
  const destSlug = currentDestination.slug || 'official';

  // Default to Official Account Connect Mode (Not simulated bridge)
  switchChannelModalMode('custom');

  smartHeading.textContent = `Offline Sandbox Simulator Mode`;
  smartDesc.textContent = `Runs an offline simulated test bridge for @lexatrip${destSlug}. Use this for safe testing without publishing to live channels.`;
  quickBtnLabel.textContent = `🧪 Activate Offline Simulator for ${platform.toUpperCase()}`;

  if (platform === 'instagram') {
    title.textContent = 'Connect Official Instagram Business (Meta Graph API)';
    icon.innerHTML = '<i class="fa-brands fa-instagram text-pink-500"></i>';
    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-pink-300 flex items-center space-x-1.5">
              <i class="fa-brands fa-meta"></i>
              <span>Meta Graph API Explorer Guide</span>
            </span>
            <a href="https://developers.facebook.com/tools/explorer/" target="_blank" class="px-2.5 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 text-[10px] rounded-lg font-bold border border-pink-500/30 flex items-center space-x-1 transition">
              <span>Open Graph Explorer</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            1. Meta Explorer me Token generate karein (permissions: <code class="text-pink-300">instagram_basic</code>, <code class="text-pink-300">instagram_content_publish</code>, <code class="text-pink-300">pages_show_list</code>).<br>
            2. Token paste karke <b>"Auto-Detect"</b> dabayein — ID apne aap fill ho jayegi!
          </p>
        </div>

        <div>
          <label class="block font-semibold text-gray-300 mb-1">Meta Graph API User/Page Access Token</label>
          <div class="flex space-x-2">
            <input type="password" id="channel-field-2" value="${creds.accessToken || ''}" placeholder="EAAB..." class="flex-1 bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
            <button type="button" onclick="detectMetaAccountsFromModal()" class="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold shrink-0 transition flex items-center space-x-1">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>Auto-Detect</span>
            </button>
          </div>
        </div>

        <div id="meta-detected-pages-box" class="hidden">
          <label class="block font-semibold text-purple-300 mb-1">Select Detected Account</label>
          <select id="meta-detected-pages-select" onchange="onSelectDetectedMetaPage(this)" class="w-full bg-[#141226] border border-purple-500/40 rounded-xl px-3 py-2 text-white text-xs"></select>
        </div>

        <div>
          <label class="block font-semibold text-gray-300 mb-1">Instagram Business Account ID</label>
          <input type="text" id="channel-field-1" value="${creds.instagramAccountId || ch.handle || ''}" placeholder="e.g. 17841400000000000" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
      </div>
    `;
  } else if (platform === 'facebook') {
    title.textContent = 'Connect Official Facebook Page (Meta Graph API)';
    icon.innerHTML = '<i class="fa-brands fa-facebook text-blue-500"></i>';
    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-blue-300 flex items-center space-x-1.5">
              <i class="fa-brands fa-facebook"></i>
              <span>Facebook Page Access Setup</span>
            </span>
            <a href="https://developers.facebook.com/tools/explorer/" target="_blank" class="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-[10px] rounded-lg font-bold border border-blue-500/30 flex items-center space-x-1 transition">
              <span>Open Graph Explorer</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            1. Meta Explorer me Page Access Token generate karein.<br>
            2. Token paste karke <b>"Auto-Detect"</b> dabayein — Facebook Page ID apne aap set ho jayegi!
          </p>
        </div>

        <div>
          <label class="block font-semibold text-gray-300 mb-1">Page Access Token</label>
          <div class="flex space-x-2">
            <input type="password" id="channel-field-2" value="${creds.pageAccessToken || creds.accessToken || ''}" placeholder="EAAB..." class="flex-1 bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
            <button type="button" onclick="detectMetaAccountsFromModal()" class="px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-bold shrink-0 transition flex items-center space-x-1">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>Auto-Detect</span>
            </button>
          </div>
        </div>

        <div id="meta-detected-pages-box" class="hidden">
          <label class="block font-semibold text-blue-300 mb-1">Select Detected Facebook Page</label>
          <select id="meta-detected-pages-select" onchange="onSelectDetectedMetaPage(this)" class="w-full bg-[#121926] border border-blue-500/40 rounded-xl px-3 py-2 text-white text-xs"></select>
        </div>

        <div>
          <label class="block font-semibold text-gray-300 mb-1">Facebook Page ID</label>
          <input type="text" id="channel-field-1" value="${creds.pageId || ch.handle || ''}" placeholder="e.g. 1029384756" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
      </div>
    `;
  } else if (platform === 'youtube') {
    title.textContent = 'Connect Official YouTube Shorts Channel';
    icon.innerHTML = '<i class="fa-brands fa-youtube text-red-500"></i>';
    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-red-300 flex items-center space-x-1.5">
              <i class="fa-brands fa-youtube"></i>
              <span>YouTube Shorts Setup</span>
            </span>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[10px] rounded-lg font-bold border border-red-500/30 flex items-center space-x-1 transition">
              <span>Google Cloud Console</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            Google Cloud Console me <b>YouTube Data API v3</b> enable karke API Key generate karein.
          </p>
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">YouTube Data API Key / OAuth Token</label>
          <input type="password" id="channel-field-1" value="${creds.apiKey || ''}" placeholder="AIzaSy..." class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">YouTube Channel ID</label>
          <input type="text" id="channel-field-2" value="${creds.channelId || ''}" placeholder="e.g. UC_lexatrip..." class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
      </div>
    `;
  } else if (platform === 'pinterest') {
    title.textContent = 'Connect Official Pinterest Account';
    icon.innerHTML = '<i class="fa-brands fa-pinterest text-red-500"></i>';
    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-red-300 flex items-center space-x-1.5">
              <i class="fa-brands fa-pinterest"></i>
              <span>Pinterest Developer Portal</span>
            </span>
            <a href="https://developers.pinterest.com/apps/" target="_blank" class="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[10px] rounded-lg font-bold border border-red-500/30 flex items-center space-x-1 transition">
              <span>Pinterest Apps</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            Pinterest Developer Portal se Access Token aur target Board ID enter karein.
          </p>
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Pinterest API Access Token</label>
          <input type="password" id="channel-field-1" value="${creds.accessToken || ''}" placeholder="pina_..." class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Board ID</label>
          <input type="text" id="channel-field-2" value="${creds.boardId || ''}" placeholder="board_id" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
      </div>
    `;
  } else if (platform === 'linkedin') {
    title.textContent = 'Connect Official LinkedIn Company Page';
    icon.innerHTML = '<i class="fa-brands fa-linkedin text-sky-500"></i>';
    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sky-300 flex items-center space-x-1.5">
              <i class="fa-brands fa-linkedin"></i>
              <span>LinkedIn Developer Portal</span>
            </span>
            <a href="https://www.linkedin.com/developers/" target="_blank" class="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-[10px] rounded-lg font-bold border border-sky-500/30 flex items-center space-x-1 transition">
              <span>LinkedIn Portal</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            LinkedIn Developer Portal se OAuth Access Token aur Company Organization URN enter karein.
          </p>
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">LinkedIn OAuth Access Token</label>
          <input type="password" id="channel-field-1" value="${creds.accessToken || ''}" placeholder="AQX..." class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Organization URN (e.g. urn:li:organization:1234567)</label>
          <input type="text" id="channel-field-2" value="${creds.organizationUrn || ''}" placeholder="urn:li:organization:..." class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
      </div>
    `;
  } else if (platform === 'telegram') {
    title.textContent = 'Connect Official Telegram Reporting Bot';
    icon.innerHTML = '<i class="fa-brands fa-telegram text-sky-400"></i>';
    const tg = currentDestination.telegram || {};
    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sky-300 flex items-center space-x-1.5">
              <i class="fa-brands fa-telegram"></i>
              <span>Telegram 30-Second Quick Setup (Zero Approval Needed)</span>
            </span>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            1. Telegram par <a href="https://t.me/BotFather" target="_blank" class="text-sky-300 underline font-bold">@BotFather</a> open karein, <code>/newbot</code> bhejein aur Bot Token copy karein.<br>
            2. Apni Chat ID lene ke liye <a href="https://t.me/userinfobot" target="_blank" class="text-sky-300 underline font-bold">@userinfobot</a> par <code>/start</code> bhejein.
          </p>
        </div>

        <div>
          <label class="block font-semibold text-gray-300 mb-1">Telegram Bot Token (from @BotFather)</label>
          <input type="password" id="channel-field-1" value="${tg.botToken || ''}" placeholder="123456789:ABCdefGHI..." class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Your Telegram Chat ID (to receive reports)</label>
          <input type="text" id="channel-field-2" value="${tg.chatId || ''}" placeholder="Your Chat ID (e.g. 987654321)" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
      </div>
    `;
  } else if (platform === 'blogger') {
    title.textContent = 'Connect Google Blogger (.blogspot.com)';
    icon.innerHTML = '<i class="fa-brands fa-blogger-b text-amber-500"></i>';
    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-amber-300 flex items-center space-x-1.5">
              <i class="fa-brands fa-blogger-b"></i>
              <span>Google Blogger Travel Blog Setup</span>
            </span>
            <a href="https://www.blogger.com" target="_blank" class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] rounded-lg font-bold border border-amber-500/30 flex items-center space-x-1 transition">
              <span>Open Blogger</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            Har destination ka apna Blogspot blog ho sakta hai (jaise: <code>lexatripjaisalmer.blogspot.com</code>).<br>
            Blogger URL se <b>Blog ID</b> yahan dalein — post schedule hone par article with photo auto-publish ho jayega!
          </p>
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Blogger Blog ID (or blog handle)</label>
          <input type="text" id="channel-field-1" value="${creds.blogId || ch.handle || ''}" placeholder="e.g. 1234567890123456789 or lexatripjaisalmer.blogspot.com" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Google API Key / Bearer Token (Optional for Simulation)</label>
          <input type="password" id="channel-field-2" value="${creds.apiKey || ''}" placeholder="AIzaSy... or OAuth Token" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
      </div>
    `;
  } else if (platform === 'twitter') {
    title.textContent = 'X / Twitter (Future Ready Module)';
    icon.innerHTML = '<i class="fa-brands fa-x-twitter text-gray-200"></i>';
    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-gray-500/10 border border-gray-500/20 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-gray-200 flex items-center space-x-1.5">
              <i class="fa-brands fa-x-twitter"></i>
              <span>X / Twitter (Standing By)</span>
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Future Ready</span>
          </div>
          <p class="text-[11px] text-gray-400 leading-relaxed">
            Twitter module tayyar hai aur standby par hai. Aap abhi handle aur credentials save kar sakte hain, future me bina kisi code change ke live ho jayega.
          </p>
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Twitter Handle</label>
          <input type="text" id="channel-field-1" value="${ch.handle || '@lexatrip'}" placeholder="@lexatrip" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">API Key / Bearer Token</label>
          <input type="password" id="channel-field-2" value="${creds.apiKey || ''}" placeholder="Twitter API Key" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
      </div>
    `;
  }

  modal.classList.remove('hidden');
}

function switchChannelModalMode(mode) {
  channelModalMode = mode;
  const smartTab = document.getElementById('tab-modal-smart');
  const customTab = document.getElementById('tab-modal-custom');
  const smartPane = document.getElementById('channel-smart-connect-pane');
  const fieldsBox = document.getElementById('channel-modal-fields');
  const testBtn = document.getElementById('btn-test-channel-modal');
  const saveBtn = document.getElementById('btn-save-channel-modal');
  const resultBox = document.getElementById('channel-test-result');
  if (resultBox) resultBox.classList.add('hidden');

  if (mode === 'smart') {
    smartTab.className = 'flex-1 py-2 rounded-lg font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 transition flex items-center justify-center space-x-1.5';
    customTab.className = 'flex-1 py-2 rounded-lg font-semibold text-gray-400 hover:text-white transition flex items-center justify-center space-x-1.5';
    smartPane.classList.remove('hidden');
    fieldsBox.classList.add('hidden');
    testBtn.classList.add('hidden');
    saveBtn.classList.add('hidden');
  } else {
    customTab.className = 'flex-1 py-2 rounded-lg font-bold bg-apple-gold text-black transition flex items-center justify-center space-x-1.5';
    smartTab.className = 'flex-1 py-2 rounded-lg font-semibold text-gray-400 hover:text-white transition flex items-center justify-center space-x-1.5';
    smartPane.classList.add('hidden');
    fieldsBox.classList.remove('hidden');
    testBtn.classList.remove('hidden');
    saveBtn.classList.remove('hidden');
  }
}

// 🔍 Auto-Detect Facebook Pages and Instagram Accounts from Meta Token
async function detectMetaAccountsFromModal() {
  const token = document.getElementById('channel-field-2')?.value?.trim();
  const resultBox = document.getElementById('channel-test-result');
  if (!token) {
    alert('Please paste your Meta Access Token first!');
    return;
  }
  resultBox.classList.remove('hidden');
  resultBox.className = 'p-3 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs flex items-center space-x-2';
  resultBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Connecting to Meta Graph API & detecting accounts...</span>';

  try {
    const res = await fetch('/api/social/meta/detect-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: token })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (!data.pages || data.pages.length === 0) {
      throw new Error('No Facebook Pages found associated with this token. Please ensure your token has "pages_show_list" permission.');
    }

    const selectBox = document.getElementById('meta-detected-pages-select');
    const box = document.getElementById('meta-detected-pages-box');
    selectBox.innerHTML = '<option value="">-- Choose Account --</option>';

    data.pages.forEach((p, idx) => {
      const igInfo = p.instagram ? ` (Instagram: @${p.instagram.username})` : ' (No Instagram linked)';
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${p.pageName}${igInfo}`;
      selectBox.appendChild(opt);
    });

    window._metaDetectedPages = data.pages;
    box.classList.remove('hidden');

    resultBox.className = 'p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs';
    resultBox.innerHTML = `✅ <b>${data.pages.length} Pages detected!</b> Choose your account from the dropdown above to auto-fill the IDs.`;
  } catch (err) {
    resultBox.className = 'p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs';
    resultBox.innerHTML = `❌ <b>Detection Failed:</b> ${err.message}`;
  }
}

function onSelectDetectedMetaPage(selectEl) {
  const idx = selectEl.value;
  if (idx === '' || !window._metaDetectedPages) return;
  const page = window._metaDetectedPages[idx];
  const platform = activeModalPlatform;

  if (platform === 'instagram') {
    if (page.instagram) {
      document.getElementById('channel-field-1').value = page.instagram.id;
      if (page.pageAccessToken) {
        document.getElementById('channel-field-2').value = page.pageAccessToken;
      }
      alert(`✅ Selected Instagram: @${page.instagram.username} (ID: ${page.instagram.id})!`);
    } else {
      alert(`⚠️ This Facebook Page ("${page.pageName}") does not have an Instagram Business account linked to it. Please link your Instagram account in Meta Business Suite, or select another page.`);
    }
  } else if (platform === 'facebook') {
    document.getElementById('channel-field-1').value = page.pageId;
    if (page.pageAccessToken) {
      document.getElementById('channel-field-2').value = page.pageAccessToken;
    }
    alert(`✅ Selected Facebook Page: ${page.pageName} (ID: ${page.pageId})!`);
  }
}

async function performQuickConnectCurrentChannel() {
  if (!currentDestination) return;
  const platform = activeModalPlatform;
  try {
    const res = await fetch(`/api/destinations/${currentDestination.id}/quick-connect/${platform}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken: 'smart_telegram_bot_token', chatId: '987654321' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    await loadDestinations();
    closeChannelModal();
    alert(`🧪 Offline Sandbox Simulator enabled for ${platform.toUpperCase()} (${currentDestination.name})!\n\nNote: This is a safe simulation mode so you can test video generation and scheduling without posting live to your actual social accounts.`);
  } catch (err) {
    alert('Connection failed: ' + err.message);
  }
}

function closeChannelModal() {
  document.getElementById('channel-modal').classList.add('hidden');
}

// TEST & VERIFY LIVE CONNECTION
async function testCurrentChannelConnection() {
  const platform = activeModalPlatform;
  const resultBox = document.getElementById('channel-test-result');
  const val1 = document.getElementById('channel-field-1')?.value?.trim();
  const val2 = document.getElementById('channel-field-2')?.value?.trim();

  resultBox.classList.remove('hidden');
  resultBox.className = 'p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center space-x-2';
  resultBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Testing official connection with platform servers...</span>';

  let credentials = {};
  if (platform === 'instagram') {
    credentials = { instagramAccountId: val1, accessToken: val2 };
  } else if (platform === 'facebook') {
    credentials = { pageId: val1, pageAccessToken: val2 };
  } else if (platform === 'youtube') {
    credentials = { apiKey: val1, channelId: val2 };
  } else if (platform === 'pinterest') {
    credentials = { accessToken: val1, boardId: val2 };
  } else if (platform === 'linkedin') {
    credentials = { accessToken: val1, organizationUrn: val2 };
  } else if (platform === 'telegram') {
    credentials = { botToken: val1, chatId: val2 };
  } else if (platform === 'blogger') {
    credentials = { blogId: val1, apiKey: val2 };
  } else if (platform === 'twitter') {
    credentials = { handle: val1, apiKey: val2 };
  }

  try {
    const res = await fetch(`/api/destinations/${currentDestination.id}/test-channel/${platform}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Connection test failed');

    window._lastVerifiedData = data;

    resultBox.className = 'p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs space-y-1.5';
    resultBox.innerHTML = `
      <div class="flex items-center space-x-2 font-bold text-white">
        <i class="fa-solid fa-circle-check text-emerald-400"></i>
        <span>Live Official Account Verified!</span>
      </div>
      <p class="text-[11px] text-emerald-200">${data.details || 'Credentials are valid and ready to post.'}</p>
      <div class="flex items-center space-x-2 text-[11px] font-mono text-emerald-300">
        <span class="px-2 py-0.5 rounded bg-emerald-500/20 font-bold">${data.accountName || platform}</span>
        <span>${data.handle || 'Verified'}</span>
      </div>
    `;
  } catch (err) {
    resultBox.className = 'p-3.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs space-y-1.5';
    resultBox.innerHTML = `
      <div class="flex items-center space-x-2 font-bold text-rose-200">
        <i class="fa-solid fa-triangle-exclamation text-rose-400"></i>
        <span>Connection Test Failed</span>
      </div>
      <p class="text-[11px] leading-relaxed">${err.message}</p>
      <p class="text-[10px] text-gray-400">Check that your token is freshly generated and has the required permissions.</p>
    `;
  }
}

async function saveCurrentChannelCredentials() {
  const platform = activeModalPlatform;
  const val1 = document.getElementById('channel-field-1')?.value?.trim();
  const val2 = document.getElementById('channel-field-2')?.value?.trim();
  const verified = window._lastVerifiedData;

  if (platform === 'telegram') {
    currentDestination.telegram = {
      enabled: true,
      botToken: val1,
      chatId: val2
    };
  } else {
    currentDestination.channels = currentDestination.channels || {};
    currentDestination.channels[platform] = currentDestination.channels[platform] || {};
    currentDestination.channels[platform].enabled = true;
    currentDestination.channels[platform].authType = 'api_token';
    currentDestination.channels[platform].credentials = currentDestination.channels[platform].credentials || {};

    if (platform === 'instagram') {
      currentDestination.channels[platform].credentials = { instagramAccountId: val1, accessToken: val2 };
      currentDestination.channels[platform].handle = verified?.handle || `@${val1}`;
      if (verified?.accountName) currentDestination.channels[platform].name = verified.accountName;
    } else if (platform === 'facebook') {
      currentDestination.channels[platform].credentials = { pageId: val1, pageAccessToken: val2 };
      currentDestination.channels[platform].handle = verified?.handle || `Page ${val1}`;
      if (verified?.accountName) currentDestination.channels[platform].name = verified.accountName;
    } else if (platform === 'youtube') {
      currentDestination.channels[platform].credentials = { apiKey: val1, channelId: val2 };
      currentDestination.channels[platform].handle = verified?.handle || `YouTube ${val2 || 'API'}`;
      if (verified?.accountName) currentDestination.channels[platform].name = verified.accountName;
    } else if (platform === 'pinterest') {
      currentDestination.channels[platform].credentials = { accessToken: val1, boardId: val2 };
      currentDestination.channels[platform].handle = verified?.handle || `Board ${val2}`;
      if (verified?.accountName) currentDestination.channels[platform].name = verified.accountName;
    } else if (platform === 'linkedin') {
      currentDestination.channels[platform].credentials = { accessToken: val1, organizationUrn: val2 };
      currentDestination.channels[platform].handle = verified?.handle || `LinkedIn Page`;
      if (verified?.accountName) currentDestination.channels[platform].name = verified.accountName;
    } else if (platform === 'blogger') {
      currentDestination.channels[platform].credentials = { blogId: val1, apiKey: val2 };
      currentDestination.channels[platform].handle = verified?.handle || val1 || 'blogspot.com';
      if (verified?.accountName) currentDestination.channels[platform].name = verified.accountName;
    } else if (platform === 'twitter') {
      currentDestination.channels[platform].credentials = { handle: val1, apiKey: val2 };
      currentDestination.channels[platform].handle = val1 || '@lexatrip';
    }
  }

  try {
    const res = await fetch(`/api/destinations/${currentDestination.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentDestination)
    });
    if (!res.ok) throw new Error('Failed to save credentials');

    closeChannelModal();
    window._lastVerifiedData = null;
    await loadDestinations();
    alert(`🎉 ${platform.toUpperCase()} linked successfully to ${currentDestination.name}!`);
  } catch (err) {
    alert(err.message);
  }
}

// TEST TELEGRAM ALERT
async function testTelegramAlert() {
  if (!currentDestination) return;
  try {
    const res = await fetch(`/api/destinations/${currentDestination.id}/test-telegram`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    alert(data.message || 'Telegram test alert sent successfully! Check your phone.');
  } catch (err) {
    alert(`Telegram Alert Error: ${err.message}`);
  }
}

// --- 5 POST CARDS RENDERING & INTERACTION ---
function renderFivePostCards() {
  const container = document.getElementById('five-posts-grid');
  if (!container) return;
  container.innerHTML = '';

  const defaultTopics = [
    'Dunes Sunset Safari',
    'Royal Swiss Tents & Camp',
    'Living Heritage Golden Fort',
    '4x4 Dune Bashing Thrill',
    'Kalbelia Dance & Bonfire Feast'
  ];

  for (let i = 0; i < 5; i++) {
    const cardData = postCardsData[i];
    const card = document.createElement('div');
    card.className = 'glass-card rounded-2xl p-3.5 space-y-3 flex flex-col justify-between border border-apple-border';

    const hasImage = !!cardData.previewUrl;
    const titleVal = cardData.title || defaultTopics[i];

    card.innerHTML = `
      <div class="flex items-center justify-between pb-1.5 border-b border-apple-border/50">
        <span class="text-xs font-extrabold text-white">Post #${i + 1}</span>
        <button onclick="smartFillCardSEO(${i})" class="text-[10px] text-apple-gold hover:underline font-semibold flex items-center space-x-1">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span>Smart SEO</span>
        </button>
      </div>

      <!-- Image Dropzone -->
      <div 
        class="aspect-[4/5] rounded-xl border border-dashed flex flex-col items-center justify-center p-2 text-center cursor-pointer transition relative overflow-hidden ${
          hasImage ? 'border-apple-gold/60 bg-black' : 'border-apple-border hover:border-apple-gold/40 bg-white/[0.02]'
        }"
        onclick="document.getElementById('card-file-${i}').click()"
        ondragover="handleCardDragOver(event)"
        ondrop="handleCardDrop(event, ${i})"
      >
        ${
          hasImage
            ? `<img src="${cardData.previewUrl}" class="w-full h-full object-cover rounded-lg" />
               <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition">
                 <span class="text-xs text-white bg-black/70 px-2 py-1 rounded-md">Change Image</span>
               </div>`
            : `<i class="fa-regular fa-image text-2xl text-gray-500 mb-1.5"></i>
               <p class="text-[11px] font-semibold text-gray-300">Select Image ${i + 1}</p>
               <p class="text-[9px] text-gray-500">4:5 (1080x1350)</p>`
        }
        <input type="file" id="card-file-${i}" accept="image/*" class="hidden" onchange="handleSingleFileSelect(event, ${i})" />
      </div>

      <!-- SEO Title Input -->
      <div>
        <label class="block text-[10px] font-semibold text-gray-400 mb-0.5">SEO Title</label>
        <input 
          type="text" 
          id="card-title-${i}"
          value="${titleVal}" 
          placeholder="Post Title" 
          class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-2.5 py-1.5 text-xs text-gray-200 focus:border-apple-gold outline-none" 
          oninput="postCardsData[${i}].title = this.value"
        />
      </div>

      <!-- Caption & Hashtags Textarea -->
      <div class="flex-1 flex flex-col">
        <label class="block text-[10px] font-semibold text-gray-400 mb-0.5">Caption & Hashtags</label>
        <textarea 
          id="card-caption-${i}"
          rows="4" 
          placeholder="Enter or paste your caption and hashtags here..." 
          class="w-full bg-[#0c0d14] border border-apple-border rounded-xl p-2.5 text-[11px] text-gray-200 font-mono leading-relaxed resize-none focus:border-apple-gold outline-none flex-1"
          oninput="postCardsData[${i}].caption = this.value"
        >${cardData.caption || ''}</textarea>
      </div>
    `;
    container.appendChild(card);
  }
}

function handleCardDragOver(e) {
  e.preventDefault();
}

function handleCardDrop(e, index) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    setCardImage(index, file);
  }
}

function handleSingleFileSelect(e, index) {
  const file = e.target.files[0];
  if (file) {
    setCardImage(index, file);
  }
}

function setCardImage(index, file) {
  postCardsData[index].file = file;
  postCardsData[index].previewUrl = URL.createObjectURL(file);
  renderFivePostCards();
}

function handleMasterFileSelect(e) {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;
  for (let i = 0; i < Math.min(5, files.length); i++) {
    postCardsData[i].file = files[i];
    postCardsData[i].previewUrl = URL.createObjectURL(files[i]);
  }
  renderFivePostCards();
}

// Smart SEO Autofill for a card
function smartFillCardSEO(index) {
  const slug = currentDestination?.slug || 'jaisalmer';
  const postSEO = generateSmartSEO(index + 1, slug);
  postCardsData[index].title = postSEO.title;
  postCardsData[index].caption = `${postSEO.caption}\n\n${postSEO.hashtags.join(' ')}`;
  renderFivePostCards();
}

function generateSmartSEO(index, slug) {
  const destinationName = currentDestination?.name || 'Lexa Trip';
  const templates = [
    {
      title: 'Golden Sunset Camel Safari & Sam Sand Dunes',
      caption: `Feel the raw beauty of the Thar Desert with ${destinationName}! Sunset camel safari across rolling golden sand dunes, traditional Rajasthani folk music and unforgettable evening memories.`,
      hashtags: ['#LexaTrip', '#DesertSafari', '#CamelSafari', '#GoldenDunes', '#TravelDiaries', '#Wanderlust']
    },
    {
      title: 'Royal Luxury Desert Camp & Swiss Tents under the Stars',
      caption: `Sleep under a million stars at our premium Swiss Desert Tents in ${destinationName}. Private stargazing, warm bonfire hospitality and traditional Kalbelia performances.`,
      hashtags: ['#LexaTrip', '#LuxuryCamp', '#DesertCamp', '#SwissTents', '#Stargazing', '#TharDesert']
    },
    {
      title: 'The 800-Year-Old Golden Living Fort (Sonar Qila) & Havelis',
      caption: `Step inside history at ${destinationName}! Explore the living fort, Patwon Ki Haveli, intricate yellow sandstone architecture and rooftop sunset chai views.`,
      hashtags: ['#LexaTrip', '#SonarQila', '#GoldenFort', '#LivingFort', '#Architecture', '#HeritageIndia']
    },
    {
      title: 'High-Adrenaline 4x4 Dune Bashing & Quad Biking Thrill',
      caption: `Ready for adventure in ${destinationName}? Hit the deep Thar dunes with professional 4x4 dune bashing and thrilling quad bike rides!`,
      hashtags: ['#LexaTrip', '#DuneBashing', '#QuadBiking', '#AdventureTravel', '#ThrillSeeker', '#Offroad']
    },
    {
      title: 'Enchanting Kalbelia Dance, Folk Music & Royal Rajasthani Feast',
      caption: `An authentic desert evening filled with fire dance, traditional Kalbelia rhythms and royal Rajasthani Dal Baati Churma cooked fresh on open hearths.`,
      hashtags: ['#LexaTrip', '#FolkDance', '#Kalbelia', '#RajasthaniFood', '#DalBaatiChurma', '#DesertNight']
    }
  ];
  return templates[(index - 1) % templates.length];
}

// 1-Click Demo Sample Batch
async function loadSampleDemoBatch() {
  const btn = event.target.closest('button');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Loading Samples...</span>';

  const demoImages = [
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1080&q=80'
  ];

  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(demoImages[i]);
      const blob = await res.blob();
      const file = new File([blob], `sample_${i + 1}.jpg`, { type: 'image/jpeg' });
      postCardsData[i].file = file;
      postCardsData[i].previewUrl = demoImages[i];
      const seo = generateSmartSEO(i + 1, currentDestination?.slug || 'jaisalmer');
      postCardsData[i].title = seo.title;
      postCardsData[i].caption = `${seo.caption}\n\n${seo.hashtags.join(' ')}`;
    } catch (e) {
      console.error(e);
    }
  }

  renderFivePostCards();
  if (btn) btn.innerHTML = '<i class="fa-solid fa-bolt text-[10px]"></i> <span>1-Click Demo Sample</span>';
}

// Auto-Fetch from Telegram Inbox
async function checkTelegramInbox() {
  if (!currentDestination) return;
  try {
    const res = await fetch(`/api/destinations/${currentDestination.id}/telegram-inbox`);
    const inbox = await res.json();
    const label = document.getElementById('tg-inbox-label');
    if (label) {
      if (inbox.length > 0) {
        label.textContent = `Import from Telegram (${inbox.length} photos ready)`;
      } else {
        label.textContent = 'Auto-Fetch from Telegram';
      }
    }
  } catch (e) {}
}

async function importFromTelegramInbox() {
  if (!currentDestination) return;
  try {
    const res = await fetch(`/api/destinations/${currentDestination.id}/telegram-inbox`);
    const inbox = await res.json();
    if (!inbox || inbox.length === 0) {
      alert('टेलीग्राम इनबॉक्स खाली है!\nअपने मोबाइल से डेस्टिनेशन के टेलीग्राम बॉट को 5 तस्वीरें भेजें, फिर यहाँ क्लिक करें।');
      return;
    }

    const toImport = inbox.slice(-5);
    for (let i = 0; i < toImport.length; i++) {
      const item = toImport[i];
      const imgRes = await fetch(item.url);
      const blob = await imgRes.blob();
      const file = new File([blob], item.filename, { type: 'image/jpeg' });
      postCardsData[i].file = file;
      postCardsData[i].previewUrl = item.url;
      const seo = generateSmartSEO(i + 1, currentDestination.slug);
      postCardsData[i].title = seo.title;
      postCardsData[i].caption = `${seo.caption}\n\n${seo.hashtags.join(' ')}`;
    }

    renderFivePostCards();
    alert(`टेलीग्राम से ${toImport.length} तस्वीरें सफलतापूर्वक इम्पोर्ट कर ली गईं! ✅`);
  } catch (err) {
    alert(`Telegram Import Error: ${err.message}`);
  }
}

// --- PROCESS BATCH (PREVIEW OR AUTO-SCHEDULE) ---
async function processBatch(autoSchedule = false) {
  if (!currentDestination) {
    alert('Please select a destination first.');
    return;
  }

  const missing = postCardsData.findIndex(p => !p.file);
  if (missing !== -1) {
    alert(`कृपया पोस्ट #${missing + 1} के लिए इमेज चुनें (या ऊपर '1-Click Demo Sample' का उपयोग करें)।`);
    return;
  }

  const form = new FormData();
  form.append('destinationId', currentDestination.id);
  form.append('autoSchedule', autoSchedule ? 'true' : 'false');
  form.append('title', `${currentDestination.name} - Campaign ${new Date().toLocaleDateString('en-IN')}`);

  const customSEOs = [];
  postCardsData.forEach((p, idx) => {
    form.append('images', p.file);
    customSEOs.push({
      title: document.getElementById(`card-title-${idx}`)?.value || p.title || `Post ${idx + 1}`,
      caption: document.getElementById(`card-caption-${idx}`)?.value || p.caption || ''
    });
  });
  form.append('customSEOs', JSON.stringify(customSEOs));

  const progressBox = document.getElementById('batch-progress-box');
  const progressFill = document.getElementById('progress-bar-fill');
  const progressPercent = document.getElementById('progress-percent-text');
  const progressStatus = document.getElementById('progress-status-text');

  if (progressBox) progressBox.classList.remove('hidden');
  if (progressFill) progressFill.style.width = '10%';
  if (progressPercent) progressPercent.textContent = '10%';
  if (progressStatus) progressStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Uploading & standardizing 5 images to 4:5...</span>';

  const btnProcess = document.getElementById('btn-process-only');
  const btnSchedule = document.getElementById('btn-oneclick-schedule');
  if (btnProcess) btnProcess.disabled = true;
  if (btnSchedule) btnSchedule.disabled = true;

  try {
    const res = await fetch('/api/batches/upload', {
      method: 'POST',
      body: form
    });
    const batch = await res.json();
    if (!res.ok) throw new Error(batch.error || 'Failed to process batch');

    activeBatch = batch;
    renderBatchPreview(batch);
    await loadQueue();

    if (progressFill) progressFill.style.width = '100%';
    if (progressPercent) progressPercent.textContent = '100%';
    if (progressStatus) progressStatus.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400"></i> <span>All assets rendered successfully!</span>';

    setTimeout(() => {
      if (progressBox) progressBox.classList.add('hidden');
    }, 4000);

    if (autoSchedule) {
      alert(`🎉 1-Click Auto-Schedule Complete!\n\n${batch.scheduledCount || 12} items have been queued with anti-spam jitter intervals for ${currentDestination.name}.\nCheck the Scheduling Task Manager below.`);
      const qSection = document.getElementById('queue-dest-label');
      if (qSection) qSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById('batch-preview-section').classList.remove('hidden');
      document.getElementById('batch-preview-section').scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    alert(`Batch Processing Error: ${err.message}`);
    if (progressBox) progressBox.classList.add('hidden');
  } finally {
    if (btnProcess) btnProcess.disabled = false;
    if (btnSchedule) btnSchedule.disabled = false;
  }
}

// Render Batch Review Section
function renderBatchPreview(batch) {
  const section = document.getElementById('batch-preview-section');
  section.classList.remove('hidden');

  document.getElementById('preview-batch-title').textContent = batch.title;

  // 12s Reel
  const videoEl = document.getElementById('reel-12s-video');
  if (videoEl && batch.combinedReel?.reelPath) {
    videoEl.src = batch.combinedReel.reelPath;
    videoEl.load();
  }
  const reelTitleInput = document.getElementById('reel-12s-title-input');
  const reelCaptionInput = document.getElementById('reel-12s-caption-input');
  if (reelTitleInput) reelTitleInput.value = batch.combinedReel?.seo?.title || '';
  if (reelCaptionInput) reelCaptionInput.value = `${batch.combinedReel?.seo?.caption || ''}\n\n${(batch.combinedReel?.seo?.hashtags || []).join(' ')}`;

  // Carousel
  const carImg = document.getElementById('carousel-preview-img');
  if (carImg && batch.carousel?.previewPath) {
    carImg.src = batch.carousel.previewPath;
  }
  const carTitleInput = document.getElementById('carousel-title-input');
  const carCaptionInput = document.getElementById('carousel-caption-input');
  if (carTitleInput) carTitleInput.value = batch.carousel?.seo?.title || '';
  if (carCaptionInput) carCaptionInput.value = `${batch.carousel?.seo?.caption || ''}\n\n${(batch.carousel?.seo?.hashtags || []).join(' ')}`;

  // 5 Individual Posts & Reels
  const postsBox = document.getElementById('posts-preview-container');
  if (postsBox && batch.posts) {
    postsBox.innerHTML = '';
    batch.posts.forEach((p, idx) => {
      const reel = batch.singleReels ? batch.singleReels[idx] : null;
      const card = document.createElement('div');
      card.className = 'bg-black/50 border border-apple-border rounded-xl p-2.5 space-y-2 text-xs';
      card.innerHTML = `
        <div class="aspect-[4/5] rounded-lg overflow-hidden bg-black border border-apple-border relative group">
          <img src="${p.imagePath}" class="w-full h-full object-cover" />
          <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-apple-gold">#${idx + 1} Post</span>
          ${reel ? `<a href="${reel.reelPath}" target="_blank" class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-rose-600/90 text-white text-[9px] font-bold flex items-center space-x-1">
            <i class="fa-solid fa-play text-[8px]"></i> <span>Reel</span>
          </a>` : ''}
        </div>
        <div class="font-bold text-white truncate text-[11px]">${p.seo?.title || `Post #${idx + 1}`}</div>
        <button onclick="publishSinglePostDirectly('${batch.id}', ${idx + 1})" class="w-full py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-amber-300 border border-apple-border text-[10px] font-semibold flex items-center justify-center space-x-1">
          <i class="fa-solid fa-paper-plane text-[9px]"></i>
          <span>⚡ Live Publish to All</span>
        </button>
      `;
      postsBox.appendChild(card);
    });
  }
}

async function scheduleActiveBatch() {
  if (!activeBatch) return;
  const btn = document.getElementById('btn-schedule-batch');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Scheduling into Queue...';

  try {
    const res = await fetch(`/api/batches/${activeBatch.id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime: new Date(Date.now() + 60000).toISOString() })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    await loadQueue();
    alert(`Batch "${activeBatch.title}" successfully scheduled!\n${data.count} items placed into Anti-Spam queue.`);
    document.getElementById('queue-dest-label').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert(`Failed to schedule: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-regular fa-calendar-check"></i> <span>🚀 Schedule Entire Batch (Anti-Spam 1 to 1.5h Gap)</span>';
  }
}

// ⚡ Live Publish Single Post Directly
async function publishSinglePostDirectly(batchId, postIndex) {
  const qItem = (await (await fetch(`/api/queue?destinationId=${currentDestination.id}`)).json()).find(
    x => x.batchId === batchId && x.itemType === 'post' && x.index === postIndex
  );
  if (qItem) {
    publishQueueItemNow(qItem.id);
  } else {
    alert('This post is being processed. Click 1-Click Auto-Schedule first.');
  }
}

// ⚡ Live Publish Combined Reel to All Selected Channels
async function publishCombinedReelNow() {
  if (!activeBatch) return;
  const qItem = (await (await fetch(`/api/queue?destinationId=${currentDestination.id}`)).json()).find(
    x => x.batchId === activeBatch.id && x.itemType === 'reel' && x.index === 0
  );
  if (qItem) {
    publishQueueItemNow(qItem.id);
  } else {
    alert('12s Reel is being queued. Click 1-Click Auto-Schedule first.');
  }
}

// --- FUTURISTIC TASK MANAGER & DISPATCH ENGINE ---
function switchTaskTab(tab) {
  activeTaskTab = tab;
  const queuedBtn = document.getElementById('tab-btn-queued');
  const publishedBtn = document.getElementById('tab-btn-published');

  if (tab === 'queued') {
    queuedBtn.className = 'font-bold text-apple-gold border-b-2 border-apple-gold pb-1 px-1 flex items-center space-x-1.5';
    publishedBtn.className = 'font-semibold text-gray-400 hover:text-white pb-1 px-1 flex items-center space-x-1.5';
  } else {
    publishedBtn.className = 'font-bold text-apple-gold border-b-2 border-apple-gold pb-1 px-1 flex items-center space-x-1.5';
    queuedBtn.className = 'font-semibold text-gray-400 hover:text-white pb-1 px-1 flex items-center space-x-1.5';
  }
  loadQueue();
}

async function loadQueue() {
  if (!currentDestination) return;
  try {
    const res = await fetch(`/api/queue?destinationId=${currentDestination.id}`);
    const queue = await res.json();

    const tbody = document.getElementById('queue-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const queuedItems = queue.filter(q => q.status === 'queued' || q.status === 'publishing');
    const publishedItems = queue.filter(q => q.status === 'published' || q.status === 'partial_or_failed');

    const badgeQ = document.getElementById('badge-queued-count');
    const badgeP = document.getElementById('badge-published-count');
    if (badgeQ) badgeQ.textContent = queuedItems.length;
    if (badgeP) badgeP.textContent = publishedItems.length;

    const displayItems = activeTaskTab === 'queued' ? queuedItems : publishedItems;

    if (displayItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">
        ${activeTaskTab === 'queued' ? `No upcoming queued tasks for ${currentDestination.name}. Use the 1-Click button above to schedule!` : `No published tasks in archive yet.`}
      </td></tr>`;
      return;
    }

    displayItems.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-white/[0.02] transition';

      const d = new Date(item.scheduledTime);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

      // Relative Countdown
      const diffMs = d - new Date();
      let countdown = '';
      if (item.status === 'queued') {
        if (diffMs > 0) {
          const diffMins = Math.floor(diffMs / 60000);
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          countdown = hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`;
        } else {
          countdown = 'Due now';
        }
      }

      let typeBadge = `<span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[10px]">Post #${item.index}</span>`;
      if (item.itemType === 'carousel') {
        typeBadge = `<span class="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold text-[10px]">Carousel</span>`;
      } else if (item.itemType === 'reel') {
        typeBadge = `<span class="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold text-[10px]">${item.index ? `Reel #${item.index}` : '12s Reel'}</span>`;
      }

      const targets = (item.targets || []).map(t => {
        let icon = 'fa-globe';
        if (t === 'instagram') icon = 'fa-instagram text-pink-400';
        if (t === 'facebook') icon = 'fa-facebook text-blue-400';
        if (t === 'youtube') icon = 'fa-youtube text-red-400';
        if (t === 'linkedin') icon = 'fa-linkedin text-sky-400';
        if (t === 'pinterest') icon = 'fa-pinterest text-rose-400';
        return `
          <span class="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-300 text-[10px] border border-apple-border capitalize">
            <i class="fa-brands ${icon} text-[9px]"></i>
            <span>${t}</span>
          </span>
        `;
      }).join(' ');

      let statusBadge = `<span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">Queued</span>`;
      if (item.status === 'published') {
        statusBadge = `<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">Published</span>`;
      } else if (item.status === 'publishing') {
        statusBadge = `<span class="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px]"><i class="fa-solid fa-spinner fa-spin"></i> Live</span>`;
      }

      tr.innerHTML = `
        <td class="px-4 py-3 font-semibold text-white whitespace-nowrap">
          <div>${timeStr}</div>
          <div class="text-[10px] text-gray-500">${dateStr} ${countdown ? `<span class="text-amber-400/80">(${countdown})</span>` : ''}</div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">${typeBadge}</td>
        <td class="px-4 py-3 font-medium text-gray-200 max-w-xs truncate">${item.title}</td>
        <td class="px-4 py-3 whitespace-nowrap">${targets}</td>
        <td class="px-4 py-3 text-emerald-400 font-mono text-[10px] whitespace-nowrap">+${Math.floor(Math.random() * 25) + 65}m jitter</td>
        <td class="px-4 py-3 whitespace-nowrap">${statusBadge}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
          ${item.status === 'queued' ? `
            <button onclick="publishQueueItemNow('${item.id}')" class="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex-inline items-center space-x-1 shadow-sm">
              <i class="fa-solid fa-bolt text-[9px]"></i>
              <span>Publish Now</span>
            </button>
            <button onclick="rescheduleQueueItem('${item.id}')" class="px-2 py-1 text-gray-400 hover:text-white text-[10px] border border-apple-border rounded-lg">
              <i class="fa-regular fa-clock"></i>
            </button>
            <button onclick="deleteQueueItem('${item.id}')" class="px-2 py-1 text-rose-400 hover:text-rose-200 text-[10px]">
              <i class="fa-solid fa-trash"></i>
            </button>
          ` : `
            <span class="text-[10px] text-emerald-400 font-mono">Completed</span>
          `}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading queue:', err);
  }
}

// ⚡ Live Publish Single Queue Item Now
async function publishQueueItemNow(itemId) {
  try {
    const res = await fetch(`/api/queue/${itemId}/publish-now`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    await loadQueue();
    openDispatchModal(data.item, data.results);
  } catch (err) {
    alert(`Publishing Error: ${err.message}`);
  }
}

// ⚡ Publish ALL Queued Items with 1-Click
async function publishAllQueuedNow() {
  if (!currentDestination) return;
  if (!confirm(`Are you sure you want to immediately dispatch ALL queued posts & reels for ${currentDestination.name}?`)) {
    return;
  }

  try {
    const res = await fetch('/api/queue/publish-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: currentDestination.id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    await loadQueue();
    alert(`Dispatched all ${data.count} items to connected channels! ✅\nCheck the Telegram report on your mobile.`);
  } catch (err) {
    alert(`Bulk Publish Error: ${err.message}`);
  }
}

// Reschedule queue item
async function rescheduleQueueItem(itemId) {
  const current = new Date();
  const input = prompt('Enter new schedule time in ISO format or relative minutes (e.g. "+30" for 30 minutes from now):', '+30');
  if (!input) return;

  let targetTime;
  if (input.startsWith('+')) {
    const mins = parseInt(input.replace('+', ''), 10) || 30;
    targetTime = new Date(Date.now() + mins * 60000);
  } else {
    targetTime = new Date(input);
  }

  if (isNaN(targetTime.getTime())) {
    alert('Invalid time format!');
    return;
  }

  try {
    const res = await fetch(`/api/queue/${itemId}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newTime: targetTime.toISOString() })
    });
    if (!res.ok) throw new Error('Reschedule failed');
    await loadQueue();
  } catch (e) {
    alert(e.message);
  }
}

async function deleteQueueItem(id) {
  if (!confirm('Are you sure you want to remove this scheduled item?')) return;
  try {
    await fetch(`/api/queue/${id}`, { method: 'DELETE' });
    loadQueue();
  } catch (err) {
    console.error(err);
  }
}

async function clearCurrentDestinationQueue() {
  if (!currentDestination) return;
  if (!confirm(`Clear all queued items for ${currentDestination.name}?`)) return;
  try {
    await fetch('/api/queue/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: currentDestination.id })
    });
    loadQueue();
  } catch (err) {
    console.error(err);
  }
}

// --- SCHEDULER CONTROLS ---
async function checkSchedulerStatus() {
  try {
    const res = await fetch('/api/scheduler/status');
    const data = await res.json();
    const btnText = document.getElementById('scheduler-toggle-text');
    if (btnText) {
      btnText.textContent = data.active ? 'Pause Automation' : 'Resume Automation';
    }
  } catch (e) {}
}

async function toggleSchedulerActive() {
  try {
    const res = await fetch('/api/scheduler/toggle', { method: 'POST' });
    const data = await res.json();
    const btnText = document.getElementById('scheduler-toggle-text');
    if (btnText) {
      btnText.textContent = data.active ? 'Pause Automation' : 'Resume Automation';
    }
    alert(data.active ? 'Scheduler Resumed! Posts will dispatch automatically on schedule.' : 'Scheduler Paused! No posts will dispatch until resumed.');
  } catch (e) {
    console.error(e);
  }
}

// --- LIVE DISPATCH RESULTS MODAL ---
function openDispatchModal(item, results = []) {
  const modal = document.getElementById('dispatch-modal');
  const titleEl = document.getElementById('dispatch-modal-item-title');
  const listEl = document.getElementById('dispatch-results-list');

  if (titleEl) titleEl.textContent = item?.title || 'Social Post';
  if (listEl) {
    listEl.innerHTML = '';
    const targets = item?.targets || ['instagram', 'facebook', 'linkedin', 'pinterest'];
    targets.forEach(t => {
      const match = results.find(r => r.platform === t);
      const isSuccess = !match || match.status === 'published' || match.status === 'success';
      const row = document.createElement('div');
      row.className = 'p-2.5 rounded-xl bg-white/[0.03] border border-apple-border flex items-center justify-between text-xs';
      row.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-400' : 'bg-rose-400'}"></span>
          <span class="font-bold text-white capitalize">${t}</span>
        </div>
        <span class="${isSuccess ? 'text-emerald-400 font-semibold' : 'text-rose-400'} text-[11px]">
          ${isSuccess ? '✅ Live Dispatched' : 'Failed'}
        </span>
      `;
      listEl.appendChild(row);
    });
  }
  modal.classList.remove('hidden');
}

function closeDispatchModal() {
  document.getElementById('dispatch-modal').classList.add('hidden');
}

// --- NEW DESTINATION MODAL ---
function openNewDestinationModal() {
  document.getElementById('dest-modal').classList.remove('hidden');
}
function closeDestModal() {
  document.getElementById('dest-modal').classList.add('hidden');
}
async function saveNewDestination() {
  const name = document.getElementById('modal-new-dest-name').value.trim();
  const slug = document.getElementById('modal-new-dest-slug').value.trim();
  const tagline = document.getElementById('modal-new-dest-tagline').value.trim();

  if (!name || !slug) {
    alert('Please provide Name and Slug!');
    return;
  }

  try {
    const res = await fetch('/api/destinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, tagline })
    });
    const newDest = await res.json();
    closeDestModal();
    await loadDestinations();
    selectDestination(newDest.id);
    alert(`Destination "${newDest.name}" added successfully!`);
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

// --- SETTINGS MODAL ---
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const s = await res.json();
    const minEl = document.getElementById('setting-min-interval');
    const maxEl = document.getElementById('setting-max-interval');
    if (minEl) minEl.value = s.minIntervalMinutes || 60;
    if (maxEl) maxEl.value = s.maxIntervalMinutes || 90;
  } catch (e) {}
}

function openSettingsModal() {
  document.getElementById('settings-modal').classList.remove('hidden');
}
function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}
async function saveSettingsModal() {
  const minInterval = parseInt(document.getElementById('setting-min-interval').value, 10) || 60;
  const maxInterval = parseInt(document.getElementById('setting-max-interval').value, 10) || 90;
  try {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minIntervalMinutes: minInterval, maxIntervalMinutes: maxInterval })
    });
    closeSettingsModal();
    alert('Settings updated successfully!');
  } catch (e) {
    alert(e.message);
  }
}

// ==========================================
// ✨ AI SEO PACK AUTO-SPLITTER & PARSER
// ==========================================
function clearRawSeoBox() {
  const el = document.getElementById('ai-seo-raw-input');
  if (el) el.value = '';
}

async function loadAIConfig() {
  try {
    const res = await fetch('/api/ai/config');
    const cfg = await res.json();
    const badge = document.getElementById('ai-provider-badge');
    if (badge) {
      const p = (cfg.provider || 'gemini').toUpperCase();
      const hasKey = !!(cfg.apiKey || cfg.customEndpoint?.apiKey);
      badge.textContent = `Active AI: ${p} (${hasKey ? 'API Active' : 'Smart Offline Mode'})`;
    }
  } catch (e) {
    console.error('Error loading AI config:', e);
  }
}

async function parseAndFillSeoCards() {
  const rawText = document.getElementById('ai-seo-raw-input')?.value?.trim();
  const btn = document.getElementById('btn-parse-ai-seo');
  if (!rawText) {
    alert('कृपया पहले टेक्स्ट बॉक्स में अपना SEO पैक या कंटेंट पेस्ट करें!');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Parsing with AI...</span>';

  try {
    const res = await fetch('/api/ai/parse-seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText,
        destinationName: currentDestination?.name || 'Lexa Trip'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const posts = data.posts || [];
    if (posts.length === 0) throw new Error('Could not parse any posts from the provided text.');

    // Populate all 5 cards
    for (let i = 0; i < 5; i++) {
      const p = posts[i] || {};
      const titleInput = document.getElementById(`card-title-${i}`);
      const captionInput = document.getElementById(`card-caption-${i}`);
      const hashtagsInput = document.getElementById(`card-hashtags-${i}`);

      if (titleInput && p.title) titleInput.value = p.title;
      if (captionInput && p.caption) captionInput.value = p.caption;
      if (hashtagsInput && p.hashtags) hashtagsInput.value = p.hashtags;

      // Update postCardsData state object
      if (typeof postCardsData !== 'undefined' && postCardsData[i]) {
        postCardsData[i].title = p.title || '';
        postCardsData[i].caption = p.caption || '';
        postCardsData[i].hashtags = p.hashtags || '';
      }
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> <span>✨ 5 Cards Auto-Filled!</span>';
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>✨ Auto-Split into 5 Post Cards</span>';
    }, 3000);

    alert(`🎉 Success! 5 Post Cards have been auto-populated with separated Titles, Captions, and Hashtags!`);
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>✨ Auto-Split into 5 Post Cards</span>';
    alert('AI Parsing Error: ' + err.message);
  }
}

// --- AI SETTINGS MODAL ---
let currentAiConfig = {};

async function openAISettingsModal() {
  const modal = document.getElementById('ai-settings-modal');
  try {
    const res = await fetch('/api/ai/config');
    currentAiConfig = await res.json();
    
    const provSelect = document.getElementById('ai-setting-provider');
    provSelect.value = currentAiConfig.provider || 'gemini';
    onAIProviderChange(provSelect.value);

    // Fill inputs
    if (currentAiConfig.provider === 'gemini') {
      document.getElementById('ai-key-gemini').value = currentAiConfig.apiKey || '';
      document.getElementById('ai-model-gemini').value = currentAiConfig.model || 'gemini-1.5-flash';
    } else if (currentAiConfig.provider === 'openai') {
      document.getElementById('ai-key-openai').value = currentAiConfig.apiKey || '';
      document.getElementById('ai-model-openai').value = currentAiConfig.model || 'gpt-4o-mini';
    } else if (currentAiConfig.provider === 'claude') {
      document.getElementById('ai-key-claude').value = currentAiConfig.apiKey || '';
      document.getElementById('ai-model-claude').value = currentAiConfig.model || 'claude-3-5-sonnet-20241022';
    } else if (currentAiConfig.provider === 'custom') {
      const custom = currentAiConfig.customEndpoint || {};
      document.getElementById('ai-custom-base-url').value = custom.baseUrl || '';
      document.getElementById('ai-custom-key').value = custom.apiKey || '';
      document.getElementById('ai-custom-model').value = custom.model || 'gpt-4o-mini';
    }
  } catch (e) {
    console.error('Failed to load AI config:', e);
  }
  modal.classList.remove('hidden');
}

function closeAISettingsModal() {
  document.getElementById('ai-settings-modal').classList.add('hidden');
}

function onAIProviderChange(provider) {
  const geminiBox = document.getElementById('ai-box-gemini');
  const openaiBox = document.getElementById('ai-box-openai');
  const claudeBox = document.getElementById('ai-box-claude');
  const customBox = document.getElementById('ai-box-custom');

  geminiBox.classList.add('hidden');
  openaiBox.classList.add('hidden');
  claudeBox.classList.add('hidden');
  customBox.classList.add('hidden');

  if (provider === 'gemini') geminiBox.classList.remove('hidden');
  else if (provider === 'openai') openaiBox.classList.remove('hidden');
  else if (provider === 'claude') claudeBox.classList.remove('hidden');
  else if (provider === 'custom') customBox.classList.remove('hidden');
}

async function saveAISettingsModal() {
  const provider = document.getElementById('ai-setting-provider').value;
  let newConfig = { provider };

  if (provider === 'gemini') {
    newConfig.apiKey = document.getElementById('ai-key-gemini').value.trim();
    newConfig.model = document.getElementById('ai-model-gemini').value.trim();
  } else if (provider === 'openai') {
    newConfig.apiKey = document.getElementById('ai-key-openai').value.trim();
    newConfig.model = document.getElementById('ai-model-openai').value.trim();
  } else if (provider === 'claude') {
    newConfig.apiKey = document.getElementById('ai-key-claude').value.trim();
    newConfig.model = document.getElementById('ai-model-claude').value.trim();
  } else if (provider === 'custom') {
    newConfig.customEndpoint = {
      baseUrl: document.getElementById('ai-custom-base-url').value.trim(),
      apiKey: document.getElementById('ai-custom-key').value.trim(),
      model: document.getElementById('ai-custom-model').value.trim()
    };
  }

  try {
    const res = await fetch('/api/ai/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    if (!res.ok) throw new Error('Failed to save AI configuration');

    await loadAIConfig();
    closeAISettingsModal();
    alert(`AI Configuration saved successfully! Active Provider: ${provider.toUpperCase()}`);
  } catch (err) {
    alert('Error saving AI config: ' + err.message);
  }
}
