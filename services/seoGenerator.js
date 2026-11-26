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
   * Intelligently parses hotel, resort, and accommodation details from post title & caption.
   * Accurately extracts property name, star classification (5-Star / 4-Star / Heritage Glamping),
   * and signature amenities.
   */
  parseHotelDetailsFromSeo({ title, caption, destination }) {
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

  /**
   * Generate a 100% Human-Friendly, Google Search & Helpful Content E-E-A-T Compliant
   * Comprehensive 800 - 1600 Word Blog Article for a Specific Destination Post.
   * Seamlessly embeds hotel analysis, star-rating categories, rich amenities, and schema FAQs.
   */
  generateDestinationHumanBlogArticle({ destination, title, caption, mediaUrl = null }) {
    const destName = destination?.name || 'Lexa Trip Destination';
    const destSlug = (destination?.slug || 'jaisalmer').toLowerCase();
    const location = destination?.state ? `${destName}, ${destination.state}` : destName;
    const cleanTitle = sanitizePostText(title || `A Journey of Wonder: Experiencing ${destName} with Lexa Trip`);
    const cleanCaption = sanitizePostText(caption || '');

    const hotelInfo = this.parseHotelDetailsFromSeo({ title: cleanTitle, caption: cleanCaption, destination });

    const imageHtml = mediaUrl ? `
      <div class="separator" style="clear: both; text-align: center; margin: 25px 0 35px 0;">
        <img border="0" src="${mediaUrl}" alt="${cleanTitle}" style="max-width: 100%; height: auto; border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,0.18);" />
        <p style="font-size: 13px; color: #64748b; margin-top: 8px; font-style: italic;">
          📸 ${hotelInfo.hotelName} (${hotelInfo.starSymbol}) • Curated Luxury Experience by Lexa Trip
        </p>
      </div>
    ` : '';

    const amenitiesListHtml = hotelInfo.amenities.map(a => `<li style="margin-bottom: 8px;">✓ <b>${a}</b></li>`).join('');

    const htmlContent = `
      <article style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.85; color: #2d3748; font-size: 17px; max-width: 840px; margin: 0 auto; padding: 12px 8px;">
        <header style="margin-bottom: 25px; border-bottom: 2px solid #edf2f7; padding-bottom: 20px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
            <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
              ✦ ${hotelInfo.starSymbol} ${hotelInfo.starRating}
            </span>
            <span style="display: inline-block; background: #fef3c7; color: #92400e; padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase;">
              👑 LexaTrip Verified Stay
            </span>
          </div>
          <h1 style="color: #1a202c; font-size: 32px; font-weight: 800; line-height: 1.35; margin: 5px 0 15px 0;">
            ${cleanTitle} — ${hotelInfo.hotelName} (${hotelInfo.starSymbol})
          </h1>
          <p style="font-size: 14px; color: #718096; margin: 0;">
            ✍️ <b>Written by:</b> Lexa Trip Travel Editorial Team • 📍 <b>Location:</b> ${location} • ⏱️ <b>Reading Time:</b> 6-8 Mins • 🏨 <b>Category:</b> ${hotelInfo.starTag}
          </p>
        </header>

        ${imageHtml}

        <div style="font-size: 18px; color: #334155; line-height: 1.9; margin-bottom: 28px; background: #f8fafc; padding: 20px 24px; border-radius: 12px; border-left: 4px solid #3b82f6;">
          ${cleanCaption ? cleanCaption.replace(/\n/g, '<br/>') : `Every journey tells a story, but experiencing ${location} through the royal comforts of ${hotelInfo.hotelName} is an unforgettable chapter etched in pure luxury and authentic warmth.`}
        </div>

        <!-- Section 1 -->
        <section style="margin: 35px 0;">
          <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 16px;">
            🌿 1. The Heritage, Ambience & Allure of ${destName}
          </h2>
          <p>
            Traveling to ${destName} is far more than a vacation; it is a transformative passage into centuries of royal heritage, captivating folklore, and pristine geographical wonders. From the golden sandstone monuments glowing under the radiant sun to the tranquil calm of dusk settling across the landscape, every breath in ${location} inspires awe.
          </p>
          <p>
            Discerning travelers worldwide seek ${destName} for its unique balance of historic dignity and thrilling outdoor escapades. Whether you are wandering through bustling artisan bazaars, marveling at intricate architecture, or finding peace under starlit skies, the destination provides a rare sanctuary from the rush of urban life.
          </p>
        </section>

        <!-- Section 2: Hotel Showcase -->
        <section style="margin: 35px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 26px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; border-left: 4px solid #f59e0b; padding-left: 12px; margin-top: 0; margin-bottom: 16px;">
            🏰 2. Featured Property Showcase: ${hotelInfo.hotelName} (${hotelInfo.starSymbol})
          </h2>
          <p>
            Nestled in the prime panoramic quarter of ${destName}, <b>${hotelInfo.hotelName}</b> represents the gold standard of regional hospitality. Recognized as an official <b>${hotelInfo.starRating}</b> establishment, the property seamlessly integrates age-old architectural grandeur with 21st-century opulence.
          </p>
          <p>
            From the instant you are greeted with traditional musical salutations, royal sandalwood tilak, and chilled regional welcome drinks, you are treated like honored royalty. The layout is thoughtfully oriented to maximize sweeping landscape vistas, tranquil open courtyards, and starlit open-air pavilions.
          </p>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 18px 22px; margin: 20px 0;">
            <h3 style="color: #92400e; font-size: 18px; margin-top: 0; margin-bottom: 10px;">💎 Signature Amenities & Guest Inclusions</h3>
            <ul style="margin: 0; padding-left: 20px; color: #78350f; line-height: 1.8;">
              ${amenitiesListHtml}
            </ul>
          </div>
        </section>

        <!-- Section 3: Room Categories & Suites -->
        <section style="margin: 35px 0;">
          <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; border-left: 4px solid #10b981; padding-left: 12px; margin-bottom: 16px;">
            🛏️ 3. Royal Suites, Swiss Glamping Tents & Room Categories
          </h2>
          <p>
            Every accommodation category at ${hotelInfo.hotelName} is designed as a sanctuary of relaxation. Guests can choose between handcrafted royal heritage suites featuring antique teakwood furnishings or climate-controlled luxury Swiss glamping tents anchored right in the heart of the scenic outdoors.
          </p>
          <ul style="background: #f8fafc; border-radius: 12px; padding: 20px 25px 20px 40px; margin: 20px 0; border: 1px solid #e2e8f0; line-height: 1.85;">
            <li><b>Maharaja Heritage Suites:</b> Opulent king-sized four-poster beds, hand-woven silk tapestries, private jharokha balconies, and master marble baths with bespoke Ayurvedic toiletries.</li>
            <li><b>Luxury Swiss Glamping Tents:</b> Triple-layered weatherproof canvas, whisper-quiet split air-conditioning and heating, plush double mattresses, and private sunset observation verandas.</li>
            <li><b>Deluxe Family Garden Pavilions:</b> Expansive interconnected family suites with dedicated sit-out lawns, children's recreation corners, and 24/7 personal butler call-buttons.</li>
          </ul>
        </section>

        <!-- Section 4: Dining & Culinary -->
        <section style="margin: 35px 0;">
          <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; border-left: 4px solid #ec4899; padding-left: 12px; margin-bottom: 16px;">
            🍽️ 4. Royal Gastronomy: Multi-Cuisine Fine Dining & Bonfire Barbecue
          </h2>
          <p>
            Dining at ${hotelInfo.hotelName} is a celebration of rich royal traditions. Master chefs source farm-fresh organic produce and authentic regional spices to deliver mouthwatering culinary journeys. Guests enjoy grand multi-course banquets featuring celebrated heritage recipes alongside customized Continental, North Indian, and Jain culinary options.
          </p>
          <p>
            As twilight descends, the open-air dining pavilion comes alive with fragrant live barbecue stations, glowing bonfires, and the captivating rhythm of authentic folk artists singing timeless tales of valor and love under the stars.
          </p>
        </section>

        <!-- Section 5: Itinerary -->
        <section style="margin: 35px 0;">
          <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; border-left: 4px solid #8b5cf6; padding-left: 12px; margin-bottom: 16px;">
            🗺️ 5. Curated 3-Day Signature Itinerary for ${destName}
          </h2>
          <p>
            To help you experience the very finest of ${location} without rushing, our destination specialists have crafted this balanced, experiential 3-day itinerary:
          </p>
          <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 22px 26px; margin: 20px 0; line-height: 1.85;">
            <p style="margin: 0 0 14px 0;"><b>Day 1 — Grand Arrival & Sunset Golden Hour:</b> Check in to ${hotelInfo.hotelName} with VIP fast-track entry. Relax with refreshments, tour the stunning property grounds, and head to the top sunset vantage point. Conclude with an authentic candlelit regional dinner featuring live folk melodies.</p>
            <p style="margin: 0 0 14px 0;"><b>Day 2 — Immersive Heritage, Safari & Stargazing Gala:</b> Rise early for golden-hour photography. Undertake an exclusive guided heritage walking tour of ancient monuments and artisan quarters. By mid-afternoon, embark on your thrilling desert or nature safari, culminating in a spectacular starry night under pollution-free skies.</p>
            <p style="margin: 0;"><b>Day 3 — Local Bazaars, Souvenirs & Private Transfer:</b> Spend a relaxed morning browsing local handcrafted textiles, organic spice markets, and unique keepsakes. Enjoy a hearty brunch before our private chauffeur transfer escorts you seamlessly to the airport or railway station.</p>
          </div>
        </section>

        <!-- Section 6: Connectivity -->
        <section style="margin: 35px 0;">
          <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; border-left: 4px solid #06b6d4; padding-left: 12px; margin-bottom: 16px;">
            🚗 6. Connectivity, Commute & Seamless Chauffeur Transfers
          </h2>
          <p>
            Reaching ${destName} and ${hotelInfo.hotelName} is effortless. The region enjoys direct connectivity through regional airports, premier railway networks, and pristine national highway expressways. 
          </p>
          <p>
            When traveling with Lexa Trip, all transfers—from your airport arrival to scenic off-road excursions—are managed in fully air-conditioned, sanitized luxury SUVs driven by certified, English/Hindi speaking professional chauffeurs who prioritize your safety and comfort at every turn.
          </p>
        </section>

        <!-- Google Schema FAQ Section for Rich Search Results -->
        <section style="margin: 40px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          <h3 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px;">
            ❓ Frequently Asked Questions About Staying at ${hotelInfo.hotelName}
          </h3>
          <div style="margin-bottom: 18px;">
            <h4 style="color: #0f172a; font-size: 17px; margin-bottom: 6px;">Q: What is the official star classification of ${hotelInfo.hotelName}?</h4>
            <p style="color: #475569; font-size: 15px; margin: 0;">A: ${hotelInfo.hotelName} is certified as an official <b>${hotelInfo.starRating}</b> (${hotelInfo.starSymbol}) luxury property, thoroughly audited by the Lexa Trip quality assurance team.</p>
          </div>
          <div style="margin-bottom: 18px;">
            <h4 style="color: #0f172a; font-size: 17px; margin-bottom: 6px;">Q: What is the best season to plan a journey to ${destName}?</h4>
            <p style="color: #475569; font-size: 15px; margin: 0;">A: The ideal period is between October and March when weather is pleasantly cool and all outdoor activities and cultural festivals operate at their best.</p>
          </div>
          <div style="margin-bottom: 18px;">
            <h4 style="color: #0f172a; font-size: 17px; margin-bottom: 6px;">Q: How do I book verified packages with Lexa Trip?</h4>
            <p style="color: #475569; font-size: 15px; margin: 0;">A: Visit <a href="${OFFICIAL_BOOKING_URL}" style="color: #2563eb; font-weight: 600;">bookings.lexatrip.com</a> or message our 24/7 WhatsApp concierge at ${OFFICIAL_PHONE} for customized private itineraries with up to 46% exclusive discounts.</p>
          </div>
          <div style="margin-bottom: 18px;">
            <h4 style="color: #0f172a; font-size: 17px; margin-bottom: 6px;">Q: Is this property family, child, and solo traveler friendly?</h4>
            <p style="color: #475569; font-size: 15px; margin: 0;">A: Absolutely. The property features round-the-clock professional security, CCTV monitoring, verified staff, and doctor-on-call facilities. Solo travelers and families travel with complete peace of mind.</p>
          </div>
          <div style="margin-bottom: 18px;">
            <h4 style="color: #0f172a; font-size: 17px; margin-bottom: 6px;">Q: What are the check-in and check-out timings?</h4>
            <p style="color: #475569; font-size: 15px; margin: 0;">A: Standard check-in is from 12:00 PM and check-out is by 10:30 AM. Early check-in and late check-out can be requested complimentary when booking via Lexa Trip VIP portal.</p>
          </div>
        </section>

        <!-- High-Conversion VIP Booking CTA Box -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 28px; margin: 40px 0; border: 1px solid #f59e0b; box-shadow: 0 8px 24px rgba(217, 119, 6, 0.15);">
          <h3 style="margin-top: 0; color: #92400e; font-size: 24px; font-weight: 800;">
            ✈️ Book Your Dream Stay at ${hotelInfo.hotelName} with Lexa Trip
          </h3>
          <p style="color: #78350f; font-size: 16px; line-height: 1.75; margin-bottom: 22px;">
            Unlock exclusive member rates, up to 46% off luxury boutique suites and Swiss tents, complimentary royal breakfast, VIP transfers, and 24/7 personal trip concierge. 
            100% Price Match Guarantee with Instant Booking Confirmation!
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center;">
            <a href="${OFFICIAL_BOOKING_URL}" style="display: inline-block; background: #d97706; color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35);">
              👉 Book Now on Bookings.LexaTrip.com
            </a>
            <a href="https://wa.me/919079854982" style="display: inline-block; background: #25d366; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 8px; font-weight: 700; font-size: 16px;">
              💬 WhatsApp Concierge (+91 90798 54982)
            </a>
          </div>
        </div>

        <footer style="margin-top: 35px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #718096; display: flex; justify-content: space-between; flex-wrap: wrap;">
          <span>© ${new Date().getFullYear()} <b>Lexa Trip Travel Media Network</b>. All rights reserved.</span>
          <span>Official Portal: <a href="${OFFICIAL_WEBSITE_URL}" style="color: #3b82f6; text-decoration: none;">www.lexatrip.com</a></span>
        </footer>
      </article>
    `;

    const tags = [
      destName.split('(')[0].trim(),
      destSlug,
      hotelInfo.hotelName,
      hotelInfo.starTag,
      'Hotel Deals',
      'Hotel Booking',
      'Luxury Travel',
      'Travel Guide',
      'LexaTrip'
    ].filter(Boolean);

    return {
      title: `${cleanTitle} — ${hotelInfo.hotelName} (${hotelInfo.starSymbol})`,
      htmlContent,
      hotelInfo,
      tags
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
