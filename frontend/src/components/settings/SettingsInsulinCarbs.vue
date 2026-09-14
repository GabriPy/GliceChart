<template>
  <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-primary rounded-2xl">
    <div class="card-body p-4 md:p-6 gap-4 md:gap-5">
      <div class="flex items-center gap-3">
        <div class="p-2.5 md:p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20 text-primary">
          <i class="fa-solid fa-syringe text-lg md:text-xl"></i>
        </div>
        <div>
          <h3 class="text-sm md:text-base font-bold text-base-content">
            {{ $t('settings.pharmaCardTitle') }}
          </h3>
          <p class="text-xs text-base-content/60 font-medium">
            {{ $t('settings.pharmaCardSubtitle') }}
          </p>
        </div>
      </div>

      <!-- Durate d'azione -->
      <div class="space-y-3 pt-1">
        <div class="flex items-center gap-2 text-xs font-semibold text-base-content/80">
          <i class="fa-regular fa-clock text-primary"></i>
          <span>{{ $t('settings.actionDurationHours') }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="space-y-1.5 bg-base-100/50 p-3 rounded-xl border border-base-content/5">
            <label class="text-xs font-medium text-base-content/70 flex items-center justify-between">
              <span>{{ $t('settings.rapidDuration') }}</span>
              <span class="badge badge-primary badge-sm">h</span>
            </label>
            <input
              type="number"
              v-model.number="form.rapid_duration"
              class="input input-bordered input-sm w-full font-semibold"
            />
          </div>

          <div class="space-y-1.5 bg-base-100/50 p-3 rounded-xl border border-base-content/5">
            <label class="text-xs font-medium text-base-content/70 flex items-center justify-between">
              <span>{{ $t('settings.slowDuration') }}</span>
              <span class="badge badge-secondary badge-sm">h</span>
            </label>
            <input
              type="number"
              v-model.number="form.slow_duration"
              class="input input-bordered input-sm w-full font-semibold"
            />
          </div>

          <div class="space-y-1.5 bg-base-100/50 p-3 rounded-xl border border-base-content/5">
            <label class="text-xs font-medium text-base-content/70 flex items-center justify-between">
              <span>{{ $t('settings.carbDuration') }}</span>
              <span class="badge badge-accent badge-sm">h</span>
            </label>
            <input
              type="number"
              v-model.number="form.carb_duration"
              class="input input-bordered input-sm w-full font-semibold border-accent/30"
            />
          </div>
        </div>
      </div>

      <!-- Sensibilità e Rapporti -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center gap-2 text-xs font-semibold text-base-content/80">
          <i class="fa-solid fa-sliders text-primary"></i>
          <span>Fattori di Calcolo</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1.5 bg-base-100/50 p-3 rounded-xl border border-base-content/5">
            <label class="text-xs font-medium text-base-content/70 flex items-center justify-between">
              <span>Sensibilità Insulinica (ISF)</span>
              <span class="text-xs text-base-content/50">mg/dL / U</span>
            </label>
            <input
              type="number"
              v-model.number="form.insulin_sensitivity"
              class="input input-bordered input-sm w-full font-semibold"
            />
          </div>

          <div class="space-y-1.5 bg-base-100/50 p-3 rounded-xl border border-base-content/5">
            <label class="text-xs font-medium text-base-content/70 flex items-center justify-between">
              <span>Rapporto I:C (ICR)</span>
              <span class="text-xs text-base-content/50">g / U</span>
            </label>
            <input
              type="number"
              v-model.number="form.carb_ratio"
              class="input input-bordered input-sm w-full font-semibold"
            />
          </div>
        </div>
      </div>

      <!-- Pulsanti Rapidi / Quick Presets -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center gap-2 text-xs font-semibold text-base-content/80">
          <i class="fa-solid fa-bolt text-accent"></i>
          <span>{{ $t('settings.quickPresetsCardTitle') }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Insulina -->
          <div class="p-3 bg-base-100/50 rounded-xl border border-base-content/5 space-y-2">
            <span class="text-xs font-medium text-base-content/70">{{ $t('settings.insulinUnitsLabel') }}</span>
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <span class="text-[10px] text-base-content/50 font-semibold">{{ $t('settings.preset1') }}</span>
                <input
                  type="number"
                  v-model.number="form.quick_insulin_1"
                  class="input input-bordered input-xs md:input-sm w-full font-semibold"
                />
              </div>
              <div class="space-y-1">
                <span class="text-[10px] text-base-content/50 font-semibold">{{ $t('settings.preset2') }}</span>
                <input
                  type="number"
                  v-model.number="form.quick_insulin_2"
                  class="input input-bordered input-xs md:input-sm w-full font-semibold"
                />
              </div>
            </div>
          </div>

          <!-- Carboidrati -->
          <div class="p-3 bg-base-100/50 rounded-xl border border-base-content/5 space-y-2">
            <span class="text-xs font-medium text-base-content/70">{{ $t('settings.carbsGramsLabel') }}</span>
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <span class="text-[10px] text-base-content/50 font-semibold">{{ $t('settings.preset1') }}</span>
                <input
                  type="number"
                  v-model.number="form.quick_carb_1"
                  class="input input-bordered input-xs md:input-sm w-full font-semibold"
                />
              </div>
              <div class="space-y-1">
                <span class="text-[10px] text-base-content/50 font-semibold">{{ $t('settings.preset2') }}</span>
                <input
                  type="number"
                  v-model.number="form.quick_carb_2"
                  class="input input-bordered input-xs md:input-sm w-full font-semibold"
                />
              </div>
            </div>
          </div>
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
