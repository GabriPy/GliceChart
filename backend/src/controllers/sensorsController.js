// src/controllers/sensorsController.js
const {
  getSensors,
  insertSensor,
  endSensor,
  deleteSensor
} = require('../db/queries/sensorsQueries');

async function listSensors(req, res, next) {
  try {
    const rows = await getSensors();
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function postSensor(req, res, next) {
  const { serial_number, lot_number, start_date } = req.body || {};
  const finalSerial = String(serial_number || '').trim();
  const finalLot = lot_number ? String(lot_number).trim() : null;
  const finalStartDate = start_date || new Date().toISOString();

  if (!finalSerial) return res.status(400).json({ error: 'Numero seriale mancante' });
  if (Number.isNaN(new Date(finalStartDate).getTime())) {
    return res.status(400).json({ error: 'Data non valida' });
  }

  try {
    const id = await insertSensor({ 
      serial_number: finalSerial, 
      lot_number: finalLot, 
      start_date: finalStartDate 
    });
    res.json({ ok: true, id });
  } catch (e) {
    next(e);
  }
}

async function stopSensor(req, res, next) {
  const { actual_end_date, early_end_note } = req.body || {};
  const finalEndDate = actual_end_date || new Date().toISOString();
  const finalNote = early_end_note ? String(early_end_note).trim() : null;

  if (Number.isNaN(new Date(finalEndDate).getTime())) {
    return res.status(400).json({ error: 'Data non valida' });
  }

  try {
    const ok = await endSensor(req.params.id, {
      actual_end_date: finalEndDate,
      early_end_note: finalNote
    });
    if (!ok) return res.status(404).json({ error: 'Sensore non trovato o già terminato' });
    res.json({ ok });
  } catch (e) {
    next(e);
  }
}

async function removeSensor(req, res, next) {
  try {
    const ok = await deleteSensor(req.params.id);
    res.json({ ok });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listSensors,
  postSensor,
  stopSensor,
  removeSensor
};
