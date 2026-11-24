const fs = require('fs');
const file = 'C:/Users/imran/.gemini/antigravity/brain/25d7fc9b-87c5-49ee-9eeb-1ac749f9993d/.system_generated/logs/transcript.jsonl';
const stat = fs.statSync(file);
const fd = fs.openSync(file, 'r');
const size = Math.min(200000, stat.size);
const buf = Buffer.alloc(size);
fs.readSync(fd, buf, 0, size, stat.size - size);
fs.closeSync(fd);
const str = buf.toString('utf8');
const lines = str.split('\n').filter(l => l.includes('{"step_index":'));
for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index >= 889) {
      console.log('--- Step', obj.step_index, obj.type, obj.tool_calls?.[0]?.name || '');
      if (obj.tool_calls?.[0]?.args) {
        console.log('Args:', JSON.stringify(obj.tool_calls[0].args));
      }
      if (obj.content) {
        console.log('Content:', obj.content.slice(0, 300));
      }
    }
  } catch(e) {}
}
