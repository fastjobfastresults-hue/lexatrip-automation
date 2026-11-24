/**
 * Multi-Destination SEO Generator for Lexa Trip
 * Tailored specifically for all 10 registered destinations and extensible custom destinations.
 */

const OFFICIAL_PHONE = '+91 90798 54982';
const OFFICIAL_BOOKING_URL = 'https://bookings.lexatrip.com/';
const OFFICIAL_WEBSITE_URL = 'https://www.lexatrip.com/';
const { sanitizePostText } = require('./textSanitizer');

const destinationData = {
  jaisalmer: {
    name: 'Lexa Trip Jaisalmer',
    tagline: 'Golden Dunes & Royal Desert Camping',
    location: 'Jaisalmer, Rajasthan',
    themes: [
      {
        topic: 'Golden Sunset Camel Safari & Sam Sand Dunes',
        hook: 'Watch the sun paint the endless golden dunes of Thar in warm amber hues...',
        keywords: ['Jaisalmer Desert Safari', 'Sam Sand Dunes', 'Sunset Camel Safari', 'Thar Desert Tour', 'Lexa Trip Jaisalmer'],
        hashtags: ['#LexaTripJaisalmer', '#JaisalmerDiaries', '#SamSandDunes', '#CamelSafari', '#TharDesert', '#RajasthanTourism', '#GoldenCity', '#DesertCamping', '#IncredibleIndia']
      },
      {
        topic: 'Royal Luxury Desert Camp & Swiss Tents under the Stars',
        hook: 'Experience true royalty under a sky filled with millions of twinkling stars...',
        keywords: ['Luxury Desert Camp Jaisalmer', 'Swiss Tents Jaisalmer', 'Desert Glamping', 'Royal Camping Jaisalmer', 'Lexa Trip'],
        hashtags: ['#LexaTripJaisalmer', '#LuxuryDesertCamp', '#JaisalmerCamping', '#GlampingIndia', '#SwissTentStay', '#StargazingDesert', '#LuxuryTravelIndia']
      },
      {
        topic: 'The 800-Year-Old Golden Living Fort (Sonar Qila) & Havelis',
        hook: 'Step into living history carved by master artisans from golden sandstone...',
        keywords: ['Jaisalmer Golden Fort', 'Sonar Qila', 'Patwon Ki Haveli', 'Heritage Walk Jaisalmer', 'Rajasthan History'],
        hashtags: ['#LexaTripJaisalmer', '#SonarQila', '#GoldenFort', '#PatwonKiHaveli', '#JaisalmerArchitecture', '#LivingFort', '#HeritageIndia']
      },
      {
        topic: 'Adrenaline High: 4x4 Dune Bashing & Quad Biking Thrills',
        hook: 'Hold tight as 4x4 tires conquer the golden crests of the Thar Desert...',
        keywords: ['Dune Bashing Jaisalmer', 'Jeep Safari Sam Dunes', 'Quad Biking Jaisalmer', 'Desert Adventure India'],
        hashtags: ['#LexaTripJaisalmer', '#DuneBashing', '#JeepSafari', '#DesertAdventure', '#QuadBiking', '#ThrillSeekers', '#OffroadIndia']
      },
      {
        topic: 'Kalbelia Folk Dance, Musical Nights & Royal Bonfire Feast',
        hook: 'When darkness blankets the dunes, soul-stirring folk melodies ignite the desert night...',
        keywords: ['Rajasthani Folk Dance', 'Kalbelia Dance Jaisalmer', 'Desert Bonfire Dinner', 'Dal Baati Churma'],
        hashtags: ['#LexaTripJaisalmer', '#RajasthaniFolkDance', '#KalbeliaDance', '#DesertNightLife', '#BonfireStories', '#DalBaatiChurma', '#CultureIndia']
      }
    ]
  },
  mountabu: {
    name: 'Lexa Trip Mount Abu',
    tagline: 'The Serene Oasis of Rajasthan - Nakki Lake & Aravali Hills',
    location: 'Mount Abu, Rajasthan',
    themes: [
      {
        topic: 'Serene Sunset Boating at Nakki Lake',
        hook: 'Gentle ripples, cool mountain breeze, and golden reflections at the sacred Nakki Lake...',
        keywords: ['Mount Abu Tourism', 'Nakki Lake Boating', 'Mount Abu Hill Station', 'Lexa Trip Mount Abu'],
        hashtags: ['#LexaTripMountAbu', '#NakkiLake', '#MountAbuDiaries', '#HillStationIndia', '#RajasthanOasis', '#SunsetBoating', '#IncredibleIndia']
      },
      {
        topic: 'Architectural Marvel: Dilwara Marble Jain Temples',
        hook: 'Intricate marble carvings that seem woven like lace over a thousand years ago...',
        keywords: ['Dilwara Temples', 'Mount Abu Marble Architecture', 'Jain Heritage India', 'Mount Abu Sightseeing'],
        hashtags: ['#LexaTripMountAbu', '#DilwaraTemples', '#MarbleCarvings', '#HeritageIndia', '#RajasthanHistory', '#ArchitectureLovers']
      },
      {
        topic: 'Breathtaking Panoramas from Guru Shikhar (Highest Peak)',
        hook: 'Stand atop the highest peak in the Aravali Range and gaze into the mist-clad valleys...',
        keywords: ['Guru Shikhar Mount Abu', 'Highest Peak Aravali', 'Mount Abu Trekking', 'Aravali Hills'],
        hashtags: ['#LexaTripMountAbu', '#GuruShikhar', '#AravaliRange', '#MountainViews', '#TrekkingIndia', '#NatureLovers']
      },
      {
        topic: 'Iconic Sunset Point & Toad Rock Adventure',
        hook: 'Where the sun sinks into dramatic rocky silhouettes of the ancient mountains...',
        keywords: ['Sunset Point Mount Abu', 'Toad Rock', 'Mount Abu Viewpoints', 'Adventure Travel Rajasthan'],
        hashtags: ['#LexaTripMountAbu', '#SunsetPoint', '#ToadRock', '#HillStationVibes', '#TravelRajasthan', '#AdventureLife']
      },
      {
        topic: 'Pleasant Weather, Mountain Cafes & Luxury Hill Resort Stays',
        hook: 'Escape the desert heat into lush pine greens, cozy weather, and boutique hospitality...',
        keywords: ['Mount Abu Resorts', 'Luxury Stay Mount Abu', 'Weekend Getaway Rajasthan', 'Lexa Trip Holidays'],
        hashtags: ['#LexaTripMountAbu', '#LuxuryResort', '#HillResortStay', '#WeekendGetaway', '#RelaxAndUnwind', '#TravelGoals']
      }
    ]
  },
  udaipur: {
    name: 'Lexa Trip Udaipur',
    tagline: 'City of Lakes & Regal Heritage Palaces',
    location: 'Udaipur, Rajasthan',
    themes: [
      {
        topic: 'Lake Pichola Royal Sunset Boat Cruise',
        hook: 'Drift past shimmering waters reflecting the iconic City Palace and Lake Palace...',
        keywords: ['Lake Pichola Cruise', 'Udaipur City of Lakes', 'Udaipur Sightseeing', 'Lexa Trip Udaipur'],
        hashtags: ['#LexaTripUdaipur', '#LakePichola', '#CityOfLakes', '#UdaipurDiaries', '#RoyalRajasthan', '#LakePalace']
      },
      {
        topic: 'Grandeur of City Palace & Vintage Havelis',
        hook: 'Marvel at 400 years of Mewar royal architecture overlooking pristine blue lakes...',
        keywords: ['City Palace Udaipur', 'Bagore Ki Haveli', 'Mewar Heritage', 'Udaipur Culture'],
        hashtags: ['#LexaTripUdaipur', '#CityPalaceUdaipur', '#MewarHeritage', '#HeritageIndia', '#RoyalVibes']
      },
      {
        topic: 'Romantic Dining by Ambrai Ghat Waters',
        hook: 'Savor candlelit regional fine dining with illuminated palace panoramas across the lake...',
        keywords: ['Ambrai Ghat Udaipur', 'Romantic Dining Udaipur', 'Lakeside Restaurant', 'Udaipur Tourism'],
        hashtags: ['#LexaTripUdaipur', '#RomanticDinner', '#LakesideDining', '#UdaipurVibes', '#IncredibleIndia']
      },
      {
        topic: 'Fateh Sagar Lake & Monsoon Palace Panoramic Drive',
        hook: 'Wind through the scenic hillside up to Sajjangarh Monsoon Palace for sunset vistas...',
        keywords: ['Fateh Sagar Lake', 'Monsoon Palace', 'Sajjangarh Udaipur', 'Scenic Drives'],
        hashtags: ['#LexaTripUdaipur', '#FatehSagar', '#MonsoonPalace', '#SunsetViews', '#TravelRajasthan']
      },
      {
        topic: 'Luxury Heritage Haveli Stays & Rajput Hospitality',
        hook: 'Wake up to morning jharokha lake views and authentic Mewari royal hospitality...',
        keywords: ['Udaipur Heritage Hotel', 'Luxury Resort Udaipur', 'Mewar Hospitality', 'Lexa Trip'],
        hashtags: ['#LexaTripUdaipur', '#LuxuryStay', '#HeritageResort', '#RoyalExperience', '#TravelGoals']
      }
    ]
  },
  jaipur: {
    name: 'Lexa Trip Jaipur',
    tagline: 'The Pink City of Royal Forts & Palaces',
    location: 'Jaipur, Rajasthan',
    themes: [
      {
        topic: 'Majestic Amber Fort & Maota Lake Panorama',
        hook: 'Ascend the rugged hills to witness the intricate mirror work of Sheesh Mahal...',
        keywords: ['Amber Fort Jaipur', 'Amer Fort', 'Jaipur Royal Forts', 'Lexa Trip Jaipur'],
        hashtags: ['#LexaTripJaipur', '#AmberFort', '#PinkCity', '#JaipurDiaries', '#RoyalForts', '#RajasthanTourism']
      },
      {
        topic: 'Hawa Mahal & The Vibrant Pink City Bazaars',
        hook: 'Admire 953 ornate honeycomb windows and explore colorful Johari & Bapu Bazaars...',
        keywords: ['Hawa Mahal Jaipur', 'Johari Bazaar', 'Pink City Architecture', 'Jaipur Shopping'],
        hashtags: ['#LexaTripJaipur', '#HawaMahal', '#JaipurBazaar', '#ShoppingJaipur', '#HeritageWalk']
      },
      {
        topic: 'Sunset from Nahargarh Fort Overlooking the City',
        hook: 'Watch the entire Pink City light up in golden amber from the ramparts of Nahargarh...',
        keywords: ['Nahargarh Fort Sunset', 'Padao Restaurant', 'Jaipur Night View', 'Aravali Forts'],
        hashtags: ['#LexaTripJaipur', '#NahargarhFort', '#SunsetInJaipur', '#CityViews', '#IncredibleIndia']
      },
      {
        topic: 'City Palace, Jantar Mantar & Royal Observatory',
        hook: 'Step into royal courtyards preserving astronomical wonders and Rajput royal treasures...',
        keywords: ['City Palace Jaipur', 'Jantar Mantar', 'UNESCO Jaipur', 'Jaipur Heritage'],
        hashtags: ['#LexaTripJaipur', '#CityPalace', '#JantarMantar', '#UNESCOHeritage', '#Architecture']
      },
      {
        topic: 'Regal Palace Hotel Stays & Traditional Dal Baati Feasts',
        hook: 'Immerse in royal heritage stays, courtyard folk dances, and authentic Rajasthani thali...',
        keywords: ['Jaipur Palace Hotel', 'Heritage Stay Jaipur', 'Chokhi Dhani Experience', 'Lexa Trip'],
        hashtags: ['#LexaTripJaipur', '#PalaceStay', '#RajasthaniFood', '#LuxuryTravelIndia', '#Culture']
      }
    ]
  },
  manali: {
    name: 'Lexa Trip Manali',
    tagline: 'Snow-Capped Himalayan Valleys & Adventure Trails',
    location: 'Manali, Himachal Pradesh',
    themes: [
      {
        topic: 'Thrilling Solang Valley Snow Sports & Paragliding',
        hook: 'Soar high above snow-clad pine peaks and carve through alpine meadows in Solang...',
        keywords: ['Solang Valley Manali', 'Manali Paragliding', 'Snow Sports Manali', 'Lexa Trip Manali'],
        hashtags: ['#LexaTripManali', '#SolangValley', '#ParaglidingManali', '#HimalayanAdventure', '#SnowValleys']
      },
      {
        topic: 'Rohtang Pass & Atal Tunnel High Altitude Gateway',
        hook: 'Drive through engineering marvels into snow paradises and dramatic Himalayan passes...',
        keywords: ['Rohtang Pass', 'Atal Tunnel', 'Lahaul Spiti Gate', 'High Altitude Manali'],
        hashtags: ['#LexaTripManali', '#RohtangPass', '#AtalTunnel', '#MountainDrive', '#SnowParadise']
      },
      {
        topic: 'Old Manali Bohemian Cafes & Cedar Forest Trails',
        hook: 'Wander amidst fragrant pine woods, live acoustic music, and riverside apple orchards...',
        keywords: ['Old Manali Cafes', 'Hadimba Temple', 'Manali Nature Walks', 'Beas River Walk'],
        hashtags: ['#LexaTripManali', '#OldManali', '#HadimbaTemple', '#CafeCulture', '#PineWoods']
      },
      {
        topic: 'Jogini Waterfall Trek & Vashisht Hot Springs',
        hook: 'Hike through terraced village paths to cascade waters and relax in natural sulfur baths...',
        keywords: ['Jogini Waterfall Trek', 'Vashisht Hot Water Spring', 'Manali Trekking', 'NatureTrails'],
        hashtags: ['#LexaTripManali', '#JoginiWaterfall', '#VashishtSprings', '#HimalayanTrek', '#NatureLovers']
      },
      {
        topic: 'Luxury Pine Wood Chalets & Mountain View Stays',
        hook: 'Sip hot chai by an open fireplace overlooking snow-crested Dhauladhar peaks...',
        keywords: ['Manali Luxury Resort', 'Apple Orchard Cottage', 'Mountain View Stay', 'Lexa Trip'],
        hashtags: ['#LexaTripManali', '#MountainResort', '#LuxuryCottage', '#WinterGetaway', '#TravelGoals']
      }
    ]
  },
  rishikesh: {
    name: 'Lexa Trip Rishikesh',
    tagline: 'Yoga Capital of the World & Ganga River Adventures',
    location: 'Rishikesh, Uttarakhand',
    themes: [
      {
        topic: 'White Water River Rafting on the Holy Ganga',
        hook: 'Conquer thrilling Grade III & IV rapids from Marine Drive and Shivpuri down the holy river...',
        keywords: ['Ganga River Rafting', 'Shivpuri Rafting', 'Rishikesh Adventure', 'Lexa Trip Rishikesh'],
        hashtags: ['#LexaTripRishikesh', '#RiverRafting', '#GangaRafting', '#AdventureCapital', '#UttarakhandTourism']
      },
      {
        topic: 'Divine Sunset Ganga Aarti at Triveni Ghat',
        hook: 'Feel the spiritual resonance of sacred chants and floating oil lamps illuminating the river...',
        keywords: ['Triveni Ghat Aarti', 'Ganga Aarti Rishikesh', 'Spiritual India', 'Rishikesh Temples'],
        hashtags: ['#LexaTripRishikesh', '#TriveniGhat', '#GangaAarti', '#SpiritualVibes', '#IncredibleIndia']
      },
      {
        topic: 'Beatles Ashram & Vibrant Tapovan Riverside Cafes',
        hook: 'Explore graffiti-adorned meditation domes and organic riverside wellness cafes...',
        keywords: ['Beatles Ashram Rishikesh', 'Chaurasi Kutia', 'Tapovan Cafes', 'Yoga Retreats'],
        hashtags: ['#LexaTripRishikesh', '#BeatlesAshram', '#Tapovan', '#YogaCapital', '#PeacefulTravel']
      },
      {
        topic: 'Bungee Jumping & Giant Swing Thrills at Mohan Chatti',
        hook: 'Take India highest 83-meter leap of faith surrounded by deep Himalayan gorges...',
        keywords: ['Rishikesh Bungee Jumping', 'Mohan Chatti Jumpin Heights', 'Extreme Sports India'],
        hashtags: ['#LexaTripRishikesh', '#BungeeJumping', '#GiantSwing', '#ExtremeAdventure', '#ThrillSeekers']
      },
      {
        topic: 'Luxury Riverside Glamping & Ayurvedic Wellness Stays',
        hook: 'Unwind at eco-luxury riverside camps with sound therapy, yoga, and organic dining...',
        keywords: ['Rishikesh Riverside Camp', 'Luxury Glamping Ganga', 'Yoga Resort Rishikesh', 'Lexa Trip'],
        hashtags: ['#LexaTripRishikesh', '#RiversideCamp', '#LuxuryWellness', '#AyurvedaRetreat', '#TravelGoals']
      }
    ]
  },
  goa: {
    name: 'Lexa Trip Goa',
    tagline: 'Sun-Kissed Beaches, Coastal Stays & Heritage Vistas',
    location: 'Goa, India',
    themes: [
      {
        topic: 'Pristine South Goa Secret Beaches & Sunset Walks',
        hook: 'Sink your feet into soft golden sands at Palolem, Agonda, and serene Cola beach...',
        keywords: ['South Goa Beaches', 'Palolem Beach', 'Agonda Sunset', 'Lexa Trip Goa'],
        hashtags: ['#LexaTripGoa', '#SouthGoa', '#PalolemBeach', '#BeachVibes', '#SunsetLovers', '#GoaDiaries']
      },
      {
        topic: 'Fontainhas Latin Quarter Heritage & Colorful Architecture',
        hook: 'Stroll through cobblestone streets lined with vibrant pastel Portuguese villas...',
        keywords: ['Fontainhas Latin Quarter', 'Panjim Heritage Walk', 'Goa Portuguese Architecture'],
        hashtags: ['#LexaTripGoa', '#Fontainhas', '#PanjimGoa', '#HeritageWalk', '#ColorfulStreets']
      },
      {
        topic: 'Water Sports Extravaganza: Scuba, Jet Ski & Parasailing',
        hook: 'Glide high over turquoise waves or explore underwater coral reefs at Grand Island...',
        keywords: ['Goa Scuba Diving', 'Grand Island Water Sports', 'Parasailing Goa', 'Adventure Goa'],
        hashtags: ['#LexaTripGoa', '#ScubaDiving', '#WaterSports', '#Parasailing', '#AdventureTravel']
      },
      {
        topic: 'Dudhsagar Waterfalls & Spice Plantation Jeep Trail',
        hook: 'Witness a thunderous milky cascade deep inside the lush Western Ghats jungles...',
        keywords: ['Dudhsagar Falls', 'Goa Spice Plantation Tour', 'Jeep Safari Goa', 'Western Ghats'],
        hashtags: ['#LexaTripGoa', '#DudhsagarWaterfalls', '#SpicePlantation', '#JungleSafari', '#NatureGoa']
      },
      {
        topic: 'Luxury Beachfront Villa Stays & Coastal Seafood Feasts',
        hook: 'Relax in private pool villas with fresh coastal dining and soothing sea breezes...',
        keywords: ['Luxury Villa Goa', 'Beachfront Resort Goa', 'Goan Cuisine', 'Lexa Trip Holidays'],
        hashtags: ['#LexaTripGoa', '#LuxuryVilla', '#BeachfrontStay', '#GoanFood', '#TravelGoals']
      }
    ]
  },
  munnar: {
    name: 'Lexa Trip Munnar',
    tagline: 'Verdant Tea Hills & Cloud-Kissed Valleys',
    location: 'Munnar, Kerala',
    themes: [
      {
        topic: 'Endless Rolling Tea Gardens & Kolukkumalai Sunrise',
        hook: 'Stand above sea of clouds at the highest tea plantation in the world...',
        keywords: ['Munnar Tea Plantations', 'Kolukkumalai Sunrise', 'Munnar Hills', 'Lexa Trip Munnar'],
        hashtags: ['#LexaTripMunnar', '#Kolukkumalai', '#TeaGardens', '#MunnarDiaries', '#GodsOwnCountry']
      },
      {
        topic: 'Eravikulam National Park & Rare Nilgiri Tahr',
        hook: 'Spot the endangered mountain goat amidst misty shola forests and rolling grasslands...',
        keywords: ['Eravikulam National Park', 'Nilgiri Tahr', 'Anamudi Peak', 'Munnar Wildlife'],
        hashtags: ['#LexaTripMunnar', '#Eravikulam', '#NilgiriTahr', '#WildlifeIndia', '#NatureLovers']
      },
      {
        topic: 'Mattupetty Dam & Echo Point Scenic Boat Ride',
        hook: 'Glide across reflective mountain reservoirs surrounded by mist-laden hill slopes...',
        keywords: ['Mattupetty Dam', 'Echo Point Munnar', 'Boating Munnar', 'Scenic Kerala'],
        hashtags: ['#LexaTripMunnar', '#MattupettyDam', '#EchoPoint', '#MistyHills', '#KeralaTourism']
      },
      {
        topic: 'Attukal & Lakkam Cascading Waterfalls Trail',
        hook: 'Hike through fragrant cardamom estates to crystalline jungle cascades...',
        keywords: ['Attukal Waterfalls', 'Lakkam Falls Munnar', 'Munnar Treks', 'Spice Plantations'],
        hashtags: ['#LexaTripMunnar', '#WaterfallsOfKerala', '#CardamomHills', '#TrekkingKerala', '#PureNature']
      },
      {
        topic: 'Luxury Treehouse Stays & Boutique Hill Plantation Resorts',
        hook: 'Wake up above the tree canopy to birdsong, morning mist, and fresh artisanal tea...',
        keywords: ['Treehouse Stay Munnar', 'Luxury Tea Resort', 'Kerala Honeymoon', 'Lexa Trip'],
        hashtags: ['#LexaTripMunnar', '#TreehouseLiving', '#LuxuryPlantation', '#HoneymoonInKerala', '#TravelGoals']
      }
    ]
  },
  varanasi: {
    name: 'Lexa Trip Varanasi',
    tagline: 'Spiritual Ghats, Sacred River & Timeless Living Heritage',
    location: 'Varanasi, Uttar Pradesh',
    themes: [
      {
        topic: 'Subah-e-Banaras: Sunrise Boat Ride on the Holy Ganga',
        hook: 'Witness the morning sun illuminate ancient riverfront palaces as chants fill the dawn air...',
        keywords: ['Varanasi Sunrise Boat Tour', 'Ganga Morning Ride', 'Assi Ghat', 'Lexa Trip Varanasi'],
        hashtags: ['#LexaTripVaranasi', '#SubahEBanaras', '#GangaBoatRide', '#VaranasiGhats', '#SpiritualCapital']
      },
      {
        topic: 'Mesmerizing Grand Evening Ganga Aarti at Dashashwamedh Ghat',
        hook: 'Stand in awe as synchronized sacred fire rituals honor Mother Ganga in twilight brilliance...',
        keywords: ['Dashashwamedh Ghat Aarti', 'Ganga Aarti Varanasi', 'Kashi Aarti', 'SacredIndia'],
        hashtags: ['#LexaTripVaranasi', '#DashashwamedhGhat', '#GangaAarti', '#KashiDiaries', '#DivineVibes']
      },
      {
        topic: 'Kashi Vishwanath Corridor & Ancient Galis (Lanes)',
        hook: 'Walk through narrow historic alleys redolent with incense, temple bells, and timeless stories...',
        keywords: ['Kashi Vishwanath Temple', 'Varanasi Galis Walk', 'Banaras Heritage', 'Kashi Tourism'],
        hashtags: ['#LexaTripVaranasi', '#KashiVishwanath', '#OldBanaras', '#HeritageWalk', '#IncredibleIndia']
      },
      {
        topic: 'Sarnath: Sacred Deer Park & Dhamek Stupa Excursion',
        hook: 'Explore the serene deer park where Lord Buddha preached his first sermon 2,500 years ago...',
        keywords: ['Sarnath Buddhist Tour', 'Dhamek Stupa', 'Ashoka Pillar', 'Buddha Circuit'],
        hashtags: ['#LexaTripVaranasi', '#Sarnath', '#DhamekStupa', '#BuddhistHeritage', '#PeaceAndHarmony']
      },
      {
        topic: 'Heritage Haveli Stays by the Ghats & Authentic Banarasi Flavors',
        hook: 'Savor famous Banarasi kachori, malaiyo, and lassi while staying in restored riverside palaces...',
        keywords: ['Varanasi Heritage Stay', 'Riverside Haveli', 'Banarasi Street Food', 'Lexa Trip'],
        hashtags: ['#LexaTripVaranasi', '#RiversidePalace', '#BanarasiFood', '#CulturalJourney', '#TravelGoals']
      }
    ]
  },
  tirupati: {
    name: 'Lexa Trip Tirupati',
    tagline: 'Sacred Seven Hills, Divine Darshan & Spiritual Peace',
    location: 'Tirupati, Andhra Pradesh',
    themes: [
      {
        topic: 'Divine Darshan of Lord Venkateswara at Tirumala',
        hook: 'Ascend the sacred Seshachalam hills to seek blessings at the world-renowned temple shrine...',
        keywords: ['Tirumala Balaji Darshan', 'Tirupati Temple Tour', 'Venkateswara Swamy', 'Lexa Trip Tirupati'],
        hashtags: ['#LexaTripTirupati', '#TirumalaDarshan', '#GovindaGovinda', '#SpiritualJourney', '#BalajiTemple']
      },
      {
        topic: 'Scenic Seven Hills Ghat Road Ascent & Viewpoints',
        hook: 'Journey through emerald forest hairpins with breathtaking panoramic valley vistas...',
        keywords: ['Tirumala Ghat Road', 'Seshachalam Hills', 'Tirupati Viewpoints', 'ScenicDrive'],
        hashtags: ['#LexaTripTirupati', '#GhatRoad', '#Seshachalam', '#SevenHills', '#SacredNature']
      },
      {
        topic: 'Padmavathi Ammavari Temple at Tiruchanur',
        hook: 'Visit the divine abode of Goddess Padmavathi situated in tranquil temple courtyards...',
        keywords: ['Padmavathi Ammavari Temple', 'Tiruchanur Temple', 'Tirupati Sightseeing', 'TemplesOfIndia'],
        hashtags: ['#LexaTripTirupati', '#PadmavathiTemple', '#Tiruchanur', '#TempleArchitecture', '#DivineBlessings']
      },
      {
        topic: 'Kapila Theertham Waterfalls & Sacred Shiva Cave Temple',
        hook: 'Marvel at cascading mountain waters plunging into holy natural pools at the foot of Tirumala...',
        keywords: ['Kapila Theertham Falls', 'Tirupati Waterfalls', 'Shiva Temple Tirupati', 'HolyTirupati'],
        hashtags: ['#LexaTripTirupati', '#KapilaTheertham', '#SacredFalls', '#SpiritualHeritage', '#Pilgrimage']
      },
      {
        topic: 'Comfortable VIP Darshan Packages & Luxury Hospitality',
        hook: 'Experience seamless VIP temple assistance, sanitized transport, and tranquil resort stays...',
        keywords: ['Tirupati VIP Darshan', 'Luxury Stay Tirupati', 'Tirumala Packages', 'Lexa Trip'],
        hashtags: ['#LexaTripTirupati', '#VIPDarshan', '#LuxuryPilgrimage', '#ComfortableTravel', '#TravelGoals']
      }
    ]
  }
};

