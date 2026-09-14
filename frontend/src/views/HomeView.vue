<template>
  <div class="flex flex-col gap-4 md:gap-6 px-2 md:px-4 lg:px-0 pb-16">
    <!-- Header Dashboard con PageHeader -->
    <PageHeader
      :title="$t('home.dashboardTitle')"
      :subtitle="$t('home.realtimeStatus')"
      icon="fa-solid fa-house"
      variant="primary"
    >
      <template #actions>
        <button
          @click="store.syncNow"
          class="btn btn-ghost btn-sm font-bold gap-2 border border-base-content/10 hover:bg-base-300"
          :disabled="store.loading"
        >
          <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>
          <i v-else class="fa-solid fa-rotate text-primary"></i>
          <span>Aggiorna</span>
        </button>
      </template>
    </PageHeader>

    <!-- Riga 1: Glicemia Attuale + Grafico -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch">
      <div class="lg:col-span-4 flex">
        <CurrentGlucose class="flex-1" />
      </div>
      <div class="lg:col-span-8 flex">
        <GlucoseChart class="flex-1" />
      </div>
    </div>

    <!-- Riga 2: Statistiche Cliniche (TIR, Media, ecc.) -->
    <div class="w-full">
      <DailyStats />
    </div>

    <!-- Riga 3: Inserimento rapido -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
      <!-- Insulina Rapida Card -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-primary shadow-sm rounded-2xl">
        <div class="card-body p-4 md:p-6 gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 md:p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20 text-primary">
              <i class="fa-solid fa-syringe text-lg md:text-xl"></i>
            </div>
            <div>
              <h3 class="text-sm md:text-base font-bold text-base-content">{{ $t('home.insulinSection') }}</h3>
              <p class="text-xs text-base-content/60 font-medium">{{ $t('home.quickEntryNow') }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 md:gap-3">
            <button
              @click="quickInsulinUnits = Math.max(0, quickInsulinUnits - 0.5)"
              class="btn btn-sm btn-ghost btn-circle border border-base-content/10"
              :aria-label="'-0.5 ' + $t('common.units')"
            >-</button>
            <input
              v-model.number="quickInsulinUnits"
              type="number"
              step="0.5"
              class="input input-bordered text-center font-bold text-lg md:text-xl flex-1 bg-base-100/50"
            />
            <button
              @click="quickInsulinUnits += 0.5"
              class="btn btn-sm btn-ghost btn-circle border border-base-content/10"
              :aria-label="'+0.5 ' + $t('common.units')"
            >+</button>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 w-full">
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="val in insulinPresets"
                :key="`ins-${val}`"
                class="btn btn-xs rounded-lg font-bold border border-base-content/10 bg-base-100/60"
                @click="quickInsulinUnits = val"
              >
                {{ val }}{{ $t('common.unitSymbol') }}
              </button>
            </div>

            <div class="flex flex-wrap gap-1.5 ml-auto">
              <button
                class="btn btn-xs rounded-lg font-bold"
                :class="quickInsulinType === 'rapid' ? 'btn-primary' : 'btn-ghost bg-base-100/60 border-base-content/10'"
                @click="quickInsulinType = 'rapid'"
              >
                {{ $t('home.rapid') }}
              </button>
              <button
                class="btn btn-xs rounded-lg font-bold"
                :class="quickInsulinType === 'slow' ? 'btn-secondary' : 'btn-ghost bg-base-100/60 border-base-content/10'"
                @click="quickInsulinType = 'slow'"
              >
                {{ $t('home.slow') }}
              </button>
            </div>
          </div>

          <div class="flex items-center pt-1">
            <button
              class="btn btn-sm md:btn-md font-bold rounded-xl w-full"
              :class="quickInsulinType === 'rapid' ? 'btn-primary' : 'btn-secondary'"
              :disabled="savingInsulin || quickInsulinUnits <= 0"
              @click="saveQuickInsulin"
            >
              <span v-if="savingInsulin" class="loading loading-spinner loading-xs"></span>
              <template v-else>
                <i class="fa-regular fa-floppy-disk mr-1"></i>
                {{ $t('home.saveInsulin') }}
              </template>
            </button>
          </div>
        </div>
      </div>

      <!-- Carboidrati Card -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-accent shadow-sm rounded-2xl">
        <div class="card-body p-4 md:p-6 gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 md:p-3 bg-accent/10 rounded-xl ring-1 ring-accent/20 text-accent">
              <i class="fa-solid fa-bread-slice text-lg md:text-xl"></i>
            </div>
            <div>
              <h3 class="text-sm md:text-base font-bold text-base-content">{{ $t('home.carbsSection') }}</h3>
              <p class="text-xs text-base-content/60 font-medium">{{ $t('home.quickEntryNow') }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 md:gap-3">
            <button
              @click="quickCarbs = Math.max(0, quickCarbs - 5)"
              class="btn btn-sm btn-ghost btn-circle border border-base-content/10"
              :aria-label="'-5 ' + $t('common.grams')"
            >-</button>
            <input
              v-model.number="quickCarbs"
              type="number"
              step="1"
              class="input input-bordered text-center font-bold text-lg md:text-xl flex-1 bg-base-100/50"
            />
            <button
              @click="quickCarbs += 5"
              class="btn btn-sm btn-ghost btn-circle border border-base-content/10"
              :aria-label="'+5 ' + $t('common.grams')"
            >+</button>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="val in carbPresets"
              :key="`carb-${val}`"
              class="btn btn-xs rounded-lg font-bold border border-base-content/10 bg-base-100/60"
              @click="quickCarbs = val"
            >
              {{ val }}{{ $t('common.gramSymbol') }}
            </button>
          </div>

          <div class="flex items-center pt-1">
            <button
              class="btn btn-accent btn-sm md:btn-md font-bold rounded-xl w-full"
              :disabled="savingCarbs || quickCarbs <= 0"
              @click="saveQuickCarbs"
            >
              <span v-if="savingCarbs" class="loading loading-spinner loading-xs"></span>
              <template v-else>
                <i class="fa-regular fa-floppy-disk mr-1"></i>
                {{ $t('home.saveCho') }}
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
import PageHeader from '../components/PageHeader.vue'
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

let interval = null
onMounted(async () => {
  await store.fetchAll()
  const refreshInterval = window.innerWidth < 768 ? 120_000 : 60_000
  interval = setInterval(() => store.fetchAll(), refreshInterval)
})
onUnmounted(() => clearInterval(interval))
</script>