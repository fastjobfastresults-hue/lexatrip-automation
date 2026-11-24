const db = require('../database/db.js');
const data = db.getRawData();

const manali = data.destinations.find(d => d.id === 'dest_manali');
if (manali) {
  manali.channels = manali.channels || {};
  manali.channels.youtube = manali.channels.youtube || {};
  manali.channels.youtube.enabled = true;
  manali.channels.youtube.name = 'LexaTrip Manali';
  manali.channels.youtube.handle = '@lexatripmanali';
  manali.channels.youtube.authType = 'oauth2_lifetime';
  manali.channels.youtube.credentials = manali.channels.youtube.credentials || {};
  manali.channels.youtube.credentials.channelId = 'UCHbx2iDzL8Sy8ZY2GEkzHcA';
  // Inherit master credentials
  const jaisalmer = data.destinations.find(d => d.id === 'dest_jaisalmer');
  if (jaisalmer?.channels?.youtube?.credentials) {
    const creds = jaisalmer.channels.youtube.credentials;
    manali.channels.youtube.credentials.apiKey = creds.apiKey;
    manali.channels.youtube.credentials.accessToken = creds.accessToken;
    manali.channels.youtube.credentials.refreshToken = creds.refreshToken;
    manali.channels.youtube.credentials.clientId = creds.clientId;
    manali.channels.youtube.credentials.clientSecret = creds.clientSecret;
    manali.channels.youtube.credentials.isLifetime = true;
  }
  db.saveRawData(data);
  console.log('Updated dest_manali with channel ID UCHbx2iDzL8Sy8ZY2GEkzHcA');
} else {
  console.log('dest_manali not found');
}
