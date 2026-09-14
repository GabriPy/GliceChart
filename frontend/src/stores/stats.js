// stores/stats.js
//
// Modulo di calcolo statistico e clinico diabetologico conforme agli standard
// internazionali di consenso AGP (Ambulatory Glucose Profile) e ADA (American Diabetes Association).

/**
 * Calcola la frazione di insulina residua (IOB) per un singolo bolo rapid
 * usando il modello di attività esponenziale/biesponenziale validato (Walsh / Scheiner).
 *
 * @param {number} elapsedMinutes - Minuti trascorsi dall'iniezione (>= 0)
 * @param {number} durationHours - Durata totale azione insulina (DIA) in ore (es. 3-5h)
 * @param {number} [peakMinutes=75] - Tempo al picco di attività in minuti (default 75 min per analoghi rapidi)
 * @returns {number} Frazione residua tra 0 e 1
 */
export function calculateExponentialIobFraction(elapsedMinutes, durationHours = 3, peakMinutes = 75) {
  if (elapsedMinutes <= 0) return 1
  const diaMinutes = (Number(durationHours) || 3) * 60
  if (elapsedMinutes >= diaMinutes) return 0

  const t = elapsedMinutes
  const T = diaMinutes
  const P = Math.min(Math.max(30, peakMinutes), T / 2) // vincolo fisiologico

  // Modello quadratico-esponenziale biesponenziale standard (Walsh/Scheiner)
  const a = (2 * P) / T
  const b = 1 - a / 2

  let activityFraction = 0
  if (t <= P) {
    activityFraction = (t * t) / (a * b * T * T)
  } else {
    const peakAction = (P * P) / (a * b * T * T)
    const postPeakAction = (2 * (t - P) - (t * t - P * P) / T) / (2 * b * T)
    activityFraction = peakAction + postPeakAction
  }

  const remaining = 1 - Math.min(1, Math.max(0, activityFraction))
  return remaining
}

/**
 * Calcola l'Insulina Attiva (IOB - Insulin On Board) totale in unità
 *
 * @param {Array<{ timestamp: string, type: string, units: number }>} insulinEntries
 * @param {number} rapidDurationHours
 * @param {number} [nowMs=Date.now()]
 * @returns {number} Unità IOB arrotondate a 2 decimali
 */
export function calculateIob(insulinEntries, rapidDurationHours = 3, nowMs = Date.now()) {
  if (!Array.isArray(insulinEntries) || insulinEntries.length === 0) return 0

  const total = insulinEntries.reduce((acc, entry) => {
    if (entry.type !== 'rapid') return acc
    const entryTime = new Date(entry.timestamp).getTime()
    if (Number.isNaN(entryTime)) return acc

    const elapsedMinutes = (nowMs - entryTime) / (60 * 1000)
    if (elapsedMinutes < 0) return acc

    const fraction = calculateExponentialIobFraction(elapsedMinutes, rapidDurationHours)
    return acc + Number(entry.units || 0) * fraction
  }, 0)

  return Math.round(total * 100) / 100
}

/**
 * Calcola la frazione di carboidrati residui (COB) con curva di assorbimento gastrointestinale
 *
 * @param {number} elapsedMinutes
 * @param {number} durationHours
 * @returns {number} Frazione residua tra 0 e 1
 */
export function calculateCobFraction(elapsedMinutes, durationHours = 4) {
  if (elapsedMinutes <= 0) return 1
  const durationMinutes = (Number(durationHours) || 4) * 60
  if (elapsedMinutes >= durationMinutes) return 0

  // Assorbimento sigmoideo/esponenziale (picco assorbimento a 45 min)
  const peakMinutes = 45
  return calculateExponentialIobFraction(elapsedMinutes, durationHours, peakMinutes)
}

/**
 * Calcola i Carboidrati Attivi (COB - Carbs On Board) totali in grammi
 *
 * @param {Array<{ timestamp: string, amount: number }>} carbEntries
 * @param {number} carbDurationHours
 * @param {number} [nowMs=Date.now()]
 * @returns {number} Grammi COB arrotondati
 */