class SEOGenerator {
  getDestinationConfig(destSlug = 'jaisalmer') {
    const slug = (destSlug || 'jaisalmer').toLowerCase();
    if (destinationData[slug]) return destinationData[slug];
    // Clean capitalized destination name for custom entries
    const capitalized = destSlug.charAt(0).toUpperCase() + destSlug.slice(1);
    return {
      name: `Lexa Trip ${capitalized}`,
      tagline: `Unforgettable Travel Experiences in ${capitalized}`,
      location: `${capitalized}, India`,
      themes: [
        { topic: `Must-Visit Highlights of ${capitalized}`, hook: `Discover the breathtaking sights of ${capitalized}...`, keywords: [`${capitalized} Tourism`, `Lexa Trip ${capitalized}`], hashtags: [`#LexaTrip`, `#${capitalized}Diaries`, '#TravelIndia'] },
        { topic: `Luxury Stays & Accommodations in ${capitalized}`, hook: `Experience world-class hospitality in ${capitalized}...`, keywords: [`${capitalized} Hotels`, `Luxury Stay ${capitalized}`], hashtags: [`#LexaTrip`, `#${capitalized}Travel`, '#LuxuryStay'] },
        { topic: `Hidden Gems & Local Culture of ${capitalized}`, hook: `Immerse yourself in authentic traditions and stories...`, keywords: [`${capitalized} Culture`, 'Local Sightseeing'], hashtags: [`#LexaTrip`, `#${capitalized}Explore`, '#IncredibleIndia'] },
        { topic: `Outdoor Adventures & Sightseeing in ${capitalized}`, hook: `Feel the thrill of exploring pristine landscapes...`, keywords: [`${capitalized} Adventure`, 'Outdoor Tours'], hashtags: [`#LexaTrip`, `#${capitalized}Adventure`, '#TravelGoals'] },
        { topic: `Local Cuisine & Authentic Flavors of ${capitalized}`, hook: `Savor the rich culinary heritage and traditional tastes...`, keywords: [`${capitalized} Food`, 'Culinary Travel'], hashtags: [`#LexaTrip`, `#${capitalized}Food`, '#FoodieTravel'] }
      ]
    };
  }

