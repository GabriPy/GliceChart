<template>
  <dialog ref="dialogRef" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box bg-base-200 sm:rounded-3xl rounded-t-3xl p-0 overflow-hidden border border-base-content/5 shadow-2xl max-w-xl w-full">
      <!-- Header -->
      <div class="flex items-center justify-between p-5 border-b border-base-content/5">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-accent/80 shadow-lg shadow-primary/20">
            <i class="fa-solid fa-syringe text-white text-lg"></i>
          </div>
          <div class="flex flex-col">
            <h3 class="font-black text-xl tracking-tight">Calcolatore Bolo</h3>
            <p class="text-[10px] opacity-40 font-bold uppercase tracking-widest">Formula standard ISF / CR / IOB</p>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="close" class="btn btn-ghost btn-sm btn-circle">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </form>
      </div>

      <div class="p-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
        <!-- Input Principali -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Glicemia -->
          <div class="flex flex-col gap-2 p-4 rounded-2xl bg-base-300/50">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-droplet text-sm text-primary"></i>
              <label class="text-[10px] font-black uppercase tracking-widest opacity-50">Glicemia Attuale</label>
            </div>
            <div class="flex items-end gap-1">
              <input type="number" v-model.number="inputGlucose" step="1" placeholder="0"
                class="input bg-transparent w-full text-left text-2xl font-black border-none focus:outline-none p-0 no-spinner" />
              <span class="text-[10px] font-bold opacity-40 mb-2">{{ $t('common.mgDl') }}</span>
            </div>
            <button v-if="store.current?.glucose" @click="inputGlucose = store.current.glucose"
              class="btn btn-xs btn-ghost rounded-lg w-fit text-[9px] font-black uppercase tracking-widest opacity-70 hover:opacity-100">
              <i class="fa-solid fa-bolt mr-1"></i> Usa valore reale ({{ store.current.glucose }})
            </button>
          </div>

          <!-- Carboidrati -->
          <div class="flex flex-col gap-2 p-4 rounded-2xl bg-base-300/50">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-wheat-awn text-sm text-accent"></i>
              <label class="text-[10px] font-black uppercase tracking-widest opacity-50">Carboidrati</label>
            </div>
            <div class="flex items-end gap-1">
              <input type="number" v-model.number="inputCarbs" step="1" placeholder="0"
                class="input bg-transparent w-full text-left text-2xl font-black border-none focus:outline-none p-0 no-spinner" />
              <span class="text-[10px] font-bold opacity-40 mb-2">{{ $t('common.gramSymbol') }}</span>
            </div>
            <div class="flex gap-1.5 flex-wrap pt-1">
              <button v-for="g in [20, 40, 60, 80, 100]" :key="g" @click="inputCarbs = g"
                class="btn btn-xs btn-ghost bg-base-300/70 rounded-lg text-[9px] font-black opacity-70 hover:opacity-100 hover:bg-accent hover:text-accent-content">
                {{ g }}{{ $t('common.gramSymbol') }}
              </button>
            </div>
          </div>

          <!-- Target -->
          <div class="flex flex-col gap-2 p-4 rounded-2xl bg-base-300/50">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-crosshairs text-sm text-success"></i>
              <label class="text-[10px] font-black uppercase tracking-widest opacity-50">Target (override)</label>
            </div>
            <div class="flex items-end gap-1">
              <input type="number" v-model.number="inputTarget" step="1"
                class="input bg-transparent w-full text-left text-2xl font-black border-none focus:outline-none p-0 no-spinner" />
              <span class="text-[10px] font-bold opacity-40 mb-2">{{ $t('common.mgDl') }}</span>
            </div>
            <div class="text-[9px] opacity-40 font-bold pt-1">
              Default: {{ defaultTarget }} mg/dL
            </div>
          </div>
        </div>

        <!-- Parametri Usati -->
        <div class="flex flex-col gap-2">
          <div class="text-[10px] uppercase font-black tracking-widest opacity-40 px-1">
            Parametri Terapia (da Impostazioni)
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="flex flex-col gap-1 p-3 rounded-xl bg-base-300/50">
              <span class="text-[8px] uppercase font-black opacity-40 tracking-widest">ISF</span>
              <div class="flex items-baseline gap-1">
                <span class="text-lg font-black">{{ settings.insulin_sensitivity }}</span>
                <span class="text-[9px] opacity-50 font-bold">mg/dL/U</span>
              </div>
            </div>
            <div class="flex flex-col gap-1 p-3 rounded-xl bg-base-300/50">
              <span class="text-[8px] uppercase font-black opacity-40 tracking-widest">Rapporto CR</span>
              <div class="flex items-baseline gap-1">
                <span class="text-lg font-black">{{ settings.carb_ratio }}</span>
                <span class="text-[9px] opacity-50 font-bold">g/U</span>
              </div>
            </div>
            <div class="flex flex-col gap-1 p-3 rounded-xl"
              :class="(iobActive || computedIOB > 0) ? 'bg-warning/10' : 'bg-base-300/50'">
              <span class="text-[8px] uppercase font-black opacity-40 tracking-widest">IOB Attivo</span>
              <div class="flex items-baseline gap-1">
                <span class="text-lg font-black" :class="computedIOB > 0 ? 'text-warning' : ''">{{ computedIOB.toFixed(1) }}</span>
                <span class="text-[9px] opacity-50 font-bold">U</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TAG Selector Tipo Pasto -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between px-1">
            <span class="text-[10px] uppercase font-black tracking-widest opacity-40">Tipo Pasto / Evento</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="(label, key) in mealTagButtons" :key="key" @click="selectedTag = key"
              class="btn btn-xs rounded-xl font-black tracking-widest text-[9px] transition-all"
              :class="selectedTag === key ? 'bg-primary text-primary-content shadow-md shadow-primary/20 border-none' : 'btn-ghost bg-base-300/50 opacity-70 hover:opacity-100'">
              {{ label }}
            </button>
            <button v-if="selectedTag === 'custom'"
              class="w-full text-[10px] font-bold text-primary mt-1 underline decoration-dotted underline-offset-4">
              Modalità Custom - inserisci tag dopo
            </button>
          </div>
        </div>

        <!-- Calcolo Dettagliato -->
        <div class="flex flex-col gap-3 p-5 rounded-2xl"
          :class="suggestedUnits > 12 ? 'bg-error/5 border border-error/20' : 'bg-gradient-to-br from-primary/10 via-transparent to-accent/10 border border-base-content/5'">
          <div class="text-[10px] uppercase font-black tracking-widest opacity-40">Calcolo Dettagliato</div>

          <div class="flex flex-col gap-1.5">
            <!-- Correzione -->
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-70">
                <i class="fa-solid fa-arrow-trend-up text-warning mr-2"></i>
                Correzione iperglicemia
              </span>
              <div class="flex items-center gap-2">
                <span v-if="correctionUnits > 0" class="text-xs opacity-50 font-mono">
                  ({{ inputGlucose }} - {{ finalTarget }}) / {{ settings.insulin_sensitivity }}
                </span>
                <span class="font-black text-lg" :class="correctionUnits > 0 ? 'text-warning' : 'opacity-30'">
                  {{ correctionUnits > 0 ? '+' : '' }}{{ correctionUnits.toFixed(1) }} U
                </span>
              </div>
            </div>

            <!-- Bolo carboidrati -->
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-70">
                <i class="fa-solid fa-bread-slice text-accent mr-2"></i>
                Bolo carboidrati
              </span>
              <div class="flex items-center gap-2">
                <span v-if="inputCarbs > 0" class="text-xs opacity-50 font-mono">
                  {{ inputCarbs }} / {{ settings.carb_ratio }}
                </span>
                <span class="font-black text-lg" :class="carbsUnits > 0 ? 'text-accent' : 'opacity-30'">
                  {{ carbsUnits > 0 ? '+' : '' }}{{ carbsUnits.toFixed(1) }} U
                </span>
              </div>
            </div>

            <!-- IOB -->
            <div v-if="computedIOB > 0" class="flex items-center justify-between">
              <span class="text-sm opacity-70">
                <i class="fa-solid fa-clock-rotate-left text-info mr-2"></i>
                Sottrazione IOB attivo
              </span>
              <div class="flex items-center gap-2">
                <span class="font-black text-lg text-info">
                  -{{ computedIOB.toFixed(1) }} U
                </span>
              </div>
            </div>

            <div class="h-px bg-base-content/5 my-1"></div>

            <!-- Totale -->
            <div class="flex items-center justify-between">
              <span class="text-base font-black uppercase tracking-wider">
                Suggerimento Calcolato
              </span>
              <span class="font-black text-3xl tracking-tight"
                :class="[
                  suggestedUnits <= 0 ? 'text-success' : '',
                  suggestedUnits > 8 && suggestedUnits <= 12 ? 'text-warning' : '',
                  suggestedUnits > 12 ? 'text-error' : ''
                ]">
                {{ suggestedUnits.toFixed(1) }}
                <span class="text-lg opacity-50 ml-1">U</span>
              </span>
            </div>
          </div>

          <div v-if="suggestedUnits <= 0" class="alert alert-success bg-success/10 border-success/20 text-success text-xs rounded-xl py-2 px-3">
            <i class="fa-solid fa-circle-info"></i>
            Nessuna insulina suggerita: IOB attivo copre correttamente o target già raggiunto.
          </div>
          <div v-else-if="suggestedUnits > 12" class="alert alert-error bg-error/10 border-error/20 text-error text-xs rounded-xl py-2 px-3">
            <i class="fa-solid fa-triangle-exclamation"></i>
            Dosaggio insolitamente alto (>12 U). Verifica input o consulta il medico prima di confermare.
          </div>
        </div>

        <!-- Override Unità Finale -->
        <div class="flex flex-col gap-2 p-4 rounded-2xl bg-base-300/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-pen-to-square text-sm text-primary"></i>
              <span class="text-[10px] font-black uppercase tracking-widest opacity-50">Unità da Salvare (override)</span>
            </div>
            <button @click="finalUnits = Math.max(0, suggestedUnits)"
              class="btn btn-xs btn-ghost rounded-lg text-[9px] font-black uppercase tracking-widest opacity-70 hover:opacity-100">
              <i class="fa-solid fa-rotate-left mr-1"></i> Ripristina suggerimento
            </button>
          </div>
          <div class="flex items-center gap-3">
            <button @click="finalUnits = Math.max(0, roundQuarter(finalUnits - 0.5))"
              class="btn btn-ghost btn-circle font-black">-</button>
            <input type="number" v-model.number="finalUnits" step="0.5" min="0"
              class="input input-lg bg-base-100 w-full text-center text-4xl font-black border-none focus:outline-none no-spinner rounded-2xl" />
            <button @click="finalUnits = roundQuarter(finalUnits + 0.5)"
              class="btn btn-ghost btn-circle font-black">+</button>
          </div>
          <div class="flex gap-1.5 justify-center">
            <button v-for="inc in [0.5, 1, 2, 4]" :key="inc"
              @click="finalUnits = Math.max(0, roundQuarter(suggestedUnits + inc))"
              class="btn btn-xs btn-ghost bg-base-300/60 rounded-lg text-[9px] font-black opacity-70 hover:opacity-100">
              +{{ inc }} U
            </button>
          </div>
        </div>

        <!-- Disclaimer Medico -->
        <div class="alert bg-warning/5 border-warning/20 text-warning/80 text-[10px] rounded-xl py-2.5 px-4 leading-relaxed">
          <i class="fa-solid fa-shield-halved"></i>
          <span class="font-bold tracking-wide">ATTENZIONE:</span> Questo strumento fornisce un suggerimento matematico basato sui parametri ISF/CR/IOB configurati. NON sostituisce il giudizio clinico. Confronta SEMPRE con il tuo medico o diabetologo prima di modificare la terapia.
        </div>

        <!-- Azioni Footer -->
        <div class="flex flex-col sm:flex-row gap-2 pt-1">
          <button @click="close" class="btn btn-ghost rounded-2xl font-black uppercase tracking-widest text-xs flex-1">
            Annulla
          </button>
          <button @click="confirmAndSave"
            :disabled="store.loading || finalUnits <= 0"
            class="btn rounded-2xl font-black uppercase tracking-widest text-xs flex-1"
            :class="finalUnits > 0 && !store.loading ? 'btn-primary shadow-lg shadow-primary/30' : 'btn-disabled'">
            <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>
            <i v-else class="fa-solid fa-syringe mr-2"></i>
            Conferma & Registra {{ finalUnits > 0 ? `(${finalUnits.toFixed(1)} U Rapida)` : '' }}
          </button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="close"></button>
    </form>
  </dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlucoseStore } from '../stores/glucose'

