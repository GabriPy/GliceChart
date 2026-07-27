<template>
  <div class="drawer lg:drawer-open min-h-screen bg-base-100 selection:bg-primary selection:text-white"
    :data-theme="currentTheme">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />

    <div class="drawer-content flex flex-col min-w-0">

      <!-- Background Decor (subtle gradient/glow) -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div class="absolute top-[40%] -right-[10%] w-[30%] h-[50%] bg-secondary/10 blur-[100px] rounded-full"></div>
      </div>

      <!-- Navbar -->
      <header
        class="navbar bg-base-100/80 backdrop-blur-md border-b border-base-content/5 px-4 md:px-12 sticky top-0 z-[90]">
        <div class="navbar-start flex items-center gap-3">
          <label for="my-drawer" class="btn btn-ghost btn-sm btn-circle lg:hidden">
            <Menu class="w-5 h-5" />
          </label>
          <span class="text-lg font-black tracking-tight uppercase lg:hidden">Glice<span
              class="text-primary">Chart</span></span>
        </div>

        <div class="navbar-end gap-3 w-full justify-end">
          <!-- Status Indicator (Desktop only) -->
          <div
            class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-200 border border-base-content/5">
            <div class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">System Active</span>
          </div>

          <div class="flex items-center gap-1">
            <!-- Sync manuale -->
            <button class="btn btn-ghost btn-sm btn-circle hover:bg-primary/10 hover:text-primary transition-all"
              :disabled="store.loading" @click="store.syncNow()" title="Sincronizza">
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': store.loading }" />
            </button>

            <!-- Menu Temi Dropdown -->
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-2 normal-case hover:bg-base-200">
                <Palette class="w-5 h-5" />
                <span class="hidden md:inline font-bold text-xs uppercase tracking-widest opacity-60">Tema</span>
              </div>
              <ul tabindex="0"
                class="dropdown-content z-[110] menu p-2 shadow-2xl bg-base-300/90 backdrop-blur-xl rounded-box w-60 mt-4 max-h-[70vh] overflow-y-auto border border-white/10">
                <li v-for="t in themes" :key="t" class="mb-1 last:mb-0">
                  <button
                    class="flex items-center justify-between p-3 rounded-xl outline-none focus:outline-none transition-all duration-200 bg-base-100/50 hover:bg-base-200"
                    :class="{ 'ring-2 ring-primary ring-offset-2 ring-offset-base-300': currentTheme === t }"
                    @click="currentTheme = t" :data-theme="t">
                    <div class="flex items-center gap-3">
                      <div class="grid grid-cols-2 grid-rows-2 gap-0.5 rounded-md overflow-hidden shadow-sm">
                        <div class="bg-primary w-2.5 h-2.5"></div>
                        <div class="bg-secondary w-2.5 h-2.5"></div>
                        <div class="bg-accent w-2.5 h-2.5"></div>
                        <div class="bg-neutral w-2.5 h-2.5"></div>
                      </div>
                      <span class="text-[11px] font-black uppercase tracking-widest text-base-content">{{ t }}</span>
                    </div>
                    <div v-if="currentTheme === t"
                      class="flex items-center justify-center bg-primary rounded-full p-0.5 shadow-lg">
                      <Check class="w-3 h-3 text-white" />
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

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
import { ref, watch } from 'vue'
import { useGlucoseStore } from './stores/glucose'
import Sidebar from './components/Sidebar.vue'
import { APP_VERSION_LABEL } from './appVersion'
import { Menu, RefreshCw, Palette, Check, AlertCircle, X } from 'lucide-vue-next'

const store = useGlucoseStore()

// ── Temi DaisyUI ──────────────────────────────────────────────────────────────
const themes = [
  "light", "dark", "retro", "forest", "wireframe", "coffee"
]

const currentTheme = ref(localStorage.getItem('theme') || 'dark')

watch(() => currentTheme.value, (newTheme) => {
  localStorage.setItem('theme', newTheme)
})

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
