// src/db/queries/authQueries.js
const crypto = require('crypto');
const { getPool } = require('../pool');

const SCRYPT_KEYLEN = 64;

function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(String(pin), salt, SCRYPT_KEYLEN);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
+ * Verifica un PIN contro l'hash salvato, supportando sia il nuovo formato
+ * (scrypt+salt, "salt:hash") sia il vecchio (sha256 semplice, per compatibilità
+ * con i PIN impostati prima di questa modifica).
+ */
function verifyPinHash(pin, storedHash) {
  if (!storedHash) return false;

  if (storedHash.includes(':')) {
    const [salt, key] = storedHash.split(':');
    const derivedKey = crypto.scryptSync(String(pin), salt, SCRYPT_KEYLEN);
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  }

  // Formato legacy
  const legacyHash = crypto.createHash('sha256').update(String(pin)).digest('hex');
  const legacyBuffer = Buffer.from(legacyHash, 'hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');
  if (legacyBuffer.length !== storedBuffer.length) return false;
  return crypto.timingSafeEqual(legacyBuffer, storedBuffer);
}

function hashRecoveryValue(value) {
  return crypto.createHash('sha256').update(String(value).trim()).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
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
  const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO recovery_tokens (token, chat_id, expires_at, used, verified, attempt_count, session_id, session_expires_at, last_attempt_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), FALSE, FALSE, 0, NULL, NULL, NULL)`,
    [hashRecoveryValue(code), finalChatId, ttlSeconds]
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
  const nextAttempts = Number(matchingRow.attempt_count || 0) + 1;

  await p.execute(
    `UPDATE recovery_tokens
     SET verified = TRUE, used = TRUE, attempt_count = ?, last_attempt_at = NOW(), session_id = ?, session_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
     WHERE id = ?`,
    [nextAttempts, sessionId, matchingRow.id]
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
    `INSERT INTO recovery_tokens (token, chat_id, expires_at) VALUES (?, ?, ?)`,
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
  hashPin,
  hashRecoveryValue,
  getPinHash,
  setPinHash,
  verifyPinHash,
  removePinHash,
  createUnlockSession,
  validateUnlockSession,
  deleteUnlockSession,
  isRecoveryRateLimited,
  createRecoveryChallenge,
  verifyRecoveryChallenge,
  resetRecoveredPin,
  createRecoveryToken,
  consumeRecoveryToken
};
