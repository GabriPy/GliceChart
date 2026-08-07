<template>
  <aside :class="collapsed ? 'w-16' : 'w-64'"
    class="h-full bg-base-200 border-r border-base-content/5 flex flex-col z-[100] transition-all duration-200 overflow-hidden">
    <!-- Logo + Collapse -->
    <div
      :class="collapsed ? 'px-2 py-2 mb-2 flex items-center justify-center' : 'p-4 mb-2 flex items-center justify-between'">
      <div v-if="!collapsed" class="flex items-center gap-3">
        <div
          class="flex items-center justify-center rounded-2xl border border-primary/20 bg-primary/15 shadow-sm w-11 h-11 p-2">
          <img :src="favicon" alt="logo" class="object-contain w-7 h-7" />
        </div>
        <span class="text-lg font-display font-bold tracking-tight uppercase">Glice<span
            class="text-primary">Chart</span></span>
      </div>

      <div v-else class="flex items-center justify-center">
        <div
          class="flex items-center justify-center rounded-2xl border border-primary/20 bg-primary/15 shadow-sm w-10 h-10 p-1.5">
          <img :src="favicon" alt="logo" class="object-contain w-6 h-6" />
        </div>
      </div>
    </div>

    <div v-show="!collapsed" class="px-4 text-[8px] font-black opacity-20 uppercase tracking-[0.2em]">Dashboard {{
      APP_VERSION_LABEL }}</div>

    <!-- Navigazione -->
    <nav class="flex-1 px-2 space-y-2 mt-4">
      <router-link to="/" class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')">
        <div class="tooltip" :data-tip="'Glicemia Attuale'">
          <Zap class="w-5 h-5" />
        </div>
        <span v-show="!collapsed" class="text-[11px] font-black uppercase tracking-widest">Glicemia Attuale</span>
      </router-link>

      <router-link to="/calendar" class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/calendar' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')">
        <div class="tooltip" :data-tip="'Calendario Glicemico'">
          <Calendar class="w-5 h-5" />
        </div>
        <span v-show="!collapsed" class="text-[11px] font-black uppercase tracking-widest">Calendario Glicemico</span>
      </router-link>

      <router-link to="/patterns" class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/patterns' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')">
        <div class="tooltip" :data-tip="'Pattern Smart'">
          <Brain class="w-5 h-5" />
        </div>
        <span v-show="!collapsed" class="text-[11px] font-black uppercase tracking-widest">Pattern Smart</span>
      </router-link>

      <router-link to="/dietometer"
        class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/dietometer' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')">
        <div class="tooltip" :data-tip="'Dietometro'">
          <Wheat class="w-5 h-5" />
        </div>
        <span v-show="!collapsed" class="text-[11px] font-black uppercase tracking-widest">Dietometro</span>
      </router-link>

      <router-link to="/summary" class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/summary' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')">
        <div class="tooltip" :data-tip="'Resoconto periodico'">
          <FileText class="w-5 h-5" />
        </div>
        <span v-show="!collapsed" class="text-[11px] font-black uppercase tracking-widest">Resoconto periodico</span>
      </router-link>

      <router-link to="/sensors" class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/sensors' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')">
        <div class="tooltip" :data-tip="'Storico Sensori'">
          <Microchip class="w-5 h-5" />
        </div>
        <span v-show="!collapsed" class="text-[11px] font-black uppercase tracking-widest">Storico Sensori</span>
      </router-link>

      <router-link to="/about" class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/about' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')">
        <div class="tooltip" :data-tip="'Informazioni'">
          <Info class="w-5 h-5" />
        </div>
        <span v-show="!collapsed" class="text-[11px] font-black uppercase tracking-widest">Informazioni</span>
      </router-link>

      <router-link to="/settings" class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group"
        :class="$route.path === '/settings' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'hover:bg-base-300 opacity-60 hover:opacity-100'"
        @click="$emit('close-drawer')">
        <div class="tooltip" :data-tip="'Impostazioni'">
          <Settings class="w-5 h-5" />
        </div>
        <span v-show="!collapsed" class="text-[11px] font-black uppercase tracking-widest">Impostazioni</span>
      </router-link>
    </nav>

    <!-- Footer Sidebar: Refresh + Themes + Version -->
    <div class="p-3 mt-auto border-t border-base-content/5">
      <div class="flex items-center" :class="collapsed ? 'justify-center' : 'justify-between gap-2 mb-3'">
        <button @click="toggle" class="btn btn-ghost btn-sm btn-square" :class="collapsed ? '' : 'mr-2'"
          title="Comprimi/espandi sidebar">
          <component :is="collapsed ? ChevronRight : ChevronLeft" class="w-4 h-4" />
        </button>

        <div class="flex items-center gap-2" :class="collapsed ? 'justify-center w-full' : ''">
          <button v-show="!collapsed" @click="doRefresh" class="btn btn-ghost btn-sm btn-circle" title="Sincronizza">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': store.loading }" />
          </button>
          <div v-show="!collapsed" class="relative">
            <button ref="themeBtn" @click="toggleThemes"
              class="btn btn-ghost btn-sm gap-2 normal-case hover:bg-base-200" type="button">
              <Palette class="w-4 h-4" />
              <span class="font-bold text-xs uppercase tracking-widest opacity-60">Tema</span>
            </button>

            <teleport to="body">
              <div v-if="showThemes" ref="themeDropdown" :style="dropdownStyle"
                class="p-3 shadow-2xl bg-base-300/90 backdrop-blur-xl rounded-box w-64 border border-white/10">
                <ul class="menu">
                  <li v-for="t in themes" :key="t" class="mb-1 last:mb-0">
                    <button
                      class="flex items-center justify-between p-2 rounded-xl outline-none focus:outline-none transition-all duration-200 bg-base-100/50 hover:bg-base-200 w-full"
                      :class="{ 'ring-2 ring-primary ring-offset-2 ring-offset-base-300': currentThemeLocal === t }"
                      @click="applyTheme(t)" :data-theme="t">
                      <div class="flex items-center gap-2">
                        <span class="w-4 h-3 rounded-sm" :class="['bg-primary']" aria-hidden="true"></span>
                        <span class="w-4 h-3 rounded-sm" :class="['bg-secondary']" aria-hidden="true"></span>
                        <span class="w-4 h-3 rounded-sm" :class="['bg-accent']" aria-hidden="true"></span>
                        <span class="text-[11px] font-black uppercase tracking-widest ml-2">{{ t }}</span>
                      </div>
                      <span v-if="currentThemeLocal === t" class="text-primary font-black">✓</span>
                    </button>
                  </li>
                </ul>
              </div>
            </teleport>
          </div>
        </div>
        <div v-show="!collapsed" class="text-[10px] font-black opacity-40">{{ APP_VERSION_LABEL }}</div>
      </div>

      <div class="flex items-center justify-center" v-show="collapsed">
        <button @click="doRefresh" class="btn btn-ghost btn-sm btn-circle" title="Sincronizza">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': store.loading }" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { APP_VERSION_LABEL } from '../appVersion'
