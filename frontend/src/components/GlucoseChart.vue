<template>
  <div class="card bg-base-200/70 backdrop-blur-xl shadow-xl border border-white/10 h-full rounded-3xl overflow-hidden">
    <div class="card-body gap-4 p-6">

      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <span class="text-xs uppercase tracking-widest opacity-60 font-semibold">{{ title }}</span>
        <div class="flex items-center gap-2">
          <div v-if="!isHistory" class="flex items-center gap-1 bg-base-300/50 p-1 rounded-2xl">
            <button
              v-for="opt in ranges" :key="opt.v"
              class="btn btn-xs rounded-xl border-0"
              :class="store.selectedRange === opt.v ? 'bg-primary text-primary-content shadow-lg' : 'bg-transparent hover:bg-base-content/5'"
              @click="store.setRange(opt.v)"
            >{{ opt.l }}</button>
          </div>
          <button
            class="btn btn-xs btn-ghost rounded-full hover:bg-base-content/10"
            @click="resetZoom"
            title="Resetta zoom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      </div>

      <!-- Nessun dato (mostra solo se non siamo in fullDay/Calendario) -->
      <div v-if="!displayReadings.length && !loading && !fullDay" class="flex justify-center items-center py-16 opacity-40 text-sm font-medium">
        Nessun dato
      </div>

      <!-- Grafico (Sempre visibile se fullDay, altrimenti se ci sono dati o caricamento) -->
      <div v-else class="relative h-[300px] w-full bg-base-300/20 rounded-2xl p-2">
        <!-- Overlay caricamento per evitare flicker -->
        <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-base-200/80 backdrop-blur-xl transition-all rounded-2xl">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>
        <Line 
          ref="chartRef" 
          :data="chartData" 
          :options="chartOptions" 
          :plugins="chartPlugins"
        />
      </div>

      <!-- Legenda Insuline e Carboidrati -->
      <div class="flex flex-wrap items-center justify-center gap-5 mt-2">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-lg bg-[#6366f1] opacity-30"></div>
          <span class="text-[10px] font-semibold uppercase tracking-widest opacity-50">Azione Rapida</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-lg bg-[#ec4899] opacity-30"></div>
          <span class="text-[10px] font-semibold uppercase tracking-widest opacity-50">Azione Lenta</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-[#d97706]"></div>
          <span class="text-[10px] font-semibold uppercase tracking-widest opacity-50">Carboidrati</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-[#0ea5e9]"></div>
          <span class="text-[10px] font-semibold uppercase tracking-widest opacity-50">Note</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-lg bg-[#94a3b8] opacity-30"></div>
          <span class="text-[10px] font-semibold uppercase tracking-widest opacity-50">Gap Dati</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import zoomPlugin from 'chartjs-plugin-zoom'
import { useGlucoseStore } from '../stores/glucose'

// Rileva se siamo su mobile
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// Registra plugin solo se non mobile (performance)
if (!isMobile.value) {
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, annotationPlugin, zoomPlugin)
} else {
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)
}

const props = defineProps({
  readings: { type: Array, default: null },
  insulin: { type: Array, default: null },
  carbs: { type: Array, default: null },
  notes: { type: Array, default: null },
  title: { type: String, default: 'Storico' },
  loading: { type: Boolean, default: false },
  fullDay: { type: Boolean, default: false },
  date: { type: String, default: null },
  // When true (or when readings is provided) show contextual annotations (insulin/carbs/notes)
  showContextInfo: { type: Boolean, default: false }
})

const store = useGlucoseStore()
const chartRef = ref(null)
const hoveredInsulinId = ref(null)
const insulinLineHitboxes = ref([])

const isHistory = computed(() => props.readings !== null)
const displayReadings = computed(() => props.readings || store.readings)
const displayInsulin = computed(() => props.insulin || store.insulinRecords)
const displayCarbs = computed(() => props.carbs || store.carbRecords)
const displayNotes = computed(() => props.notes || store.notes)
const loading = computed(() => props.loading || store.chartLoading)

// showContext: true when explicitly asked or when using readings (historical view)
const showContext = computed(() => !!props.showContextInfo || isHistory.value)

// Groups overlapping insulin entries into clusters and orders items (slow first, then rapid; within each by startTime)
function getInsulinRenderingGroups(insArray = [], xMin, xMax) {
  const entries = (insArray || []).map(ins => {
    const start = new Date(ins.timestamp).getTime()
    const durHours = ins.type === 'rapid' ? Number(store.settings.rapid_duration) : Number(store.settings.slow_duration)
    const duration = (durHours && !isNaN(durHours) ? durHours : (ins.type === 'rapid' ? 3 : 24)) * 60 * 60 * 1000
    const end = start + duration
    return { ...ins, startTime: start, endTime: end }
  }).filter(e => !(e.endTime < xMin || e.startTime > xMax))

  entries.sort((a, b) => a.startTime - b.startTime)
  const groups = []
  entries.forEach(e => {
    let g = groups.find(g => e.startTime <= g.maxEnd)
    if (!g) { g = { items: [], maxEnd: e.endTime }; groups.push(g) }
    g.items.push(e)
    g.maxEnd = Math.max(g.maxEnd, e.endTime)
  })

  // Order within group: slow first, then rapid; within same type by startTime
  groups.forEach(g => {
    g.items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'slow' ? -1 : 1
      return a.startTime - b.startTime
    })
    g.items.forEach((it, idx) => { it._offsetIndex = idx })
  })

  return groups
}

const ranges = [
  { l: '1h',  v: 60 },
  { l: '3h',  v: 180 },
  { l: '6h',  v: 360 },
  { l: '24h', v: 1440 },
]

function ptColor(g) {
  const status = store.getStatusColor(g)
  if (status === 'text-error') return '#ef4444'
  if (status === 'text-warning') return '#f59e0b'
  return '#22c55e'
}

const chartPlugins = computed(() => {
  const plugins = []

  // Su mobile, disabilita i gradienti complessi per performance
  if (!isMobile.value) {
    plugins.push({
      id: 'gradient',
      beforeDatasetDraw: (chart) => {
        const ctx = chart.ctx
        const dataset = chart.data.datasets[0]
        if (dataset && chart.chartArea) {
          const gradient = ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom)
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)')
          gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)')
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)')
          dataset.backgroundColor = gradient
          
          const lineGradient = ctx.createLinearGradient(chart.chartArea.left, 0, chart.chartArea.right, 0)
          lineGradient.addColorStop(0, 'rgba(99, 102, 241, 0.7)')
          lineGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.9)')
          lineGradient.addColorStop(1, 'rgba(99, 102, 241, 0.7)')
          dataset.borderColor = lineGradient
        }
      }
    })
  }

  if (!isMobile.value) {
    plugins.push({
      id: 'insulinHover',
      afterEvent: (chart, args) => {
        const evt = args.event
        if (evt.type === 'mouseout' || evt.type === 'mouseleave') {
          if (hoveredInsulinId.value !== null) {
            hoveredInsulinId.value = null
            chart.update('none')
          }
          return
        }
        if (evt.type !== 'mousemove') return
        if (!insulinLineHitboxes.value || !insulinLineHitboxes.value.length) return
        if (!chart.scales.x || !chart.scales.y) return

        const canvasX = evt.x
        const canvasY = evt.y
        const xVal = chart.scales.x.getValueForPixel(canvasX)
        const yVal = chart.scales.y.getValueForPixel(canvasY)

        if (xVal === undefined || yVal === undefined) return

        let found = null
        for (const hb of insulinLineHitboxes.value) {
          if (xVal >= hb.xMin && xVal <= hb.xMax && yVal >= hb.yMin && yVal <= hb.yMax) {
            found = hb.id
            break
          }
        }
        if (found !== hoveredInsulinId.value) {
          hoveredInsulinId.value = found
          chart.update('none')
        }
      }
    })
  }

  return plugins
})

