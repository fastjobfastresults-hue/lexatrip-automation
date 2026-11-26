const https = require('https');

function fetchReadme(repo) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/lohithadamisetti123/' + repo + '/readme',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/vnd.github.v3.raw' }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ repo, text: data }));
    }).on('error', () => resolve({ repo, text: '' }));
  });
}

const repos = [
  'cinematic-portfolio',
  'Peach-Portfolio',
  'Disney-Portfolio',
  'premium-portfolio',
  '3D-portfolio-Public',
  'Lohitha-s-Anime-Portfolio',
  'Portfolio-build-by-agents'
];

Promise.all(repos.map(fetchReadme)).then(results => {
  results.forEach(r => {
    console.log('=== REPO: ' + r.repo + ' ===');
    const urls = r.text.match(/https?:\/\/[^\s\)\"\'>]+/g) || [];
    console.log('Found URLs:', [...new Set(urls)].slice(0, 10));
    console.log('Snippet:', r.text.slice(0, 300).replace(/\n/g, ' '));
  });
});
