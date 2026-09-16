// src/controllers/readingsController.js
const { parseRange } = require('../utils/validation');
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
  const range = parseRange(req.query.range);
  if (range === null) {
    return res.status(400).json({ error: 'Range non valido' });
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
