<template>
  <aside class="w-64 h-full bg-base-200 border-r border-base-content/5 flex flex-col z-[100]">
    <!-- Logo -->
    <div class="p-6 mb-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-xl">
          <Activity class="w-5 h-5 text-primary" />
        </div>
        <span class="text-lg font-black tracking-tight uppercase italic">Glice<span class="text-primary">Chart</span></span>
      </div>
      <div class="mt-1 text-[8px] font-black opacity-20 uppercase tracking-[0.2em]">Dashboard {{ APP_VERSION_LABEL }}</div>
    </div>

    <!-- Navigazione -->
    <nav class="flex-1 px-4 space-y-2">
      <router-link 
        to="/" 
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')"
      >
        <Zap class="w-5 h-5" />
        <span class="text-[11px] font-black uppercase tracking-widest">Glicemia Attuale</span>
      </router-link>

      <router-link 
        to="/calendar" 
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/calendar' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')"
      >
        <Calendar class="w-5 h-5" />
        <span class="text-[11px] font-black uppercase tracking-widest">Calendario Glicemico</span>
      </router-link>

      <!-- <router-link 
        to="/prediction" 
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/prediction' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')"
      >
        <TrendingUp class="w-5 h-5" />
        <span class="text-[11px] font-black uppercase tracking-widest">Predizione</span>
      </router-link> -->

      <router-link 
        to="/patterns" 
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/patterns' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')"
      >
        <Brain class="w-5 h-5" />
        <span class="text-[11px] font-black uppercase tracking-widest">Pattern Smart</span>
      </router-link>

      <router-link 
        to="/dietometer" 
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/dietometer' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')"
      >
        <Wheat class="w-5 h-5" />
        <span class="text-[11px] font-black uppercase tracking-widest">Dietometro</span>
      </router-link>

      <router-link 
        to="/summary" 
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/summary' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')"
      >
        <FileText class="w-5 h-5" />
        <span class="text-[11px] font-black uppercase tracking-widest">Resoconto periodico</span>
      </router-link>

      <router-link 
        to="/settings" 
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/settings' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')"
      >
        <Settings class="w-5 h-5" />
        <span class="text-[11px] font-black uppercase tracking-widest">Impostazioni</span>
      </router-link>

      <router-link 
        to="/about" 
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/about' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')"
      >
        <Info class="w-5 h-5" />
        <span class="text-[11px] font-black uppercase tracking-widest">Informazioni</span>
      </router-link>
    </nav>

    <!-- Footer Sidebar -->
    <div class="p-4 mt-auto border-t border-base-content/5">
      <div class="p-4 bg-base-300/50 rounded-2xl flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span class="text-[9px] font-black uppercase opacity-40">Sistema Online</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { APP_VERSION_LABEL } from '../appVersion'
import { 
  Activity, 
  Zap, 
  Calendar, 
  TrendingUp, 
  Brain, 
  Wheat, 
  FileText, 
  Settings, 
  Info 
} from 'lucide-vue-next'

const $route = useRoute()
defineEmits(['close-drawer'])
</script>

<style scoped>
.router-link-active {
  /* Classi gestite dinamicamente nel template */
}
</style>
