<template>
  <div class="drawer lg:drawer-open min-h-screen bg-base-100 selection:bg-primary selection:text-white"
    :data-theme="store.theme">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />

    <div class="drawer-content flex flex-col min-w-0">

      <!-- Background Decor (subtle gradient/glow) - disabilitato su mobile per performance -->
      <div class="hidden lg:block fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div class="absolute top-[40%] -right-[10%] w-[30%] h-[50%] bg-secondary/10 blur-[100px] rounded-full"></div>
      </div>

      <!-- Header con hamburger menu per mobile -->
      <div class="lg:hidden flex items-center justify-between p-4">
        <label for="my-drawer" class="btn btn-square btn-ghost btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </label>
        <!-- <div class="flex items-center gap-2">
          <div class="flex items-center justify-center rounded-xl border border-primary/20 bg-primary/15 w-8 h-8 p-1.5">
            <img src="./assets/favicon.png" alt="logo" class="object-contain w-5 h-5" />
          </div>
          <span class="text-sm font-black tracking-tight uppercase italic">Glice<span class="text-primary">Chart</span></span>
        </div> -->
      </div>

      <!-- Main Content Area -->
      <main class="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 space-y-4 relative">

        <!-- Alert errore -->
        <div v-if="store.error"
          class="alert alert-error shadow-sm border border-error/20 text-[10px] font-black uppercase tracking-wider py-2 px-6">
          <AlertCircle class="h-3 w-3" />
          <span>{{ store.error }}</span>
          <button class="btn btn-xs btn-circle btn-ghost" @click="store.error = null">
            <X class="w-3 h-3" />
          </button>
        </div>

        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>

        <!-- Footer / Legenda Globale -->
        <div class="flex flex-col items-center gap-2 pt-2 border-t border-base-content/5 mt-4">
          <div class="flex flex-wrap justify-center gap-x-6 gap-y-1">
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-black uppercase tracking-widest opacity-30">GliceChart è uno strumento di supporto basato su algoritmi matematici STANDARD. Per qualsiasi modifica terapeutica consultare prima il proprio medico.</span>
            </div>
          </div>
          <div class="text-[8px] font-bold opacity-20 uppercase tracking-[0.3em]">
            GliceChart {{ APP_VERSION_LABEL }}
          </div>
          <span class="text-[9px] font-black uppercase tracking-widest opacity-30">Made with ❤️ by Ghibiri</span>
        </div>
      </main>
    </div>

    <!-- Drawer Side (Sidebar) -->
    <div class="drawer-side z-[200]">
      <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <Sidebar @close-drawer="closeDrawer" />
    </div>
  </div>
</template>

<script setup>
import { useGlucoseStore } from './stores/glucose'
import Sidebar from './components/Sidebar.vue'
import { APP_VERSION_LABEL } from './appVersion'
import { AlertCircle, X } from 'lucide-vue-next'

const store = useGlucoseStore()

function closeDrawer() {
  const drawer = document.getElementById('my-drawer')
  if (drawer) drawer.checked = false
}
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
