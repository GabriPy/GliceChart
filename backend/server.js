// server.js - Bootstrap < 60 lines
const express = require('express');
const cors = require('cors');
const { PORT, POLL_INTERVAL_MINUTES, PUBLIC_API_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, DEMO_MODE } = require('./src/config/env');
const { getPool } = require('./src/db/pool');
const { runMigrations } = require('./src/services/migrationRunner');
const { syncReadings } = require('./src/services/glurooSync');
const { startScheduler } = require('./src/cron/scheduler');
const pinAuthMiddleware = require('./src/middlewares/pinAuth');
const errorHandler = require('./src/middlewares/errorHandler');
const apiRoutes = require('./src/routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinAuthMiddleware);

app.use('/api', apiRoutes);
app.use(errorHandler);

async function start() {
  await getPool();

  try {
    await runMigrations();
  } catch (err) {
    console.error('⚠️ Migrazioni fallite:', err.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 GliceChart in ascolto su http://localhost:${PORT}`);
    console.log(`🌐 Pubblico su: ${PUBLIC_API_URL || '(non configurato)'}`);
    console.log(`📡 Sync ogni ${POLL_INTERVAL_MINUTES} minuti`);
    if (DEMO_MODE) {
      console.log('🧪 DEMO_MODE ATTIVA: Mock CGM abilitato');
    }
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log('📲 Telegram non attivo: imposta TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID per le notifiche');
    } else {
      console.log(`📲 Telegram attivo per chat ${TELEGRAM_CHAT_ID}`);
    }
    console.log('');
  });

  await syncReadings();
  startScheduler();

  return server;
}

if (require.main === module) {
  start().catch(err => {
    console.error('Errore fatale avvio backend:', err);
    process.exit(1);
  });
}

module.exports = { app, start };
