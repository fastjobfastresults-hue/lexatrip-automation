const db = require('../database/db.js');
const data = db.getRawData();

const abu = data.destinations.find(d => d.id === 'dest_mountabu');
if (abu) {
  abu.channels = abu.channels || {};
  abu.channels.youtube = abu.channels.youtube || {};
  abu.channels.youtube.enabled = true;
  abu.channels.youtube.name = 'LexaTrip Mount Abu';
  abu.channels.youtube.handle = '@lexatripmountabu';
  abu.channels.youtube.authType = 'oauth2_lifetime';
  abu.channels.youtube.credentials = abu.channels.youtube.credentials || {};
  abu.channels.youtube.credentials.channelId = 'UCp0UKJqUDUSXwXH35QeaWSQ';
  // Inherit master credentials if not set
  const jaisalmer = data.destinations.find(d => d.id === 'dest_jaisalmer');
  if (jaisalmer?.channels?.youtube?.credentials) {
    const creds = jaisalmer.channels.youtube.credentials;
    abu.channels.youtube.credentials.apiKey = creds.apiKey;
    abu.channels.youtube.credentials.accessToken = creds.accessToken;
    abu.channels.youtube.credentials.refreshToken = creds.refreshToken;
    abu.channels.youtube.credentials.clientId = creds.clientId;
    abu.channels.youtube.credentials.clientSecret = creds.clientSecret;
    abu.channels.youtube.credentials.isLifetime = true;
  }
  db.saveRawData(data);
  console.log('Updated dest_mountabu with channel ID UCp0UKJqUDUSXwXH35QeaWSQ');
} else {
  console.log('dest_mountabu not found');
}
