/**
 * Lexa Trip Social Media Automation System
 * Deep Health Check Telemetry Service
 * 
 * Multi-dimensional audit:
 * - Database schema, destinations count, queue length
 * - Memory usage against 256MB container cap
 * - Telegram bot token configuration
 * - Authentic channel connection verification via channelTester
 * 
 * Returns HTTP 200 on healthy, HTTP 503 on degraded/failed.
 * Zero mock or simulated returns.
 */

const db = require('../database/db');
const channelTester = require('./channelTester');

/**
 * Audits all subsystems and compiles health telemetry
 * @param {object} [options]
 * @param {string} [options.destinationId] - Optional destination ID to audit
 * @param {function} [options.memoryUsageFn] - Injected memoryUsage provider (for testing)
 * @param {string} [options.telegramBotToken] - Injected telegram token (for testing)
 * @returns {Promise<{ healthy: boolean, statusCode: number, telemetry: object }>}
 */
async function getDeepHealth(options = {}) {
  let dbHealthy = false;
  let memHealthy = false;
  let tgHealthy = false;
  let allChannelsHealthy = true;

  const checks = {};

  // 1. Database Subsystem Audit
  let destinationsCount = 0;
  let queueLength = 0;
  try {
    const data = db.read();
    if (data && typeof data === 'object' && Array.isArray(data.destinations) && Array.isArray(data.queue)) {
      destinationsCount = data.destinations.length;
      queueLength = data.queue.length;
      dbHealthy = true;
      checks.database = {
        status: 'healthy',
        destinationsCount,
        queueLength
      };
    } else {
      dbHealthy = false;
      checks.database = {
        status: 'unhealthy',
        error: 'Invalid database schema: missing destinations or queue array',
        destinationsCount: Array.isArray(data?.destinations) ? data.destinations.length : 0,
        queueLength: Array.isArray(data?.queue) ? data.queue.length : 0
      };
    }
  } catch (err) {
    dbHealthy = false;
    checks.database = {
      status: 'unhealthy',
      error: err.message,
      destinationsCount: 0,
      queueLength: 0
    };
  }

  // 2. Memory Subsystem Audit (256MB Container Cap)
  try {
    const memFn = (typeof options.memoryUsageFn === 'function') ? options.memoryUsageFn : process.memoryUsage;
    const mem = memFn();
    const rssMB = +(mem.rss / (1024 * 1024)).toFixed(2);
    const heapMB = +(mem.heapUsed / (1024 * 1024)).toFixed(2);
    const limitMB = 256;
    memHealthy = rssMB < limitMB;

    checks.memory = {
      status: memHealthy ? 'healthy' : 'warning',
      rssMB,
      heapMB,
      limitMB
    };
  } catch (err) {
    memHealthy = false;
    checks.memory = {
      status: 'unhealthy',
      error: err.message,
      limitMB: 256
    };
  }

  // 3. Telegram Subsystem Audit
  let targetDest = null;
  try {
    const destinations = typeof db.getDestinations === 'function' ? db.getDestinations() : [];
    if (options.destinationId) {
      targetDest = destinations.find(d => d.id === options.destinationId);
    }
    if (!targetDest) {
      targetDest = destinations.find(d => d.id === 'dest_test_destination') || destinations[0] || null;
    }

    const settings = (typeof db.getSettings === 'function') ? db.getSettings() : null;
    const botToken = (options.telegramBotToken !== undefined)
      ? options.telegramBotToken
      : (process.env.TELEGRAM_BOT_TOKEN || settings?.telegram?.botToken || targetDest?.telegram?.botToken);

    tgHealthy = typeof botToken === 'string' && botToken.trim().length > 0;
    checks.telegram = {
      status: tgHealthy ? 'healthy' : 'unconfigured',
      botConfigured: tgHealthy
    };
  } catch (err) {
    tgHealthy = false;
    checks.telegram = {
      status: 'unhealthy',
      error: err.message,
      botConfigured: false
    };
  }

  // 4. Configured Social Media Channels Audit
  checks.channels = {};
  if (targetDest && targetDest.channels && typeof targetDest.channels === 'object') {
    const channelEntries = Object.entries(targetDest.channels)
      .filter(([_, ch]) => ch && ch.enabled && ch.credentials);

    const channelResults = await Promise.allSettled(
      channelEntries.map(async ([platform, ch]) => {
        try {
          const testRes = await channelTester.testChannel(platform, ch.credentials);
          const isSuccess = !!testRes && testRes.success === true;
          return {
            platform,
            success: isSuccess,
            status: isSuccess ? 'connected' : 'failed',
            details: testRes?.accountName || testRes?.handle || testRes?.platform || 'ok'
          };
        } catch (err) {
          return {
            platform,
            success: false,
            status: 'failed',
            error: err.message || 'Channel verification failed'
          };
        }
      })
    );

    for (const res of channelResults) {
      if (res.status === 'fulfilled') {
        const val = res.value;
        checks.channels[val.platform] = val.success
          ? { status: val.status, details: val.details }
          : { status: val.status, error: val.error };
        if (!val.success || val.status !== 'connected') {
          allChannelsHealthy = false;
        }
      } else {
        allChannelsHealthy = false;
      }
    }
  }

  // Aggregate Status Evaluation
  const overallHealthy = dbHealthy && memHealthy && tgHealthy && allChannelsHealthy;
  const statusCode = overallHealthy ? 200 : 503;
  const status = overallHealthy ? 'healthy' : 'degraded';

  const telemetry = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks
  };

  return {
    healthy: overallHealthy,
    statusCode,
    telemetry
  };
}

/**
 * Express Request Handler for GET /health/deep
 */
async function deepHealthHandler(req, res) {
  try {
    const destinationId = req.query?.destinationId;
    const result = await getDeepHealth({ destinationId });
    return res.status(result.statusCode).json(result.telemetry);
  } catch (err) {
    return res.status(503).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
}

module.exports = {
  getDeepHealth,
  deepHealthHandler
};
