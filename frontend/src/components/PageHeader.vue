<template>
  <header
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-200/90 backdrop-blur-sm border border-base-content/10 border-l-4 rounded-2xl px-4 md:px-6 py-4 md:py-5 shadow-sm transition-all"
    :class="accentBorderClass"
  >
    <div class="flex items-center gap-3 md:gap-4">
      <div
        v-if="icon"
        class="p-3 md:p-3.5 rounded-xl ring-1 transition-colors flex items-center justify-center shrink-0"
        :class="iconContainerClass"
      >
        <i :class="[icon, iconColorClass, 'text-lg md:text-xl']"></i>
      </div>

      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="text-lg md:text-xl font-bold tracking-tight text-base-content leading-tight">
            {{ title }}
          </h1>
          <slot name="badge" />
        </div>
        <p v-if="subtitle" class="text-xs md:text-sm text-base-content/60 font-medium mt-0.5">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <!-- Azioni Rapide / Slot Destro -->
    <div v-if="$slots.actions" class="flex items-center gap-2 flex-wrap self-start sm:self-center">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'success', 'warning', 'error', 'info', 'accent', 'neutral'].includes(v)
  }
})

const accentBorderClass = computed(() => {
  switch (props.variant) {
    case 'success': return 'border-l-success'
    case 'warning': return 'border-l-warning'
    case 'error': return 'border-l-error'
    case 'info': return 'border-l-info'
    case 'accent': return 'border-l-accent'
    case 'neutral': return 'border-l-base-content/30'
    default: return 'border-l-primary'
  }
})

const iconContainerClass = computed(() => {
  switch (props.variant) {
    case 'success': return 'bg-success/10 ring-success/20 text-success'
    case 'warning': return 'bg-warning/10 ring-warning/20 text-warning'
    case 'error': return 'bg-error/10 ring-error/20 text-error'
    case 'info': return 'bg-info/10 ring-info/20 text-info'
    case 'accent': return 'bg-accent/10 ring-accent/20 text-accent'
    case 'neutral': return 'bg-base-300 ring-base-content/10 text-base-content'
    default: return 'bg-primary/10 ring-primary/20 text-primary'
  }
})

const iconColorClass = computed(() => {
  switch (props.variant) {
    case 'success': return 'text-success'
    case 'warning': return 'text-warning'
    case 'error': return 'text-error'
    case 'info': return 'text-info'
    case 'accent': return 'text-accent'
    case 'neutral': return 'text-base-content'
    default: return 'text-primary'
  }
})
</script>
