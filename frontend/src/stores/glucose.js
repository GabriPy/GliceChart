// stores/glucose.js
// Le chiamate usano path relativi (/api/...) — funziona sia in locale che
// dietro Cloudflare Tunnel perché il frontend è servito dallo stesso Node.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { t } from '../i18n'

export const useGlucoseStore = defineStore('glucose', () => {

  function normalizeBooleanSetting(value, fallback = false) {
    if (value === null || value === undefined) return fallback
    if (value === true || value === 1 || value === '1' || value === 'true') return true
    if (value === false || value === 0 || value === '0' || value === 'false') return false
    return Boolean(value)
  }

  const current = ref(null)
  const readings = ref([])
  const allInsulin = ref([]) // Dati completi (24h) per IOB
  const allCarbs = ref([]) // Dati completi (24h) per COB
  const notes = ref([])
  const sensors = ref([])
  const selectedRange = ref(180)
  const carbDraftAmount = ref(0)
  const loading = ref(false)
  const chartLoading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(null)

  // Record filtrati per il range selezionato (UI)
  const insulinRecords = computed(() => {
    const now = new Date().getTime()
    const rangeMs = selectedRange.value * 60 * 1000
    return allInsulin.value.filter(ins => (now - new Date(ins.timestamp).getTime()) <= rangeMs)
  })

  const carbRecords = computed(() => {
    const now = new Date().getTime()
    const rangeMs = selectedRange.value * 60 * 1000
    return allCarbs.value.filter(c => (now - new Date(c.timestamp).getTime()) <= rangeMs)
  })

  // Impostazioni (Settings)
  const settings = ref({
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

  const DEFAULT_SETTINGS = {
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
  }

  async function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    await updateSettings(settings.value)
  }

  // Dati storici (Calendario)
  const historyReadings = ref([])
  const historyInsulin = ref([])
  const historyChartInsulin = ref([])
  const historyCarbs = ref([])
  const historyNotes = ref([])
  const historyLoading = ref(false)

  // ── Helper Statistiche ──────────────────────────────────────────────────────
  function calculateStats(data) {
    if (!data || !data.length) return null

    const values = data.map(r => r.glucose)
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Time in Range (TIR) usando i limiti delle impostazioni
    const inRange = data.filter(r => r.glucose >= settings.value.tir_min && r.glucose <= settings.value.tir_max).length
    const tir = Math.round((inRange / data.length) * 100)

    return { avg, min, max, tir }
  }

  // Statistiche correnti (Homepage)
  const stats = computed(() => calculateStats(readings.value))

  // Statistiche storiche (Calendario)
  const historyStats = computed(() => calculateStats(historyReadings.value))

  // ── IOB / COB (Calcolo dinamico con decadimento lineare) ─────────────────
  const iob = computed(() => {
    const now = new Date().getTime()
    const durationHr = Number(settings.value.rapid_duration) || 3
    const durationMs = durationHr * 60 * 60 * 1000

    return allInsulin.value.reduce((total, ins) => {
      if (ins.type !== 'rapid') return total // Solo la rapida contribuisce all'IOB standard

      const elapsedMs = now - new Date(ins.timestamp).getTime()
      if (elapsedMs < 0 || elapsedMs >= durationMs) return total

      const factor = 1 - (elapsedMs / durationMs)
      return total + (Number(ins.units) * factor)
    }, 0)
  })

  const cob = computed(() => {
    const now = new Date().getTime()
    const durationHr = Number(settings.value.carb_duration) || 4
    const durationMs = durationHr * 60 * 60 * 1000

    return allCarbs.value.reduce((total, carb) => {
      const elapsedMs = now - new Date(carb.timestamp).getTime()
      if (elapsedMs < 0 || elapsedMs >= durationMs) return total

      const factor = 1 - (elapsedMs / durationMs)
      return total + (Number(carb.amount) * factor)
    }, 0)
  })

  // ── Helper Colore ──────────────────────────────────────────────────────────
  function getStatusColor(value) {
    if (value === null || value === undefined) return 'text-base-content'
    const g = Number(value)
    const min = Number(settings.value.tir_min)
    const max = Number(settings.value.tir_max)
    const redUnder = Number(settings.value.red_under)
    const redOver = Number(settings.value.red_over)

    // 1. Rosso (Molto fuori range / Gravi)
    if (g <= redUnder || g >= redOver) return 'text-error'

    // 2. Giallo (Fuori target / Warning)
    if (g < min || g > max) return 'text-warning'

    // 3. Verde (In range)
    return 'text-success'
  }

  // ── Analisi Pattern Intelligenti ───────────────────────────────────────────
  const patterns = computed(() => {
    const allHistoryReadings = historyReadings.value || []
    const allHistoryNotes = historyNotes.value || []
    if (allHistoryReadings.length < 288) return []

    const discoveredPatterns = []

    // 1. ANALISI PER FASCE ORARIE
    const hourlyTrends = Array.from({ length: 12 }, () => ({ slopes: [], values: [], samples: [] }))

    allHistoryReadings.forEach((r, idx) => {
      if (idx === 0) return
      const date = new Date(r.timestamp)
      const hour = date.getHours()
      const bucketIndex = Math.floor(hour / 2)
      const prevG = allHistoryReadings[idx - 1].glucose
      const currentG = r.glucose
      const dt = (date.getTime() - new Date(allHistoryReadings[idx - 1].timestamp).getTime()) / 60000
      if (dt > 0 && dt < 15 && bucketIndex >= 0 && bucketIndex < hourlyTrends.length) {
        const slope = (currentG - prevG) / dt
        hourlyTrends[bucketIndex].slopes.push(slope)
        hourlyTrends[bucketIndex].values.push(currentG)
        hourlyTrends[bucketIndex].samples.push({ slope, timestamp: date.getTime() })
      }
    })

    hourlyTrends.forEach((data, bucketIndex) => {
      if (data.slopes.length < 10) return
      const avgSlope = data.slopes.reduce((a, b) => a + b, 0) / data.slopes.length
      const consistency = data.slopes.filter(s => (avgSlope > 0 ? s > 0 : s < 0)).length / data.slopes.length

      if (Math.abs(avgSlope) > 0.45 && consistency > 0.65) {
        const startHour = bucketIndex * 2
        const endHour = startHour + 2
        const timeStr = `${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`
        const speedFormatted = Math.abs(avgSlope).toFixed(2)

        const frequencyWindow = (days) => {
          const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
          return data.samples.filter(sample => sample.timestamp >= cutoff && (avgSlope > 0 ? sample.slope > 0 : sample.slope < 0)).length
        }

        const title = avgSlope > 0
          ? t('patterns.recurringRiseTitle', { timeRange: timeStr })
          : t('patterns.recurringDropTitle', { timeRange: timeStr })

        const description = avgSlope > 0
          ? t('patterns.recurringRiseDesc', { timeRange: timeStr, speed: speedFormatted })
          : t('patterns.recurringDropDesc', { timeRange: timeStr, speed: speedFormatted })

        discoveredPatterns.push({
          id: `hour-${bucketIndex}`,
          title,
          description,
          icon: avgSlope > 0 ? 'fi-sr-trending-up' : 'fi-sr-trending-down',
          color: avgSlope > 0 ? 'warning' : 'info',
          intensity: Math.min(100, Math.abs(avgSlope) * 50),
          confidence: Math.round(consistency * 100),
          frequency15: frequencyWindow(15),
          frequency30: frequencyWindow(30),
          timeHour: startHour
        })
      }
    })

    // 2. ANALISI CORRELAZIONE NOTE
    const uniqueNotes = [...new Set(allHistoryNotes.map(n => n.text?.toLowerCase().trim()))]

    uniqueNotes.forEach(noteText => {
      if (!noteText || noteText.length < 3) return
      const occurrences = allHistoryNotes.filter(n => n.text?.toLowerCase().trim() === noteText)
      if (occurrences.length < 2) return

      let totalRise = 0
      let validOccurrences = 0

      occurrences.forEach(occ => {
        const startTime = new Date(occ.timestamp).getTime()
        const endTime = startTime + 3 * 60 * 60 * 1000
        const postReadings = allHistoryReadings.filter(r => {
          const t = new Date(r.timestamp).getTime()
          return t >= startTime && t <= endTime
        })

        if (postReadings.length > 5) {
          const startG = postReadings[0].glucose
          const peakG = Math.max(...postReadings.map(r => r.glucose))
          const dropG = Math.min(...postReadings.map(r => r.glucose))

          if (Math.abs(peakG - startG) > 30 || Math.abs(startG - dropG) > 30) {
            totalRise += (peakG - startG) - (startG - dropG)
            validOccurrences++
          }
        }
      })

      if (validOccurrences >= 2) {
        const avgImpact = totalRise / validOccurrences
        if (Math.abs(avgImpact) > 20) {
          const frequencyWindow = (days) => {
            const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
            return occurrences.filter(occ => new Date(occ.timestamp).getTime() >= cutoff).length
          }

          discoveredPatterns.push({
            id: `note-${noteText.replace(/\s+/g, '-')}`,
            title: t('patterns.noteEffectTitle', { note: noteText.toUpperCase() }),
            description: t('patterns.noteEffectDesc', {
              note: noteText,
              sign: avgImpact > 0 ? '+' : '',
              impact: Math.round(avgImpact)
            }),
            icon: 'fi-sr-assessment',
            color: avgImpact > 0 ? 'error' : 'success',
            intensity: Math.min(100, Math.abs(avgImpact)),
            confidence: Math.round((validOccurrences / occurrences.length) * 100),
            frequency15: frequencyWindow(15),
            frequency30: frequencyWindow(30)
          })
        }
      }
    })

    return discoveredPatterns.sort((a, b) => {
      const aHour = a.timeHour ?? 24
      const bHour = b.timeHour ?? 24
      if (aHour !== bHour) return aHour - bHour
      return b.confidence - a.confidence
    })
  })

  const glucoseColor = computed(() => {
    if (!current.value) return 'text-base-content'
    return getStatusColor(current.value.glucose)
  })

  const minutesAgo = computed(() => {
    if (!current.value) return null
    return Math.floor((Date.now() - new Date(current.value.timestamp)) / 60000)
  })

  async function fetchCurrent() {
    try {
      const { data } = await axios.get('/api/current')
      current.value = data
      error.value = null
    } catch {
      error.value = t('errors.reachBackend')
    }
  }

  async function fetchReadings() {
    chartLoading.value = true
    try {
      const [{ data: rData }, { data: iData }, { data: cData }, { data: nData }] = await Promise.all([
        axios.get('/api/readings', { params: { range: selectedRange.value } }),
        axios.get('/api/insulin', { params: { range: 1440 } }),
        axios.get('/api/carbs', { params: { range: 1440 } }),
        axios.get('/api/notes', { params: { range: selectedRange.value } })
      ])
      readings.value = rData
      allInsulin.value = iData
      allCarbs.value = cData
      notes.value = nData
      lastUpdated.value = new Date()
      error.value = null
    } catch {
      error.value = t('errors.loadData')
    } finally {
      chartLoading.value = false
    }
  }

  // ── Note (CRUD) ───────────────────────────────────────────────────────────
  async function addNote(text, timestamp = null) {
    loading.value = true
    try {
      await axios.post('/api/notes', {
        timestamp: timestamp || new Date().toISOString(),
        text
      })
      await fetchReadings()
    } catch {
      error.value = t('errors.addNote')
    } finally {
      loading.value = false
    }
  }

  async function removeNote(id) {
    loading.value = true
    try {
      await axios.delete(`/api/notes/${id}`)
      await fetchReadings()
    } catch {
      error.value = t('errors.removeNote')
    } finally {
      loading.value = false
    }
  }

  async function editNote(id, { timestamp, text }) {
    loading.value = true
    try {
      await axios.put(`/api/notes/${id}`, { timestamp, text })
      await fetchReadings()
    } catch {
      error.value = t('errors.editNote')
    } finally {
      loading.value = false
    }
  }

  // ── Carboidrati (CHO) ────────────────────────────────────────────────────────
  async function addCarb(amount, timestamp = null) {
    loading.value = true
    try {
      await axios.post('/api/carbs', {
        timestamp: timestamp || new Date().toISOString(),
        amount
      })
      await fetchReadings()
    } catch {
      error.value = t('errors.addCarb')
    } finally {
      loading.value = false
    }
  }

  async function removeCarb(id) {
    loading.value = true
    try {
      await axios.delete(`/api/carbs/${id}`)
      await fetchReadings()
    } catch {
      error.value = t('errors.removeCarb')
    } finally {
      loading.value = false
    }
  }

  async function editCarb(id, { timestamp, amount }) {
    loading.value = true
    try {
      await axios.put(`/api/carbs/${id}`, { timestamp, amount })
      await fetchReadings()
    } catch {
      error.value = t('errors.editCarb')
    } finally {
      loading.value = false
    }
  }

  // ── Impostazioni (Settings) ──────────────────────────────────────────────────
  async function fetchSettings() {
    try {
      const { data } = await axios.get('/api/settings')
      if (data) {
        settings.value = {
          ...DEFAULT_SETTINGS,
          ...data,
          telegram_enabled: normalizeBooleanSetting(data.telegram_enabled, false),
          telegram_high_low_alerts: normalizeBooleanSetting(data.telegram_high_low_alerts, true),
          telegram_insulin_alerts: normalizeBooleanSetting(data.telegram_insulin_alerts, false),
          telegram_carb_alerts: normalizeBooleanSetting(data.telegram_carb_alerts, false),
          telegram_daily_summary: normalizeBooleanSetting(data.telegram_daily_summary, false),
          telegram_daily_summary_time: data.telegram_daily_summary_time || '21:00'
        }
      }
    } catch {
      error.value = t('errors.loadSettings')
    }
  }

  async function updateSettings(newSettings) {
    loading.value = true
    try {
      await axios.put('/api/settings', newSettings)
      settings.value = {
        ...DEFAULT_SETTINGS,
        ...newSettings,
        telegram_enabled: normalizeBooleanSetting(newSettings.telegram_enabled, false),
        telegram_high_low_alerts: normalizeBooleanSetting(newSettings.telegram_high_low_alerts, true),
        telegram_insulin_alerts: normalizeBooleanSetting(newSettings.telegram_insulin_alerts, false),
        telegram_carb_alerts: normalizeBooleanSetting(newSettings.telegram_carb_alerts, false),
        telegram_daily_summary: normalizeBooleanSetting(newSettings.telegram_daily_summary, false),
        telegram_daily_summary_time: newSettings.telegram_daily_summary_time || '21:00'
      }
      error.value = null
    } catch {
      error.value = t('errors.saveSettings')
    } finally {
      loading.value = false
    }
  }

  // ── Theme Management ───────────────────────────────────────────────────────
  const themes = ["light", "dark", "retro", "forest", "wireframe", "coffee"]
  const theme = ref(localStorage.getItem('theme') || 'dark')

  function setTheme(t) {
    theme.value = t
    localStorage.setItem('theme', t)
    try { document.documentElement.setAttribute('data-theme', t) } catch (e) { }
  }

  try { document.documentElement.setAttribute('data-theme', theme.value) } catch (e) { }

  async function fetchAll() {
    loading.value = true
    try {
      await Promise.all([fetchCurrent(), fetchReadings(), fetchSettings()])
    } finally {
      loading.value = false
    }
  }

  async function setRange(minutes) {
    selectedRange.value = minutes
    await fetchReadings()
  }

  // ── Insulina ──────────────────────────────────────────────────────────────
  async function addInsulin(type, units, timestamp = null) {
    loading.value = true
    try {
      await axios.post('/api/insulin', {
        timestamp: timestamp || new Date().toISOString(),
        type,
        units
      })
      await fetchReadings()
    } catch {
      error.value = t('errors.addInsulin')
    } finally {
      loading.value = false
    }
  }

  async function removeInsulin(id) {
    loading.value = true
    try {
      await axios.delete(`/api/insulin/${id}`)
      await fetchReadings()
    } catch {
      error.value = t('errors.removeInsulin')
    } finally {
      loading.value = false
    }
  }

  async function editInsulin(id, { timestamp, type, units }) {
    loading.value = true
    try {
      await axios.put(`/api/insulin/${id}`, { timestamp, type, units })
      await fetchReadings()
    } catch {
      error.value = t('errors.editInsulin')
    } finally {
      loading.value = false
    }
  }

  async function syncNow() {
    loading.value = true
    try {
      await axios.post('/api/sync')
      await fetchAll()
    } catch {
      error.value = t('errors.sync')
    } finally {
      loading.value = false
    }
  }

  // ── Sensori ───────────────────────────────────────────────────────────────
  async function fetchSensors() {
    try {
      const { data } = await axios.get('/api/sensors')
      sensors.value = data
      error.value = null
    } catch {
      error.value = t('errors.loadSensors')
    }
  }

  async function addSensor(serial_number, lot_number, start_date) {
    loading.value = true
    try {
      await axios.post('/api/sensors', {
        serial_number,
        lot_number,
        start_date: start_date || new Date().toISOString()
      })
      await fetchSensors()
    } catch {
      error.value = t('errors.addSensor')
    } finally {
      loading.value = false
    }
  }

  async function endSensor(id, actual_end_date, early_end_note) {
    loading.value = true
    try {
      await axios.put(`/api/sensors/${id}/end`, {
        actual_end_date: actual_end_date || new Date().toISOString(),
        early_end_note
      })
      await fetchSensors()
    } catch {
      error.value = t('errors.endSensor')
    } finally {
      loading.value = false
    }
  }

  async function deleteSensor(id) {
    loading.value = true
    try {
      await axios.delete(`/api/sensors/${id}`)
      await fetchSensors()
    } catch {
      error.value = t('errors.deleteSensor')
    } finally {
      loading.value = false
    }
  }

  async function fetchLongHistory(minutes = 4320) {
    historyLoading.value = true
    try {
      const [{ data: rData }, { data: iData }, { data: cData }, { data: nData }] = await Promise.all([
        axios.get('/api/readings', { params: { range: minutes } }),
        axios.get('/api/insulin', { params: { range: minutes } }),
        axios.get('/api/carbs', { params: { range: minutes } }),
        axios.get('/api/notes', { params: { range: minutes } })
      ])
      historyReadings.value = rData
      historyInsulin.value = iData
      historyChartInsulin.value = iData
      historyCarbs.value = cData
      historyNotes.value = nData
      error.value = null
    } catch {
      error.value = t('errors.loadAnalysis')
    } finally {
      historyLoading.value = false
    }
  }

  async function fetchHistory(date) {
    historyLoading.value = true
    try {
      const [{ data: rData }, { data: iData }, { data: iChartData }, { data: cData }, { data: nData }] = await Promise.all([
        axios.get('/api/history/readings', { params: { date } }),
        axios.get('/api/history/insulin', { params: { date } }),
        axios.get('/api/history/insulin-overlap', { params: { date } }),
        axios.get('/api/history/carbs', { params: { date } }),
        axios.get('/api/history/notes', { params: { date } })
      ])
      historyReadings.value = rData
      historyInsulin.value = iData
      historyChartInsulin.value = iChartData
      historyCarbs.value = cData
      historyNotes.value = nData
      error.value = null
    } catch {
      error.value = t('errors.loadHistory')
    } finally {
      historyLoading.value = false
    }
  }

  return {
    current, readings, insulinRecords, carbRecords, notes, sensors, selectedRange, carbDraftAmount, loading, chartLoading, error, lastUpdated,
    settings,
    historyReadings, historyInsulin, historyChartInsulin, historyCarbs, historyNotes, historyLoading,
    glucoseColor, minutesAgo, stats, historyStats, iob, cob, patterns,
    fetchCurrent, fetchReadings, fetchAll, setRange, syncNow,
    addInsulin, removeInsulin, editInsulin,
    addCarb, removeCarb, editCarb,
    addNote, removeNote, editNote,
    fetchSensors, addSensor, endSensor, deleteSensor,
    fetchHistory, fetchLongHistory, fetchSettings, updateSettings, resetSettings, getStatusColor,
    themes, theme, setTheme
  }
})