const chartData = computed(() => {
  // Su mobile, riduce il numero di punti per performance
  let readings = displayReadings.value
  if (isMobile.value && readings.length > 100) {
    // Prende ogni n-esimo punto per ridurre il carico
    const step = Math.ceil(readings.length / 100)
    readings = readings.filter((_, i) => i % step === 0)
  }

  return {
    datasets: [{
      data: readings.map(r => ({
        x: new Date(r.timestamp).getTime(),
        y: r.glucose
      })),
      pointBackgroundColor: readings.map(r => ptColor(r.glucose)),
      pointBorderColor: '#ffffff',
      // Radius più piccoli su mobile
      pointRadius: isMobile.value ? (readings.length > 50 ? 1.5 : 2) : (readings.length > 150 ? 2.5 : 4),
      pointHoverRadius: isMobile.value ? 4 : 8,
      tension: isMobile.value ? 0.3 : 0.45,
      fill: !isMobile.value, // Disabilita fill su mobile per performance
      borderWidth: isMobile.value ? 2 : 3,
      pointHoverBorderWidth: isMobile.value ? 1 : 2,
      pointHoverBorderColor: '#fff',
      pointBorderWidth: isMobile.value ? 0 : 1,
    }]
  }
})

const isToday = computed(() => {
  if (!props.date) return false
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return props.date === `${year}-${month}-${day}`
})

