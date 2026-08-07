// server.js
const path    = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.backend.env') });

const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
const axios   = require('axios');

const { 
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
  getDietFoods,
  insertDietFood,
  insertSensor,
  getSensors,
  endSensor,
  deleteSensor,
  insertNote,
  deleteNote,
  updateNote,
  getNotesByMinutes,
  getNotesByDate,
  getSettings,
  updateSettings
} = require('./db');
const { fetchLatestReadings } = require('./gluroo');

const app  = express();
const PORT = process.env.PORT || 3001;
const POLL = parseInt(process.env.POLL_INTERVAL_MINUTES || '5', 10);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

let lastTelegramHighLowState = null;
let lastTelegramPredictionState = null;
let lastDailySummaryDate = null;

// ── Middleware ────────────────────────────────────────────────────────────────

// CORS aperto: necessario perché Cloudflare Tunnel può fare richieste cross-origin
app.use(cors());
app.use(express.json());

// ── Serve il frontend buildato ────────────────────────────────────────────────
// Dopo `npm run build` nel frontend, i file finiscono in frontend/dist/
// Node li serve direttamente — niente Nginx necessario
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(FRONTEND_DIST));

// ── API Routes ────────────────────────────────────────────────────────────────

app.get('/api/current', async (req, res) => {
  try {
    const latest = await getLatestReading();
    if (!latest) return res.status(404).json({ error: 'Nessuna lettura disponibile' });
    res.json(latest);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/readings', async (req, res) => {
  const range = parseInt(req.query.range, 10) || 180;
  const maxRange = 129600; // 90 giorni
  if (!Number.isFinite(range) || range < 60 || range > maxRange) {
    return res.status(400).json({ error: 'Range non valido' });
  }
  try {
    const rows = await getReadingsByMinutes(range);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/insulin', async (req, res) => {
  const range = parseInt(req.query.range, 10) || 180;
  try {
    const rows = await getInsulinByMinutes(range);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/insulin', async (req, res) => {
  const { timestamp, type, units } = req.body;
  if (!timestamp || !type || !units) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  try {
    const id = await insertInsulin({ timestamp, type, units });
    await sendTelegramInsulinConfirmation({ timestamp, type, units });
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/insulin/:id', async (req, res) => {
  try {
    const ok = await deleteInsulin(req.params.id);
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/insulin/:id', async (req, res) => {
  const { timestamp, type, units } = req.body;
  if (!timestamp || !type || !units) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  try {
    const ok = await updateInsulin(req.params.id, { timestamp, type, units });
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    await syncReadings();
    const latest = await getLatestReading();
    res.json({ ok: true, latest });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/history/readings', async (req, res) => {
  const date = req.query.date; // YYYY-MM-DD
  if (!date) return res.status(400).json({ error: 'Data mancante' });
  try {
    const rows = await getReadingsByDate(date);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/history/insulin', async (req, res) => {
  const date = req.query.date; // YYYY-MM-DD
  if (!date) return res.status(400).json({ error: 'Data mancante' });
  try {
    const rows = await getInsulinByDate(date);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/history/insulin-overlap', async (req, res) => {
  const date = req.query.date; // YYYY-MM-DD
  if (!date) return res.status(400).json({ error: 'Data mancante' });
  try {
    const rows = await getInsulinOverlappingDate(date);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Carboidrati (CHO) ────────────────────────────────────────────────────────

app.get('/api/carbs', async (req, res) => {
  const range = parseInt(req.query.range, 10) || 180;
  try {
    const rows = await getCarbsByMinutes(range);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/carbs', async (req, res) => {
  const { timestamp, amount } = req.body;
  if (!timestamp || !amount) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  try {
    const id = await insertCarb({ timestamp, amount });
    await sendTelegramCarbConfirmation({ timestamp, amount });
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/carbs/:id', async (req, res) => {
  try {
    const ok = await deleteCarb(req.params.id);
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/carbs/:id', async (req, res) => {
  const { timestamp, amount } = req.body;
  if (!timestamp || !amount) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  try {
    const ok = await updateCarb(req.params.id, { timestamp, amount });
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/history/carbs', async (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: 'Data mancante' });
  try {
    const rows = await getCarbsByDate(date);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/notes', async (req, res) => {
  const range = parseInt(req.query.range, 10) || 180;
  const maxRange = 129600;
  if (!Number.isFinite(range) || range < 60 || range > maxRange) {
    return res.status(400).json({ error: 'Range non valido' });
  }
  try {
    const rows = await getNotesByMinutes(range);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/notes', async (req, res) => {
  const { timestamp, text } = req.body || {};
  const finalText = String(text || '').trim();
  if (!finalText) return res.status(400).json({ error: 'Testo mancante' });
  if (finalText.length > 200) return res.status(400).json({ error: 'Testo troppo lungo' });
  const ts = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(ts.getTime())) return res.status(400).json({ error: 'Timestamp non valido' });
  try {
    const id = await insertNote({ timestamp: ts.toISOString(), text: finalText });
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { timestamp, text } = req.body || {};
  const finalText = String(text || '').trim();
  if (!finalText) return res.status(400).json({ error: 'Testo mancante' });
  if (finalText.length > 200) return res.status(400).json({ error: 'Testo troppo lungo' });
  const ts = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(ts.getTime())) return res.status(400).json({ error: 'Timestamp non valido' });
  try {
    const ok = await updateNote(req.params.id, { timestamp: ts.toISOString(), text: finalText });
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const ok = await deleteNote(req.params.id);
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/history/notes', async (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: 'Data mancante' });
  try {
    const rows = await getNotesByDate(date);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/diet/foods', async (req, res) => {
  try {
    const rows = await getDietFoods();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/diet/foods', async (req, res) => {
  const { name, carbs_per_100g, category } = req.body || {};
  const finalName = String(name || '').trim();
  const carbs = Number(carbs_per_100g);
  const finalCat = String(category || 'contorni').trim().toLowerCase();

  const validCats = ['primi', 'secondi', 'contorni', 'frutta', 'latticini', 'bevande', 'prodotti_da_forno'];
  if (!validCats.includes(finalCat)) return res.status(400).json({ error: 'Categoria non valida' });

  if (!finalName) return res.status(400).json({ error: 'Nome mancante' });
  if (!Number.isFinite(carbs)) return res.status(400).json({ error: 'CHO non valido' });
  if (carbs < 0 || carbs > 100) return res.status(400).json({ error: 'CHO fuori range' });

  try {
    const id = await insertDietFood({ 
      name: finalName, 
      carbs_per_100g: Math.round(carbs),
      category: finalCat
    });
    res.json({ ok: true, id });
  } catch (e) {
    if (String(e.message || '').includes('uq_name')) {
      return res.status(409).json({ error: 'Nome già esistente' });
    }
    res.status(500).json({ error: e.message });
  }
});

// ── Sensori ────────────────────────────────────────────────────────────────

app.get('/api/sensors', async (req, res) => {
  try {
    const rows = await getSensors();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/sensors', async (req, res) => {
  const { serial_number, lot_number, start_date } = req.body || {};
  const finalSerial = String(serial_number || '').trim();
  const finalLot = lot_number ? String(lot_number).trim() : null;
  const finalStartDate = start_date || new Date().toISOString();

  if (!finalSerial) return res.status(400).json({ error: 'Numero seriale mancante' });
  if (Number.isNaN(new Date(finalStartDate).getTime())) return res.status(400).json({ error: 'Data non valida' });

  try {
    const id = await insertSensor({ 
      serial_number: finalSerial, 
      lot_number: finalLot, 
      start_date: finalStartDate 
    });
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/sensors/:id/end', async (req, res) => {
  const { actual_end_date, early_end_note } = req.body || {};
  const finalEndDate = actual_end_date || new Date().toISOString();
  const finalNote = early_end_note ? String(early_end_note).trim() : null;

  if (Number.isNaN(new Date(finalEndDate).getTime())) return res.status(400).json({ error: 'Data non valida' });

  try {
    const ok = await endSensor(req.params.id, { actual_end_date: finalEndDate, early_end_note: finalNote });
    if (!ok) return res.status(404).json({ error: 'Sensore non trovato o già terminato' });
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/sensors/:id', async (req, res) => {
  try {
    const ok = await deleteSensor(req.params.id);
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Impostazioni (Settings) ──────────────────────────────────────────────────

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/settings', async (req, res) => {
  const { tir_min, tir_max, red_under, red_over, rapid_duration, slow_duration, carb_duration, insulin_sensitivity, carb_ratio, quick_insulin_1, quick_insulin_2, quick_carb_1, quick_carb_2, telegram_enabled, telegram_high_low_alerts, telegram_prediction_alerts, telegram_insulin_alerts, telegram_carb_alerts, telegram_daily_summary, telegram_daily_summary_time } = req.body;
  try {
    const ok = await updateSettings({ tir_min, tir_max, red_under, red_over, rapid_duration, slow_duration, carb_duration, insulin_sensitivity, carb_ratio, quick_insulin_1, quick_insulin_2, quick_carb_1, quick_carb_2, telegram_enabled, telegram_high_low_alerts, telegram_prediction_alerts, telegram_insulin_alerts, telegram_carb_alerts, telegram_daily_summary, telegram_daily_summary_time });
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Telegram webhook / comandi ─────────────────────────────────────────────

app.post('/api/telegram/webhook', async (req, res) => {
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
});

// Tutto il resto → manda il index.html del frontend (routing SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

// ── Telegram helpers ───────────────────────────────────────────────────────

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
    prediction: settings?.telegram_prediction_alerts !== false,
    insulin: Boolean(settings?.telegram_insulin_alerts),
    carbs: Boolean(settings?.telegram_carb_alerts),
    dailySummary: Boolean(settings?.telegram_daily_summary)
  };
}

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

async function sendTelegramPredictionAlert(latest) {
  const settings = await getTelegramSettings();
  if (!settings.enabled || !settings.prediction) return;

  const glucose = Number(latest?.glucose);
  const currentSettings = await getSettings();
  const tirMin = Number(currentSettings?.tir_min ?? 70);
  const tirMax = Number(currentSettings?.tir_max ?? 180);

  const predicted = {
    t15: glucose + 5,
    t30: glucose + 10,
    t60: glucose + 15
  };

  const isHighRisk = predicted.t15 < tirMin || predicted.t30 < tirMin || predicted.t60 < tirMin || predicted.t15 > tirMax || predicted.t30 > tirMax || predicted.t60 > tirMax;
  if (!isHighRisk) {
    lastTelegramPredictionState = 'normal';
    return;
  }

  const state = 'high';
  if (state === lastTelegramPredictionState) return;
  lastTelegramPredictionState = state;

  const text = `⚠️ <b>GliceChart</b>\nRischio previsione glicemica elevato nei prossimi 60 min\nAttuale: <b>${glucose} mg/dL</b>\nValore previsto: <b>${predicted.t30} mg/dL</b>\nConsidera controllo e azione tempestiva.`;
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

// ── Sync function ─────────────────────────────────────────────────────────────

async function syncReadings() {
  try {
    console.log('🔄 Sincronizzazione da Gluroo...');
    const readings = await fetchLatestReadings();
    let nuove = 0;
    for (const r of readings) {
      if (await insertReading(r)) nuove++;
    }
    console.log(`✅ ${nuove} nuove letture (${readings.length} ricevute)`);

    if (readings.length) {
      const latest = await getLatestReading();
      await sendTelegramHighLowAlert(latest);
      await sendTelegramPredictionAlert(latest);
    }
  } catch (e) {
    console.error('❌ Sync fallita:', e.message);
  }
}

// ── Avvio ─────────────────────────────────────────────────────────────────────

async function start() {
  // Connetti al DB prima di tutto
  await getPool();

  app.listen(PORT, () => {
    console.log(`\n🚀 GliceChart in ascolto su http://localhost:${PORT}`);
    console.log(`🌐 Pubblico su: ${process.env.PUBLIC_API_URL || '(non configurato)'}`);
    console.log(`📡 Sync ogni ${POLL} minuti`);
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log('📲 Telegram non attivo: imposta TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID per abilitare le notifiche');
    } else {
      console.log(`📲 Telegram attivo per chat ${TELEGRAM_CHAT_ID}`);
    }
    console.log('');
  });

  // Prima sync immediata
  await syncReadings();

  // Poi periodica
  cron.schedule(`*/${POLL} * * * *`, syncReadings);
  cron.schedule('* * * * *', sendDailySummary);
}

start().catch(err => {
  console.error('Errore avvio:', err);
  process.exit(1);
});
