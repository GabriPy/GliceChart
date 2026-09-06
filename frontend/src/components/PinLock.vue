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

    <dialog v-if="showRecovery" class="modal modal-open">
      <div class="modal-box bg-base-200 border border-base-content/10 shadow-2xl rounded-2xl md:rounded-3xl max-w-sm w-full mx-4">
        <h3 class="font-black text-sm uppercase tracking-widest mb-2">{{ $t('pin.recoveryTitle') }}</h3>
        <p class="text-[10px] opacity-60 mb-4">{{ $t('pin.recoveryDesc') }}</p>

        <div v-if="!recovery.requestSent" class="space-y-3">
          <button @click="requestRecovery" class="btn btn-primary w-full font-black uppercase tracking-widest text-xs"
            :disabled="recovery.loading">
            <span v-if="recovery.loading" class="loading loading-spinner loading-xs"></span>
            <span v-else>{{ $t('pin.recoveryRequest') }}</span>
          </button>
        </div>

        <div v-else-if="!recovery.verified" class="space-y-3">
          <input v-model="recoveryCode" type="text" inputmode="numeric" maxlength="6"
            :placeholder="$t('pin.recoveryPlaceholder')"
            class="input input-bordered font-black text-center tracking-[0.2em] w-full" />

          <button @click="verifyRecovery" class="btn btn-primary w-full font-black uppercase tracking-widest text-xs"
            :disabled="recovery.loading">
            <span v-if="recovery.loading" class="loading loading-spinner loading-xs"></span>
            <span v-else>{{ $t('pin.recoveryVerify') }}</span>
          </button>
        </div>

        <div v-else class="space-y-3">
          <input v-model="newPin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6"
            :placeholder="$t('pin.newPlaceholder')"
            class="input input-bordered font-black text-center tracking-[0.2em] w-full" />
          <input v-model="confirmPin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6"
            :placeholder="$t('pin.confirmNewPin')"
            class="input input-bordered font-black text-center tracking-[0.2em] w-full" />

          <button @click="resetPin" class="btn btn-primary w-full font-black uppercase tracking-widest text-xs"
            :disabled="recovery.loading || !newPin || !confirmPin">
            <span v-if="recovery.loading" class="loading loading-spinner loading-xs"></span>
            <span v-else>{{ $t('pin.resetPin') }}</span>
          </button>
        </div>

        <div v-if="recovery.error" class="mt-3 text-[10px] font-black text-error uppercase tracking-widest text-center">
          {{ recovery.error }}
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
import { useAuthStore } from '../stores/auth'
import { useRecoveryStore } from '../stores/recovery'

const { t } = useI18n()
const auth = useAuthStore()
const recovery = useRecoveryStore()
const pin = ref('')
const error = ref('')
const loading = ref(false)
const pinInput = ref(null)

const showRecovery = ref(false)
const recoveryCode = ref('')
const newPin = ref('')
const confirmPin = ref('')

onMounted(() => {
  pinInput.value?.focus()
})

async function verify() {
  error.value = ''
  loading.value = true
  const ok = await auth.verifyPin(pin.value)
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
  recovery.resetState()
  recoveryCode.value = ''
  newPin.value = ''
  confirmPin.value = ''
}

function closeRecovery() {
  showRecovery.value = false
  recovery.resetState()
}

async function requestRecovery() {
  const ok = await recovery.requestRecovery()
  if (!ok) {
    recoveryCode.value = ''
  }
}

async function verifyRecovery() {
  const ok = await recovery.verifyRecoveryCode(recoveryCode.value)
  if (!ok) {
    recoveryCode.value = ''
  }
}

async function resetPin() {
  if (newPin.value !== confirmPin.value) {
    recovery.error = 'PINs do not match'
    return
  }

  const ok = await recovery.resetPin(newPin.value)
  if (ok) {
    window.location.reload()
  }
}
</script>