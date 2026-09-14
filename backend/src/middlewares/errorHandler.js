// src/middlewares/errorHandler.js

function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message || err);

  if (err.code === 'RATE_LIMITED') {
    return res.status(429).json({ error: 'Richiesta già inviata di recente. Riprova più tardi.' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Errore interno del server'
  });
}

module.exports = errorHandler;
