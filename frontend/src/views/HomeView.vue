<template>
  <div class="flex flex-col gap-4 md:gap-6 lg:gap-8 px-2 md:px-4 lg:px-0">
    <!-- Header Dashboard Home -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-base-200 to-base-300 shadow-lg md:shadow-xl lg:shadow-2xl shadow-black/5 md:shadow-black/10 border border-base-content/10 rounded-2xl md:rounded-3xl">
      <div
        class="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-primary/15 rounded-full blur-2xl md:blur-3xl opacity-70">
      </div>
      <div class="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-accent/15 rounded-xl md:blur-2xl opacity-70">
      </div>

      <div class="relative card-body p-4 md:p-6 lg:p-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div class="flex items-center gap-3 md:gap-4">
            <div
              class="p-3 md:p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl md:rounded-2xl shadow-md md:shadow-lg shadow-primary/30">
              <i class="fa-solid fa-house text-primary text-xl md:text-2xl"></i>
            </div>
            <div>
              <h2 class="text-lg md:text-2xl font-black uppercase tracking-tight leading-none">Dashboard</h2>
              <span class="text-[10px] md:text-xs font-black opacity-40 uppercase tracking-[0.2em]">Situazione
                Glicemica in Tempo Reale</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Riga 1: Glicemia Attuale + Grafico -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch">
      <div class="lg:col-span-4 flex">
        <CurrentGlucose class="flex-1" />
      </div>
      <div class="lg:col-span-8 flex">
        <GlucoseChart class="flex-1" />
      </div>
    </div>

    <!-- Riga 2: Statistiche (TIR, Media, ecc.) -->
    <div class="w-full">
      <DailyStats />
    </div>

    <!-- Riga 3: Inserimento rapido -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
      <!-- Insulina Rapida Card -->
      <div
        class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
        <div class="card-body p-4 md:p-6 gap-4 md:gap-6">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl shadow-sm">
              <i class="fa-solid fa-syringe text-primary text-lg md:text-xl"></i>
            </div>
            <div>
              <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Insulina</h3>
              <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">Inserimento
                Veloce Adesso</span>
            </div>
          </div>

          <div class="flex items-center gap-2 md:gap-3">
            <button @click="quickInsulinUnits = Math.max(0, quickInsulinUnits - 0.5)"
              class="btn btn-sm btn-ghost btn-circle shadow-sm">-</button>
            <input v-model.number="quickInsulinUnits" type="number" step="0.5"
              class="input input-bordered bg-base-100/50 text-center font-black text-lg md:text-xl flex-1 shadow-sm" />
            <button @click="quickInsulinUnits += 0.5" class="btn btn-sm btn-ghost btn-circle shadow-sm">+</button>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 w-full">
            <div class="flex flex-wrap items-center gap-2">
              <button v-for="val in insulinPresets" :key="`ins-${val}`"
                class="btn btn-xs rounded-lg md:rounded-xl bg-base-100/50 border border-base-content/10 font-black shadow-sm"
                @click="quickInsulinUnits = val">{{ val }}U</button>
            </div>

            <div class="flex flex-wrap gap-2 ml-auto">
              <button
                class="btn btn-xs rounded-lg md:rounded-xl border-0 font-black uppercase tracking-widest shadow-sm"
                :class="quickInsulinType === 'rapid' ? 'bg-primary text-primary-content hover:bg-primary' : 'bg-base-100/50 hover:bg-base-content/5'"
                @click="quickInsulinType = 'rapid'">Rapida</button>
              <button
                class="btn btn-xs rounded-lg md:rounded-xl border-0 font-black uppercase tracking-widest shadow-sm"
                :class="quickInsulinType === 'slow' ? 'bg-secondary text-secondary-content hover:bg-secondary' : 'bg-base-100/50 hover:bg-base-content/5'"
                @click="quickInsulinType = 'slow'">Lenta</button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              class="btn rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] mx-auto border-0 shadow-md md:shadow-lg"
              :class="quickInsulinType === 'rapid'
                ? 'btn-primary shadow-primary/40'
                : 'bg-secondary text-secondary-content hover:bg-secondary shadow-secondary/40'"
              :disabled="savingInsulin || quickInsulinUnits <= 0" @click="saveQuickInsulin">
              <span v-if="savingInsulin" class="loading loading-spinner loading-xs"></span>
              <template v-else>
                <i class="fa-regular fa-floppy-disk mr-1"></i>
                Salva Insulina
              </template>
            </button>
          </div>
        </div>
      </div>

      <!-- Carboidrati Card -->
      <div
        class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
        <div class="card-body p-4 md:p-6 gap-4 md:gap-6">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-accent/10 rounded-lg md:rounded-xl shadow-sm">
              <i class="fa-solid fa-bread-slice text-accent text-lg md:text-xl"></i>
            </div>
            <div>
              <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Carboidrati</h3>
              <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">Inserimento
                Veloce Adesso</span>
            </div>
          </div>

          <div class="flex items-center gap-2 md:gap-3">
            <button @click="quickCarbs = Math.max(0, quickCarbs - 5)"
              class="btn btn-sm btn-ghost btn-circle shadow-sm">-</button>
            <input v-model.number="quickCarbs" type="number" step="1"
              class="input input-bordered bg-base-100/50 text-center font-black text-lg md:text-xl flex-1 shadow-sm" />
            <button @click="quickCarbs += 5" class="btn btn-sm btn-ghost btn-circle shadow-sm">+</button>
          </div>

          <div class="flex flex-wrap gap-2">
            <button v-for="val in carbPresets" :key="`carb-${val}`"
              class="btn btn-xs rounded-lg md:rounded-xl bg-base-100/50 border border-base-content/10 font-black shadow-sm"
              @click="quickCarbs = val">{{ val }}g</button>
          </div>

          <div class="flex items-center gap-3">
            <button
              class="btn btn-accent rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] mx-auto shadow-md md:shadow-lg shadow-accent/40"
              :disabled="savingCarbs || quickCarbs <= 0" @click="saveQuickCarbs">
              <span v-if="savingCarbs" class="loading loading-spinner loading-xs"></span>
              <template v-else>
                <i class="fa-regular fa-floppy-disk mr-1"></i>
                Salva CHO
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { useGlucoseStore } from '../stores/glucose'
import CurrentGlucose from '../components/CurrentGlucose.vue'
import GlucoseChart from '../components/GlucoseChart.vue'
import DailyStats from '../components/DailyStats.vue'

