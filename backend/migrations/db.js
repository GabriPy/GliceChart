// db.js - Connessione e query MySQL
const mysql = require('mysql2/promise');
const crypto = require('crypto');

let pool = null;

// Crea il pool di connessioni (viene riutilizzato per tutta la vita del server)
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '3306'),
      user:     process.env.DB_USER     || 'glicechart',
      password: process.env.DB_PASSWORD || 'glicechart',
      database: process.env.DB_NAME     || 'glicechart',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

// Inserisce una lettura (aggiorna se il timestamp esiste già)
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

// Letture degli ultimi N minuti
async function getReadingsByMinutes(minutes) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, timestamp, glucose, trend
     FROM readings
     WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY timestamp ASC`,
    [minutes]
  );
  // Converte i Date di MySQL in stringhe ISO per coerenza con il frontend
  return rows.map(r => ({
    ...r,
    timestamp: new Date(r.timestamp).toISOString(),
  }));
}

// Ultima lettura disponibile
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

// Inserisce una somministrazione di insulina
async function insertInsulin({ timestamp, type, units }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO insulin_records (timestamp, type, units)
     VALUES (?, ?, ?)`,
    [new Date(timestamp), type, units]
  );
  return result.insertId;
}

// Recupera somministrazioni di insulina negli ultimi N minuti
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

// Elimina un record di insulina
async function deleteInsulin(id) {
  const p = await getPool();
  const [result] = await p.execute(
    `DELETE FROM insulin_records WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

// Aggiorna un record di insulina
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

// Recupera letture per una data specifica (YYYY-MM-DD)
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

// Recupera insuline per una data specifica (YYYY-MM-DD)
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

// Recupera insuline che si sovrappongono a una data specifica (YYYY-MM-DD)
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

// ── Carboidrati (CHO) ────────────────────────────────────────────────────────
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

// ── Note / Eventi ────────────────────────────────────────────────────────────
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

// ── Dietometro ───────────────────────────────────────────────────────────────
async function getDietFoods() {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, name, carbs_per_100g, category FROM diet_foods ORDER BY category ASC, name ASC`
  );
  return rows;
}

