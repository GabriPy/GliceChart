<template>
  <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-secondary rounded-2xl">
    <div class="card-body p-4 md:p-6 gap-4 md:gap-5">
      <div class="flex items-center gap-3">
        <div class="p-2.5 md:p-3 bg-secondary/10 rounded-xl ring-1 ring-secondary/20 text-secondary">
          <i class="fa-solid fa-database text-lg md:text-xl"></i>
        </div>
        <div>
          <h3 class="text-sm md:text-base font-bold text-base-content">
            Dati, Backup & Esportazione
          </h3>
          <p class="text-xs text-base-content/60 font-medium">
            Esporta letture e configurazioni in formato CSV o JSON
          </p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          type="button"
          @click="$emit('open-export-modal')"
          class="btn btn-secondary btn-sm md:btn-md font-bold gap-2 flex-1"
        >
          <i class="fa-solid fa-file-export"></i>
          Esporta Dati Clinici
        </button>

        <button
          type="button"
          @click="$emit('open-reset-modal')"
          class="btn btn-ghost btn-outline btn-sm md:btn-md font-bold gap-2 border-base-content/20 hover:border-error hover:text-error"
        >
          <i class="fa-solid fa-arrow-rotate-left"></i>
          {{ $t('settings.resetBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['open-export-modal', 'open-reset-modal'])
</script>
