const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'public', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

const liveWorkAdditions = `

// ===================================================================
// ⚡ LIVE WORK DRAWER & STORAGE AUTO-CLEANUP CLIENT LOGIC
// ===================================================================

function toggleLiveWorkDrawer() {
  const drawer = document.getElementById('live-work-drawer');
  if (!drawer) return;
  if (drawer.classList.contains('hidden')) {
    drawer.classList.remove('hidden');
    loadLiveWorkStats();
  } else {
    drawer.classList.add('hidden');
  }
}

async function loadLiveWorkStats() {
  try {
    const res = await fetch('/api/storage');
    if (res.ok) {
      const stats = await res.json();
      const el = document.getElementById('live-work-storage-info');
      if (el) {
        el.textContent = \`लोकल डिस्क: \${stats.totalMB} MB (\${stats.totalFiles} फाइल्स) · ऑटो-क्लीनअप सक्रिय\`;
      }
    }
  } catch (e) {}

  try {
    const res2 = await fetch('/api/queue');
    if (res2.ok) {
      const queue = await res2.json();
      const next = queue.find(q => q.status === 'queued');
      const el2 = document.getElementById('live-work-next-task');
      if (el2) {
        if (next) {
          const time = new Date(next.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          el2.textContent = \`आगामी टास्क: \${next.title?.substring(0, 30)}... @ \${time}\`;
        } else {
          el2.textContent = 'आगामी टास्क: कतार स्टैंडबाय में है।';
        }
      }
    }
  } catch (e) {}
}

async function triggerStorageCleanupNow() {
  try {
    const res = await fetch('/api/storage/cleanup', { method: 'POST' });
    const data = await res.json();
    alert(\`🧹 स्टोरेज क्लीनअप सफल!\\n\\n\${data.deletedCount} पब्लिश हो चुकी फाइल्स डिलीट की गईं।\\n\${data.freedMB} MB डिस्क स्पेस खाली किया गया।\\n(सोशल मीडिया पर सभी पोस्ट्स सुरक्षित रहेंगी)\`);
    loadLiveWorkStats();
  } catch (err) {
    alert('क्लीनअप त्रुटि: ' + err.message);
  }
}
`;

if (!appJs.includes('toggleLiveWorkDrawer')) {
  fs.writeFileSync(appJsPath, appJs + liveWorkAdditions, 'utf8');
  console.log('Appended toggleLiveWorkDrawer to public/app.js successfully!');
} else {
  console.log('toggleLiveWorkDrawer already present in app.js');
}
