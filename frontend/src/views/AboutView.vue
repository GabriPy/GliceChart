<template>
  <div class="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
    
    <!-- Header Page -->
    <div class="card bg-base-200 shadow-xl border border-base-content/5">
      <div class="card-body p-6">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary/10 rounded-2xl">
            <i class="fi fi-sr-info text-primary text-2xl leading-none"></i>
          </div>
          <div>
            <h1 class="text-3xl font-black uppercase tracking-tight leading-none italic">Informazioni</h1>
            <p class="text-xs font-black opacity-30 uppercase tracking-[0.2em] mt-2">Guida rapida a GliceChart</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sezioni Informative -->
    <div class="grid grid-cols-1 gap-8">
      
      <!-- Introduzione -->
      <div class="card bg-base-200 shadow-sm border border-base-content/10">
        <div class="card-body gap-5">
          <h2 class="text-base font-black uppercase tracking-widest text-primary flex items-center gap-3">
            <i class="fi fi-sr-rocket-lunch"></i> Cos'è GliceChart?
          </h2>
          <p class="text-base opacity-90 leading-relaxed">
            GliceChart è un'app per monitorare glicemia, insulina, carboidrati e note in un unico luogo.
            Ti aiuta a vedere il quadro complessivo della giornata e a capire meglio come i tuoi dati si comportano nel tempo.
          </p>
        </div>
      </div>

      <!-- Pattern Smart -->
      <div class="card bg-base-200 shadow-sm border border-base-content/10">
        <div class="card-body gap-5">
          <h2 class="text-base font-black uppercase tracking-widest text-accent flex items-center gap-3">
            <i class="fi fi-sr-brain"></i> Pattern Smart
          </h2>
          <p class="text-base opacity-90 leading-relaxed">
            La sezione Pattern Smart analizza i dati raccolti per evidenziare trend interessanti e comportamenti ricorrenti.
            Quando ci sono abbastanza informazioni, mostra schemi che possono aiutarti a riconoscere situazioni piú frequenti nella tua giornata.
          </p>
        </div>
      </div>

      <!-- Logica IOB e COB -->
      <div class="card bg-base-200 shadow-sm border border-base-content/10">
        <div class="card-body gap-5">
          <h2 class="text-base font-black uppercase tracking-widest text-primary flex items-center gap-3">
            <i class="fi fi-sr-calculator"></i> IOB e COB
          </h2>
          <div class="space-y-5">
            <div>
              <h3 class="text-sm font-bold uppercase opacity-60 mb-2">IOB (Insulin On Board)</h3>
              <p class="text-base opacity-90">
                Mostra l'insulina ancora attiva in base alla durata impostata (<strong>{{ store.settings.rapid_duration }}h</strong>).
                È utile per capire quanto dell'ultima somministrazione sta ancora influenzando la glicemia.
              </p>
            </div>
            <div class="divider opacity-5 my-0"></div>
            <div>
              <h3 class="text-sm font-bold uppercase opacity-60 mb-2">COB (Carbs On Board)</h3>
              <p class="text-base opacity-90">
                Rappresenta i carboidrati ancora in fase di assorbimento (durata: <strong>{{ store.settings.carb_duration }}h</strong>).
                Aiuta a stimare l'effetto del pasto o dei carboidrati inseriti di recente.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Dietometro -->
      <div class="card bg-base-200 shadow-sm border border-base-content/10">
        <div class="card-body gap-5">
          <h2 class="text-base font-black uppercase tracking-widest text-warning flex items-center gap-3">
            <i class="fi fi-sr-wheat"></i> Il Dietometro
          </h2>
          <p class="text-base opacity-90 leading-relaxed">
            Il Dietometro raccoglie i tuoi alimenti preferiti e calcola rapidamente i carboidrati in base al peso selezionato.
            È pensato per rendere più veloce l'inserimento dei pasti e delle porzioni.
          </p>
        </div>
      </div>

      <!-- Interpretazione Grafico -->
      <div class="card bg-base-200 shadow-sm border border-base-content/10">
        <div class="card-body gap-5">
          <h2 class="text-base font-black uppercase tracking-widest text-info flex items-center gap-3">
            <i class="fi fi-sr-interrogation"></i> Interpretazione Grafico
          </h2>
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <div class="w-5 h-5 rounded bg-slate-600/40 mt-1 shrink-0"></div>
              <div>
                <span class="text-sm font-bold uppercase block">GAP Dati</span>
                <p class="text-xs opacity-80">Aree grigie che indicano periodi senza letture glicemiche, ad esempio quando il sensore è spento o fuori portata.</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-5 h-5 rounded border-2 border-dashed border-slate-500 mt-1 shrink-0"></div>
              <div>
                <span class="text-sm font-bold uppercase block">Linea "ADESSO"</span>
                <p class="text-xs opacity-80">Indica l'ora corrente rispetto alla giornata intera nel calendario.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Note Finali -->
      <div class="card bg-primary text-primary-content shadow-md border border-primary-content/10">
        <div class="card-body items-center text-center py-10">
          <i class="fi fi-sr-shield-check text-5xl opacity-50 mb-3"></i>
          <h2 class="text-xl font-black uppercase italic tracking-tight">Gestione Sicura</h2>
          <p class="text-sm opacity-80 max-w-lg leading-relaxed">
            GliceChart è uno strumento di supporto basato su dati e algoritmi. Consulta sempre il tuo medico per decisioni terapeutiche.
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
