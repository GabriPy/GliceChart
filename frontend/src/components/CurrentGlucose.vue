<template>
  <div class="card bg-base-200/70 backdrop-blur-xl shadow-xl border border-white/10 h-full relative overflow-hidden group rounded-3xl">
    <!-- Glow di sfondo dinamico -->
    <div 
      class="absolute inset-0 opacity-[0.05] blur-3xl transition-colors duration-1000"
      :class="store.glucoseColor.replace('text-', 'bg-')"
    ></div>

    <div class="card-body items-center justify-center text-center gap-1 py-8 relative z-10">

      <!-- Stato Live -->
      <div class="flex items-center gap-2 mb-2">
        <div class="relative flex h-2 w-2">
          <span class="hidden lg:block animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </div>
        <span class="text-[11px] uppercase font-semibold tracking-[0.2em] opacity-50">Live Monitoring</span>
      </div>

      <!-- Valore + freccia -->
      <div v-if="store.current" class="flex flex-col items-center gap-5">
        <div class="flex items-center gap-4">
          <div class="flex flex-col items-end">
            <span
              class="font-black leading-none text-9xl tracking-tighter transition-colors duration-500"
              :class="store.glucoseColor"
            >{{ store.current.glucose }}</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <TrendArrow :trend="store.current.trend" :size="56" />
            <span class="text-[12px] font-semibold opacity-40 tracking-widest uppercase">mg/dL</span>
          </div>
        </div>

        <div v-if="store.insulinRecords.length || store.carbRecords.length" class="flex items-center gap-7 mt-1 bg-base-300/30 px-6 py-3 rounded-2xl">
          <div class="flex flex-col items-center gap-0.5">
            <div class="flex items-center gap-2">
              <Syringe class="w-4 h-4 text-primary" />
              <span class="text-2xl font-black tracking-tight">{{ store.iob.toFixed(1) }} <span class="text-sm opacity-40">U</span></span>
            </div>
            <span class="text-[11px] font-semibold uppercase opacity-40 tracking-widest">Insulina Attiva</span>
          </div>
          
          <div class="w-px h-10 bg-base-content/10"></div>

          <div class="flex flex-col items-center gap-0.5">
            <div class="flex items-center gap-2">
              <Cookie class="w-4 h-4 text-accent" />
              <span class="text-2xl font-black tracking-tight">{{ Math.round(store.cob) }} <span class="text-sm opacity-40">g</span></span>
            </div>
            <span class="text-[11px] font-semibold uppercase opacity-40 tracking-widest">CHO da assorbire</span>
          </div>
        </div>
      </div>

      <!-- Nessun dato -->
      <div v-else class="text-7xl font-black opacity-10">—</div>

      <!-- Footer Info -->
      <div v-if="store.minutesAgo !== null" class="mt-3 px-5 py-2 rounded-full bg-base-300/40 border border-white/5">
        <span class="text-[11px] font-semibold opacity-50 uppercase tracking-wider">
          {{ store.minutesAgo === 0 ? 'adesso' : `${store.minutesAgo} min fa` }}
        </span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useGlucoseStore } from '../stores/glucose'
import TrendArrow from './TrendArrow.vue'
import { Syringe, Cookie } from 'lucide-vue-next'

const store = useGlucoseStore()
</script>
