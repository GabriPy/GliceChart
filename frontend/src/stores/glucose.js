// stores/glucose.js
//
// Store Pinia per la gestione dei dati glicemici, insulina, carboidrati,
// impostazioni e sicurezza (PIN) dell'applicazione GliceChart.
//
// Le chiamate usano path relativi (/api/...) — funziona sia in locale che
// dietro Cloudflare Tunnel perché il frontend è servito dallo stesso Node.js.
//
// Note di design:
// - La logica di dominio (statistiche, IOB/COB, rilevamento pattern,
//   validazione impostazioni) è isolata in funzioni pure a livello di modulo,
//   così può essere testata senza montare lo store Pinia.
// - Gli stati di "loading" usano un contatore (non un semplice booleano) per
//   restare corretti anche quando più operazioni asincrone sono in corso
//   contemporaneamente.
// - Gli errori vengono sempre loggati in console con contesto, oltre a
//   popolare il messaggio tradotto mostrato all'utente — indispensabile per
//   diagnosticare problemi in un'applicazione che gestisce dati sanitari.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { t } from '../i18n'

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

// ── Costanti temporali ───────────────────────────────────────────────────────
const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

// ── Costanti applicative ──────────────────────────────────────────────────────
const DEFAULT_RANGE_MINUTES = 180
const FULL_DAY_RANGE_MINUTES = 1440
const FULL_HISTORY_RANGE_MINUTES = 4320

const PIN_MIN_LENGTH = 4
const PIN_MAX_LENGTH = 6

const VALID_INSULIN_TYPES = Object.freeze(['rapid', 'slow'])
const AVAILABLE_THEMES = Object.freeze(['light', 'dark', 'retro', 'forest', 'wireframe', 'coffee'])

const DEFAULT_SETTINGS = Object.freeze({
  tir_min: 70,
  tir_max: 180,
  red_under: 55,
  red_over: 250,
  rapid_duration: 3,
  slow_duration: 24,
  carb_duration: 4,
  insulin_sensitivity: 60,
  carb_ratio: 15,
  quick_insulin_1: 1,
  quick_insulin_2: 2,
  quick_carb_1: 10,
  quick_carb_2: 20,
  telegram_enabled: false,
  telegram_high_low_alerts: true,
  telegram_insulin_alerts: false,
  telegram_carb_alerts: false,
  telegram_daily_summary: false,
  telegram_daily_summary_time: '21:00'
})

// Limiti fisiologici plausibili usati per rifiutare impostazioni palesemente
// errate prima di inviarle al backend. Non sostituiscono un controllo medico,
// servono solo a evitare configurazioni assurde (es. soglie invertite).
const SETTINGS_CONSTRAINTS = Object.freeze({
  tir_min: { min: 40, max: 300 },
  tir_max: { min: 40, max: 300 },
  red_under: { min: 20, max: 100 },
  red_over: { min: 150, max: 400 },
  rapid_duration: { min: 1, max: 12 },
  slow_duration: { min: 1, max: 48 },
  carb_duration: { min: 1, max: 12 },
  insulin_sensitivity: { min: 1, max: 500 },
  carb_ratio: { min: 1, max: 100 },
  quick_insulin_1: { min: 0.5, max: 20 },
  quick_insulin_2: { min: 0.5, max: 20 },
  quick_carb_1: { min: 1, max: 200 },
  quick_carb_2: { min: 1, max: 200 }
})

// Soglie usate dal motore di rilevamento pattern. Raccolte in un unico posto
// così sono documentate e regolabili senza toccare la logica.
const PATTERN_THRESHOLDS = Object.freeze({
  minReadingsForAnalysis: 288, // circa 1 giorno di letture ogni 5 minuti
  maxSampleGapMinutes: 15,
  minSlopeMgDlPerMinute: 0.45,
  minConsistencyRatio: 0.65,
  minAbsoluteSamples: 10,
  minSamplesRatioOfDaysObserved: 0.3,
  recencyHalfLifeDays: 30,
  minNoteOccurrences: 4,
  minNoteImpactMgDl: 20,
  postEventWindowHours: 3
})

