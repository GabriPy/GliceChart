<template>
  <div class="flex flex-col gap-4 md:gap-6 lg:gap-8 px-2 md:px-4 lg:px-0">
    <!-- Header Dashboard Impostazioni -->
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
              <i class="fa-solid fa-gear text-primary text-xl md:text-2xl"></i>
            </div>
            <div>
              <h2 class="text-lg md:text-2xl font-black uppercase tracking-tight leading-none">Dashboard Impostazioni
              </h2>
              <span class="text-[10px] md:text-xs font-black opacity-40 uppercase tracking-[0.2em]">Configurazione
                Glicemia & Terapia</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <!-- Left Column - Critical Settings -->
      <div class="lg:col-span-2 space-y-4 md:space-y-6">
        <!-- Range Glicemico Card - Full Width -->
        <div
          class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
          <div class="card-body p-4 md:p-6 gap-4 md:gap-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-center gap-2 md:gap-3">
                <div class="p-2 md:p-3 bg-success/10 rounded-lg md:rounded-xl shadow-sm">
                  <i class="fa-solid fa-chart-line text-success text-lg md:text-xl"></i>
                </div>
                <div>
                  <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Range Glicemico</h3>
                  <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">Target Time In
                    Range</span>
                </div>
              </div>
              <div class="flex items-center gap-2 px-3 py-1 bg-success/10 rounded-lg shadow-sm">
                <span class="text-xs font-bold text-success">{{ tirRange }}</span>
                <span class="text-[10px] font-bold opacity-50">mg/dL</span>
              </div>
            </div>

            <!-- Visual Range Preview -->
            <div
              class="relative h-8 md:h-10 bg-base-100 rounded-lg overflow-hidden border border-base-content/10 shadow-sm">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full h-full bg-gradient-to-r from-error via-success to-error opacity-20"></div>
              </div>
              <div class="absolute inset-0 flex items-center justify-between px-3 md:px-4">
                <div class="w-2 md:w-3 h-2 md:h-3 rounded-full bg-error shadow-md shadow-error/30"></div>
                <div class="flex-1 mx-2 md:mx-3 h-1 md:h-1.5 bg-success/50 rounded shadow-sm shadow-success/20"></div>
                <div class="w-2 md:w-3 h-2 md:h-3 rounded-full bg-error shadow-md shadow-error/30"></div>
              </div>
              <div class="absolute inset-0 flex items-center justify-between px-3 md:px-4 text-xs md:text-sm font-bold">
                <span
                  class="bg-error/50 font-black px-2 py-1 rounded-lg backdrop-blur-sm border border-error/10 shadow-sm">{{
                  form.red_under }}</span>
                <span
                  class="bg-success/50 font-black drop-shadow-md px-3 py-1 rounded-lg backdrop-blur-sm border border-success/10 shadow-sm">{{
                  form.tir_min }} - {{ form.tir_max }}</span>
                <span
                  class="bg-error/50 text-black font-black px-2 py-1 rounded-lg backdrop-blur-sm border border-error/10 shadow-sm">{{
                  form.red_over }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <div class="space-y-1 md:space-y-2 min-w-0">
                <label class="text-[10px] font-black uppercase opacity-40">Soglia Bassa</label>
                <input type="number" v-model.number="form.red_under"
                  class="input input-bordered font-black border-error/30 focus:border-error w-full input-xs md:input-sm" />
              </div>
              <div class="space-y-1 md:space-y-2 min-w-0">
                <label class="text-[10px] font-black uppercase opacity-40">Target Min</label>
                <input type="number" v-model.number="form.tir_min"
                  class="input input-bordered font-black border-success/30 focus:border-success w-full input-xs md:input-sm" />
              </div>
              <div class="space-y-1 md:space-y-2 min-w-0">
                <label class="text-[10px] font-black uppercase opacity-40">Target Max</label>
                <input type="number" v-model.number="form.tir_max"
                  class="input input-bordered font-black border-success/30 focus:border-success w-full input-xs md:input-sm" />
              </div>
              <div class="space-y-1 md:space-y-2 min-w-0">
                <label class="text-[10px] font-black uppercase opacity-40">Soglia Alta</label>
                <input type="number" v-model.number="form.red_over"
                  class="input input-bordered font-black border-error/30 focus:border-error w-full input-xs md:input-sm" />
              </div>
            </div>
          </div>
        </div>

        <!-- Insulina e Carboidrati Card -->
        <div
          class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
          <div class="card-body p-4 md:p-6 gap-4 md:gap-6">
            <div class="flex items-center gap-2 md:gap-3">
              <div class="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl shadow-sm">
                <i class="fa-solid fa-syringe text-primary text-lg md:text-xl"></i>
              </div>
              <div>
                <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Insulina & Carboidrati</h3>
                <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">Parametri di
                  Azione</span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <!-- Durata Azione -->
              <div class="space-y-3 md:space-y-4">
                <div class="flex items-center gap-2 mb-2">
                  <i class="fa-regular fa-clock text-primary text-sm"></i>
                  <span class="text-[10px] font-black uppercase opacity-50">Durata Azione (Ore)</span>
                </div>
                <div class="space-y-2 md:space-y-3">
                  <div class="flex items-center gap-2 md:gap-3">
                    <div
                      class="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <i class="fa-solid fa-bolt text-primary text-[9px] md:text-xs"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <label class="text-[8px] md:text-[9px] font-black uppercase opacity-40">Rapida</label>
                      <input type="number" v-model.number="form.rapid_duration"
                        class="input input-bordered font-black input-xs md:input-sm w-full" />
                    </div>
                  </div>
                  <div class="flex items-center gap-2 md:gap-3">
                    <div
                      class="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <i class="fa-regular fa-hourglass-half text-secondary text-[9px] md:text-xs"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <label class="text-[8px] md:text-[9px] font-black uppercase opacity-40">Lenta</label>
                      <input type="number" v-model.number="form.slow_duration"
                        class="input input-bordered font-black input-xs md:input-sm w-full" />
                    </div>
                  </div>
                  <div class="flex items-center gap-2 md:gap-3">
                    <div
                      class="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <i class="fa-solid fa-bread-slice text-accent text-[9px] md:text-xs"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <label class="text-[8px] md:text-[9px] font-black uppercase opacity-40">Carboidrati (COB)</label>
                      <input type="number" v-model.number="form.carb_duration"
                        class="input input-bordered font-black input-xs md:input-sm border-accent/30 w-full" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Parametri Predizione -->
              <div class="space-y-3 md:space-y-4">
                <div class="flex items-center gap-2 mb-2">
                  <i class="fa-solid fa-calculator text-secondary text-sm"></i>
                  <span class="text-[10px] font-black uppercase opacity-50">Sensibilità & Assorbimento</span>
                </div>
                <div class="space-y-2 md:space-y-3">
                  <div class="space-y-1 md:space-y-2">
                    <label class="text-[9px] font-black uppercase opacity-40">Sensibilità Insulina</label>
                    <div class="flex items-center gap-2">
                      <input type="number" v-model.number="form.insulin_sensitivity"
                        class="input input-bordered font-black flex-1 min-w-0 input-xs md:input-sm" />
                      <span class="text-[9px] md:text-[10px] font-bold opacity-30 whitespace-nowrap flex-shrink-0">mg/dL
                        per 1U</span>
                    </div>
                  </div>
                  <div class="space-y-1 md:space-y-2">
                    <label class="text-[9px] font-black uppercase opacity-40">Rapporto I/C</label>
                    <div class="flex items-center gap-2">
                      <input type="number" v-model.number="form.carb_ratio"
                        class="input input-bordered font-black flex-1 min-w-0 input-xs md:input-sm" />
                      <span class="text-[9px] md:text-[10px] font-bold opacity-30 whitespace-nowrap flex-shrink-0">g per
                        1U</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Presets Card -->
        <div
          class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
          <div class="card-body p-4 md:p-6 gap-4 md:gap-6">
            <div class="flex items-center gap-2 md:gap-3">
              <div class="p-2 md:p-3 bg-accent/10 rounded-lg md:rounded-xl shadow-sm">
                <i class="fa-solid fa-bolt text-accent text-lg md:text-xl"></i>
              </div>
              <div>
                <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Quick Presets</h3>
                <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">Homepage Quick
                  Actions</span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div class="space-y-2 md:space-y-3">
                <label class="text-[10px] font-black uppercase opacity-50">Insulina (Unità)</label>
                <div class="grid grid-cols-2 gap-2 md:gap-3">
                  <div class="space-y-1 min-w-0">
                    <label class="text-[9px] font-black opacity-30">Preset 1</label>
                    <input type="number" v-model.number="form.quick_insulin_1"
                      class="input input-bordered font-black border-accent/30 w-full input-xs md:input-sm" />
                  </div>
                  <div class="space-y-1 min-w-0">
                    <label class="text-[9px] font-black opacity-30">Preset 2</label>
                    <input type="number" v-model.number="form.quick_insulin_2"
                      class="input input-bordered font-black border-accent/30 w-full input-xs md:input-sm" />
                  </div>
                </div>
              </div>
              <div class="space-y-2 md:space-y-3">
                <label class="text-[10px] font-black uppercase opacity-50">Carboidrati (g)</label>
                <div class="grid grid-cols-2 gap-2 md:gap-3">
                  <div class="space-y-1 min-w-0">
                    <label class="text-[9px] font-black opacity-30">Preset 1</label>
                    <input type="number" v-model.number="form.quick_carb_1"
                      class="input input-bordered font-black border-accent/30 w-full input-xs md:input-sm" />
                  </div>
                  <div class="space-y-1 min-w-0">
                    <label class="text-[9px] font-black opacity-30">Preset 2</label>
                    <input type="number" v-model.number="form.quick_carb_2"
                      class="input input-bordered font-black border-accent/30 w-full input-xs md:input-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Secondary Settings -->
      <div class="space-y-4 md:space-y-6">
        <!-- Telegram Notifications Card -->
        <div
          class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
          <div class="card-body p-4 md:p-6 gap-4 md:gap-6">
            <div class="flex items-center gap-2 md:gap-3">
              <div class="p-2 md:p-3 bg-info/10 rounded-lg md:rounded-xl shadow-sm">
                <i class="fa-brands fa-telegram text-info text-lg md:text-xl"></i>
              </div>
              <div>
                <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Telegram</h3>
                <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">Notifiche &
                  Alert</span>
              </div>
            </div>

            <div
              class="flex items-center justify-between p-2 md:p-3 bg-base-100/50 rounded-lg md:rounded-xl border border-base-content/10 shadow-sm">
              <span class="text-[10px] md:text-xs font-bold opacity-60">Status</span>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full shadow-sm"
                  :class="form.telegram_enabled ? 'bg-success animate-pulse' : 'bg-error'"></div>
                <span class="text-[10px] font-bold">{{ form.telegram_enabled ? 'Attivo' : 'Disattivo' }}</span>
              </div>
            </div>

            <div class="space-y-1 md:space-y-2">
              <label
                class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-lg hover:bg-base-100/50 transition-colors shadow-sm hover:shadow-md">
                <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">Abilita Telegram</span>
                <input v-model="form.telegram_enabled" type="checkbox"
                  class="toggle toggle-primary toggle-xs md:toggle-sm flex-shrink-0" />
              </label>

              <label
                class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-lg hover:bg-base-100/50 transition-colors shadow-sm hover:shadow-md">
                <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">Alert Ipo/Iper</span>
                <input v-model="form.telegram_high_low_alerts" :disabled="!form.telegram_enabled" type="checkbox"
                  class="toggle toggle-error toggle-xs md:toggle-sm flex-shrink-0" />
              </label>

              <label
                class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-lg hover:bg-base-100/50 transition-colors shadow-sm hover:shadow-md">
                <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">Predizione Rischio</span>
                <input v-model="form.telegram_prediction_alerts" :disabled="!form.telegram_enabled" type="checkbox"
                  class="toggle toggle-warning toggle-xs md:toggle-sm flex-shrink-0" />
              </label>

              <label
                class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-lg hover:bg-base-100/50 transition-colors shadow-sm hover:shadow-md">
                <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">Conferma Insulina</span>
                <input v-model="form.telegram_insulin_alerts" :disabled="!form.telegram_enabled" type="checkbox"
                  class="toggle toggle-success toggle-xs md:toggle-sm flex-shrink-0" />
              </label>

              <label
                class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-lg hover:bg-base-100/50 transition-colors shadow-sm hover:shadow-md">
                <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">Conferma
                  Carboidrati</span>
                <input v-model="form.telegram_carb_alerts" :disabled="!form.telegram_enabled" type="checkbox"
                  class="toggle toggle-accent toggle-xs md:toggle-sm flex-shrink-0" />
              </label>

              <label
                class="label cursor-pointer justify-between gap-2 p-2 md:p-3 bg-base-100/30 rounded-lg hover:bg-base-100/50 transition-colors shadow-sm hover:shadow-md">
                <span class="label-text text-[10px] font-black uppercase opacity-60 truncate">Riepilogo
                  Giornaliero</span>
                <input v-model="form.telegram_daily_summary" :disabled="!form.telegram_enabled" type="checkbox"
                  class="toggle toggle-info toggle-xs md:toggle-sm flex-shrink-0" />
              </label>

              <div class="space-y-1 md:space-y-2 pt-2">
                <label class="text-[9px] font-black uppercase opacity-40">Ora Riepilogo</label>
                <input v-model="form.telegram_daily_summary_time"
                  :disabled="!form.telegram_enabled || !form.telegram_daily_summary" type="time"
                  class="input input-bordered font-black input-xs md:input-sm w-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        <!-- Export Card -->
        <div
          class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
          <div class="card-body p-4 md:p-6 gap-4 md:gap-6">
            <div class="flex items-center gap-2 md:gap-3">
              <div class="p-2 md:p-3 bg-accent/10 rounded-lg md:rounded-xl shadow-sm">
                <i class="fa-solid fa-download text-accent text-lg md:text-xl"></i>
              </div>
              <div>
                <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Export Dati</h3>
                <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">CSV & PDF</span>
              </div>
            </div>

            <p class="text-[9px] md:text-[10px] opacity-60 leading-relaxed">
              Esporta i tuoi dati per condividerli con il tuo medico o per archiviazione personale.
            </p>

            <button @click="openExportModal"
              class="btn btn-accent w-full btn-sm md:btn-md font-black uppercase tracking-widest gap-2">
              <i class="fa-solid fa-download"></i>
              Apri Export
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div
      class="sticky bottom-0 z-10 bg-base-100/80 backdrop-blur-lg border-t border-base-content/10 p-3 md:p-4 rounded-t-xl md:rounded-t-2xl shadow-lg md:shadow-xl shadow-black/5 md:shadow-black/10">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4 max-w-7xl mx-auto">
        <div class="flex items-center gap-2 md:gap-3">
          <!-- <div class="w-2 h-2 rounded-full bg-success animate-pulse shadow-sm shadow-success/30"></div> -->
          <!-- <span class="text-[10px] md:text-xs font-bold opacity-60">Modifiche non salvate</span> -->
        </div>

        <div class="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
          <button @click="resetToDefaults"
            class="btn btn-ghost btn-xs md:btn-sm px-3 md:px-6 font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-all flex-1 sm:flex-none"
            :disabled="store.loading">
            <i class="fa-solid fa-rotate-right mr-1 md:mr-2"></i>
            <span class="hidden sm:inline">Ripristina</span>
            <span class="sm:hidden">Reset</span>
          </button>

          <button @click="save"
            class="btn btn-primary btn-xs md:btn-sm px-4 md:px-8 shadow-md md:shadow-lg shadow-primary/40 font-black uppercase tracking-widest gap-1 md:gap-2 flex-1 sm:flex-none"
            :disabled="store.loading">
            <span v-if="store.loading" class="loading loading-spinner loading-xs md:loading-sm"></span>
            <i v-else class="fa-regular fa-floppy-disk"></i>
            Salva
          </button>
        </div>
      </div>
    </div>

    <!-- Messaggio Successo -->
    <div v-if="saved" class="toast toast-end">
      <div class="alert alert-success text-xs font-black uppercase py-2">
        <span>Impostazioni salvate!</span>
      </div>
    </div>

    <!-- Export Modal -->
    <ExportModal :is-open="showExportModal" @close="showExportModal = false" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useGlucoseStore } from '../stores/glucose'
