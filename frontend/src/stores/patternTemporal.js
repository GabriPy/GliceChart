import { PATTERN_THRESHOLDS } from './patternConfig.js'

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

export function analyzeTemporalTrend(pattern, readings, now = Date.now()) {
  if (!pattern || !Array.isArray(readings)) {
    return {
      stato: 'insufficientData',
      valore_finestra_recente: null,
      valore_finestra_precedente: null
    }
  }

  const recentWindowMs = 7 * MS_PER_DAY
  const previousWindowMs = 7 * MS_PER_DAY

  const recentStart = now - recentWindowMs
  const previousStart = recentStart - previousWindowMs
  const previousEnd = recentStart

  const recentSamples = getPatternSamples(pattern, readings, recentStart, now)
  const previousSamples = getPatternSamples(pattern, readings, previousStart, previousEnd)

  if (recentSamples.length < 3 || previousSamples.length < 3) {
    return {
      stato: 'dati_insufficienti',
      valore_finestra_recente: summarizeSamples(recentSamples),
      valore_finestra_precedente: summarizeSamples(previousSamples)
    }
  }

  const recentValue = computeWindowValue(recentSamples)
  const previousValue = computeWindowValue(previousSamples)

  const variation = Math.abs(recentValue - previousValue)
  const threshold = 0.15

  let stato = 'stable'
  if (variation > threshold) {
    stato = recentValue > previousValue ? 'worsening' : 'improving'
  }

  return {
    stato,
    valore_finestra_recente: recentValue,
    valore_finestra_precedente: previousValue,
    variazione_percentuale: previousValue !== 0 ? Math.round(((recentValue - previousValue) / Math.abs(previousValue)) * 100) : 0
  }
}

function getPatternSamples(pattern, readings, startTime, endTime) {
  const startHour = pattern.timeHour ?? 0
  const endHour = startHour + 2

  return readings.filter((reading) => {
    const readingTime = new Date(reading.timestamp).getTime()
    if (readingTime < startTime || readingTime > endTime) return false

    const date = new Date(reading.timestamp)
    const hour = date.getHours()
    const bucketIndex = Math.floor(hour / 2) * 2

    return bucketIndex >= startHour && bucketIndex < endHour
  })
}

function computeWindowValue(samples) {
  if (samples.length === 0) return 0

  const slopes = []
  for (let i = 1; i < samples.length; i++) {
    const previous = samples[i - 1]
    const current = samples[i]
    const elapsedMinutes = (new Date(current.timestamp) - new Date(previous.timestamp)) / MS_PER_MINUTE

    if (elapsedMinutes > 0 && elapsedMinutes <= PATTERN_THRESHOLDS.maxSampleGapMinutes) {
      slopes.push((current.glucose - previous.glucose) / elapsedMinutes)
    }
  }

  if (slopes.length === 0) return 0
  return slopes.reduce((sum, s) => sum + s, 0) / slopes.length
}

function summarizeSamples(samples) {
  if (!samples || samples.length === 0) return null
  const values = samples.map((s) => s.glucose)
  return {
    media: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
    conteggio: values.length
  }
}
