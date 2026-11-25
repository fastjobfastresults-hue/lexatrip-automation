const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/imran/.gemini/antigravity/brain/e7b900cc-441f-47cf-8329-547d838ad73d/.system_generated/logs/transcript_full.jsonl'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.includes('"step_index":480')) {
    const obj = JSON.parse(line);
    const script = obj.tool_calls?.[0]?.args?.script || '';
    const sectionPos = script.indexOf('<b:section');
    console.log('sectionPos:', sectionPos);
    if (sectionPos !== -1) {
      console.log('Snippet around <b:section:\n' + script.slice(sectionPos, sectionPos + 800));
    }
  }
});
