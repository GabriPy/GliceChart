// src/controllers/readingsController.js
const { getLatestReading, getReadingsByMinutes } = require('../db/queries/readingsQueries');
const { syncReadings } = require('../services/glurooSync');

async function getCurrent(req, res, next) {
  try {
    const latest = await getLatestReading();
    if (!latest) return res.status(404).json({ error: 'Nessuna lettura disponibile' });
    res.json(latest);
  } catch (e) {
    next(e);
  }
}

async function getReadings(req, res, next) {
  const rangeQuery = req.query.range;
  let range = 180;
  if (rangeQuery !== undefined) {
    if (!/^\d+$/.test(String(rangeQuery).trim())) {
      return res.status(400).json({ error: 'Range non valido' });
    }
    range = parseInt(rangeQuery, 10);
  }

  const maxRange = 129600; // 90 giorni
  if (!Number.isFinite(range) || range < 60 || range > maxRange) {
    return res.status(400).json({ error: 'Range non valido' });
  }

  try {
    const rows = await getReadingsByMinutes(range);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function sync(req, res, next) {
  try {
    await syncReadings();
    const latest = await getLatestReading();
    res.json({ ok: true, latest });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getCurrent,
  getReadings,
  sync
};
