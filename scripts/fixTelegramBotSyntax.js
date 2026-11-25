const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'services', 'telegramBot.js');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/`ℹ️ \*स्टेटस:\* `\$\{bErr\.message\}`\\n\\n`/g, '`ℹ️ *स्टेटस:* \\`' + '${bErr.message}' + '\\`\\n\\n`');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed syntax error in telegramBot.js successfully!');