  /**
   * Generate Post SEO (Posts 1-5)
   */
  generatePostSEO(postIndex = 1, destSlug = 'jaisalmer', customTopic = null) {
    const dest = this.getDestinationConfig(destSlug);
    const idx = (postIndex - 1) % dest.themes.length;
    const theme = dest.themes[idx];
    const topic = customTopic || theme.topic;

    const title = `${topic} | ${dest.name}`;
    const caption = `✨ ${theme.hook}

Discover ${topic} with @${dest.name.toLowerCase().replace(/[^a-z0-9]/g, '')}. We craft unforgettable, customized travel journeys with verified luxury stays and seamless on-ground hospitality.

📍 Destination: ${topic}, ${dest.location}
📲 Book your custom holiday package: ${OFFICIAL_BOOKING_URL}
📞 Call/WhatsApp: ${OFFICIAL_PHONE}
🌐 Explore more: ${OFFICIAL_WEBSITE_URL}

${theme.hashtags.join(' ')}`;

    return {
      postIndex,
      topic,
      title,
      caption,
      keywords: theme.keywords,
      hashtags: theme.hashtags,
      pinterest: {
        title: `${topic} - ${dest.name}`,
        description: `Planning a trip to ${dest.location}? Discover the best ${topic} with ${dest.name}. Complete guides, luxury stays, and travel tips.`
      },
      youtube: {
        title: `${topic} in ${dest.location}! ✨ #Shorts`,
        description: `${topic} travel guide by ${dest.name}. Bookings: ${OFFICIAL_BOOKING_URL}\n\nTags: ${theme.keywords.join(', ')}`
      },
      altText: `${topic} in ${dest.location} by ${dest.name}`
    };
  }