export function calculateCob(carbEntries, carbDurationHours = 4, nowMs = Date.now()) {
  if (!Array.isArray(carbEntries) || carbEntries.length === 0) return 0

  const total = carbEntries.reduce((acc, entry) => {
    const entryTime = new Date(entry.timestamp).getTime()
    if (Number.isNaN(entryTime)) return acc

    const elapsedMinutes = (nowMs - entryTime) / (60 * 1000)
    if (elapsedMinutes < 0) return acc

    const fraction = calculateCobFraction(elapsedMinutes, carbDurationHours)
    return acc + Number(entry.amount || 0) * fraction
  }, 0)

  return Math.round(total)
}

/**
 * Calcolo completo delle statistiche cliniche conforme allo standard AGP (Ambulatory Glucose Profile)
 *
 * @param {Array<{ glucose: number }>} data
 * @param {{ tir_min?: number, tir_max?: number, red_under?: number, red_over?: number }} settings
 * @returns {Object|null}
 */
export function calculateStats(data, settings = {}) {
  if (!data || data.length === 0) return null

  const values = data.map((r) => Number(r.glucose)).filter((v) => Number.isFinite(v) && v > 0)
  if (values.length === 0) return null

  const count = values.length
  const sum = values.reduce((acc, v) => acc + v, 0)
  const avg = Math.round(sum / count)
  const min = Math.min(...values)
  const max = Math.max(...values)

  // Deviazione Standard (SD)
  const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / count
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10

  // Coefficiente di Variazione (CV % = (SD / Media) * 100) - Target clinico <= 36%
  const cv = avg > 0 ? Math.round(((stdDev / avg) * 100) * 10) / 10 : 0

  // GMI (Glucose Management Indicator) - Formula ADA standard: 3.31 + 0.02392 * media
  const gmi = Math.round((3.31 + 0.02392 * avg) * 10) / 10

  // eA1C stimata (Formula Nathan): (avg + 46.7) / 28.7
  const eA1C = Math.round(((avg + 46.7) / 28.7) * 10) / 10

  // Soglie AGP Consensus
  const tirMin = Number(settings.tir_min ?? 70)
  const tirMax = Number(settings.tir_max ?? 180)
  const veryLowThreshold = 54
  const lowThreshold = tirMin
  const highThreshold = tirMax
  const veryHighThreshold = 250

  const veryLowCount = values.filter((v) => v < veryLowThreshold).length
  const lowCount = values.filter((v) => v >= veryLowThreshold && v < lowThreshold).length
  const inRangeCount = values.filter((v) => v >= lowThreshold && v <= highThreshold).length
  const highCount = values.filter((v) => v > highThreshold && v <= veryHighThreshold).length
  const veryHighCount = values.filter((v) => v > veryHighThreshold).length

  const tir = Math.round((inRangeCount / count) * 100)
  const tbr = Math.round(((veryLowCount + lowCount) / count) * 100)
  const tbrVeryLow = Math.round((veryLowCount / count) * 100)
  const tar = Math.round(((highCount + veryHighCount) / count) * 100)
  const tarVeryHigh = Math.round((veryHighCount / count) * 100)

  return {
    avg,
    min,
    max,
    stdDev,
    cv,
    gmi,
    eA1C,
    tir,
    tbr,
    tbrVeryLow,
    tar,
    tarVeryHigh,
    count
  }
}

/**
 * Restituisce la classe colore Tailwind in base al valore glicemico e alle soglie
 */
export function getStatusColorForValue(value, settings = {}) {
  if (value === null || value === undefined) return 'text-base-content'

  const glucose = Number(value)
  const min = Number(settings.tir_min ?? 70)
  const max = Number(settings.tir_max ?? 180)
  const redUnder = Number(settings.red_under ?? 55)
  const redOver = Number(settings.red_over ?? 250)

  if (glucose <= redUnder || glucose >= redOver) return 'text-error'
  if (glucose < min || glucose > max) return 'text-warning'
  return 'text-success'
}