async function insertDietFood({ name, carbs_per_100g, category }) {
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO diet_foods (name, carbs_per_100g, category) VALUES (?, ?, ?)`,
    [name, carbs_per_100g, category || 'contorni']
  );
  return result.insertId;
}

// ── Sensori ───────────────────────────────────────────────────────────────
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

// ── Impostazioni (Settings) ──────────────────────────────────────────────────
async function getSettings() {
  const p = await getPool();
  const [rows] = await p.execute(`SELECT * FROM settings WHERE id = 1`);
  return rows[0];
}

async function updateSettings({ tir_min, tir_max, red_under, red_over, rapid_duration, slow_duration, carb_duration, insulin_sensitivity, carb_ratio, quick_insulin_1, quick_insulin_2, quick_carb_1, quick_carb_2, telegram_enabled, telegram_high_low_alerts, telegram_insulin_alerts, telegram_carb_alerts, telegram_daily_summary, telegram_daily_summary_time }) {
  const p = await getPool();
  // Ulteriore controllo di sicurezza sui valori di default
  const finalTirMin = tir_min ?? 70;
  const finalTirMax = tir_max ?? 180;
  const finalRedUnder = red_under ?? 55;
  const finalRedOver = red_over ?? 250;
  const finalRapid = rapid_duration ?? 3;
  const finalSlow = slow_duration ?? 24;
  const finalCarbDuration = carb_duration ?? 4;
  const finalInsulinSensitivity = insulin_sensitivity ?? 60;
  const finalCarbRatio = carb_ratio ?? 15;
  const finalQuickIns1 = quick_insulin_1 ?? 1;
  const finalQuickIns2 = quick_insulin_2 ?? 2;
  const finalQuickCarb1 = quick_carb_1 ?? 10;
  const finalQuickCarb2 = quick_carb_2 ?? 20;
  const finalTelegramEnabled = telegram_enabled ?? false;
  const finalTelegramHighLow = telegram_high_low_alerts ?? true;
  const finalTelegramInsulin = telegram_insulin_alerts ?? false;
  const finalTelegramCarb = telegram_carb_alerts ?? false;
  const finalTelegramDaily = telegram_daily_summary ?? false;
  const finalDailySummaryTime = telegram_daily_summary_time || '21:00';

  const [result] = await p.execute(
    `UPDATE settings 
     SET tir_min = ?, tir_max = ?, red_under = ?, red_over = ?, rapid_duration = ?, slow_duration = ?, carb_duration = ?, insulin_sensitivity = ?, carb_ratio = ?, quick_insulin_1 = ?, quick_insulin_2 = ?, quick_carb_1 = ?, quick_carb_2 = ?, telegram_enabled = ?, telegram_high_low_alerts = ?, telegram_insulin_alerts = ?, telegram_carb_alerts = ?, telegram_daily_summary = ?, telegram_daily_summary_time = ?
     WHERE id = 1`,
    [finalTirMin, finalTirMax, finalRedUnder, finalRedOver, finalRapid, finalSlow, finalCarbDuration, finalInsulinSensitivity, finalCarbRatio, finalQuickIns1, finalQuickIns2, finalQuickCarb1, finalQuickCarb2, finalTelegramEnabled, finalTelegramHighLow, finalTelegramInsulin, finalTelegramCarb, finalTelegramDaily, finalDailySummaryTime]
  );
  return result.affectedRows > 0;
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

function hashRecoveryValue(value) {
  return crypto.createHash('sha256').update(String(value).trim()).digest('hex');
}

async function getPinHash() {
  const p = await getPool();
  const [rows] = await p.execute(`SELECT pin_hash FROM settings WHERE id = 1`);
  return rows[0]?.pin_hash || null;
}

async function setPinHash(pin) {
  const p = await getPool();
  const [result] = await p.execute(
    `UPDATE settings SET pin_hash = ? WHERE id = 1`,
    [hashPin(pin)]
  );
  return result.affectedRows > 0;
}

async function removePinHash() {
  const p = await getPool();
  const [result] = await p.execute(
    `UPDATE settings SET pin_hash = NULL WHERE id = 1`
  );
  return result.affectedRows > 0;
}

function generateToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

async function createUnlockSession() {
  const p = await getPool();
  const token = generateToken();
  await p.execute(`INSERT INTO sessions (id) VALUES (?)`, [token]);
  return token;
}

async function validateUnlockSession(token) {
  if (!token) return false;
  const p = await getPool();
  const [rows] = await p.execute(`SELECT 1 FROM sessions WHERE id = ?`, [token]);
  return !!rows.length;
}

async function deleteUnlockSession(token) {
  if (!token) return;
  const p = await getPool();
  await p.execute(`DELETE FROM sessions WHERE id = ?`, [token]);
}

async function isRecoveryRateLimited(chatId, minMs = 60_000) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT created_at FROM recovery_tokens WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1`,
    [String(chatId)]
  );
  if (!rows.length) return false;
  const lastRequest = new Date(rows[0].created_at).getTime();
  return Date.now() - lastRequest < minMs;
}