/** Errore applicativo per input non validi, distinto dagli errori di rete/API. */
class ValidationError extends Error { }

// ── Helper puri: normalizzazione e validazione ────────────────────────────────

function normalizeBooleanSetting(value, fallback = false) {
  if (value === null || value === undefined) return fallback
  if (value === true || value === 1 || value === '1' || value === 'true') return true
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return Boolean(value)
}

function normalizeTelegramFlags(raw) {
  return {
    telegram_enabled: normalizeBooleanSetting(raw.telegram_enabled, false),
    telegram_high_low_alerts: normalizeBooleanSetting(raw.telegram_high_low_alerts, true),
    telegram_insulin_alerts: normalizeBooleanSetting(raw.telegram_insulin_alerts, false),
    telegram_carb_alerts: normalizeBooleanSetting(raw.telegram_carb_alerts, false),
    telegram_daily_summary: normalizeBooleanSetting(raw.telegram_daily_summary, false),
    telegram_daily_summary_time: raw.telegram_daily_summary_time || '21:00'
  }
}

function assertPositiveNumber(value, fieldLabel) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new ValidationError(`Invalid ${fieldLabel}: expected a positive number, received "${value}"`)
  }
  return numericValue
}

function assertValidPin(pin) {
  if (typeof pin !== 'string' || !/^\d+$/.test(pin)) {
    throw new ValidationError('PIN must contain only digits')
  }
  if (pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) {
    throw new ValidationError(`PIN must be between ${PIN_MIN_LENGTH} and ${PIN_MAX_LENGTH} digits`)
  }
}

/**
 * Valida un oggetto impostazioni contro limiti fisiologici plausibili e
 * coerenza interna (es. soglia rossa sotto la soglia minima target).
 * @param {Partial<AppSettings>} candidate
 * @returns {string[]} elenco di codici di errore, vuoto se tutto valido
 */
function validateSettings(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return ['settings_payload_missing']
  }

  const issues = []

  for (const [field, range] of Object.entries(SETTINGS_CONSTRAINTS)) {
    const value = Number(candidate[field])
    if (!Number.isFinite(value) || value < range.min || value > range.max) {
      issues.push(field)
    }
  }

  const tirMin = Number(candidate.tir_min)
  const tirMax = Number(candidate.tir_max)
  const redUnder = Number(candidate.red_under)
  const redOver = Number(candidate.red_over)

  if (Number.isFinite(tirMin) && Number.isFinite(tirMax) && tirMin >= tirMax) {
    issues.push('tir_min_must_be_below_tir_max')
  }
  if (Number.isFinite(redUnder) && Number.isFinite(tirMin) && redUnder >= tirMin) {
    issues.push('red_under_must_be_below_tir_min')
  }
  if (Number.isFinite(redOver) && Number.isFinite(tirMax) && redOver <= tirMax) {
    issues.push('red_over_must_be_above_tir_max')
  }

  return issues
}

// ── Helper puri: statistiche e colori di stato ────────────────────────────────

/**
 * @param {GlucoseReading[]} data
 * @param {AppSettings} settings
 * @returns {{avg: number, min: number, max: number, tir: number} | null}
 */
function calculateStats(data, settings) {
  if (!data || data.length === 0) return null

  const values = data.map((r) => r.glucose)
  const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
  const min = Math.min(...values)
  const max = Math.max(...values)

  const inRangeCount = data.filter(
    (r) => r.glucose >= settings.tir_min && r.glucose <= settings.tir_max
  ).length
  const tir = Math.round((inRangeCount / data.length) * 100)

  return { avg, min, max, tir }
}

function getStatusColorForValue(value, settings) {
  if (value === null || value === undefined) return 'text-base-content'

  const glucose = Number(value)
  const min = Number(settings.tir_min)
  const max = Number(settings.tir_max)
  const redUnder = Number(settings.red_under)
  const redOver = Number(settings.red_over)

  if (glucose <= redUnder || glucose >= redOver) return 'text-error'
  if (glucose < min || glucose > max) return 'text-warning'
  return 'text-success'
}

