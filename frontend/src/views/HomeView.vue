<template>
  <div class="space-y-3">
    <!-- Riga 1: Glicemia Attuale + Grafico -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
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
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <div class="card bg-base-200/70 backdrop-blur-xl shadow-xl border border-white/10 rounded-3xl overflow-hidden">
        <div class="card-body p-5 gap-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs uppercase tracking-widest opacity-60 font-semibold">Insulina rapida</div>
              <div class="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-1">Inserimento veloce adesso</div>
            </div>
            <div class="flex items-center gap-1 bg-base-300/50 p-1 rounded-2xl">
              <button
                class="btn btn-xs rounded-xl border-0"
                :class="quickInsulinType === 'rapid' ? 'bg-primary text-primary-content' : 'bg-transparent hover:bg-base-content/5'"
                @click="quickInsulinType = 'rapid'"
              >Rapida</button>
              <button
                class="btn btn-xs rounded-xl border-0"
                :class="quickInsulinType === 'slow' ? 'bg-secondary text-secondary-content' : 'bg-transparent hover:bg-base-content/5'"
                @click="quickInsulinType = 'slow'"
              >Lenta</button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button @click="quickInsulinUnits = Math.max(0, quickInsulinUnits - 0.5)" class="btn btn-sm btn-ghost btn-circle">-</button>
            <input
              v-model.number="quickInsulinUnits"
              type="number"
              step="0.5"
              class="input input-bordered bg-base-300/40 text-center font-black text-xl flex-1"
            />
            <button @click="quickInsulinUnits += 0.5" class="btn btn-sm btn-ghost btn-circle">+</button>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="val in [1, 2, 4, 6, 10]"
              :key="`ins-${val}`"
              class="btn btn-xs btn-ghost rounded-xl bg-base-300/40"
              @click="quickInsulinUnits = val"
            >{{ val }}U</button>
          </div>

          <button
            class="btn btn-primary rounded-2xl font-black uppercase tracking-widest text-[10px]"
            :disabled="store.loading || quickInsulinUnits <= 0"
            @click="saveQuickInsulin"
          >
            <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>
            <span v-else>Salva insulina</span>
          </button>
        </div>
      </div>

      <div class="card bg-base-200/70 backdrop-blur-xl shadow-xl border border-white/10 rounded-3xl overflow-hidden">
        <div class="card-body p-5 gap-4">
          <div>
            <div class="text-xs uppercase tracking-widest opacity-60 font-semibold">Carboidrati</div>
            <div class="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-1">Inserimento veloce adesso</div>
          </div>

          <div class="flex items-center gap-3">
            <button @click="quickCarbs = Math.max(0, quickCarbs - 5)" class="btn btn-sm btn-ghost btn-circle">-</button>
            <input
              v-model.number="quickCarbs"
              type="number"
              step="1"
              class="input input-bordered bg-base-300/40 text-center font-black text-xl flex-1"
            />
            <button @click="quickCarbs += 5" class="btn btn-sm btn-ghost btn-circle">+</button>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="val in [10, 20, 30, 45, 60]"
              :key="`carb-${val}`"
              class="btn btn-xs btn-ghost rounded-xl bg-base-300/40"
              @click="quickCarbs = val"
            >{{ val }}g</button>
          </div>

          <button
            class="btn btn-accent rounded-2xl font-black uppercase tracking-widest text-[10px]"
            :disabled="store.loading || quickCarbs <= 0"
            @click="saveQuickCarbs"
          >
            <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>
            <span v-else>Salva CHO</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useGlucoseStore } from '../stores/glucose'
import CurrentGlucose from '../components/CurrentGlucose.vue'
import GlucoseChart   from '../components/GlucoseChart.vue'
import DailyStats     from '../components/DailyStats.vue'

const store = useGlucoseStore()
const quickInsulinType = ref('rapid')
const quickInsulinUnits = ref(0)
const quickCarbs = ref(0)

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
  await store.addInsulin(quickInsulinType.value, quickInsulinUnits.value)
  if (!store.error) quickInsulinUnits.value = 0
}

async function saveQuickCarbs() {
  await store.addCarb(quickCarbs.value)
  if (!store.error) quickCarbs.value = 0
}

// ── Auto-refresh ogni 60s ─────────────────────────────────────────────────────
let interval = null
onMounted(async () => {
  await store.fetchAll()
  interval = setInterval(() => store.fetchAll(), 60_000)
})
onUnmounted(() => clearInterval(interval))
</script>
