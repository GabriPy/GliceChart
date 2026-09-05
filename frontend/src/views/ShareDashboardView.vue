<template>
  <div class="min-h-screen bg-base-100">
    <div class="flex flex-col gap-4 md:gap-6 px-2 md:px-4 lg:px-6 py-4 md:py-6 max-w-7xl mx-auto">

      <!-- Header Minimal -->
      <div class="relative overflow-hidden bg-gradient-to-br from-base-200 to-base-300 shadow-lg border border-base-content/10 rounded-2xl md:rounded-3xl">
        <div class="absolute top-0 right-0 w-48 h-48 bg-primary/15 rounded-full blur-3xl opacity-70"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 bg-accent/15 rounded-xl blur-2xl opacity-70"></div>

        <div class="relative card-body p-4 md:p-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl shadow-md shadow-primary/30">
                <i class="fa-solid fa-chart-line text-primary text-xl md:text-2xl"></i>
              </div>
              <div>
                <h2 class="text-lg md:text-xl font-black uppercase tracking-tight leading-none">GliceChart</h2>
                <span class="text-[10px] md:text-xs font-black opacity-40 uppercase tracking-[0.2em]">Dashboard condivisa</span>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <div v-if="publicData?.last_updated" class="px-3 py-1.5 bg-base-100/50 rounded-lg border border-base-content/10 shadow-sm">
                <span class="text-[10px] font-black uppercase opacity-50 mr-2">Ultimo aggiornamento</span>
                <span class="text-[11px] font-bold font-mono">{{ formatDateTime(publicData.last_updated) }}</span>
              </div>
              <div v-if="publicData?.expires_at" class="px-3 py-1.5 bg-info/10 rounded-lg border border-info/20 shadow-sm">
                <i class="fa-regular fa-clock text-info mr-1.5 text-[10px]"></i>
                <span class="text-[11px] font-bold text-info">Scade {{ formatDateTime(publicData.expires_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stato Link Scaduto / Non Valido -->
      <div v-if="errorState === 'invalid'" class="card bg-error/10 border border-error/20 shadow-xl rounded-3xl">
        <div class="card-body items-center text-center py-10 md:py-16 gap-4">
          <div class="p-4 bg-error/10 rounded-2xl">
            <i class="fa-solid fa-link-slash text-error text-4xl md:text-6xl opacity-80"></i>
          </div>
          <h3 class="text-xl md:text-2xl font-black uppercase tracking-tight text-error">Link non valido</h3>
          <p class="text-xs md:text-sm opacity-70 max-w-md leading-relaxed">
            Questo link di condivisione è scaduto, è stato revocato o non esiste.
            Chiedi alla persona che te lo ha inviato di generarne uno nuovo.
          </p>
        </div>
      </div>

      <!-- Errore di rete -->
      <div v-else-if="errorState === 'network'" class="card bg-warning/10 border border-warning/20 shadow-xl rounded-3xl">
        <div class="card-body items-center text-center py-10 md:py-16 gap-4">
          <div class="p-4 bg-warning/10 rounded-2xl">
            <i class="fa-solid fa-wifi text-warning text-4xl md:text-6xl opacity-80"></i>
          </div>
          <h3 class="text-xl md:text-2xl font-black uppercase tracking-tight text-warning">Errore di connessione</h3>
          <p class="text-xs md:text-sm opacity-70 max-w-md leading-relaxed">
            Impossibile caricare i dati. Verifica la connessione e riprova.
          </p>
          <button @click="fetchPublicShare" class="btn btn-warning btn-sm font-black uppercase">
            Riprova
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-else-if="loadingState" class="card bg-base-200/70 border border-base-content/5 rounded-3xl">
        <div class="card-body items-center text-center py-16 gap-3">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-xs font-black uppercase opacity-50 tracking-widest">Caricamento dashboard condivisa...</p>
        </div>
      </div>

      <!-- Contenuto Principale -->
      <template v-else-if="publicData">
        <!-- Avviso Sola Lettura -->
        <div class="alert bg-primary/5 border border-primary/20 text-primary/80 rounded-2xl py-3 px-4 md:px-5 shadow-sm">
          <i class="fa-solid fa-eye text-lg"></i>
          <div class="flex-1">
            <span class="font-black text-[10px] md:text-xs uppercase tracking-wider block mb-0.5">Vista di sola lettura</span>
            <span class="text-[10px] md:text-xs opacity-80 leading-relaxed">
              Questa è una dashboard condivisa. Non è possibile modificare, eliminare o aggiungere dati.
              {{ publicData.allow_notes ? 'Sono visibili anche le note.' : 'Le note sono nascoste.' }}
            </span>
          </div>
        </div>

        <!-- Riga 1: Current Glucose + GlucoseChart -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch">
          <div class="lg:col-span-4 flex">
            <CurrentGlucose class="flex-1" />
          </div>
          <div class="lg:col-span-8 flex">
            <GlucoseChart class="flex-1" />
          </div>
        </div>

        <!-- Riga 2: Daily Stats -->
        <div class="w-full">
          <DailyStats />
        </div>

        <!-- Storici Sintetici (Solo se presenti dati) -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          <div v-if="recentInsulin.length" class="card bg-gradient-to-br from-base-200 to-base-300 border border-base-content/10 shadow-lg rounded-3xl">
            <div class="card-body p-4 md:p-5 gap-3">
              <div class="flex items-center gap-2 mb-1">
                <div class="p-2 bg-primary/10 rounded-lg"><i class="fa-solid fa-syringe text-primary"></i></div>
                <div>
                  <h3 class="text-[10px] md:text-xs font-black uppercase tracking-wider">Insulina</h3>
                  <span class="text-[9px] font-bold opacity-40 uppercase tracking-widest">Ultimi {{ recentInsulin.length }} record</span>
                </div>
              </div>
              <ul class="divide-y divide-base-content/5 -mx-1">
                <li v-for="r in recentInsulin" :key="'ins-' + r.id" class="flex items-center justify-between px-2 py-2.5">
                  <div class="flex items-center gap-2.5">
                    <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                      :class="r.type === 'rapid' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'">
                      {{ r.type === 'rapid' ? 'R' : 'L' }}
                    </span>
                    <div class="flex flex-col">
                      <span class="text-[11px] md:text-xs font-bold">{{ r.units }} <span class="opacity-40 text-[9px] font-black ml-0.5">U</span></span>
                      <span v-if="r.tag" class="text-[9px] font-bold opacity-50 uppercase tracking-wide">{{ r.tag }}</span>
                    </div>
                  </div>
                  <span class="text-[9px] md:text-[10px] font-mono opacity-50 font-bold">{{ formatDateTime(r.timestamp) }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div v-if="recentCarbs.length" class="card bg-gradient-to-br from-base-200 to-base-300 border border-base-content/10 shadow-lg rounded-3xl">
            <div class="card-body p-4 md:p-5 gap-3">
              <div class="flex items-center gap-2 mb-1">
                <div class="p-2 bg-accent/10 rounded-lg"><i class="fa-solid fa-bread-slice text-accent"></i></div>
                <div>
                  <h3 class="text-[10px] md:text-xs font-black uppercase tracking-wider">Carboidrati</h3>
                  <span class="text-[9px] font-bold opacity-40 uppercase tracking-widest">Ultimi {{ recentCarbs.length }} record</span>
                </div>
              </div>
              <ul class="divide-y divide-base-content/5 -mx-1">
                <li v-for="r in recentCarbs" :key="'carb-' + r.id" class="flex items-center justify-between px-2 py-2.5">
                  <div class="flex items-center gap-2.5">
                    <span class="w-6 h-6 rounded-lg bg-accent/15 text-accent flex items-center justify-center text-[10px] font-black">g</span>
                    <div class="flex flex-col">
                      <span class="text-[11px] md:text-xs font-bold">{{ r.amount }} <span class="opacity-40 text-[9px] font-black ml-0.5">g</span></span>
                      <span v-if="r.tag" class="text-[9px] font-bold opacity-50 uppercase tracking-wide">{{ r.tag }}</span>
                    </div>
                  </div>
                  <span class="text-[9px] md:text-[10px] font-mono opacity-50 font-bold">{{ formatDateTime(r.timestamp) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-4">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-base-200/50 border border-base-content/5 rounded-2xl">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-primary/70 text-sm"></i>
              <span class="text-[10px] md:text-xs font-bold opacity-60">
                Dati condivisi da GliceChart • Dashboard in sola lettura
              </span>
            </div>
            <span class="text-[10px] font-black uppercase opacity-40 tracking-widest">
              v{{ appVersion }}
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import CurrentGlucose from '../components/CurrentGlucose.vue'
import GlucoseChart from '../components/GlucoseChart.vue'
import DailyStats from '../components/DailyStats.vue'
import { useGlucoseStore } from '../stores/glucose'

const { locale } = useI18n()
const route = useRoute()
const store = useGlucoseStore()

const appVersion = '4.6.0'
const loadingState = ref(true)
const errorState = ref(null)
const publicData = ref(null)

const recentInsulin = computed(() => (publicData.value?.insulin || []).slice(0, 10))
const recentCarbs = computed(() => (publicData.value?.carbs || []).slice(0, 10))

function formatDateTime(iso) {
  try {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    const loc = locale.value === 'en' ? 'en-US' : 'it-IT'
    return d.toLocaleString(loc, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

async function fetchPublicShare() {
  const token = route.params.token
  if (!token) {
    errorState.value = 'invalid'
    loadingState.value = false
    return
  }
  try {
    loadingState.value = true
    errorState.value = null
    const { data } = await axios.get(`/api/share/${token}/public`)

    if (!data || !data.valid) {
      errorState.value = 'invalid'
      return
    }

    publicData.value = data

    store.current = data.current || null
    store.readings = data.readings || []
    store.allInsulin = data.insulin || []
    store.allCarbs = data.carbs || []
    store.notes = data.allow_notes ? (data.notes || []) : []
    store.settings = data.settings || store.settings
    store.lastUpdated = data.last_updated ? new Date(data.last_updated) : new Date()
    store.selectedRange = 180
  } catch (err) {
    const status = err?.response?.status
    if (status === 404 || status === 410) {
      errorState.value = 'invalid'
    } else {
      errorState.value = 'network'
    }
  } finally {
    loadingState.value = false
  }
}

onMounted(() => {
  fetchPublicShare()
})
</script>
