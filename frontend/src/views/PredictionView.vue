<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="card bg-base-200 shadow-sm border border-base-content/10">
      <div class="card-body p-6">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-secondary/10 rounded-2xl">
            <i class="fa-solid fa-chart-line text-secondary text-2xl leading-none"></i>
          </div>
          <div>
            <h1 class="text-3xl font-black uppercase tracking-tight leading-none italic">Predizione Glicemia</h1>
            <p class="text-xs font-black opacity-30 uppercase tracking-[0.2em] mt-2">Algoritmo Predittivo v2.0</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Nessun dato -->
    <div v-if="!store.readings.length && !store.loading"
      class="flex flex-col items-center justify-center py-20 opacity-30 gap-4">
      <i class="fa-solid fa-database text-4xl"></i>
      <span class="text-base font-black uppercase tracking-widest">Dati insufficienti per la predizione</span>
    </div>

    <!-- Main Chart -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="card bg-base-200 shadow-sm border border-base-content/10 h-[450px]">
          <div class="card-body p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-black uppercase tracking-widest opacity-40">Andamento e Previsione (60
                min)</span>
              <div class="badge badge-secondary badge-outline font-black text-[10px] uppercase tracking-widest">Live
                Forecast</div>
            </div>
            <div class="relative flex-1 h-full">
              <Line v-if="chartData" :data="chartData" :options="chartOptions" />
            </div>
          </div>
        </div>
      </div>

      <!-- Info Panel -->
      <div class="flex flex-col gap-6">
        <!-- Target Prediction -->
        <div class="card shadow-sm border border-base-content/10 overflow-hidden" :class="riskColorClass">
          <div class="card-body p-6 items-center text-center">
            <span class="text-xs font-black uppercase tracking-[0.2em] opacity-60">Stima a 60 min</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-7xl font-black tracking-tighter italic">
                {{ store.prediction?.t60 || '--' }}
              </span>
              <span class="text-base font-bold opacity-60 uppercase">mg/dL</span>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2 w-full border-t border-current/10 pt-4">
              <div class="flex flex-col">
                <span class="text-[10px] font-black uppercase opacity-50 text-current">15m</span>
                <span class="text-xl font-black italic leading-none">{{ store.prediction?.t15 || '--' }}</span>
              </div>
              <div class="flex flex-col border-x border-current/10">
                <span class="text-[10px] font-black uppercase opacity-50 text-current">30m</span>
                <span class="text-xl font-black italic leading-none">{{ store.prediction?.t30 || '--' }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-black uppercase opacity-50 text-current">Trend</span>
                <span class="text-xl font-black italic leading-none">{{ store.prediction?.roc > 0 ? '+' : '' }}{{
                  store.prediction?.roc || '0.00' }}</span>
              </div>
            </div>

            <div class="mt-4 w-full">
              <div class="badge w-full py-4 font-black text-xs uppercase tracking-widest border-none"
                :class="riskBadgeClass">
                Rischio: {{ riskLabelText }}
              </div>
            </div>
          </div>
        </div>

        <!-- How it works -->
        <div class="card bg-base-200 shadow-sm border border-base-content/10 flex-1">
          <div class="card-body p-6 gap-4">
            <span class="text-xs font-black uppercase tracking-widest opacity-40">Stato Attuale (Smussato)</span>
            <div class="space-y-3">
              <div class="flex items-center justify-between bg-base-300/30 p-3 rounded-2xl">
                <div class="flex items-center gap-3">
                  <div class="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                  <span class="text-xs font-black uppercase opacity-60">Glicemia Media (5m)</span>
                </div>
                <span class="text-sm font-black">{{ store.prediction?.current }} mg/dL</span>
              </div>

              <div class="flex items-center justify-between bg-base-300/30 p-3 rounded-2xl">
                <div class="flex items-center gap-3">
                  <div class="w-2.5 h-2.5 rounded-full" :class="trendIconColor"></div>
                  <span class="text-xs font-black uppercase opacity-60">Velocità (ROC)</span>
                </div>
                <span class="text-sm font-black">{{ store.prediction?.roc }} mg/m</span>
              </div>

              <div class="flex items-center justify-between bg-base-300/30 p-3 rounded-2xl">
                <div class="flex items-center gap-3">
                  <div class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  <span class="text-xs font-black uppercase opacity-60">IOB Attiva</span>
                </div>
                <span class="text-sm font-black">{{ store.iob.toFixed(1) }} U</span>
              </div>

              <div class="flex items-center justify-between bg-base-300/30 p-3 rounded-2xl">
                <div class="flex items-center gap-3">
                  <div class="w-2.5 h-2.5 rounded-full bg-accent"></div>
                  <span class="text-xs font-black uppercase opacity-60">COB Attivi</span>
                </div>
                <span class="text-sm font-black">{{ Math.round(store.cob) }} g</span>
              </div>
            </div>

            <p class="text-[11px] opacity-40 italic mt-auto leading-relaxed">
              * Algoritmo Matematico v2.0 (Linear ROC + IOB/COB + Smoothing). Non utilizzare per decisioni mediche.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Spiegazione Algoritmo -->
    <div class="card bg-base-200 shadow-sm border border-base-content/10">
      <div class="card-body p-6 gap-6">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-circle-info text-primary text-lg"></i>
          <span class="text-sm font-black uppercase tracking-widest opacity-50">Come funziona la previsione? (Algoritmo
            v2.0)</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="flex flex-col gap-2">
            <span class="text-xs font-black uppercase text-secondary italic">1. Smussamento</span>
            <p class="text-sm opacity-70 leading-relaxed">
              Viene calcolata la media mobile delle ultime 5 letture (25 min) per ridurre il rumore del sensore ed
              evitare previsioni troppo aggressive causate da singoli salti.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-xs font-black uppercase text-secondary italic">2. Rate of Change (ROC)</span>
            <p class="text-sm opacity-70 leading-relaxed">
              Si analizza la velocità di variazione (mg/dL al minuto) dell'ultima mezz'ora. Se la variazione è rapida (>
              2 mg/dL/m), viene applicato un fattore correttivo del +15%.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-xs font-black uppercase text-secondary italic">3. Impatto Insulina (IOB)</span>
            <p class="text-sm opacity-70 leading-relaxed">
              Utilizza la tua <strong>Sensibilità (ISF)</strong> impostata per sottrarre l'effetto dell'insulina che
              deve ancora agire nei prossimi 60 minuti dalla proiezione lineare.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-xs font-black uppercase text-secondary italic">4. Impatto Carboidrati (COB)</span>
            <p class="text-sm opacity-70 leading-relaxed">
              Calcola il rialzo previsto in base al tuo <strong>Rapporto I/C</strong>. Ogni grammo di carboidrati
              residui alza la proiezione seguendo una curva di assorbimento lineare.
            </p>
          </div>
        </div>

        <div class="divider opacity-5 my-0"></div>

        <div class="bg-base-300/30 p-5 rounded-2xl border border-base-content/5">
          <p class="text-xs font-bold opacity-40 uppercase tracking-widest text-center italic">
            Formula: Glicemia_Predetta = (Glicemia_Media + ROC * Minuti) - Impatto_Insulina_Futuro + Impatto_CHO_Futuro
          </p>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { useGlucoseStore } from '../stores/glucose'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, annotationPlugin)

