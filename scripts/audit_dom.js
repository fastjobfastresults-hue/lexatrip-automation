const fs = require('fs');
const js = fs.readFileSync('public/app.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');

const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
let m;
const ids = new Set();
while ((m = regex.exec(js)) !== null) {
  ids.add(m[1]);
}

const missing = [];
const found = [];
for (const id of ids) {
  if (html.includes(`id="${id}"`) || html.includes(`id='${id}'`)) {
    found.push(id);
  } else {
    missing.push(id);
  }
}

console.log(`Total IDs checked: ${ids.size}`);
console.log(`Found: ${found.length}`);
console.log('Missing IDs:', missing);
