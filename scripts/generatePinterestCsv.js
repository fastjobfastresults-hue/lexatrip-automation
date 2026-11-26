const db = require('../database/db');
const fs = require('fs');
const path = require('path');

const dests = db.getDestinations();

// Pinterest Bulk Pins CSV Specification
// Required columns: Title, Media URL, Pinterest board, Thumbnail, Description, Link, Publish date, Keywords
const header = 'Title,Media URL,Pinterest board,Thumbnail,Description,Link,Publish date,Keywords\n';

const destinationImages = {
  dest_jaisalmer: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200',
  dest_udaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200',
  dest_jaipur: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200',
  dest_goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200',
  dest_manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200',
  dest_munnar: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200',
  dest_rishikesh: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=1200',
  dest_varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200',
  dest_tirupati: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200',
  dest_ranthambore: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=1200',
  dest_rajasthan: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200',
  dest_amritsar: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=1200',
  dest_maysuru: 'https://images.unsplash.com/photo-1600100397608-f010e42e4e1a?w=1200',
  dest_sam: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200',
  dest_bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200',
  dest_kochi: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200',
  dest_mountabu: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200'
};

const rows = dests.map(d => {
  const name = d.name || d.id.replace('dest_', '');
  const title = `"${name} Verified Luxury Stays & Experiential Tours | LexaTrip"`;
  const imgUrl = destinationImages[d.id] || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200';
  const board = `"LexaTrip ${name}"`;
  const desc = `"Curated luxury desert camps, heritage palace hotels, and verified experiential stays in ${name} by LexaTrip. Book with 24/7 priority support and exclusive rates."`;
  const link = `"${d.channels?.blogger?.credentials?.blogUrl || 'https://bookings.lexatrip.com/'}"`;
  const keywords = `"travel, luxury hotels, ${name.toLowerCase()}, lexatrip, india travel"`;

  return [title, `"${imgUrl}"`, board, '""', desc, link, '""', keywords].join(',');
});

const csvContent = header + rows.join('\n');
const outputPath = path.join(__dirname, '../public/downloads/lexatrip_pinterest_bulk_pins.csv');
fs.writeFileSync(outputPath, csvContent, 'utf8');

console.log(`Successfully generated Pinterest Bulk Pins CSV for ${rows.length} destinations.`);
console.log(`File: ${outputPath}`);
