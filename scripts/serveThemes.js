const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3999;
const THEMES_DIR = path.join(__dirname, '..', 'public', 'theme', 'destinations');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const slug = req.url.replace(/^\//, '').replace(/\.(xml|txt)$/, '');
  const filePath = path.join(THEMES_DIR, `lexatrip_theme_${slug}.xml`);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    // text/plain ensures Chrome does NOT parse as XML DOM tree and innerText preserves exact tags
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(content);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Theme not found for: ' + slug);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Themes server running on http://127.0.0.1:${PORT}`);
});
