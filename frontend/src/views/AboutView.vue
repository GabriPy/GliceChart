<template>
  <div class="flex flex-col gap-4 md:gap-6 lg:gap-8 px-2 md:px-4 lg:px-0 max-w-4xl mx-auto pb-8 md:pb-12">

    <!-- Header -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-base-200 to-base-300 shadow-lg md:shadow-xl lg:shadow-2xl shadow-black/5 md:shadow-black/10 border border-base-content/10 rounded-2xl md:rounded-3xl">
      <div
        class="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-primary/15 rounded-full blur-2xl md:blur-3xl opacity-70">
      </div>
      <div class="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-accent/15 rounded-xl md:blur-2xl opacity-70">
      </div>

      <div class="relative card-body p-4 md:p-6 lg:p-8">
        <div class="flex items-center gap-3 md:gap-4">
          <div
            class="p-3 md:p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl md:rounded-2xl shadow-md md:shadow-lg shadow-primary/30">
            <i class="fa-solid fa-circle-info text-primary text-xl md:text-2xl"></i>
          </div>
          <div>
            <h2 class="text-lg md:text-2xl font-black uppercase tracking-tight leading-none">Informazioni</h2>
            <span class="text-[10px] md:text-xs font-black opacity-40 uppercase tracking-[0.2em]">Guida Rapida a
              GliceChart</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sezioni Informative -->
    <div class="grid grid-cols-1 gap-4 md:gap-6">

      <!-- Introduzione -->
      <div
        class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
        <div class="card-body p-4 md:p-6 gap-3 md:gap-4">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl shadow-sm">
              <i class="fa-solid fa-rocket text-primary text-lg md:text-xl"></i>
            </div>
            <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Cos'è GliceChart?</h3>
          </div>
          <p class="text-xs md:text-sm opacity-70 leading-relaxed">
            GliceChart è un'app per monitorare glicemia, insulina, carboidrati e note in un unico luogo.
            Ti aiuta a vedere il quadro complessivo della giornata e a capire meglio come i tuoi dati si comportano
            nel tempo.
          </p>
        </div>
      </div>

      <!-- Pattern Smart -->
      <div
        class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
        <div class="card-body p-4 md:p-6 gap-3 md:gap-4">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-accent/10 rounded-lg md:rounded-xl shadow-sm">
              <i class="fa-solid fa-brain text-accent text-lg md:text-xl"></i>
            </div>
            <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Pattern Smart</h3>
          </div>
          <p class="text-xs md:text-sm opacity-70 leading-relaxed">
            La sezione Pattern Smart analizza i dati raccolti per evidenziare trend interessanti e comportamenti
            ricorrenti.
            Quando ci sono abbastanza informazioni, mostra schemi che possono aiutarti a riconoscere situazioni più
            frequenti nella tua giornata.
          </p>
        </div>
      </div>

      <!-- Logica IOB e COB -->
      <div
        class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
        <div class="card-body p-4 md:p-6 gap-4 md:gap-6">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl shadow-sm">
              <i class="fa-solid fa-calculator text-primary text-lg md:text-xl"></i>
            </div>
            <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">IOB e COB</h3>
          </div>

          <div class="space-y-3 md:space-y-4">
            <div class="bg-base-100/50 rounded-lg md:rounded-xl p-3 md:p-4 border border-base-content/10 shadow-sm">
              <h4 class="text-[10px] font-black uppercase opacity-40 mb-1.5 md:mb-2">IOB (Insulin On Board)</h4>
              <p class="text-xs md:text-sm opacity-70 leading-relaxed">
                Mostra l'insulina ancora attiva in base alla durata impostata
                (<strong class="opacity-100">{{ store.settings.rapid_duration }}h</strong>).
                È utile per capire quanto dell'ultima somministrazione sta ancora influenzando la glicemia.
              </p>
            </div>

            <div class="bg-base-100/50 rounded-lg md:rounded-xl p-3 md:p-4 border border-base-content/10 shadow-sm">
              <h4 class="text-[10px] font-black uppercase opacity-40 mb-1.5 md:mb-2">COB (Carbs On Board)</h4>
              <p class="text-xs md:text-sm opacity-70 leading-relaxed">
                Rappresenta i carboidrati ancora in fase di assorbimento
                (durata: <strong class="opacity-100">{{ store.settings.carb_duration }}h</strong>).
                Aiuta a stimare l'effetto del pasto o dei carboidrati inseriti di recente.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Dietometro -->
      <div
        class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
        <div class="card-body p-4 md:p-6 gap-3 md:gap-4">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-warning/10 rounded-lg md:rounded-xl shadow-sm">
              <i class="fa-solid fa-wheat-awn text-warning text-lg md:text-xl"></i>
            </div>
            <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Il Dietometro</h3>
          </div>
          <p class="text-xs md:text-sm opacity-70 leading-relaxed">
            Il Dietometro raccoglie i tuoi alimenti preferiti e calcola rapidamente i carboidrati in base al peso
            selezionato.
            È pensato per rendere più veloce l'inserimento dei pasti e delle porzioni.
          </p>
        </div>
      </div>

      <!-- Interpretazione Grafico -->
      <div
        class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
        <div class="card-body p-4 md:p-6 gap-4 md:gap-6">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-info/10 rounded-lg md:rounded-xl shadow-sm">
              <i class="fa-solid fa-question text-info text-lg md:text-xl"></i>
            </div>
            <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Interpretazione Grafico</h3>
          </div>

          <div class="space-y-2 md:space-y-3">
            <div
              class="flex items-start gap-3 md:gap-4 bg-base-100/50 rounded-lg md:rounded-xl p-3 md:p-4 border border-base-content/10 shadow-sm">
              <div class="w-5 h-5 rounded bg-slate-600/40 mt-0.5 shrink-0"></div>
              <div>
                <span class="text-[10px] md:text-xs font-black uppercase tracking-wider block">GAP Dati</span>
                <p class="text-[10px] md:text-xs opacity-60 mt-1 leading-relaxed">Aree grigie che indicano periodi
                  senza letture glicemiche, ad esempio quando il sensore è spento o fuori portata.</p>
              </div>
            </div>

            <div
              class="flex items-start gap-3 md:gap-4 bg-base-100/50 rounded-lg md:rounded-xl p-3 md:p-4 border border-base-content/10 shadow-sm">
              <div class="w-5 h-5 rounded border-2 border-dashed border-slate-500 mt-0.5 shrink-0"></div>
              <div>
                <span class="text-[10px] md:text-xs font-black uppercase tracking-wider block">Linea "ADESSO"</span>
                <p class="text-[10px] md:text-xs opacity-60 mt-1 leading-relaxed">Indica l'ora corrente rispetto alla
                  giornata intera nel calendario.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Note Finali -->
      <div
        class="relative overflow-hidden card bg-gradient-to-br from-primary to-primary/80 text-primary-content shadow-md md:shadow-lg lg:shadow-xl shadow-primary/20 border border-primary-content/10 rounded-2xl md:rounded-3xl">
        <div
          class="absolute top-0 right-0 w-40 md:w-56 h-40 md:h-56 bg-primary-content/10 rounded-full blur-2xl md:blur-3xl opacity-70">
        </div>
        <div class="relative card-body items-center text-center p-6 md:p-10 gap-2 md:gap-3">
          <div class="p-3 md:p-4 bg-primary-content/10 rounded-xl md:rounded-2xl shadow-md mb-1 md:mb-2">
            <i class="fa-solid fa-stethoscope text-3xl md:text-5xl opacity-90"></i>
          </div>
          <h3 class="text-lg md:text-xl font-black uppercase tracking-tight">Gestione Sicura</h3>
          <p class="text-xs md:text-sm opacity-80 max-w-lg leading-relaxed">
            GliceChart è uno strumento di supporto basato su dati e algoritmi. Consulta sempre il tuo medico per
            decisioni terapeutiche.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>


<script setup>
import { useGlucoseStore } from '../stores/glucose'
const store = useGlucoseStore()
</script>

<style scoped>
/* Stili specifici */
</style>