const { t } = useI18n()
const store = useGlucoseStore()

const emit = defineEmits(['close', 'saved'])

const dialogRef = ref(null)
const settings = computed(() => store.settings || {})

const defaultTarget = computed(() => {
  const s = settings.value
  if (s.tir_min && s.tir_max) {
    return Math.round((parseFloat(s.tir_min) + parseFloat(s.tir_max)) / 2)
  }
  return parseFloat(s.tir_min) || 100
})

// Parametri calcolo
const inputGlucose = ref(null)
const inputCarbs = ref(0)
const inputTarget = ref(null)
const selectedTag = ref(null)

const iobActive = ref(true)
const computedIOB = computed(() => {
  if (!iobActive.value) return 0
  if (typeof store.iob !== 'undefined' && store.iob !== null) return Number(store.iob) || 0
  try {
    let iob = 0
    const durationHours = parseFloat(settings.value.rapid_duration || 3)
    const now = Date.now()
    for (const rec of (store.insulinRecords || [])) {
      if (rec.type !== 'rapid') continue
      const recTime = new Date(rec.timestamp).getTime()
      const diffHours = (now - recTime) / (1000 * 60 * 60)
      if (diffHours < 0 || diffHours > durationHours) continue
      const remainingRatio = 1 - (diffHours / durationHours)
      iob += parseFloat(rec.units) * remainingRatio
    }
    return Math.max(0, iob)
  } catch { return 0 }
})

