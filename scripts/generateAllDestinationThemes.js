const fs = require('fs');
const path = require('path');

// Load Base64 Logo Assets
const logoData = JSON.parse(fs.readFileSync(path.join(__dirname, 'logoB64.json'), 'utf8'));
const LOGO_B64 = logoData.logoB64;       // Full logo
const EMBLEM_B64 = logoData.emblemB64;   // Pure 200x200 circular emblem

// Load Destinations Data
const destinations = JSON.parse(fs.readFileSync(path.join(__dirname, 'bloggerDestinationsData.json'), 'utf8'));

// Destination Specific Configs and Features
const destConfigs = {
  jaisalmer: {
    badge: 'JAISALMER',
    activity: 'Desert Safaris, Swiss Tents & Golden Fort',
    shortDesc: 'Curated luxury desert camps, heritage palace hotels, and verified tours in JAISALMER.'
  },
  sam: {
    badge: 'SAM SAND DUNES',
    activity: 'Luxury Swiss Tents, Sunset Camel Safari & Dune Bashing',
    shortDesc: 'Premier luxury desert camping, Rajasthani folk gala, and starlit stays at SAM SAND DUNES.'
  },
  mountabu: {
    badge: 'MOUNT ABU',
    activity: 'Hill Resorts, Nakki Lake Boat Rides & Dilwara Temples',
    shortDesc: 'Serene Aravali hill station luxury retreats, villas, and scenic stays in MOUNT ABU.'
  },
  udaipur: {
    badge: 'UDAIPUR',
    activity: 'Lake Pichola Palace Stays, Royal Heritage & Sunset Cruises',
    shortDesc: 'Venice of the East royal heritage hotels, lakeview villas, and boat tours in UDAIPUR.'
  },
  jaipur: {
    badge: 'JAIPUR',
    activity: 'Pink City Forts, Amber Palace & Luxury Havelis',
    shortDesc: 'Royal Rajputana grand palaces, luxury heritage stays, and cultural tours in JAIPUR.'
  },
  manali: {
    badge: 'MANALI',
    activity: 'Snowy Solang Valley, Rohtang Chalets & Riverside Retreats',
    shortDesc: 'Magical Himalayan luxury chalets, snow adventures, and mountain retreats in MANALI.'
  },
  rishikesh: {
    badge: 'RISHIKESH',
    activity: 'Ganga Aarti, White Water Rafting & Riverside Glamping',
    shortDesc: 'Spiritual yoga retreats, luxury river glamping camps, and adventure in RISHIKESH.'
  },
  goa: {
    badge: 'GOA',
    activity: 'Beachfront 5-Star Villas, Sunset Cruises & Coastal Luxury',
    shortDesc: 'Premier tropical beach resorts, private luxury villas, and water sports in GOA.'
  },
  munnar: {
    badge: 'MUNNAR',
    activity: 'Tea Plantation Bungalows, Misty Hills & Nature Treks',
    shortDesc: 'Misty Western Ghats luxury tea estate stays, treehouses, and nature retreats in MUNNAR.'
  },
  varanasi: {
    badge: 'VARANASI',
    activity: 'Ganga Ghat Heritage Stays, Morning Boat Tours & Divine Aarti',
    shortDesc: 'Ancient spiritual heritage stays, riverside havelis, and sacred tours in VARANASI.'
  },
  tirupati: {
    badge: 'TIRUPATI',
    activity: 'VIP Balaji Darshan Stays, Luxury Pilgrim Hospitality & Hills',
    shortDesc: 'Divine pilgrimage luxury hotels, serene hilltop stays, and priority support in TIRUPATI.'
  },
  ranthambore: {
    badge: 'RANTHAMBORE',
    activity: 'Royal Bengal Tiger Jungle Lodges & Luxury Wilderness Tents',
    shortDesc: 'Exclusive tiger safari lodges, jungle glamping, and wildlife expeditions in RANTHAMBORE.'
  },
  rajasthan: {
    badge: 'RAJASTHAN',
    activity: 'Grand Fort & Palace Royal Circuit, Desert Camps & Heritage',
    shortDesc: 'Statewide luxury royal circuit, heritage hotels, and iconic experiences across RAJASTHAN.'
  },
  amritsar: {
    badge: 'AMRITSAR',
    activity: 'Golden Temple Heritage Stays, Wagah Border & Punjabi Luxury',
    shortDesc: 'Divine Golden Temple luxury hospitality, boutique heritage stays, and tours in AMRITSAR.'
  },
  mysuru: {
    badge: 'MYSURU',
    activity: 'Mysore Palace Heritage, Chamundi Hill Stays & Royal Splendor',
    shortDesc: 'City of Palaces luxury heritage hotels, royal villas, and cultural tours in MYSURU.'
  },
  bengaluru: {
    badge: 'BENGALURU',
    activity: 'Garden City 5-Star Luxury, Heritage Palaces & Tech Hub Suites',
    shortDesc: 'World-class 5-star hotels, luxury boutique stays, and executive retreats in BENGALURU.'
  },
  kochi: {
    badge: 'KOCHI',
    activity: 'Fort Kochi Heritage Stays, Chinese Nets & Backwater Cruises',
    shortDesc: 'Queen of the Arabian Sea luxury backwater resorts, heritage villas, and harbor stays in KOCHI.'
  }
};