  /**
   * Generate Combined 5-Slide Carousel SEO
   */
  generateCombinedCarouselSEO(destSlug = 'jaisalmer', customTitle = null) {
    const dest = this.getDestinationConfig(destSlug);
    const title = customTitle || `5 Unmissable Experiences in ${dest.location.split(',')[0]} [Swipe Left ➡️]`;

    const highlights = dest.themes.map((t, i) => `${i + 1}️⃣ ${t.topic}`).join('\n');

    const caption = `Swipe Left ➡️ Save this complete 5-step Travel Guide for your next vacation in ${dest.location}! ✨

${highlights}

Which experience are you adding to your bucket list? Comment below! 👇

✨ Why Travel With ${dest.name}?
✔️ Verified luxury resorts & camps
✔️ Customized sightseeing & adventure packages
✔️ 24/7 on-ground assistance & local guides

📲 WhatsApp / Call to book: ${OFFICIAL_PHONE}
🌐 Explore packages: ${OFFICIAL_BOOKING_URL}

${dest.themes.flatMap(t => t.hashtags.slice(0, 3)).join(' ')}`;

    return {
      type: 'combined_carousel',
      title,
      caption,
      keywords: [`${dest.name} Tour Package`, `${destSlug} Itinerary`, `Best places in ${destSlug}`],
      hashtags: dest.themes.flatMap(t => t.hashtags.slice(0, 2)),
      pinterest: {
        title: `Ultimate 5-Day Travel Guide to ${dest.location} | ${dest.name}`,
        description: `Everything you need to know before visiting ${dest.location}. Itinerary, top stays, and sightseeing highlights.`
      }
    };
  }