import ExportModal from '../components/ExportModal.vue'

const store = useGlucoseStore()
const saved = ref(false)
const showExportModal = ref(false)

const tirRange = computed(() => {
  return `${form.tir_min} - ${form.tir_max}`
})

const form = reactive({
  tir_min: 70,
  tir_max: 180,
  red_under: 55,
  red_over: 250,
  rapid_duration: 3,
  slow_duration: 24,
  carb_duration: 4,
  insulin_sensitivity: 60,
  carb_ratio: 15,
  quick_insulin_1: 1,
  quick_insulin_2: 2,
  quick_carb_1: 10,
  quick_carb_2: 20,
  telegram_enabled: false,
  telegram_high_low_alerts: true,
  telegram_prediction_alerts: true,
  telegram_insulin_alerts: false,
  telegram_carb_alerts: false,
  telegram_daily_summary: false,
  telegram_daily_summary_time: '21:00'
})

onMounted(async () => {
  await store.fetchSettings()
  updateFormFromStore()
})

function normalizeBoolean(value, fallback = false) {
  if (value === null || value === undefined) return fallback
  if (value === true || value === 1 || value === '1' || value === 'true') return true
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return Boolean(value)
}

function updateFormFromStore() {
  form.tir_min = store.settings.tir_min
  form.tir_max = store.settings.tir_max
  form.red_under = store.settings.red_under
  form.red_over = store.settings.red_over
  form.rapid_duration = store.settings.rapid_duration
  form.slow_duration = store.settings.slow_duration
  form.carb_duration = store.settings.carb_duration
  form.insulin_sensitivity = store.settings.insulin_sensitivity
  form.carb_ratio = store.settings.carb_ratio
  // Quick presets
  form.quick_insulin_1 = store.settings.quick_insulin_1 ?? 1
  form.quick_insulin_2 = store.settings.quick_insulin_2 ?? 2
  form.quick_carb_1 = store.settings.quick_carb_1 ?? 10
  form.quick_carb_2 = store.settings.quick_carb_2 ?? 20
  // Telegram toggles
  form.telegram_enabled = normalizeBoolean(store.settings.telegram_enabled, false)
  form.telegram_high_low_alerts = normalizeBoolean(store.settings.telegram_high_low_alerts, true)
  form.telegram_prediction_alerts = normalizeBoolean(store.settings.telegram_prediction_alerts, true)
  form.telegram_insulin_alerts = normalizeBoolean(store.settings.telegram_insulin_alerts, false)
  form.telegram_carb_alerts = normalizeBoolean(store.settings.telegram_carb_alerts, false)
  form.telegram_daily_summary = normalizeBoolean(store.settings.telegram_daily_summary, false)
  form.telegram_daily_summary_time = store.settings.telegram_daily_summary_time || '21:00'
}

