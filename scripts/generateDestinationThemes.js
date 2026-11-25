const fs = require('fs');
const path = require('path');

const destinationsMeta = [
  {
    slug: 'jaisalmer',
    badge: 'JAISALMER',
    hindiName: 'जैसलमेर',
    title: 'जैसलमेर लक्ज़री स्टे व हेरिटेज गाइड',
    desc: 'स्वर्ण नगरी जैसलमेर में लक्ज़री टेंट कैंप्स, हेरिटेज फोर्ट होटल्स और डेज़र्ट सफारी का सबसे विश्वसनीय अनुभव।'
  },
  {
    slug: 'sam',
    badge: 'SAM SAND DUNES',
    hindiName: 'सैम सैंड ड्यून्स',
    title: 'सैम सैंड ड्यून्स लक्ज़री डेज़र्ट कैंप्स व सफारी',
    desc: 'सैम के सुनहरे रेगिस्तान में लक्ज़री स्विस टेंट्स, जीप ड्यून बैशिंग और शाम की राजस्थानी सांस्कृतिक गाला नाइट।'
  },
  {
    slug: 'mountabu',
    badge: 'MOUNT ABU',
    hindiName: 'माउंट आबू',
    title: 'माउंट आबू लक्ज़री रिसॉर्ट्स व हिल स्टेशन गाइड',
    desc: 'राजस्थान के एकमात्र हिल स्टेशन में शांत नक्की झील, दिलवाड़ा मंदिर और अरावली की ठंडी वादियों में लक्ज़री स्टे।'
  },
  {
    slug: 'udaipur',
    badge: 'UDAIPUR',
    hindiName: 'उदयपुर',
    title: 'उदयपुर रॉयल पैलेस व लेकव्यू लक्ज़री गाइड',
    desc: 'झीलों की नगरी उदयपुर में लेक पिछोला बोट क्रूज़, सिटी पैलेस हेरिटेज और 5-स्टार लेकव्यू होटल्स।'
  },
  {
    slug: 'jaipur',
    badge: 'JAIPUR',
    hindiName: 'जयपुर',
    title: 'जयपुर पिंक सिटी रॉयल हेरिटेज स्टे गाइड',
    desc: 'गुलाबी नगरी जयपुर में आमेर फोर्ट, हवा महल और भव्य राजपूताना 5-स्टार हेरिटेज महलों का अनुभव।'
  },
  {
    slug: 'manali',
    badge: 'MANALI',
    hindiName: 'मनाली',
    title: 'मनाली स्नो वैली व लक्ज़री रिसॉर्ट्स गाइड',
    desc: 'हिमाचल की बर्फ से ढकी वादियों, सोलांग वैली, अटल टनल और लक्ज़री माउंटेन कॉटेज का अनोखा अनुभव।'
  },
  {
    slug: 'rishikesh',
    badge: 'RISHIKESH',
    hindiName: 'ऋषिकेश',
    title: 'ऋषिकेश गंगा व्यू कैंप्स व वेलनेस रिट्रीट्स',
    desc: 'विश्व योग राजधानी में गंगा किनारे लक्ज़री कैंपिंग, रोमांचक रिवर राफ्टिंग और शांत आध्यात्मिक रिट्रीट्स।'
  },
  {
    slug: 'goa',
    badge: 'GOA',
    hindiName: 'गोवा',
    title: 'गोवा 5-स्टार बीच रिसॉर्ट्स व क्रूज़ गाइड',
    desc: 'सुनहरे बीचेस, सनसेट क्रूज़, वाटर स्पोर्ट्स और नॉर्थ व साउथ गोवा के प्रीमियम लक्ज़री विलाज।'
  },
  {
    slug: 'munnar',
    badge: 'MUNNAR',
    hindiName: 'मुन्नार',
    title: 'मुन्नार टी एस्टेट व हिल्स लक्ज़री विलाज',
    desc: 'केरल के हरे-भरे चाय बागानों, धुंधले पहाड़ों और शांत वातावरण में प्रीमियम नेचर रिसॉर्ट्स।'
  },
  {
    slug: 'varanasi',
    badge: 'VARANASI',
    hindiName: 'वाराणसी',
    title: 'वाराणसी गंगा घाट व हेरिटेज स्टे गाइड',
    desc: 'प्राचीन काशी के पावन गंगा घाट, भव्य महाआरती दर्शन और ऐतिहासिक रिवरव्यू हेरिटेज स्टे।'
  },
  {
    slug: 'tirupati',
    badge: 'TIRUPATI',
    hindiName: 'तिरुपति',
    title: 'तिरुपति बालाजी दर्शन व लक्ज़री स्टे गाइड',
    desc: 'भगवान श्री वेंकटेश्वर स्वामी के पवित्र दर्शन, सुगम यात्रा प्रबंधन और प्रीमियम कंफर्ट स्टे।'
  },
  {
    slug: 'ranthambore',
    badge: 'RANTHAMBORE',
    hindiName: 'रणथंभौर',
    title: 'रणथंभौर टाइगर सफारी व जंगल लॉज गाइड',
    desc: 'विश्व प्रसिद्ध नेशनल पार्क में रोमांचक रॉयल बंगाल टाइगर सफारी और लक्ज़री वाइल्डलाइफ लॉज।'
  },
  {
    slug: 'rajasthan',
    badge: 'RAJASTHAN',
    hindiName: 'राजस्थान',
    title: 'राजस्थान रॉयल हेरिटेज व टूरिज्म गाइड',
    desc: 'पधारो म्हारे देस — किलों, महलों, रेगिस्तान और समृद्ध राजपूती संस्कृति का संपूर्ण लक्ज़री गाइड।'
  },
  {
    slug: 'amritsar',
    badge: 'AMRITSAR',
    hindiName: 'अमृतसर',
    title: 'अमृतसर गोल्डन टेम्पल व हेरिटेज स्टे गाइड',
    desc: 'पवित्र स्वर्ण मंदिर, ऐतिहासिक जलियांवाला बाग, वाघा बॉर्डर और गर्मजोशी से भरी पंजाबी मेहमाननवाजी।'
  },
  {
    slug: 'mysuru',
    badge: 'MYSURU',
    hindiName: 'मैसूर',
    title: 'मैसूर रॉयल पैलेस व हेरिटेज विलाज गाइड',
    desc: 'भव्य मैसूर पैलेस, चामुंडी हिल्स और कर्नाटक की समृद्ध सांस्कृतिक धरोहर में लक्ज़री स्टे।'
  },
  {
    slug: 'bengaluru',
    badge: 'BENGALURU',
    hindiName: 'बेंगलुरु',
    title: 'बेंगलुरु 5-स्टार लक्ज़री व सिटी गाइड',
    desc: 'गार्डन सिटी में वर्ल्ड-क्लास 5-स्टार हॉस्पिटैलिटी, प्रीमियम बिजनेस लाउंज और हेरिटेज पैलेस।'
  },
  {
    slug: 'kochi',
    badge: 'KOCHI',
    hindiName: 'कोच्चि',
    title: 'कोच्चि बैकवाटर्स व हेरिटेज हार्बर रिसॉर्ट्स',
    desc: 'अरब सागर की रानी कोच्चि में फोर्ट कोच्चि, चाइनीज नेट्स और शांत बैकवाटर्स में लक्ज़री स्टे।'
  }
];

