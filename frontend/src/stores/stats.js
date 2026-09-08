export function calculateStats(data, settings) {
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

export function getStatusColorForValue(value, settings) {
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

export function calculateIob(insulinEntries, rapidDurationHours) {
  const now = Date.now()
  const durationMs = (Number(rapidDurationHours) || 3) * 60 * 60 * 1000

  return insulinEntries.reduce((total, entry) => {
    if (entry.type !== 'rapid') return total

    const elapsedMs = now - new Date(entry.timestamp).getTime()
    if (elapsedMs < 0 || elapsedMs >= durationMs) return total

    const remainingFraction = 1 - elapsedMs / durationMs
    return total + Number(entry.units) * remainingFraction
  }, 0)
}

export function calculateCob(carbEntries, carbDurationHours) {
  const now = Date.now()
  const durationMs = (Number(carbDurationHours) || 4) * 60 * 60 * 1000

  return carbEntries.reduce((total, entry) => {
    const elapsedMs = now - new Date(entry.timestamp).getTime()
    if (elapsedMs < 0 || elapsedMs >= durationMs) return total

    const remainingFraction = 1 - elapsedMs / durationMs
    return total + Number(entry.amount) * remainingFraction
  }, 0)
}
