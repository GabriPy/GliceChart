<template>
  <div class="flex flex-col gap-6">
    <div class="card bg-base-200 shadow-xl border border-base-content/5">
      <div class="card-body p-4 md:p-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-primary/10 rounded-2xl">
              <i class="fi fi-sr-chart-pie-alt text-primary text-xl"></i>
            </div>
            <div>
              <h2 class="text-lg font-black uppercase tracking-tight leading-none">Resoconto periodico</h2>
              <span class="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">Analisi 7 / 14 / 30 / 90 giorni</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex items-center gap-2 bg-base-300/50 p-1.5 rounded-2xl border border-base-content/5">
            <button
              v-for="d in ranges"
              :key="d"
              class="btn btn-ghost btn-xs px-3 font-black uppercase text-[9px] tracking-widest rounded-xl"
              :class="days === d ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'opacity-60 hover:opacity-100'"
              @click="setDays(d)"
            >
              {{ d }}g
            </button>
            </div>
            <div
              v-if="daysUsed && daysUsed < days"
              class="badge badge-warning badge-outline font-black uppercase tracking-widest text-[9px] py-3"
              :title="`Dati disponibili: ${daysUsed} giorni`"
            >
              Dati: {{ daysUsed }}g
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="relative">
      <div v-if="loading" class="absolute inset-0 z-10 bg-base-100/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
        <span class="loading loading-dots loading-md text-primary"></span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card bg-base-200 shadow-xl border border-base-content/5">
          <div class="card-body p-6 gap-5">
            <div class="flex items-center gap-2">
              <i class="fi fi-sr-stats text-success"></i>
              <span class="text-xs font-black uppercase tracking-widest opacity-50">Sintesi glicemica</span>
            </div>

            <div v-if="!hasData" class="py-10 text-center opacity-30">
              <div class="text-[10px] font-black uppercase tracking-widest">Nessun dato disponibile</div>
            </div>

            <template v-else>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-base-300/30 rounded-2xl p-4 border border-base-content/5">
                  <div class="text-[9px] font-black uppercase tracking-widest opacity-40">Media glicemica</div>
                  <div class="mt-1 flex items-end gap-2">
                    <div class="text-3xl font-black tracking-tight">{{ avg }}</div>
                    <div class="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">mg/dL</div>
                  </div>
                </div>

                <div class="bg-base-300/30 rounded-2xl p-4 border border-base-content/5">
                  <div class="text-[9px] font-black uppercase tracking-widest opacity-40">Variabilità (SD)</div>
                  <div class="mt-1 flex items-end justify-between gap-2">
                    <div class="flex items-end gap-2">
                      <div class="text-3xl font-black tracking-tight">{{ sd }}</div>
                      <div class="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">mg/dL</div>
                    </div>
                    <div class="px-2 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest"
                      :class="sdBadgeClass"
                    >
                      {{ sdLabel }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-base-300/30 rounded-2xl p-4 border border-base-content/5">
                <div class="flex items-center justify-between">
                  <div class="text-[9px] font-black uppercase tracking-widest opacity-40">Distribuzione</div>
                  <div class="text-[9px] font-black opacity-30 uppercase tracking-widest">Target {{ store.settings.tir_min }}-{{ store.settings.tir_max }}</div>
                </div>

                <div class="mt-3 w-full h-3 rounded-full overflow-hidden bg-base-300 border border-base-content/5 flex">
                  <div class="h-full bg-warning" :style="{ width: `${belowPct}%` }"></div>
                  <div class="h-full bg-success" :style="{ width: `${inRangePct}%` }"></div>
                  <div class="h-full bg-error" :style="{ width: `${abovePct}%` }"></div>
                </div>

                <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[9px] font-black uppercase tracking-widest opacity-50">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-warning"></span>
                    <span>Below {{ belowPct }}%</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-success"></span>
                    <span>In range {{ inRangePct }}%</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-error"></span>
                    <span>Above {{ abovePct }}%</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="card bg-base-200 shadow-xl border border-base-content/5">
          <div class="card-body p-6 gap-5">
            <div class="flex items-center gap-2">
              <i class="fi fi-sr-test text-primary"></i>
              <span class="text-xs font-black uppercase tracking-widest opacity-50">Stima HbA1c (GMI)</span>
            </div>

            <div v-if="!hasData" class="py-10 text-center opacity-30">
              <div class="text-[10px] font-black uppercase tracking-widest">Nessun dato disponibile</div>
            </div>

            <template v-else>
              <div class="bg-base-300/30 rounded-2xl p-4 border border-base-content/5">
                <div class="text-[9px] font-black uppercase tracking-widest opacity-40">GMI% stimata</div>
                <div class="mt-1 flex items-end justify-between gap-3">
                  <div class="flex items-end gap-2">
                    <div class="text-3xl font-black tracking-tight">{{ gmi.toFixed(1) }}</div>
                    <div class="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">%</div>
                  </div>
                  <div class="px-2 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest"
                    :class="gmiBadgeClass"
                  >
                    {{ gmiLabel }}
                  </div>
                </div>

                <div class="mt-4">
                  <div class="relative w-full h-3 rounded-full overflow-hidden bg-base-300 border border-base-content/5">
                    <div class="absolute inset-0 flex">
                      <div class="h-full bg-success" :style="{ width: `${gmiGreenWidth}%` }"></div>
                      <div class="h-full bg-warning" :style="{ width: `${gmiYellowWidth}%` }"></div>
                      <div class="h-full bg-error" :style="{ width: `${gmiRedWidth}%` }"></div>
                    </div>
                    <div
                      class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-base-100 bg-base-content"
                      :style="{ left: `calc(${gmiMarkerLeft}% - 6px)` }"
                      title="GMI stimata"
                    ></div>
                  </div>
                  <div class="mt-2 flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40">
                    <span>{{ gmiMin }}</span>
                    <span>{{ gmiMax }}</span>
                  </div>
                </div>
              </div>

              <div class="bg-base-300/30 rounded-2xl p-4 border border-base-content/5">
                <div class="flex items-center justify-between">
                  <div class="text-[9px] font-black uppercase tracking-widest opacity-40">Dati utilizzati</div>
                  <div class="text-[9px] font-black uppercase tracking-widest opacity-30">{{ daysUsed }} / {{ days }}</div>
                </div>
                <div class="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[9px] font-black uppercase tracking-widest opacity-40">
                  <span>Campioni: {{ sampleCount }}</span>
                  <span>Gap &gt; 15m: {{ gapCount }}</span>
                  <span v-if="avgIntervalMin">Intervallo: {{ avgIntervalMin }}m</span>
                </div>
                <div v-if="daysUsed < 14" class="mt-2 text-[10px] font-black text-warning uppercase tracking-widest opacity-80">
                  Dati inferiori a 14 giorni: risultati meno precisi
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div v-if="error" class="mt-4 alert alert-error shadow-lg">
        <span class="text-xs font-black uppercase tracking-widest">{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { useGlucoseStore } from '../stores/glucose'

const store = useGlucoseStore()

const ranges = [7, 14, 30, 90]
const days = ref(14)
const readings = ref([])
const loading = ref(false)
const error = ref(null)

function localDateKey(iso) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const hasData = computed(() => readings.value.length > 0)

const values = computed(() => readings.value.map(r => Number(r.glucose)).filter(v => Number.isFinite(v)))
const avg = computed(() => {
  if (!values.value.length) return 0
  return Math.round(values.value.reduce((a, b) => a + b, 0) / values.value.length)
})

const sd = computed(() => {
  if (!values.value.length) return 0
  const mean = values.value.reduce((a, b) => a + b, 0) / values.value.length
  const variance = values.value.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.value.length
  return Math.round(Math.sqrt(variance))
})

const sdLabel = computed(() => {
  const v = sd.value
  if (v <= 36) return 'Ottima'
  if (v <= 50) return 'Intermedia'
  return 'Alta'
})

const sdBadgeClass = computed(() => {
  if (sd.value <= 36) return 'bg-success/15 text-success border border-success/20'
  if (sd.value <= 50) return 'bg-warning/15 text-warning border border-warning/20'
  return 'bg-error/15 text-error border border-error/20'
})

const belowCount = computed(() => readings.value.filter(r => Number(r.glucose) < Number(store.settings.tir_min)).length)
const aboveCount = computed(() => readings.value.filter(r => Number(r.glucose) > Number(store.settings.tir_max)).length)
const inRangeCount = computed(() => readings.value.filter(r => {
  const g = Number(r.glucose)
  return g >= Number(store.settings.tir_min) && g <= Number(store.settings.tir_max)
}).length)

const belowPct = computed(() => hasData.value ? Math.round((belowCount.value / readings.value.length) * 100) : 0)
const abovePct = computed(() => hasData.value ? Math.round((aboveCount.value / readings.value.length) * 100) : 0)
const inRangePct = computed(() => {
  if (!hasData.value) return 0
  const fixed = 100 - belowPct.value - abovePct.value
  return Math.max(0, fixed)
})

const gmi = computed(() => 3.31 + (0.02392 * avg.value))
const gmiLabel = computed(() => {
  const v = gmi.value
  if (v < 7) return 'Buona'
  if (v < 8) return 'Intermedia'
  return 'Alta'
})
const gmiBadgeClass = computed(() => {
  const v = gmi.value
  if (v < 7) return 'bg-success/15 text-success border border-success/20'
  if (v < 8) return 'bg-warning/15 text-warning border border-warning/20'
  return 'bg-error/15 text-error border border-error/20'
})

const gmiMin = 5
const gmiMax = 12
const gmiRange = gmiMax - gmiMin
const gmiGreenWidth = ((7 - gmiMin) / gmiRange) * 100
const gmiYellowWidth = ((8 - 7) / gmiRange) * 100
const gmiRedWidth = 100 - gmiGreenWidth - gmiYellowWidth
const gmiMarkerLeft = computed(() => {
  const v = Math.min(gmiMax, Math.max(gmiMin, gmi.value))
  return ((v - gmiMin) / gmiRange) * 100
})

const daysUsed = computed(() => {
  const set = new Set(readings.value.map(r => localDateKey(r.timestamp)))
  return set.size
})

const sampleCount = computed(() => readings.value.length)

const gapCount = computed(() => {
  if (readings.value.length < 2) return 0
  let gaps = 0
  for (let i = 1; i < readings.value.length; i++) {
    const prev = new Date(readings.value[i - 1].timestamp).getTime()
    const cur = new Date(readings.value[i].timestamp).getTime()
    const diffMin = (cur - prev) / 60000
    if (diffMin >= 15) gaps++
  }
  return gaps
})

const avgIntervalMin = computed(() => {
  if (readings.value.length < 2) return 0
  const diffs = []
  for (let i = 1; i < readings.value.length; i++) {
    const prev = new Date(readings.value[i - 1].timestamp).getTime()
    const cur = new Date(readings.value[i].timestamp).getTime()
    const diffMin = (cur - prev) / 60000
    if (Number.isFinite(diffMin) && diffMin > 0 && diffMin < 240) diffs.push(diffMin)
  }
  if (!diffs.length) return 0
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
  return Math.round(avg)
})

async function fetchPeriod() {
  loading.value = true
  error.value = null
  try {
    await store.fetchSettings()
    const minutes = days.value * 24 * 60
    const { data } = await axios.get('/api/readings', { params: { range: minutes } })
    readings.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e?.response?.data?.error || 'Errore caricamento resoconto'
    readings.value = []
  } finally {
    loading.value = false
  }
}

function setDays(d) {
  days.value = d
  fetchPeriod()
}

onMounted(() => {
  fetchPeriod()
})
</script>
