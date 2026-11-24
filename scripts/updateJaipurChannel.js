const db = require('../database/db.js');
const data = db.getRawData();

const jpr = data.destinations.find(d => d.id === 'dest_jaipur');
if (jpr) {
  jpr.channels = jpr.channels || {};
  jpr.channels.youtube = jpr.channels.youtube || {};
  jpr.channels.youtube.enabled = true;
  jpr.channels.youtube.name = 'LexaTrip Jaipur';
  jpr.channels.youtube.handle = '@lexatripjaipur';
  jpr.channels.youtube.authType = 'oauth2_lifetime';
  jpr.channels.youtube.credentials = jpr.channels.youtube.credentials || {};
  jpr.channels.youtube.credentials.channelId = 'UCZn97IPvE36VzEIuBkLDd7Q';
  // Inherit master credentials
  const jaisalmer = data.destinations.find(d => d.id === 'dest_jaisalmer');
  if (jaisalmer?.channels?.youtube?.credentials) {
    const creds = jaisalmer.channels.youtube.credentials;
    jpr.channels.youtube.credentials.apiKey = creds.apiKey;
    jpr.channels.youtube.credentials.accessToken = creds.accessToken;
    jpr.channels.youtube.credentials.refreshToken = creds.refreshToken;
    jpr.channels.youtube.credentials.clientId = creds.clientId;
    jpr.channels.youtube.credentials.clientSecret = creds.clientSecret;
    jpr.channels.youtube.credentials.isLifetime = true;
  }
  db.saveRawData(data);
  console.log('Updated dest_jaipur with channel ID UCZn97IPvE36VzEIuBkLDd7Q');
} else {
  console.log('dest_jaipur not found');
}
