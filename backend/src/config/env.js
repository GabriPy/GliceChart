// src/config/env.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });
require('dotenv').config(); // Fallback to cwd .env

module.exports = {
  PORT: parseInt(process.env.BACKEND_PORT || '3001', 10),
  POLL_INTERVAL_MINUTES: parseInt(process.env.POLL_INTERVAL_MINUTES || '5', 10),
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || '',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean),
  TELEGRAM_BOT_TOKEN: (process.env.TELEGRAM_BOT_TOKEN || '').trim(),
  TELEGRAM_CHAT_ID: (process.env.TELEGRAM_CHAT_ID || '').trim(),
  DEMO_MODE: process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === '1',
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'glicechart',
    password: process.env.DB_PASSWORD || 'glicechart',
    database: process.env.DB_NAME || 'glicechart',
    waitForConnections: true,
    connectionLimit: 10,
  }
};
