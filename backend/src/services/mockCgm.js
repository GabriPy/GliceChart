// src/services/mockCgm.js
const { getPool } = require('../db/pool');
const { insertReading } = require('../db/queries/readingsQueries');
const { insertInsulin } = require('../db/queries/insulinQueries');
const { insertCarb } = require('../db/queries/carbsQueries');
const { insertNote } = require('../db/queries/notesQueries');

function generateRealisticCurve(hours = 24) {
  const readings = [];
  const insulins = [];
  const carbs = [];
  const notes = [];

  const now = Date.now();
  const totalSteps = (hours * 60) / 5; // ogni 5 minuti

  let currentGlucose = 110;
  let trend = 'Flat';

  // Pasti simulati nelle 24 ore relative
  const mealTimes = [
    { hourOffset: 16, carb: 45, insulin: 4.0, note: 'Colazione: fette biscottate e caffè' },
    { hourOffset: 11, carb: 70, insulin: 6.5, note: 'Pranzo: pasta integrale e verdure' },
    { hourOffset: 7, carb: 20, insulin: 1.5, note: 'Spuntino pomeridiano' },
    { hourOffset: 3.5, carb: 65, insulin: 6.0, note: 'Cena: salmone e riso basmati' }
  ];

  for (let i = totalSteps; i >= 0; i--) {
    const timestamp = new Date(now - i * 5 * 60 * 1000);
    const hoursAgo = (now - timestamp.getTime()) / (1000 * 60 * 60);

    // Variazioni circadiane e rumore naturale
    const noise = (Math.random() - 0.48) * 4;
    
    // Effetto pasti
    let mealDelta = 0;
    for (const meal of mealTimes) {
      const elapsedFromMeal = hoursAgo - meal.hourOffset; // negativo se nel futuro
      if (elapsedFromMeal >= -0.1 && elapsedFromMeal <= 2.5) {
        // Salita rapida poi discesa
        if (elapsedFromMeal < 0.8) {
          mealDelta += 18 * (elapsedFromMeal + 0.1);
        } else {
          mealDelta += Math.max(0, 18 * 0.9 - 8 * (elapsedFromMeal - 0.8));
        }
      }
    }

    currentGlucose = Math.round(Math.max(68, Math.min(240, 108 + mealDelta + noise)));

    // Determina trend
    if (noise + mealDelta > 4) trend = 'SingleUp';
    else if (noise + mealDelta > 8) trend = 'DoubleUp';
    else if (noise + mealDelta < -4) trend = 'SingleDown';
    else if (noise + mealDelta < -8) trend = 'DoubleDown';
    else trend = 'Flat';

    readings.push({
      timestamp: timestamp.toISOString(),
      glucose: currentGlucose,
      trend,
      raw_trend: trend
    });
  }

  // Genera eventi di insulina e carboidrati
  for (const meal of mealTimes) {
    const ts = new Date(now - meal.hourOffset * 60 * 60 * 1000).toISOString();
    carbs.push({ timestamp: ts, amount: meal.carb });
    insulins.push({ timestamp: ts, type: 'rapid', units: meal.insulin });
    notes.push({ timestamp: ts, text: meal.note });
  }

  // Insulina basale lenta serale
  const basalTs = new Date(now - 22 * 60 * 60 * 1000).toISOString();
  insulins.push({ timestamp: basalTs, type: 'slow', units: 16 });

  return { readings, insulins, carbs, notes };
}

async function seedDemoDataIfEmpty() {
  const pool = await getPool();
  const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM readings`);
  if (rows[0].count > 10) {
    console.log('ℹ️ Demo Mode: Database già popolato con letture.');
    return;
  }

  console.log('🧪 Demo Mode: Generazione dati simulati realistici (24h CGM)...');
  const data = generateRealisticCurve(24);

  for (const r of data.readings) {
    await insertReading(r);
  }
  for (const i of data.insulins) {
    await insertInsulin(i);
  }
  for (const c of data.carbs) {
    await insertCarb(c);
  }
  for (const n of data.notes) {
    await insertNote(n);
  }

  console.log(`✅ Demo Mode: Inserite ${data.readings.length} letture, ${data.insulins.length} insuline, ${data.carbs.length} pasti.`);
}

module.exports = {
  generateRealisticCurve,
  seedDemoDataIfEmpty
};
