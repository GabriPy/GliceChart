<template>
  <div class="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto px-2 md:px-4 lg:px-0 pb-16">

    <!-- Header con PageHeader -->
    <PageHeader
      :title="$t('about.title')"
      :subtitle="$t('about.subtitle')"
      icon="fa-solid fa-circle-info"
      variant="primary"
    />

    <!-- Sezioni Informative -->
    <div class="grid grid-cols-1 gap-4 md:gap-6">

      <!-- Introduzione -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-primary shadow-sm rounded-2xl">
        <div class="card-body p-4 md:p-6 gap-3">
          <div class="flex items-center gap-3">
            <div class="p-2.5 md:p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20 text-primary">
              <i class="fa-solid fa-rocket text-lg md:text-xl"></i>
            </div>
            <h3 class="text-sm md:text-base font-bold text-base-content">{{ $t('about.whatIsTitle') }}</h3>
          </div>
          <p class="text-xs md:text-sm text-base-content/75 leading-relaxed">
            {{ $t('about.whatIsDesc') }}
          </p>
        </div>
      </div>

      <!-- Pattern Smart -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-accent shadow-sm rounded-2xl">
        <div class="card-body p-4 md:p-6 gap-3">
          <div class="flex items-center gap-3">
            <div class="p-2.5 md:p-3 bg-accent/10 rounded-xl ring-1 ring-accent/20 text-accent">
              <i class="fa-solid fa-brain text-lg md:text-xl"></i>
            </div>
            <h3 class="text-sm md:text-base font-bold text-base-content">{{ $t('about.smartPatternsTitle') }}</h3>
          </div>
          <p class="text-xs md:text-sm text-base-content/75 leading-relaxed">
            {{ $t('about.smartPatternsDesc') }}
          </p>
        </div>
      </div>

      <!-- Logica IOB e COB -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-primary shadow-sm rounded-2xl">
        <div class="card-body p-4 md:p-6 gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 md:p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20 text-primary">
              <i class="fa-solid fa-calculator text-lg md:text-xl"></i>
            </div>
            <h3 class="text-sm md:text-base font-bold text-base-content">{{ $t('about.iobCobTitle') }}</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="bg-base-100/60 rounded-xl p-3.5 border border-base-content/10 space-y-1.5">
              <h4 class="text-xs font-bold text-primary">{{ $t('about.iobTitle') }}</h4>
              <p class="text-xs text-base-content/75 leading-relaxed">
                {{ $t('about.iobDesc', { hours: store.settings.rapid_duration }) }}
              </p>
            </div>

            <div class="bg-base-100/60 rounded-xl p-3.5 border border-base-content/10 space-y-1.5">
              <h4 class="text-xs font-bold text-accent">{{ $t('about.cobTitle') }}</h4>
              <p class="text-xs text-base-content/75 leading-relaxed">
                {{ $t('about.cobDesc', { hours: store.settings.carb_duration }) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Dietometro -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-warning shadow-sm rounded-2xl">
        <div class="card-body p-4 md:p-6 gap-3">
          <div class="flex items-center gap-3">
            <div class="p-2.5 md:p-3 bg-warning/10 rounded-xl ring-1 ring-warning/20 text-warning">
              <i class="fa-solid fa-wheat-awn text-lg md:text-xl"></i>
            </div>
            <h3 class="text-sm md:text-base font-bold text-base-content">{{ $t('about.dietometerTitle') }}</h3>
          </div>
          <p class="text-xs md:text-sm text-base-content/75 leading-relaxed">
            {{ $t('about.dietometerDesc') }}
          </p>
        </div>
      </div>

      <!-- Disclaimer Medico Professionale -->
      <div class="card bg-base-200 border border-base-content/10 border-l-4 border-l-error shadow-sm rounded-2xl">
        <div class="card-body p-5 md:p-6 gap-3">
          <div class="flex items-center gap-3 text-error">
            <div class="p-2.5 md:p-3 bg-error/10 rounded-xl ring-1 ring-error/20">
              <i class="fa-solid fa-notes-medical text-lg md:text-xl"></i>
            </div>
            <h3 class="text-sm md:text-base font-bold text-base-content">
              {{ $t('about.safeManagementTitle') }}
            </h3>
          </div>
          <div class="bg-base-100/70 rounded-xl p-4 border border-base-content/10 space-y-2 text-xs md:text-sm text-base-content/80 leading-relaxed">
            <p class="font-semibold text-error">
              ⚠️ AVVISO CLINICO IMPORTANTE
            </p>
            <p>
              GliceChart è un software open-source per visualizzazione, analisi e monitoraggio personale dei dati glicemici (CGM). 
              <b>Non è un dispositivo medico diagnosticato o certificato CE/FDA</b> e non deve mai essere utilizzato come sostituto del giudizio clinico professionale del tuo diabetologo o medico curante.
            </p>
            <p>
              Le stime di Insulina Attiva (IOB), Carboidrati Attivi (COB), GMI e Time in Range sono calcoli algoritmici basati su parametri impostati dall'utente e dati ricevuti da fonti terze. Non modificare mai autonomamente dosaggi farmacologici o terapie insuliniche basandoti esclusivamente su questi calcoli.
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useGlucoseStore } from '../stores/glucose'
import PageHeader from '../components/PageHeader.vue'

const store = useGlucoseStore()
</script>
