<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="card bg-base-200 shadow-sm border border-base-content/10">
      <div class="card-body p-6">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-accent/10 rounded-2xl">
            <i class="fi fi-sr-brain text-accent text-2xl leading-none"></i>
          </div>
          <div>
            <h1 class="text-3xl font-black uppercase tracking-tight leading-none italic">Pattern Intelligenti</h1>
            <p class="text-xs font-black opacity-30 uppercase tracking-[0.2em] mt-2">Analisi Comportamentale v1.0</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Caricamento -->
    <div v-if="store.historyLoading" class="flex flex-col items-center justify-center py-20 gap-4">
      <span class="loading loading-ring loading-lg text-primary"></span>
      <span class="text-xs font-black uppercase tracking-widest opacity-40">Analisi in corso...</span>
    </div>

    <!-- Nessun Pattern o Dati Insufficienti -->
    <div v-else-if="!hasPatterns" class="flex flex-col items-center justify-center py-20 opacity-30 gap-4">
      <i class="fi fi-sr-search text-4xl"></i>
      <span class="text-base font-black uppercase tracking-widest">Nessun pattern rilevato negli ultimi dati</span>
      <p class="text-xs uppercase tracking-widest max-w-xs text-center leading-relaxed">
        Carica più dati o aggiungi note (es. "Pizza") per permettere al sistema di analizzare le tue risposte glicemiche.
      </p>
    </div>

    <!-- Patterns List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <div v-for="p in store.patterns" :key="p.id" class="card bg-base-200 shadow-xl border border-base-content/5 overflow-hidden">
        <div class="card-body p-6 gap-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="fi" :class="[p.icon, `text-${p.color}`]"></i>
              <span class="text-xs font-black uppercase tracking-widest opacity-60 italic">Pattern Rilevato</span>
            </div>
            <div v-if="p.confidence > 80" class="badge badge-accent badge-outline font-black text-[10px] uppercase tracking-widest">ALTA PRIORITÀ</div>
          </div>
          <h2 class="text-2xl font-black italic tracking-tight leading-none">{{ p.title }}</h2>
          <p class="text-base opacity-80 leading-relaxed">
            {{ p.description }}
          </p>
          <div class="bg-base-300/30 p-4 rounded-2xl flex flex-col gap-3">
            <div class="flex items-center justify-between text-xs font-black uppercase opacity-40">
              <span>Affidabilità (Coerenza)</span>
              <span>{{ p.confidence }}%</span>
            </div>
            <div class="w-full bg-base-content/5 h-2 rounded-full overflow-hidden">
              <div class="h-full transition-all duration-1000" :class="`bg-${p.color}`" :style="{ width: p.intensity + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Data Quality Alert -->
    <div class="alert bg-base-200 border-base-content/10 shadow-sm p-6 mt-auto">
      <i class="fi fi-sr-database text-primary text-2xl"></i>
      <div>
        <h3 class="font-black uppercase tracking-tight text-sm italic">Dati Analizzati</h3>
        <p class="text-xs opacity-40 uppercase tracking-widest mt-1">L'analisi viene effettuata in tempo reale sulla cronologia caricata.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useGlucoseStore } from '../stores/glucose'

const store = useGlucoseStore()

const hasPatterns = computed(() => {
  if (!store.patterns) return false
  return !!(store.patterns.pizza || store.patterns.night || store.patterns.dawn)
})

onMounted(async () => {
  // Carichiamo 3 giorni di dati per un'analisi reale dei pattern
  await store.fetchLongHistory(4320)
})
</script>
