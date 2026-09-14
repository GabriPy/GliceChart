// src/controllers/telegramController.js
const { getLatestReading, getReadingsByDate } = require('../db/queries/readingsQueries');
const { sendTelegramMessage, formatTelegramTime } = require('../services/telegram');

async function handleWebhook(req, res, next) {
  const update = req.body || {};
  const message = update.message || update.edited_message;
  if (!message || !message.text || !message.chat?.id) {
    return res.json({ ok: true });
  }

  const chatId = Number(message.chat.id);
  const incomingText = String(message.text || '').trim();
  if (!incomingText.startsWith('/')) {
    return res.json({ ok: true });
  }

  const command = incomingText.toLowerCase();
  let reply = 'Comando non supportato.';

  try {
    if (command === '/glicemia') {
      const latest = await getLatestReading();
      if (!latest) {
        reply = 'Nessuna lettura disponibile.';
      } else {
        reply = `Ultima glicemia: <b>${latest.glucose} mg/dL</b> alle <b>${formatTelegramTime(latest.timestamp)}</b>.`;
      }
    } else if (command === '/glicemie_oggi') {
      const today = new Date().toISOString().slice(0, 10);
      const readings = await getReadingsByDate(today);
      if (!readings.length) {
        reply = 'Nessuna glicemia registrata oggi.';
      } else {
        const values = readings.map(r => Number(r.glucose));
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        const min = Math.min(...values);
        const max = Math.max(...values);
        reply = `Oggi hai registrato <b>${readings.length}</b> letture.\nMedia: <b>${avg} mg/dL</b>\nMin: <b>${min}</b> | Max: <b>${max}</b>.`;
      }
    } else if (command === '/help') {
      reply = 'Comandi disponibili:\n/glicemia\n/glicemie_oggi';
    }

    await sendTelegramMessage(reply, chatId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  handleWebhook
};