async function resetToDefaults() {
  if (confirm('Sei sicuro di voler ripristinare i valori predefiniti?')) {
    await store.resetSettings()
    updateFormFromStore()
    saved.value = true
    setTimeout(() => saved.value = false, 3000)
  }
}

async function save() {
  // Applica i valori di default se i campi sono vuoti o non validi
  const settingsToSave = {
    tir_min: form.tir_min || 70,
    tir_max: form.tir_max || 180,
    red_under: form.red_under || 55,
    red_over: form.red_over || 250,
    rapid_duration: form.rapid_duration || 3,
    slow_duration: form.slow_duration || 24,
    carb_duration: form.carb_duration || 4,
    insulin_sensitivity: form.insulin_sensitivity || 60,
    carb_ratio: form.carb_ratio || 15,
    quick_insulin_1: form.quick_insulin_1 || 1,
    quick_insulin_2: form.quick_insulin_2 || 2,
    quick_carb_1: form.quick_carb_1 || 10,
    quick_carb_2: form.quick_carb_2 || 20,
    telegram_enabled: form.telegram_enabled,
    telegram_high_low_alerts: form.telegram_high_low_alerts,
    telegram_prediction_alerts: form.telegram_prediction_alerts,
    telegram_insulin_alerts: form.telegram_insulin_alerts,
    telegram_carb_alerts: form.telegram_carb_alerts,
    telegram_daily_summary: form.telegram_daily_summary,
    telegram_daily_summary_time: form.telegram_daily_summary_time || '21:00'
  }

  await store.updateSettings(settingsToSave)

  if (!store.error) {
    updateFormFromStore()
    saved.value = true
    setTimeout(() => saved.value = false, 3000)
  }
}

function openExportModal() {
  showExportModal.value = true
}
</script>
