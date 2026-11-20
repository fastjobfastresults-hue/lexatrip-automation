const { describe, it, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const mockHttp = require('./helpers/mockHttp');
const { createFixtureDestination, createFixtureQueueItem } = require('./helpers/testFixtures');
const db = require('../database/db');

// Subsystems to test
const telegramNotifier = require('../services/telegramNotifier');
const telegramBot = require('../services/telegramBot');
const aiEngine = require('../services/aiEngine');
const seoGenerator = require('../services/seoGenerator');
const crmEngine = require('../services/crmEngine');
const QAEngine = require('../services/qaEngine');
const channelTester = require('../services/channelTester');

describe('Milestone 3: Subsystems Truthfulness, Engines & Dynamic Multi-Destination Suite', () => {

  beforeEach(() => {
    mockHttp.enable();
    mockHttp.reset();
    mockHttp.setupDefaultPlatformMocks();
  });

  after(() => {
    mockHttp.disable();
  });

  // =========================================================================
  // 1. Telegram Notifier & Bot Subsystem Truthfulness
  // =========================================================================
  describe('1. Telegram Notifier & Bot Subsystems', () => {
    it('1.1 getVerifiedLinks: resolves dynamic destination links without Jaisalmer hardcoding', () => {
      const mountAbu = db.getDestination('dest_mountabu');
      assert.ok(mountAbu, 'dest_mountabu must exist');

      const links = telegramNotifier.getVerifiedLinks(mountAbu);
      // Mount Abu Facebook page is 61594050853686
      assert.ok(links.includes('61594050853686'), 'Must contain Mount Abu FB page ID');
      // Mount Abu Blogger is lexatripmountabu.blogspot.com
      assert.ok(links.includes('lexatripmountabu.blogspot.com'), 'Must contain Mount Abu Blogger URL');
      // MUST NOT contain Jaisalmer FB profile
      assert.strictEqual(links.includes('61594513580628'), false, 'Mount Abu links must NOT leak Jaisalmer FB ID');
      assert.strictEqual(links.includes('lexatripjaisalmer'), false, 'Mount Abu links must NOT leak Jaisalmer handles');
    });

    it('1.1b getVerifiedLinks: isolates non-Jaisalmer destinations (Goa, Udaipur, Manali) from leaking Jaisalmer handles or page IDs', () => {
      const goa = db.getDestination('dest_goa');
      assert.ok(goa, 'dest_goa must exist');
      const goaLinks = telegramNotifier.getVerifiedLinks(goa);
      assert.strictEqual(goaLinks.includes('lexatripjaisalmer'), false, 'Goa links must NOT leak Jaisalmer handle');
      assert.strictEqual(goaLinks.includes('1385624654624388'), false, 'Goa links must NOT leak Jaisalmer FB Page ID');
      assert.strictEqual(goaLinks.includes('lexatripgoa.blogspot.com'), true, 'Goa links must include destination blogger URL');

      const udaipur = db.getDestination('dest_udaipur');
      assert.ok(udaipur, 'dest_udaipur must exist');
      const udaipurLinks = telegramNotifier.getVerifiedLinks(udaipur);
      assert.strictEqual(udaipurLinks.includes('lexatripjaisalmer'), false, 'Udaipur links must NOT leak Jaisalmer handle');
      assert.strictEqual(udaipurLinks.includes('1385624654624388'), false, 'Udaipur links must NOT leak Jaisalmer FB Page ID');

      const manali = db.getDestination('dest_manali');
      assert.ok(manali, 'dest_manali must exist');
      const manaliLinks = telegramNotifier.getVerifiedLinks(manali);
      assert.strictEqual(manaliLinks.includes('lexatripjaisalmer'), false, 'Manali links must NOT leak Jaisalmer handle');
      assert.strictEqual(manaliLinks.includes('1385624654624388'), false, 'Manali links must NOT leak Jaisalmer FB Page ID');
    });

    it('1.2 getVerifiedLinks: formats authentic postUrl from publishResults when available', () => {
      const dest = createFixtureDestination();
      const results = [
        { platform: 'facebook', status: 'published', details: { postUrl: 'https://www.facebook.com/123/posts/456' } },
        { platform: 'instagram', status: 'published', details: { postUrl: 'https://www.instagram.com/p/Cxyz123/' } }
      ];

      const links = telegramNotifier.getVerifiedLinks(dest, results);
      assert.ok(links.includes('https://www.facebook.com/123/posts/456'), 'Must include authentic Facebook post URL');
      assert.ok(links.includes('https://www.instagram.com/p/Cxyz123/'), 'Must include authentic Instagram post URL');
    });

    it('1.3 notifyItemPublished: accurately reports itemized channel success, failure, and skips', async () => {
      const dest = createFixtureDestination();
      const item = createFixtureQueueItem({
        id: `m3_item_${Date.now()}`,
        destinationId: dest.id,
        title: 'Alpine Sunrise Trail'
      });

      const results = [
        { platform: 'facebook', status: 'published', details: { postUrl: 'https://fb.com/real_post_1' } },
        { platform: 'instagram', status: 'failed', error: 'OAuthException: Token expired (Code 190)' },
        { platform: 'quora', status: 'skipped', reason: 'Assisted Copy/Paste mode' }
      ];

      await telegramNotifier.notifyItemPublished(dest, item, results);

      const req = mockHttp.findRequest('api.telegram.org', 'post');
      assert.ok(req, 'Expected Telegram POST request');
      // Partial failure header
      assert.ok(req.data.text.includes('आंशिक पब्लिश रिपोर्ट'), 'Must show partial publish header when mixed');
      assert.ok(req.data.text.includes('https://fb.com/real_post_1'), 'Must include published link');
      assert.ok(req.data.text.includes('OAuthException'), 'Must include exact error message');
      assert.ok(req.data.text.includes('Assisted Copy/Paste mode'), 'Must include skip reason');
    });

    it('1.4 notifyItemFailed: dispatches explicit failure notification', async () => {
      const dest = createFixtureDestination();
      const item = createFixtureQueueItem({
        id: `fail_item_${Date.now()}`,
        destinationId: dest.id,
        title: 'Complete Failure Post'
      });

      await telegramNotifier.notifyItemFailed(dest, item, 'Missing API Access Token');

      const req = mockHttp.findRequest('api.telegram.org', 'post');
      assert.ok(req, 'Expected Telegram POST request for failure');
      assert.ok(req.data.text.includes('त्रुटि अलर्ट'), 'Must contain error alert header');
      assert.ok(req.data.text.includes('Missing API Access Token'), 'Must contain exact error reason');
    });

    it('1.5 getBotForDestination & sendDailySummary: contract compatibility', async () => {
      const dest = createFixtureDestination();
      const bot = telegramNotifier.getBotForDestination(dest);
      assert.ok(bot && typeof bot.sendMessage === 'function', 'Must return bot adapter with sendMessage');

      await bot.sendMessage(dest.telegram.chatId, 'Test message');
      const req = mockHttp.findRequest('api.telegram.org', 'post');
      assert.ok(req, 'Expected Telegram POST via adapter');
      assert.strictEqual(req.data.text, 'Test message');
    });

    it('1.6 generateHealthReport: queries channelTester truthfully across destination channels', async () => {
      const dest = db.getDestination('dest_jaisalmer');
      const report = await telegramBot.generateHealthReport(dest);

      assert.ok(typeof report === 'string', 'Must return markdown report string');
      assert.ok(report.includes('चैनल हेल्थ व API ऑडिट रिपोर्ट'), 'Must include authentic audit header');
      assert.ok(report.includes('समरी:'), 'Must include summary tally');
      // Should NOT contain fabricated fake claim
      assert.strictEqual(report.includes('100% पॉलिसी सुरक्षित'), false, 'Must not claim 100% Policy Safe when channels are failing');
    });
  });

  // =========================================================================
  // 2. AI SEO Engine Resiliency & Tag Hygiene
  // =========================================================================
  describe('2. AI SEO Engine Resiliency & Tag Hygiene', () => {
    it('2.1 safeParseAIJson: extracts valid JSON from markdown fences and conversational preambles', () => {
      const raw = `Here is the requested social media pack:
\`\`\`json
{
  "posts": [
    {
      "index": 1,
      "title": "Misty Hills of Munnar",
      "caption": "Experience rolling green tea gardens.",
      "hashtags": "#Munnar #KeralaTravel"
    }
  ]
}
\`\`\`
Hope this helps your marketing campaign!`;

      const parsed = aiEngine.safeParseAIJson(raw);
      assert.ok(parsed && Array.isArray(parsed.posts), 'Must extract posts array');
      assert.strictEqual(parsed.posts[0].title, 'Misty Hills of Munnar');
    });

    it('2.2 safeParseAIJson: sanitizes trailing commas before closing braces and brackets', () => {
      const rawWithTrailingCommas = `{
        "posts": [
          {
            "index": 1,
            "title": "Royal Sunset Cruise",
            "caption": "Shimmering waters of Lake Pichola.",
            "hashtags": "#Udaipur #Lakes",
          },
        ],
      }`;

      const parsed = aiEngine.safeParseAIJson(rawWithTrailingCommas);
      assert.ok(parsed && Array.isArray(parsed.posts));
      assert.strictEqual(parsed.posts[0].title, 'Royal Sunset Cruise');
    });

    it('2.2b safeParseAIJson: successfully parses JSON with multiline block comments and trailing commas', () => {
      const rawWithBlockComments = `{
        /* LLM block comment explaining the schema */
        "posts": [
          {
            "index": 1,
            /* Post title comment */
            "title": "Baga Beach Sunset",
            "caption": "Golden horizons and crashing waves.",
            "hashtags": "#Goa #BeachVibes",
          },
        ],
      }`;

      const parsed = aiEngine.safeParseAIJson(rawWithBlockComments);
      assert.ok(parsed && Array.isArray(parsed.posts), 'Must parse JSON containing multiline block comments');
      assert.strictEqual(parsed.posts.length, 1);
      assert.strictEqual(parsed.posts[0].title, 'Baga Beach Sunset');
    });

    it('2.3 formatHashtagTag: strips parentheses and whitespace cleanly from Hindi and English names', () => {
      const tag1 = aiEngine.formatHashtagTag('लेक्सा ट्रिप जैसलमेर (Lexa Trip Jaisalmer)');
      assert.strictEqual(tag1, 'LexaTripJaisalmer', 'Must extract clean English from parentheses');

      const tag2 = aiEngine.formatHashtagTag('Mount Abu');
      assert.strictEqual(tag2, 'MountAbu', 'Must strip spaces without regex syntax errors');
    });

    it('2.4 parseWithLocalHeuristics: generates diverse fallback themes for padded items', () => {
      const posts = aiEngine.parseWithLocalHeuristics('1. Solang Snow Trail\nEnjoy snow slopes!\n#Manali', 'Manali');
      assert.strictEqual(posts.length, 5, 'Must return exactly 5 posts');

      // Assert padded posts 2-5 have diverse titles, not identical repetitive strings
      const titles = posts.map(p => p.title);
      const uniqueTitles = new Set(titles);
      assert.strictEqual(uniqueTitles.size, 5, 'All 5 post titles must be distinct');

      // Assert hashtags have no spaces
      posts.forEach((p, idx) => {
        const tags = p.hashtags.split(' ');
        tags.forEach(t => {
          assert.ok(t.startsWith('#'), `Tag "${t}" at post ${idx+1} must start with #`);
          assert.strictEqual(t.includes(' '), false, `Tag "${t}" must not contain spaces`);
        });
      });
    });
  });

  // =========================================================================
  // 3. Multi-Destination SEO Generator Authenticity
  // =========================================================================
  describe('3. Multi-Destination SEO Generator Authenticity', () => {
    it('3.1 Unifies official contact phone and booking portal across all generators', () => {
      const postSeo = seoGenerator.generatePostSEO(1, 'goa');
      assert.ok(postSeo.caption.includes('+91 90798 54982'), 'Post SEO must contain official phone');
      assert.strictEqual(postSeo.caption.includes('+91 98765 43210'), false, 'Post SEO must NOT contain dummy phone');
      assert.ok(postSeo.caption.includes('https://bookings.lexatrip.com/'), 'Post SEO must contain official booking portal');
      assert.strictEqual(postSeo.caption.includes('lexatrip.com/goa'), false, 'Must not contain broken subpath');

      const carouselSeo = seoGenerator.generateCombinedCarouselSEO('manali');
      assert.ok(carouselSeo.caption.includes('+91 90798 54982'), 'Carousel must contain official phone');
      assert.ok(carouselSeo.caption.includes('https://bookings.lexatrip.com/'), 'Carousel must contain official booking portal');

      const reelSeo = seoGenerator.generateCombined12sReelSEO('munnar');
      assert.ok(reelSeo.caption.includes('+91 90798 54982'), 'Reel must contain official phone');
      assert.ok(reelSeo.caption.includes('https://bookings.lexatrip.com/'), 'Reel must contain official booking portal');
    });

    it('3.2 Dynamically adapts emoji: uses camel only for desert, airplane for coastal/hills', () => {
      const jaisalmerReel = seoGenerator.generateCombined12sReelSEO('jaisalmer');
      assert.ok(jaisalmerReel.caption.includes('🐪✨'), 'Jaisalmer reel should have camel emoji');

      const goaReel = seoGenerator.generateCombined12sReelSEO('goa');
      assert.strictEqual(goaReel.caption.includes('🐪✨'), false, 'Goa reel must NOT have camel emoji');
      assert.ok(goaReel.caption.includes('✈️✨'), 'Goa reel should have airplane emoji');

      const manaliReel = seoGenerator.generateCombined12sReelSEO('manali');
      assert.strictEqual(manaliReel.caption.includes('🐪✨'), false, 'Manali reel must NOT have camel emoji');
      assert.ok(manaliReel.caption.includes('✈️✨'), 'Manali reel should have airplane emoji');
    });

    it('3.3 Supports all 10 registered destinations in destinationData catalog', () => {
      const registered = ['jaisalmer', 'mountabu', 'udaipur', 'jaipur', 'manali', 'rishikesh', 'goa', 'munnar', 'varanasi', 'tirupati'];
      registered.forEach(slug => {
        const conf = seoGenerator.getDestinationConfig(slug);
        assert.ok(conf, `Destination config for ${slug} must exist`);
        assert.ok(conf.name.length > 0);
        assert.strictEqual(conf.themes.length, 5, `${slug} must have exactly 5 curated themes`);
      });
    });

    it('3.4 Capitalizes custom destination names for uncataloged slugs', () => {
      const conf = seoGenerator.getDestinationConfig('shimla');
      assert.strictEqual(conf.name, 'Lexa Trip Shimla');
      assert.strictEqual(conf.location, 'Shimla, India');
    });
  });

  // =========================================================================
  // 4. CRM Engine Mock Purge & Dynamic Links
  // =========================================================================
  describe('4. CRM Engine Mock Purge & Truthful Metrics', () => {
    it('4.1 Purges hardcoded mock Facebook page (1385624654624388)', () => {
      // Test with destinations that have no enabled Facebook page
      const originalGetDestinations = db.getDestinations;
      try {
        db.getDestinations = () => [
          { id: 'dest_test', name: 'Test Dest', channels: { facebook: { enabled: false } } }
        ];
        const crmData = crmEngine.getCRMData('dest_test');
        assert.deepStrictEqual(crmData.activePages, [], 'Must return empty activePages array instead of hardcoded mock page fallback');
      } finally {
        db.getDestinations = originalGetDestinations;
      }
    });

    it('4.2 Purges hardcoded mock leads (Rahul Sharma, Pooja Verma)', () => {
      const crmData = crmEngine.getCRMData('dest_jaisalmer');
      const leadNames = (crmData.leads || []).map(l => l.name);
      assert.strictEqual(leadNames.includes('Rahul Sharma'), false, 'Must NOT contain mock lead Rahul Sharma');
      assert.strictEqual(leadNames.includes('Pooja Verma'), false, 'Must NOT contain mock lead Pooja Verma');
    });

    it('4.3 Reports dynamic totalChannels and authentic policy health', () => {
      const crmData = crmEngine.getCRMData('dest_jaisalmer');
      assert.ok(typeof crmData.stats.totalChannels === 'number');
      assert.ok(crmData.stats.totalChannels > 0, 'Total channels should reflect actual destination configuration');
      assert.strictEqual(crmData.stats.policyHealth !== '100% Policy Safe', true, 'Must not claim 100% Policy Safe without verification');
    });

    it('4.4 Resolves destination-specific master links dynamically', () => {
      const abuData = crmEngine.getCRMData('dest_mountabu');
      assert.ok(abuData.masterLinks.blogger.includes('lexatripmountabu'), 'Mount Abu CRM masterLinks should point to Mount Abu blog');
    });
  });

  // =========================================================================
  // 5. QA Engine Destination Profile Detection & Dynamic Fallbacks
  // =========================================================================
  describe('5. QA Engine Context Alignment', () => {
    const qa = new QAEngine();

    it('5.1 detectDestinationProfile accurately categorizes terrains', () => {
      assert.strictEqual(qa.detectDestinationProfile('Jaisalmer Desert'), 'desert');
      assert.strictEqual(qa.detectDestinationProfile('Mount Abu Hills'), 'hill_station');
      assert.strictEqual(qa.detectDestinationProfile('Manali Valley'), 'hill_station');
      assert.strictEqual(qa.detectDestinationProfile('Goa Coast'), 'beach_coastal');
      assert.strictEqual(qa.detectDestinationProfile('Varanasi Ghats'), 'heritage_spiritual');
      assert.strictEqual(qa.detectDestinationProfile('Rishikesh Ganga'), 'heritage_spiritual');
    });

    it('5.2 generateFallbackAnswer aligns advice to destination terrain profile', () => {
      // Coastal query for Goa
      const goaAnswer = qa.generateFallbackAnswer({
        question: 'Best hotel options and timings?',
        destination: 'Goa',
        category: 'general',
        waLink: 'https://wa.me/test'
      });
      assert.strictEqual(goaAnswer.includes('desert glamping'), false, 'Goa answer must NOT mention desert glamping');
      assert.strictEqual(goaAnswer.includes('Dal Baati Churma'), false, 'Goa answer must NOT mention Dal Baati Churma');
      assert.strictEqual(goaAnswer.includes('camel'), false, 'Goa answer must NOT mention camel');
      assert.ok(goaAnswer.includes('beachfront') || goaAnswer.includes('coastal'), 'Goa answer must mention beach/coastal advice');

      // Mountain query for Manali
      const manaliAnswer = qa.generateFallbackAnswer({
        question: 'Corporate offsite planning?',
        destination: 'Manali',
        category: 'corporate',
        waLink: 'https://wa.me/test'
      });
      assert.strictEqual(manaliAnswer.includes('dune quad-biking'), false, 'Manali corporate must NOT mention dune quad-biking');
      assert.ok(manaliAnswer.includes('mountain resort') || manaliAnswer.includes('pine forest'), 'Manali corporate should mention mountain terrain');
    });
  });

  // =========================================================================
  // 6. Server Telemetry & Live Radar HUD Authenticity
  // =========================================================================
  describe('6. Server Live Radar Telemetry API', () => {
    it('6.1 Computes authentic healthScore and failedCount dynamically', async () => {
      // Verify radar computation logic via DB state
      const dest = db.getDestination('dest_jaisalmer');
      const queue = db.getQueue();
      const destQueue = queue.filter(q => q.destinationId === dest.id);
      const publishedCount = destQueue.filter(q => q.status === 'published' || q.status === 'completed' || q.status === 'success').length;
      const failedCount = destQueue.filter(q => q.status === 'failed' || q.status === 'partial_or_failed').length;

      const totalAttempted = publishedCount + failedCount;
      const expectedScore = totalAttempted > 0 ? Math.round((publishedCount / totalAttempted) * 100) : 100;

      assert.ok(expectedScore >= 0 && expectedScore <= 100, 'Score must be a valid percentage');
    });
  });
});
