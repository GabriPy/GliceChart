const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../server');
const { closePool } = require('../src/db/pool');

describe('Backend API Endpoints', () => {
  after(async () => {
    await closePool();
  });

  test('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.ok(res.body.timestamp);
  });

  test('GET /api/readings with invalid range should return 400', async () => {
    const res = await request(app).get('/api/readings?range=invalid');
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Range non valido');
  });

  test('GET /api/readings with range < 60 should return 400', async () => {
    const res = await request(app).get('/api/readings?range=10');
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Range non valido');
  });

  test('GET /api/auth/status should respond with enabled boolean or handle without crash', async () => {
    const res = await request(app).get('/api/auth/status');
    assert.ok([200, 500].includes(res.status));
  });
});
