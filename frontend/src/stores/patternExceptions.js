import { PATTERN_THRESHOLDS } from './patternConfig.js'

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

export function detectExceptions(pattern, readings, notes) {
  if (!pattern || !Array.isArray(readings) || !Array.isArray(notes)) {
    return []
  }

  const startHour = pattern.timeHour ?? 0
  const endHour = startHour + 2
  const expectedDirection = getExpectedDirection(pattern)

  const occurrences = groupOccurrencesByDay(readings, startHour, endHour)
  const deviations = findDeviations(occurrences, expectedDirection)

  return deviations.map((deviation) => {
    const associatedNote = findAssociatedNote(deviation.date, notes, startHour, endHour)
    return {
      data: deviation.date,
      valore_rilevato: deviation.value,
      valore_atteso: deviation.expected,
      scostamento: deviation.deviation,
      motivo_probabile: associatedNote?.text || null,
      nota_timestamp: associatedNote?.timestamp || null
    }
  })
}

function getExpectedDirection(pattern) {
  if (pattern.id?.startsWith('hour-')) {
    return pattern.title?.includes('Rise') || pattern.title?.includes('Salita') ? 'up' : 'down'
  }
  if (pattern.id?.startsWith('note-rise-')) return 'up'
  if (pattern.id?.startsWith('note-drop-')) return 'down'
  return null
}

function groupOccurrencesByDay(readings, startHour, endHour) {
  const days = new Map()

  readings.forEach((reading) => {
    const date = new Date(reading.timestamp)
    const hour = date.getHours()
    const bucketIndex = Math.floor(hour / 2) * 2

    if (bucketIndex !== startHour) return

    const dayKey = date.toISOString().slice(0, 10)
    if (!days.has(dayKey)) days.set(dayKey, [])
    days.get(dayKey).push(reading)
  })

  return days
}

function findDeviations(occurrences, expectedDirection) {
  const deviations = []

  occurrences.forEach((dayReadings, date) => {
    if (dayReadings.length < 2) return

    const slopes = []
    for (let i = 1; i < dayReadings.length; i++) {
      const previous = dayReadings[i - 1]
      const current = dayReadings[i]
      const elapsedMinutes = (new Date(current.timestamp) - new Date(previous.timestamp)) / MS_PER_MINUTE

      if (elapsedMinutes > 0 && elapsedMinutes <= PATTERN_THRESHOLDS.maxSampleGapMinutes) {
        slopes.push({
          slope: (current.glucose - previous.glucose) / elapsedMinutes,
          timestamp: new Date(current.timestamp).getTime()
        })
      }
    }

    if (slopes.length === 0) return

    const avgSlope = slopes.reduce((sum, s) => sum + s.slope, 0) / slopes.length
    const isDeviation = expectedDirection === 'up'
      ? avgSlope < -PATTERN_THRESHOLDS.minSlopeMgDlPerMinute
      : expectedDirection === 'down'
        ? avgSlope > PATTERN_THRESHOLDS.minSlopeMgDlPerMinute
        : false

    if (isDeviation) {
      const lastReading = dayReadings[dayReadings.length - 1]
      deviations.push({
        date,
        value: lastReading.glucose,
        expected: avgSlope > 0 ? 'salita' : 'discesa',
        deviation: Math.abs(avgSlope).toFixed(2)
      })
    }
  })

  return deviations
}

function findAssociatedNote(date, notes, startHour, endHour) {
  const dayStart = new Date(date).getTime()
  const dayEnd = dayStart + MS_PER_DAY

  return notes.find((note) => {
    const noteTime = new Date(note.timestamp).getTime()
    if (noteTime < dayStart || noteTime > dayEnd) return false

    const noteHour = new Date(note.timestamp).getHours()
    const noteBucket = Math.floor(noteHour / 2) * 2
    return noteBucket >= startHour && noteBucket < endHour
  }) || null
}
