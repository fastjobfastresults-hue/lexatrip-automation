/**
 * Lexa Trip Social Media Automation System
 * Ephemeral Test Express Server Runner
 * 
 * Features:
 * - Runs Express on ephemeral OS-assigned port 0 (`server.listen(0, '127.0.0.1')`)
 * - Guarantees zero port collisions with production (port 10000)
 * - Safe startup and shutdown lifecycle management for integration testing
 */

const http = require('http');
const express = require('express');
const cors = require('cors');

/**
 * Creates an Express app with standard health check routes
 */
function createTestServer(customApp = null) {
  if (customApp) return customApp;

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Standard Health Check Endpoints
  app.get('/health', (req, res) => res.status(200).send('OK'));
  app.get('/healthz', (req, res) => res.status(200).send('OK'));
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  return app;
}

/**
 * Starts an ephemeral HTTP server on port 0
 * @param {Express.Application} [app] 
 * @returns {Promise<{ server: http.Server, port: number, baseUrl: string }>}
 */
function startTestServer(app = null) {
  const expressApp = app || createTestServer();
  const server = http.createServer(expressApp);

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = address.port;
      const baseUrl = `http://127.0.0.1:${port}`;
      resolve({ server, port, baseUrl, app: expressApp });
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Gracefully stops the ephemeral HTTP server
 * @param {http.Server} server 
 * @returns {Promise<void>}
 */
function stopTestServer(server) {
  return new Promise((resolve) => {
    if (!server || !server.listening) {
      return resolve();
    }
    server.close(() => {
      resolve();
    });
  });
}

module.exports = {
  createTestServer,
  startTestServer,
  stopTestServer
};
