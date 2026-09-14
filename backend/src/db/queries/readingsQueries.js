// src/db/queries/readingsQueries.js
const { getPool } = require('../pool');

async function insertReading({ timestamp, glucose, trend, raw_trend }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO readings (timestamp, glucose, trend, raw_trend)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
     glucose = VALUES(glucose),
     trend = VALUES(trend),
     raw_trend = VALUES(raw_trend)`,
    [new Date(timestamp), glucose, trend, raw_trend]
  );
  return result.affectedRows > 0;
}

async function getReadingsByMinutes(minutes) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, glucose, trend
     FROM readings
     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY timestamp ASC`,
    [minutes]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

async function getLatestReading() {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, glucose, trend
     FROM readings
     ORDER BY timestamp DESC
     LIMIT 1`
  );
  if (!rows.length) return null;
  return {
    ...rows[0],
    timestamp: new Date(rows[0].timestamp).toISOString(),
  };
}

async function getReadingsByDate(date) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, glucose, trend
     FROM readings
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
  insertReading,
  getReadingsByMinutes,
  getLatestReading,
  getReadingsByDate
};