// ── Helper puri: IOB / COB (decadimento lineare) ──────────────────────────────

function calculateIob(insulinEntries, rapidDurationHours) {
  const now = Date.now()
  const durationMs = (Number(rapidDurationHours) || 3) * MS_PER_HOUR

  return insulinEntries.reduce((total, entry) => {
    if (entry.type !== 'rapid') return total // Solo la rapida contribuisce all'IOB standard

    const elapsedMs = now - new Date(entry.timestamp).getTime()
    if (elapsedMs < 0 || elapsedMs >= durationMs) return total

    const remainingFraction = 1 - elapsedMs / durationMs
    return total + Number(entry.units) * remainingFraction
  }, 0)
}

function calculateCob(carbEntries, carbDurationHours) {
  const now = Date.now()
  const durationMs = (Number(carbDurationHours) || 4) * MS_PER_HOUR

  return carbEntries.reduce((total, entry) => {
    const elapsedMs = now - new Date(entry.timestamp).getTime()
    if (elapsedMs < 0 || elapsedMs >= durationMs) return total

    const remainingFraction = 1 - elapsedMs / durationMs
    return total + Number(entry.amount) * remainingFraction
  }, 0)
}

// ── Helper puri: rilevamento pattern ──────────────────────────────────────────

function daysBetween(startMs, endMs) {
  return (endMs - startMs) / MS_PER_DAY
}

function computeRecencyWeight(timestampMs, halfLifeDays) {
  const ageDays = daysBetween(timestampMs, Date.now())
  return Math.pow(0.5, ageDays / halfLifeDays)
}

/**
 * Rileva tendenze glicemiche ricorrenti per fascia oraria (bucket da 2 ore).
 * Il numero minimo di campioni richiesti scala con i giorni di storico
 * disponibili, e i campioni più recenti pesano di più nel calcolo della
 * pendenza media — un pattern che non si ripete più da settimane perde
 * progressivamente rilevanza invece di restare fisso.
 * @param {GlucoseReading[]} readings - ordinate cronologicamente, crescenti
 * @param {typeof PATTERN_THRESHOLDS} thresholds
 */
