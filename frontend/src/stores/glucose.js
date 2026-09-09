// stores/glucose.js
//
// Store Pinia per la gestione dei dati glicemici, insulina, carboidrati,
// impostazioni e sicurezza (PIN) dell'applicazione GliceChart.
//
// Le chiamate usano path relativi (/api/...) â€” funziona sia in locale che
// dietro Cloudflare Tunnel perchÃ© il frontend Ã¨ servito dallo stesso Node.js.
//
// Note di design:
// - La logica di dominio (statistiche, IOB/COB, rilevamento pattern,
//   validazione impostazioni) Ã¨ isolata in funzioni pure a livello di modulo,
//   cosÃ¬ puÃ² essere testata senza montare lo store Pinia.
// - Gli stati di "loading" usano un contatore (non un semplice booleano) per
//   restare corretti anche quando piÃ¹ operazioni asincrone sono in corso
//   contemporaneamente.
// - Gli errori vengono sempre loggati in console con contesto, oltre a
//   popolare il messaggio tradotto mostrato all'utente â€” indispensabile per
//   diagnosticare problemi in un'applicazione che gestisce dati sanitari.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { t } from '../i18n'
import {
  DEFAULT_SETTINGS,
  SETTINGS_CONSTRAINTS,
  normalizeBooleanSetting,
  normalizeTelegramFlags,
  assertPositiveNumber,
  assertValidPin,
  validateSettings,
  ValidationError
} from './validation'
import { calculateStats, getStatusColorForValue, calculateIob, calculateCob } from './stats'
import { PATTERN_THRESHOLDS, detectHourlyPatterns, detectNotePatterns, enrichPatterns } from './patterns.js'
import { createLoadingFlag } from './loading'

/**
 * @typedef {Object} GlucoseReading
 * @property {string} timestamp - ISO 8601
 * @property {number} glucose - mg/dL
 */

/**
 * @typedef {Object} InsulinEntry
 * @property {string} timestamp - ISO 8601
 * @property {'rapid'|'slow'} type
 * @property {number} units
 */

/**
 * @typedef {Object} CarbEntry
 * @property {string} timestamp - ISO 8601
 * @property {number} amount - grammi
 */

/**
 * @typedef {Object} AppSettings
 * @property {number} tir_min
 * @property {number} tir_max
 * @property {number} red_under
 * @property {number} red_over
 * @property {number} rapid_duration
 * @property {number} slow_duration
 * @property {number} carb_duration
 * @property {number} insulin_sensitivity
 * @property {number} carb_ratio
 * @property {number} quick_insulin_1
 * @property {number} quick_insulin_2
 * @property {number} quick_carb_1
 * @property {number} quick_carb_2
 * @property {boolean} telegram_enabled
 * @property {boolean} telegram_high_low_alerts
 * @property {boolean} telegram_insulin_alerts
 * @property {boolean} telegram_carb_alerts
 * @property {boolean} telegram_daily_summary
 * @property {string} telegram_daily_summary_time - formato HH:mm
 */

// â”€â”€ Costanti temporali â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

// â”€â”€ Costanti applicative â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DEFAULT_RANGE_MINUTES = 180
const FULL_DAY_RANGE_MINUTES = 1440
const FULL_HISTORY_RANGE_MINUTES = 4320

const PIN_MIN_LENGTH = 4
const PIN_MAX_LENGTH = 6

const VALID_INSULIN_TYPES = Object.freeze(['rapid', 'slow'])
const AVAILABLE_THEMES = Object.freeze(['light', 'dark', 'retro', 'forest', 'wireframe', 'coffee'])


// Limiti fisiologici plausibili usati per rifiutare impostazioni palesemente
// errate prima di inviarle al backend. Non sostituiscono un controllo medico,
// servono solo a evitare configurazioni assurde (es. soglie invertite).

// Soglie usate dal motore di rilevamento pattern. Raccolte in un unico posto
// cosÃ¬ sono documentate e regolabili senza toccare la logica.

/** Errore applicativo per input non validi, distinto dagli errori di rete/API. */

// â”€â”€ Helper puri: normalizzazione e validazione â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€





/**
 * Valida un oggetto impostazioni contro limiti fisiologici plausibili e
 * coerenza interna (es. soglia rossa sotto la soglia minima target).
 * @param {Partial<AppSettings>} candidate
 * @returns {string[]} elenco di codici di errore, vuoto se tutto valido
 */

