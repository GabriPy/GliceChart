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
    
    <!-- Riga 3: Nuovi grafici di statistiche -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <StatsChart title="Fasce Orarie" type="bar" />
      <StatsChart title="Percentuale Range" type="doughnut" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useGlucoseStore } from '../stores/glucose'
import CurrentGlucose from '../components/CurrentGlucose.vue'
import GlucoseChart   from '../components/GlucoseChart.vue'
import DailyStats     from '../components/DailyStats.vue'
import StatsChart     from '../components/StatsChart.vue'

const store = useGlucoseStore()

// ── Auto-refresh ogni 60s ─────────────────────────────────────────────────────
let interval = null
onMounted(async () => {
  await store.fetchAll()
  interval = setInterval(() => store.fetchAll(), 60_000)
})
onUnmounted(() => clearInterval(interval))
</script>
