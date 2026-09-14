// src/db/queries/notesQueries.js
const { getPool } = require('../pool');

async function insertNote({ timestamp, text }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO notes (timestamp, text) VALUES (?, ?)`,
    [new Date(timestamp), text]
  );
  return result.insertId;
}

async function getNotesByMinutes(minutes) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, text
     FROM notes
     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY timestamp ASC`,
    [minutes]
  );
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

async function deleteNote(id) {
  const p = await getPool();
  const [result] = await p.execute(`DELETE FROM notes WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

async function updateNote(id, { timestamp, text }) {
  const p = await getPool();
  const [result] = await p.execute(
    `UPDATE notes SET timestamp = ?, text = ? WHERE id = ?`,
    [new Date(timestamp), text, id]
  );
  return result.affectedRows > 0;
}

async function getNotesByDate(date) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, text
     FROM notes
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
  insertNote,
  getNotesByMinutes,
  deleteNote,
  updateNote,
  getNotesByDate
};
