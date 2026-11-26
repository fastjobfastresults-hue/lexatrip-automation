const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/users/lohithadamisetti123/repos?per_page=100&sort=pushed',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

https.get(options, (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) {
        console.log('Error/Rate limit:', data);
        return;
      }
      console.log('Total public repos:', data.length);
      const filtered = data.map(r => ({
        name: r.name,
        description: r.description,
        url: r.html_url,
        homepage: r.homepage,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        topics: r.topics || [],
        updated_at: r.updated_at
      }));

      // Sort by stars, then by has homepage, then by updated
      filtered.sort((a, b) => {
        if (b.stars !== a.stars) return b.stars - a.stars;
        if (Boolean(b.homepage) !== Boolean(a.homepage)) return Boolean(b.homepage) ? 1 : -1;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });

      console.log(JSON.stringify(filtered.slice(0, 20), null, 2));
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', err => console.error(err));