// Valore finale (con override)
const finalTarget = computed(() => parseFloat(inputTarget.value) || defaultTarget.value)

const correctionUnits = computed(() => {
  const g = parseFloat(inputGlucose.value) || 0
  const target = finalTarget.value
  const isf = parseFloat(settings.value.insulin_sensitivity) || 50
  if (g <= target || g <= 0) return 0
  return Math.max(0, (g - target) / isf)
})

const carbsUnits = computed(() => {
  const c = parseFloat(inputCarbs.value) || 0
  const cr = parseFloat(settings.value.carb_ratio) || 10
  if (c <= 0) return 0
  return c / cr
})

const suggestedUnits = computed(() => {
  const raw = correctionUnits.value + carbsUnits.value - computedIOB.value
  return Math.max(0, raw)
})

const finalUnits = ref(0)

// watcher: sincronizza finalUnits = suggerito + round quarter
watch(suggestedUnits, (v) => {
  if (Math.abs(v - finalUnits.value) > 0.4) {
    finalUnits.value = roundQuarter(v)
  }
}, { immediate: true })

const mealTagButtons = computed(() => ({
  breakfast: '🥐 Colazione',
  lunch: '🍝 Pranzo',
  dinner: '🍽️ Cena',
  snack: '🍎 Spuntino',
  correction: '💊 Correzione',
  custom: '✏️ Altro'
}))

