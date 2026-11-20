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
  refreshLiveTrackerHUD();
  setInterval(refreshLiveTrackerHUD, 15000);
  switchView('dashboard');
  switchRole('admin');
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
  refreshLiveTrackerHUD();
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
    { key: 'instagram', label: 'Instagram', icon: 'fa-instagram', iconPrefix: 'fa-brands', color: 'border-pink-500/40 text-pink-400' },
    { key: 'facebook', label: 'Facebook', icon: 'fa-facebook', iconPrefix: 'fa-brands', color: 'border-blue-500/40 text-blue-400' },
    { key: 'threads', label: 'Threads', icon: 'fa-threads', iconPrefix: 'fa-brands', color: 'border-zinc-500/40 text-zinc-300' },
    { key: 'youtube', label: 'YouTube Shorts', icon: 'fa-youtube', iconPrefix: 'fa-brands', color: 'border-red-500/40 text-red-400' },
    { key: 'linkedin', label: 'LinkedIn', icon: 'fa-linkedin', iconPrefix: 'fa-brands', color: 'border-sky-500/40 text-sky-400' },
    { key: 'pinterest', label: 'Pinterest', icon: 'fa-pinterest', iconPrefix: 'fa-brands', color: 'border-rose-500/40 text-rose-400' },
    { key: 'blogger', label: 'Blogger (.blogspot)', icon: 'fa-blogger-b', iconPrefix: 'fa-brands', color: 'border-amber-500/40 text-amber-400' },
    { key: 'website', label: 'Official Website', icon: 'fa-globe', iconPrefix: 'fa-solid', color: 'border-teal-500/40 text-teal-300' },
    { key: 'google_business', label: 'Google Business', icon: 'fa-google', iconPrefix: 'fa-brands', color: 'border-blue-500/40 text-blue-400' },
    { key: 'twitter', label: 'X (Future)', icon: 'fa-x-twitter', iconPrefix: 'fa-brands', color: 'border-gray-500/40 text-gray-400' }
  ];

  // 1. Post Matrix
  const postsBox = document.getElementById('matrix-posts-container');
  if (postsBox) {
    postsBox.innerHTML = '';
    const postOptions = ['instagram', 'facebook', 'threads', 'linkedin', 'pinterest', 'blogger', 'website', 'google_business'];
    postOptions.forEach(chKey => {
      const ch = allChannels.find(c => c.key === chKey);
      if (!ch) return;
      const isSelected = (defaults.post || []).includes(chKey);
      const chip = document.createElement('button');
      chip.className = `matrix-chip px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center space-x-1.5 ${
        isSelected ? 'active bg-white/[0.08] text-white border-apple-gold' : 'bg-transparent text-gray-400 border-apple-border/50 hover:bg-white/[0.04]'
      }`;
      chip.innerHTML = `
        <i class="${ch.iconPrefix || 'fa-brands'} ${ch.icon} ${isSelected ? 'text-apple-gold' : 'text-gray-500'}"></i>
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
    const reelOptions = ['instagram', 'facebook', 'threads', 'youtube', 'pinterest'];
    reelOptions.forEach(chKey => {
      const ch = allChannels.find(c => c.key === chKey);
      if (!ch) return;
      const isSelected = (defaults.reel || []).includes(chKey);
      const chip = document.createElement('button');
      chip.className = `matrix-chip px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center space-x-1.5 ${
        isSelected ? 'active bg-white/[0.08] text-white border-apple-gold' : 'bg-transparent text-gray-400 border-apple-border/50 hover:bg-white/[0.04]'
      }`;
      chip.innerHTML = `
        <i class="${ch.iconPrefix || 'fa-brands'} ${ch.icon} ${isSelected ? 'text-apple-gold' : 'text-gray-500'}"></i>
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
    const carOptions = ['instagram', 'facebook', 'threads', 'linkedin'];
    carOptions.forEach(chKey => {
      const ch = allChannels.find(c => c.key === chKey);
      if (!ch) return;
      const isSelected = (defaults.carousel || []).includes(chKey);
      const chip = document.createElement('button');
      chip.className = `matrix-chip px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center space-x-1.5 ${
        isSelected ? 'active bg-white/[0.08] text-white border-apple-gold' : 'bg-transparent text-gray-400 border-apple-border/50 hover:bg-white/[0.04]'
      }`;
      chip.innerHTML = `
        <i class="${ch.iconPrefix || 'fa-brands'} ${ch.icon} ${isSelected ? 'text-apple-gold' : 'text-gray-500'}"></i>
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

// --- CLICKABLE INTERACTIVE SOCIAL MEDIA CHANNELS (APPLE iOS APP ICONS) ---
function renderInteractiveChannels() {
  const container = document.getElementById('interactive-channels-grid');
  if (!container) return;
  container.innerHTML = '';

  const platforms = [
    { key: 'instagram', name: 'Instagram', icon: 'fa-instagram', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600', shadow: 'shadow-pink-500/25' },
    { key: 'facebook', name: 'Facebook', icon: 'fa-facebook-f', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500', shadow: 'shadow-blue-500/25' },
    { key: 'threads', name: 'Threads', icon: 'fa-threads', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-black via-zinc-900 to-neutral-900 border border-white/20', shadow: 'shadow-neutral-500/25' },
    { key: 'youtube', name: 'YouTube Shorts', icon: 'fa-youtube', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-red-700 via-red-600 to-rose-500', shadow: 'shadow-red-500/25' },
    { key: 'linkedin', name: 'LinkedIn', icon: 'fa-linkedin-in', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-blue-800 via-blue-700 to-sky-600', shadow: 'shadow-sky-500/25' },
    { key: 'pinterest', name: 'Pinterest', icon: 'fa-pinterest-p', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-rose-800 via-red-600 to-rose-500', shadow: 'shadow-red-500/25' },
    { key: 'blogger', name: 'Blogger', icon: 'fa-blogger-b', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400', shadow: 'shadow-orange-500/25' },
    { key: 'website', name: 'Official Website', icon: 'fa-globe', iconPrefix: 'fa-solid', bg: 'bg-gradient-to-tr from-emerald-700 via-teal-600 to-cyan-500', shadow: 'shadow-teal-500/25' },
    { key: 'google_business', name: 'Google Business', icon: 'fa-google', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-blue-700 via-sky-600 to-emerald-500', shadow: 'shadow-blue-500/25' },
    { key: 'telegram', name: 'Telegram Bot', icon: 'fa-telegram', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400', shadow: 'shadow-sky-500/25' },
    { key: 'twitter', name: 'X / Twitter', icon: 'fa-x-twitter', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-gray-950 via-gray-900 to-neutral-900 border border-white/10', shadow: 'shadow-black/40' },
    { key: 'reddit', name: 'Reddit', icon: 'fa-reddit-alien', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-orange-600 via-rose-600 to-red-600', shadow: 'shadow-orange-500/25' },
    { key: 'quora', name: 'Quora', icon: 'fa-quora', iconPrefix: 'fa-brands', bg: 'bg-gradient-to-tr from-red-700 via-red-600 to-rose-700', shadow: 'shadow-red-500/25' }
  ];

  const isSynthetic = (val) => {
    if (!val) return true;
    const str = String(val).trim();
    return str.startsWith('smart_') || str === 'official_live_token' || str === 'smart_connect';
  };

  platforms.forEach(p => {
    let isConnected = false;
    let isLiveOfficial = false;
    let handle = 'Click to Connect';

    if (p.key === 'telegram') {
      const tg = currentDestination.telegram || {};
      const hasRealToken = tg.botToken && !isSynthetic(tg.botToken) && tg.chatId;
      const hasSmartToken = tg.botToken && isSynthetic(tg.botToken);
      isConnected = !!(tg.botToken && tg.chatId);
      isLiveOfficial = !!hasRealToken;
      handle = isLiveOfficial ? 'Live Telegram Connected' : (hasSmartToken ? '🧪 Sandbox Reporter' : 'Click to Configure');
    } else if (p.key === 'twitter') {
      const ch = currentDestination.channels?.twitter;
      const creds = ch?.credentials || {};
      const hasOAuth1 = (creds.apiKey || creds.consumerKey) && (creds.accessToken || creds.token) && !isSynthetic(creds.apiKey) && !isSynthetic(creds.accessToken);
      const hasBearer = (creds.bearerToken || creds.accessToken) && !isSynthetic(creds.bearerToken || creds.accessToken);
      const hasValidToken = hasOAuth1 || hasBearer;
      isConnected = !!ch?.enabled || hasValidToken;
      isLiveOfficial = hasValidToken && !creds.isSmartConnect;
      handle = ch?.handle || (isConnected ? '@lexatrip' : 'Click to Connect');
    } else if (p.key === 'website') {
      const ch = currentDestination.channels?.website || currentDestination.channels?.blog;
      const creds = ch?.credentials || {};
      const hasSite = !!(creds.siteUrl || creds.apiUrl);
      const hasAuth = !!(creds.username && (creds.applicationPassword || creds.appPassword) && !isSynthetic(creds.applicationPassword || creds.appPassword));
      isConnected = hasSite && hasAuth;
      isLiveOfficial = isConnected && !creds.isSmartConnect;
      handle = ch?.handle || creds.siteUrl?.replace(/^https?:\/\//, '') || (isConnected ? 'WordPress REST' : 'Click to Configure');
    } else if (p.key === 'google_business') {
      const ch = currentDestination.channels?.google_business || currentDestination.channels?.gmb;
      const creds = ch?.credentials || {};
      const hasToken = !!(creds.accessToken || creds.refreshToken) && !isSynthetic(creds.accessToken || creds.refreshToken);
      const hasLoc = !!creds.locationId;
      isConnected = hasToken && hasLoc;
      isLiveOfficial = isConnected && !creds.isSmartConnect;
      handle = ch?.handle || (isConnected ? (creds.locationId || 'Verified Location') : 'Click to Configure');
    } else if (p.key === 'threads') {
      const ch = currentDestination.channels?.threads;
      const metaCh = currentDestination.channels?.instagram || currentDestination.channels?.facebook;
      const creds = ch?.credentials || metaCh?.credentials || {};
      const rawToken = creds.accessToken || creds.pageAccessToken;
      const hasToken = !!rawToken && !isSynthetic(rawToken);
      isConnected = !!ch?.enabled || hasToken;
      isLiveOfficial = hasToken && !creds.isSmartConnect;
      handle = ch?.handle || (metaCh?.handle ? `threads.net/${metaCh.handle}` : (isConnected ? 'threads.net/@lexatrip' : 'Click to Connect'));
    } else if (p.key === 'blogger') {
      const ch = currentDestination.channels?.blogger;
      const creds = ch?.credentials || {};
      const hasApiKey = !!creds.apiKey && !isSynthetic(creds.apiKey);
      const hasBlogId = !!creds.blogId;
      isConnected = hasApiKey && hasBlogId;
      isLiveOfficial = isConnected && !creds.isSmartConnect;
      handle = ch?.handle || (hasBlogId ? `Blog ${creds.blogId}` : 'Click to Connect');
    } else if (p.key === 'facebook') {
      const ch = currentDestination.channels?.facebook;
      const creds = ch?.credentials || {};
      const hasToken = !!(creds.pageAccessToken || creds.accessToken) && !isSynthetic(creds.pageAccessToken || creds.accessToken);
      const hasPageId = !!creds.pageId;
      isConnected = hasToken && hasPageId;
      isLiveOfficial = isConnected && !creds.isSmartConnect;
      handle = ch?.handle || (hasPageId ? `Page ${creds.pageId}` : 'Click to Connect');
    } else if (p.key === 'instagram') {
      const ch = currentDestination.channels?.instagram;
      const creds = ch?.credentials || {};
      const hasToken = !!(creds.accessToken || creds.pageAccessToken) && !isSynthetic(creds.accessToken || creds.pageAccessToken);
      const hasAccountId = !!creds.instagramAccountId;
      isConnected = hasToken && hasAccountId;
      isLiveOfficial = isConnected && !creds.isSmartConnect;
      handle = ch?.handle || (hasAccountId ? `@${creds.instagramAccountId}` : 'Click to Connect');
    } else if (p.key === 'pinterest') {
      const ch = currentDestination.channels?.pinterest;
      const creds = ch?.credentials || {};
      const hasToken = !!creds.accessToken && !isSynthetic(creds.accessToken);
      const hasBoardId = !!creds.boardId;
      isConnected = hasToken && hasBoardId;
      isLiveOfficial = isConnected && !creds.isSmartConnect;
      handle = ch?.handle || (hasBoardId ? `Board ${creds.boardId}` : 'Click to Connect');
    } else if (p.key === 'linkedin') {
      const ch = currentDestination.channels?.linkedin;
      const creds = ch?.credentials || {};
      const hasToken = !!creds.accessToken && !isSynthetic(creds.accessToken);
      const hasUrn = !!(creds.organizationUrn || creds.personUrn);
      isConnected = hasToken && hasUrn;
      isLiveOfficial = isConnected && !creds.isSmartConnect;
      handle = ch?.handle || (hasUrn ? 'LinkedIn Org' : 'Click to Connect');
    } else if (p.key === 'youtube') {
      const ch = currentDestination.channels?.youtube;
      const creds = ch?.credentials || {};
      const hasToken = !!(creds.apiKey || creds.accessToken) && !isSynthetic(creds.apiKey || creds.accessToken);
      const hasChannelId = !!creds.channelId;
      isConnected = hasToken && hasChannelId;
      isLiveOfficial = isConnected && !creds.isSmartConnect;
      handle = ch?.handle || (hasChannelId ? `Channel ${creds.channelId}` : 'Click to Connect');
    } else {
      const ch = currentDestination.channels?.[p.key];
      const creds = ch?.credentials || {};
      const hasToken = !!(creds.accessToken || creds.pageAccessToken || creds.apiKey) && !isSynthetic(creds.accessToken || creds.pageAccessToken || creds.apiKey);
      isConnected = hasToken;
      isLiveOfficial = hasToken && !creds.isSmartConnect;
      handle = ch?.handle || (isConnected ? 'Connected' : 'Click to Connect');
    }

    const card = document.createElement('div');
    const borderStyle = isLiveOfficial 
      ? 'border-emerald-500/40 bg-emerald-500/[0.04]' 
      : (isConnected ? 'border-amber-500/40 bg-amber-500/[0.03]' : 'border-white/10 bg-white/[0.02]');

    card.className = `channel-card apple-hero-card rounded-2xl p-3.5 flex flex-col justify-between border ${borderStyle} group cursor-pointer`;
    card.onclick = () => openChannelModal(p.key);

    const statusBadge = isLiveOfficial
      ? `<span class="text-emerald-400 font-bold flex items-center space-x-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>Live Official</span></span>`
      : (isConnected 
          ? `<span class="text-amber-400 font-semibold flex items-center space-x-1"><i class="fa-solid fa-flask text-[9px]"></i> <span>Free Demo Mode</span></span>` 
          : `<span class="text-sky-400 font-semibold flex items-center space-x-1"><i class="fa-solid fa-plus text-[9px]"></i> <span>Connect Free API</span></span>`);

    const dotClass = isLiveOfficial
      ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
      : (isConnected ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-gray-600');

    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="w-10 h-10 rounded-2xl ${p.bg} ${p.shadow} flex items-center justify-center text-white text-lg shadow-md group-hover:scale-105 transition-transform duration-200">
          <i class="${p.iconPrefix || 'fa-brands'} ${p.icon}"></i>
        </div>
        <span class="w-2.5 h-2.5 rounded-full ${dotClass} mt-1"></span>
      </div>
      <div class="mt-3">
        <h4 class="text-xs font-extrabold text-white tracking-tight">${p.name}</h4>
        <p class="text-[10px] text-gray-400 truncate font-mono mt-0.5">${handle}</p>
      </div>
      <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
        ${statusBadge}
        <i class="fa-solid fa-chevron-right text-[9px] text-gray-500 group-hover:text-white transition-colors"></i>
      </div>
    `;
    container.appendChild(card);
  });
}

// 🧪 1-Click Sandbox Test Setup
async function quickConnectAllChannels() {
  if (!currentDestination) return;
  const platforms = ['instagram', 'facebook', 'threads', 'youtube', 'linkedin', 'pinterest', 'blogger', 'website', 'google_business', 'telegram'];
  const btn = window.event ? window.event.target?.closest('button') : null;
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
              <span>Pinterest Business Developer Portal</span>
            </span>
            <a href="https://developers.pinterest.com/apps/" target="_blank" class="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[10px] rounded-lg font-bold border border-red-500/30 flex items-center space-x-1 transition">
              <span>Pinterest Apps</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            1 Master Pinterest API Token se sabhi destinations ke boards handle hote hain.<br>
            Token paste karke <b>"Auto-Detect Boards"</b> dabayein — destination board apne aap link ho jayega!
          </p>
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Pinterest Master API Access Token</label>
          <div class="flex space-x-2">
            <input type="password" id="channel-field-1" value="${creds.accessToken || ''}" placeholder="pina_..." class="flex-1 bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
            <button type="button" onclick="detectPinterestBoardsFromModal()" class="px-3 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 text-xs font-bold shrink-0 transition flex items-center space-x-1">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>Auto-Detect Boards</span>
            </button>
          </div>
        </div>
        <div id="pinterest-detected-boards-box" class="hidden">
          <label class="block font-semibold text-red-300 mb-1">Select Destination Board</label>
          <select id="pinterest-detected-boards-select" onchange="onSelectDetectedPinterestBoard(this)" class="w-full bg-[#1c0f14] border border-red-500/40 rounded-xl px-3 py-2 text-white text-xs"></select>
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Destination Board ID</label>
          <input type="text" id="channel-field-2" value="${creds.boardId || ''}" placeholder="e.g. 1029384756..." class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
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
  } else if (platform === 'threads') {
    title.textContent = 'Connect Official Threads (by Meta)';
    icon.innerHTML = '<i class="fa-brands fa-threads text-white"></i>';
    const metaCreds = currentDestination.channels?.instagram?.credentials || currentDestination.channels?.facebook?.credentials || {};
    const defaultMetaToken = creds.accessToken || metaCreds.accessToken || metaCreds.pageAccessToken || '';
    const igHandle = currentDestination.channels?.instagram?.handle || `@lexatrip${destSlug}`;
    const defaultHandle = ch.handle || (igHandle.startsWith('@') ? `threads.net/${igHandle}` : `threads.net/@${igHandle}`);

    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-zinc-800/60 border border-white/20 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <i class="fa-brands fa-threads"></i>
              <span>Threads API (Meta Graph Setup)</span>
            </span>
            <a href="https://developers.facebook.com/docs/threads" target="_blank" class="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] rounded-lg font-bold border border-white/20 flex items-center space-x-1 transition">
              <span>Threads Docs</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            Threads Meta ecosystem ka official hissa hai aur aapke Instagram Business handle se natively linked hai.<br>
            Aapka <b>Meta Lifetime Token</b> Threads par travel updates, micro-blogs aur reels auto-publish karne ke liye tayyar hai.
          </p>
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Threads Profile Handle / URL</label>
          <input type="text" id="channel-field-1" value="${defaultHandle}" placeholder="threads.net/@lexatripjaisalmer" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Meta Master Access Token</label>
          <input type="password" id="channel-field-2" value="${defaultMetaToken}" placeholder="EAAW..." class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
      </div>
    `;
  } else if (platform === 'website') {
    title.textContent = 'Connect Official Travel Portal (lexatrip.com)';
    icon.innerHTML = '<i class="fa-solid fa-globe text-teal-400"></i>';
    const siteUrl = creds.siteUrl || `https://lexatrip.com/${destSlug}`;
    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-teal-300 flex items-center space-x-1.5">
              <i class="fa-solid fa-globe"></i>
              <span>WordPress REST API / Travel Portal Syndication</span>
            </span>
            <a href="https://lexatrip.com" target="_blank" class="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 text-[10px] rounded-lg font-bold border border-teal-500/30 flex items-center space-x-1 transition">
              <span>lexatrip.com</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            Lexa Trip Official Website par har destination ke travel packages, SEO articles aur daily guide posts automatic syndicate hote hain.
          </p>
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Official Website Destination URL</label>
          <input type="text" id="channel-field-1" value="${siteUrl}" placeholder="https://lexatrip.com/jaisalmer" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">WordPress Application Password / API Secret (Optional)</label>
          <input type="password" id="channel-field-2" value="${creds.applicationPassword || 'official_live_token'}" placeholder="e.g. xxxx xxxx xxxx xxxx" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
      </div>
    `;
  } else if (platform === 'google_business') {
    title.textContent = 'Connect Google Business Profile (GMB Local Posts)';
    icon.innerHTML = '<i class="fa-brands fa-google text-blue-400"></i>';
    const locId = creds.locationId || ch.handle || `locations/lexatrip_${destSlug}`;
    fieldsBox.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-blue-300 flex items-center space-x-1.5">
              <i class="fa-brands fa-google"></i>
              <span>Google Business Profile (Smart Anti-Spam Posting)</span>
            </span>
            <a href="https://business.google.com" target="_blank" class="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-[10px] rounded-lg font-bold border border-blue-500/30 flex items-center space-x-1 transition">
              <span>Google Business</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>
          <p class="text-[11px] text-gray-300 leading-relaxed">
            Google Business Profile par roz 5 spam posts dalne ke bajaye, <b>Gemini AI</b> din ki 1 sabse behtareen What's New post banata hai with "Book Now" CTA button!
          </p>
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Location ID / Profile Name</label>
          <input type="text" id="channel-field-1" value="${locId}" placeholder="e.g. locations/1234567890 or Lexa Trip Jaisalmer" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
        </div>
        <div>
          <label class="block font-semibold text-gray-300 mb-1">Google Cloud OAuth Access Token / API Key</label>
          <input type="password" id="channel-field-2" value="${creds.accessToken || ''}" placeholder="yaad rahe: 1-Master Google Cloud token sabhi locations par kaam karta hai" class="w-full bg-[#0c0d14] border border-apple-border rounded-xl px-3 py-2 text-gray-200 font-mono text-xs" />
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

async function detectPinterestBoardsFromModal() {
  const token = document.getElementById('channel-field-1')?.value?.trim();
  const resultBox = document.getElementById('channel-test-result');
  if (!token) {
    alert('Please enter your Pinterest Master Access Token first!');
    return;
  }
  resultBox.classList.remove('hidden');
  resultBox.className = 'p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs flex items-center space-x-2';
  resultBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Connecting to Pinterest API & detecting boards...</span>';

  try {
    const res = await fetch('/api/social/pinterest/detect-boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: token })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (!data.boards || data.boards.length === 0) {
      throw new Error('No Pinterest Boards found in this account. Please create your destination board on Pinterest first!');
    }

    const selectBox = document.getElementById('pinterest-detected-boards-select');
    const box = document.getElementById('pinterest-detected-boards-box');
    selectBox.innerHTML = '<option value="">-- Choose Destination Board --</option>';

    let matchedIdx = -1;
    const destName = (currentDestination?.name || '').toLowerCase();
    const destSlug = (currentDestination?.slug || '').toLowerCase();

    data.boards.forEach((b, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${b.name} (${b.pinCount} pins) [ID: ${b.id}]`;
      selectBox.appendChild(opt);

      // Auto-match if board name contains destination name or slug
      const bLower = b.name.toLowerCase();
      if (bLower.includes(destSlug) || (destName && bLower.includes('jaisalmer') && destSlug.includes('jaisalmer'))) {
        matchedIdx = idx;
      }
    });

    window._pinterestDetectedBoards = data.boards;
    box.classList.remove('hidden');

    if (matchedIdx !== -1) {
      selectBox.value = matchedIdx;
      document.getElementById('channel-field-2').value = data.boards[matchedIdx].id;
      resultBox.className = 'p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs';
      resultBox.innerHTML = `✅ <b>Auto-Matched Board:</b> "${data.boards[matchedIdx].name}" (ID: ${data.boards[matchedIdx].id})`;
    } else {
      resultBox.className = 'p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs';
      resultBox.innerHTML = `✅ <b>${data.boards.length} Boards detected!</b> Choose the destination board from the dropdown above.`;
    }
  } catch (err) {
    resultBox.className = 'p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs';
    resultBox.innerHTML = `❌ <b>Detection Failed:</b> ${err.message}`;
  }
}

function onSelectDetectedPinterestBoard(selectEl) {
  const idx = selectEl.value;
  if (idx === '' || !window._pinterestDetectedBoards) return;
  const board = window._pinterestDetectedBoards[idx];
  document.getElementById('channel-field-2').value = board.id;
  alert(`✅ Selected Destination Board: "${board.name}" (ID: ${board.id})!`);
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
  } else if (platform === 'threads') {
    credentials = { threadsHandle: val1, accessToken: val2 };
  } else if (platform === 'website') {
    credentials = { siteUrl: val1, applicationPassword: val2, apiUrl: `${val1.replace(/\/$/, '')}/wp-json/wp/v2` };
  } else if (platform === 'google_business') {
    credentials = { locationId: val1, accessToken: val2, businessName: currentDestination.name };
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
    } else if (platform === 'threads') {
      currentDestination.channels[platform].credentials = { 
        threadsHandle: val1, 
        accessToken: val2 || currentDestination.channels?.instagram?.credentials?.accessToken,
        isLifetime: true
      };
      currentDestination.channels[platform].handle = verified?.handle || val1 || 'threads.net/@lexatrip';
      if (verified?.accountName) currentDestination.channels[platform].name = verified.accountName;
      currentDestination.channels[platform].supports = ['post', 'carousel', 'reel'];
    } else if (platform === 'website') {
      currentDestination.channels[platform].credentials = { 
        siteUrl: val1, 
        apiUrl: `${val1.replace(/\/$/, '')}/wp-json/wp/v2`,
        applicationPassword: val2 || ''
      };
      currentDestination.channels[platform].handle = verified?.handle || val1.replace(/^https?:\/\//, '') || 'lexatrip.com';
      if (verified?.accountName) currentDestination.channels[platform].name = verified.accountName;
      currentDestination.channels[platform].supports = ['post', 'article'];
    } else if (platform === 'google_business') {
      currentDestination.channels[platform].credentials = { 
        locationId: val1, 
        accessToken: val2,
        websiteUrl: currentDestination.channels?.website?.credentials?.siteUrl || 'https://www.lexatrip.com/',
        ctaType: 'LEARN_MORE'
      };
      currentDestination.channels[platform].handle = verified?.handle || val1 || 'maps.google.com';
      if (verified?.accountName) currentDestination.channels[platform].name = verified.accountName;
      currentDestination.channels[platform].supports = ['post'];
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
  try {
    let res = null;
    let data = null;
    if (currentDestination?.id) {
      try {
        res = await fetch(`/api/destinations/${currentDestination.id}/test-telegram`, { method: 'POST' });
        data = await res.json();
      } catch (e) {}
    }
    if (!res || !res.ok) {
      res = await fetch('/api/telegram/test-alert', { method: 'POST' });
      data = await res.json();
    }
    if (!res.ok) throw new Error(data?.error || 'Failed to send alert');
    alert(data.message || '🔔 Telegram test alert sent successfully! Check your Telegram phone/desktop.');
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
  const btn = window.event ? window.event.target?.closest('button') : null;
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
  const failedBtn = document.getElementById('tab-btn-failed');

  const activeGoldClass = 'font-bold text-apple-gold border-b-2 border-apple-gold pb-1 px-1 flex items-center space-x-1.5 transition';
  const activeRoseClass = 'font-bold text-rose-400 border-b-2 border-rose-500 pb-1 px-1 flex items-center space-x-1.5 transition';
  const inactiveClass = 'font-semibold text-gray-400 hover:text-white pb-1 px-1 flex items-center space-x-1.5 border-b-2 border-transparent transition';

  if (tab === 'queued') {
    if (queuedBtn) queuedBtn.className = activeGoldClass;
    if (publishedBtn) publishedBtn.className = inactiveClass;
    if (failedBtn) failedBtn.className = inactiveClass;
  } else if (tab === 'published') {
    if (publishedBtn) publishedBtn.className = activeGoldClass;
    if (queuedBtn) queuedBtn.className = inactiveClass;
    if (failedBtn) failedBtn.className = inactiveClass;
  } else if (tab === 'failed') {
    if (failedBtn) failedBtn.className = activeRoseClass;
    if (queuedBtn) queuedBtn.className = inactiveClass;
    if (publishedBtn) publishedBtn.className = inactiveClass;
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
    const publishedItems = queue.filter(q => q.status === 'published' || q.status === 'completed' || q.status === 'success');
    const failedItems = queue.filter(q => q.status === 'failed' || q.status === 'partial_or_failed');

    const badgeQ = document.getElementById('badge-queued-count');
    const badgeP = document.getElementById('badge-published-count');
    const badgeF = document.getElementById('badge-failed-count');
    if (badgeQ) badgeQ.textContent = queuedItems.length;
    if (badgeP) badgeP.textContent = publishedItems.length;
    if (badgeF) badgeF.textContent = failedItems.length;

    let displayItems = queuedItems;
    if (activeTaskTab === 'published') {
      displayItems = publishedItems;
    } else if (activeTaskTab === 'failed') {
      displayItems = failedItems;
    }

    if (displayItems.length === 0) {
      let emptyMsg = `No upcoming queued tasks for ${currentDestination.name}. Use the 1-Click button above to schedule!`;
      if (activeTaskTab === 'published') {
        emptyMsg = `No published tasks in archive yet for ${currentDestination.name}.`;
      } else if (activeTaskTab === 'failed') {
        emptyMsg = `No failed or partial tasks. All publishing operations for ${currentDestination.name} are healthy! ✅`;
      }
      tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">${emptyMsg}</td></tr>`;
      return;
    }

    displayItems.forEach((item, itemIdx) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-white/[0.02] transition border-b border-apple-border/20';

      const d = item.scheduledTime ? new Date(item.scheduledTime) : (item.createdAt ? new Date(item.createdAt) : new Date());
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

      let typeBadge = `<span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[10px]">Post #${item.index || 1}</span>`;
      if (item.itemType === 'carousel') {
        typeBadge = `<span class="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold text-[10px]">Carousel</span>`;
      } else if (item.itemType === 'reel') {
        typeBadge = `<span class="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold text-[10px]">${item.index ? `Reel #${item.index}` : '12s Reel'}</span>`;
      }

      // Real anti-spam spacing calculation (replacing fake random math)
      let spacingText = 'Scheduled';
      if (item.status === 'queued') {
        const prev = itemIdx > 0 ? displayItems[itemIdx - 1] : null;
        if (prev && prev.scheduledTime && item.scheduledTime) {
          const gapMins = Math.max(0, Math.round((new Date(item.scheduledTime) - new Date(prev.scheduledTime)) / 60000));
          const h = Math.floor(gapMins / 60);
          const m = gapMins % 60;
          spacingText = h > 0 ? `+${h}h ${m}m gap` : `+${m}m gap`;
        } else {
          spacingText = countdown ? `${countdown}` : 'Next in line';
        }
      } else if (item.publishedAt) {
        const pubDate = new Date(item.publishedAt);
        spacingText = `Live at ${pubDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (item.status === 'failed' || item.status === 'partial_or_failed') {
        spacingText = 'Failed';
      }

      // Collect target channels with status-specific icons and tooltip error info
      const results = item.publishResults || [];
      const targets = (item.targets || []).map(t => {
        let icon = 'fa-globe';
        if (t === 'instagram') icon = 'fa-instagram text-pink-400';
        if (t === 'facebook') icon = 'fa-facebook text-blue-400';
        if (t === 'youtube') icon = 'fa-youtube text-red-400';
        if (t === 'linkedin') icon = 'fa-linkedin text-sky-400';
        if (t === 'pinterest') icon = 'fa-pinterest text-rose-400';
        if (t === 'blogger') icon = 'fa-blogger text-orange-400';
        if (t === 'twitter') icon = 'fa-x-twitter text-gray-200';
        if (t === 'threads') icon = 'fa-threads text-purple-400';
        if (t === 'telegram') icon = 'fa-telegram text-sky-400';

        const match = results.find(r => r.platform === t);
        let statusDot = '';
        let tooltip = t;
        if (match) {
          if (match.status === 'published' || match.status === 'success') {
            statusDot = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>';
            tooltip = `${t}: Published`;
          } else if (match.status === 'failed') {
            statusDot = '<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>';
            const errStr = match.error || 'Failed';
            tooltip = `${t}: ${errStr}`;
          }
        }

        return `
          <span class="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-300 text-[10px] border border-apple-border capitalize" title="${escapeHtml(tooltip)}">
            <i class="fa-brands ${icon} text-[9px]"></i>
            <span>${t}</span>
            ${statusDot}
          </span>
        `;
      }).join(' ');

      // Explicit status badges for all statuses
      let statusBadge = '';
      if (item.status === 'published') {
        statusBadge = `<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">Published</span>`;
      } else if (item.status === 'partial_or_failed') {
        statusBadge = `<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">⚠️ Partial</span>`;
      } else if (item.status === 'failed') {
        statusBadge = `<span class="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">❌ Failed</span>`;
      } else if (item.status === 'publishing') {
        statusBadge = `<span class="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px]"><i class="fa-solid fa-spinner fa-spin"></i> Live</span>`;
      } else {
        statusBadge = `<span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">Queued</span>`;
      }

      // Expandable inline error preview for partial or failed items
      const failedResults = results.filter(r => r.status === 'failed');
      let inlineErrorHtml = '';
      if (failedResults.length > 0) {
        inlineErrorHtml = `
          <details class="mt-1 text-[11px] text-rose-300 group">
            <summary class="cursor-pointer text-[10px] text-rose-400 hover:text-rose-200 font-semibold flex items-center space-x-1 select-none">
              <i class="fa-solid fa-circle-exclamation text-[9px]"></i>
              <span>${failedResults.length} platform failure(s) - click for error details</span>
            </summary>
            <div class="mt-1.5 space-y-1 pl-2 border-l-2 border-rose-500/40 font-mono text-[10px] bg-rose-500/[0.04] p-1.5 rounded">
              ${failedResults.map(f => `<div><b class="capitalize text-rose-300">${escapeHtml(f.platform)}:</b> <span class="text-rose-200/90">${escapeHtml(f.error || 'Platform API Error')}</span></div>`).join('')}
            </div>
          </details>
        `;
      }

      // Actions Column: Dynamic buttons based on status
      let actionHtml = '';
      if (item.status === 'queued') {
        actionHtml = `
          <button onclick="publishQueueItemNow('${item.id}')" class="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center space-x-1 shadow-sm">
            <i class="fa-solid fa-bolt text-[9px]"></i>
            <span>Publish Now</span>
          </button>
          <button onclick="rescheduleQueueItem('${item.id}')" class="px-2 py-1 text-gray-400 hover:text-white text-[10px] border border-apple-border rounded-lg" title="Reschedule">
            <i class="fa-regular fa-clock"></i>
          </button>
          <button onclick="deleteQueueItem('${item.id}')" class="px-2 py-1 text-rose-400 hover:text-rose-200 text-[10px]" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        `;
      } else if (item.status === 'failed' || item.status === 'partial_or_failed') {
        actionHtml = `
          <div class="flex items-center space-x-1.5 justify-end">
            <button onclick="publishQueueItemNow('${item.id}')" class="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold inline-flex items-center space-x-1" title="Retry publishing">
              <i class="fa-solid fa-rotate-right text-[9px]"></i>
              <span>Retry</span>
            </button>
            <button onclick="openDispatchModal(window._queueCache?.find(q => q.id === '${item.id}') || { id: '${item.id}', title: '${escapeHtml(item.title)}', targets: ${JSON.stringify(item.targets || [])} }, ${JSON.stringify(results).replace(/"/g, '&quot;')})" class="px-2 py-1 text-gray-300 hover:text-white text-[10px] border border-apple-border rounded-lg" title="Inspect full results & errors">
              <i class="fa-solid fa-magnifying-glass text-[9px]"></i>
              <span>Errors</span>
            </button>
          </div>
        `;
      } else {
        // Published: Dynamic links for succeeded platforms
        const liveLinks = results
          .filter(r => (r.status === 'published' || r.status === 'success') && (r.postUrl || r.details?.postUrl))
          .map(r => {
            const url = r.postUrl || r.details?.postUrl;
            const shortName = r.platform === 'facebook' ? 'FB' : (r.platform === 'instagram' ? 'IG' : (r.platform === 'linkedin' ? 'LI' : (r.platform === 'pinterest' ? 'Pin' : (r.platform === 'youtube' ? 'YT' : r.platform.substring(0, 3).toUpperCase()))));
            return `
              <a href="${encodeURI(url)}" target="_blank" class="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.1] text-gray-200 border border-apple-border text-[10px] font-bold inline-flex items-center space-x-1 transition" title="Open live ${r.platform} post">
                <span>${shortName} ↗</span>
              </a>
            `;
          }).join('');

        actionHtml = `
          <div class="flex items-center space-x-1.5 justify-end">
            ${liveLinks || `<span class="text-[10px] text-emerald-400/80">✅ Dispatched</span>`}
            <button onclick="openDispatchModal(window._queueCache?.find(q => q.id === '${item.id}') || { id: '${item.id}', title: '${escapeHtml(item.title)}', targets: ${JSON.stringify(item.targets || [])} }, ${JSON.stringify(results).replace(/"/g, '&quot;')})" class="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.1] text-gray-300 border border-apple-border text-[10px]" title="Inspect Dispatch Results">
              <i class="fa-solid fa-list-check text-[9px]"></i>
            </button>
          </div>
        `;
      }

      tr.innerHTML = `
        <td class="px-4 py-3 font-semibold text-white whitespace-nowrap">
          <div>${timeStr}</div>
          <div class="text-[10px] text-gray-500">${dateStr} ${countdown ? `<span class="text-amber-400/80">(${countdown})</span>` : ''}</div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">${typeBadge}</td>
        <td class="px-4 py-3 font-medium text-gray-200 max-w-xs">
          <div class="truncate">${escapeHtml(item.title)}</div>
          ${inlineErrorHtml}
        </td>
        <td class="px-4 py-3 whitespace-nowrap">${targets}</td>
        <td class="px-4 py-3 text-emerald-400 font-mono text-[10px] whitespace-nowrap">${spacingText}</td>
        <td class="px-4 py-3 whitespace-nowrap">${statusBadge}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap space-x-1.5">${actionHtml}</td>
      `;
      tbody.appendChild(tr);
    });

    window._queueCache = queue;
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
    refreshLiveTrackerHUD();
    alert(`Dispatched all ${data.count} items to connected channels! ✅\nCheck the Telegram report on your mobile.`);
  } catch (err) {
    alert(`Bulk Publish Error: ${err.message}`);
  }
}

// Alias for HUD button
function publishAllQueueNow() {
  publishAllQueuedNow();
}

// 🚀 LIVE DESTINATION PUBLISHING RADAR & REAL-TIME TRACKING HUD
async function refreshLiveTrackerHUD() {
  try {
    const destId = currentDestination?.id || 'dest_jaisalmer';
    const res = await fetch(`/api/tracking/live-radar?destinationId=${destId}`);
    if (!res.ok) return;
    const data = await res.json();

    const dNameEl = document.getElementById('hud-dest-name');
    if (dNameEl) dNameEl.textContent = data.destinationName || currentDestination?.name || 'लेक्सा ट्रिप जैसलमेर';

    const totalEl = document.getElementById('hud-total-today');
    if (totalEl) totalEl.textContent = data.totalToday || 0;

    const queuedEl = document.getElementById('hud-queued-count');
    if (queuedEl) queuedEl.textContent = data.queuedCount || 0;

    const pubEl = document.getElementById('hud-published-count');
    if (pubEl) pubEl.textContent = data.publishedCount || 0;

    const healthEl = document.getElementById('hud-health-score');
    const healthSubEl = document.getElementById('hud-health-sub') || document.getElementById('hud-health-subtext');
    if (healthEl) {
      healthEl.textContent = `${data.healthScore ?? 100}%`;
      if (data.healthScore < 75) {
        healthEl.className = 'text-xl font-extrabold text-rose-400 mt-0.5';
      } else if (data.healthScore < 95) {
        healthEl.className = 'text-xl font-extrabold text-amber-400 mt-0.5';
      } else {
        healthEl.className = 'text-xl font-extrabold text-emerald-300 mt-0.5';
      }
    }
    if (healthSubEl) {
      healthSubEl.textContent = data.healthSubtext || (data.failedCount > 0 ? `⚠️ ${data.failedCount} टास्क विफल` : '🛡️ 0 कम्युनिटी स्ट्राइक');
    }

    // Next post spotlight
    const nextTitle = document.getElementById('hud-next-post-title');
    const nextTime = document.getElementById('hud-next-post-time');
    const nextCountdown = document.getElementById('hud-next-post-countdown');
    const nextTargets = document.getElementById('hud-next-post-targets');

    if (data.nextItem) {
      if (nextTitle) nextTitle.textContent = `पोस्ट #${data.nextItem.index || 1}: ${data.nextItem.title}`;
      if (nextTime) {
        const timeStr = new Date(data.nextItem.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        nextTime.textContent = timeStr;
      }
      if (nextCountdown) {
        const mins = data.nextItem.minutesUntilNext;
        nextCountdown.textContent = mins !== null ? (mins === 0 ? 'अभी पब्लिश हो रही है' : `लगभग ${mins} मिनट में`) : '';
      }
      if (nextTargets && data.nextItem.targets) {
        const colors = {
          instagram: 'bg-pink-500/20 text-pink-300',
          facebook: 'bg-blue-500/20 text-blue-300',
          linkedin: 'bg-sky-500/20 text-sky-300',
          pinterest: 'bg-red-500/20 text-red-300',
          blogger: 'bg-orange-500/20 text-orange-300',
          youtube: 'bg-red-600/20 text-red-300'
        };
        nextTargets.innerHTML = data.nextItem.targets.map(t => `
          <span class="px-2 py-0.5 rounded-full ${colors[t] || 'bg-white/10 text-gray-300'} text-[10px] font-mono">${t}</span>
        `).join('');
      }
    } else {
      if (nextTitle) nextTitle.textContent = 'आज के सभी पोस्ट्स पब्लिश हो चुके हैं ✅';
      if (nextTime) nextTime.textContent = 'पूर्ण';
      if (nextCountdown) nextCountdown.textContent = 'ऑल क्लियर';
      if (nextTargets) nextTargets.innerHTML = '<span class="text-[10px] text-emerald-400 font-bold">100% पब्लिश्ड</span>';
    }

    // Channels matrix grid (6 core channels)
    const grid = document.getElementById('hud-channels-grid');
    if (grid && data.channelBreakdown) {
      const icons = {
        instagram: { icon: 'fa-instagram', color: 'text-pink-400' },
        facebook: { icon: 'fa-facebook', color: 'text-blue-400' },
        linkedin: { icon: 'fa-linkedin', color: 'text-sky-400' },
        pinterest: { icon: 'fa-pinterest', color: 'text-red-400' },
        blogger: { icon: 'fa-blogger-b', color: 'text-orange-400' },
        youtube: { icon: 'fa-youtube', color: 'text-red-500' }
      };

      grid.innerHTML = Object.entries(data.channelBreakdown).map(([key, info]) => {
        const ic = icons[key] || { icon: 'fa-share-nodes', color: 'text-gray-400' };

        let statusBadge = '';
        let dotColor = 'bg-gray-600';

        if (info.failed > 0) {
          dotColor = 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
          statusBadge = `<span class="text-rose-400 font-bold">${info.failed} Failed</span>`;
        } else if (info.live > 0) {
          dotColor = 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
          statusBadge = `<span class="text-emerald-400 font-bold">${info.live} Live</span>`;
        } else if (info.queued > 0) {
          dotColor = 'bg-amber-400 shadow-[0_0_6px_#f59e0b]';
          statusBadge = `<span class="text-amber-400 font-semibold">${info.queued} Queued</span>`;
        } else {
          dotColor = info.configured ? 'bg-sky-400/50' : 'bg-gray-600';
          statusBadge = `<span class="text-gray-500 font-medium">${info.configured ? 'Ready' : 'Offline'}</span>`;
        }

        return `
          <div class="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white flex items-center space-x-1.5 truncate">
                <i class="fa-brands ${ic.icon} ${ic.color} text-xs"></i>
                <span class="text-[11px] truncate">${escapeHtml(info.name)}</span>
              </span>
              <span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span>
            </div>
            <div class="text-[10px] text-gray-400 font-mono truncate">${escapeHtml(info.handle || '')}</div>
            <div class="flex items-center justify-between text-[10px] pt-1 border-t border-white/5">
              ${statusBadge}
              <span class="text-gray-400 font-mono">${info.queued} कतार</span>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('refreshLiveTrackerHUD error:', err);
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

// Helper for XSS-safe text rendering
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- LIVE DISPATCH RESULTS MODAL ---
function openDispatchModal(item, results = []) {
  const modal = document.getElementById('dispatch-modal');
  const titleEl = document.getElementById('dispatch-modal-item-title');
  const listEl = document.getElementById('dispatch-results-list');

  if (titleEl) titleEl.textContent = item?.title || 'Social Post';
  if (listEl) {
    listEl.innerHTML = '';
    const itemTargets = item?.targets && item.targets.length > 0 ? item.targets : ['instagram', 'facebook', 'linkedin', 'pinterest'];
    const resultPlatforms = results && results.length > 0 ? results.map(r => r.platform) : [];
    const allPlatforms = Array.from(new Set([...itemTargets, ...resultPlatforms]));

    allPlatforms.forEach(t => {
      const match = results.find(r => r.platform === t);
      const isSuccess = !!match && (match.status === 'published' || match.status === 'success');
      const isFailed = !!match && (match.status === 'failed' || match.status === 'error');
      const isSkipped = !match || match.status === 'skipped' || match.status === 'omitted';

      let dotClass = 'bg-gray-500';
      let statusHtml = '';
      let errorHtml = '';

      const postUrl = match?.postUrl || match?.details?.postUrl;

      if (isSuccess) {
        dotClass = 'bg-emerald-400';
        const linkHtml = postUrl 
          ? `<a href="${encodeURI(postUrl)}" target="_blank" class="text-emerald-300 underline ml-1.5 hover:text-emerald-100 font-bold" title="Open live post">View Post ↗</a>` 
          : '';
        statusHtml = `<span class="text-emerald-400 font-semibold text-[11px]">✅ Live Dispatched ${linkHtml}</span>`;
      } else if (isFailed) {
        dotClass = 'bg-rose-400';
        const rawErr = match.error || (typeof match.details === 'string' ? match.details : (match.details?.error || match.details?.message || 'Platform API Error'));
        statusHtml = `<span class="text-rose-400 font-semibold text-[11px]">❌ Failed</span>`;
        errorHtml = `<div class="mt-1 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[10px] break-words leading-tight">${escapeHtml(rawErr)}</div>`;
      } else {
        dotClass = 'bg-gray-500';
        statusHtml = `<span class="text-gray-400 font-medium text-[11px]">⏭️ Skipped / Not Dispatched</span>`;
      }

      const row = document.createElement('div');
      row.className = 'p-2.5 rounded-xl bg-white/[0.03] border border-apple-border flex flex-col space-y-1 text-xs';
      row.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full ${dotClass}"></span>
            <span class="font-bold text-white capitalize">${escapeHtml(t)}</span>
          </div>
          <div>${statusHtml}</div>
        </div>
        ${errorHtml}
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

// --- SETTINGS & MASTER API KEYS MODAL ---
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const s = await res.json();
    
    const minEl = document.getElementById('setting-min-interval');
    const maxEl = document.getElementById('setting-max-interval');
    if (minEl) minEl.value = s.minIntervalMinutes || 60;
    if (maxEl) maxEl.value = s.maxIntervalMinutes || 90;

    const pubEl = document.getElementById('setting-public-url');
    if (pubEl) pubEl.value = s.publicBaseUrl || window.location.origin;

    const metaAppIdEl = document.getElementById('setting-meta-appid');
    const metaAppSecretEl = document.getElementById('setting-meta-appsecret');
    const metaLifetimeTokenEl = document.getElementById('setting-meta-lifetime-token');
    if (metaAppIdEl) metaAppIdEl.value = s.meta?.appId || '';
    if (metaAppSecretEl) metaAppSecretEl.value = s.meta?.appSecret || '';
    if (metaLifetimeTokenEl) metaLifetimeTokenEl.value = s.meta?.lifetimePageToken || s.meta?.masterUserToken || '';

    const tgTokenEl = document.getElementById('setting-telegram-token');
    const tgUserEl = document.getElementById('setting-telegram-botusername');
    const tgChatEl = document.getElementById('setting-telegram-allowedchatid');
    if (tgTokenEl) tgTokenEl.value = s.telegram?.botToken || '';
    if (tgUserEl) tgUserEl.value = s.telegram?.botUsername || 'lexatrip_auto_bot';
    if (tgChatEl) tgChatEl.value = s.telegram?.allowedChatId || '8455865796';

    // Restore Custom Brand Logo if saved
    const savedLogo = localStorage.getItem('lexatrip_brand_logo') || s.customLogoUrl;
    if (savedLogo) {
      const img = document.getElementById('brand-logo-img');
      const icon = document.getElementById('brand-logo-icon');
      if (img) {
        img.src = savedLogo;
        img.classList.remove('hidden');
      }
      if (icon) icon.classList.add('hidden');
    }

    // Restore Admin Profile if saved
    const savedAdminName = localStorage.getItem('lexatrip_admin_name') || s.adminProfile?.name;
    const savedAdminAvatar = localStorage.getItem('lexatrip_admin_avatar') || s.adminProfile?.avatar;
    if (savedAdminName) {
      const el = document.getElementById('user-auth-name');
      if (el) el.textContent = savedAdminName;
    }
    if (savedAdminAvatar) {
      const el = document.getElementById('user-auth-avatar');
      if (el) el.src = savedAdminAvatar;
    }

    const heroTokenStatus = document.getElementById('hero-token-status');
    if (heroTokenStatus) {
      if (s.meta?.lifetimePageToken) {
        heroTokenStatus.innerHTML = '<i class="fa-solid fa-circle-check text-[10px]"></i> <span>Lifetime Active</span>';
        heroTokenStatus.className = 'text-emerald-400 font-bold text-xs mt-0.5 flex items-center space-x-1';
      } else {
        heroTokenStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-[10px]"></i> <span>Connect Token</span>';
        heroTokenStatus.className = 'text-amber-400 font-bold text-xs mt-0.5 flex items-center space-x-1';
      }
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

function openSettingsModal() {
  loadSettings();
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

async function saveSettingsModal() {
  const minInterval = parseInt(document.getElementById('setting-min-interval')?.value, 10) || 60;
  const maxInterval = parseInt(document.getElementById('setting-max-interval')?.value, 10) || 90;
  const publicBaseUrl = document.getElementById('setting-public-url')?.value?.trim() || window.location.origin;

  const metaAppId = document.getElementById('setting-meta-appid')?.value?.trim() || '';
  const metaAppSecret = document.getElementById('setting-meta-appsecret')?.value?.trim() || '';
  const metaLifetimeToken = document.getElementById('setting-meta-lifetime-token')?.value?.trim() || '';

  const tgToken = document.getElementById('setting-telegram-token')?.value?.trim() || '';
  const tgUser = document.getElementById('setting-telegram-botusername')?.value?.trim() || 'lexatrip_auto_bot';
  const tgChat = document.getElementById('setting-telegram-allowedchatid')?.value?.trim() || '8455865796';

  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minIntervalMinutes: minInterval,
        maxIntervalMinutes: maxInterval,
        publicBaseUrl: publicBaseUrl,
        meta: {
          appId: metaAppId,
          appSecret: metaAppSecret,
          lifetimePageToken: metaLifetimeToken,
          masterUserToken: metaLifetimeToken
        },
        telegram: {
          enabled: true,
          botToken: tgToken,
          botUsername: tgUser,
          allowedChatId: tgChat
        }
      })
    });
    if (!res.ok) throw new Error('Failed to update settings');
    closeSettingsModal();
    alert('✅ Settings & Master API Keys saved and applied successfully!');
    await loadSettings();
    await loadDestinations();
  } catch (e) {
    alert('Error saving settings: ' + e.message);
  }
}

// --- BRAND LOGO UPLOAD & CUSTOMIZATION ---
function triggerLogoUpload() {
  document.getElementById('brand-logo-file')?.click();
}

function uploadBrandLogo(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    const img = document.getElementById('brand-logo-img');
    const icon = document.getElementById('brand-logo-icon');
    if (img) {
      img.src = dataUrl;
      img.classList.remove('hidden');
    }
    if (icon) icon.classList.add('hidden');
    localStorage.setItem('lexatrip_brand_logo', dataUrl);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customLogoUrl: dataUrl })
      });
    } catch (err) {}
    alert('🎉 ब्रांड लोगो सफलतापूर्वक अपलोड व अपडेट हो गया!');
  };
  reader.readAsDataURL(file);
}

// --- ADMIN PROFILE MODAL & CUSTOMIZATION ---
function openAdminProfileModal() {
  const name = localStorage.getItem('lexatrip_admin_name') || document.getElementById('user-auth-name')?.textContent || 'Lexa Admin';
  const avatar = localStorage.getItem('lexatrip_admin_avatar') || document.getElementById('user-auth-avatar')?.src || '';
  const nameInp = document.getElementById('admin-name-input');
  const prev = document.getElementById('admin-modal-avatar-preview');
  const urlInp = document.getElementById('admin-photo-url-input');
  if (nameInp) nameInp.value = name;
  if (prev && avatar) prev.src = avatar;
  if (urlInp) urlInp.value = avatar.startsWith('data:') ? '' : avatar;
  document.getElementById('admin-profile-modal')?.classList.remove('hidden');
}

function closeAdminProfileModal() {
  document.getElementById('admin-profile-modal')?.classList.add('hidden');
}

function handleAdminPhotoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const prev = document.getElementById('admin-modal-avatar-preview');
    if (prev) prev.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

async function saveAdminProfile() {
  const name = document.getElementById('admin-name-input')?.value?.trim() || 'Lexa Admin';
  const urlInp = document.getElementById('admin-photo-url-input')?.value?.trim();
  const prev = document.getElementById('admin-modal-avatar-preview');
  const avatar = urlInp || prev?.src || '';

  const nameEl = document.getElementById('user-auth-name');
  const avatarEl = document.getElementById('user-auth-avatar');
  if (nameEl) nameEl.textContent = name;
  if (avatarEl && avatar) avatarEl.src = avatar;

  localStorage.setItem('lexatrip_admin_name', name);
  if (avatar) localStorage.setItem('lexatrip_admin_avatar', avatar);

  try {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminProfile: { name, avatar } })
    });
  } catch (e) {}

  closeAdminProfileModal();
  alert('✅ एडमिनिस्ट्रेटर प्रोफाइल (नाम व फोटो) सफलतापूर्वक अपडेट हो गई!');
}

// --- DESTINATION SPECIFIC ACTIONS (DELETE & CRM TRACKER) ---
async function deleteCurrentDestination() {
  if (!currentDestination) return;
  if (destinations.length <= 1) {
    alert('⚠️ कम से कम 1 डेस्टिनेशन होना आवश्यक है! आप अंतिम डेस्टिनेशन को डिलीट नहीं कर सकते।');
    return;
  }
  const ok = confirm(`क्या आप सचमुच "${currentDestination.name}" डेस्टिनेशन को हटाना चाहते हैं?`);
  if (!ok) return;
  try {
    const res = await fetch(`/api/destinations/${currentDestination.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete destination');
    alert(`✅ डेस्टिनेशन "${currentDestination.name}" सफलतापूर्वक हटा दिया गया!`);
    await loadDestinations();
  } catch (e) {
    alert('Delete Error: ' + e.message);
  }
}

function openDestinationCRM() {
  if (!currentDestination) return;
  openCRMModal();
  const dName = document.getElementById('crm-active-dest-name');
  if (dName) dName.textContent = currentDestination.name;
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

// --- UNIVERSAL SOCIAL CRM & MASTER TOKEN CONTROLLER ---
let _crmDetectedPages = [];
let currentCRMTab = 'reports';

function switchCRMTab(tabName) {
  currentCRMTab = tabName;
  const tabs = ['reports', 'queue', 'leads', 'settings'];
  tabs.forEach(t => {
    const btn = document.getElementById(`crm-tab-btn-${t}`);
    const view = document.getElementById(`crm-tab-${t}`);
    if (t === tabName) {
      if (btn) btn.className = 'px-4 py-2 rounded-xl font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-2 transition shadow-sm whitespace-nowrap';
      if (view) view.classList.remove('hidden');
    } else {
      if (btn) btn.className = 'px-4 py-2 rounded-xl font-semibold text-gray-300 hover:text-white hover:bg-white/5 border border-transparent flex items-center space-x-2 transition whitespace-nowrap';
      if (view) view.classList.add('hidden');
    }
  });
}

async function openCRMModal() {
  const modal = document.getElementById('crm-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  const dName = document.getElementById('crm-active-dest-name');
  const dSub = document.getElementById('crm-active-dest-name-sub');
  const activeName = currentDestination?.name || 'लेक्सा ट्रिप जैसलमेर (Lexa Trip Jaisalmer)';
  if (dName) dName.textContent = activeName;
  if (dSub) dSub.textContent = activeName;
  switchCRMTab('reports');
  await loadCRMData();
}

function closeCRMModal() {
  const modal = document.getElementById('crm-modal');
  if (modal) modal.classList.add('hidden');
}

async function loadCRMData() {
  try {
    const destId = currentDestination?.id || 'dest_jaisalmer';
    const res = await fetch(`/api/crm?destinationId=${destId}`);
    if (!res.ok) return;
    const data = await res.json();

    // Summary Metric Stats
    const pCount = document.getElementById('crm-stat-published');
    const qCount = document.getElementById('crm-stat-queued');
    const qBadge = document.getElementById('crm-tab-queue-badge');
    if (pCount) pCount.textContent = data.stats?.totalPublished ?? 48;
    if (qCount) qCount.textContent = data.stats?.totalQueued ?? 7;
    if (qBadge) qBadge.textContent = data.stats?.totalQueued ?? 7;

    // Render Recent Published Dispatches with Clickable Links
    const dispatchesList = document.getElementById('crm-dispatches-list');
    if (dispatchesList && Array.isArray(data.recentDispatches)) {
      if (data.recentDispatches.length === 0) {
        dispatchesList.innerHTML = '<div class="text-xs text-gray-500 py-6 text-center">आज की कोई पोस्ट अभी पब्लिश नहीं हुई है।</div>';
      } else {
        dispatchesList.innerHTML = data.recentDispatches.map((item, idx) => {
          const d = new Date(item.publishedAt);
          const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
          const typeBadge = item.itemType === 'reel' 
            ? '<span class="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold">🎬 Reel</span>'
            : (item.itemType === 'carousel'
                ? '<span class="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold">📑 Carousel</span>'
                : `<span class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">📸 Post #${item.index || (idx+1)}</span>`);

          return `
            <div class="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-apple-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  ${typeBadge}
                  <h5 class="text-xs font-bold text-white truncate max-w-md">${item.title}</h5>
                  <span class="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20">🟢 Live</span>
                </div>
                <div class="flex items-center space-x-3 text-[11px] text-gray-400">
                  <span><i class="fa-regular fa-clock text-[10px] mr-1"></i>${dateStr} at ${timeStr}</span>
                  <span>•</span>
                  <span>डेस्टिनेशन: ${data.destinationName || 'जैसलमेर'}</span>
                </div>
              </div>

              <!-- Clickable Direct Links for this post -->
              <div class="flex items-center space-x-1.5 flex-wrap gap-1">
                <a href="${item.liveLinks?.facebook || currentDestination?.channels?.facebook?.handle || 'https://www.facebook.com/profile.php?id=61594513580628'}" target="_blank" class="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold inline-flex items-center space-x-1 transition" title="Open Live Facebook Page">
                  <i class="fa-brands fa-facebook"></i>
                  <span>FB ↗</span>
                </a>
                <a href="${item.liveLinks?.instagram || (currentDestination?.channels?.instagram?.handle ? 'https://www.instagram.com/' + currentDestination.channels.instagram.handle.replace(/^@/, '') + '/' : 'https://www.instagram.com/lexatripjaisalmer/')}" target="_blank" class="px-2.5 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-[11px] font-semibold inline-flex items-center space-x-1 transition" title="Open Live Instagram Profile">
                  <i class="fa-brands fa-instagram"></i>
                  <span>IG ↗</span>
                </a>
                <a href="${item.liveLinks?.telegram || (currentDestination?.telegram?.channelUsername ? 'https://t.me/' + currentDestination.telegram.channelUsername.replace(/^@/, '') : 'https://t.me/lexatripjaisalmer')}" target="_blank" class="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[11px] font-semibold inline-flex items-center space-x-1 transition" title="Open Telegram Channel">
                  <i class="fa-brands fa-telegram"></i>
                  <span>TG ↗</span>
                </a>
                <a href="${item.liveLinks?.pinterest || (currentDestination?.channels?.pinterest?.handle ? 'https://' + currentDestination.channels.pinterest.handle.replace(/^https?:\/\//, '') : 'https://www.pinterest.com/lexatripjaisalmer/')}" target="_blank" class="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold inline-flex items-center space-x-1 transition" title="Open Pinterest Board">
                  <i class="fa-brands fa-pinterest"></i>
                  <span>Pin ↗</span>
                </a>
                <a href="${item.liveLinks?.linkedin || currentDestination?.channels?.linkedin?.handle || 'https://www.linkedin.com/company/144145872/'}" target="_blank" class="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold inline-flex items-center space-x-1 transition" title="Open LinkedIn Page">
                  <i class="fa-brands fa-linkedin"></i>
                  <span>IN ↗</span>
                </a>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Upcoming Queue in CRM Tab 2
    const queueList = document.getElementById('crm-queue-list');
    if (queueList && Array.isArray(data.upcomingQueue)) {
      if (data.upcomingQueue.length === 0) {
        queueList.innerHTML = '<div class="text-xs text-gray-500 py-6 text-center">आज की सभी पोस्ट्स पब्लिश हो चुकी हैं। कोई आगामी टास्क कतार में नहीं है।</div>';
      } else {
        queueList.innerHTML = data.upcomingQueue.map(item => {
          const d = new Date(item.scheduledTime);
          const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          const countdownText = item.countdownMinutes > 0 
            ? (item.countdownMinutes > 60 ? `लगभग ${Math.floor(item.countdownMinutes/60)} घंटे बाद` : `${item.countdownMinutes} मिनट बाद`)
            : 'अभी देय (Due Now)';

          return `
            <div class="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-apple-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    ${item.itemType === 'reel' ? '🎬 Reel' : item.itemType === 'carousel' ? '📑 Carousel' : `📸 Post #${item.index || 1}`}
                  </span>
                  <h5 class="text-xs font-bold text-white truncate max-w-md">${item.title}</h5>
                </div>
                <div class="flex items-center space-x-3 text-[11px] text-gray-400">
                  <span class="text-amber-300/90 font-medium"><i class="fa-regular fa-clock text-[10px] mr-1"></i>${dateStr} (${timeStr})</span>
                  <span>•</span>
                  <span class="text-emerald-400 font-mono">⏳ ${countdownText}</span>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <button onclick="publishQueueItemNow('${item.id}'); setTimeout(loadCRMData, 1000);" class="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition">
                  <i class="fa-solid fa-bolt text-[10px]"></i>
                  <span>⚡ 1-Click Publish Now</span>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Auto-populate Master Token & App Secret fields
    const mToken = document.getElementById('crm-master-token');
    const aSecret = document.getElementById('crm-app-secret');
    if (mToken && data.masterToken) mToken.value = data.masterToken;
    if (aSecret && data.appSecret) aSecret.value = data.appSecret;

    // Render Auto-Loaded Active Pages
    const pagesContainer = document.getElementById('crm-active-pages-list');
    if (pagesContainer && Array.isArray(data.activePages)) {
      pagesContainer.innerHTML = data.activePages.map(p => `
        <div class="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <div class="flex items-center space-x-2">
            <i class="fa-brands fa-facebook text-blue-400 text-sm"></i>
            <div>
              <span class="text-white font-bold">${p.pageName || 'Facebook Page'}</span>
              <span class="text-[10px] text-gray-400 font-mono ml-1.5">(ID: ${p.pageId})</span>
              ${p.instagramHandle ? `<span class="text-pink-400 text-[10px] ml-2">📸 ${p.instagramHandle}</span>` : ''}
            </div>
          </div>
          <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">🟢 Active Linked</span>
        </div>
      `).join('');
    }

    const tReply = document.getElementById('crm-toggle-autoreply');
    const tDm = document.getElementById('crm-toggle-autodm');
    if (tReply) tReply.checked = !!data.autoReplyEnabled;
    if (tDm) tDm.checked = !!data.autoDmEnabled;
    renderCRMLeads(data.leads || []);
  } catch (e) {
    console.error('Error loading CRM data:', e);
  }
}

function renderCRMLeads(leads) {
  const container = document.getElementById('crm-leads-feed');
  if (!container) return;
  if (!leads || leads.length === 0) {
    container.innerHTML = '<div class="text-[11px] text-gray-500 text-center py-4">No customer interactions logged yet.</div>';
    return;
  }
  container.innerHTML = leads.map(l => `
    <div class="p-3 rounded-2xl bg-black/40 border border-apple-border/70 text-xs space-y-2">
      <div class="flex items-center justify-between">
        <span class="font-bold text-white flex items-center space-x-2">
          <i class="fa-brands fa-${l.platform === 'instagram' ? 'instagram text-pink-400' : 'facebook text-blue-400'}"></i>
          <span>${l.name}</span>
          <span class="text-[11px] text-gray-400 font-mono">${l.handle}</span>
        </span>
        <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">${l.status}</span>
      </div>
      <p class="text-gray-200 text-xs">💬 "${l.lastMessage}"</p>
      ${l.replySent ? `<p class="text-apple-gold text-[11px] pl-3 border-l-2 border-apple-gold/40">↳ Auto-Reply: ${l.replySent.slice(0, 100)}...</p>` : ''}
      <div class="flex items-center justify-between pt-1">
        <a href="https://wa.me/919079854982?text=${encodeURIComponent('नमस्ते ' + l.name + '! लेक्सा ट्रिप में आपका स्वागत है।')}" target="_blank" class="px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold inline-flex items-center space-x-1.5 transition">
          <i class="fa-brands fa-whatsapp text-emerald-400"></i>
          <span>WhatsApp पर चैट करें (+91 90798 54982) ↗</span>
        </a>
        <a href="https://bookings.lexatrip.com/" target="_blank" class="text-[11px] text-teal-300 hover:underline">बुकिंग पोर्टल ↗</a>
      </div>
    </div>
  `).join('');
}

async function saveCRMToggles() {
  const autoReply = document.getElementById('crm-toggle-autoreply')?.checked;
  const autoDm = document.getElementById('crm-toggle-autodm')?.checked;
  await fetch('/api/crm/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoReplyEnabled: autoReply, autoDmEnabled: autoDm })
  });
}

async function syncAllMetaPagesFromMaster() {
  const userToken = document.getElementById('crm-master-token').value.trim();
  const appSecret = document.getElementById('crm-app-secret').value.trim();
  if (!userToken) {
    alert('Please paste your Master Meta Token first!');
    return;
  }

  const container = document.getElementById('crm-detected-pages-container');
  const select = document.getElementById('crm-detected-pages-select');
  select.innerHTML = '<option value="">Detecting pages...</option>';
  container.classList.remove('hidden');

  try {
    const res = await fetch('/api/social/meta/exchange-long-lived', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userToken, appId: '1610475786797567', appSecret })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    _crmDetectedPages = data.pages || [];
    if (_crmDetectedPages.length === 0) {
      select.innerHTML = '<option value="">No pages found with pages_show_list permission.</option>';
      return;
    }

    select.innerHTML = '<option value="">-- Choose Page to Link --</option>';
    _crmDetectedPages.forEach((p, idx) => {
      const ig = p.instagram ? ` (Instagram: @${p.instagram.username})` : ' (No Instagram linked)';
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${p.pageName}${ig}`;
      select.appendChild(opt);
    });

    alert(`⚡ Found ${_crmDetectedPages.length} Pages! Choose one from the dropdown to link to ${currentDestination?.name || 'Active Destination'}.`);
  } catch (err) {
    alert('Error detecting pages: ' + err.message);
  }
}

async function linkSelectedPageToActiveDestination() {
  const select = document.getElementById('crm-detected-pages-select');
  const idx = select.value;
  if (idx === '' || !_crmDetectedPages[idx]) {
    alert('Please select a page from the dropdown first!');
    return;
  }

  const selected = _crmDetectedPages[idx];
  if (!currentDestination) return;

  currentDestination.channels = currentDestination.channels || {};
  currentDestination.channels.facebook = {
    enabled: true,
    name: selected.pageName,
    handle: `facebook.com/${selected.pageId}`,
    authType: 'permanent_api_token',
    credentials: {
      pageId: selected.pageId,
      pageAccessToken: selected.pageAccessToken
    },
    supports: ['post', 'carousel', 'reel']
  };

  if (selected.instagram) {
    currentDestination.channels.instagram = {
      enabled: true,
      name: selected.instagram.name || selected.pageName,
      handle: `@${selected.instagram.username}`,
      authType: 'permanent_api_token',
      credentials: {
        instagramAccountId: selected.instagram.id,
        accessToken: selected.pageAccessToken
      },
      supports: ['post', 'carousel', 'reel']
    };
  }

  try {
    const res = await fetch(`/api/destinations/${currentDestination.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentDestination)
    });
    if (!res.ok) throw new Error('Failed to save destination');

    await loadDestinations();
    alert(`🎉 Successfully linked "${selected.pageName}" to ${currentDestination.name}!`);
    closeCRMModal();
  } catch (e) {
    alert('Error linking page: ' + e.message);
  }
}

async function testCRMLeadSimulation() {
  const simulatedInquiry = {
    platform: 'instagram',
    senderName: 'Vikas Shekhawat',
    senderId: '@vikas_travel_vlogs',
    text: 'What are the charges for Jaisalmer desert camping and camel ride for 2 people?',
    destinationName: currentDestination?.name || 'Lexa Trip Jaisalmer'
  };

  try {
    const res = await fetch('/api/crm/simulate-interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simulatedInquiry)
    });
    const result = await res.json();
    await loadCRMData();
    alert(`✅ Auto-Reply Simulation Triggered!\n\nCustomer Inquiry: "${simulatedInquiry.text}"\n\n🤖 Automated Reply: "${result.publicReply}"\n\n📨 Auto-DM Sent: "${result.dmSent || 'N/A'}"`);
  } catch (err) {
    alert('Simulation error: ' + err.message);
  }
}

// ==========================================
// 🤖 REDDIT & QUORA AI Q&A & ANTI-SPAM DRIP ENGINE
// ==========================================

function openQAModal() {
  const modal = document.getElementById('qa-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  // Sync destination if selected
  if (currentDestination && currentDestination.name) {
    const destSelect = document.getElementById('qa-destination-select');
    if (destSelect) {
      if (currentDestination.name.includes('Mount Abu')) destSelect.value = 'Mount Abu';
      else if (currentDestination.name.includes('Jaisalmer')) destSelect.value = 'Jaisalmer';
    }
  }

  // Load sample question if empty
  const qInput = document.getElementById('qa-question-input');
  if (qInput && !qInput.value.trim()) {
    loadSampleQA(1);
  }

  refreshQAQueue();
}

function closeQAModal() {
  const modal = document.getElementById('qa-modal');
  if (modal) modal.classList.add('hidden');
}

function loadSampleQA(type) {
  const qInput = document.getElementById('qa-question-input');
  const catSelect = document.getElementById('qa-category-select');
  if (!qInput) return;

  if (type === 1) {
    qInput.value = "Which is the best and cleanest desert camp in Sam Sand Dunes Jaisalmer for family with kids? Looking for authentic Rajasthani cultural music and clean private dunes.";
    if (catSelect) catSelect.value = 'family';
  } else if (type === 2) {
    qInput.value = "We are planning a 3-day corporate offsite in Jaisalmer for 60 employees. Do luxury camps have proper Wi-Fi/conference setup, team building activities, and GST corporate invoicing?";
    if (catSelect) catSelect.value = 'corporate';
  } else if (type === 3) {
    qInput.value = "How much does camel safari and jeep dune bashing actually cost in Jaisalmer? What is the best sunset timing and how to avoid roadside tourist traps?";
    if (catSelect) catSelect.value = 'budget';
  }
}

async function generateAIAnswer() {
  const qInput = document.getElementById('qa-question-input');
  const destSelect = document.getElementById('qa-destination-select');
  const catSelect = document.getElementById('qa-category-select');
  const platformSelect = document.getElementById('qa-platform-select');
  const notesInput = document.getElementById('qa-custom-notes');
  const btn = document.getElementById('qa-generate-btn');
  const preview = document.getElementById('qa-answer-preview');
  const targetLinkBtn = document.getElementById('qa-target-link-btn');

  if (!qInput || !qInput.value.trim()) {
    alert('Please enter or select a traveler question to answer.');
    return;
  }

  const question = qInput.value.trim();
  const destination = destSelect ? destSelect.value : 'Jaisalmer';
  const category = catSelect ? catSelect.value : 'general';
  const platform = platformSelect ? platformSelect.value : 'reddit';
  const customNotes = notesInput ? notesInput.value.trim() : '';

  const originalBtnText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Generating Human-Friendly 80/20 Value Answer...`;
  }

  try {
    const res = await fetch('/api/qa/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, destination, category, platform, customNotes })
    });
    const data = await res.json();

    if (data.answer) {
      if (preview) preview.value = data.answer;

      // Update target forum link
      if (targetLinkBtn) {
        if (platform === 'reddit') {
          const sub = destination.toLowerCase().includes('jaisalmer') ? 'rajasthan' : (destination.toLowerCase().includes('manali') ? 'himachal' : 'IndiaTravel');
          targetLinkBtn.href = `https://www.reddit.com/r/${sub}/`;
          targetLinkBtn.innerHTML = `<i class="fa-brands fa-reddit text-rose-400 mr-1.5"></i> Open r/${sub}`;
        } else {
          targetLinkBtn.href = `https://www.quora.com/search?q=${encodeURIComponent(destination + ' travel')}`;
          targetLinkBtn.innerHTML = `<i class="fa-brands fa-quora text-red-500 mr-1.5"></i> Open Quora`;
        }
      }
    } else {
      alert('Failed to generate answer. Please check AI key in Settings.');
    }
  } catch (err) {
    alert('Error generating answer: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }
  }
}

function copyQAAnswer() {
  const preview = document.getElementById('qa-answer-preview');
  if (!preview || !preview.value.trim()) {
    alert('No answer to copy! Please generate an answer first.');
    return;
  }
  navigator.clipboard.writeText(preview.value).then(() => {
    alert('✅ Formatted answer copied to clipboard!\n\nYou can now paste it directly into Reddit or Quora with 100% human-looking authenticity.');
  }).catch(() => {
    preview.select();
    document.execCommand('copy');
    alert('✅ Copied to clipboard!');
  });
}

async function addToQADripQueue() {
  const qInput = document.getElementById('qa-question-input');
  const preview = document.getElementById('qa-answer-preview');
  const destSelect = document.getElementById('qa-destination-select');
  const catSelect = document.getElementById('qa-category-select');
  const platformSelect = document.getElementById('qa-platform-select');

  if (!preview || !preview.value.trim()) {
    alert('Please generate an answer first before adding to queue.');
    return;
  }

  const payload = {
    platform: platformSelect ? platformSelect.value : 'reddit',
    destination: destSelect ? destSelect.value : 'Jaisalmer',
    category: catSelect ? catSelect.value : 'general',
    question: qInput ? qInput.value.trim() : 'Travel Query',
    answer: preview.value.trim(),
    autoSchedule: true
  };

  try {
    const res = await fetch('/api/qa/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      alert(`⏳ Added to Anti-Spam Drip Queue!\n\nScheduled for: ${new Date(result.item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\nSpaced out by 45-60 minutes to protect your account reputation.`);
      refreshQAQueue();
    }
  } catch (err) {
    alert('Queue error: ' + err.message);
  }
}

async function refreshQAQueue() {
  const tbody = document.getElementById('qa-queue-tbody');
  const countEl = document.getElementById('qa-queue-count');
  if (!tbody) return;

  try {
    const res = await fetch('/api/qa/queue');
    const queue = await res.json();

    if (countEl) countEl.innerText = `${queue.length} item${queue.length === 1 ? '' : 's'}`;

    if (!queue || queue.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-3 py-4 text-center text-gray-500">
            No queued responses yet. Generate and add Q&A above to activate anti-spam drip scheduling.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = queue.map(item => {
      const scheduledDate = new Date(item.scheduledTime);
      const isPast = scheduledDate < new Date();
      const statusColor = item.status === 'published' 
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
        : (item.status === 'scheduled' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30');

      return `
        <tr class="hover:bg-white/[0.02] transition">
          <td class="px-3 py-2.5 font-bold flex items-center space-x-1.5">
            ${item.platform === 'reddit' 
              ? '<i class="fa-brands fa-reddit text-rose-400 text-sm"></i><span class="text-white">Reddit</span>' 
              : '<i class="fa-brands fa-quora text-red-500 text-sm"></i><span class="text-white">Quora</span>'}
          </td>
          <td class="px-3 py-2.5 text-gray-300">${item.destination || 'All'}</td>
          <td class="px-3 py-2.5">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-apple-border text-gray-300 uppercase">${item.category || 'General'}</span>
          </td>
          <td class="px-3 py-2.5 text-gray-200 max-w-xs truncate" title="${item.question}">${item.question}</td>
          <td class="px-3 py-2.5 font-mono text-[11px] text-gray-400">
            ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <span class="text-[9px] text-gray-500 block">${scheduledDate.toLocaleDateString()}</span>
          </td>
          <td class="px-3 py-2.5">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor} capitalize">${item.status}</span>
          </td>
          <td class="px-3 py-2.5 text-right space-x-1">
            <button onclick="copyQueueItemAnswer('${item.id}')" title="Copy Answer" class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition text-xs">
              <i class="fa-regular fa-copy"></i>
            </button>
            <button onclick="approveQueueItem('${item.id}')" title="Mark Published / Approved" class="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition text-xs">
              <i class="fa-solid fa-check"></i>
            </button>
            <button onclick="deleteQueueItem('${item.id}')" title="Delete" class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition text-xs">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('refreshQAQueue error:', err);
  }
}

async function copyQueueItemAnswer(id) {
  try {
    const res = await fetch('/api/qa/queue');
    const queue = await res.json();
    const item = queue.find(q => q.id === id);
    if (item && item.answer) {
      navigator.clipboard.writeText(item.answer).then(() => {
        alert('✅ Formatted answer copied to clipboard!');
      });
    }
  } catch (e) {
    alert('Copy error: ' + e.message);
  }
}

async function approveQueueItem(id) {
  try {
    const res = await fetch(`/api/qa/queue/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' })
    });
    if (res.ok) refreshQAQueue();
  } catch (e) {
    alert('Error updating status: ' + e.message);
  }
}

async function deleteQueueItem(id) {
  if (!confirm('Are you sure you want to delete this queued response?')) return;
  try {
    const res = await fetch(`/api/qa/queue/${id}`, { method: 'DELETE' });
    if (res.ok) refreshQAQueue();
  } catch (e) {
    alert('Error deleting item: ' + e.message);
  }
}


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

    return `
      <div class="glass-card rounded-2xl p-5 border border-white/10 hover:border-apple-gold/50 transition-all group flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}"></span>
                <span class="text-[10px] uppercase font-bold tracking-wider text-apple-gold">${d.state || 'India'}</span>
              </div>
              <h4 class="text-sm font-extrabold text-white mt-1 group-hover:text-amber-300 transition">${d.name}</h4>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${activeCount > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400'}">
              ${activeCount} एक्टिव चैनल्स
            </span>
          </div>

          <p class="text-xs text-gray-400 line-clamp-2">${d.tagline || 'Exclusive travel luxury experiences & automated social campaigns.'}</p>

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
          <span class="text-[10px] text-gray-500">ID: ${d.id}</span>
          <button onclick="openDestinationDetail('${d.id}')" class="px-3.5 py-1.5 rounded-xl bg-apple-gold/15 hover:bg-apple-gold/30 text-apple-gold border border-apple-gold/30 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm">
            <span>क्लिक करके मैनेज करें</span>
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </div>
    `;
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
        const chs = currentDestination?.channels || {};
        const fbUrl = chs.facebook?.handle || 'https://www.facebook.com/profile.php?id=61594513580628';
        const igHandle = chs.instagram?.handle ? chs.instagram.handle.replace(/^@/, '') : 'lexatripjaisalmer';
        const tgHandle = currentDestination?.telegram?.channelUsername ? currentDestination.telegram.channelUsername.replace(/^@/, '') : 'lexatripjaisalmer';
        const pinUrl = chs.pinterest?.handle ? `https://${chs.pinterest.handle.replace(/^https?:\/\//, '')}` : 'https://www.pinterest.com/lexatripjaisalmer/';
        const liUrl = chs.linkedin?.handle || 'https://www.linkedin.com/company/144145872/';

        dispatchesContainer.innerHTML = `
          <div class="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <p class="text-gray-300 font-bold">✅ हालिया पब्लिश की गई पोस्ट्स व रील्स के लाइव वेरिफिकेशन लिंक्स:</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <a href="${fbUrl}" target="_blank" class="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 flex items-center space-x-1.5 transition">
                <i class="fa-brands fa-facebook"></i> <span>Facebook ↗</span>
              </a>
              <a href="https://www.instagram.com/${igHandle}/" target="_blank" class="p-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 flex items-center space-x-1.5 transition">
                <i class="fa-brands fa-instagram"></i> <span>Instagram ↗</span>
              </a>
              <a href="https://t.me/${tgHandle}" target="_blank" class="p-2 rounded-lg bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] flex items-center space-x-1.5 transition">
                <i class="fa-brands fa-telegram"></i> <span>Telegram Channel ↗</span>
              </a>
              <a href="${pinUrl}" target="_blank" class="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 flex items-center space-x-1.5 transition">
                <i class="fa-brands fa-pinterest"></i> <span>Pinterest ↗</span>
              </a>
              <a href="${liUrl}" target="_blank" class="p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 flex items-center space-x-1.5 transition">
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
        `;
      } else {
        dispatchesContainer.innerHTML = published.slice(0, 10).map((p, idx) => `
          <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span class="font-bold text-white text-xs">${idx + 1}. ${p.title || 'Lexa Trip Live Post'}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 uppercase font-bold">${p.itemType || 'post'}</span>
              </div>
              <p class="text-[11px] text-gray-400 mt-0.5">${p.caption ? p.caption.substring(0, 80) + '...' : 'Live luxury travel campaign.'}</p>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
              <a href="${p.liveUrl || 'https://www.facebook.com/profile.php?id=61594513580628'}" target="_blank" class="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-apple-gold border border-apple-gold/30 text-xs font-bold transition flex items-center space-x-1">
                <span>लाइव लिंक ↗</span>
              </a>
            </div>
          </div>
        `).join('');
      }
    }

    if (queueContainer) {
      if (queued.length === 0) {
        queueContainer.innerHTML = '<div class="p-4 rounded-xl bg-white/[0.02] text-gray-400 text-xs text-center">फिलहाल कतार खाली है। स्टूडियो से 1-क्लिक शेड्यूल दबाकर 6 पोस्ट्स व 6 रील्स कतार में जोड़ें।</div>';
      } else {
        queueContainer.innerHTML = queued.map((q, idx) => `
          <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">${idx + 1}</span>
              <div>
                <h5 class="font-bold text-white text-xs">${q.title || 'Scheduled Post'}</h5>
                <p class="text-[10px] text-gray-400"><i class="fa-regular fa-clock"></i> शेड्यूल समय: ${new Date(q.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (60-90m अंतराल)</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">⏳ कतार में</span>
          </div>
        `).join('');
      }
    }

    if (leadsContainer) {
      leadsContainer.innerHTML = `
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
      `;
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


// ===================================================================
// ⚡ LIVE WORK DRAWER & STORAGE AUTO-CLEANUP CLIENT LOGIC
// ===================================================================

function toggleLiveWorkDrawer() {
  const drawer = document.getElementById('live-work-drawer');
  if (!drawer) return;
  if (drawer.classList.contains('hidden')) {
    drawer.classList.remove('hidden');
    loadLiveWorkStats();
  } else {
    drawer.classList.add('hidden');
  }
}

async function loadLiveWorkStats() {
  try {
    const res = await fetch('/api/storage');
    if (res.ok) {
      const stats = await res.json();
      const el = document.getElementById('live-work-storage-info');
      if (el) {
        el.textContent = `लोकल डिस्क: ${stats.totalMB} MB (${stats.totalFiles} फाइल्स) · ऑटो-क्लीनअप सक्रिय`;
      }
    }
  } catch (e) {}

  try {
    const res2 = await fetch('/api/queue');
    if (res2.ok) {
      const queue = await res2.json();
      const next = queue.find(q => q.status === 'queued');
      const el2 = document.getElementById('live-work-next-task');
      if (el2) {
        if (next) {
          const time = new Date(next.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          el2.textContent = `आगामी टास्क: ${next.title?.substring(0, 30)}... @ ${time}`;
        } else {
          el2.textContent = 'आगामी टास्क: कतार स्टैंडबाय में है।';
        }
      }
    }
  } catch (e) {}
}

async function triggerStorageCleanupNow() {
  try {
    const res = await fetch('/api/storage/cleanup', { method: 'POST' });
    const data = await res.json();
    alert(`🧹 स्टोरेज क्लीनअप सफल!\n\n${data.deletedCount} पब्लिश हो चुकी फाइल्स डिलीट की गईं।\n${data.freedMB} MB डिस्क स्पेस खाली किया गया।\n(सोशल मीडिया पर सभी पोस्ट्स सुरक्षित रहेंगी)`);
    loadLiveWorkStats();
  } catch (err) {
    alert('क्लीनअप त्रुटि: ' + err.message);
  }
}
