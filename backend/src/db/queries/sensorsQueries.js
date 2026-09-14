// src/db/queries/sensorsQueries.js
const { getPool } = require('../pool');

async function insertSensor({ serial_number, lot_number, start_date }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO sensors (serial_number, lot_number, start_date) VALUES (?, ?, ?)`,
    [serial_number, lot_number, new Date(start_date)]
  );
  return result.insertId;
}

async function getSensors() {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, serial_number, lot_number, start_date, end_date, actual_end_date, early_end_note, created_at
     FROM sensors
     ORDER BY start_date DESC`
  );
  return rows.map(r => ({
    ...r,
    start_date: new Date(r.start_date).toISOString(),
    end_date: new Date(r.end_date).toISOString(),
    actual_end_date: r.actual_end_date ? new Date(r.actual_end_date).toISOString() : null,
    created_at: new Date(r.created_at).toISOString()
  }));
}

async function endSensor(id, { actual_end_date, early_end_note }) {
  const p = await getPool();
  const [result] = await p.execute(
    `UPDATE sensors 
     SET actual_end_date = ?, early_end_note = ?
     WHERE id = ? AND actual_end_date IS NULL`,
    [new Date(actual_end_date), early_end_note || null, id]
  );
  return result.affectedRows > 0;
}

async function deleteSensor(id) {
  const p = await getPool();
  const [result] = await p.execute(
    `DELETE FROM sensors WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  insertSensor,
  getSensors,
  endSensor,
  deleteSensor
};
