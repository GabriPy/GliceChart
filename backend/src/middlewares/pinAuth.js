// src/middlewares/pinAuth.js
const { getPinHash, validateUnlockSession } = require('../db/queries/authQueries');

async function pinAuthMiddleware(req, res, next) {
  // Le rotte di autenticazione e healthcheck non richiedono il token di sblocco
  if (req.path.startsWith('/api/auth') || req.path === '/api/health' || req.path === '/api/telegram/webhook') {
    return next();
  }

  try {
    const pinHash = await getPinHash().catch(() => null);
    if (!pinHash) {
      return next(); // PIN non attivo o DB offline: accesso libero
    }

    const token = req.headers['x-unlock-token'];
    if (!token || !(await validateUnlockSession(token).catch(() => false))) {
      return res.status(401).json({ error: 'Sblocca l\'app per continuare' });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = pinAuthMiddleware;
