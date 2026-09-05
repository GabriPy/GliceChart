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
      </div>
    </div>
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
</script>