async function createRecoveryChallenge(chatId, ttlMs = 10 * 60 * 1000) {
  const finalChatId = String(chatId || '').trim();
  if (!finalChatId) {
    throw new Error('Telegram Chat ID mancante');
  }

  if (await isRecoveryRateLimited(finalChatId, 60_000)) {
    const err = new Error('Recovery request rate limited');
    err.code = 'RATE_LIMITED';
    throw err;
  }

  const code = String(crypto.randomInt(100000, 1000000)).padStart(6, '0');
  const expiresAt = new Date(Date.now() + ttlMs).toISOString().slice(0, 19).replace('T', ' ');
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO recovery_tokens (token, chat_id, expires_at, used, verified, attempt_count, session_id, session_expires_at, last_attempt_at)
     VALUES (?, ?, ?, FALSE, FALSE, 0, NULL, NULL, NULL)`,
    [hashRecoveryValue(code), finalChatId, expiresAt]
  );

  return { code, recoveryId: result.insertId };
}

async function verifyRecoveryChallenge(code, chatId) {
  const finalChatId = String(chatId || '').trim();
  const normalizedCode = String(code || '').trim();
  if (!finalChatId || !normalizedCode) return null;

  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT * FROM recovery_tokens
     WHERE chat_id = ? AND expires_at > NOW() AND used = FALSE AND verified = FALSE
     ORDER BY created_at DESC LIMIT 10`,
    [finalChatId]
  );

  const matchingRow = rows.find(row => hashRecoveryValue(normalizedCode) === row.token);
  if (!matchingRow) {
    const latest = rows[0];
    if (latest) {
      const nextAttempts = Number(latest.attempt_count || 0) + 1;
      const shouldLock = nextAttempts >= 5;
      await p.execute(
        `UPDATE recovery_tokens
         SET attempt_count = ?, last_attempt_at = NOW(), used = ?
         WHERE id = ?`,
        [nextAttempts, shouldLock ? 1 : 0, latest.id]
      );
    }
    return null;
  }

  const sessionId = crypto.randomBytes(18).toString('hex');
  const sessionExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const nextAttempts = Number(matchingRow.attempt_count || 0) + 1;

  await p.execute(
    `UPDATE recovery_tokens
     SET verified = TRUE, used = TRUE, attempt_count = ?, last_attempt_at = NOW(), session_id = ?, session_expires_at = ?
     WHERE id = ?`,
    [nextAttempts, sessionId, sessionExpiresAt, matchingRow.id]
  );

  return { recoveryId: matchingRow.id, sessionId };
}

async function resetRecoveredPin({ recoveryId, sessionId, pin }) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT * FROM recovery_tokens
     WHERE id = ? AND session_id = ? AND verified = TRUE AND used = TRUE AND session_expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [Number(recoveryId), String(sessionId)]
  );

  if (!rows.length) return false;

  const normalizedPin = String(pin || '').trim();
  if (!/^\d+$/.test(normalizedPin) || normalizedPin.length < 4 || normalizedPin.length > 6) {
    return false;
  }

  const saved = await setPinHash(normalizedPin);
  if (!saved) return false;

  await p.execute(
    `UPDATE recovery_tokens
     SET used = TRUE, session_id = NULL, session_expires_at = NULL, verified = TRUE
     WHERE id = ?`,
    [Number(recoveryId)]
  );

  return true;
}

async function createRecoveryToken(token, chatId, expiresAt) {
  const p = await getPool();
  await p.execute(
    `INSERT INTO recovery_tokens (token, chat_id, expires_at) VALUES (?, ?, ? )`,
    [hashRecoveryValue(token), String(chatId), expiresAt]
  );
}

async function consumeRecoveryToken(token) {
  const p = await getPool();
  const [rows] = await p.execute(
    `SELECT id, used, expires_at FROM recovery_tokens WHERE token = ? ORDER BY created_at DESC LIMIT 1`,
    [hashRecoveryValue(token)]
  );
  if (!rows.length) return null;
  const row = rows[0];
  if (row.used) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  await p.execute(`UPDATE recovery_tokens SET used = TRUE WHERE id = ?`, [row.id]);
  return true;
}

module.exports = {
  getPool,
  insertReading,
  getReadingsByMinutes,
  getLatestReading,
  insertInsulin,
  getInsulinByMinutes,
  deleteInsulin,
  updateInsulin,
  getReadingsByDate,
  getInsulinByDate,
  getInsulinOverlappingDate,
  insertCarb,
  getCarbsByMinutes,
  deleteCarb,
  updateCarb,
  getCarbsByDate,
  insertNote,
  deleteNote,
  updateNote,
  getNotesByMinutes,
  getNotesByDate,
  getDietFoods,
  insertDietFood,
  insertSensor,
  getSensors,
  endSensor,
  deleteSensor,
  getSettings,
  updateSettings,
  getPinHash,
  setPinHash,
  removePinHash,
  hashPin,
  hashRecoveryValue,
  createUnlockSession,
  validateUnlockSession,
  deleteUnlockSession,
  createRecoveryChallenge,
  verifyRecoveryChallenge,
  resetRecoveredPin,
  createRecoveryToken,
  consumeRecoveryToken,
  isRecoveryRateLimited
};