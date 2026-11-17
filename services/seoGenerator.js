/**
 * Multi-Destination SEO Generator for Lexa Trip
 * Tailored specifically for Jaisalmer, Mount Abu, and custom future destinations.
 */

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
  }
};

class SEOGenerator {
  getDestinationConfig(destSlug = 'jaisalmer') {
    const slug = (destSlug || 'jaisalmer').toLowerCase();
    if (destinationData[slug]) return destinationData[slug];
    // Generic fallback for any custom destination
    return {
      name: `Lexa Trip ${destSlug}`,
      tagline: `Unforgettable Travel Experiences in ${destSlug}`,
      location: `${destSlug}, India`,
      themes: [
        { topic: `Must-Visit Highlights of ${destSlug}`, hook: `Discover the breathtaking sights of ${destSlug}...`, keywords: [`${destSlug} Tourism`, `Lexa Trip ${destSlug}`], hashtags: [`#LexaTrip`, `#${destSlug}Diaries`, '#TravelIndia'] },
        { topic: `Luxury Stays & Accommodations in ${destSlug}`, hook: `Experience world-class hospitality in ${destSlug}...`, keywords: [`${destSlug} Hotels`, `Luxury Stay`], hashtags: [`#LexaTrip`, `#${destSlug}Travel`, '#LuxuryStay'] },
        { topic: `Hidden Gems & Local Culture of ${destSlug}`, hook: `Immerse yourself in authentic traditions and stories...`, keywords: [`${destSlug} Culture`, 'Local Sightseeing'], hashtags: [`#LexaTrip`, `#${destSlug}Explore`, '#IncredibleIndia'] },
        { topic: `Outdoor Adventures & Sightseeing in ${destSlug}`, hook: `Feel the thrill of exploring the pristine landscapes...`, keywords: [`${destSlug} Adventure`, 'Outdoor Tours'], hashtags: [`#LexaTrip`, `#${destSlug}Adventure`, '#TravelGoals'] },
        { topic: `Local Cuisine & Authentic Flavors of ${destSlug}`, hook: `Savor the rich culinary heritage and traditional tastes...`, keywords: [`${destSlug} Food`, 'Culinary Travel'], hashtags: [`#LexaTrip`, `#${destSlug}Food`, '#FoodieTravel'] }
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
📲 Book your custom holiday package: Link in bio
📞 Call/WhatsApp: +91 98765 43210
🌐 Explore more: lexatrip.com/${destSlug}

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
        description: `${topic} travel guide by ${dest.name}. Bookings: https://lexatrip.com/${destSlug}\n\nTags: ${theme.keywords.join(', ')}`
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

📲 WhatsApp / Call to book: +91 98765 43210
🌐 Explore packages: lexatrip.com/${destSlug}

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
    const title = `5 Best Experiences in ${dest.location.split(',')[0]} ✈️✨ #Shorts #Reels`;
    const caption = `5 unforgettable moments you must experience in ${dest.location} with @${dest.name.toLowerCase().replace(/[^a-z0-9]/g, '')}! 🐪✨

Save this reel for your upcoming trip! Which of these 5 would you do first? 👇

Book custom packages: link in bio or WhatsApp +91 98765 43210.

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
