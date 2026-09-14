const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { generateRealisticCurve } = require('../src/services/mockCgm');

describe('Mock CGM Clinical Curve Generator', () => {
  test('generateRealisticCurve(24) should produce valid 24h readings and meal events', () => {
    const data = generateRealisticCurve(24);

    assert.ok(Array.isArray(data.readings));
    assert.ok(data.readings.length > 250); // 24h a intervalli di 5m ~ 288 letture
    assert.ok(data.insulins.length > 0);
    assert.ok(data.carbs.length > 0);
    assert.ok(data.notes.length > 0);

    for (const r of data.readings) {
      assert.ok(r.glucose >= 50 && r.glucose <= 350, `Glicemia non realistica: ${r.glucose}`);
      assert.ok(['Flat', 'SingleUp', 'DoubleUp', 'SingleDown', 'DoubleDown'].includes(r.trend));
      assert.ok(!Number.isNaN(new Date(r.timestamp).getTime()));
    }
  });
});