const resetZoom = () => {
  if (chartRef.value) {
    chartRef.value.chart?.resetZoom()
  }
}

const chartOptions = computed(() => {
  const maxReading = displayReadings.value.length > 0 
    ? Math.max(...displayReadings.value.map(r => r.glucose)) 
    : 300
  const yMax = Math.max(300, Math.ceil((maxReading + 10) / 10) * 10)
    const yMin = 0
    // Alzo leggermente la base delle linee di insulina per non stare troppo in basso
    const yBase = yMin + 10

  let xMin, xMax
  const nowTs = new Date().getTime()
  if (props.fullDay && props.date) {
    // Calcola inizio e fine giornata in fuso orario italiano (Europe/Rome)
    const [year, month, day] = props.date.split('-').map(Number)
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999)
    xMin = startDate.getTime()
    xMax = endDate.getTime()
  } else {
    // xMax è ora corrente per mostrare il gap se necessario
    xMax = nowTs
    xMin = nowTs - (store.selectedRange * 60 * 1000)
  }

  // Su mobile, usa annotations semplificate o nessuna
  const annotations = isMobile.value ? {} : {
    rangeBox: {
      type: 'box',
      yMin: store.settings.tir_min,
      yMax: store.settings.tir_max,
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
      borderColor: 'rgba(34, 197, 94, 0.2)',
      borderWidth: 1,
      drawTime: 'beforeDatasetsDraw',
    },
    tirMinLine: {
      type: 'line',
      yMin: store.settings.tir_min,
      yMax: store.settings.tir_min,
      borderColor: 'rgba(34, 197, 94, 0.3)',
      borderWidth: 1,
      borderDash: [6, 6],
    },
    tirMaxLine: {
      type: 'line',
      yMin: store.settings.tir_max,
      yMax: store.settings.tir_max,
      borderColor: 'rgba(34, 197, 94, 0.3)',
      borderWidth: 1,
      borderDash: [6, 6],
    }
  }

  const showNowLine = isToday.value && props.fullDay
  if (showNowLine && nowTs >= xMin && nowTs <= xMax && !isMobile.value) {
    annotations.nowLine = {
      type: 'line',
      xMin: nowTs,
      xMax: nowTs,
      borderColor: '#94a3b8',
      borderWidth: 2,
      borderDash: [4, 6],
      label: {
        display: true,
        content: 'ADESSO',
        position: 'start',
        backgroundColor: '#475569',
        color: 'white',
        font: { size: 9, weight: 'bold' },
        padding: 4,
        borderRadius: 8,
        yAdjust: -14
      }
    }
  }
  
  // Su mobile, non calcolare i gap per performance
  if (!isMobile.value && displayReadings.value.length > 0) {
    for (let i = 1; i < displayReadings.value.length; i++) {
      const prevTs = new Date(displayReadings.value[i - 1].timestamp).getTime()
      const ts = new Date(displayReadings.value[i].timestamp).getTime()
      const diffMin = (ts - prevTs) / 60000
      if (diffMin >= 10) {
        annotations[`gap-${i}`] = {
          type: 'box',
          xMin: prevTs,
          xMax: ts,
                  yMin: yMin,
          yMax: yMax,
          backgroundColor: 'rgba(71, 85, 105, 0.2)',
          borderWidth: 0,
          drawTime: 'beforeDatasetsDraw',
        }
      }
    }

    const lastReadingTs = displayReadings.value.length > 0 
      ? new Date(displayReadings.value[displayReadings.value.length - 1].timestamp).getTime() 
      : nowTs
    if ((nowTs - lastReadingTs) / 60000 >= 10) {
      annotations['gap-to-now'] = {
        type: 'box',
        xMin: lastReadingTs,
        xMax: xMax,
              yMin: yMin,
        yMax: yMax,
        backgroundColor: 'rgba(71, 85, 105, 0.2)',
        borderWidth: 0,
        drawTime: 'beforeDatasetsDraw',
      }
    }
  }

  // Show insulin/carbs/notes annotations only when in historical/context mode and not on mobile
  if (showContext.value && !isMobile.value) {
    displayInsulin.value.forEach((ins, idx) => {
      const startTime = new Date(ins.timestamp).getTime()
      const durationHours = ins.type === 'rapid' 
        ? store.settings.rapid_duration 
        : store.settings.slow_duration
      const endTime = startTime + durationHours * 60 * 60 * 1000

      if (endTime < xMin || startTime > xMax) return

      const color = ins.type === 'rapid' ? '#6366f1' : '#ec4899'
      
      // Vertical line at injection time with label
      if (startTime >= xMin && startTime <= xMax) {
        // Render insulin durations as baseline stacked horizontal lines using grouping to avoid vertical overlap
              // Compute groups and row offsets
              const insulinGroups = getInsulinRenderingGroups(displayInsulin.value || [], xMin, xMax)
              // determine maximum rows across groups
              let maxRows = 0
              insulinGroups.forEach(g => { maxRows = Math.max(maxRows, g.items.length) })

              // Determine row step (in y units). Start from ~2% of range, clamp to 6..14 mg/dL, but ensure total stacked height doesn't exceed 25% of chart range
              const totalRange = Math.max(1, yMax - yMin)
              let desiredStep = Math.max(2, Math.round(totalRange * 0.02))
              let rowStep = Math.min(14, Math.max(6, desiredStep))
              if (maxRows > 0 && (maxRows * rowStep) > (totalRange * 0.25)) {
                rowStep = Math.max(2, Math.floor((totalRange * 0.25) / maxRows))
              }

              const hitboxes = []
              insulinGroups.forEach(group => {
                group.items.forEach(item => {
                  const color = item.type === 'rapid' ? '#6366f1' : '#ec4899'
                  const offsetIndex = item._offsetIndex || 0
                  const yLine = yBase + (offsetIndex * rowStep)
                  const aKey = `insulin-${item.id}`
                  const isHovered = hoveredInsulinId.value === item.id
                  const hbXMin = Math.max(xMin, item.startTime)
                  const hbXMax = Math.min(xMax, item.endTime)
                  annotations[aKey] = {
                    type: 'line',
                    xMin: hbXMin,
                    xMax: hbXMax,
                    yMin: yLine,
                    yMax: yLine,
                    borderColor: color,
                    borderWidth: isHovered ? 5 : 3,
                    drawTime: 'beforeDatasetsDraw'
                  }

                  hitboxes.push({
                    id: item.id,
                    xMin: hbXMin,
                    xMax: hbXMax,
                    yMin: yLine - (rowStep * 0.45),
                    yMax: yLine + (rowStep * 0.45)
                  })

                  const durationMs = item.endTime - item.startTime
                  if (durationMs >= (15 * 60 * 1000)) {
                                        let labelFontSize = 10
                                        if (maxRows >= 4) labelFontSize = 9
                                        if (maxRows >= 6) labelFontSize = 8
                                        if (maxRows >= 8) labelFontSize = 7

                                        const labelPadding = labelFontSize <= 7 ? 3 : (labelFontSize === 8 ? 4 : 6)
                                        const labelRadius = Math.max(6, Math.min(10, Math.floor(labelPadding * 1.5)))

                                        const clampedAtStart = item.startTime <= xMin
                                        const labelXValue = clampedAtStart ? (xMin + 30 * 60 * 1000) : hbXMin
                                        const labelXAdjust = clampedAtStart ? 4 : 6

                                        annotations[`${aKey}-label`] = {
                                          type: 'label',
                                          display: isHovered,
                                          xValue: labelXValue,
                                          yValue: yLine,
                                          xAdjust: labelXAdjust,
                                          backgroundColor: color,
                                          color: 'white',
                                          content: `${Number(item.units || 0).toString().replace(',', '.')}U`,
                                          font: { size: labelFontSize, weight: '700' },
                                          padding: labelPadding,
                                          borderRadius: labelRadius,
                                          yAdjust: -6,
                                          drawTime: 'afterDraw'
                                        }
                  }
                })
              })
              insulinLineHitboxes.value = hitboxes
          }
    })

    displayCarbs.value.forEach((carb, idx) => {
      const carbTime = new Date(carb.timestamp).getTime()
      if (carbTime < xMin || carbTime > xMax) return

      let yValue = 100
      if (displayReadings.value.length > 0) {
        let closestIdx = 0
        let minDiff = Infinity
        displayReadings.value.forEach((r, i) => {
          const diff = Math.abs(new Date(r.timestamp).getTime() - carbTime)
          if (diff < minDiff) {
            minDiff = diff
            closestIdx = i
          }
        })
        yValue = displayReadings.value[closestIdx].glucose
      }

      annotations[`carb-${idx}`] = {
        type: 'point',
        xValue: carbTime,
        yValue: yValue,
        backgroundColor: 'rgba(217, 119, 6, 0.95)',
        radius: 10,
        borderWidth: 3,
          borderColor: 'white',
          label: {
          display: true,
          content: `${carb.amount}g`,
          position: 'top',
          color: '#d97706',
          font: { size: 11, weight: 'bold' },
          yAdjust: -18
        }
      }
    })

    displayNotes.value.forEach((note, idx) => {
      const noteTime = new Date(note.timestamp).getTime()
      if (noteTime < xMin || noteTime > xMax) return

      let yValue = 110
      if (displayReadings.value.length > 0) {
        let closestIdx = 0
        let minDiff = Infinity
        displayReadings.value.forEach((r, i) => {
          const diff = Math.abs(new Date(r.timestamp).getTime() - noteTime)
          if (diff < minDiff) {
            minDiff = diff
            closestIdx = i
          }
        })
        yValue = displayReadings.value[closestIdx].glucose
      }

      const label = String(note.text || '').trim()
      const shortLabel = label.length > 18 ? `${label.slice(0, 18)}…` : label

      annotations[`note-${idx}`] = {
        type: 'point',
        xValue: noteTime,
        yValue: yValue,
        backgroundColor: 'rgba(14, 165, 233, 0.95)',
        radius: 9,
        borderWidth: 3,
        borderColor: 'white',
        label: {
          display: !!shortLabel,
          content: shortLabel,
          position: 'top',
          color: '#0ea5e9',
          font: { size: 10, weight: 'bold' },
          yAdjust: -17
        }
      }
    })
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: isMobile.value ? 300 : 1000,
      easing: 'easeOutQuart'
    },
    interaction: { intersect: false, mode: 'nearest', axis: 'x' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        padding: isMobile.value ? 10 : 14,
        cornerRadius: isMobile.value ? 12 : 16,
        titleFont: { weight: '700' },
        bodyFont: { weight: '500' },
        callbacks: { 
          title: (items) => {
            if (!items.length) return ''
            return new Date(items[0].parsed.x).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
          },
          label: ctx => ` ${ctx.parsed.y} mg/dL`
        },
      },
      annotation: {
        annotations: annotations
      }
    },
    scales: {
      x: {
        type: 'linear',
        min: xMin,
        max: xMax,
        ticks: { 
          color: '#64748b', 
          maxTicksLimit: isMobile.value ? 6 : 8, 
          font: { family: 'DM Mono', size: isMobile.value ? 10 : 11, weight: '500' },
          callback: (value) => {
            return new Date(value).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
          }
        },
        grid: { 
          color: 'rgba(148, 163, 184, 0.06)',
          drawBorder: false
        },
      },
      y: {
        min: yMin, 
        max: yMax,
        ticks: { 
          color: '#64748b', 
          stepSize: yMax > 300 ? Math.ceil((yMax - yMin) / 5) : 54, 
          font: { family: 'DM Mono', size: 11, weight: '500' } 
        },
        grid: { 
          color: 'rgba(148, 163, 184, 0.06)',
          drawBorder: false
        },
      },
    },
  }
})
</script>
