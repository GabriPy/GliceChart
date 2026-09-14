// src/db/queries/carbsQueries.js
const { getPool } = require('../pool');

async function insertCarb({ timestamp, amount }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO carb_records (timestamp, amount) VALUES (?, ?)`,
    [new Date(timestamp), amount]
  );
  return result.insertId;
}

async function getCarbsByMinutes(minutes) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, amount
     FROM carb_records
     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY timestamp ASC`,
    [minutes]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

async function deleteCarb(id) {
  const p = await getPool();
  const [result] = await p.execute(`DELETE FROM carb_records WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

async function updateCarb(id, { timestamp, amount }) {
  const p = await getPool();
  const [result] = await p.execute(
    `UPDATE carb_records SET timestamp = ?, amount = ? WHERE id = ?`,
    [new Date(timestamp), amount, id]
  );
  return result.affectedRows > 0;
}

async function getCarbsByDate(date) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, amount
     FROM carb_records
     WHERE DATE(timestamp) = ?
     ORDER BY timestamp ASC`,
    [date]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

module.exports = {
  insertCarb,
  getCarbsByMinutes,
  deleteCarb,
  updateCarb,
  getCarbsByDate
};
