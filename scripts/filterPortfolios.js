const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/users/lohithadamisetti123/repos?per_page=100',
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
};

https.get(options, (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    try {
      const repos = JSON.parse(raw);
      if (!Array.isArray(repos)) {
        console.log('Error:', repos);
        return;
      }
      
      const portfolios = repos.filter(r => 
        /portfolio|resume|cv|design|ui|cinematic|web|profile|landing/i.test(r.name) ||
        (r.description && /portfolio|web|ui|design/i.test(r.description)) ||
        r.homepage
      );

      console.log('Total portfolio/UI repos found:', portfolios.length);
      portfolios.sort((a, b) => b.stargazers_count - a.stargazers_count);

      portfolios.forEach((r, i) => {
        console.log((i + 1) + '. ' + r.name);
        console.log('   GitHub URL: ' + r.html_url);
        console.log('   Live Demo: ' + (r.homepage || 'https://lohithadamisetti123.github.io/' + r.name));
        console.log('   Stars: ' + r.stargazers_count + ' | Forks: ' + r.forks_count + ' | Tech: ' + (r.language || 'HTML/CSS'));
      });
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', err => console.error(err));
