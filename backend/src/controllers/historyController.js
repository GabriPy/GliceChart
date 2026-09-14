// src/controllers/historyController.js
const { getReadingsByDate } = require('../db/queries/readingsQueries');
const { getInsulinByDate, getInsulinOverlappingDate } = require('../db/queries/insulinQueries');
const { getCarbsByDate } = require('../db/queries/carbsQueries');
const { getNotesByDate } = require('../db/queries/notesQueries');

async function getHistoryReadings(req, res, next) {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: 'Data mancante' });
  try {
    const rows = await getReadingsByDate(date);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function getHistoryInsulin(req, res, next) {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: 'Data mancante' });
  try {
    const rows = await getInsulinByDate(date);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function getHistoryInsulinOverlap(req, res, next) {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: 'Data mancante' });
  try {
    const rows = await getInsulinOverlappingDate(date);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function getHistoryCarbs(req, res, next) {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: 'Data mancante' });
  try {
    const rows = await getCarbsByDate(date);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function getHistoryNotes(req, res, next) {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: 'Data mancante' });
  try {
    const rows = await getNotesByDate(date);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getHistoryReadings,
  getHistoryInsulin,
  getHistoryInsulinOverlap,
  getHistoryCarbs,
  getHistoryNotes
};
