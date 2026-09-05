import { watch, onUnmounted } from 'vue'

export function useAutoSave(key, valueRef, intervalMs = 2000) {
  let saveTimeout = null

  function save() {
    try {
      const data = JSON.stringify(valueRef.value)
      localStorage.setItem(key, data)
    } catch (e) {}
  }

  function restore() {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const data = JSON.parse(raw)
      valueRef.value = data
      return data
    } catch (e) {
      return null
    }
  }

  function clear() {
    try {
      localStorage.removeItem(key)
    } catch (e) {}
  }

  function hasDraft() {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return false
      const data = JSON.parse(raw)
      return !!data && Object.keys(data).length > 0
    } catch (e) {
      return false
    }
  }

  watch(
    valueRef,
    () => {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(save, intervalMs)
    },
    { deep: true }
  )

  onUnmounted(() => {
    if (saveTimeout) clearTimeout(saveTimeout)
    save()
  })

  return { restore, clear, hasDraft }
}
