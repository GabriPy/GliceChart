// src/cron/scheduler.js
const cron = require('node-cron');
const { POLL_INTERVAL_MINUTES } = require('../config/env');
const { syncReadings } = require('../services/glurooSync');
const { sendDailySummary } = require('../services/telegram');

let scheduledJobs = [];

function startScheduler() {
  stopScheduler(); // evita job duplicati

  // Polling per letture CGM
  const pollJob = cron.schedule(`*/${POLL_INTERVAL_MINUTES} * * * *`, async () => {
    try {
      await syncReadings();
    } catch (e) {
      console.error('[cron/poll] Errore sync:', e.message);
    }
  });

  // Controllo ogni minuto per l'invio del riepilogo giornaliero Telegram all'orario impostato
  const summaryJob = cron.schedule('* * * * *', async () => {
    try {
      await sendDailySummary();
    } catch (e) {
      console.error('[cron/summary] Errore riassunto:', e.message);
    }
  });

  scheduledJobs.push(pollJob, summaryJob);
  console.log(`⏱️ Cron scheduler attivo: polling ogni ${POLL_INTERVAL_MINUTES}m, riepilogo giornaliero attivo.`);
}

function stopScheduler() {
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs = [];
}

module.exports = {
  startScheduler,
  stopScheduler
};
