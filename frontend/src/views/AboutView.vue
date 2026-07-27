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
            <p class="text-xs font-black opacity-30 uppercase tracking-[0.2em] mt-2">Guida all'utilizzo di GliceChart v4.5.0-beta</p>
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
            GliceChart è uno strumento avanzato per il monitoraggio e l'analisi della glicemia. 
            Permette di tracciare glicemia, somministrazioni di insulina, carboidrati e note, 
            fornendo predizioni e analisi dei pattern basate sui tuoi dati reali.
          </p>
        </div>
      </div>

      <!-- Predizione Glicemia -->
      <div class="card bg-base-200 shadow-xl border border-base-content/5">
        <div class="card-body gap-5">
          <h2 class="text-base font-black uppercase tracking-widest text-secondary flex items-center gap-3">
            <i class="fi fi-sr-chart-line-up"></i> Predizione Glicemia v2.0
          </h2>
          <p class="text-base opacity-90 leading-relaxed">
            L'algoritmo predittivo stima la tua glicemia a <strong>15, 30 e 60 minuti</strong> utilizzando un modello matematico a più fattori:
          </p>
          
          <!-- Formula Box -->
          <div class="bg-base-300/50 p-4 rounded-2xl border border-base-content/5 font-mono-num mb-2">
            <span class="text-[10px] font-black uppercase opacity-40 block mb-2">Formula Matematica</span>
            <p class="text-sm italic text-secondary">
              G_pred(t) = G_smussata + (ROC * t) - (Imp_Insulina * ISF) + (Imp_Carbo * CR)
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div class="bg-base-300/30 p-4 rounded-xl">
              <span class="text-xs font-black uppercase opacity-40 block mb-2">Trend e Velocità (ROC)</span>
              <p class="text-sm opacity-80">
                Calcola il <strong>Rate of Change</strong> (mg/dL al minuto) su una finestra di 25 minuti. 
                I dati vengono prima "smussati" con una <strong>media mobile su 5 letture</strong> per eliminare il rumore del sensore.
              </p>
            </div>
            <div class="bg-base-300/30 p-4 rounded-xl">
              <span class="text-xs font-black uppercase opacity-40 block mb-2">Impatto Clinico</span>
              <p class="text-sm opacity-80">
                Integra l'effetto futuro dell'insulina attiva (IOB) e dei carboidrati (COB) usando i tuoi parametri: 
                <strong>ISF</strong> (Sensibilità) e <strong>Carb Ratio</strong> (Rapporto I/C).
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern Smart -->
      <div class="card bg-base-200 shadow-sm border border-base-content/10">
        <div class="card-body gap-5">
          <h2 class="text-base font-black uppercase tracking-widest text-accent flex items-center gap-3">
            <i class="fi fi-sr-brain"></i> Pattern Smart Dinamici
          </h2>
          <p class="text-base opacity-90 leading-relaxed">
            Il sistema scansiona i tuoi dati storici (3-7 giorni) per identificare trend ricorrenti reali, non simulati:
          </p>
          <ul class="list-disc list-inside text-base opacity-90 space-y-3 ml-2">
            <li>
              <strong>Overlay Orario</strong>: Sovrappone le fasce orarie di più giorni per trovare salite o discese costanti che accadono alla stessa ora.
            </li>
            <li>
              <strong>Correlazione Note</strong>: Analizza l'impatto glicemico medio nelle 3 ore successive a note specifiche (es. "Pizza", "Palestra") per dirti esattamente cosa aspettarti in futuro.
            </li>
          </ul>
        </div>
      </div>

      <!-- Logica IOB e COB -->
      <div class="card bg-base-200 shadow-sm border border-base-content/10">
        <div class="card-body gap-5">
          <h2 class="text-base font-black uppercase tracking-widest text-primary flex items-center gap-3">
            <i class="fi fi-sr-calculator"></i> Algoritmo IOB & COB
          </h2>
          <div class="space-y-5">
            <div>
              <h3 class="text-sm font-bold uppercase opacity-60 mb-2">IOB (Insulin On Board)</h3>
              <p class="text-base opacity-90">
                Rappresenta l'insulina ancora attiva. Utilizziamo un <strong>decadimento lineare</strong> basato sulla durata impostata (<strong>{{ store.settings.rapid_duration }}h</strong>). 
                L'impatto sulla glicemia è: 1U = -{{ store.settings.insulin_sensitivity }} mg/dL.
              </p>
            </div>
            <div class="divider opacity-5 my-0"></div>
            <div>
              <h3 class="text-sm font-bold uppercase opacity-60 mb-2">COB (Carbs On Board)</h3>
              <p class="text-base opacity-90">
                Rappresenta i carboidrati in fase di assorbimento (durata: <strong>{{ store.settings.carb_duration }}h</strong>). 
                Il rialzo stimato dipende dal tuo Rapporto I/C: {{ store.settings.carb_ratio }}g = 1U.
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
            Il tuo database alimentare personale. Calcola i carboidrati istantaneamente in base al peso selezionato tramite lo slider. 
            Puoi cercare alimenti e filtrarli per categorie per un inserimento rapido e preciso.
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
                <p class="text-xs opacity-80">Aree grigie che indicano periodi senza letture glicemiche (es. sensore spento o fuori portata).</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-5 h-5 rounded border-2 border-dashed border-slate-500 mt-1 shrink-0"></div>
              <div>
                <span class="text-sm font-bold uppercase block">Linea "ADESSO"</span>
                <p class="text-xs opacity-80">Disponibile nel calendario per indicare l'ora corrente rispetto alla giornata intera.</p>
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
            GliceChart è uno strumento di supporto basato su algoritmi matematici e dati statistici. 
            Consulta sempre il tuo medico per decisioni terapeutiche.
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