// Base template
const baseXml = fs.readFileSync('public/theme/lexatrip_blogger_theme.xml', 'utf8');

const outputDir = path.join(__dirname, '..', 'public', 'theme', 'destinations');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

destinationsMeta.forEach(dest => {
  let xml = baseXml;

  // Replace Badge in Header
  xml = xml.replace("<span class='brand-dest-badge'>JAISALMER</span>", `<span class='brand-dest-badge'>${dest.badge}</span>`);

  // Replace Hero Title & Desc
  xml = xml.replace("<h1 class='hero-compact-title'>जैसलमेर लक्ज़री स्टे व हेरिटेज गाइड</h1>", `<h1 class='hero-compact-title'>${dest.title}</h1>`);
  xml = xml.replace("स्वर्ण नगरी जैसलमेर में लक्ज़री टेंट कैंप्स, हेरिटेज फोर्ट होटल्स और डेज़र्ट सफारी का सबसे विश्वसनीय अनुभव।", dest.desc);

  // Replace Category Tag in Single Article
  xml = xml.replace("जैसलमेर लक्ज़री ट्रैवल व होटल गाइड", `${dest.hindiName} लक्ज़री ट्रैवल व होटल गाइड`);
  xml = xml.replace("जैसलमेर लक्ज़री ट्रैवल गाइड", `${dest.hindiName} लक्ज़री ट्रैवल गाइड`);

  // Replace Destination Param in Booking Engine
  xml = xml.replace("dest=Jaisalmer", `dest=${encodeURIComponent(dest.badge)}`);
  xml = xml.replace("Jaisalmer Tour & Stay", `${dest.badge} Tour & Stay`);
  xml = xml.replace("मुझे जैसलमेर होटल्स और कैंप्स", `मुझे ${dest.hindiName} होटल्स और कैंप्स`);

  const destFile = path.join(outputDir, `lexatrip_theme_${dest.slug}.xml`);
  fs.writeFileSync(destFile, xml, 'utf8');
  console.log(`Generated theme for: ${dest.name || dest.badge} -> ${destFile}`);
});

console.log(`\nSuccessfully generated custom master themes for all ${destinationsMeta.length} destinations!`);
