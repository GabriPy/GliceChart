import { PATTERN_OVERLAP } from './patternConfig.js'

/**
 * Confronta pattern per sovrapposizione temporale.
 * @param {Array} patterns - lista di pattern già calcolati
 * @returns {Array} lista di pattern arricchiti con pattern_correlati
 */
export function findOverlaps(patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) return []

  const overlapTolerance = PATTERN_OVERLAP.toleranceMinutes
  const overlaps = new Map()

  patterns.forEach((pattern) => {
    if (!pattern?.timeHour && !pattern?.timeRange) return

    patterns.forEach((other) => {
      if (pattern === other || !other?.timeHour && !other?.timeRange) return

      const overlapsTemporally = checkTimeOverlap(pattern, other, overlapTolerance)
      if (!overlapsTemporally) return

      const key = [pattern.id, other.id].sort().join('::')
      if (!overlaps.has(key)) {
        overlaps.set(key, [pattern.id, other.id])
      }
    })
  })

  const related = new Map()
  overlaps.forEach((ids) => {
    ids.forEach((id) => {
      if (!related.has(id)) related.set(id, new Set())
      ids.forEach((otherId) => {
        if (otherId !== id) related.get(id).add(otherId)
      })
    })
  })

  return patterns.map((pattern) => ({
    ...pattern,
    pattern_correlati: related.has(pattern.id) ? Array.from(related.get(pattern.id)) : []
  }))
}

function checkTimeOverlap(a, b, toleranceMinutes) {
  if (a.timeHour == null && b.timeHour == null) return false

  if (a.timeHour != null && b.timeHour != null) {
    const diff = Math.abs(a.timeHour - b.timeHour)
    return diff === 0 || diff <= toleranceMinutes / 60
  }

  if (a.timeRange && b.timeHour != null) {
    const [startStr] = a.timeRange.split('-')
    const startHour = Number(startStr.split(':')[0])
    const diff = Math.abs(startHour - b.timeHour)
    return diff === 0 || diff <= toleranceMinutes / 60
  }

  if (b.timeRange && a.timeHour != null) {
    const [startStr] = b.timeRange.split('-')
    const startHour = Number(startStr.split(':')[0])
    const diff = Math.abs(startHour - a.timeHour)
    return diff === 0 || diff <= toleranceMinutes / 60
  }

  return false
}
