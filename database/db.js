const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

const defaultData = {
  settings: {
    brandName: 'Lexa Trip',
    minIntervalMinutes: 60,
    maxIntervalMinutes: 90,
    jitterMinutes: 10,
    activeHoursStart: 8,
    activeHoursEnd: 23,
    proxyEnabled: false,
    proxyUrl: '',
    videoSettings: {
      durationSeconds: 12.0,
      slideDurations: [2, 2, 2, 2, 4], // 2s, 2s, 2s, 2s, 4s = 12s total
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      imageFit: 'contain_blur', // contain_blur or contain_black
      fps: 30,
      bitrate: '8000k'
    },
    telegram: {
      enabled: false,
      botToken: '',
      allowedChatId: ''
    }
  },
  destinations: [
    {
      id: 'dest_jaisalmer',
      name: 'लेक्सा ट्रिप जैसलमेर (Lexa Trip Jaisalmer)',
      slug: 'jaisalmer',
      state: 'Rajasthan',
      tagline: 'Unforgettable Golden Dunes & Luxury Desert Experiences',
      website: 'https://lexatrip.com/jaisalmer',
      phone: '+91 98765 43210',
      proxy: '',
      channels: {
        facebook: {
          enabled: true,
          name: 'Facebook Page - Lexa Trip Jaisalmer',
          handle: 'facebook.com/lexatripjaisalmer',
          authType: 'api_token',
          credentials: { pageAccessToken: '', pageId: '' },
          supports: ['post', 'carousel', 'reel']
        },
        instagram: {
          enabled: true,
          name: 'Instagram - Lexa Trip Jaisalmer',
          handle: '@lexatripjaisalmer',
          authType: 'api_token',
          credentials: { accessToken: '', instagramAccountId: '' },
          supports: ['post', 'carousel', 'reel']
        },
        linkedin: {
          enabled: true,
          name: 'LinkedIn - Lexa Trip Jaisalmer',
          handle: 'linkedin.com/company/lexatripjaisalmer',
          authType: 'api_token',
          credentials: { accessToken: '', organizationUrn: '' },
          supports: ['post', 'carousel']
        },
        pinterest: {
          enabled: true,
          name: 'Pinterest - Lexa Trip Jaisalmer',
          handle: 'pinterest.com/lexatripjaisalmer',
          authType: 'api_token',
          credentials: { accessToken: '', boardId: '' },
          supports: ['post', 'reel']
        },
        youtube: {
          enabled: true,
          name: 'YouTube - Lexa Trip Jaisalmer',
          handle: 'youtube.com/@lexatripjaisalmer',
          authType: 'api_token',
          credentials: { apiKey: '', channelId: '' },
          supports: ['reel']
        },
        blogger: {
          enabled: true,
          name: 'Blogger (.blogspot.com) - Lexa Trip Jaisalmer',
          handle: 'lexatripjaisalmer.blogspot.com',
          authType: 'api_token',
          credentials: { blogId: '', apiKey: '' },
          supports: ['post']
        },
        twitter: {
          enabled: false,
          isComingSoon: true,
          name: 'X / Twitter (Future Ready)',
          handle: '@lexatripjaisalmer',
          authType: 'api_token',
          credentials: { apiKey: '', apiSecret: '', bearerToken: '' },
          supports: ['post', 'reel']
        }
      },
      defaultChannels: {
        post: ['instagram', 'facebook', 'linkedin', 'pinterest', 'blogger'],
        reel: ['instagram', 'facebook', 'youtube', 'pinterest'],
        carousel: ['instagram', 'facebook', 'linkedin']
      },
      customChannels: []
    },
    {
      id: 'dest_mountabu',
      name: 'लेक्सा ट्रिप माउंट आबू (Lexa Trip Mount Abu)',
      slug: 'mountabu',
      state: 'Rajasthan',
      tagline: 'The Serene Hill Station Oasis of Rajasthan - Nakki Lake & Dilwara',
      website: 'https://lexatrip.com/mountabu',
      phone: '+91 98765 43211',
      proxy: '',
      channels: {
        facebook: {
          enabled: true,
          name: 'Facebook Page - Lexa Trip Mount Abu',
          handle: 'facebook.com/lexatripmountabu',
          authType: 'api_token',
          credentials: { pageAccessToken: '', pageId: '' },
          supports: ['post', 'carousel', 'reel']
        },
        instagram: {
          enabled: true,
          name: 'Instagram - Lexa Trip Mount Abu',
          handle: '@lexatripmountabu',
          authType: 'api_token',
          credentials: { accessToken: '', instagramAccountId: '' },
          supports: ['post', 'carousel', 'reel']
        },
        linkedin: {
          enabled: true,
          name: 'LinkedIn - Lexa Trip Mount Abu',
          handle: 'linkedin.com/company/lexatripmountabu',
          authType: 'api_token',
          credentials: { accessToken: '', organizationUrn: '' },
          supports: ['post', 'carousel']
        },
        pinterest: {
          enabled: true,
          name: 'Pinterest - Lexa Trip Mount Abu',
          handle: 'pinterest.com/lexatripmountabu',
          authType: 'api_token',
          credentials: { accessToken: '', boardId: '' },
          supports: ['post', 'reel']
        },
        youtube: {
          enabled: true,
          name: 'YouTube - Lexa Trip Mount Abu',
          handle: 'youtube.com/@lexatripmountabu',
          authType: 'api_token',
          credentials: { apiKey: '', channelId: '' },
          supports: ['reel']
        },
        blogger: {
          enabled: true,
          name: 'Blogger (.blogspot.com) - Lexa Trip Mount Abu',
          handle: 'lexatripmountabu.blogspot.com',
          authType: 'api_token',
          credentials: { blogId: '', apiKey: '' },
          supports: ['post']
        },
        twitter: {
          enabled: false,
          isComingSoon: true,
          name: 'X / Twitter (Future Ready)',
          handle: '@lexatripmountabu',
          authType: 'api_token',
          credentials: { apiKey: '', apiSecret: '', bearerToken: '' },
          supports: ['post', 'reel']
        }
      },
      defaultChannels: {
        post: ['instagram', 'facebook', 'linkedin', 'pinterest', 'blogger'],
        reel: ['instagram', 'facebook', 'youtube', 'pinterest'],
        carousel: ['instagram', 'facebook', 'linkedin']
      },
      customChannels: []
    }
  ],
  batches: [],
  queue: [],
  logs: []
};

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.save(defaultData);
    } else {
      // Ensure migration to destinations structure if existing data is older
      const current = this.read();
      let changed = false;
      if (!current.destinations || current.destinations.length === 0) {
        current.destinations = defaultData.destinations;
        changed = true;
      }
      // Ensure each destination has defaultChannels
      current.destinations.forEach(dest => {
        if (!dest.defaultChannels) {
          dest.defaultChannels = {
            post: ['instagram', 'facebook', 'linkedin', 'pinterest'],
            reel: ['instagram', 'facebook', 'youtube', 'pinterest'],
            carousel: ['instagram', 'facebook', 'linkedin']
          };
          changed = true;
        }
      });
      if (!current.currentUser) {
        current.currentUser = {
          isLoggedIn: true,
          provider: 'google',
          name: 'Lexa Trip Administrator',
          email: 'admin@lexatrip.com',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
          connectedAt: new Date().toISOString()
        };
        changed = true;
      }
      if (changed) this.save(current);
    }
  }

  read() {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading DB, re-initializing:', err.message);
      this.save(defaultData);
      return defaultData;
    }
  }

  save(data) {
    const temp = `${DB_FILE}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(temp, DB_FILE);
  }

  // --- USER / AUTH ---
  getUser() {
    const data = this.read();
    return data.currentUser || {
      isLoggedIn: true,
      provider: 'google',
      name: 'Lexa Trip Administrator',
      email: 'admin@lexatrip.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
    };
  }

  setUser(user) {
    const data = this.read();
    data.currentUser = user;
    this.save(data);
    return data.currentUser;
  }

  // --- DESTINATIONS ---
  getDestinations() {
    return this.read().destinations || defaultData.destinations;
  }

  getDestination(id) {
    const list = this.getDestinations();
    return list.find(d => d.id === id || d.slug === id);
  }

  saveDestination(dest) {
    const data = this.read();
    data.destinations = data.destinations || [];
    const idx = data.destinations.findIndex(d => d.id === dest.id);
    if (idx >= 0) {
      data.destinations[idx] = { ...data.destinations[idx], ...dest };
    } else {
      dest.id = dest.id || 'dest_' + Date.now();
      data.destinations.push(dest);
    }
    this.save(data);
    return dest;
  }

  deleteDestination(id) {
    const data = this.read();
    data.destinations = (data.destinations || []).filter(d => d.id !== id);
    this.save(data);
  }

  // --- SETTINGS ---
  getSettings() {
    return this.read().settings || defaultData.settings;
  }

  updateSettings(newSettings) {
    const data = this.read();
    data.settings = { ...data.settings, ...newSettings };
    this.save(data);
    return data.settings;
  }

  // --- BATCHES ---
  getBatches(destinationId = null) {
    const batches = this.read().batches || [];
    if (destinationId) {
      return batches.filter(b => b.destinationId === destinationId);
    }
    return batches;
  }

  getBatch(id) {
    return (this.read().batches || []).find(b => b.id === id);
  }

  saveBatch(batch) {
    const data = this.read();
    data.batches = data.batches || [];
    const idx = data.batches.findIndex(b => b.id === batch.id);
    if (idx >= 0) {
      data.batches[idx] = { ...data.batches[idx], ...batch, updatedAt: new Date().toISOString() };
    } else {
      batch.createdAt = batch.createdAt || new Date().toISOString();
      batch.updatedAt = new Date().toISOString();
      data.batches.unshift(batch);
    }
    this.save(data);
    return batch;
  }

  deleteBatch(id) {
    const data = this.read();
    data.batches = (data.batches || []).filter(b => b.id !== id);
    data.queue = (data.queue || []).filter(q => q.batchId !== id);
    this.save(data);
  }

  // --- QUEUE ---
  getQueue(destinationId = null) {
    const queue = this.read().queue || [];
    if (destinationId) {
      return queue.filter(q => q.destinationId === destinationId);
    }
    return queue;
  }

  addToQueue(item) {
    const data = this.read();
    data.queue = data.queue || [];
    data.queue.push(item);
    data.queue.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
    this.save(data);
    return item;
  }

  updateQueueItem(id, updates) {
    const data = this.read();
    data.queue = data.queue || [];
    const idx = data.queue.findIndex(q => q.id === id);
    if (idx >= 0) {
      data.queue[idx] = { ...data.queue[idx], ...updates };
      this.save(data);
      return data.queue[idx];
    }
    return null;
  }

  removeFromQueue(id) {
    const data = this.read();
    data.queue = (data.queue || []).filter(q => q.id !== id);
    this.save(data);
  }

  clearQueue(destinationId = null) {
    const data = this.read();
    if (destinationId) {
      data.queue = (data.queue || []).filter(q => q.destinationId !== destinationId);
    } else {
      data.queue = [];
    }
    this.save(data);
  }

  // --- LOGS ---
  addLog(entry) {
    const data = this.read();
    data.logs = data.logs || [];
    const logItem = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      ...entry
    };
    data.logs.unshift(logItem);
    if (data.logs.length > 500) {
      data.logs = data.logs.slice(0, 500);
    }
    this.save(data);
    return logItem;
  }

  getLogs(limit = 100) {
    return (this.read().logs || []).slice(0, limit);
  }

  getRawData() {
    return this.read();
  }

  saveRawData(data) {
    this.save(data);
  }
}

module.exports = new Database();
