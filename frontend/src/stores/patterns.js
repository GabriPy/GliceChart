import { t } from '../i18n'
import { PATTERN_THRESHOLDS, PATTERN_OVERLAP } from './patternConfig.js'
import { analyzeTemporalTrend } from './patternTemporal.js'
import { detectExceptions } from './patternExceptions.js'
import { findOverlaps } from './patternOverlap.js'

export { PATTERN_THRESHOLDS } from './patternConfig.js'

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

function daysBetween(startMs, endMs) {
  return (endMs - startMs) / MS_PER_DAY
}

function computeRecencyWeight(timestampMs, halfLifeDays) {
  const ageDays = daysBetween(timestampMs, Date.now())
  return Math.pow(0.5, ageDays / halfLifeDays)
}

export function detectHourlyPatterns(readings, thresholds = PATTERN_THRESHOLDS) {
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

export function detectNotePatterns(readings, notes, thresholds = PATTERN_THRESHOLDS) {
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

/**
 * Arricchisce i pattern rilevati con andamento temporale, eccezioni e overlap.
 * @param {Array} patterns - pattern da arricchire
 * @param {Array} readings - letture glicemiche
 * @param {Array} notes - note registrate
 * @returns {Array} pattern arricchiti
 */
export function enrichPatterns(patterns, readings, notes) {
  if (!Array.isArray(patterns) || patterns.length === 0) return []

  const enriched = patterns.map((pattern) => {
    const andamento = analyzeTemporalTrend(pattern, readings)
    const eccezioni = detectExceptions(pattern, readings, notes)

    return {
      ...pattern,
      andamento,
      eccezioni
    }
  })

  return findOverlaps(enriched)
}
