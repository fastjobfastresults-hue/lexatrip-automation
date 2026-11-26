const fs = require('fs');
const path = require('path');

const destinations = [
  {
    name: 'Jaisalmer',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Jaisalmer | Curated Luxury Desert Camps & Palace Stays',
    mediaUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200',
    link: 'https://lexatripjaisalmer.blogspot.com/',
    desc: 'Experience royal Rajasthani hospitality in Jaisalmer with LexaTrip. Discover luxury desert camps in Sam Sand Dunes, heritage havelis, camel safaris, and starlit Thar desert dinners. Book verified boutique stays at bookings.lexatrip.com.',
    keywords: 'jaisalmer, desert camp, rajasthan tourism, luxury travel, camel safari, sam sand dunes, lexatrip'
  },
  {
    name: 'Sam Sand Dunes',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Sam Sand Dunes | Luxury Desert Glamping & Jeep Safari',
    mediaUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200',
    link: 'https://lexatripsam.blogspot.com/',
    desc: 'Official luxury desert camping guide for Sam Sand Dunes, Jaisalmer. Experience premium Swiss tents, dune bashing, traditional Rajasthani folk dance, and campfire under starlit desert skies with LexaTrip.',
    keywords: 'sam sand dunes, desert camping, jaisalmer glamping, dune bashing, rajasthan luxury stay, lexatrip'
  },
  {
    name: 'Mount Abu',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Mount Abu | Misty Hill Station Luxury Resorts & Villas',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
    link: 'https://lexatripmountabu.blogspot.com/',
    desc: 'Escape to Rajasthan only hill station with LexaTrip Mount Abu. Curated heritage mountain villas, serene Nakki Lake views, and lush Aravali retreat stays. Book with 24/7 priority guest support.',
    keywords: 'mount abu, nakki lake, hill station rajasthan, luxury resort mount abu, aravali hills, lexatrip'
  },
  {
    name: 'Udaipur',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Udaipur | Romantic Lake Palace Heritage Hotels & Suites',
    mediaUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200',
    link: 'https://lexatripudaipur.blogspot.com/',
    desc: 'The Venice of the East curated by LexaTrip. Discover romantic lakeside palace hotels, private Pichola boat charters, sunset rooftop dining, and royal heritage suites in Udaipur.',
    keywords: 'udaipur, lake pichola, lake palace, romantic hotels, udaipur luxury travel, rajasthan palaces, lexatrip'
  },
  {
    name: 'Jaipur',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Jaipur | Royal Pink City Palace Stays & Heritage Haveli',
    mediaUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200',
    link: 'https://lexatripjaipur.blogspot.com/',
    desc: 'Immerse in the royal grandeur of the Pink City. Curated 5-star palace hotels, heritage boutique havelis, and private cultural tours in Jaipur by LexaTrip.',
    keywords: 'jaipur, pink city, amer fort, luxury haveli, jaipur 5 star hotels, royal rajasthan, lexatrip'
  },
  {
    name: 'Manali',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Manali | Snow Valley Mountain Chalets & Luxury Cottages',
    mediaUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200',
    link: 'https://lexatripmanali.blogspot.com/',
    desc: 'Breathtaking Himalayan luxury in Manali with LexaTrip. Discover verified snow-view chalets, riverside apple orchard cottages, Solang adventure tours, and private heating mountain suites.',
    keywords: 'manali, himachal pradesh, luxury chalet manali, snow valley, solang valley, mountain retreat, lexatrip'
  },
  {
    name: 'Rishikesh',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Rishikesh | Riverside Wellness Retreats & Luxury Camps',
    mediaUrl: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=1200',
    link: 'https://lexatriprishikesh.blogspot.com/',
    desc: 'Curated spiritual wellness and adventure in Rishikesh. Ganga river-view luxury resorts, private yoga sanctuaries, Himalayan glamping, and white-water rafting with LexaTrip.',
    keywords: 'rishikesh, ganga luxury resort, yoga retreat, riverside camping rishikesh, himalayan wellness, lexatrip'
  },
  {
    name: 'Goa',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Goa | Private Beachfront Pool Villas & Luxury Resorts',
    mediaUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200',
    link: 'https://lexatripgoa.blogspot.com/',
    desc: 'Experience coastal elegance in North and South Goa with LexaTrip. Curated private pool beach villas, Portuguese heritage boutique stays, private yacht charters, and sunset fine dining.',
    keywords: 'goa, beach villa, private pool goa, luxury resort goa, coastal luxury, goa vacation, lexatrip'
  },
  {
    name: 'Munnar',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Munnar | Misty Tea Plantation Cottages & Cloud Resorts',
    mediaUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200',
    link: 'https://lexatripmunnar.blogspot.com/',
    desc: 'Heaven in the Western Ghats. Discover misty tea estate luxury bungalows, mountain treehouses, valley-view infinity pools, and spiced plantation walks in Munnar by LexaTrip.',
    keywords: 'munnar, kerala luxury travel, tea plantation resort, munnar cottages, western ghats, lexatrip'
  },
  {
    name: 'Varanasi',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Varanasi | Heritage Ghat-View Haveli Stays & Sunrise Boat',
    mediaUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200',
    link: 'https://lexatripvaranasi.blogspot.com/',
    desc: 'The eternal city of lights. Curated heritage riverfront haveli stays, private sunrise Ganga boat journeys, evening Ganga Aarti VIP seating, and verified spiritual tours in Varanasi with LexaTrip.',
    keywords: 'varanasi, ganga ghats, kashi vishwanath, heritage haveli varanasi, sunrise boat ganga, lexatrip'
  },
  {
    name: 'Tirupati',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Tirupati | Premium Pilgrimage Stays & Priority Services',
    mediaUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200',
    link: 'https://lexatriptirupati.blogspot.com/',
    desc: 'Peaceful and dignified pilgrimage travel in Tirupati with LexaTrip. Curated 4-star and 5-star spiritual stays, private air-conditioned transit, and 24/7 dedicated guest coordination.',
    keywords: 'tirupati, balaji darshan, tirupati luxury hotels, pilgrimage travel india, tirumala stays, lexatrip'
  },
  {
    name: 'Ranthambore',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Ranthambore | Royal Jungle Safari Lodges & Luxury Tents',
    mediaUrl: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=1200',
    link: 'https://lexatripranthambore.blogspot.com/',
    desc: 'Wild luxury in the heart of royal tiger country. Discover curated safari jungle lodges, private naturalist safaris, heritage machans, and regal forest stays in Ranthambore by LexaTrip.',
    keywords: 'ranthambore, tiger safari, jungle lodge ranthambore, wildlife luxury, rajasthan wildlife, lexatrip'
  },
  {
    name: 'Rajasthan',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Rajasthan | Complete Royal Heritage Tours & Palace Circuit',
    mediaUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200',
    link: 'https://lexatriprajasthan.blogspot.com/',
    desc: 'The ultimate royal state guide. Explore curated luxury desert itineraries across Jaisalmer, Udaipur, Jaipur, and Jodhpur with private chauffeur transit and verified 5-star palace suites.',
    keywords: 'rajasthan tourism, royal rajasthan, palace hotels, desert tour circuit, luxury india travel, lexatrip'
  },
  {
    name: 'Amritsar',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Amritsar | Golden Temple Heritage Stays & Punjabi Cuisine',
    mediaUrl: 'https://images.unsplash.com/photo-1588096344356-9b514f7d4576?w=1200',
    link: 'https://lexatripamritsar.blogspot.com/',
    desc: 'Curated spiritual and cultural elegance in Amritsar. Walk to the Golden Temple from luxury heritage boutique stays, experience Wagah border ceremonies, and savor legendary Punjabi hospitality.',
    keywords: 'amritsar, golden temple, wagah border, amritsar luxury hotels, punjabi food, lexatrip'
  },
  {
    name: 'Mysuru',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Mysuru | Grand Palace Heritage Resorts & Royal Gardens',
    mediaUrl: 'https://images.unsplash.com/photo-1600100397608-f010f4448dc3?w=1200',
    link: 'https://lexatripmysuru.blogspot.com/',
    desc: 'City of palaces and sandalwood. Curated heritage royal mansions, Lalitha Mahal palace retreats, Mysore Dasara tours, and serene garden stays with LexaTrip.',
    keywords: 'mysore, mysuru palace, heritage hotel mysore, karnataka tourism, royal stays, lexatrip'
  },
  {
    name: 'Bengaluru',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Bengaluru | Garden City Luxury Boutique Hotels & Stays',
    mediaUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200',
    link: 'https://lexatripbengaluru.blogspot.com/',
    desc: 'The Silicon Valley and Garden City of India. Curated modern 5-star luxury hotels, tech-district executive suites, and boutique heritage bungalows in Bengaluru by LexaTrip.',
    keywords: 'bengaluru, bangalore luxury hotels, garden city, indiranagar boutique stays, executive travel, lexatrip'
  },
  {
    name: 'Kochi',
    board: 'LexaTrip Jaisalmer',
    title: 'LexaTrip Kochi | Colonial Fort Kochi Heritage Villas & Sea Suites',
    mediaUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200',
    link: 'https://lexatripkochi.blogspot.com/',
    desc: 'Where heritage meets the Arabian Sea. Curated Dutch and Portuguese colonial villas in Fort Kochi, backwater cruises, Kathakali cultural evenings, and coastal luxury retreats by LexaTrip.',
    keywords: 'kochi, fort kochi, kerala backwaters, heritage villa kochi, arabian sea, kerala luxury, lexatrip'
  }
];

// Pinterest Official Column Headers (Exact standard):
// Title,Media URL,Pinterest board,Link,Description,Publish date (UTC),Keywords,Thumbnail (video only)
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
  // Ensure title is strictly under 100 characters
  let title = dest.title;
  if (title.length > 98) {
    title = title.slice(0, 95) + '...';
  }

  // Ensure description is under 500 characters
  let desc = dest.desc;
  if (desc.length > 490) {
    desc = desc.slice(0, 485) + '...';
  }

  const row = [
    escapeCSV(title),
    escapeCSV(dest.mediaUrl),
    escapeCSV(dest.board),
    escapeCSV(dest.link),
    escapeCSV(desc),
    escapeCSV(''), // Publish immediately
    escapeCSV(dest.keywords),
    escapeCSV('')  // Empty for image pins
  ];

  rows.push(row.join(','));
}

const csvContent = rows.join('\r\n');

// Write to multiple locations for easiest access:
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

console.log(`\nGenerated ${destinations.length} compliant Pins.`);
console.log('Sample row:');
console.log(rows[1]);