function detectHourlyPatterns(readings, thresholds = PATTERN_THRESHOLDS) {
  if (!readings || readings.length < thresholds.minReadingsForAnalysis) return []

  const buckets = Array.from({ length: 12 }, () => ({ slopes: [], samples: [] }))

  for (let i = 1; i < readings.length; i++) {
    const previous = readings[i - 1]
    const current = readings[i]
    const currentDate = new Date(current.timestamp)
    const previousDate = new Date(previous.timestamp)
    const elapsedMinutes = (currentDate.getTime() - previousDate.getTime()) / MS_PER_MINUTE

    if (elapsedMinutes <= 0 || elapsedMinutes > thresholds.maxSampleGapMinutes) continue

    const bucketIndex = Math.floor(currentDate.getHours() / 2)
    if (bucketIndex < 0 || bucketIndex >= buckets.length) continue

    const slope = (current.glucose - previous.glucose) / elapsedMinutes
    buckets[bucketIndex].slopes.push(slope)
    buckets[bucketIndex].samples.push({ slope, timestamp: currentDate.getTime() })
  }

  const firstTimestamp = new Date(readings[0].timestamp).getTime()
  const lastTimestamp = new Date(readings[readings.length - 1].timestamp).getTime()
  const daysObserved = Math.max(1, daysBetween(firstTimestamp, lastTimestamp))
  const minSamplesRequired = Math.max(
    thresholds.minAbsoluteSamples,
    Math.ceil(daysObserved * thresholds.minSamplesRatioOfDaysObserved)
  )

  const patterns = []

  buckets.forEach((bucket, bucketIndex) => {
    if (bucket.slopes.length < minSamplesRequired) return

    const simpleAvgSlope = bucket.slopes.reduce((sum, s) => sum + s, 0) / bucket.slopes.length
    const isRising = simpleAvgSlope > 0

    let weightedSlopeSum = 0
    let weightSum = 0
    let consistentWeightSum = 0

    bucket.samples.forEach(({ slope, timestamp }) => {
      const weight = computeRecencyWeight(timestamp, thresholds.recencyHalfLifeDays)
      weightedSlopeSum += slope * weight
      weightSum += weight
      if (isRising ? slope > 0 : slope < 0) {
        consistentWeightSum += weight
      }
    })

    if (weightSum === 0) return

    const weightedAvgSlope = weightedSlopeSum / weightSum
    const consistency = consistentWeightSum / weightSum

    if (Math.abs(weightedAvgSlope) < thresholds.minSlopeMgDlPerMinute) return
    if (consistency < thresholds.minConsistencyRatio) return

    const startHour = bucketIndex * 2
    const endHour = startHour + 2
    const timeRange = `${String(startHour).padStart(2, '0')}:00-${String(endHour).padStart(2, '0')}:00`
    const speed = Math.abs(weightedAvgSlope).toFixed(2)

    const countRecentOccurrences = (days) => {
      const cutoff = Date.now() - days * MS_PER_DAY
      return bucket.samples.filter(
        (sample) => sample.timestamp >= cutoff && (isRising ? sample.slope > 0 : sample.slope < 0)
      ).length
    }

    const intensity = Math.min(100, Math.abs(weightedAvgSlope) * 50)
    const confidence = Math.round(consistency * 100)

    patterns.push({
      id: `hour-${bucketIndex}`,
      title: isRising
        ? t('patterns.recurringRiseTitle', { timeRange })
        : t('patterns.recurringDropTitle', { timeRange }),
      description: isRising
        ? t('patterns.recurringRiseDesc', { timeRange, speed })
        : t('patterns.recurringDropDesc', { timeRange, speed }),
      icon: isRising ? 'fi-sr-trending-up' : 'fi-sr-trending-down',
      color: isRising ? 'warning' : 'info',
      intensity,
      confidence,
      frequency15: countRecentOccurrences(15),
      frequency30: countRecentOccurrences(30),
      timeHour: startHour,
      score: (confidence / 100) * intensity
    })
  })

  return patterns
}

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
function detectNotePatterns(readings, notes, thresholds = PATTERN_THRESHOLDS) {
  if (!readings || !notes || readings.length < thresholds.minReadingsForAnalysis) return []

  const notesByKey = new Map()
  notes.forEach((note) => {
    const key = note.text?.toLowerCase().trim()
    if (!key || key.length < 3) return
    if (!notesByKey.has(key)) notesByKey.set(key, [])
    notesByKey.get(key).push(note)
  })

  const windowMs = thresholds.postEventWindowHours * MS_PER_HOUR
  const patterns = []

  notesByKey.forEach((occurrences, noteKey) => {
    if (occurrences.length < thresholds.minNoteOccurrences) return

    let peakRiseSum = 0
    let nadirDropSum = 0
    let validOccurrences = 0

    occurrences.forEach((occurrence) => {
      const startTime = new Date(occurrence.timestamp).getTime()
      const endTime = startTime + windowMs

      const postEventReadings = readings.filter((reading) => {
        const readingTime = new Date(reading.timestamp).getTime()
        return readingTime >= startTime && readingTime <= endTime
      })

      if (postEventReadings.length <= 5) return

      const startGlucose = postEventReadings[0].glucose
      const peakGlucose = Math.max(...postEventReadings.map((r) => r.glucose))
      const nadirGlucose = Math.min(...postEventReadings.map((r) => r.glucose))

      const rise = peakGlucose - startGlucose
      const drop = startGlucose - nadirGlucose

      if (rise < thresholds.minNoteImpactMgDl && drop < thresholds.minNoteImpactMgDl) return

      peakRiseSum += rise
      nadirDropSum += drop
      validOccurrences++
    })

    if (validOccurrences < thresholds.minNoteOccurrences) return

    const avgPeakRise = peakRiseSum / validOccurrences
    const avgNadirDrop = nadirDropSum / validOccurrences
    const confidence = Math.round((validOccurrences / occurrences.length) * 100)

    const countRecentOccurrences = (days) => {
      const cutoff = Date.now() - days * MS_PER_DAY
      return occurrences.filter((o) => new Date(o.timestamp).getTime() >= cutoff).length
    }

    const frequency15 = countRecentOccurrences(15)
    const frequency30 = countRecentOccurrences(30)
    const noteLabel = noteKey.toUpperCase()
    const safeIdSuffix = noteKey.replace(/\s+/g, '-')

    if (avgPeakRise >= thresholds.minNoteImpactMgDl) {
      const intensity = Math.min(100, avgPeakRise)
      patterns.push({
        id: `note-rise-${safeIdSuffix}`,
        title: t('patterns.noteRiseTitle', { note: noteLabel }),
        description: t('patterns.noteRiseDesc', { note: noteKey, impact: Math.round(avgPeakRise) }),
        icon: 'fi-sr-assessment',
        color: 'error',
        intensity,
        confidence,
        frequency15,
        frequency30,
        score: (confidence / 100) * intensity
      })
    }

    if (avgNadirDrop >= thresholds.minNoteImpactMgDl) {
      const intensity = Math.min(100, avgNadirDrop)
      patterns.push({
        id: `note-drop-${safeIdSuffix}`,
        title: t('patterns.noteDropTitle', { note: noteLabel }),
        description: t('patterns.noteDropDesc', { note: noteKey, impact: Math.round(avgNadirDrop) }),
        icon: 'fi-sr-assessment',
        color: 'success',
        intensity,
        confidence,
        frequency15,
        frequency30,
        score: (confidence / 100) * intensity
      })
    }
  })

  return patterns
}

