// src/services/glurooSync.js
const { fetchLatestReadings } = require('../../gluroo');
const { insertReading, getLatestReading } = require('../db/queries/readingsQueries');
const { sendTelegramHighLowAlert } = require('./telegram');
const { DEMO_MODE } = require('../config/env');
const { seedDemoDataIfEmpty } = require('./mockCgm');

async function syncReadings() {
  if (DEMO_MODE) {
    await seedDemoDataIfEmpty();
    return;
  }

  try {
    console.log('🔄 Sincronizzazione da Gluroo/Nightscout...');
    const readings = await fetchLatestReadings();
    let nuove = 0;
    for (const r of readings) {
      if (await insertReading(r)) nuove++;
    }
    console.log(`✅ ${nuove} nuove letture (${readings.length} ricevute)`);

    if (readings.length) {
      const latest = await getLatestReading();
      await sendTelegramHighLowAlert(latest);
    }
  } catch (e) {
    console.error('❌ Sync fallita:', e.message);
  }
}

module.exports = {
  syncReadings
};
