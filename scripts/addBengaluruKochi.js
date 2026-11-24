const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../database/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const existingIds = new Set(data.destinations.map(d => d.id));

const newDestinations = [
  {
    id: 'dest_bengaluru',
    name: 'लेक्सा ट्रिप बेंगलुरु (Lexa Trip Bengaluru)',
    slug: 'bengaluru',
    state: 'Karnataka',
    tagline: '✦ Garden City, Tech Hub & Regal Heritage Palaces ✦',
    website: 'https://lexatrip.com/bengaluru',
    phone: '+91 90798 54982',
    proxy: '',
    channels: {
      facebook: {
        enabled: true,
        credentials: {
          pageId: '1293968303804848', // Linked Karnataka region page fallback or placeholder
          pageAccessToken: data.destinations[0].channels.facebook.credentials.pageAccessToken
        },
        handle: 'LexaTrip Bengaluru'
      },
      instagram: {
        enabled: true,
        credentials: {
          accessToken: data.destinations[0].channels.instagram.credentials.accessToken,
          instagramAccountId: '17841434259396990',
          pageId: '1293968303804848'
        },
        handle: '@lexatripbengaluru'
      },
      linkedin: {
        enabled: true,
        name: 'LinkedIn - LexaTrip Bengaluru',
        handle: 'https://www.linkedin.com/company/144145872/',
        authType: 'api_token',
        credentials: {
          accessToken: data.destinations[0].channels.linkedin.credentials.accessToken,
          organizationUrn: 'urn:li:organization:144145872'
        },
        supports: ['post', 'carousel']
      },
      pinterest: {
        enabled: true,
        name: 'Pinterest - Lexa Trip Bengaluru',
        handle: 'pinterest.com/Lexatripofficial/lexatrip-bengaluru',
        authType: 'api_token',
        credentials: {
          accessToken: data.destinations[0].channels.pinterest.credentials.accessToken,
          appId: '1642972',
          status: 'trial_access_pending'
        },
        supports: ['post', 'reel']
      },
      youtube: {
        enabled: true,
        name: 'LexaTrip Bengaluru',
        handle: '@lexatripbengaluru',
        authType: 'oauth2_lifetime',
        credentials: {
          apiKey: data.destinations[0].channels.youtube.credentials.apiKey,
          channelId: '', // To be created on YouTube
          accessToken: data.destinations[0].channels.youtube.credentials.accessToken,
          refreshToken: data.destinations[0].channels.youtube.credentials.refreshToken,
          clientId: data.destinations[0].channels.youtube.credentials.clientId,
          clientSecret: data.destinations[0].channels.youtube.credentials.clientSecret,
          isLifetime: true,
          handle: '@lexatripbengaluru'
        },
        supports: ['reel'],
        status: 'pending_creation'
      },
      blogger: {
        enabled: true,
        name: 'Blogger - Lexa Trip Bengaluru',
        handle: 'lexatripbengaluru.blogspot.com',
        authType: 'api_token',
        credentials: {
          blogId: '',
          apiKey: data.destinations[0].channels.blogger.credentials.apiKey,
          blogUrl: 'https://lexatripbengaluru.blogspot.com/',
          secretEmail: 'infolexatrip.bengaluru@blogger.com',
          secretWord: 'bengaluru'
        },
        supports: ['post', 'article']
      },
      twitter: {
        enabled: false,
        isComingSoon: true,
        name: 'X / Twitter (Future Ready)',
        handle: '@lexatripbengaluru',
        authType: 'api_token',
        credentials: { apiKey: '', apiSecret: '', bearerToken: '' },
        supports: ['post', 'reel']
      },
      telegram: {
        enabled: true,
        name: 'Lexa Trip Automation Bot',
        handle: '@lexatrip_auto_bot',
        credentials: {
          botToken: '9283650493:AAEbHNXPtWnej_39TBrCQ3y8yXZUESR2D7E'
        },
        supports: ['post', 'reel', 'carousel']
      },
      threads: {
        enabled: true,
        name: 'Threads (@lexatripbengaluru)',
        handle: 'threads.net/@lexatripbengaluru',
        authType: 'lifetime_page_token',
        credentials: {
          threadsHandle: '@lexatripbengaluru',
          accessToken: data.destinations[0].channels.threads.credentials.accessToken || data.destinations[0].channels.facebook.credentials.pageAccessToken,
          isLifetime: true
        },
        supports: ['post', 'carousel', 'reel']
      },
      website: {
        enabled: true,
        name: 'Official Travel Portal (lexatrip.com)',
        handle: 'lexatrip.com/bengaluru',
        authType: 'rest_api',
        credentials: {
          siteUrl: 'https://lexatrip.com/bengaluru',
          apiUrl: 'https://lexatrip.com/wp-json/wp/v2',
          username: 'lexatrip_admin',
          applicationPassword: 'official_live_token'
        },
        supports: ['post', 'article']
      },
      google_business: {
        enabled: false,
        name: 'Google Business Profile (LexaTrip Bengaluru)',
        handle: 'Pending Creation',
        authType: 'google_cloud_api',
        credentials: {
          businessProfileId: '',
          storeCode: '',
          locationId: '',
          businessName: 'LexaTrip Bengaluru',
          serviceArea: 'Bengaluru, Karnataka, India',
          searchProfileUrl: '',
          websiteUrl: 'https://bookings.lexatrip.com/',
          bookingUrl: 'https://bookings.lexatrip.com/',
          officialSiteUrl: 'https://www.lexatrip.com/',
          phone: '+91 90798 54982',
          category: 'Travel Agent'
        },
        supports: ['post', 'carousel_offer']
      },
      reddit: {
        connected: true,
        status: '🟢 Live Official',
        name: 'Reddit Official',
        handle: 'u/Logical_Forever_4242',
        url: 'https://www.reddit.com/user/Logical_Forever_4242/',
        credentials: {
          username: 'Logical_Forever_4242',
          displayName: 'Lexa Trip - Luxury Desert and Travel Experiences'
        }
      },
      quora: {
        connected: true,
        status: '🟢 Live Official',
        name: 'Quora Official & Space',
        handle: 'lexatrip.quora.com',
        url: 'https://lexatrip.quora.com/',
        profileUrl: 'https://www.quora.com/profile/IMRAN-KHAN-42350',
        credentials: {
          spaceUrl: 'https://lexatrip.quora.com/'
        }
      }
    },
    defaultChannels: {
      post: ['instagram', 'facebook', 'linkedin', 'pinterest'],
      carousel: ['instagram', 'facebook', 'linkedin'],
      reel: ['instagram', 'facebook', 'youtube', 'pinterest']
    },
    telegram: {
      channelId: '-1003697503605',
      channelUsername: '@lexatripjaisalmer'
    }
  },
  {
    id: 'dest_kochi',
    name: 'लेक्सा ट्रिप कोच्चि (Lexa Trip Kochi)',
    slug: 'kochi',
    state: 'Kerala',
    tagline: '✦ Queen of the Arabian Sea, Heritage Forts & Backwaters ✦',
    website: 'https://lexatrip.com/kochi',
    phone: '+91 90798 54982',
    proxy: '',
    channels: {
      facebook: {
        enabled: true,
        credentials: {
          pageId: '1361009330428038', // Linked Kerala region page fallback or placeholder
          pageAccessToken: data.destinations[0].channels.facebook.credentials.pageAccessToken
        },
        handle: 'LexaTrip Kochi'
      },
      instagram: {
        enabled: true,
        credentials: {
          accessToken: data.destinations[0].channels.instagram.credentials.accessToken,
          instagramAccountId: '17841434417677202',
          pageId: '1361009330428038'
        },
        handle: '@lexatripkochi'
      },
      linkedin: {
        enabled: true,
        name: 'LinkedIn - LexaTrip Kochi',
        handle: 'https://www.linkedin.com/company/144145872/',
        authType: 'api_token',
        credentials: {
          accessToken: data.destinations[0].channels.linkedin.credentials.accessToken,
          organizationUrn: 'urn:li:organization:144145872'
        },
        supports: ['post', 'carousel']
      },
      pinterest: {
        enabled: true,
        name: 'Pinterest - Lexa Trip Kochi',
        handle: 'pinterest.com/Lexatripofficial/lexatrip-kochi',
        authType: 'api_token',
        credentials: {
          accessToken: data.destinations[0].channels.pinterest.credentials.accessToken,
          appId: '1642972',
          status: 'trial_access_pending'
        },
        supports: ['post', 'reel']
      },
      youtube: {
        enabled: true,
        name: 'LexaTrip Kochi',
        handle: '@lexatripkochi',
        authType: 'oauth2_lifetime',
        credentials: {
          apiKey: data.destinations[0].channels.youtube.credentials.apiKey,
          channelId: '', // To be created on YouTube
          accessToken: data.destinations[0].channels.youtube.credentials.accessToken,
          refreshToken: data.destinations[0].channels.youtube.credentials.refreshToken,
          clientId: data.destinations[0].channels.youtube.credentials.clientId,
          clientSecret: data.destinations[0].channels.youtube.credentials.clientSecret,
          isLifetime: true,
          handle: '@lexatripkochi'
        },
        supports: ['reel'],
        status: 'pending_creation'
      },
      blogger: {
        enabled: true,
        name: 'Blogger - Lexa Trip Kochi',
        handle: 'lexatripkochi.blogspot.com',
        authType: 'api_token',
        credentials: {
          blogId: '',
          apiKey: data.destinations[0].channels.blogger.credentials.apiKey,
          blogUrl: 'https://lexatripkochi.blogspot.com/',
          secretEmail: 'infolexatrip.kochi@blogger.com',
          secretWord: 'kochi'
        },
        supports: ['post', 'article']
      },
      twitter: {
        enabled: false,
        isComingSoon: true,
        name: 'X / Twitter (Future Ready)',
        handle: '@lexatripkochi',
        authType: 'api_token',
        credentials: { apiKey: '', apiSecret: '', bearerToken: '' },
        supports: ['post', 'reel']
      },
      telegram: {
        enabled: true,
        name: 'Lexa Trip Automation Bot',
        handle: '@lexatrip_auto_bot',
        credentials: {
          botToken: '9283650493:AAEbHNXPtWnej_39TBrCQ3y8yXZUESR2D7E'
        },
        supports: ['post', 'reel', 'carousel']
      },
      threads: {
        enabled: true,
        name: 'Threads (@lexatripkochi)',
        handle: 'threads.net/@lexatripkochi',
        authType: 'lifetime_page_token',
        credentials: {
          threadsHandle: '@lexatripkochi',
          accessToken: data.destinations[0].channels.threads.credentials.accessToken || data.destinations[0].channels.facebook.credentials.pageAccessToken,
          isLifetime: true
        },
        supports: ['post', 'carousel', 'reel']
      },
      website: {
        enabled: true,
        name: 'Official Travel Portal (lexatrip.com)',
        handle: 'lexatrip.com/kochi',
        authType: 'rest_api',
        credentials: {
          siteUrl: 'https://lexatrip.com/kochi',
          apiUrl: 'https://lexatrip.com/wp-json/wp/v2',
          username: 'lexatrip_admin',
          applicationPassword: 'official_live_token'
        },
        supports: ['post', 'article']
      },
      google_business: {
        enabled: false,
        name: 'Google Business Profile (LexaTrip Kochi)',
        handle: 'Pending Creation',
        authType: 'google_cloud_api',
        credentials: {
          businessProfileId: '',
          storeCode: '',
          locationId: '',
          businessName: 'LexaTrip Kochi',
          serviceArea: 'Kochi, Kerala, India',
          searchProfileUrl: '',
          websiteUrl: 'https://bookings.lexatrip.com/',
          bookingUrl: 'https://bookings.lexatrip.com/',
          officialSiteUrl: 'https://www.lexatrip.com/',
          phone: '+91 90798 54982',
          category: 'Travel Agent'
        },
        supports: ['post', 'carousel_offer']
      },
      reddit: {
        connected: true,
        status: '🟢 Live Official',
        name: 'Reddit Official',
        handle: 'u/Logical_Forever_4242',
        url: 'https://www.reddit.com/user/Logical_Forever_4242/',
        credentials: {
          username: 'Logical_Forever_4242',
          displayName: 'Lexa Trip - Luxury Desert and Travel Experiences'
        }
      },
      quora: {
        connected: true,
        status: '🟢 Live Official',
        name: 'Quora Official & Space',
        handle: 'lexatrip.quora.com',
        url: 'https://lexatrip.quora.com/',
        profileUrl: 'https://www.quora.com/profile/IMRAN-KHAN-42350',
        credentials: {
          spaceUrl: 'https://lexatrip.quora.com/'
        }
      }
    },
    defaultChannels: {
      post: ['instagram', 'facebook', 'linkedin', 'pinterest'],
      carousel: ['instagram', 'facebook', 'linkedin'],
      reel: ['instagram', 'facebook', 'youtube', 'pinterest']
    },
    telegram: {
      channelId: '-1003697503605',
      channelUsername: '@lexatripjaisalmer'
    }
  }
];

let added = 0;
for (const dest of newDestinations) {
  if (!existingIds.has(dest.id)) {
    data.destinations.push(dest);
    added++;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Added ${added} new destinations. Total destinations in database: ${data.destinations.length}`);