const store = useGlucoseStore()

// ── Auto-refresh ogni 60s ─────────────────────────────────────────────────────
let interval = null
onMounted(async () => {
  await store.fetchAll()
  interval = setInterval(() => store.fetchAll(), 60_000)
})
onUnmounted(() => clearInterval(interval))

const riskColorClass = computed(() => {
  if (store.prediction?.risk === 'high') return 'bg-error text-error-content'
  if (store.prediction?.risk === 'normal') return 'bg-warning text-warning-content'
  return 'bg-success text-success-content'
})

const riskBadgeClass = computed(() => {
  if (store.prediction?.risk === 'high') return 'bg-black/20 text-white'
  if (store.prediction?.risk === 'normal') return 'bg-black/10 text-black/60'
  return 'bg-black/10 text-black/60'
})

const riskLabelText = computed(() => {
  const labels = { high: 'ALTO', normal: 'MEDIO', low: 'BASSO' }
  return labels[store.prediction?.risk] || 'N/A'
})

const trendIconColor = computed(() => {
  const t = store.prediction?.trend
  if (t?.includes('fast')) return 'bg-error'
  if (t?.includes('rising') || t?.includes('falling')) return 'bg-warning'
  return 'bg-success'
})

const chartData = computed(() => {
  if (!store.readings.length) return null

  // Dati passati (ultimi 120 min)
  const pastData = store.readings.map(r => ({
    x: new Date(r.timestamp).getTime(),
    y: r.glucose
  }))

  // Punti predizione (15, 30, 60 min)
  const nowTs = new Date().getTime()
  const predictionData = [
    { x: nowTs, y: store.prediction?.current },
    { x: nowTs + 15 * 60000, y: store.prediction?.t15 },
    { x: nowTs + 30 * 60000, y: store.prediction?.t30 },
    { x: nowTs + 60 * 60000, y: store.prediction?.t60 }
  ]

  return {
    datasets: [
      {
        label: 'Glicemia Reale',
        data: pastData,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        fill: true,
        tension: 0.3,
        pointRadius: 1
      },
      {
        label: 'Predizione',
        data: predictionData,
        borderColor: '#f43f5e',
        borderWidth: 3,
        borderDash: [5, 5],
        pointBackgroundColor: '#f43f5e',
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.4
      }
    ]
  }
})

const chartOptions = computed(() => {
  const nowTs = new Date().getTime()
  const xMin = nowTs - 90 * 60000 // Mostriamo 90 min di storia
  const xMax = nowTs + 70 * 60000 // E 70 min di futuro

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    scales: {
      x: {
        type: 'linear',
        min: xMin,
        max: xMax,
        ticks: {
          callback: (val) => new Date(val).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
          font: { size: 9, family: 'DM Mono' },
          maxTicksLimit: 10
        },
        grid: { color: 'rgba(255,255,255,0.03)' }
      },
      y: {
        min: 40,
        max: Math.max(250, store.prediction?.t60 + 50 || 250),
        ticks: { font: { size: 9, family: 'DM Mono' } },
        grid: { color: 'rgba(255,255,255,0.03)' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        callbacks: {
          title: (items) => new Date(items[0].parsed.x).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} mg/dL`
        }
      },
      annotation: {
        annotations: {
          nowLine: {
            type: 'line',
            xMin: nowTs,
            xMax: nowTs,
            borderColor: '#94a3b8',
            borderWidth: 2,
            borderDash: [2, 2],
            label: {
              display: true,
              content: 'ADESSO',
              position: 'start',
              backgroundColor: '#475569',
              font: { size: 8, weight: 'bold' }
            }
          },
          targetRange: {
            type: 'box',
            yMin: store.settings.tir_min,
            yMax: store.settings.tir_max,
            backgroundColor: 'rgba(34, 197, 94, 0.02)',
            borderWidth: 0
          }
        }
      }
    }
  }
})
</script>
