<template>
  <div v-if="displayStats" class="stats stats-vertical lg:stats-horizontal shadow-xl bg-base-200/70 backdrop-blur-xl border border-white/10 w-full overflow-hidden rounded-3xl">
    
    <!-- Time In Range -->
    <div class="stat place-items-center gap-1 py-5">
      <div class="stat-title text-[11px] uppercase font-semibold tracking-widest opacity-50 flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4" />
        {{ $t('exportReports.tir') }}
      </div>
      <div class="stat-value flex items-center gap-2">
        <div class="radial-progress bg-base-300 border-2 border-base-300" :style="`--value:${displayStats.tir}; --size:3.2rem; --thickness: 4px;`" role="progressbar" :aria-valuenow="displayStats.tir" aria-valuemin="0" aria-valuemax="100">
          <span class="text-[12px] font-black text-base-content">{{ displayStats.tir }}%</span>
        </div>
      </div>
      <div class="stat-desc text-[10px] font-semibold opacity-40 uppercase tracking-tight mt-1">{{ $t('periodicSummary.targetRangeLabel', { min: store.settings.tir_min, max: store.settings.tir_max }) }}</div>
    </div>

    <!-- Media -->
    <div class="stat place-items-center gap-1 py-5">
      <div class="stat-title text-[11px] uppercase font-semibold tracking-widest opacity-50 flex items-center gap-2">
        <BarChart3 class="w-4 h-4" />
        {{ $t('exportReports.avgGlucose') }}
      </div>
      <div class="stat-value text-3xl font-black tracking-tighter">{{ displayStats.avg }}</div>
      <div class="stat-desc text-[10px] font-semibold opacity-40 uppercase tracking-tight mt-1">{{ $t('common.mgDl') }}</div>
    </div>

    <!-- Minimo -->
    <div class="stat place-items-center gap-1 py-5">
      <div class="stat-title text-[11px] uppercase font-semibold tracking-widest opacity-50 flex items-center gap-2">
        <ArrowDown class="w-4 h-4" />
        {{ $t('charts.low') }}
      </div>
      <div class="stat-value text-3xl font-black tracking-tighter">{{ displayStats.min }}</div>
      <div class="stat-desc text-[10px] font-semibold opacity-40 uppercase tracking-tight mt-1">{{ $t('common.mgDl') }}</div>
    </div>

    <!-- Massimo -->
    <div class="stat place-items-center gap-1 py-5">
      <div class="stat-title text-[11px] uppercase font-semibold tracking-widest opacity-50 flex items-center gap-2">
        <ArrowUp class="w-4 h-4" />
        {{ $t('charts.high') }}
      </div>
      <div class="stat-value text-3xl font-black tracking-tighter">{{ displayStats.max }}</div>
      <div class="stat-desc text-[10px] font-semibold opacity-40 uppercase tracking-tight mt-1">{{ $t('common.mgDl') }}</div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGlucoseStore } from '../stores/glucose'
import { CheckCircle2, BarChart3, ArrowDown, ArrowUp } from 'lucide-vue-next'

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