import { useGlucoseStore } from '../stores/glucose'
import {
  Zap,
  Calendar,
  Brain,
  Wheat,
  FileText,
  Settings,
  Info,
  RefreshCw,
  Palette,
  ChevronLeft,
  ChevronRight,
  Microchip
} from 'lucide-vue-next'
import favicon from '../assets/favicon.png'

const $route = useRoute()
const store = useGlucoseStore()
const APP_VERSION_LABEL_LOCAL = APP_VERSION_LABEL

const collapsed = ref(localStorage.getItem('sidebar-collapsed') === '1')

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem('sidebar-collapsed', collapsed.value ? '1' : '0')
}

function doRefresh() {
  store.syncNow()
}

// Use theme from store
const emit = defineEmits(['close-drawer'])

function setTheme(t) {
  store.setTheme(t)
}

const themes = store.themes
const currentThemeLocal = computed(() => store.theme)

// Theme dropdown overlay (teleport)
const showThemes = ref(false)
const themeBtn = ref(null)
const themeDropdown = ref(null)
const dropdownStyle = ref({ position: 'fixed', zIndex: 9999 })

function toggleThemes() {
  showThemes.value = !showThemes.value
  if (showThemes.value) positionDropdown()
}

function applyTheme(t) {
  setTheme(t)
  showThemes.value = false
}

function positionDropdown() {
  nextTick(() => {
    const btn = themeBtn.value
    const dd = themeDropdown.value
    if (!btn) return

    const rect = btn.getBoundingClientRect()
    const dropdownWidth = 256
    const measuredHeight = dd ? dd.offsetHeight : 240

    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom

    let top
    if (spaceAbove > measuredHeight + 16) {
      top = rect.top - measuredHeight - 8
    } else {
      top = rect.bottom + 8
    }

    top = Math.max(8, Math.min(top, window.innerHeight - measuredHeight - 8))

    let left = rect.left
    if (left + dropdownWidth > window.innerWidth - 8) {
      left = window.innerWidth - dropdownWidth - 8
    }
    if (left < 8) left = 8

    dropdownStyle.value = {
      position: 'fixed',
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      width: '16rem',
      zIndex: 9999
    }
  })
}

function onDocClick(e) {
  const btn = themeBtn.value
  const dd = themeDropdown.value
  if (!showThemes.value) return
  if (btn && btn.contains(e.target)) return
  if (dd && dd.contains(e.target)) return
  showThemes.value = false
}

function onKey(e) {
  if (e.key === 'Escape') showThemes.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick, true)
  window.addEventListener('resize', positionDropdown)
  window.addEventListener('scroll', positionDropdown, true)
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, true)
  window.removeEventListener('resize', positionDropdown)
  window.removeEventListener('scroll', positionDropdown, true)
  document.removeEventListener('keydown', onKey)
})

</script>

<style scoped>
.router-link-active {
  /* Classi gestite dinamicamente nel template */
}
</style>
