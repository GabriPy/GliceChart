<template>
  <div class="drawer lg:drawer-open min-h-screen bg-base-100 selection:bg-primary selection:text-white"
    :data-theme="store.theme">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />

    <div class="drawer-content flex flex-col min-w-0">

      <!-- Background Decor (subtle gradient/glow) -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div class="absolute top-[40%] -right-[10%] w-[30%] h-[50%] bg-secondary/10 blur-[100px] rounded-full"></div>
      </div>

      <!-- Header removed on desktop; mobile keeps the drawer toggle via the sidebar / drawer overlay -->
      <div class="hidden lg:block h-0"></div>

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
