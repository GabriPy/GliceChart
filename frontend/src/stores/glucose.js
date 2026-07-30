// stores/glucose.js
// Le chiamate usano path relativi (/api/...) — funziona sia in locale che
// dietro Cloudflare Tunnel perché il frontend è servito dallo stesso Node.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useGlucoseStore = defineStore('glucose', () => {

  const current      = ref(null)
  const readings     = ref([])
  const allInsulin   = ref([]) // Dati completi (24h) per IOB
  const allCarbs     = ref([])   // Dati completi (24h) per COB
  const notes        = ref([])
  const selectedRange = ref(180)
  const carbDraftAmount = ref(0)
  const loading      = ref(false)
  const chartLoading = ref(false)
  const error        = ref(null)
  const lastUpdated  = ref(null)

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
    carb_ratio: 15
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
    // Quick presets: two editable for insulin and carbs
    quick_insulin_1: 1,
    quick_insulin_2: 2,
    quick_carb_1: 10,
    quick_carb_2: 20
  }

  async function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    await updateSettings(settings.value)
  }

  // Dati storici (Calendario)
  const historyReadings = ref([])
  const historyInsulin  = ref([])
  const historyChartInsulin = ref([])
  const historyCarbs    = ref([])
  const historyNotes    = ref([])
  const historyLoading  = ref(false)

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
      
      // Decadimento lineare semplice: (1 - tempo_trascorso / durata_totale)
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

  // ── Predizione Glicemia (v4.5.1 - Algoritmo Migliorato) ──────────────────────
  const prediction = computed(() => {
    if (!current.value || readings.value.length < 5) return null

    const nowTs = new Date().getTime()
    
    // 1. Smussamento (Media mobile ultimi 5 valori)
    const recent5 = readings.value.slice(-5)
    const smoothedCurrent = Math.round(recent5.reduce((a, b) => a + b.glucose, 0) / recent5.length)

    // 2. Calcolo ROC (Rate of Change) - ultimi 5-10 min
    const firstReading = readings.value[readings.value.length - 5] // 5 letture fa (~20-25 min)
    const lastReading = readings.value[readings.value.length - 1]
    const dt = (new Date(lastReading.timestamp).getTime() - new Date(firstReading.timestamp).getTime()) / 60000
    const dg = lastReading.glucose - firstReading.glucose
    let roc = dg / dt // mg/dL per minuto

    // 3. Gestione trend rapido e amplificazione correttiva
    let correctionFactor = 1.0
    if (roc > 2.0 || roc < -2.0) correctionFactor = 1.15
    const adjustedRoc = roc * correctionFactor

    // 4. Parametri Clinici (ISF e CR dinamici dalle impostazioni)
    const ISF = Number(settings.value.insulin_sensitivity) || 60
    const carbRatio = Number(settings.value.carb_ratio) || 15
    const CR = ISF / carbRatio // Quanta glicemia alza 1g di CHO (es. 60/15 = 4)
    
    const insulinDurationMs = (Number(settings.value.rapid_duration) || 3) * 60 * 60 * 1000
    const carbDurationMs = (Number(settings.value.carb_duration) || 4) * 60 * 60 * 1000

    const predictAt = (minutes) => {
      // A. Componente Lineare (ROC)
      let basePred = smoothedCurrent + (adjustedRoc * minutes)

      // B. Componente Insulina (IOB futuro)
      let insulinEffect = 0
      allInsulin.value.forEach(ins => {
        if (ins.type !== 'rapid') return
        const elapsed = nowTs - new Date(ins.timestamp).getTime()
        if (elapsed < 0 || elapsed >= insulinDurationMs) return
        
        const currentFactor = 1 - (elapsed / insulinDurationMs)
        const futureFactor = 1 - ((elapsed + minutes * 60 * 1000) / insulinDurationMs)
        const consumed = currentFactor - Math.max(0, futureFactor)
        insulinEffect += (Number(ins.units) * consumed * ISF)
      })

      // C. Componente Carboidrati (COB futuro)
      let carbEffect = 0
      allCarbs.value.forEach(carb => {
        const elapsed = nowTs - new Date(carb.timestamp).getTime()
        if (elapsed < 0 || elapsed >= carbDurationMs) return
        
        const currentFactor = 1 - (elapsed / carbDurationMs)
        const futureFactor = 1 - ((elapsed + minutes * 60 * 1000) / carbDurationMs)
        const consumed = currentFactor - Math.max(0, futureFactor)
        carbEffect += (Number(carb.amount) * consumed * CR)
      })

      const finalVal = Math.round(basePred - insulinEffect + carbEffect)
      return Math.max(40, Math.min(400, finalVal)) // Clamp di sicurezza
    }

    const p15 = predictAt(15)
    const p30 = predictAt(30)
    const p60 = predictAt(60)

    // D. Analisi Trend e Rischio
    let trendLabel = 'stable'
    if (roc > 2.0) trendLabel = 'fast_rising'
    else if (roc > 0.5) trendLabel = 'rising'
    else if (roc < -2.0) trendLabel = 'fast_falling'
    else if (roc < -0.5) trendLabel = 'falling'

    let riskLevel = 'normal'
    if (p15 < 70 || p30 < 70 || p60 < 70) riskLevel = 'high' // Rischio Ipo
    else if (p15 > 180 || p30 > 180 || p60 > 180) riskLevel = 'high' // Rischio Iper
    else if (roc > 1.5 || roc < -1.5) riskLevel = 'normal'
    else riskLevel = 'low'

    return {
      current: smoothedCurrent,
      t15: p15,
      t30: p30,
      t60: p60,
      roc: roc.toFixed(2),
      trend: trendLabel,
      risk: riskLevel
    }
  })

  // ── Analisi Pattern Intelligenti Evoluta (v4.5.2) ───────────────────────────
  const patterns = computed(() => {
    const allHistoryReadings = historyReadings.value || []
    const allHistoryNotes = historyNotes.value || []
    if (allHistoryReadings.length < 288) return [] // Almeno 24h di dati

    const discoveredPatterns = []

    // 1. ANALISI PER FASCE ORARIE (Sovrapposizione giorni)
    // Raggruppiamo l'ora in finestre di 2 ore per evitare pattern troppo simili tra ore vicine
    const hourlyTrends = Array.from({ length: 12 }, () => ({ slopes: [], values: [], samples: [] }))
    
    // Raggruppiamo i dati per fascia oraria di 2 ore
    allHistoryReadings.forEach((r, idx) => {
      if (idx === 0) return
      const date = new Date(r.timestamp)
      const hour = date.getHours()
      const bucketIndex = Math.floor(hour / 2)
      const prevG = allHistoryReadings[idx-1].glucose
      const currentG = r.glucose
      const dt = (date.getTime() - new Date(allHistoryReadings[idx-1].timestamp).getTime()) / 60000
      if (dt > 0 && dt < 15 && bucketIndex >= 0 && bucketIndex < hourlyTrends.length) { // Solo se letture consecutive vicine
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

      // Se c'è una pendenza significativa e coerente (> 60% delle volte)
      if (Math.abs(avgSlope) > 0.45 && consistency > 0.65) {
        const type = avgSlope > 0 ? 'Salita Ricorrente' : 'Discesa Ricorrente'
        const startHour = bucketIndex * 2
        const endHour = startHour + 2
        const timeStr = `${startHour.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}`
        const frequencyWindow = (days) => {
          const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
          return data.samples.filter(sample => sample.timestamp >= cutoff && (avgSlope > 0 ? sample.slope > 0 : sample.slope < 0)).length
        }

        discoveredPatterns.push({
          id: `hour-${bucketIndex}`,
          title: `${type} tra le ${timeStr}`,
          description: `Nella fascia ${timeStr}, la tua glicemia tende a ${avgSlope > 0 ? 'salire' : 'scendere'} con una velocità media di ${Math.abs(avgSlope).toFixed(2)} mg/dL al minuto.`,
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

    // 2. ANALISI CORRELAZIONE NOTE (Qualsiasi nota ricorrente)
    const uniqueNotes = [...new Set(allHistoryNotes.map(n => n.text?.toLowerCase().trim()))]
    
    uniqueNotes.forEach(noteText => {
      if (!noteText || noteText.length < 3) return
      const occurrences = allHistoryNotes.filter(n => n.text?.toLowerCase().trim() === noteText)
      if (occurrences.length < 2) return // Almeno 2 volte per essere un pattern

      let totalRise = 0
      let validOccurrences = 0

      occurrences.forEach(occ => {
        const startTime = new Date(occ.timestamp).getTime()
        const endTime = startTime + 3 * 60 * 60 * 1000 // Analizziamo le 3 ore successive
        const postReadings = allHistoryReadings.filter(r => {
          const t = new Date(r.timestamp).getTime()
          return t >= startTime && t <= endTime
        })

        if (postReadings.length > 5) {
          const startG = postReadings[0].glucose
          const peakG = Math.max(...postReadings.map(r => r.glucose))
          const dropG = Math.min(...postReadings.map(r => r.glucose))
          
          // Se la variazione è significativa (> 30 mg/dL)
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
            title: `Effetto "${noteText.toUpperCase()}"`,
            description: `Dopo la nota "${noteText}", la glicemia ha mostrato una variazione media di ${avgImpact > 0 ? '+' : ''}${Math.round(avgImpact)} mg/dL nelle 3 ore successive.`,
            icon: 'fi-sr- assessment',
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

  // Colore testo in base al valore mg/dL usando i target delle impostazioni
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
      error.value = 'Impossibile raggiungere il backend'
    }
  }

  async function fetchReadings() {
    chartLoading.value = true
    try {
      const [{ data: rData }, { data: iData }, { data: cData }, { data: nData }] = await Promise.all([
        axios.get('/api/readings', { params: { range: selectedRange.value } }),
        axios.get('/api/insulin', { params: { range: 1440 } }), // Prendi sempre 24h per IOB/COB
        axios.get('/api/carbs', { params: { range: 1440 } }),   // Prendi sempre 24h per IOB/COB
        axios.get('/api/notes', { params: { range: selectedRange.value } })
      ])
      readings.value = rData
      allInsulin.value = iData
      allCarbs.value = cData
      notes.value = nData
      lastUpdated.value = new Date()
      error.value = null
    } catch {
      error.value = 'Errore caricamento dati'
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
      error.value = 'Errore aggiunta nota'
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
      error.value = 'Errore eliminazione nota'
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
      error.value = 'Errore modifica nota'
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
      error.value = 'Errore aggiunta carboidrati'
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
      error.value = 'Errore eliminazione carboidrati'
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
      error.value = 'Errore modifica carboidrati'
    } finally {
      loading.value = false
    }
  }

  // ── Impostazioni (Settings) ──────────────────────────────────────────────────
  async function fetchSettings() {
    try {
      const { data } = await axios.get('/api/settings')
      if (data) settings.value = data
    } catch {
      error.value = 'Errore caricamento impostazioni'
    }
  }

  async function updateSettings(newSettings) {
    loading.value = true
    try {
      await axios.put('/api/settings', newSettings)
      settings.value = { ...newSettings }
      error.value = null
    } catch {
      error.value = 'Errore salvataggio impostazioni'
    } finally {
      loading.value = false
    }
  }

  // ── Theme Management (moved to store) ──────────────────────────────────────
  const themes = ["light","dark","retro","forest","wireframe","coffee"]
  const theme = ref(localStorage.getItem('theme') || 'dark')

  function setTheme(t) {
    theme.value = t
    localStorage.setItem('theme', t)
    try { document.documentElement.setAttribute('data-theme', t) } catch (e) {}
  }

  // Initialize document theme on store creation
  try { document.documentElement.setAttribute('data-theme', theme.value) } catch (e) {}

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
      error.value = 'Errore aggiunta insulina'
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
      error.value = 'Errore eliminazione insulina'
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
      error.value = 'Errore modifica insulina'
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
      error.value = 'Errore sync'
    } finally {
      loading.value = false
    }
  }

  async function fetchLongHistory(minutes = 4320) { // Default 3 giorni
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
      error.value = 'Errore caricamento analisi'
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
      error.value = 'Errore caricamento storico'
    } finally {
      historyLoading.value = false
    }
  }

  return {
    current, readings, insulinRecords, carbRecords, notes, selectedRange, carbDraftAmount, loading, chartLoading, error, lastUpdated,
    settings,
    historyReadings, historyInsulin, historyChartInsulin, historyCarbs, historyNotes, historyLoading,
    glucoseColor, minutesAgo, stats, historyStats, iob, cob, prediction, patterns,
    fetchCurrent, fetchReadings, fetchAll, setRange, syncNow, 
    addInsulin, removeInsulin, editInsulin,
    addCarb, removeCarb, editCarb,
    addNote, removeNote, editNote,
    fetchHistory, fetchLongHistory, fetchSettings, updateSettings, resetSettings, getStatusColor,
    // Theme API
    themes, theme, setTheme
  }
})
