const db = require('../database/db.js');
const data = db.getRawData();

const sam = data.destinations.find(d => d.id === 'dest_sam');
if (sam) {
  sam.channels = sam.channels || {};
  sam.channels.youtube = sam.channels.youtube || {};
  sam.channels.youtube.enabled = true;
  sam.channels.youtube.name = 'LexaTrip Sam';
  sam.channels.youtube.handle = '@lexatripsam';
  sam.channels.youtube.credentials = sam.channels.youtube.credentials || {};
  sam.channels.youtube.credentials.channelId = 'UChpJs00IL6gZK9-HjLMfi2g';
  db.saveRawData(data);
  console.log('Updated dest_sam with channel ID UChpJs00IL6gZK9-HjLMfi2g');
} else {
  console.log('dest_sam not found');
}