  /**
   * Generate 12-Second Combined Reel SEO
   */
  generateCombined12sReelSEO(destSlug = 'jaisalmer') {
    const dest = this.getDestinationConfig(destSlug);
    const isDesert = (destSlug || '').toLowerCase().includes('jaisalmer');
    const emoji = isDesert ? '🐪✨' : '✈️✨';
    const title = `5 Best Experiences in ${dest.location.split(',')[0]} ✈️✨ #Shorts #Reels`;
    const caption = `5 unforgettable moments you must experience in ${dest.location} with @${dest.name.toLowerCase().replace(/[^a-z0-9]/g, '')}! ${emoji}

Save this reel for your upcoming trip! Which of these 5 would you do first? 👇

Book custom packages: ${OFFICIAL_BOOKING_URL} or WhatsApp ${OFFICIAL_PHONE}.

${dest.themes.flatMap(t => t.hashtags.slice(0, 3)).join(' ')}`;

    return {
      type: 'combined_12s_reel',
      title,
      caption,
      duration: 12.0,
      keywords: [`${destSlug} reel`, `${destSlug} shorts`, 'travel reels', 'vacation goals']
    };
  }

  /**
   * Generate Full 800-1200 Word High-Converting SEO Blog Article
   * Works offline with zero API keys required, providing a 100% reliable fallback.
   */
  generateComprehensiveBlogArticle({ destSlug = 'jaisalmer', posts = [], customTitle = null, customCaption = null }) {
    const dest = this.getDestinationConfig(destSlug);
    const title = customTitle || `The Ultimate Luxury Travel Guide to ${dest.location} | Best Itinerary & Stays`;
    
    const postSections = (posts && posts.length > 0 ? posts : dest.themes.map((t, idx) => ({
      index: idx + 1,
      seo: { title: t.topic, caption: t.hook }
    }))).map((p, i) => {
      const heading = p.seo?.title || `Highlight ${i + 1}: ${dest.name} Magic`;
      const desc = p.seo?.caption || dest.themes[i % dest.themes.length]?.hook || '';
      return `
        <div style="margin: 30px 0; padding: 20px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <h3 style="color: #1e293b; font-size: 20px; margin-top: 0; margin-bottom: 12px;">
            ${i + 1}. ${heading}
          </h3>
          <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 12px;">
            ${desc.replace(/\n/g, '<br/>')}
          </p>
          <ul style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li><b>Recommended Duration:</b> 2-3 Hours</li>
            <li><b>Best Time for Photos:</b> Golden Hour / Early Morning</li>
            <li><b>Lexa Trip Insider Tip:</b> Pre-book fast-track entry and private guide through Lexa Trip Concierge.</li>
          </ul>
        </div>
      `;
    }).join('\n');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; color: #1e293b; font-size: 16px; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; margin-bottom: 20px; line-height: 1.3;">
          ✦ ${title} ✦
        </h1>
        
        <p style="font-size: 18px; color: #334155; line-height: 1.8; margin-bottom: 25px;">
          ${customCaption ? customCaption.replace(/\n/g, '<br/>') : `Planning your dream trip to ${dest.location}? From majestic palaces and royal stays to thrilling outdoor adventures and serene cultural evenings, ${dest.name} brings you the most curated luxury travel experience.`}
        </p>

        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 5px solid #2563eb; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 18px; font-weight: 700;">
            🌟 Fast Facts & Essential Travel Info
          </h4>
          <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
            • <b>Destination:</b> ${dest.location}<br/>
            • <b>Signature Experience:</b> ${dest.tagline}<br/>
            • <b>Booking Portal:</b> <a href="${OFFICIAL_BOOKING_URL}" style="color: #2563eb; font-weight: 600;">bookings.lexatrip.com</a><br/>
            • <b>Concierge Helpline:</b> ${OFFICIAL_PHONE}
          </p>
        </div>

        <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-top: 35px; margin-bottom: 15px;">
          Top 5 Must-Experience Highlights in ${dest.location}
        </h2>

        ${postSections}

        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 25px; margin: 40px 0; border: 1px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e; font-size: 22px; font-weight: 700;">
            ✈️ Book Your Personalized Luxury Package with Lexa Trip
          </h3>
          <p style="color: #78350f; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">
            Enjoy up to 46% off on verified luxury boutique hotels, private desert camps, airport transfers, and VIP sightseeing. 
            Instant confirmation with Best Price Guaranteed and zero hidden fees!
          </p>
          <a href="${OFFICIAL_BOOKING_URL}" style="display: inline-block; background: #d97706; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 16px;">
            👉 Book Instantly on Bookings.LexaTrip.com
          </a>
          <span style="display: inline-block; margin-left: 15px; color: #92400e; font-weight: 600;">
            📞 WhatsApp: ${OFFICIAL_PHONE}
          </span>
        </div>

        <p style="font-size: 14px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          Published by <b>Lexa Trip Travel Media Network</b> • Official Website: <a href="${OFFICIAL_WEBSITE_URL}" style="color: #64748b;">www.lexatrip.com</a>
        </p>
      </div>
    `;

    return {
      title,
      htmlContent,
      excerpt: customCaption ? customCaption.substring(0, 160) : `Complete luxury travel guide and 5 best experiences in ${dest.location} by Lexa Trip.`,
      tags: dest.themes.flatMap(t => t.hashtags.map(h => h.replace('#', ''))).slice(0, 10)
    };
  }

  /**
   * Generate a 100% Human-Friendly, Google Search & Helpful Content E-E-A-T Compliant
   * Comprehensive 800+ Word Blog Article for a Specific Destination Post.
   */
  generateDestinationHumanBlogArticle({ destination, title, caption, mediaUrl = null }) {
    const destName = destination?.name || 'Lexa Trip Destination';
    const destSlug = destination?.slug || 'jaisalmer';
    const location = destination?.state ? `${destName}, ${destination.state}` : destName;
    const cleanTitle = sanitizePostText(title || `A Journey of Wonder: Experiencing ${destName} with Lexa Trip`);
    const cleanCaption = sanitizePostText(caption || '');

    const imageHtml = mediaUrl ? `
      <div class="separator" style="clear: both; text-align: center; margin: 25px 0 35px 0;">
        <img border="0" src="${mediaUrl}" alt="${cleanTitle}" style="max-width: 100%; height: auto; border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,0.18);" />
        <p style="font-size: 13px; color: #64748b; margin-top: 8px; font-style: italic;">
          📸 Authentic Travel Moments in ${destName} • Curated by Lexa Trip
        </p>
      </div>
    ` : '';

    const htmlContent = `
      <article style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.85; color: #2d3748; font-size: 17px; max-width: 820px; margin: 0 auto; padding: 10px 5px;">
        <header style="margin-bottom: 25px; border-bottom: 2px solid #edf2f7; padding-bottom: 20px;">
          <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
            ✦ Destination Spotlight & Travel Guide
          </span>
          <h1 style="color: #1a202c; font-size: 30px; font-weight: 800; line-height: 1.35; margin: 5px 0 15px 0;">
            ${cleanTitle}
          </h1>
          <p style="font-size: 14px; color: #718096; margin: 0;">
            ✍️ <b>Written by:</b> Lexa Trip Travel Concierge • 📍 <b>Destination:</b> ${location} • ⏱️ <b>Reading Time:</b> 4 Mins
          </p>
        </header>

        ${imageHtml}

        <div style="font-size: 18px; color: #334155; line-height: 1.9; margin-bottom: 25px;">
          ${cleanCaption ? cleanCaption.replace(/\n/g, '<br/>') : `Every journey tells a story, but traveling through ${location} with Lexa Trip is an experience that stays etched in your heart forever.`}
        </div>

        <section style="margin: 35px 0;">
          <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 16px;">
            🌿 1. The Soul of ${destName}: Culture, Heritage & Serenity
          </h2>
          <p>
            When traveling to ${destName}, you are not merely visiting a tourist spot; you are stepping into a living legacy of royal hospitality, breathtaking natural landscapes, and timeless architecture. From morning sunrises casting golden reflections to the tranquil whisper of evenings under open skies, every moment in this destination invites you to slow down and savor the magic of travel.
          </p>
          <p>
            Travelers from around the globe choose ${destName} for its unique blend of regal tranquility and exhilarating adventures. Whether exploring historical marvels, strolling through local artisan bazaars, or feeling the peaceful solace of nature, the destination offers an unmatched retreat from the fast pace of modern life.
          </p>
        </section>

        <section style="margin: 35px 0;">
          <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; border-left: 4px solid #d97706; padding-left: 12px; margin-bottom: 16px;">
            ✨ 2. Curated First-Hand Recommendations & Pro Travel Tips
          </h2>
          <p>
            To ensure your visit is completely seamless and unforgettable, the Lexa Trip destination team has assembled these vetted insider recommendations:
          </p>
          <ul style="background: #f8fafc; border-radius: 12px; padding: 20px 25px 20px 40px; margin: 20px 0; border: 1px solid #e2e8f0; line-height: 1.8;">
            <li><b>Best Time for Sightseeing & Photography:</b> Early mornings between 6:30 AM and 8:30 AM offer the most enchanting natural light and serene crowd-free photography.</li>
            <li><b>Local Culinary Gems:</b> Do not miss authentic regional cuisine prepared with traditional spices and pure organic ghee, celebrated across ${location}.</li>
            <li><b>What to Pack:</b> Comfortable walking shoes, breathable cotton fabrics for warm daytime exploration, and cozy layers for crisp mountain or desert evenings.</li>
            <li><b>VIP Concierge Access:</b> Avoid long queues and tourist traps by reserving verified transportation and boutique stays directly with Lexa Trip.</li>
          </ul>
        </section>

        <section style="margin: 35px 0;">
          <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; border-left: 4px solid #10b981; padding-left: 12px; margin-bottom: 16px;">
            🏰 3. Luxury Boutique Stays & Authentic Desert / Hill Camps
          </h2>
          <p>
            Where you rest your head defines your travel memory. Lexa Trip curates exclusively verified properties across ${location}—from royal palace heritage hotels and serene lakeside villas to luxury Swiss glamping tents with ensuite marble bathrooms, climate control, and private stargazing decks.
          </p>
          <p>
            Every stay booked through Lexa Trip comes with verified sanitary hygiene, round-the-clock concierge support, complimentary breakfast spreads, and authentic cultural performances right at your doorstep.
          </p>
        </section>

        <!-- Google Schema FAQ Section for Rich Search Results -->
        <section style="margin: 40px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          <h3 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px;">
            ❓ Frequently Asked Questions About Visiting ${destName}
          </h3>
          <div style="margin-bottom: 18px;">
            <h4 style="color: #0f172a; font-size: 17px; margin-bottom: 6px;">Q: What is the best season to plan a journey to ${destName}?</h4>
            <p style="color: #475569; font-size: 15px; margin: 0;">A: The ideal period is between October and March when weather is pleasantly cool and all outdoor activities and cultural festivals operate at their best.</p>
          </div>
          <div style="margin-bottom: 18px;">
            <h4 style="color: #0f172a; font-size: 17px; margin-bottom: 6px;">Q: How do I book verified packages with Lexa Trip?</h4>
            <p style="color: #475569; font-size: 15px; margin: 0;">A: Visit <a href="${OFFICIAL_BOOKING_URL}" style="color: #2563eb; font-weight: 600;">bookings.lexatrip.com</a> or message our 24/7 WhatsApp concierge at ${OFFICIAL_PHONE} for customized private itineraries.</p>
          </div>
        </section>

        <!-- High-Conversion VIP Booking CTA Box -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 25px; margin: 40px 0; border: 1px solid #f59e0b; box-shadow: 0 8px 24px rgba(217, 119, 6, 0.12);">
          <h3 style="margin-top: 0; color: #92400e; font-size: 22px; font-weight: 800;">
            ✈️ Ready for the Ultimate Experience in ${destName}?
          </h3>
          <p style="color: #78350f; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">
            Unlock exclusive private packages, up to 46% off luxury boutique stays, and dedicated 24/7 personal trip assistance. 
            Enjoy 100% price guarantee and instant confirmation!
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
            <a href="${OFFICIAL_BOOKING_URL}" style="display: inline-block; background: #d97706; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);">
              👉 Book Now on Bookings.LexaTrip.com
            </a>
            <a href="https://wa.me/919079854982" style="display: inline-block; background: #25d366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 16px;">
              💬 WhatsApp Concierge (+91 90798 54982)
            </a>
          </div>
        </div>

        <footer style="margin-top: 35px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #718096; display: flex; justify-content: space-between; flex-wrap: wrap;">
          <span>© ${new Date().getFullYear()} <b>Lexa Trip Travel Media</b>. All rights reserved.</span>
          <span>Official Portal: <a href="${OFFICIAL_WEBSITE_URL}" style="color: #3b82f6; text-decoration: none;">www.lexatrip.com</a></span>
        </footer>
      </article>
    `;

    return {
      title: cleanTitle,
      htmlContent,
      excerpt: caption ? caption.substring(0, 160) : `Complete luxury travel guide to ${location} with curated stays and itineraries by Lexa Trip.`,
      tags: [destSlug, `${destSlug} travel`, 'lexatrip', 'luxury travel', 'india tourism', 'vacation', 'trip guide']
    };
  }

  /**
   * Full suite for a batch
   */
  generateBatchSEO(destSlug = 'jaisalmer') {
    const posts = [];
    for (let i = 1; i <= 5; i++) {
      posts.push(this.generatePostSEO(i, destSlug));
    }
    const combinedCarousel = this.generateCombinedCarouselSEO(destSlug);
    const combined12sReel = this.generateCombined12sReelSEO(destSlug);

    return { posts, combinedCarousel, combined12sReel };
  }
}

module.exports = new SEOGenerator();
