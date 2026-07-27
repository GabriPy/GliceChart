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
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import zoomPlugin from 'chartjs-plugin-zoom'
import { useGlucoseStore } from '../stores/glucose'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, annotationPlugin, zoomPlugin)

const props = defineProps({
  readings: { type: Array, default: null },
  insulin: { type: Array, default: null },
  carbs: { type: Array, default: null },
  notes: { type: Array, default: null },
  title: { type: String, default: 'Storico' },
  loading: { type: Boolean, default: false },
  fullDay: { type: Boolean, default: false },
  date: { type: String, default: null }
})

const store = useGlucoseStore()
const chartRef = ref(null)

const isHistory = computed(() => props.readings !== null)
const displayReadings = computed(() => props.readings || store.readings)
const displayInsulin = computed(() => props.insulin || store.insulinRecords)
const displayCarbs = computed(() => props.carbs || store.carbRecords)
const displayNotes = computed(() => props.notes || store.notes)
const loading = computed(() => props.loading || store.chartLoading)

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

const chartPlugins = computed(() => [
  {
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
  }
])

const chartData = computed(() => {
  return {
    datasets: [{
      data: displayReadings.value.map(r => ({
        x: new Date(r.timestamp).getTime(),
        y: r.glucose
      })),
      pointBackgroundColor: displayReadings.value.map(r => ptColor(r.glucose)),
      pointBorderColor: '#ffffff',
      pointRadius: displayReadings.value.length > 150 ? 2.5 : 4,
      pointHoverRadius: 8,
      tension: 0.45,
      fill: true,
      borderWidth: 3,
      pointHoverBorderWidth: 2,
      pointHoverBorderColor: '#fff',
      pointBorderWidth: 1,
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
  console.log('GlucoseChart chartOptions:', {
    displayReadings: displayReadings.value,
    propsReadings: props.readings,
    storeReadings: store.readings,
    readingTimestamps: displayReadings.value.map(r => new Date(r.timestamp)),
  })
  
  const maxReading = displayReadings.value.length > 0 
    ? Math.max(...displayReadings.value.map(r => r.glucose)) 
    : 300
  const yMax = Math.max(300, Math.ceil((maxReading + 10) / 10) * 10)
  const yMin = 40 // Temporary fixed yMin to test daily chart

  let xMin, xMax
  const nowTs = new Date().getTime()
  if (props.fullDay && props.date) {
    // Calcola inizio e fine giornata in fuso orario italiano (Europe/Rome)
    const [year, month, day] = props.date.split('-').map(Number)
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999)
    xMin = startDate.getTime()
    xMax = endDate.getTime()
    console.log('fullDay mode:', { propsDate: props.date, startDate, endDate, xMin, xMax })
  } else {
    // xMax è ora corrente per mostrare il gap se necessario
    xMax = nowTs
    xMin = nowTs - (store.selectedRange * 60 * 1000)
  }

  const annotations = {
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
  if (showNowLine && nowTs >= xMin && nowTs <= xMax) {
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
  
  if (displayReadings.value.length > 0) {
    for (let i = 1; i < displayReadings.value.length; i++) {
      const prevTs = new Date(displayReadings.value[i - 1].timestamp).getTime()
      const ts = new Date(displayReadings.value[i].timestamp).getTime()
      const diffMin = (ts - prevTs) / 60000
      if (diffMin >= 10) {
        annotations[`gap-${i}`] = {
          type: 'box',
          xMin: prevTs,
          xMax: ts,
          yMin: 40,
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
        yMin: 40,
        yMax: yMax,
        backgroundColor: 'rgba(71, 85, 105, 0.2)',
        borderWidth: 0,
        drawTime: 'beforeDatasetsDraw',
      }
    }
  }

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
      annotations[`insulin-line-${idx}`] = {
        type: 'line',
        xMin: startTime,
        xMax: startTime,
        borderColor: color,
        borderWidth: 2,
        borderDash: [4, 5],
        label: {
          display: true,
          content: `${ins.units.toString().replace(',', '.')}U`,
          position: 'start',
          backgroundColor: color,
          color: 'white',
          font: { size: 10, weight: 'bold' },
          padding: 5,
          borderRadius: 10
        }
      }
    }

    // Horizontal "tacchetta" at the bottom of the chart
    annotations[`insulin-bottom-line-${idx}`] = {
      type: 'line',
      xMin: Math.max(xMin, startTime),
      xMax: Math.min(xMax, endTime),
      yMin: 40,
      yMax: 40,
      borderColor: color,
      borderWidth: 4,
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

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    interaction: { intersect: false, mode: 'nearest', axis: 'x' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        padding: 14,
        cornerRadius: 16,
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
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        min: xMin,
        max: xMax,
        ticks: { 
          color: '#64748b', 
          maxTicksLimit: 8, 
          font: { family: 'DM Mono', size: 11, weight: '500' },
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