// ── Helper: stato di caricamento sicuro in concorrenza ────────────────────────

/**
 * Crea un flag di "loading" basato su un contatore invece che su un booleano
 * semplice. Con un booleano, due operazioni asincrone in corso contemporanea-
 * mente possono "spegnere" lo stato di caricamento quando la prima finisce,
 * anche se la seconda è ancora in volo. Il contatore evita questo problema.
 */
function createLoadingFlag() {
  const activeCount = ref(0)
  const isActive = computed(() => activeCount.value > 0)

  async function run(fn) {
    activeCount.value++
    try {
      return await fn()
    } finally {
      activeCount.value--
    }
  }

  return { isActive, run }
}

// ── Interceptor axios (registrati una sola volta per l'intera app) ───────────

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

// ── Store ──────────────────────────────────────────────────────────────────

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

  // Pattern Smart: ordinati per punteggio (confidenza × intensità), non solo
  // per ora del giorno, così un pattern ad alto impatto emerge per primo
  // anche con confidenza leggermente inferiore a uno innocuo.
  const patterns = computed(() => {
    const hourlyPatterns = detectHourlyPatterns(historyReadings.value)
    const noteCorrelationPatterns = detectNotePatterns(historyReadings.value, historyNotes.value)
    return [...hourlyPatterns, ...noteCorrelationPatterns].sort((a, b) => b.score - a.score)
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

  // ── Lettura corrente e serie temporali ───────────────────────────────────

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

  // ── Note (CRUD) ───────────────────────────────────────────────────────────

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

  // ── Carboidrati (CHO) ────────────────────────────────────────────────────

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

  // ── Insulina ──────────────────────────────────────────────────────────────

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

  // ── Impostazioni ──────────────────────────────────────────────────────────

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

  // ── Tema ──────────────────────────────────────────────────────────────────

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

  // ── Sensori ───────────────────────────────────────────────────────────────

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

  // ── Storico (Calendario / Analisi) ────────────────────────────────────────

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