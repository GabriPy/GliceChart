<template>
  <div class="card bg-base-200/70 backdrop-blur-xl shadow-xl border border-white/10 h-full rounded-3xl overflow-hidden">
    <div class="card-body gap-4 p-6">

      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <span class="text-xs uppercase tracking-widest opacity-60 font-semibold">{{ title || $t('charts.currentTrend') }}</span>
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
            :title="$t('charts.resetZoom')"
            :aria-label="$t('charts.resetZoom')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      </div>

      <!-- Nessun dato (mostra solo se non siamo in fullDay/Calendario) -->
      <div v-if="!displayReadings.length && !loading && !fullDay" class="flex justify-center items-center py-16 opacity-40 text-sm font-medium">
        {{ $t('charts.noData') }}
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
          <span class="text-[10px] font-semibold uppercase tracking-widest opacity-50">{{ $t('charts.rapidAction') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-lg bg-[#ec4899] opacity-30"></div>
          <span class="text-[10px] font-semibold uppercase tracking-widest opacity-50">{{ $t('charts.slowAction') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-[#d97706]"></div>
          <span class="text-[10px] font-semibold uppercase tracking-widest opacity-50">{{ $t('charts.carbohydrates') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-[#0ea5e9]"></div>
          <span class="text-[10px] font-semibold uppercase tracking-widest opacity-50">{{ $t('charts.notes') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-lg bg-[#94a3b8] opacity-30"></div>
          <span class="text-[10px] font-semibold uppercase tracking-widest opacity-50">{{ $t('charts.dataGap') }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import zoomPlugin from 'chartjs-plugin-zoom'
import { useGlucoseStore } from '../stores/glucose'

const { t, locale } = useI18n()

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
  title: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  fullDay: { type: Boolean, default: false },
  date: { type: String, default: null },
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

const showContext = computed(() => !!props.showContextInfo || isHistory.value)

function getInsulinRenderingGroups(insArray = [], xMin, xMax) {
  const entries = (insArray || []).map(ins => {
    const start = new Date(ins.timestamp).getTime()
    const durHours = ins.type === 'rapid' ? Number(store.settings.rapid_duration) : Number(store.settings.slow_duration)
    const duration = (durHours && !isNaN(durHours) ? durHours : (ins.type === 'rapid' ? 3 : 24)) * 60 * 60 * 1000
    const end = start + duration
    return { ...ins, startTime: start, endTime: end }
  }).filter(e => !(e.endTime < xMin || e.startTime > xMax))

  const slowEntries = entries.filter(e => e.type === 'slow').sort((a, b) => a.startTime - b.startTime)
  const rapidEntries = entries.filter(e => e.type === 'rapid').sort((a, b) => a.startTime - b.startTime)
  
  const rows = []
  
  slowEntries.forEach(entry => {
    let placed = false
    for (let r = 0; r < rows.length; r++) {
      const lastInRow = rows[r][rows[r].length - 1]
      if (entry.startTime >= lastInRow.endTime) {
        rows[r].push(entry)
        entry.assignedRow = r
        placed = true
        break
      }
    }
    if (!placed) {
      entry.assignedRow = rows.length
      rows.push([entry])
    }
  })

  rapidEntries.forEach(entry => {
    let placed = false
    for (let r = 0; r < rows.length; r++) {
      const lastInRow = rows[r][rows[r].length - 1]
      if (entry.startTime >= lastInRow.endTime) {
        rows[r].push(entry)
        entry.assignedRow = r
        placed = true
        break
      }
    }
    if (!placed) {
      entry.assignedRow = rows.length
      rows.push([entry])
    }
  })

  const groups = rows.map(items => ({ items, maxEnd: Math.max(...items.map(i => i.endTime)) }))
  
  return groups
}

const ranges = computed(() => [
  { l: t('charts.ranges.h1'),  v: 60 },
  { l: t('charts.ranges.h3'),  v: 180 },
  { l: t('charts.ranges.h6'),  v: 360 },
  { l: t('charts.ranges.h24'), v: 1440 },
])

function ptColor(g) {
  const status = store.getStatusColor(g)
  if (status === 'text-error') return '#ef4444'
  if (status === 'text-warning') return '#f59e0b'
  return '#22c55e'
}

const chartPlugins = computed(() => {
  const plugins = []

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
  let readings = displayReadings.value
  if (isMobile.value && readings.length > 100) {
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
      pointRadius: isMobile.value ? (readings.length > 50 ? 1.5 : 2) : (readings.length > 150 ? 2.5 : 4),
      pointHoverRadius: isMobile.value ? 4 : 8,
      tension: isMobile.value ? 0.3 : 0.45,
      fill: !isMobile.value,
      borderWidth: isMobile.value ? 2 : 3,
      pointHoverBorderWidth: isMobile.value ? 1 : 2,
      pointHoverBorderColor: '#fff',
      pointBorderWidth: isMobile.value ? 0 : 1,
    }]
  }
})

const resetZoom = () => {
  if (chartRef.value) {
    chartRef.value.chart?.resetZoom()
  }
}

const chartOptions = computed(() => {
  const activeLoc = locale.value === 'en' ? 'en-US' : 'it-IT'
  const maxReading = displayReadings.value.length > 0 
    ? Math.max(...displayReadings.value.map(r => r.glucose)) 
    : 300
  const yMax = Math.max(300, Math.ceil((maxReading + 10) / 10) * 10)
  const yMin = 0
  const yBase = yMin + 10

  let xMin, xMax
  const nowTs = new Date().getTime()
  if (props.fullDay && props.date) {
    const [year, month, day] = props.date.split('-').map(Number)
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999)
    xMin = startDate.getTime()
    xMax = endDate.getTime()
  } else {
    xMin = nowTs - (store.selectedRange * 60 * 1000)
    xMax = nowTs
  }

  const annotations = {
    tirBox: {
      type: 'box',
      yMin: store.settings.tir_min,
      yMax: store.settings.tir_max,
      backgroundColor: 'rgba(34, 197, 94, 0.04)',
      borderWidth: 0,
    },
    tirMinLine: {
      type: 'line',
      yMin: store.settings.tir_min,
      yMax: store.settings.tir_min,
      borderColor: 'rgba(34, 197, 94, 0.4)',
      borderWidth: 1.5,
      borderDash: [6, 6],
    },
    tirMaxLine: {
      type: 'line',
      yMin: store.settings.tir_max,
      yMax: store.settings.tir_max,
      borderColor: 'rgba(34, 197, 94, 0.4)',
      borderWidth: 1.5,
      borderDash: [6, 6],
    }
  }

  if (displayReadings.value.length >= 2) {
    const sorted = [...displayReadings.value].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    let gapIndex = 0
    for (let i = 1; i < sorted.length; i++) {
      const prevTime = new Date(sorted[i - 1].timestamp).getTime()
      const currTime = new Date(sorted[i].timestamp).getTime()
      const diffMinutes = (currTime - prevTime) / 60000

      if (diffMinutes >= 15) {
        const gapStart = Math.max(prevTime, xMin)
        const gapEnd = Math.min(currTime, xMax)
        if (gapEnd > gapStart) {
          annotations[`gapBox-${gapIndex}`] = {
            type: 'box',
            xMin: gapStart,
            xMax: gapEnd,
            yMin: yMin,
            yMax: yMax,
            backgroundColor: 'rgba(148, 163, 184, 0.12)',
            borderWidth: 0,
            drawTime: 'beforeDatasetsDraw'
          }
          gapIndex++
        }
      }
    }
  }

  if (showContext.value) {
    const groups = getInsulinRenderingGroups(displayInsulin.value, xMin, xMax)
    const newHitboxes = []

    groups.forEach((group) => {
      group.items.forEach((ins, insIdx) => {
        const start = ins.startTime
        const end = ins.endTime
        const durationHours = (end - start) / (60 * 60 * 1000)
        const isRapid = ins.type === 'rapid'
        const isHovered = hoveredInsulinId.value === ins.id
        
        const row = ins.assignedRow !== undefined ? ins.assignedRow : 0
        const rowSpacing = isMobile.value ? 7 : 9
        const yOffset = yBase + (row * rowSpacing)

        const startX = Math.max(start, xMin)
        const endX = Math.min(end, xMax)
        if (endX <= startX) return

        const hitYRadius = 4
        newHitboxes.push({
          id: ins.id,
          xMin: startX,
          xMax: endX,
          yMin: yOffset - hitYRadius,
          yMax: yOffset + hitYRadius
        })

        const baseColor = isRapid ? '#6366f1' : '#ec4899'
        const lineColor = isHovered ? (isRapid ? '#4f46e5' : '#db2777') : baseColor
        const lineWidth = isHovered ? (isMobile.value ? 3.5 : 5) : (isMobile.value ? 2 : 3)

        annotations[`insLine-${ins.id || insIdx}`] = {
          type: 'line',
          xMin: startX,
          xMax: endX,
          yMin: yOffset,
          yMax: yOffset,
          borderColor: lineColor,
          borderWidth: lineWidth,
          borderDash: isRapid ? [] : [4, 4],
          drawTime: 'beforeDatasetsDraw'
        }

        if (start >= xMin && start <= xMax) {
          annotations[`insStart-${ins.id || insIdx}`] = {
            type: 'point',
            xValue: start,
            yValue: yOffset,
            backgroundColor: isHovered ? (isRapid ? '#4f46e5' : '#db2777') : (isRapid ? '#6366f1' : '#ec4899'),
            radius: isHovered ? (isMobile.value ? 3.5 : 4.5) : (isMobile.value ? 2.5 : 3),
            borderWidth: 1,
            borderColor: 'white',
            drawTime: 'beforeDatasetsDraw',
            label: {
              display: true,
              content: `${ins.units}U`,
              position: 'center',
              color: 'white',
              font: { size: isMobile.value ? 7 : 8, weight: 'bold' }
            }
          }
        }

        if (end >= xMin && end <= xMax) {
          annotations[`insEnd-${ins.id || insIdx}`] = {
            type: 'point',
            xValue: end,
            yValue: yOffset,
            backgroundColor: isRapid ? '#6366f1' : '#ec4899',
            radius: isMobile.value ? 1.5 : 2,
            borderWidth: 1,
            borderColor: 'white',
            drawTime: 'beforeDatasetsDraw'
          }
        }
      })
    })

    insulinLineHitboxes.value = newHitboxes

    displayCarbs.value.forEach((carb, idx) => {
      const carbTime = new Date(carb.timestamp).getTime()
      if (carbTime < xMin || carbTime > xMax) return

      let yValue = 150
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
            return new Date(items[0].parsed.x).toLocaleTimeString(activeLoc, { hour: '2-digit', minute: '2-digit' })
          },
          label: ctx => ` ${ctx.parsed.y} ${t('common.mgDl')}`
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
            return new Date(value).toLocaleTimeString(activeLoc, { hour: '2-digit', minute: '2-digit' })
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
