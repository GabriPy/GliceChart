<template>
  <div class="flex flex-col gap-6">
    <!-- Header Impostazioni -->
    <div class="card bg-base-200 shadow-sm border border-base-content/10">
      <div class="card-body p-4 md:p-6">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-primary/10 rounded-2xl">
            <i class="fi fi-sr-settings text-primary text-xl"></i>
          </div>
          <div>
            <h2 class="text-lg font-black uppercase tracking-tight leading-none">Impostazioni</h2>
            <span class="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">Configurazione Personalizzata</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Target Time In Range -->
      <div class="card bg-base-200 shadow-xl border border-base-content/5">
        <div class="card-body p-6 gap-4">
          <div class="flex items-center gap-2 mb-2">
            <i class="fi fi-sr-target text-success"></i>
            <span class="text-xs font-black uppercase tracking-widest opacity-50">Target Time In Range (Verde)</span>
          </div>
          
          <div class="flex flex-col gap-4">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text text-[10px] font-black uppercase opacity-40">Minimo (mg/dL)</span>
              </label>
              <input type="number" v-model.number="form.tir_min" class="input input-bordered font-black" />
            </div>
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text text-[10px] font-black uppercase opacity-40">Massimo (mg/dL)</span>
              </label>
              <input type="number" v-model.number="form.tir_max" class="input input-bordered font-black" />
            </div>
          </div>
        </div>
      </div>

      <!-- Soglie Critiche (Rosse) -->
      <div class="card bg-base-200 shadow-sm border border-base-content/10">
        <div class="card-body p-6 gap-4">
          <div class="flex items-center gap-2 mb-2">
            <i class="fi fi-sr-shield-exclamation text-error"></i>
            <span class="text-xs font-black uppercase tracking-widest opacity-50">Soglie Critiche (Rosso)</span>
          </div>
          
          <div class="flex flex-col gap-4">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text text-[10px] font-black uppercase opacity-40">Sotto questa soglia (mg/dL)</span>
              </label>
              <input type="number" v-model.number="form.red_under" class="input input-bordered font-black border-error/30" />
            </div>
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text text-[10px] font-black uppercase opacity-40">Sopra questa soglia (mg/dL)</span>
              </label>
              <input type="number" v-model.number="form.red_over" class="input input-bordered font-black border-error/30" />
            </div>
          </div>
        </div>
      </div>

      <!-- Durata Azione Insulina e Carboidrati -->
      <div class="card bg-base-200 shadow-xl border border-base-content/5">
        <div class="card-body p-6 gap-4">
          <div class="flex items-center gap-2 mb-2">
            <i class="fi fi-sr-clock text-primary"></i>
            <span class="text-xs font-black uppercase tracking-widest opacity-50">Durata Azione (Ore)</span>
          </div>
          
          <div class="flex flex-col gap-4">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text text-[10px] font-black uppercase opacity-40">Insulina Rapida</span>
              </label>
              <input type="number" v-model.number="form.rapid_duration" class="input input-bordered font-black" />
            </div>
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text text-[10px] font-black uppercase opacity-40">Insulina Lenta</span>
              </label>
              <input type="number" v-model.number="form.slow_duration" class="input input-bordered font-black" />
            </div>
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text text-[10px] font-black uppercase opacity-40">Assorbimento Carboidrati (COB)</span>
              </label>
              <input type="number" v-model.number="form.carb_duration" class="input input-bordered font-black border-accent/30" />
            </div>
          </div>
        </div>
      </div>

      <!-- Parametri Predizione -->
      <div class="card bg-base-200 shadow-sm border border-base-content/10">
        <div class="card-body p-6 gap-4">
          <div class="flex items-center gap-2 mb-2">
            <i class="fi fi-sr-calculator text-secondary"></i>
            <span class="text-xs font-black uppercase tracking-widest opacity-50">Parametri Predizione</span>
          </div>
          
          <div class="flex flex-col gap-4">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text text-[10px] font-black uppercase opacity-40">Sensibilità Insulina (ISF)</span>
              </label>
              <div class="flex items-center gap-2">
                <input type="number" v-model.number="form.insulin_sensitivity" class="input input-bordered font-black flex-1" />
                <span class="text-[10px] font-bold opacity-30">mg/dL per 1U</span>
              </div>
            </div>
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text text-[10px] font-black uppercase opacity-40">Rapporto Insulina/Carboidrati (CR)</span>
              </label>
              <div class="flex items-center gap-2">
                <input type="number" v-model.number="form.carb_ratio" class="input input-bordered font-black flex-1" />
                <span class="text-[10px] font-bold opacity-30">g per 1U</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pulsanti Azione -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
      <button 
        @click="resetToDefaults" 
        class="btn btn-ghost btn-sm px-6 font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
        :disabled="store.loading"
      >
        <i class="fi fi-sr-refresh mr-2"></i>
        Ripristina Predefiniti
      </button>

      <button 
        @click="save" 
        class="btn btn-primary px-12 shadow-lg shadow-primary/20 font-black uppercase tracking-widest w-full sm:w-auto"
        :disabled="store.loading"
      >
        <span v-if="store.loading" class="loading loading-spinner"></span>
        Salva Impostazioni
      </button>
    </div>

    <!-- Messaggio Successo -->
    <div v-if="saved" class="toast toast-end">
      <div class="alert alert-success text-xs font-black uppercase py-2">
        <span>Impostazioni salvate!</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useGlucoseStore } from '../stores/glucose'

const store = useGlucoseStore()
const saved = ref(false)

const form = reactive({
  tir_min: 70,
  tir_max: 180,
  red_under: 55,
  red_over: 250,
  rapid_duration: 3,
  slow_duration: 24,
  carb_duration: 4,
  insulin_sensitivity: 60,
  carb_ratio: 15
})

onMounted(async () => {
  await store.fetchSettings()
  updateFormFromStore()
})

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
    tir_min:        form.tir_min || 70,
    tir_max:        form.tir_max || 180,
    red_under:      form.red_under || 55,
    red_over:       form.red_over || 250,
    rapid_duration: form.rapid_duration || 3,
    slow_duration:  form.slow_duration || 24,
    carb_duration:  form.carb_duration || 4,
    insulin_sensitivity: form.insulin_sensitivity || 60,
    carb_ratio:     form.carb_ratio || 15
  }

  await store.updateSettings(settingsToSave)
  
  if (!store.error) {
    updateFormFromStore()
    saved.value = true
    setTimeout(() => saved.value = false, 3000)
  }
}
</script>