const store = useGlucoseStore()
const quickInsulinType = ref('rapid')
const quickInsulinUnits = ref(0)
const quickCarbs = ref(0)
const savingInsulin = ref(false)
const savingCarbs = ref(false)

const insulinPresets = computed(() => {
  const s = store.settings || {}
  return [s.quick_insulin_1 ?? 1, s.quick_insulin_2 ?? 2, 4, 6]
})

const carbPresets = computed(() => {
  const s = store.settings || {}
  return [s.quick_carb_1 ?? 10, s.quick_carb_2 ?? 20, 30, 60]
})

watch(quickInsulinUnits, (value) => {
  if (value === null || value === undefined) return
  const rounded = Math.max(0, Math.round(Number(value) * 2) / 2)
  if (rounded !== value) quickInsulinUnits.value = rounded
})

watch(quickCarbs, (value) => {
  if (value === null || value === undefined) return
  const rounded = Math.max(0, Math.round(Number(value)))
  if (rounded !== value) quickCarbs.value = rounded
})

async function saveQuickInsulin() {
  if (savingInsulin.value || quickInsulinUnits.value <= 0) return

  savingInsulin.value = true
  try {
    await store.addInsulin(quickInsulinType.value, quickInsulinUnits.value)
    if (!store.error) quickInsulinUnits.value = 0
  } finally {
    savingInsulin.value = false
  }
}

async function saveQuickCarbs() {
  if (savingCarbs.value || quickCarbs.value <= 0) return

  savingCarbs.value = true
  try {
    await store.addCarb(quickCarbs.value)
    if (!store.error) quickCarbs.value = 0
  } finally {
    savingCarbs.value = false
  }
}

// ── Auto-refresh: 60s su desktop, 120s su mobile per performance ─────────────────────
let interval = null
onMounted(async () => {
  await store.fetchAll()
  // Su mobile usa intervallo più lungo per risparmiare batteria e risorse
  const refreshInterval = window.innerWidth < 768 ? 120_000 : 60_000
  interval = setInterval(() => store.fetchAll(), refreshInterval)
})
onUnmounted(() => clearInterval(interval))
</script>