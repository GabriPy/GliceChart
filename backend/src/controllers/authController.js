// src/controllers/authController.js
const {
  getPinHash,
  setPinHash,
  removePinHash,
  hashPin,
  createUnlockSession,
  deleteUnlockSession,
  createRecoveryChallenge,
  verifyRecoveryChallenge,
  resetRecoveredPin
} = require('../db/queries/authQueries');
const { sendTelegramMessage } = require('../services/telegram');
const { TELEGRAM_CHAT_ID } = require('../config/env');

function validatePinInput(pin, fieldLabel = 'PIN') {
  const normalized = String(pin || '').trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${fieldLabel} deve contenere solo numeri`);
  }
  if (normalized.length < 4 || normalized.length > 6) {
    throw new Error(`${fieldLabel} deve avere tra 4 e 6 cifre`);
  }
  return normalized;
}

async function getAuthStatus(req, res, next) {
  try {
    const hash = await getPinHash();
    res.json({ enabled: !!hash });
  } catch (e) {
    next(e);
  }
}

async function verifyPin(req, res, next) {
  const { pin } = req.body || {};
  if (!pin) return res.status(400).json({ error: 'PIN mancante' });
  try {
    const normalizedPin = validatePinInput(pin);
    const hash = await getPinHash();
    if (!hash) return res.status(404).json({ error: 'PIN non impostato' });
    if (hashPin(normalizedPin) !== hash) {
      return res.status(401).json({ error: 'PIN errato' });
    }
    const token = await createUnlockSession();
    res.json({ ok: true, token });
  } catch (e) {
    res.status(400).json({ error: e.message || 'PIN non valido' });
  }
}

async function setPin(req, res, next) {
  const { pin } = req.body || {};
  try {
    const normalizedPin = validatePinInput(pin);
    const saved = await setPinHash(normalizedPin);
    if (!saved) {
      return res.status(500).json({ error: 'Impossibile salvare il PIN: impostazioni non inizializzate' });
    }
    const token = await createUnlockSession();
    res.json({ ok: true, token });
  } catch (e) {
    res.status(400).json({ error: e.message || 'PIN non valido' });
  }
}

async function removePin(req, res, next) {
  try {
    await removePinHash();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function lockSession(req, res, next) {
  const token = req.headers['x-unlock-token'];
  try {
    await deleteUnlockSession(token);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function requestRecovery(req, res, next) {
  try {
    const hash = await getPinHash();
    if (!hash) return res.status(404).json({ error: 'PIN non impostato' });

    const chatId = String(process.env.TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID || '').trim();
    if (!chatId) return res.status(500).json({ error: 'Telegram non configurato' });

    const { code, recoveryId } = await createRecoveryChallenge(chatId, 10 * 60 * 1000);
    const message = `🔐 <b>GliceChart</b>\n\nRecupero PIN richiesto.\n\nCodice: <code>${code}</code>\n\nIl codice scade tra 10 minuti.\nSe non hai richiesto il recupero, ignora questo messaggio.`;
    await sendTelegramMessage(message, chatId);

    res.json({ ok: true, recoveryId });
  } catch (e) {
    next(e);
  }
}

async function verifyRecovery(req, res, next) {
  const { code } = req.body || {};
  const normalizedCode = String(code || '').trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    return res.status(400).json({ error: 'Codice non valido' });
  }

  try {
    const chatId = String(process.env.TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID || '').trim();
    const result = await verifyRecoveryChallenge(normalizedCode, chatId);
    if (!result) return res.status(401).json({ error: 'Codice non valido o scaduto' });

    res.json({ ok: true, recoveryId: result.recoveryId, sessionId: result.sessionId });
  } catch (e) {
    next(e);
  }
}

async function resetPin(req, res, next) {
  const { recoveryId, sessionId, pin, newPin } = req.body || {};
  const normalizedPin = String(pin ?? newPin ?? '').trim();
  if (!recoveryId || !sessionId || !normalizedPin) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }

  try {
    const validatedPin = validatePinInput(normalizedPin, 'Nuovo PIN');
    const ok = await resetRecoveredPin({
      recoveryId,
      sessionId,
      pin: validatedPin
    });

    if (!ok) return res.status(400).json({ error: 'Reset non disponibile' });

    const token = await createUnlockSession();
    res.json({ ok: true, token });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Reset non disponibile' });
  }
}

module.exports = {
  validatePinInput,
  getAuthStatus,
  verifyPin,
  setPin,
  removePin,
  lockSession,
  requestRecovery,
  verifyRecovery,
  resetPin
};
