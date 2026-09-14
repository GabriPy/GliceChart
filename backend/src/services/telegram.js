// src/services/telegram.js
const axios = require('axios');
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = require('../config/env');
const { getSettings, getReadingsByDate, getInsulinByDate, getCarbsByDate } = require('../db/queries');

let lastTelegramHighLowState = null;
let lastDailySummaryDate = null;

function formatTelegramTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'N/D';
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function sendTelegramMessage(text, chatId = TELEGRAM_CHAT_ID) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    return false;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      parse_mode: 'HTML'
    });
    return true;
  } catch (e) {
    console.error('❌ Telegram send failed:', e.response?.data?.description || e.message);
    return false;
  }
}

async function getTelegramSettings() {
  const settings = await getSettings();
  return {
    enabled: Boolean(settings?.telegram_enabled),
    highLow: settings?.telegram_high_low_alerts !== false,
    insulin: Boolean(settings?.telegram_insulin_alerts),
    carbs: Boolean(settings?.telegram_carb_alerts),
    dailySummary: Boolean(settings?.telegram_daily_summary)
  };
}

async function sendTelegramInsulinConfirmation({ timestamp, type, units }) {
  const settings = await getTelegramSettings();
  if (!settings.enabled || !settings.insulin) return;

  const text = `💉 <b>GliceChart</b>\nInsulina ${type === 'rapid' ? 'rapida' : 'lenta'} registrata: <b>${Number(units).toFixed(1)} U</b>\n${formatTelegramTime(timestamp)}`;
  await sendTelegramMessage(text);
}

async function sendTelegramCarbConfirmation({ timestamp, amount }) {
  const settings = await getTelegramSettings();
  if (!settings.enabled || !settings.carbs) return;

  const text = `🍽️ <b>GliceChart</b>\nCarboidrati registrati: <b>${Number(amount)} g</b>\n${formatTelegramTime(timestamp)}`;
  await sendTelegramMessage(text);
}

async function sendTelegramHighLowAlert(latest) {
  const settings = await getTelegramSettings();
  if (!settings.enabled || !settings.highLow) return;

  const glucose = Number(latest?.glucose);
  const currentSettings = await getSettings();
  const redUnder = Number(currentSettings?.red_under ?? 55);
  const redOver = Number(currentSettings?.red_over ?? 250);

  let state = 'normal';
  if (glucose <= redUnder) state = 'low';
  else if (glucose >= redOver) state = 'high';

  if (state === 'normal' || state === lastTelegramHighLowState) return;
  lastTelegramHighLowState = state;

  const text = `🚨 <b>GliceChart</b>\nLivello glicemico fuori soglia: <b>${glucose} mg/dL</b>\n${state === 'low' ? 'Ipoglicemia' : 'Iperglicemia'} rilevata\n${formatTelegramTime(latest?.timestamp)}`;
  await sendTelegramMessage(text);
}

async function sendDailySummary() {
  const settings = await getTelegramSettings();
  if (!settings.enabled || !settings.dailySummary) return;

  const currentTime = new Date().toTimeString().slice(0, 5);
  const configuredTime = String((await getSettings())?.telegram_daily_summary_time || '21:00').slice(0, 5);
  if (currentTime !== configuredTime) return;

  const today = new Date().toISOString().slice(0, 10);
  if (lastDailySummaryDate === today) return;

  const [readings, insulin, carbs] = await Promise.all([
    getReadingsByDate(today),
    getInsulinByDate(today),
    getCarbsByDate(today)
  ]);

  lastDailySummaryDate = today;

  if (!readings.length) {
    await sendTelegramMessage('📊 <b>GliceChart</b>\nNessuna lettura registrata per oggi.');
    return;
  }

  const values = readings.map(r => Number(r.glucose));
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const currentSettings = await getSettings();
  const tirMin = Number(currentSettings?.tir_min ?? 70);
  const tirMax = Number(currentSettings?.tir_max ?? 180);
  const inRange = values.filter(v => v >= tirMin && v <= tirMax).length;
  const tirPct = Math.round((inRange / values.length) * 100);
  const totalInsulin = insulin.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const totalCarbs = carbs.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const text = `📊 <b>GliceChart</b>\nRiepilogo giornaliero\nMedia: <b>${avg} mg/dL</b>\nMin: <b>${min}</b> | Max: <b>${max}</b>\nTIR: <b>${tirPct}%</b>\nInsulina: <b>${totalInsulin.toFixed(1)} U</b>\nCarboidrati: <b>${totalCarbs} g</b>`;
  await sendTelegramMessage(text);
}

module.exports = {
  formatTelegramTime,
  sendTelegramMessage,
  sendTelegramInsulinConfirmation,
  sendTelegramCarbConfirmation,
  sendTelegramHighLowAlert,
  sendDailySummary
};
