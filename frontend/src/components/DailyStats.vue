<template>
  <div v-if="displayStats" class="stats stats-vertical sm:stats-horizontal shadow-sm bg-base-200 border border-base-content/10 w-full overflow-hidden rounded-2xl">
    
    <!-- Time In Range -->
    <div class="stat place-items-center gap-1 py-4 px-3">
      <div class="stat-title text-xs font-semibold text-base-content/60 flex items-center gap-1.5">
        <CheckCircle2 class="w-3.5 h-3.5 text-success" />
        {{ $t('exportReports.tir') }}
      </div>
      <div class="stat-value flex items-center gap-2 my-0.5">
        <div class="radial-progress text-success border-2 border-base-300" :style="`--value:${displayStats.tir}; --size:3rem; --thickness: 3.5px;`" role="progressbar" :aria-valuenow="displayStats.tir" aria-valuemin="0" aria-valuemax="100">
          <span class="text-xs font-bold text-base-content">{{ displayStats.tir }}%</span>
        </div>
      </div>
      <div class="stat-desc text-[11px] font-medium opacity-60">
        {{ $t('periodicSummary.targetRangeLabel', { min: store.settings.tir_min, max: store.settings.tir_max }) }}
      </div>
    </div>

    <!-- Media -->
    <div class="stat place-items-center gap-1 py-4 px-3">
      <div class="stat-title text-xs font-semibold text-base-content/60 flex items-center gap-1.5">
        <BarChart3 class="w-3.5 h-3.5 text-primary" />
        {{ $t('exportReports.avgGlucose') }}
      </div>
      <div class="stat-value text-2xl font-bold tracking-tight my-0.5">{{ displayStats.avg }}</div>
      <div class="stat-desc text-[11px] font-medium opacity-60">{{ $t('common.mgDl') }}</div>
    </div>

    <!-- GMI (Estimated A1C) -->
    <div v-if="displayStats.gmi" class="stat place-items-center gap-1 py-4 px-3">
      <div class="stat-title text-xs font-semibold text-base-content/60 flex items-center gap-1.5">
        <Activity class="w-3.5 h-3.5 text-accent" />
        <span>GMI (A1C)</span>
      </div>
      <div class="stat-value text-2xl font-bold tracking-tight text-accent my-0.5">
        {{ displayStats.gmi }}%
      </div>
      <div class="stat-desc text-[11px] font-medium opacity-60">Formula ADA</div>
    </div>

    <!-- CV (Coefficient of Variation) -->
    <div v-if="displayStats.cv !== undefined" class="stat place-items-center gap-1 py-4 px-3">
      <div class="stat-title text-xs font-semibold text-base-content/60 flex items-center gap-1.5">
        <Percent class="w-3.5 h-3.5 text-info" />
        <span>CV %</span>
      </div>
      <div class="stat-value text-2xl font-bold tracking-tight my-0.5" :class="displayStats.cv <= 36 ? 'text-success' : 'text-warning'">
        {{ displayStats.cv }}%
      </div>
      <div class="stat-desc text-[11px] font-medium" :class="displayStats.cv <= 36 ? 'text-success' : 'text-warning'">
        {{ displayStats.cv <= 36 ? '✓ Stabile (≤ 36%)' : 'Variabilità elevata' }}
      </div>
    </div>

    <!-- Minimo -->
    <div class="stat place-items-center gap-1 py-4 px-3">
      <div class="stat-title text-xs font-semibold text-base-content/60 flex items-center gap-1.5">
        <ArrowDown class="w-3.5 h-3.5 text-error" />
        {{ $t('charts.low') }}
      </div>
      <div class="stat-value text-2xl font-bold tracking-tight text-error my-0.5">{{ displayStats.min }}</div>
      <div class="stat-desc text-[11px] font-medium opacity-60">{{ $t('common.mgDl') }}</div>
    </div>

    <!-- Massimo -->
    <div class="stat place-items-center gap-1 py-4 px-3">
      <div class="stat-title text-xs font-semibold text-base-content/60 flex items-center gap-1.5">
        <ArrowUp class="w-3.5 h-3.5 text-warning" />
        {{ $t('charts.high') }}
      </div>
      <div class="stat-value text-2xl font-bold tracking-tight text-warning my-0.5">{{ displayStats.max }}</div>
      <div class="stat-desc text-[11px] font-medium opacity-60">{{ $t('common.mgDl') }}</div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGlucoseStore } from '../stores/glucose'
import { CheckCircle2, BarChart3, ArrowDown, ArrowUp, Activity, Percent } from 'lucide-vue-next'

const props = defineProps({
  stats: {
    type: Object,
    default: null
  }
})

const store = useGlucoseStore()

const displayStats = computed(() => {
  return props.stats || store.stats
})
</script>
