// src/db/queries/insulinQueries.js
const { getPool } = require('../pool');

async function insertInsulin({ timestamp, type, units }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO insulin_records (timestamp, type, units)
     VALUES (?, ?, ?)`,
    [new Date(timestamp), type, units]
  );
  return result.insertId;
}

async function getInsulinByMinutes(minutes) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, type, units
     FROM insulin_records
     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY timestamp ASC`,
    [minutes]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

async function deleteInsulin(id) {
  const p = await getPool();
  const [result] = await p.execute(
    `DELETE FROM insulin_records WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

async function updateInsulin(id, { timestamp, type, units }) {
  const p = await getPool();
  const [result] = await p.execute(
    `UPDATE insulin_records 
     SET timestamp = ?, type = ?, units = ?
     WHERE id = ?`,
    [new Date(timestamp), type, units, id]
  );
  return result.affectedRows > 0;
}

async function getInsulinByDate(date) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, type, units
     FROM insulin_records
     WHERE DATE(timestamp) = ?
     ORDER BY timestamp ASC`,
    [date]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

async function getInsulinOverlappingDate(date) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT ir.id, ir.timestamp, ir.type, ir.units
     FROM insulin_records ir
     CROSS JOIN settings s
     WHERE ir.timestamp < DATE_ADD(?, INTERVAL 1 DAY)
       AND DATE_ADD(
         ir.timestamp,
         INTERVAL CASE
           WHEN ir.type = 'rapid' THEN COALESCE(s.rapid_duration, 3)
           ELSE COALESCE(s.slow_duration, 24)
         END HOUR
       ) > ?
     ORDER BY ir.timestamp ASC`,
    [date, date]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

module.exports = {
  insertInsulin,
  getInsulinByMinutes,
  deleteInsulin,
  updateInsulin,
  getInsulinByDate,
  getInsulinOverlappingDate
};
