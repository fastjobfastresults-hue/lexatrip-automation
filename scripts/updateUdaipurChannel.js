const db = require('../database/db.js');
const data = db.getRawData();

const udr = data.destinations.find(d => d.id === 'dest_udaipur');
if (udr) {
  udr.channels = udr.channels || {};
  udr.channels.youtube = udr.channels.youtube || {};
  udr.channels.youtube.enabled = true;
  udr.channels.youtube.name = 'LexaTrip Udaipur';
  udr.channels.youtube.handle = '@lexatripudaipur';
  udr.channels.youtube.authType = 'oauth2_lifetime';
  udr.channels.youtube.credentials = udr.channels.youtube.credentials || {};
  udr.channels.youtube.credentials.channelId = 'UCy-TrmZiHbP07nl4FTEwcpQ';
  // Inherit master credentials
  const jaisalmer = data.destinations.find(d => d.id === 'dest_jaisalmer');
  if (jaisalmer?.channels?.youtube?.credentials) {
    const creds = jaisalmer.channels.youtube.credentials;
    udr.channels.youtube.credentials.apiKey = creds.apiKey;
    udr.channels.youtube.credentials.accessToken = creds.accessToken;
    udr.channels.youtube.credentials.refreshToken = creds.refreshToken;
    udr.channels.youtube.credentials.clientId = creds.clientId;
    udr.channels.youtube.credentials.clientSecret = creds.clientSecret;
    udr.channels.youtube.credentials.isLifetime = true;
  }
  db.saveRawData(data);
  console.log('Updated dest_udaipur with channel ID UCy-TrmZiHbP07nl4FTEwcpQ');
} else {
  console.log('dest_udaipur not found');
}
