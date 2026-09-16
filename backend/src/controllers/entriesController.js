// src/controllers/entriesController.js
const {
  insertInsulin,
  getInsulinByMinutes,
  deleteInsulin,
  updateInsulin
} = require('../db/queries/insulinQueries');
const {
  insertCarb,
  getCarbsByMinutes,
  deleteCarb,
  updateCarb
} = require('../db/queries/carbsQueries');
const {
  insertNote,
  getNotesByMinutes,
  deleteNote,
  updateNote
} = require('../db/queries/notesQueries');
const {
  sendTelegramInsulinConfirmation,
  sendTelegramCarbConfirmation
} = require('../services/telegram');

const { parseRange } = require('../utils/validation');

// ── Insulina ────────────────────────────────────────────────────────────────
async function getInsulin(req, res, next) {
  const range = parseRange(req.query.range);
  if (range === null) {
    return res.status(400).json({ error: 'Range non valido' });
  }
  try {
    const rows = await getInsulinByMinutes(range);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function postInsulin(req, res, next) {
  const { timestamp, type, units } = req.body || {};
  if (!timestamp || !type || !units) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  try {
    const id = await insertInsulin({ timestamp, type, units });
    await sendTelegramInsulinConfirmation({ timestamp, type, units });
    res.json({ ok: true, id });
  } catch (e) {
    next(e);
  }
}

async function putInsulin(req, res, next) {
  const { timestamp, type, units } = req.body || {};
  if (!timestamp || !type || !units) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  try {
    const ok = await updateInsulin(req.params.id, { timestamp, type, units });
    res.json({ ok });
  } catch (e) {
    next(e);
  }
}

async function deleteInsulinEntry(req, res, next) {
  try {
    const ok = await deleteInsulin(req.params.id);
    res.json({ ok });
  } catch (e) {
    next(e);
  }
}

// ── Carboidrati ─────────────────────────────────────────────────────────────
async function getCarbs(req, res, next) {
  const range = parseRange(req.query.range);
  if (range === null) {
    return res.status(400).json({ error: 'Range non valido' });
  }
  try {
    const rows = await getCarbsByMinutes(range);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function postCarb(req, res, next) {
  const { timestamp, amount } = req.body || {};
  if (!timestamp || !amount) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  try {
    const id = await insertCarb({ timestamp, amount });
    await sendTelegramCarbConfirmation({ timestamp, amount });
    res.json({ ok: true, id });
  } catch (e) {
    next(e);
  }
}

async function putCarb(req, res, next) {
  const { timestamp, amount } = req.body || {};
  if (!timestamp || !amount) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  try {
    const ok = await updateCarb(req.params.id, { timestamp, amount });
    res.json({ ok });
  } catch (e) {
    next(e);
  }
}

async function deleteCarbEntry(req, res, next) {
  try {
    const ok = await deleteCarb(req.params.id);
    res.json({ ok });
  } catch (e) {
    next(e);
  }
}

// ── Note / Eventi ───────────────────────────────────────────────────────────
async function getNotes(req, res, next) {
  const range = parseRange(req.query.range);
  if (range === null) {
    return res.status(400).json({ error: 'Range non valido' });
  }
  try {
    const rows = await getNotesByMinutes(range);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function postNote(req, res, next) {
  const { timestamp, text } = req.body || {};
  const finalText = String(text || '').trim();
  if (!finalText) return res.status(400).json({ error: 'Testo mancante' });
  if (finalText.length > 200) return res.status(400).json({ error: 'Testo troppo lungo' });
  const ts = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(ts.getTime())) return res.status(400).json({ error: 'Timestamp non valido' });
  try {
    const id = await insertNote({ timestamp: ts.toISOString(), text: finalText });
    res.json({ ok: true, id });
  } catch (e) {
    next(e);
  }
}

async function putNote(req, res, next) {
  const { timestamp, text } = req.body || {};
  const finalText = String(text || '').trim();
  if (!finalText) return res.status(400).json({ error: 'Testo mancante' });
  if (finalText.length > 200) return res.status(400).json({ error: 'Testo troppo lungo' });
  const ts = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(ts.getTime())) return res.status(400).json({ error: 'Timestamp non valido' });
  try {
    const ok = await updateNote(req.params.id, { timestamp: ts.toISOString(), text: finalText });
    res.json({ ok });
  } catch (e) {
    next(e);
  }
}

async function deleteNoteEntry(req, res, next) {
  try {
    const ok = await deleteNote(req.params.id);
    res.json({ ok });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getInsulin,
  postInsulin,
  putInsulin,
  deleteInsulinEntry,
  getCarbs,
  postCarb,
  putCarb,
  deleteCarbEntry,
  getNotes,
  postNote,
  putNote,
  deleteNoteEntry
};