// â”€â”€ Helper puri: statistiche e colori di stato â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * @param {GlucoseReading[]} data
 * @param {AppSettings} settings
 * @returns {{avg: number, min: number, max: number, tir: number} | null}
 */


// â”€â”€ Helper puri: IOB / COB (decadimento lineare) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€



// â”€â”€ Helper puri: rilevamento pattern â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€



/**
 * Rileva tendenze glicemiche ricorrenti per fascia oraria (bucket da 2 ore).
 * Il numero minimo di campioni richiesti scala con i giorni di storico
 * disponibili, e i campioni piÃ¹ recenti pesano di piÃ¹ nel calcolo della
 * pendenza media â€” un pattern che non si ripete piÃ¹ da settimane perde
 * progressivamente rilevanza invece di restare fisso.
 * @param {GlucoseReading[]} readings - ordinate cronologicamente, crescenti
 * @param {typeof PATTERN_THRESHOLDS} thresholds
 */

/**
 * Rileva correlazioni tra note testuali ricorrenti e l'andamento glicemico
 * nelle ore successive. A differenza di una versione precedente, salita e
 * discesa vengono tracciate separatamente: un evento che causa sia un picco
 * sia un calo genera due insight distinti invece di annullarsi in un'unica
 * media netta vicina allo zero.
 * @param {GlucoseReading[]} readings
 * @param {{timestamp: string, text: string}[]} notes
 * @param {typeof PATTERN_THRESHOLDS} thresholds
 */

// â”€â”€ Helper: stato di caricamento sicuro in concorrenza â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Crea un flag di "loading" basato su un contatore invece che su un booleano
 * semplice. Con un booleano, due operazioni asincrone in corso contemporanea-
 * mente possono "spegnere" lo stato di caricamento quando la prima finisce,
 * anche se la seconda Ã¨ ancora in volo. Il contatore evita questo problema.
 */

// â”€â”€ Interceptor axios (registrati una sola volta per l'intera app) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let axiosInterceptorsRegistered = false

function registerAxiosInterceptors(onUnauthorized) {
  if (axiosInterceptorsRegistered) return
  axiosInterceptorsRegistered = true

  axios.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('glicechart_unlock_token')
    if (token) {
      config.headers['X-Unlock-Token'] = token
    }
    return config
  })

  axios.interceptors.response.use(
    (response) => response,
    (err) => {
      if (err?.response?.status === 401) {
        onUnauthorized()
      }
      return Promise.reject(err)
    }
  )
}