function roundQuarter(v) {
  return Math.max(0, Math.round(v * 2) / 2)
}

// Get final tag string
function getFinalTag() {
  if (!selectedTag.value) return null
  if (selectedTag.value === 'custom') return null
  const mapping = {
    breakfast: 'Colazione', lunch: 'Pranzo', dinner: 'Cena',
    snack: 'Spuntino', correction: 'Correzione'
  }
  return mapping[selectedTag.value] || selectedTag.value
}

// Actions
function open() {
  nextTick(() => {
    dialogRef.value?.showModal()
    if (!inputGlucose.value && store.current?.glucose) {
      inputGlucose.value = store.current.glucose
    }
    finalUnits.value = roundQuarter(suggestedUnits.value)
  })
}

function close() {
  dialogRef.value?.close()
  emit('close')
}

async function confirmAndSave() {
  if (finalUnits.value <= 0 || store.loading) return
  try {
    await store.addInsulin('rapid', parseFloat(finalUnits.value.toFixed(2)), null, getFinalTag())
    close()
    emit('saved', { type: 'rapid', units: parseFloat(finalUnits.value.toFixed(2)), tag: getFinalTag() })
  } catch (err) {
    console.error('Errore salvat bolo', err)
  }
}

defineExpose({ open, close })
</script>
