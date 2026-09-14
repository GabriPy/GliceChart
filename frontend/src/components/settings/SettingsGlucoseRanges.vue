<template>
  <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-success rounded-2xl">
    <div class="card-body p-4 md:p-6 gap-4 md:gap-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="p-2.5 md:p-3 bg-success/10 rounded-xl ring-1 ring-success/20 text-success">
            <i class="fa-solid fa-chart-line text-lg md:text-xl"></i>
          </div>
          <div>
            <h3 class="text-sm md:text-base font-bold text-base-content">
              {{ $t('settings.tirCardTitle') }}
            </h3>
            <p class="text-xs text-base-content/60 font-medium">
              {{ $t('settings.tirCardSubtitle') }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 py-1 bg-success/10 rounded-lg ring-1 ring-success/20 w-fit">
          <span class="text-xs md:text-sm font-bold text-success">
            {{ form.tir_min }} – {{ form.tir_max }}
          </span>
          <span class="text-xs opacity-60 font-medium">
            {{ $t('common.mgDl') }}
          </span>
        </div>
      </div>

      <!-- Visual Range Preview -->
      <div class="space-y-2">
        <div class="h-4 md:h-5 w-full rounded-full overflow-hidden flex border border-base-content/10 shadow-inner">
          <div class="bg-error/30" style="flex: 1.5 1 0%"></div>
          <div class="bg-success/50" style="flex: 4 1 0%"></div>
          <div class="bg-error/30" style="flex: 2 1 0%"></div>
        </div>

        <div class="flex items-center justify-between text-xs font-semibold text-base-content/60 px-1">
          <span class="text-error font-bold">
            &lt; {{ form.red_under }}
          </span>
          <span class="text-success font-bold">
            {{ form.tir_min }} – {{ form.tir_max }} {{ $t('common.mgDl') }}
          </span>
          <span class="text-error font-bold">
            &gt; {{ form.red_over }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 pt-1">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-base-content/70">
            {{ $t('settings.lowThreshold') }}
          </label>
          <input
            type="number"
            v-model.number="form.red_under"
            class="input input-bordered input-sm md:input-md w-full font-semibold border-error/30 focus:border-error"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-base-content/70">
            {{ $t('settings.minTarget') }}
          </label>
          <input
            type="number"
            v-model.number="form.tir_min"
            class="input input-bordered input-sm md:input-md w-full font-semibold border-success/30 focus:border-success"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-base-content/70">
            {{ $t('settings.maxTarget') }}
          </label>
          <input
            type="number"
            v-model.number="form.tir_max"
            class="input input-bordered input-sm md:input-md w-full font-semibold border-success/30 focus:border-success"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-base-content/70">
            {{ $t('settings.highThreshold') }}
          </label>
          <input
            type="number"
            v-model.number="form.red_over"
            class="input input-bordered input-sm md:input-md w-full font-semibold border-error/30 focus:border-error"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: {
    type: Object,
    required: true
  }
})
</script>
