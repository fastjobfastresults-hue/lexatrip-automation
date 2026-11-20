/**
 * test/database.test.js
 * Comprehensive unit test suite for database/db.js and Queue Data Integrity
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const { isolateDatabase, restoreDatabase, createFixtureQueueItem } = require('./helpers/testFixtures');

describe('Database & Queue Storage Integrity', () => {
  beforeEach(() => {
    isolateDatabase();
  });

  afterEach(() => {
    restoreDatabase();
  });

  describe('Queue Querying & Filtering (db.getQueue)', () => {
    beforeEach(() => {
      db.clearQueue();
    });

    it('filters correctly by destinationId', () => {
      const q1 = createFixtureQueueItem({ destinationId: 'dest_jaisalmer' });
      const q2 = createFixtureQueueItem({ destinationId: 'dest_mountabu' });
      db.addToQueue(q1);
      db.addToQueue(q2);

      const jaisalmerItems = db.getQueue('dest_jaisalmer');
      assert.ok(jaisalmerItems.every(q => q.destinationId === 'dest_jaisalmer'));
      assert.ok(jaisalmerItems.some(q => q.id === q1.id));
      assert.ok(!jaisalmerItems.some(q => q.id === q2.id));
    });

    it('filters correctly by status string', () => {
      const qPub = createFixtureQueueItem({ status: 'published' });
      const qFailed = createFixtureQueueItem({ status: 'failed' });
      const qPartial = createFixtureQueueItem({ status: 'partial_or_failed' });
      const qSim = createFixtureQueueItem({ status: 'simulated_historical' });
      db.addToQueue(qPub);
      db.addToQueue(qFailed);
      db.addToQueue(qPartial);
      db.addToQueue(qSim);

      const failedOnly = db.getQueue(null, 'failed');
      assert.strictEqual(failedOnly.length, 1);
      assert.strictEqual(failedOnly[0].id, qFailed.id);

      const partialOnly = db.getQueue(null, 'partial_or_failed');
      assert.strictEqual(partialOnly.length, 1);
      assert.strictEqual(partialOnly[0].id, qPartial.id);
    });

    it('filters correctly by status array', () => {
      const qFailed = createFixtureQueueItem({ status: 'failed' });
      const qPartial = createFixtureQueueItem({ status: 'partial_or_failed' });
      const qPub = createFixtureQueueItem({ status: 'published' });
      db.addToQueue(qFailed);
      db.addToQueue(qPartial);
      db.addToQueue(qPub);

      const abnormal = db.getQueue({ status: ['failed', 'partial_or_failed'] });
      assert.strictEqual(abnormal.length, 2);
      assert.ok(abnormal.some(q => q.id === qFailed.id));
      assert.ok(abnormal.some(q => q.id === qPartial.id));
      assert.ok(!abnormal.some(q => q.id === qPub.id));
    });

    it('combines destinationId and status filtering in options object', () => {
      const q1 = createFixtureQueueItem({ destinationId: 'dest_jaisalmer', status: 'failed' });
      const q2 = createFixtureQueueItem({ destinationId: 'dest_mountabu', status: 'failed' });
      db.addToQueue(q1);
      db.addToQueue(q2);

      const res = db.getQueue({ destinationId: 'dest_jaisalmer', status: 'failed' });
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, q1.id);
    });
  });

  describe('Single Queue Item Helper (db.getQueueItem)', () => {
    it('returns the item by id when it exists', () => {
      const item = createFixtureQueueItem();
      db.addToQueue(item);

      const found = db.getQueueItem(item.id);
      assert.ok(found);
      assert.strictEqual(found.id, item.id);
      assert.strictEqual(found.title, item.title);
    });

    it('returns null when item does not exist', () => {
      const notFound = db.getQueueItem('non_existent_id_12345');
      assert.strictEqual(notFound, null);
    });
  });

  describe('Queue Statistics Helper (db.getQueueStats)', () => {
    it('computes accurate breakdown across all honest statuses', () => {
      db.clearQueue();
      db.addToQueue(createFixtureQueueItem({ status: 'queued' }));
      db.addToQueue(createFixtureQueueItem({ status: 'queued' }));
      db.addToQueue(createFixtureQueueItem({ status: 'published' }));
      db.addToQueue(createFixtureQueueItem({ status: 'partial_or_failed' }));
      db.addToQueue(createFixtureQueueItem({ status: 'failed' }));
      db.addToQueue(createFixtureQueueItem({ status: 'simulated_historical' }));

      const stats = db.getQueueStats();
      assert.strictEqual(stats.total, 6);
      assert.strictEqual(stats.queued, 2);
      assert.strictEqual(stats.published, 1);
      assert.strictEqual(stats.partial_or_failed, 1);
      assert.strictEqual(stats.failed, 1);
      assert.strictEqual(stats.simulated_historical, 1);
    });
  });

  describe('Sanitization & Hygiene Assertions', () => {
    it('asserts zero queue items have status published with simulated details', () => {
      const rawQueue = db.getQueue();
      const violatedItems = rawQueue.filter(q => {
        if (q.status !== 'published') return false;
        const str = JSON.stringify(q);
        return str.includes('"simulated":true') || str.includes('sim_') || str.includes('Smart Bridge');
      });

      assert.strictEqual(
        violatedItems.length,
        0,
        `Expected 0 published items with simulated details, found ${violatedItems.length}`
      );
    });

    it('asserts sanitizeQueueRecords method is callable and idempotent', () => {
      assert.strictEqual(typeof db.sanitizeQueueRecords, 'function');
      const res = db.sanitizeQueueRecords();
      assert.ok(res);
      assert.strictEqual(typeof res.total, 'number');
      assert.strictEqual(res.reclassifiedSimulated, 0, 'Database is already sanitized; should not reclassify simulated');
    });
  });
});
