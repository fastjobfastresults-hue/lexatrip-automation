/**
 * scripts/sanitizeQueue.js
 * 
 * Sanitizes legacy queue records in database/data.json:
 * 1. Creates a timestamped backup in database/backups/data.json.<timestamp>.bak.
 * 2. Reclassifies 48 purely simulated published records to 'simulated_historical'.
 * 3. Reclassifies 2 partially real published records (Item 0 and Item 49) to 'partial_or_failed'.
 * 4. Preserves 6 future queued records (Items 50-55) in 'queued' status.
 * 5. Idempotent: Can be run multiple times safely without corrupting data.
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'database', 'data.json');
const BACKUP_DIR = path.join(__dirname, '..', 'database', 'backups');

function sanitizeQueue(dbFilePath = DB_FILE, backupDir = BACKUP_DIR) {
  if (!fs.existsSync(dbFilePath)) {
    throw new Error(`Database file not found at ${dbFilePath}`);
  }

  // 1. Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 2. Pre-flight backup
  const timestamp = Date.now();
  const backupFile = path.join(backupDir, `data.json.${timestamp}.bak`);
  fs.copyFileSync(dbFilePath, backupFile);
  console.log(`💾 [SanitizeQueue] Created backup at ${backupFile}`);

  // 3. Read raw database content
  const rawContent = fs.readFileSync(dbFilePath, 'utf-8');
  const dbData = JSON.parse(rawContent);

  if (!Array.isArray(dbData.queue)) {
    dbData.queue = [];
  }

  let reclassifiedSimulated = 0;
  let reclassifiedPartial = 0;
  let queuedPreserved = 0;
  let alreadySanitized = 0;

  const nowIso = new Date().toISOString();

  // 4. Sanitize records
  dbData.queue = dbData.queue.map((item, idx) => {
    // Idempotency check: if already sanitized, keep as is
    if (item.sanitized === true) {
      alreadySanitized++;
      return item;
    }

    // Cohort 3: Future queued items (indices 50-55 or status queued)
    if (item.status === 'queued') {
      queuedPreserved++;
      return item;
    }

    // Cohort 2: Partially Real Published (Item 0 & Item 49)
    const isPartialReal = 
      item.id === 'q_live_taj_oberoi_1795151618645' || 
      item.id === 'q_active_1795115302823_0';

    if (isPartialReal) {
      reclassifiedPartial++;
      return {
        ...item,
        status: 'partial_or_failed',
        sanitized: true,
        sanitizedAt: nowIso,
        sanitizationNote: 'Reclassified from published to partial_or_failed; verified LinkedIn/Telegram but mock/unverified other channels.'
      };
    }

    // Cohort 1: Purely Simulated Records (48 historical items)
    const itemStr = JSON.stringify(item);
    const hasSimulatedMarkers = 
      itemStr.includes('"simulated":true') || 
      itemStr.includes('sim_') || 
      itemStr.includes('Smart Bridge') || 
      itemStr.includes('yt_');

    if (item.status === 'published' && (hasSimulatedMarkers || idx >= 1 && idx <= 48)) {
      reclassifiedSimulated++;
      return {
        ...item,
        status: 'simulated_historical',
        sanitized: true,
        sanitizedAt: nowIso,
        sanitizationNote: 'Historical simulated results reclassified; zero authentic live publications.'
      };
    }

    return item;
  });

  // 5. Atomic write
  const tempFile = `${dbFilePath}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(dbData, null, 2), 'utf-8');
  
  // Safe rename for Windows
  let renamed = false;
  let retries = 5;
  while (retries > 0) {
    try {
      fs.renameSync(tempFile, dbFilePath);
      renamed = true;
      break;
    } catch (e) {
      if (e.code === 'EPERM' || e.code === 'EBUSY') {
        const start = Date.now();
        while (Date.now() - start < 25) {}
        retries--;
      } else {
        throw e;
      }
    }
  }
  if (!renamed) {
    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, null, 2), 'utf-8');
    try { fs.unlinkSync(tempFile); } catch (_) {}
  }

  const result = {
    total: dbData.queue.length,
    reclassifiedSimulated,
    reclassifiedPartial,
    queuedPreserved,
    alreadySanitized,
    backupFile
  };

  console.log(`✅ [SanitizeQueue] Sanitization complete:`, result);
  return result;
}

if (require.main === module) {
  sanitizeQueue();
}

module.exports = { sanitizeQueue };
