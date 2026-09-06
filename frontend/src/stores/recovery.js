import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth'

function validateRecoveryCode(code) {
  const normalized = String(code ?? '').trim()
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error('Recovery code must be 6 digits')
  }
  return normalized
}

export const useRecoveryStore = defineStore('recovery', () => {
  const loading = ref(false)
  const error = ref('')
  const requestSent = ref(false)
  const verified = ref(false)
  const recoveryId = ref(null)
  const sessionId = ref(null)

  function resetState() {
    loading.value = false
    error.value = ''
    requestSent.value = false
    verified.value = false
    recoveryId.value = null
    sessionId.value = null
  }

  async function requestRecovery() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await axios.post('/api/auth/recovery/request')
      requestSent.value = true
      recoveryId.value = data?.recoveryId ?? null
      return true
    } catch (err) {
      error.value = err?.response?.data?.error || 'Unable to start recovery'
      requestSent.value = false
      return false
    } finally {
      loading.value = false
    }
  }

  async function verifyRecoveryCode(code) {
    loading.value = true
    error.value = ''
    try {
      const normalizedCode = validateRecoveryCode(code)
      const { data } = await axios.post('/api/auth/recovery/verify', { code: normalizedCode })
      recoveryId.value = data?.recoveryId ?? recoveryId.value
      sessionId.value = data?.sessionId ?? null
      verified.value = true
      requestSent.value = true
      return true
    } catch (err) {
      error.value = err?.response?.data?.error || 'Unable to verify recovery code'
      verified.value = false
      return false
    } finally {
      loading.value = false
    }
  }

  async function resetPin(newPin) {
    loading.value = true
    error.value = ''
    try {
      if (!recoveryId.value || !sessionId.value) {
        throw new Error('Recovery session not ready')
      }
      const normalizedPin = String(newPin ?? '').trim()
      if (!/^\d+$/.test(normalizedPin) || normalizedPin.length < 4 || normalizedPin.length > 6) {
        throw new Error('PIN must be between 4 and 6 digits')
      }

      const { data } = await axios.post('/api/auth/recovery/reset', {
        recoveryId: recoveryId.value,
        sessionId: sessionId.value,
        pin: normalizedPin
      })

      const auth = useAuthStore()
      if (data?.token) {
        sessionStorage.setItem('glicechart_unlock_token', data.token)
        sessionStorage.setItem('glicechart_unlocked', '1')
        auth.pinEnabled = true
      }

      requestSent.value = false
      verified.value = false
      recoveryId.value = null
      sessionId.value = null
      return true
    } catch (err) {
      error.value = err?.response?.data?.error || err.message || 'Unable to reset PIN'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    requestSent,
    verified,
    recoveryId,
    sessionId,
    resetState,
    requestRecovery,
    verifyRecoveryCode,
    resetPin
  }
})