// â”€â”€ Store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const useGlucoseStore = defineStore('glucose', () => {
  // Stato: dati correnti
  const current = ref(null)
  const readings = ref([])
  const allInsulin = ref([]) // Dati completi (24h) per IOB
  const allCarbs = ref([]) // Dati completi (24h) per COB
  const notes = ref([])
  const sensors = ref([])
  const selectedRange = ref(DEFAULT_RANGE_MINUTES)
  const carbDraftAmount = ref(0)
  const error = ref(null)
  const lastUpdated = ref(null)

  // Stato: impostazioni
  const settings = ref({ ...DEFAULT_SETTINGS })

  // Stato: dati storici (Calendario / Pattern Smart)
  const historyReadings = ref([])
  const historyInsulin = ref([])
  const historyChartInsulin = ref([])
  const historyCarbs = ref([])
  const historyNotes = ref([])

  // Stato: tema
  const theme = ref(localStorage.getItem('theme') || 'dark')

  // Stati di caricamento, isolati per area funzionale e sicuri in concorrenza
  const loadingState = createLoadingFlag()
  const chartLoadingState = createLoadingFlag()
  const historyLoadingState = createLoadingFlag()
  const loading = loadingState.isActive
  const chartLoading = chartLoadingState.isActive
  const historyLoading = historyLoadingState.isActive

  /**
   * Gestisce una sessione scaduta o non autorizzata (risposta HTTP 401):
   * richiede nuovamente il PIN invece di mostrare un errore generico.
   */
  function handleSessionExpired() {
    sessionStorage.removeItem('glicechart_unlocked')
    sessionStorage.removeItem('glicechart_unlock_token')
    error.value = t('errors.sessionExpired')
  }

  /**
   * Punto unico di gestione errori: logga sempre il dettaglio tecnico in
   * console (fondamentale per il supporto in un'app sanitaria) e imposta un
   * messaggio tradotto e sicuro da mostrare all'utente.
   */
  function reportError(err, fallbackTranslationKey) {
    console.error(`[glucose store] ${fallbackTranslationKey}:`, err)

    if (err instanceof ValidationError) {
      error.value = err.message
      return
    }

    if (err?.response?.status === 401) {
      handleSessionExpired()
      return
    }

    error.value = t(fallbackTranslationKey)
  }

  registerAxiosInterceptors(handleSessionExpired)

  // Record filtrati per il range selezionato (UI)
  const insulinRecords = computed(() => {
    const now = Date.now()
    const rangeMs = selectedRange.value * MS_PER_MINUTE
    return allInsulin.value.filter((ins) => now - new Date(ins.timestamp).getTime() <= rangeMs)
  })

  const carbRecords = computed(() => {
    const now = Date.now()
    const rangeMs = selectedRange.value * MS_PER_MINUTE
    return allCarbs.value.filter((c) => now - new Date(c.timestamp).getTime() <= rangeMs)
  })

  // Statistiche correnti (Homepage) e storiche (Calendario)
  const stats = computed(() => calculateStats(readings.value, settings.value))
  const historyStats = computed(() => calculateStats(historyReadings.value, settings.value))

  // IOB / COB
  const iob = computed(() => calculateIob(allInsulin.value, settings.value.rapid_duration))
  const cob = computed(() => calculateCob(allCarbs.value, settings.value.carb_duration))

  // Pattern Smart: ordinati per punteggio (confidenza Ã— intensitÃ ), non solo
  // per ora del giorno, cosÃ¬ un pattern ad alto impatto emerge per primo
  // anche con confidenza leggermente inferiore a uno innocuo.
  const patterns = computed(() => {
    const hourlyPatterns = detectHourlyPatterns(historyReadings.value)
    const noteCorrelationPatterns = detectNotePatterns(historyReadings.value, historyNotes.value)
    const merged = [...hourlyPatterns, ...noteCorrelationPatterns].sort((a, b) => b.score - a.score)
    return enrichPatterns(merged, historyReadings.value, historyNotes.value)
  })

  const glucoseColor = computed(() => {
    if (!current.value) return 'text-base-content'
    return getStatusColorForValue(current.value.glucose, settings.value)
  })

  const minutesAgo = computed(() => {
    if (!current.value) return null
    return Math.floor((Date.now() - new Date(current.value.timestamp).getTime()) / MS_PER_MINUTE)
  })

  function getStatusColor(value) {
    return getStatusColorForValue(value, settings.value)
  }

  // â”€â”€ Lettura corrente e serie temporali â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function fetchCurrent() {
    try {
      const { data } = await axios.get('/api/current')
      current.value = data
      error.value = null
    } catch (err) {
      reportError(err, 'errors.reachBackend')
    }
  }

  async function fetchReadings() {
    return chartLoadingState.run(async () => {
      try {
        const [
          { data: readingsData },
          { data: insulinData },
          { data: carbsData },
          { data: notesData }
        ] = await Promise.all([
          axios.get('/api/readings', { params: { range: selectedRange.value } }),
          axios.get('/api/insulin', { params: { range: FULL_DAY_RANGE_MINUTES } }),
          axios.get('/api/carbs', { params: { range: FULL_DAY_RANGE_MINUTES } }),
          axios.get('/api/notes', { params: { range: selectedRange.value } })
        ])
        readings.value = readingsData
        allInsulin.value = insulinData
        allCarbs.value = carbsData
        notes.value = notesData
        lastUpdated.value = new Date()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.loadData')
      }
    })
  }

  async function fetchAll() {
    return loadingState.run(async () => {
      await Promise.all([fetchCurrent(), fetchReadings(), fetchSettings()])
    })
  }

  async function setRange(minutes) {
    selectedRange.value = minutes
    await fetchReadings()
  }

  async function syncNow() {
    return loadingState.run(async () => {
      try {
        await axios.post('/api/sync')
        await fetchAll()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.sync')
      }
    })
  }

  // â”€â”€ Note (CRUD) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function addNote(text, timestamp = null) {
    return loadingState.run(async () => {
      try {
        const trimmedText = (text ?? '').trim()
        if (!trimmedText) {
          throw new ValidationError(t('errors.emptyNote'))
        }
        await axios.post('/api/notes', {
          timestamp: timestamp || new Date().toISOString(),
          text: trimmedText
        })
        await fetchReadings()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.addNote')
      }
    })
  }

  async function removeNote(id) {
    return loadingState.run(async () => {
      try {
        await axios.delete(`/api/notes/${id}`)
        await fetchReadings()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.removeNote')
      }
    })
  }

  async function editNote(id, { timestamp, text }) {
    return loadingState.run(async () => {
      try {
        const trimmedText = (text ?? '').trim()
        if (!trimmedText) {
          throw new ValidationError(t('errors.emptyNote'))
        }
        await axios.put(`/api/notes/${id}`, { timestamp, text: trimmedText })
        await fetchReadings()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.editNote')
      }
    })
  }

  // â”€â”€ Carboidrati (CHO) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function addCarb(amount, timestamp = null) {
    return loadingState.run(async () => {
      try {
        const validAmount = assertPositiveNumber(amount, 'carb amount')
        await axios.post('/api/carbs', {
          timestamp: timestamp || new Date().toISOString(),
          amount: validAmount
        })
        await fetchReadings()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.addCarb')
      }
    })
  }

  async function removeCarb(id) {
    return loadingState.run(async () => {
      try {
        await axios.delete(`/api/carbs/${id}`)
        await fetchReadings()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.removeCarb')
      }
    })
  }

  async function editCarb(id, { timestamp, amount }) {
    return loadingState.run(async () => {
      try {
        const validAmount = assertPositiveNumber(amount, 'carb amount')
        await axios.put(`/api/carbs/${id}`, { timestamp, amount: validAmount })
        await fetchReadings()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.editCarb')
      }
    })
  }

  // â”€â”€ Insulina â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function addInsulin(type, units, timestamp = null) {
    return loadingState.run(async () => {
      try {
        const validUnits = assertPositiveNumber(units, 'insulin units')
        if (!VALID_INSULIN_TYPES.includes(type)) {
          throw new ValidationError(`Invalid insulin type: ${type}`)
        }
        await axios.post('/api/insulin', {
          timestamp: timestamp || new Date().toISOString(),
          type,
          units: validUnits
        })
        await fetchReadings()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.addInsulin')
      }
    })
  }

  async function removeInsulin(id) {
    return loadingState.run(async () => {
      try {
        await axios.delete(`/api/insulin/${id}`)
        await fetchReadings()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.removeInsulin')
      }
    })
  }

  async function editInsulin(id, { timestamp, type, units }) {
    return loadingState.run(async () => {
      try {
        const validUnits = assertPositiveNumber(units, 'insulin units')
        if (!VALID_INSULIN_TYPES.includes(type)) {
          throw new ValidationError(`Invalid insulin type: ${type}`)
        }
        await axios.put(`/api/insulin/${id}`, { timestamp, type, units: validUnits })
        await fetchReadings()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.editInsulin')
      }
    })
  }

  // â”€â”€ Impostazioni â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function fetchSettings() {
    try {
      const { data } = await axios.get('/api/settings')
      if (data) {
        settings.value = {
          ...DEFAULT_SETTINGS,
          ...data,
          ...normalizeTelegramFlags(data)
        }
      }
      error.value = null
    } catch (err) {
      reportError(err, 'errors.loadSettings')
    }
  }

  /**
   * Applica le impostazioni ricevute solo dopo averle validate contro limiti
   * fisiologici plausibili. Ritorna true/false per permettere al chiamante
   * di distinguere un salvataggio riuscito da uno rifiutato.
   */
  async function updateSettings(newSettings) {
    const validationIssues = validateSettings(newSettings)
    if (validationIssues.length > 0) {
      console.error('[glucose store] Rejected invalid settings payload:', validationIssues)
      error.value = t('errors.invalidSettings')
      return false
    }

    return loadingState.run(async () => {
      try {
        await axios.put('/api/settings', newSettings)
        settings.value = {
          ...DEFAULT_SETTINGS,
          ...newSettings,
          ...normalizeTelegramFlags(newSettings)
        }
        error.value = null
        return true
      } catch (err) {
        reportError(err, 'errors.saveSettings')
        return false
      }
    })
  }

  async function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    return updateSettings(settings.value)
  }

  // â”€â”€ Tema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function setTheme(nextTheme) {
    theme.value = nextTheme
    localStorage.setItem('theme', nextTheme)
    try {
      document.documentElement.setAttribute('data-theme', nextTheme)
    } catch (err) {
      console.error('[glucose store] Unable to apply theme to document:', err)
    }
  }

  try {
    document.documentElement.setAttribute('data-theme', theme.value)
  } catch (err) {
    console.error('[glucose store] Unable to apply initial theme:', err)
  }

  // â”€â”€ Sensori â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function fetchSensors() {
    try {
      const { data } = await axios.get('/api/sensors')
      sensors.value = data
      error.value = null
    } catch (err) {
      reportError(err, 'errors.loadSensors')
    }
  }

  async function addSensor(serialNumber, lotNumber, startDate) {
    return loadingState.run(async () => {
      try {
        await axios.post('/api/sensors', {
          serial_number: serialNumber,
          lot_number: lotNumber,
          start_date: startDate || new Date().toISOString()
        })
        await fetchSensors()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.addSensor')
      }
    })
  }

  async function endSensor(id, actualEndDate, earlyEndNote) {
    return loadingState.run(async () => {
      try {
        await axios.put(`/api/sensors/${id}/end`, {
          actual_end_date: actualEndDate || new Date().toISOString(),
          early_end_note: earlyEndNote
        })
        await fetchSensors()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.endSensor')
      }
    })
  }

  async function deleteSensor(id) {
    return loadingState.run(async () => {
      try {
        await axios.delete(`/api/sensors/${id}`)
        await fetchSensors()
        error.value = null
      } catch (err) {
        reportError(err, 'errors.deleteSensor')
      }
    })
  }

  // â”€â”€ Storico (Calendario / Analisi) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function fetchLongHistory(minutes = FULL_HISTORY_RANGE_MINUTES) {
    return historyLoadingState.run(async () => {
      try {
        const [
          { data: readingsData },
          { data: insulinData },
          { data: carbsData },
          { data: notesData }
        ] = await Promise.all([
          axios.get('/api/readings', { params: { range: minutes } }),
          axios.get('/api/insulin', { params: { range: minutes } }),
          axios.get('/api/carbs', { params: { range: minutes } }),
          axios.get('/api/notes', { params: { range: minutes } })
        ])
        historyReadings.value = readingsData
        historyInsulin.value = insulinData
        historyChartInsulin.value = insulinData
        historyCarbs.value = carbsData
        historyNotes.value = notesData
        error.value = null
      } catch (err) {
        reportError(err, 'errors.loadAnalysis')
      }
    })
  }

  async function fetchHistory(date) {
    return historyLoadingState.run(async () => {
      try {
        const [
          { data: readingsData },
          { data: insulinData },
          { data: insulinOverlapData },
          { data: carbsData },
          { data: notesData }
        ] = await Promise.all([
          axios.get('/api/history/readings', { params: { date } }),
          axios.get('/api/history/insulin', { params: { date } }),
          axios.get('/api/history/insulin-overlap', { params: { date } }),
          axios.get('/api/history/carbs', { params: { date } }),
          axios.get('/api/history/notes', { params: { date } })
        ])
        historyReadings.value = readingsData
        historyInsulin.value = insulinData
        historyChartInsulin.value = insulinOverlapData
        historyCarbs.value = carbsData
        historyNotes.value = notesData
        error.value = null
      } catch (err) {
        reportError(err, 'errors.loadHistory')
      }
    })
  }

  return {
    current, readings, insulinRecords, carbRecords, notes, sensors, selectedRange, carbDraftAmount,
    loading, chartLoading, error, lastUpdated,
    settings,
    historyReadings, historyInsulin, historyChartInsulin, historyCarbs, historyNotes, historyLoading,
    glucoseColor, minutesAgo, stats, historyStats, iob, cob, patterns,
    fetchCurrent, fetchReadings, fetchAll, setRange, syncNow,
    addInsulin, removeInsulin, editInsulin,
    addCarb, removeCarb, editCarb,
    addNote, removeNote, editNote,
    fetchSensors, addSensor, endSensor, deleteSensor,
    fetchHistory, fetchLongHistory, fetchSettings, updateSettings, resetSettings, getStatusColor,
    themes: AVAILABLE_THEMES, theme, setTheme
  }
})