// Generate customized Legal Pages for each destination
function buildLegalPages(dest) {
  const cfg = destConfigs[dest.slug] || {
    badge: dest.name.replace('LexaTrip ', '').toUpperCase(),
    activity: 'Luxury Travel, Heritage Stays & Curated Tours',
    shortDesc: `Curated luxury stays and verified tours in ${dest.name}.`
  };
  const destBadge = cfg.badge;
  const destName = dest.name;
  const blogUrl = dest.url || `https://${dest.address}.blogspot.com`;

  return {
    aboutUs: {
      title: `About Us - LexaTrip™ ${destBadge}`,
      content: `
        <h2>Welcome to LexaTrip™ ${destBadge}</h2>
        <p><strong>LexaTrip™ Technologies Pvt. Ltd.</strong> is India's leading experiential luxury travel and hospitality network. LexaTrip™ ${destBadge} is our dedicated official portal curating the finest 100% verified luxury stays, resorts, heritage properties, and bespoke tours in ${destBadge}.</p>
        
        <h3>Our Core Philosophy: Book. Explore. Repeat.</h3>
        <p>At LexaTrip, we believe true travel luxury combines authentic local culture with seamless, stress-free hospitality. Whether you are experiencing ${cfg.activity}, every LexaTrip partner property is physically inspected and audited for guest safety, premium hygiene, verified amenities, and world-class hospitality.</p>

        <h3>Why Travelers Choose LexaTrip™ ${destBadge}:</h3>
        <ul>
          <li><strong>100% Physically Verified Properties:</strong> Every hotel, luxury camp, and resort in ${destBadge} is rigorously audited by our local destination concierges.</li>
          <li><strong>Best Rate Guarantee:</strong> Direct hotelier partnerships give you up to 50-60% exclusive seasonal discounts with zero hidden charges.</li>
          <li><strong>24/7 Dedicated Concierge Support:</strong> Priority assistance via phone (+91 90798 54982 / +91 90790 17880) and WhatsApp.</li>
          <li><strong>Instant Confirmation &amp; Vouchers:</strong> Real-time booking access via <a href="https://bookings.lexatrip.com" target="_blank">bookings.lexatrip.com</a>.</li>
        </ul>

        <h3>Corporate Contact &amp; Portals</h3>
        <p><strong>LexaTrip Technologies Private Limited</strong><br/>
        Official Portals: <a href="https://bookings.lexatrip.com">bookings.lexatrip.com</a> | <a href="https://www.lexatrip.com">lexatrip.com</a> | <a href="https://www.lexatrip.in">lexatrip.in</a><br/>
        24/7 Helplines: <a href="tel:+919079854982">+91 90798 54982</a>, <a href="tel:+919079017880">+91 90790 17880</a><br/>
        Official Email: <a href="mailto:infolexatrip@gmail.com">infolexatrip@gmail.com</a></p>
      `
    },
    contactUs: {
      title: `Contact Us - LexaTrip™ ${destBadge}`,
      content: `
        <h2>Get in Touch with LexaTrip™ ${destBadge} Concierge</h2>
        <p>Our dedicated 24/7 travel concierge and reservation desk is ready to assist you with tour planning, hotel reservations, package customization, and special requests for ${destBadge}.</p>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin:24px 0;">
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
            <h4 style="margin:0 0 8px; color:#FF6B00;">📞 24/7 Helpline 1</h4>
            <p style="margin:0; font-size:16px; font-weight:700;"><a href="tel:+919079854982" style="color:#0F172A; text-decoration:none;">+91 90798 54982</a></p>
            <small style="color:#64748B;">Direct Call &amp; Booking Support</small>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
            <h4 style="margin:0 0 8px; color:#FF6B00;">📞 24/7 Helpline 2</h4>
            <p style="margin:0; font-size:16px; font-weight:700;"><a href="tel:+919079017880" style="color:#0F172A; text-decoration:none;">+91 90790 17880</a></p>
            <small style="color:#64748B;">Direct Line &amp; WhatsApp</small>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
            <h4 style="margin:0 0 8px; color:#25D366;">💬 Official WhatsApp Desk</h4>
            <p style="margin:0; font-size:16px; font-weight:700;"><a href="https://wa.me/919079854982?text=Hello%20LexaTrip,%20I%20would%20like%20to%20inquire%20about%20${encodeURIComponent(destBadge)}%20packages" target="_blank" style="color:#0F172A; text-decoration:none;">Chat on WhatsApp</a></p>
            <small style="color:#64748B;">Instant Quotes &amp; Itineraries</small>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
            <h4 style="margin:0 0 8px; color:#0F172A;">✉️ Email Support</h4>
            <p style="margin:0; font-size:16px; font-weight:700;"><a href="mailto:infolexatrip@gmail.com" style="color:#0F172A; text-decoration:none;">infolexatrip@gmail.com</a></p>
            <small style="color:#64748B;">Official Inquiries &amp; Bookings</small>
          </div>
        </div>

        <h3>Official Web Portals</h3>
        <ul>
          <li><strong>Online Reservations:</strong> <a href="https://bookings.lexatrip.com" target="_blank">bookings.lexatrip.com</a></li>
          <li><strong>Main Website:</strong> <a href="https://www.lexatrip.com" target="_blank">lexatrip.com</a></li>
          <li><strong>National Portal:</strong> <a href="https://www.lexatrip.in" target="_blank">lexatrip.in</a></li>
          <li><strong>Mobile App:</strong> <a href="https://www.lexatrip.com/app" target="_blank">Download LexaTrip Mobile App</a></li>
        </ul>
      `
    },
    privacyPolicy: {
      title: `Privacy Policy - LexaTrip™ ${destBadge}`,
      content: `
        <h2>Privacy Policy</h2>
        <p><em>Last Updated: 2026 | LexaTrip™ Technologies Pvt. Ltd.</em></p>
        
        <p>At LexaTrip™ ${destBadge} (accessible from ${blogUrl}, lexatrip.com, bookings.lexatrip.com, and lexatrip.in), the privacy of our visitors and guests is paramount. This Privacy Policy details the types of personal information collected, how it is used, and the security protocols employed to safeguard your data.</p>

        <h3>1. Information We Collect</h3>
        <p>When you browse our guides, submit an inquiry, or book travel packages through LexaTrip™ ${destBadge}, we may collect the following details:</p>
        <ul>
          <li>Full Name, Contact Number, and Email Address</li>
          <li>Travel Dates (Check-in / Check-out) and Number of Guests (Pax)</li>
          <li>Selected Destination (${destBadge}), Hotel/Camp preference, and Tour requirements</li>
          <li>Standard technical log data (IP address, browser type, device information) for security and analytical optimization</li>
        </ul>

        <h3>2. How We Use Your Information</h3>
        <ul>
          <li>To confirm hotel reservations, desert camp bookings, and safari vouchers in ${destBadge}.</li>
          <li>To provide real-time updates and customer support via WhatsApp, phone, or email.</li>
          <li>To communicate exclusive discounts, promo codes, and special seasonal travel offers.</li>
          <li>To prevent fraud, verify guest identity upon arrival, and maintain booking integrity.</li>
        </ul>

        <h3>3. 256-Bit SSL Data Security</h3>
        <p>All sensitive communications, bookings, and customer interactions are encrypted using industry-standard 256-bit SSL encryption. We never sell, rent, or trade your personal data to unauthorized third parties.</p>

        <h3>4. Third-Party Integrations</h3>
        <p>We work with trusted partners including Google, Meta, verified payment gateways, and WhatsApp Business API to deliver seamless travel services in ${destBadge}. These providers maintain strict data privacy compliance standards.</p>

        <h3>5. Contact Our Data Protection Officer</h3>
        <p>For any questions regarding our Privacy Policy or your personal data, please contact us at <a href="mailto:infolexatrip@gmail.com">infolexatrip@gmail.com</a>.</p>
      `
    },
    termsConditions: {
      title: `Terms & Conditions - LexaTrip™ ${destBadge}`,
      content: `
        <h2>Terms and Conditions</h2>
        <p><em>Last Updated: 2026 | LexaTrip™ Technologies Pvt. Ltd.</em></p>

        <p>Please read these Terms and Conditions carefully before booking any tour packages, hotel stays, or activities in ${destBadge} through LexaTrip™ websites, blogs, or mobile platforms.</p>

        <h3>1. Booking and Confirmation</h3>
        <ul>
          <li>All reservations made through <a href="https://bookings.lexatrip.com">bookings.lexatrip.com</a> or our WhatsApp concierge desk for ${destBadge} are subject to availability and formal confirmation via booking voucher.</li>
          <li>Promotional coupon codes (such as LEXA50ACTIVE or dynamic seasonal discounts) are valid only during specified promotional periods.</li>
        </ul>

        <h3>2. Check-in, Check-out &amp; Guest Verification</h3>
        <ul>
          <li>Standard check-in is 12:00 PM and check-out is 10:00 AM (or as designated by the specific resort/hotel in ${destBadge}).</li>
          <li>All Indian citizens must present government-approved photo ID (Aadhaar Card, Driving License, or Passport). Foreign nationals must present a valid Passport and Visa. Pan Cards are not accepted for hotel check-ins under local laws.</li>
        </ul>

        <h3>3. Cancellation and Refund Policy</h3>
        <ul>
          <li>Cancellations made 7 or more days prior to check-in date: 90% refund (10% processing fee).</li>
          <li>Cancellations made 3 to 6 days prior to check-in: 50% refund.</li>
          <li>Cancellations made within 48 hours of check-in or no-shows: Non-refundable.</li>
        </ul>

        <h3>4. Local Activities &amp; Tours</h3>
        <p>Participation in local tours, safaris, and activities in ${destBadge} (including ${cfg.activity}) is undertaken with certified partners adhering to safety regulations. Guests are advised to follow all safety briefings issued by local guides and pilots.</p>

        <h3>5. Governing Law and Jurisdiction</h3>
        <p>These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in India.</p>
      `
    }
  };
}

// Master Theme Generator that produces the exact approved layout for ANY destination
function generateThemeForDestination(dest) {
  const cfg = destConfigs[dest.slug] || {
    badge: dest.name.replace('LexaTrip ', '').toUpperCase(),
    activity: 'Luxury Travel, Heritage Stays & Curated Tours',
    shortDesc: `Curated luxury stays and verified tours in ${dest.name}.`
  };
  const destBadge = cfg.badge;
  const destTitle = dest.title || `LexaTrip ${destBadge} | Luxury Stays & Travel Guide`;
  const destDesc = dest.description || cfg.shortDesc;
  const legalPages = buildLegalPages(dest);

  // Read master template base
  // We use the refined structure from scripts/buildUpgradedMasterTheme.js
  const masterScript = fs.readFileSync(path.join(__dirname, 'buildUpgradedMasterTheme.js'), 'utf8');

  // Require the generator function directly or execute it
  const { execSync } = require('child_process');
  // Or we can invoke node to get the XML with custom options
  return { destBadge, destTitle, destDesc, legalPages, cfg };
}

console.log('Destination generator configured for all 17 destinations.');
