<template>
  <div class="flex flex-col gap-4 md:gap-6 lg:gap-8 px-2 md:px-4 lg:px-0">

    <!-- Header -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-base-200 to-base-300 shadow-lg md:shadow-xl lg:shadow-2xl shadow-black/5 md:shadow-black/10 border border-base-content/10 rounded-2xl md:rounded-3xl">
      <div
        class="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-accent/15 rounded-full blur-2xl md:blur-3xl opacity-70">
      </div>
      <div class="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-primary/15 rounded-xl md:blur-2xl opacity-70">
      </div>

      <div class="relative card-body p-4 md:p-6 lg:p-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
          <div class="flex items-center gap-3 md:gap-4">
            <div
              class="p-3 md:p-4 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl md:rounded-2xl shadow-md md:shadow-lg shadow-accent/30">
              <i class="fa-solid fa-brain text-accent text-xl md:text-2xl"></i>
            </div>
            <div>
              <h2 class="text-lg md:text-2xl font-black uppercase tracking-tight leading-none">{{ $t('patterns.title') }}</h2>
              <span class="text-[10px] md:text-xs font-black opacity-40 uppercase tracking-[0.2em]">{{ $t('patterns.subtitle') }}</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <span
              class="px-2.5 py-1 bg-base-100/50 border border-base-content/10 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60 shadow-sm">{{
                $t('patterns.patternsCount', { count: patternsCount }, patternsCount) }}</span>
            <span
              class="px-2.5 py-1 bg-base-100/50 border border-base-content/10 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60 shadow-sm">{{
                $t('patterns.readingsCount', { count: historyDataCount }, historyDataCount) }}</span>
            <span
              class="px-2.5 py-1 bg-base-100/50 border border-base-content/10 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60 shadow-sm">{{
                $t('patterns.notesCount', { count: notesCount }, notesCount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Caricamento -->
    <div v-if="store.historyLoading"
      class="flex flex-col items-center justify-center py-16 md:py-20 gap-3 md:gap-4 bg-gradient-to-br from-base-200 to-base-300 border border-base-content/10 rounded-2xl md:rounded-3xl shadow-md md:shadow-lg shadow-black/5">
      <span class="loading loading-ring loading-lg text-primary"></span>
      <span class="text-xs font-black uppercase tracking-widest opacity-40">{{ $t('patterns.analyzing') }}</span>
    </div>

    <!-- Nessun Pattern -->
    <div v-else-if="!hasPatterns"
      class="flex flex-col items-center justify-center py-16 md:py-20 gap-3 md:gap-4 bg-gradient-to-br from-base-200 to-base-300 border border-base-content/10 rounded-2xl md:rounded-3xl shadow-md md:shadow-lg shadow-black/5 px-6">
      <div class="p-3 md:p-4 bg-base-100/50 rounded-xl md:rounded-2xl shadow-sm opacity-60">
        <i class="fa-solid fa-exclamation text-3xl md:text-4xl"></i>
      </div>
      <span class="text-sm md:text-base font-black uppercase tracking-widest opacity-60 text-center">{{ $t('patterns.noPatternsTitle') }}</span>
      <p class="text-[10px] md:text-xs uppercase tracking-widest max-w-xs text-center leading-relaxed opacity-40">
        {{ $t('patterns.noPatternsHelp') }}
      </p>
      <p class="text-[9px] md:text-[10px] uppercase tracking-[0.2em] opacity-30">
        {{ $t('patterns.dataAvailableSummary', { readings: historyDataCount, notes: notesCount }) }}
      </p>
    </div>

    <!-- Patterns List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <div v-for="p in store.patterns" :key="p.id"
        class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10 overflow-hidden">
        <div class="card-body p-4 md:p-6 gap-3 md:gap-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 md:gap-3">
              <div class="p-2 md:p-3 rounded-lg md:rounded-xl shadow-sm" :class="`bg-${p.color}/10`">
                <i class="fa-solid fa-exclamation text-lg md:text-xl" :class="[p.icon, `text-${p.color}`]"></i>
              </div>
              <span class="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40">{{ $t('patterns.patternDetected') }}</span>
            </div>
            <div v-if="p.confidence > 80"
              class="px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20 font-black text-[9px] uppercase tracking-widest">
              {{ $t('patterns.highPriority') }}
            </div>
          </div>

          <h3 class="text-lg md:text-xl font-black uppercase tracking-tight leading-none">{{ p.title }}</h3>

          <p class="text-xs md:text-sm opacity-70 leading-relaxed">
            {{ p.description }}
          </p>

          <div
            class="bg-base-100/50 p-3 md:p-4 rounded-lg md:rounded-xl border border-base-content/10 shadow-sm flex flex-col gap-2 md:gap-3">
            <div class="flex items-center justify-between text-[10px] font-black uppercase opacity-40">
              <span>{{ $t('patterns.confidence') }}</span>
              <span>{{ p.confidence }}%</span>
            </div>

            <div class="w-full bg-base-content/5 h-2 rounded-full overflow-hidden shadow-inner">
              <div class="h-full rounded-full transition-all duration-1000 shadow-sm" :class="`bg-${p.color}`"
                :style="{ width: p.intensity + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Quality Alert -->
    <div
      class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
      <div class="card-body p-4 md:p-6 flex-row items-center gap-3 md:gap-4">
        <div class="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl shadow-sm flex-shrink-0">
          <i class="fa-solid fa-database text-primary text-lg md:text-xl"></i>
        </div>
        <div>
          <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">{{ $t('patterns.analyzedDataTitle') }}</h3>
          <p class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">
            {{ $t('patterns.realtimeAnalysisNote') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useGlucoseStore } from '../stores/glucose'

const store = useGlucoseStore()

const hasPatterns = computed(() => Array.isArray(store.patterns) && store.patterns.length > 0)
const patternsCount = computed(() => Array.isArray(store.patterns) ? store.patterns.length : 0)
const historyDataCount = computed(() => Array.isArray(store.historyReadings) ? store.historyReadings.length : 0)
const notesCount = computed(() => Array.isArray(store.historyNotes) ? store.historyNotes.length : 0)

onMounted(async () => {
  await store.fetchLongHistory(4320)
})
</script>
