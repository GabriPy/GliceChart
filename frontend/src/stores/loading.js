import { ref, computed } from 'vue'

export function createLoadingFlag() {
  const activeCount = ref(0)
  const isActive = computed(() => activeCount.value > 0)

  async function run(fn) {
    activeCount.value++
    try {
      return await fn()
    } finally {
      activeCount.value--
    }
  }

  return { isActive, run }
}
