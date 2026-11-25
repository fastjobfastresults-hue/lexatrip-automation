const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('https://lexatripjaisalmer.blogspot.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log('Status:', res.status);
    console.log('Length:', res.data.length);
    const m = res.data.match(/<title>([^<]+)<\/title>/i);
    console.log('Title:', m ? m[1] : 'None');
    const isV3 = res.data.includes('data:post') || res.data.includes('b:skin');
    console.log('Includes Blogger tags:', isV3);
    const bodyClass = res.data.match(/<body[^>]*class=['"]([^'"]+)['"]/i);
    console.log('Body class:', bodyClass ? bodyClass[1] : 'None');
  } catch(e) {
    console.error('Error:', e.message);
  }
}

check();
