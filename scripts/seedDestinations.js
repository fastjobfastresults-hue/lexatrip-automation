const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'database', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const popularDestinations = [
  { id: 'dest_jaisalmer', name: 'लेक्सा ट्रिप जैसलमेर (Lexa Trip Jaisalmer)', slug: 'jaisalmer', state: 'Rajasthan', tagline: 'Unforgettable Golden Dunes & Luxury Desert Experiences', heroImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80' },
  { id: 'dest_mountabu', name: 'लेक्सा ट्रिप माउंट आबू (Lexa Trip Mount Abu)', slug: 'mount-abu', state: 'Rajasthan', tagline: 'Serene Oasis, Nakki Lake & Lush Aravali Hills', heroImage: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80' },
  { id: 'dest_udaipur', name: 'लेक्सा ट्रिप उदयपुर (Lexa Trip Udaipur)', slug: 'udaipur', state: 'Rajasthan', tagline: 'City of Lakes, Royal Palaces & Romantic Sunset Boat Rides', heroImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80' },
  { id: 'dest_jaipur', name: 'लेक्सा ट्रिप जयपुर (Lexa Trip Jaipur)', slug: 'jaipur', state: 'Rajasthan', tagline: 'The Pink City, Hawa Mahal & Regal Amber Heritage', heroImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80' },
  { id: 'dest_manali', name: 'लेक्सा ट्रिप मनाली (Lexa Trip Manali)', slug: 'manali', state: 'Himachal Pradesh', tagline: 'Snowy Himalayan Peaks, Solang Adventure & Pine Valleys', heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80' },
  { id: 'dest_rishikesh', name: 'लेक्सा ट्रिप ऋषिकेश (Lexa Trip Rishikesh)', slug: 'rishikesh', state: 'Uttarakhand', tagline: 'Ganga Aarti, White Water Rafting & Soulful Yoga Retreats', heroImage: 'https://images.unsplash.com/photo-1603816245457-fe9c80b740e5?auto=format&fit=crop&w=800&q=80' },
  { id: 'dest_goa', name: 'लेक्सा ट्रिप गोवा (Lexa Trip Goa)', slug: 'goa', state: 'Goa', tagline: 'Golden Sands, Azure Ocean Sunsets & Luxury Beach Villas', heroImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80' },
  { id: 'dest_munnar', name: 'लेक्सा ट्रिप मुन्नार (Lexa Trip Munnar)', slug: 'munnar', state: 'Kerala', tagline: 'Rolling Emerald Tea Gardens & Misty Mountain Retreats', heroImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80' },
  { id: 'dest_varanasi', name: 'लेक्सा ट्रिप वाराणसी (Lexa Trip Varanasi)', slug: 'varanasi', state: 'Uttar Pradesh', tagline: 'Ancient Ghats, Divine Ganga Aarti & Spiritual Legacy', heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80' },
  { id: 'dest_tirupati', name: 'लेक्सा ट्रिप तिरुपति (Lexa Trip Tirupati)', slug: 'tirupati', state: 'Andhra Pradesh', tagline: 'Sacred Tirumala Hills, Divine Blessings & Royal Pilgrimage', heroImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80' }
];

const baseChannels = data.destinations[0].channels;
const existingIds = new Set(data.destinations.map(d => d.id));

for (const dest of popularDestinations) {
  if (!existingIds.has(dest.id)) {
    data.destinations.push({
      ...dest,
      website: `https://lexatrip.com/${dest.slug}`,
      phone: '+91 90798 54982',
      proxy: '',
      channels: JSON.parse(JSON.stringify(baseChannels)),
      defaultChannels: {
        post: ['instagram', 'facebook', 'linkedin', 'pinterest'],
        carousel: ['instagram', 'facebook', 'linkedin'],
        reel: ['instagram', 'facebook', 'youtube', 'pinterest']
      },
      telegram: {
        channelId: '-1003697503605',
        channelUsername: '@lexatripjaisalmer'
      }
    });
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Successfully seeded! Total destinations: ${data.destinations.length}`);
