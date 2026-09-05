<template>
  <!-- Solo freccia SVG, niente etichette testuali -->
  <svg
    :style="{ transform: `rotate(${rotation}deg)` }"
    class="trend-arrow inline-block"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 4V20M12 4L18 10M12 4L6 10" 
      :stroke="color" 
      stroke-width="2.5" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  trend: { type: String, default: 'FLAT' },
  size:  { type: Number, default: 36 },
})

// Rotazione: 0° = punta in su, 90° = destra (piatto), 180° = giù
const rotation = computed(() => ({
  RISING_FAST:  0,
  RISING:       0,
  RISING_SLOW:  45,
  FLAT:         90,
  FALLING_SLOW: 135,
  FALLING:      180,
  FALLING_FAST: 180,
}[props.trend] ?? 90))

const color = computed(() => {
  if (props.trend.startsWith('RISING'))  return '#22c55e'
  if (props.trend.startsWith('FALLING')) return '#ef4444'
  return '#94a3b8'
})
</script>
