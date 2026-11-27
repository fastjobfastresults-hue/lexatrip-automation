/**
 * Automated Generator for Pinterest Bulk Pin CSV for ALL 102 LexaTrip Destinations
 * Meets exact official Pinterest CSV format:
 * Title,Media URL,Pinterest board,Link,Description,Publish date (UTC),Keywords,Thumbnail (video only)
 */

const fs = require('fs');
const path = require('path');
const db = require('../database/db');

db.init();
const destinations = db.getDestinations();

function getCleanName(dest) {
  const match = dest.name.match(/\((?:Lexa\s*Trip\s*)?([^)]+)\)/i);
  if (match && match[1]) return match[1].replace(/Lexa\s*Trip\s*/i, '').trim();
  return dest.slug.charAt(0).toUpperCase() + dest.slug.slice(1);
}

// Curated high-res imagery mapping based on state and geography
function getDestinationImage(cleanName, state) {
  const nameLower = cleanName.toLowerCase();
  const stateLower = (state || '').toLowerCase();

  // Specific city custom high-res photos
  if (nameLower.includes('jaisalmer') || nameLower.includes('sam')) {
    return 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200';
  }
  if (nameLower.includes('udaipur')) {
    return 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200';
  }
  if (nameLower.includes('jaipur')) {
    return 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200';
  }
  if (nameLower.includes('manali')) {
    return 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200';
  }
  if (nameLower.includes('rishikesh')) {
    return 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=1200';
  }
  if (nameLower.includes('goa')) {
    return 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200';
  }
  if (nameLower.includes('munnar')) {
    return 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200';
  }
  if (nameLower.includes('varanasi')) {
    return 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200';
  }
  if (nameLower.includes('leh') || nameLower.includes('ladakh')) {
    return 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=1200';
  }
  if (nameLower.includes('srinagar') || nameLower.includes('gulmarg') || nameLower.includes('pahalgam')) {
    return 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=1200';
  }
  if (nameLower.includes('agra')) {
    return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200';
  }
  if (nameLower.includes('amritsar')) {
    return 'https://images.unsplash.com/photo-1588096344356-9195d52cfec2?w=1200';
  }
  if (nameLower.includes('kedarnath') || nameLower.includes('badrinath')) {
    return 'https://images.unsplash.com/photo-1626014303757-646629f63f5d?w=1200';
  }
  if (nameLower.includes('hampi')) {
    return 'https://images.unsplash.com/photo-1600100397608-f010f4452140?w=1200';
  }

  // Regional fallbacks
  if (stateLower.includes('himachal') || stateLower.includes('uttarakhand') || stateLower.includes('kashmir')) {
    return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200';
  }
  if (stateLower.includes('kerala') || stateLower.includes('goa') || stateLower.includes('andaman')) {
    return 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200';
  }
  if (stateLower.includes('rajasthan')) {
    return 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200';
  }
  if (stateLower.includes('tamil nadu') || stateLower.includes('karnataka') || stateLower.includes('andhra')) {
    return 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200';
  }
  if (stateLower.includes('sikkim') || stateLower.includes('meghalaya') || stateLower.includes('assam')) {
    return 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200';
  }

  // Global luxury India travel fallback
  return 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200';
}

const headers = [
  'Title',
  'Media URL',
  'Pinterest board',
  'Link',
  'Description',
  'Publish date (UTC)',
  'Keywords',
  'Thumbnail (video only)'
];

function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

const rows = [headers.join(',')];

for (const dest of destinations) {
  const cleanName = getCleanName(dest);
  const state = dest.state || 'India';
  const boardName = `LexaTrip ${cleanName}`;

  let title = `LexaTrip ${cleanName} | Luxury Stays & Experiential Travel Guide`;
  if (title.length > 98) {
    title = title.slice(0, 95) + '...';
  }

  const mediaUrl = getDestinationImage(cleanName, state);
  
  // Link: destination blog or official portal
  const destBlog = dest.channels?.blogger?.handle 
    ? `https://${dest.channels.blogger.handle}/` 
    : 'https://bookings.lexatrip.com/';

  let desc = `Experience the unmatched charm of ${cleanName}, ${state} with LexaTrip. Discover verified 5-star boutique stays, heritage havelis, luxury mountain chalets, and curated cultural itineraries. Book with 24/7 VIP concierge at bookings.lexatrip.com.`;
  if (desc.length > 490) {
    desc = desc.slice(0, 485) + '...';
  }

  const keywords = `${cleanName.toLowerCase()}, ${cleanName.toLowerCase()} tourism, ${state.toLowerCase()} travel, luxury resorts, boutique stays, hotel booking, travel india, lexatrip`;

  const row = [
    escapeCSV(title),
    escapeCSV(mediaUrl),
    escapeCSV(boardName),
    escapeCSV(destBlog),
    escapeCSV(desc),
    escapeCSV(''), // Immediate publish
    escapeCSV(keywords),
    escapeCSV('')  // Empty for image pin
  ];

  rows.push(row.join(','));
}

const csvContent = rows.join('\r\n');

const targetPaths = [
  'D:\\lexa automation web and app\\lexatrip_pinterest_bulk_pins.csv',
  'C:\\Users\\imran\\Downloads\\lexatrip_pinterest_bulk_pins.csv',
  'C:\\Users\\imran\\Downloads\\YouTube_Audit_Files\\lexatrip_pinterest_bulk_pins.csv',
  'C:\\Users\\imran\\Desktop\\lexatrip_pinterest_bulk_pins.csv'
];

targetPaths.forEach(p => {
  try {
    fs.writeFileSync(p, csvContent, 'utf8');
    console.log(`Successfully written to: ${p}`);
  } catch (err) {
    console.warn(`Could not write to ${p}:`, err.message);
  }
});

console.log(`\nSuccessfully generated ${destinations.length} compliant Pins across all destinations!`);
console.log('Sample row:');
console.log(rows[1]);
