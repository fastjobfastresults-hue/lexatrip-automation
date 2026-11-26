const fs = require('fs');
const db = require('../database/db');

const destinations = db.getDestinations();
const blogIds = JSON.parse(fs.readFileSync('scripts/destinationBlogIds.json', 'utf8'));

let updated = 0;
for (const dest of destinations) {
  const slug = (dest.slug || dest.id.replace('dest_', '')).toLowerCase();
  const match = blogIds.find(b => b.slug === slug || (dest.name && b.name && dest.name.toLowerCase().includes(b.slug)));
  if (!dest.channels) dest.channels = {};
  if (!dest.channels.blogger) {
    dest.channels.blogger = {
      enabled: true,
      name: 'Blogger - ' + dest.name,
      handle: match ? match.url.replace('https://', '').replace('/', '') : `lexatrip${slug}.blogspot.com`,
      credentials: {}
    };
  }
  if (match && match.blogId) {
    if (!dest.channels.blogger.credentials) dest.channels.blogger.credentials = {};
    if (dest.channels.blogger.credentials.blogId !== match.blogId) {
      console.log(`Setting blogId for ${dest.name}: ${match.blogId}`);
      dest.channels.blogger.credentials.blogId = match.blogId;
      dest.channels.blogger.credentials.blogUrl = match.url;
      dest.channels.blogger.credentials.isLifetime = true;
      db.saveDestination(dest);
      updated++;
    }
  }
}
console.log('Total destinations updated:', updated);
