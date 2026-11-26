const { sanitizePostText } = require('../services/textSanitizer');

const OFFICIAL_PHONE = '+91 90798 54982';
const OFFICIAL_BOOKING_URL = 'https://bookings.lexatrip.com/';
const OFFICIAL_WEBSITE_URL = 'https://www.lexatrip.com/';

function parseHotelDetailsFromSeo({ title, caption, destination }) {
  const text = `${title || ''} ${caption || ''}`;
  const destName = destination?.name || 'Lexa Trip Destination';
  const destSlug = (destination?.slug || 'jaisalmer').toLowerCase();

  // 1. Detect Star Rating
  let starRating = '5-Star Luxury';
  let starSymbol = '⭐⭐⭐⭐⭐';
  let starTag = '5 Star Hotel';
  if (/(?:4\s*star|4-star|four\s*star|⭐⭐⭐⭐|4\s*स्टार)/i.test(text)) {
    starRating = '4-Star Premium';
    starSymbol = '⭐⭐⭐⭐';
    starTag = '4 Star Hotel';
  } else if (/(?:3\s*star|3-star|three\s*star|⭐⭐⭐|3\s*स्टार|budget|बजट)/i.test(text)) {
    starRating = '3-Star Boutique Comfort';
    starSymbol = '⭐⭐⭐';
    starTag = '3 Star Hotel';
  } else if (/(?:7\s*star|grand\s*palace|heritage\s*palace|maharaja\s*palace)/i.test(text)) {
    starRating = 'Grand Palace Heritage 5-Star';
    starSymbol = '⭐⭐⭐⭐⭐';
    starTag = 'Luxury Heritage Palace';
  } else if (/(?:glamping|desert\s*camp|swiss\s*tent|luxury\s*camp|desert\s*resort)/i.test(text)) {
    starRating = 'Ultra Luxury Glamping & Swiss Camp (5-Star Equivalent)';
    starSymbol = '⭐⭐⭐⭐⭐';
    starTag = 'Luxury Desert Camp';
  }

  // 2. Intelligent Hotel / Property Name Extraction
  let hotelName = null;

  // Check prefix: Hotel / Resort / Camp / Haveli / Palace [Name]
  const prefixMatch = text.match(/\b(Hotel|Resort|Camp|Haveli|Palace|Villa)\s+([A-Z][A-Za-z0-9'&]{2,20}(?:\s+[A-Z][A-Za-z0-9'&]{2,20}){0,3})\b/);
  if (prefixMatch) {
    hotelName = prefixMatch[0].trim();
  }

  // Check suffix: [Name] Hotel / Resort / Camp / Haveli / Palace
  if (!hotelName) {
    const suffixMatch = text.match(/\b([A-Z][A-Za-z0-9'&]{2,20}(?:\s+[A-Z][A-Za-z0-9'&]{2,20}){0,3})\s+(Hotel|Resort|Camp|Haveli|Palace|Villas?|Tents?)\b/);
    if (suffixMatch && !suffixMatch[1].toLowerCase().includes('lexatrip') && !suffixMatch[1].toLowerCase().includes('luxury')) {
      hotelName = suffixMatch[0].trim();
    }
  }

  // Check Hindi patterns
  if (!hotelName) {
    const hindiMatch = text.match(/\b(होटल|रिसॉर्ट|कैंप|हवेली|पैलेस)\s+([^\s,\.\n]{3,20}(?:\s+[^\s,\.\n]{3,20}){0,2})\b/u);
    if (hindiMatch) {
      hotelName = hindiMatch[0].trim();
    }
  }

  // Clean candidate
  if (hotelName) {
    hotelName = hotelName.replace(/^(?:at|in|with|the|and)\s+/i, '').trim();
    if (hotelName.length < 5 || hotelName.toLowerCase() === 'camp' || hotelName.toLowerCase() === 'hotel') {
      hotelName = null;
    }
  }

  // Default to destination-curated signature luxury property
  if (!hotelName) {
    if (destSlug.includes('jaisalmer') || destSlug.includes('sam')) {
      hotelName = 'LexaTrip Royal Desert Camp & Luxury Swiss Tents';
    } else if (destSlug.includes('udaipur')) {
      hotelName = 'LexaTrip Lakeview Palace & Royal Heritage Resort';
    } else if (destSlug.includes('jaipur')) {
      hotelName = 'LexaTrip Royal Haveli & Heritage Boutique Resort';
    } else if (destSlug.includes('manali')) {
      hotelName = 'LexaTrip Himalayan Luxury Pine Chalet & Alpine Resort';
    } else if (destSlug.includes('mountabu')) {
      hotelName = 'LexaTrip Aravali Hill View Heritage Resort';
    } else if (destSlug.includes('goa')) {
      hotelName = 'LexaTrip Coastal Palm Beach Villa & Luxury Resort';
    } else if (destSlug.includes('munnar')) {
      hotelName = 'LexaTrip Tea Garden Mist Villa & Luxury Plantation Resort';
    } else if (destSlug.includes('varanasi')) {
      hotelName = 'LexaTrip Ganges River Heritage Palace & Spiritual Stay';
    } else if (destSlug.includes('amritsar')) {
      hotelName = 'LexaTrip Golden Heritage & Luxury Boutique Resort';
    } else if (destSlug.includes('ranthambore')) {
      hotelName = 'LexaTrip Tiger Heritage Jungle Resort & Luxury Lodges';
    } else if (destSlug.includes('rishikesh')) {
      hotelName = 'LexaTrip Ganga View Riverside Wellness Resort & Luxury Camps';
    } else {
      hotelName = `LexaTrip ${destName.split('(')[0].trim()} Luxury Boutique Resort`;
    }
  }

  // 3. Extract Amenities
  const amenities = [];
  if (/pool|swimming/i.test(text)) amenities.push('Infinity Swimming Pool & Sundeck');
  if (/swiss\s*tent|tent|camp|glamping/i.test(text)) amenities.push('Luxury Climate-Controlled Swiss Glamping Tents');
  if (/buffet|dining|restaurant|food|dinner|bbq|barbecue/i.test(text)) amenities.push('Royal Multi-Cuisine Fine Dining & Desert Barbecue');
  if (/folk|dance|kalbelia|music|cultural/i.test(text)) amenities.push('Live Rajasthani Cultural Folk Dance & Musical Bonfire');
  if (/safari|camel|jeep|dune/i.test(text)) amenities.push('Golden Sunset Camel Safari & 4x4 Off-Road Dune Bashing');
  if (/wifi|internet/i.test(text)) amenities.push('High-Speed Seamless Wi-Fi Access');
  if (/spa|massage/i.test(text)) amenities.push('Ayurvedic Rejuvenation Spa & Wellness Center');

  if (amenities.length < 3) {
    amenities.push(
      '24/7 VIP Concierge & Personalized Room Service',
      'Complimentary Royal Morning Breakfast Spread',
      'Private Attached Marble Bathrooms with Premium Toiletries',
      'Live Evening Cultural Musical Performances'
    );
  }

  return { hotelName, starRating, starSymbol, starTag, amenities };
}

const test1 = parseHotelDetailsFromSeo({
  title: 'Royal Desert Safari',
  caption: 'Stay at Hotel Suryagarh Jaisalmer with 5 star luxury rooms and pool.',
  destination: { slug: 'jaisalmer', name: 'Jaisalmer' }
});
console.log('Test 1:', test1);

const test2 = parseHotelDetailsFromSeo({
  title: 'Desert Camping',
  caption: 'Experience luxury swiss tents with camel safari and folk dance at Sam Dunes.',
  destination: { slug: 'jaisalmer', name: 'Jaisalmer' }
});
console.log('Test 2:', test2);
