<template>
  <div class="flex flex-col gap-4 md:gap-6 px-2 md:px-4 lg:px-0 pb-28">

    <!-- Header con PageHeader centralizzato -->
    <PageHeader
      :title="$t('settings.title')"
      :subtitle="$t('settings.subtitle')"
      icon="fa-solid fa-gear"
      variant="primary"
    >
      <template #actions>
        <button
          @click="save"
          class="btn btn-primary btn-sm md:btn-md font-bold gap-2 shadow-sm"
          :disabled="store.loading"
        >
          <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>
          <i v-else class="fa-solid fa-floppy-disk"></i>
          {{ $t('settings.saveBtn') }}
        </button>
      </template>
    </PageHeader>

    <!-- Toast / Alert di Salvataggio -->
    <div
      v-if="saved"
      class="alert alert-success shadow-sm rounded-xl py-3 px-4 flex items-center justify-between animate-fade-in"
    >
      <div class="flex items-center gap-2 font-semibold text-sm">
        <i class="fa-solid fa-circle-check text-base"></i>
        <span>{{ $t('settings.savedSuccess') }}</span>
      </div>
      <button @click="saved = false" class="btn btn-ghost btn-xs btn-circle">✕</button>
    </div>

    <!-- Griglia Bento Modulare -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
      <!-- Range Glicemico (Full width) -->
      <div class="lg:col-span-2">
        <SettingsGlucoseRanges :form="form" />
      </div>

      <!-- Farmacocinetica Insulina & Carboidrati -->
      <SettingsInsulinCarbs :form="form" />

      <!-- Notifiche Telegram -->
      <SettingsTelegram :form="form" />

      <!-- Sicurezza & PIN Lock -->
      <SettingsSecurity
        @pin-updated="onPinUpdated"
        @open-remove-modal="openRemovePinModal"
      />

      <!-- Esportazione Dati & Backup -->
      <SettingsExport
        @open-export-modal="openExportModal"
        @open-reset-modal="openResetModal"
      />

      <!-- Selettore Lingua -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-primary rounded-2xl lg:col-span-2">
        <div class="card-body p-4 md:p-6 gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 md:p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20 text-primary">
              <i class="fa-solid fa-language text-lg md:text-xl"></i>
            </div>
            <div>
              <h3 class="text-sm md:text-base font-bold text-base-content">
                {{ $t('settings.languageCardTitle') }}
              </h3>
              <p class="text-xs text-base-content/60 font-medium">
                {{ $t('settings.languageCardSubtitle') }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              @click="onSelectLanguage('it')"
              class="btn btn-sm rounded-xl font-bold gap-2"
              :class="currentLocale === 'it' ? 'btn-primary' : 'btn-ghost bg-base-100/60 border-base-content/10'"
            >
              <span>🇮🇹</span>
              <span>{{ $t('settings.italian') }}</span>
            </button>
            <button
              type="button"
              @click="onSelectLanguage('en')"
              class="btn btn-sm rounded-xl font-bold gap-2"
              :class="currentLocale === 'en' ? 'btn-primary' : 'btn-ghost bg-base-100/60 border-base-content/10'"
            >
              <span>🇬🇧</span>
              <span>{{ $t('settings.english') }}</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Modali Ausiliari -->
    <ExportModal :open="showExportModal" @close="showExportModal = false" />

    <!-- Modale Reset Impostazioni -->
    <dialog id="reset_modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box bg-base-200 border border-base-content/10 rounded-2xl p-6 space-y-4">
        <div class="flex items-center gap-3 text-warning">
          <div class="p-3 bg-warning/10 rounded-xl">
            <i class="fa-solid fa-triangle-exclamation text-xl"></i>
          </div>
          <div>
            <h3 class="font-bold text-lg text-base-content">{{ $t('settings.resetModalTitle') }}</h3>
            <p class="text-xs text-base-content/60 font-medium">{{ $t('settings.resetModalSubtitle') }}</p>
          </div>
        </div>
        <p class="text-sm text-base-content/80">{{ $t('settings.resetModalText') }}</p>
        <div class="modal-action flex justify-end gap-2">
          <form method="dialog">
            <button class="btn btn-ghost font-bold">{{ $t('common.cancel') }}</button>
          </form>
          <button @click="confirmReset" class="btn btn-warning font-bold gap-2">
            <i class="fa-solid fa-arrow-rotate-left"></i>
            {{ $t('settings.resetConfirm') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>{{ $t('common.close') }}</button>
      </form>
    </dialog>

    <!-- Modale Rimozione PIN -->
    <dialog id="remove_pin_modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box bg-base-200 border border-base-content/10 rounded-2xl p-6 space-y-4">
        <div class="flex items-center gap-3 text-error">
          <div class="p-3 bg-error/10 rounded-xl">
            <i class="fa-solid fa-lock-open text-xl"></i>
          </div>
          <div>
            <h3 class="font-bold text-lg text-base-content">{{ $t('pin.removeModalTitle') }}</h3>
            <p class="text-xs text-base-content/60 font-medium">{{ $t('pin.removeModalSubtitle') }}</p>
          </div>
        </div>
        <p class="text-sm text-base-content/80">{{ $t('pin.removeModalText') }}</p>
        <div class="modal-action flex justify-end gap-2">
          <form method="dialog">
            <button class="btn btn-ghost font-bold">{{ $t('common.cancel') }}</button>
          </form>
          <button @click="confirmRemovePin" class="btn btn-error font-bold gap-2">
            <i class="fa-solid fa-trash"></i>
            {{ $t('pin.removeConfirm') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>{{ $t('common.close') }}</button>
      </form>
    </dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useGlucoseStore } from '../stores/glucose'
import { setLanguage } from '../i18n'
import PageHeader from '../components/PageHeader.vue'
import SettingsGlucoseRanges from '../components/settings/SettingsGlucoseRanges.vue'
import SettingsInsulinCarbs from '../components/settings/SettingsInsulinCarbs.vue'
import SettingsTelegram from '../components/settings/SettingsTelegram.vue'
import SettingsSecurity from '../components/settings/SettingsSecurity.vue'
import SettingsExport from '../components/settings/SettingsExport.vue'
import ExportModal from '../components/ExportModal.vue'

const { locale } = useI18n()
const store = useGlucoseStore()
const auth = useAuthStore()

const saved = ref(false)
const showExportModal = ref(false)

const currentLocale = computed(() => locale.value)

function onSelectLanguage(code) {
  setLanguage(code)
}

const form = reactive({
  tir_min: 70,
  tir_max: 180,
  red_under: 55,
  red_over: 250,
  rapid_duration: 3,
  slow_duration: 24,
  carb_duration: 4,
  insulin_sensitivity: 60,
  carb_ratio: 15,
  quick_insulin_1: 1,
  quick_insulin_2: 2,
  quick_carb_1: 10,
  quick_carb_2: 20,
  telegram_enabled: false,
  telegram_high_low_alerts: true,
  telegram_insulin_alerts: false,
  telegram_carb_alerts: false,
  telegram_daily_summary: false,
  telegram_daily_summary_time: '21:00'
})

onMounted(async () => {
  await store.fetchSettings()
  updateFormFromStore()
})

function normalizeBoolean(value, fallback = false) {
  if (value === null || value === undefined) return fallback
  if (value === true || value === 1 || value === '1' || value === 'true') return true
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return Boolean(value)
}

function updateFormFromStore() {
  form.tir_min = store.settings.tir_min ?? 70
  form.tir_max = store.settings.tir_max ?? 180
  form.red_under = store.settings.red_under ?? 55
  form.red_over = store.settings.red_over ?? 250

  form.rapid_duration = store.settings.rapid_duration ?? 3
  form.slow_duration = store.settings.slow_duration ?? 24
  form.carb_duration = store.settings.carb_duration ?? 4

  form.insulin_sensitivity = store.settings.insulin_sensitivity ?? 60
  form.carb_ratio = store.settings.carb_ratio ?? 15

  form.quick_insulin_1 = store.settings.quick_insulin_1 ?? 1
  form.quick_insulin_2 = store.settings.quick_insulin_2 ?? 2
  form.quick_carb_1 = store.settings.quick_carb_1 ?? 10
  form.quick_carb_2 = store.settings.quick_carb_2 ?? 20

  form.telegram_enabled = normalizeBoolean(store.settings.telegram_enabled, false)
  form.telegram_high_low_alerts = normalizeBoolean(store.settings.telegram_high_low_alerts, true)
  form.telegram_insulin_alerts = normalizeBoolean(store.settings.telegram_insulin_alerts, false)
  form.telegram_carb_alerts = normalizeBoolean(store.settings.telegram_carb_alerts, false)
  form.telegram_daily_summary = normalizeBoolean(store.settings.telegram_daily_summary, false)
  form.telegram_daily_summary_time = store.settings.telegram_daily_summary_time || '21:00'
}

function openResetModal() {
  document.getElementById('reset_modal')?.showModal()
}

async function confirmReset() {
  await store.resetSettings()
  updateFormFromStore()
  document.getElementById('reset_modal')?.close()
  triggerSavedAlert()
}

async function save() {
  await store.updateSettings({ ...form })
  if (!store.error) {
    updateFormFromStore()
    triggerSavedAlert()
  }
}

function openExportModal() {
  showExportModal.value = true
}

function onPinUpdated() {
  triggerSavedAlert()
}

function openRemovePinModal() {
  document.getElementById('remove_pin_modal')?.showModal()
}

async function confirmRemovePin() {
  const ok = await auth.removePin()
  if (ok) {
    document.getElementById('remove_pin_modal')?.close()
    triggerSavedAlert()
  }
}

function triggerSavedAlert() {
  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 3000)
}
</script>