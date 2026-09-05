<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
      <h3 class="font-bold text-xl mb-4 flex items-center gap-2">
        📊 Analisi AI
      </h3>

      <div class="mb-4">
        <label class="label">
          <span class="label-text font-semibold">Periodo analisi</span>
        </label>
        <div class="flex gap-2 flex-wrap">
          <button
            class="btn btn-sm"
            :class="selectedDays === 1 ? 'btn-primary' : 'btn-outline'"
            @click="selectedDays = 1"
          >
            1gg
          </button>
          <button
            class="btn btn-sm"
            :class="selectedDays === 3 ? 'btn-primary' : 'btn-outline'"
            @click="selectedDays = 3"
          >
            3gg
          </button>
          <button
            class="btn btn-sm"
            :class="selectedDays === 7 ? 'btn-primary' : 'btn-outline'"
            @click="selectedDays = 7"
          >
            7gg
          </button>
          <button
            class="btn btn-sm"
            :class="selectedDays === 14 ? 'btn-primary' : 'btn-outline'"
            @click="selectedDays = 14"
          >
            14gg
          </button>
        </div>
      </div>

      <div class="mb-4">
        <button
          @click="generate"
          class="btn btn-primary w-full text-base"
          :disabled="loading"
        >
          <span v-if="loading" class="loading loading-spinner loading-md"></span>
          <span v-else>⚡</span>
          {{ loading ? 'Analisi in corso...' : 'Genera Report AI' }}
        </button>
      </div>

      <div v-if="error" class="card bg-error/10 border border-error/30 text-error p-4 mb-3 rounded-xl">
        <div class="flex items-start gap-2">
          <span class="text-lg">❌</span>
          <div>
            <div class="font-semibold mb-1">Errore durante la generazione.</div>
            <div class="text-sm opacity-90">{{ error }}</div>
            <div class="text-xs mt-2 opacity-80">Se API non configurata, impostare OPENAI_API_KEY nel backend.</div>
          </div>
        </div>
      </div>

      <div v-if="result && !loading" class="space-y-3">
        <div class="card bg-gradient-to-br from-primary/15 to-accent/10 p-4 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="text-2xl">💡</span>
            <div class="flex-1">
              <h4 class="font-bold text-base mb-2">Sommario</h4>
              <p class="text-sm leading-relaxed">{{ result.summary }}</p>
            </div>
          </div>
        </div>

        <div v-if="result.insights && result.insights.length" class="card bg-base-300 p-4 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="text-2xl">📌</span>
            <div class="flex-1">
              <h4 class="font-bold text-base mb-2">Insight Chiave</h4>
              <ul class="list-disc pl-5 space-y-2 text-sm">
                <li v-for="(insight, idx) in result.insights" :key="'insight-' + idx">{{ insight }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="result.warnings && result.warnings.length" class="card bg-base-300 p-4 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="text-2xl">⚠️</span>
            <div class="flex-1">
              <h4 class="font-bold text-base mb-2 text-warning">Attenzioni</h4>
              <ul class="list-disc pl-5 space-y-2 text-sm text-warning">
                <li v-for="(warn, idx) in result.warnings" :key="'warn-' + idx">{{ warn }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="result.suggestedActions && result.suggestedActions.length" class="card bg-base-300 p-4 rounded-xl mb-3">
          <div class="flex items-start gap-3">
            <span class="text-2xl">🎯</span>
            <div class="flex-1">
              <h4 class="font-bold text-base mb-2">Passi da valutare col Medico</h4>
              <ul class="list-disc pl-5 space-y-2 text-sm">
                <li v-for="(action, idx) in result.suggestedActions" :key="'action-' + idx">{{ action }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!result && !loading && !error" class="text-center text-sm opacity-60 py-6">
        Seleziona un periodo e clicca "Genera Report AI" per iniziare l'analisi.
      </div>

      <div class="modal-action mt-4">
        <form method="dialog">
          <button class="btn btn-ghost" @click="close">Chiudi</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="close">Chiudi</button>
    </form>
  </dialog>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits(['close'])

const dialogRef = ref(null)
const selectedDays = ref(1)
const loading = ref(false)
const error = ref(null)
const result = ref(null)

const generate = async () => {
  loading.value = true
  error.value = null
  result.value = null
  try {
    const { data } = await axios.get(`/api/report/ai?days=${selectedDays.value}`)
    result.value = data
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Errore di rete'
  } finally {
    loading.value = false
  }
}

const open = () => {
  dialogRef.value?.showModal()
}

const close = () => {
  dialogRef.value?.close()
  emit('close')
}

defineExpose({ open })
</script>
