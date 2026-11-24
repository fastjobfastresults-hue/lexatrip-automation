const fs = require('fs');
const path = require('path');

function searchInFiles(dir, terms) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (['node_modules', '.git', 'test_media.mp4'].includes(item)) continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchInFiles(full, terms);
    } else if (item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.md') || item.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      for (const term of terms) {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          console.log(`Found "${term}" in ${full}`);
        }
      }
    }
  }
}

searchInFiles('.', ['bengaluru', 'kochi', 'bangalore', 'cochin']);
