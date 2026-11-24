const fs = require('fs');
const file = 'C:/Users/imran/.gemini/antigravity/brain/e7b900cc-441f-47cf-8329-547d838ad73d/.system_generated/logs/transcript.jsonl';
if (!fs.existsSync(file)) {
  console.log('File does not exist yet');
  process.exit(0);
}
const stat = fs.statSync(file);
const fd = fs.openSync(file, 'r');
const size = Math.min(200000, stat.size);
const buf = Buffer.alloc(size);
fs.readSync(fd, buf, 0, size, stat.size - size);
fs.closeSync(fd);
const str = buf.toString('utf8');
const lines = str.split('\n').filter(l => l.includes('{"step_index":'));
console.log(`--- Total steps in tail buffer: ${lines.length} ---`);
for (let i = Math.max(0, lines.length - 8); i < lines.length; i++) {
  try {
    const obj = JSON.parse(lines[i]);
    const intention = obj.tool_calls?.[0]?.args?.intention || (obj.tool_calls?.[0]?.name ? `${obj.tool_calls[0].name}` : '');
    console.log(`Step ${obj.step_index} [${obj.type} / ${obj.source}]: ${intention}`);
    if (obj.tool_calls?.[0]?.name === 'send_message') {
      console.log('--> SEND_MESSAGE TO PARENT:', JSON.stringify(obj.tool_calls[0].args, null, 2));
    }
    if (obj.content) {
      console.log('  Content:', obj.content.slice(0, 300));
    }
  } catch(e) {}
}
