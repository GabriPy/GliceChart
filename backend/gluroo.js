// gluroo.js - Chiamate alle API Gluroo
const axios = require('axios');

const BASE_URL = process.env.GLUROO_BASE_URL || 'https://aaa1.ns.gluroo.com';

function normalizeTrend(raw) {
  if (raw === undefined || raw === null) return 'FLAT';
  
  // Se è un numero (comune nelle API Nightscout/Gluroo)
  if (typeof raw === 'number') {
    const numMap = {
      1: 'RISING_FAST',  // DoubleUp
      2: 'RISING',       // SingleUp
      3: 'RISING_SLOW',  // FortyFiveUp
      4: 'FLAT',         // Flat
      5: 'FALLING_SLOW', // FortyFiveDown
      6: 'FALLING',      // SingleDown
      7: 'FALLING_FAST', // DoubleDown
    };
    return numMap[raw] || 'FLAT';
  }

  // Se è una stringa, la normalizziamo
  const t = String(raw).toUpperCase().replace(/[\s_]/g, '');
  const strMap = {
    'DOUBLEUP':        'RISING_FAST',
    'SINGLEUP':        'RISING',
    'FORTYFIVEUP':     'RISING_SLOW',
    'FLAT':            'FLAT',
    'FORTYFIVEDOWN':   'FALLING_SLOW',
    'SINGLEDOWN':      'FALLING',
    'DOUBLEDOWN':      'FALLING_FAST',
    'UP':              'RISING',
    'DOWN':            'FALLING',
    'NONE':            'FLAT',
    'NOTCOMPUTABLE':   'FLAT',
  };
  return strMap[t] || 'FLAT';
}

async function fetchLatestReadings() {
  const token  = process.env.GLUROO_API_SECRET_TOKEN;
  const secret = process.env.GLUROO_API_SECRET_HEADER;

  if (!token || !secret) throw new Error('Credenziali Gluroo mancanti nel file di configurazione del backend');

  const { data } = await axios.get(`${BASE_URL}/api/v1/entries/sgv.json`, {
    params:  { count: 288 },
    headers: {
      'api-secret':    secret,
      'Authorization': `Bearer ${token}`,
      'Accept':        'application/json',
    },
    timeout: 10000,
  });

  if (!Array.isArray(data)) throw new Error('Risposta API non valida');

  return data.map(e => {
    const rawTrend = e.trend !== undefined ? e.trend : e.direction;
    return {
      timestamp: e.dateString
        ? new Date(e.dateString).toISOString()
        : new Date(e.date).toISOString(),
      glucose:   Math.round(e.sgv || e.glucose || 0),
      trend:     normalizeTrend(rawTrend),
      raw_trend: String(rawTrend !== undefined ? rawTrend : ''),
    };
  });
}

module.exports = { fetchLatestReadings };
