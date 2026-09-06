import { computed, ref } from 'vue'
import axios from 'axios'
import { defineStore } from 'pinia'

const SESSION_KEY = 'glicechart_unlocked'
const TOKEN_KEY = 'glicechart_unlock_token'

function persistUnlock(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(SESSION_KEY, '1')
}

function clearUnlock() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

function validatePin(pin) {
  const normalized = String(pin ?? '').trim()
  if (!/^\d+$/.test(normalized)) {
    throw new Error('PIN must contain only digits')
  }
  if (normalized.length < 4 || normalized.length > 6) {
    throw new Error('PIN must be between 4 and 6 digits')
  }
  return normalized
}

export const useAuthStore = defineStore('auth', () => {
  const pinEnabled = ref(false)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref('')

  const isUnlocked = computed(() => sessionStorage.getItem(SESSION_KEY) === '1')

  async function checkPinStatus() {
    try {
      const { data } = await axios.get('/api/auth/status')
      pinEnabled.value = Boolean(data?.enabled)
      if (!pinEnabled.value) {
        sessionStorage.setItem(SESSION_KEY, '1')
      }
      return pinEnabled.value
    } catch (err) {
      console.error('[auth store] Unable to determine PIN status:', err)
      return false
    } finally {
      initialized.value = true
    }
  }

  async function setPin(pin) {
    loading.value = true
    error.value = ''
    try {
      const normalizedPin = validatePin(pin)
      const { data } = await axios.post('/api/auth/set-pin', { pin: normalizedPin })
      pinEnabled.value = true
      if (data?.token) {
        persistUnlock(data.token)
      } else {
        sessionStorage.setItem(SESSION_KEY, '1')
      }
      return true
    } catch (err) {
      const message = err?.response?.data?.error || 'Unable to set PIN'
      error.value = message
      return false
    } finally {
      loading.value = false
    }
  }

  async function verifyPin(pin) {
    loading.value = true
    error.value = ''
    try {
      const normalizedPin = validatePin(pin)
      const { data } = await axios.post('/api/auth/verify', { pin: normalizedPin })
      if (data?.token) {
        persistUnlock(data.token)
      } else {
        sessionStorage.setItem(SESSION_KEY, '1')
      }
      return true
    } catch (err) {
      return false
    } finally {
      loading.value = false
    }
  }

  async function removePin() {
    loading.value = true
    error.value = ''
    try {
      await axios.post('/api/auth/remove-pin')
      pinEnabled.value = false
      sessionStorage.setItem(SESSION_KEY, '1')
      return true
    } catch (err) {
      error.value = err?.response?.data?.error || 'Unable to remove PIN'
      return false
    } finally {
      loading.value = false
    }
  }

  async function lock() {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY)
      if (token) {
        await axios.post('/api/auth/lock', {}, {
          headers: { 'x-unlock-token': token }
        })
      }
    } catch (err) {
      console.error('[auth store] Failed to notify backend of lock:', err)
    }
    clearUnlock()
    pinEnabled.value = true
  }

  return {
    pinEnabled,
    initialized,
    isUnlocked,
    loading,
    error,
    checkPinStatus,
    setPin,
    verifyPin,
    removePin,
    lock,
    persistUnlock,
    clearUnlock
  }
})
