<template>
  <div class="fixed inset-0 z-[300] flex items-center justify-center bg-base-100/95 backdrop-blur-sm">
    <div class="card bg-gradient-to-br from-base-200 to-base-300 shadow-2xl border border-base-content/10 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-sm w-full mx-4">
      <div class="card-body gap-4 md:gap-6">
        <div class="flex flex-col items-center gap-3 md:gap-4">
          <div class="p-3 md:p-4 bg-primary/10 rounded-xl md:rounded-2xl shadow-md shadow-primary/20">
            <i class="fa-solid fa-lock text-primary text-xl md:text-2xl"></i>
          </div>
          <div class="text-center">
            <h2 class="text-base md:text-lg font-black uppercase tracking-tight">{{ $t('pin.title') }}</h2>
            <span class="text-[10px] font-black opacity-40 uppercase tracking-widest">{{ $t('pin.subtitle') }}</span>
          </div>
        </div>

        <form @submit.prevent="verify" class="space-y-3 md:space-y-4">
          <input
            ref="pinInput"
            v-model="pin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            :placeholder="$t('pin.placeholder')"
            class="input input-bordered font-black text-center text-lg tracking-[0.3em] w-full"
            :class="{ 'input-error': error }"
            @keyup.enter="verify"
          />
          <div v-if="error" class="text-[10px] font-black text-error uppercase tracking-widest text-center">
            {{ error }}
          </div>
          <button type="submit" class="btn btn-primary w-full font-black uppercase tracking-widest text-xs shadow-md shadow-primary/40">
            <span v-if="loading" class="loading loading-spinner loading-xs"></span>
            <span v-else>{{ $t('pin.unlock') }}</span>
          </button>
        </form>

        <div class="text-center">
          <button @click="openRecovery" class="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-all">
            {{ $t('pin.forgot') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Recovery Modal -->
    <dialog v-if="showRecovery" class="modal modal-open">
      <div class="modal-box bg-base-200 border border-base-content/10 shadow-2xl rounded-2xl md:rounded-3xl max-w-sm w-full mx-4">
        <h3 class="font-black text-sm uppercase tracking-widest mb-2">{{ $t('pin.recoveryTitle') }}</h3>
        <p class="text-[10px] opacity-60 mb-4">{{ $t('pin.recoveryDesc') }}</p>

        <div v-if="recoverySent" class="space-y-2">
          <div class="alert alert-success text-[10px] font-black">
            <i class="fa-solid fa-check"></i>
            <span>{{ $t('pin.recoverySent') }}</span>
          </div>
        </div>

        <div v-else class="space-y-3">
          <input v-model="recoveryToken" type="text" maxlength="32"
            :placeholder="$t('pin.recoveryPlaceholder')"
            class="input input-bordered font-black text-center tracking-[0.2em] w-full" />

          <button @click="requestRecovery" class="btn btn-primary w-full font-black uppercase tracking-widest text-xs"
            :disabled="recoveryLoading">
            <span v-if="recoveryLoading" class="loading loading-spinner loading-xs"></span>
            <span v-else>{{ $t('pin.recoveryRequest') }}</span>
          </button>
        </div>

        <div v-if="recoveryVerified" class="space-y-2 mt-3">
          <div class="alert alert-success text-[10px] font-black">
            <i class="fa-solid fa-check"></i>
            <span>{{ $t('pin.recoverySuccess') }}</span>
          </div>
        </div>

        <div class="modal-action justify-end mt-4">
          <button @click="closeRecovery" class="btn btn-ghost btn-xs font-black uppercase tracking-widest">
            {{ $t('common.close') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeRecovery">{{ $t('common.close') }}</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlucoseStore } from '../stores/glucose'

const { t } = useI18n()
const store = useGlucoseStore()
const pin = ref('')
const error = ref('')
const loading = ref(false)
const pinInput = ref(null)

const showRecovery = ref(false)
const recoveryToken = ref('')
const recoveryLoading = ref(false)
const recoverySent = ref(false)
const recoveryVerified = ref(false)

onMounted(() => {
  pinInput.value?.focus()
})

async function verify() {
  error.value = ''
  loading.value = true
  const ok = await store.verifyPin(pin.value)
  if (ok) {
    window.location.reload()
  } else {
    error.value = t('pin.wrong')
    pin.value = ''
  }
  loading.value = false
}

function openRecovery() {
  showRecovery.value = true
  recoverySent.value = false
  recoveryVerified.value = false
  recoveryToken.value = ''
}

function closeRecovery() {
  showRecovery.value = false
}

async function requestRecovery() {
  recoveryLoading.value = true
  try {
    await store.requestPinRecovery()
    recoverySent.value = true
  } catch {
    // error handled in store
  } finally {
    recoveryLoading.value = false
  }
}
</script>