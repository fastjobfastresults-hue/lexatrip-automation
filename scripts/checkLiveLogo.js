const https = require('https');

https.get('https://lexatripjaisalmer.blogspot.com/', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const m = data.match(/<div class=['"]brand-logo-circle['"][\s\S]*?<\/div>/g);
    if (m) {
      m.forEach((val, idx) => {
        console.log(`Match ${idx}:`, val.substring(0, 300));
      });
    } else {
      console.log('No brand-logo-circle found!');
      // Check for any img with alt Lexa
      const imgs = data.match(/<img[^>]*Lexa[^>]*>/gi);
      console.log('Imgs with Lexa:', imgs);
    }
  });
}).on('error', err => {
  console.error('Error fetching blog:', err);
});
