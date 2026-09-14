<template>
  <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-warning rounded-2xl">
    <div class="card-body p-4 md:p-6 gap-4 md:gap-5">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="p-2.5 md:p-3 bg-warning/10 rounded-xl ring-1 ring-warning/20 text-warning">
            <i class="fa-solid fa-lock text-lg md:text-xl"></i>
          </div>
          <div>
            <h3 class="text-sm md:text-base font-bold text-base-content">
              {{ $t('pin.cardTitle') }}
            </h3>
            <p class="text-xs text-base-content/60 font-medium">
              {{ $t('pin.cardSubtitle') }}
            </p>
          </div>
        </div>

        <div v-if="auth.pinEnabled" class="flex items-center gap-2 px-3 py-1 bg-success/10 rounded-lg ring-1 ring-success/20 w-fit shrink-0">
          <div class="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span class="text-xs font-bold text-success">{{ $t('pin.enabled') }}</span>
        </div>
        <div v-else class="flex items-center gap-2 px-3 py-1 bg-base-100/50 rounded-lg ring-1 ring-base-content/10 w-fit shrink-0">
          <div class="w-2 h-2 rounded-full bg-base-content/40"></div>
          <span class="text-xs font-semibold opacity-60">{{ $t('settings.inactiveStatus') }}</span>
        </div>
      </div>

      <div class="divider my-0 opacity-10"></div>

      <!-- Nessun PIN impostato -->
      <div v-if="!auth.pinEnabled" class="flex flex-col sm:flex-row sm:items-end gap-3">
        <div class="space-y-1.5 flex-1">
          <label class="text-xs font-semibold text-base-content/70">
            {{ $t('pin.newPlaceholder') }} (4-6 cifre)
          </label>
          <input
            v-model="newPin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            :placeholder="$t('pin.newPlaceholder')"
            class="input input-bordered input-sm md:input-md w-full font-semibold text-center tracking-[0.2em]"
          />
        </div>
        <button
          @click="onSavePin"
          class="btn btn-warning btn-sm md:btn-md font-bold gap-2 shrink-0"
          :disabled="auth.loading || !newPin || newPin.length < 4"
        >
          <span v-if="auth.loading" class="loading loading-spinner loading-xs"></span>
          <i v-else class="fa-solid fa-check"></i>
          {{ $t('pin.setBtn') }}
        </button>
      </div>

      <!-- PIN già impostato -->
      <div v-else class="flex flex-col sm:flex-row sm:items-end gap-3">
        <div class="space-y-1.5 flex-1">
          <label class="text-xs font-semibold text-base-content/70">
            {{ $t('pin.editPinPlaceholder') }}
          </label>
          <input
            v-model="currentPin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            :placeholder="$t('pin.editPinPlaceholder')"
            class="input input-bordered input-sm md:input-md w-full font-semibold text-center tracking-[0.2em]"
          />
        </div>
        <div class="flex gap-2 shrink-0">
          <button
            @click="onChangePin"
            class="btn btn-primary btn-sm md:btn-md font-bold gap-2"
            :disabled="auth.loading || !currentPin || currentPin.length < 4"
          >
            <span v-if="auth.loading" class="loading loading-spinner loading-xs"></span>
            <i v-else class="fa-solid fa-rotate"></i>
            {{ $t('pin.changeBtn') }}
          </button>
          <button
            @click="$emit('open-remove-modal')"
            class="btn btn-error btn-outline btn-sm md:btn-md font-bold gap-2"
            :disabled="auth.loading"
          >
            <i class="fa-solid fa-trash"></i>
            {{ $t('pin.removeBtn') }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const emit = defineEmits(['pin-updated', 'open-remove-modal'])

const newPin = ref('')
const currentPin = ref('')

async function onSavePin() {
  const ok = await auth.setPin(newPin.value)
  if (ok) {
    newPin.value = ''
    emit('pin-updated')
  }
}

async function onChangePin() {
  const ok = await auth.setPin(currentPin.value)
  if (ok) {
    currentPin.value = ''
    emit('pin-updated')
  }
}
</script>
