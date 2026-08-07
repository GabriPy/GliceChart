<template>
  <div class="flex flex-col gap-4 md:gap-6 lg:gap-8 px-2 md:px-4 lg:px-0">

    <!-- HEADER -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-base-200 to-base-300 shadow-lg md:shadow-xl lg:shadow-2xl shadow-black/5 md:shadow-black/10 border border-base-content/10 rounded-2xl md:rounded-3xl">
      <div
        class="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-primary/15 rounded-full blur-2xl md:blur-3xl opacity-70">
      </div>
      <div
        class="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-accent/15 rounded-full blur-xl md:blur-2xl opacity-70">
      </div>

      <div class="relative card-body p-4 md:p-6 lg:p-8">
        <div class="flex items-center gap-3 md:gap-4">
          <div
            class="p-3 md:p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl md:rounded-2xl shadow-md md:shadow-lg shadow-primary/30">
            <i class="fa-solid fa-microchip text-primary text-xl md:text-2xl"></i>
          </div>
          <div>
            <h2 class="text-lg md:text-2xl font-black uppercase tracking-tight leading-none">Storico Sensori</h2>
            <span class="text-[10px] md:text-xs font-black opacity-40 uppercase tracking-[0.2em]">Tracking &
              Gestione</span>
          </div>
        </div>
      </div>
    </div>

    <!-- CARD NUOVO SENSORE -->
    <div
      class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
      <div class="card-body p-4 md:p-6 lg:p-8 gap-4 md:gap-6">

        <div class="flex items-center gap-2 md:gap-3">
          <div class="p-2 md:p-3 bg-success/10 rounded-lg md:rounded-xl shadow-sm">
            <i class="fa-solid fa-plus text-success text-lg md:text-xl"></i>
          </div>
          <div>
            <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Nuovo Sensore</h3>
            <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">Registrazione
              Applicazione</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

          <!-- Numero Seriale -->
          <div class="space-y-1 md:space-y-2">
            <label class="text-[10px] font-black uppercase opacity-40">Numero Seriale</label>
            <input type="text" v-model="newSensor.serial_number" placeholder="SN12345678"
              class="input input-bordered font-black input-xs md:input-sm w-full border-primary/30 focus:border-primary placeholder:opacity-30" />
          </div>

          <!-- Numero Lotto -->
          <div class="space-y-1 md:space-y-2">
            <label class="text-[10px] font-black uppercase opacity-40">Numero Lotto</label>
            <input type="text" v-model="newSensor.lot_number" placeholder="LOT12345"
              class="input input-bordered font-black input-xs md:input-sm w-full border-accent/30 focus:border-accent placeholder:opacity-30" />
          </div>

          <!-- Data Applicazione -->
          <div class="space-y-1 md:space-y-2">
            <label class="text-[10px] font-black uppercase opacity-40">Data Applicazione</label>
            <input type="datetime-local" v-model="newSensor.start_date"
              class="input input-bordered font-black input-xs md:input-sm w-full border-success/30 focus:border-success placeholder:opacity-30" />
          </div>

        </div>

        <!-- Pulsante Aggiungi -->
        <button @click="addSensor"
          class="btn btn-success w-full btn-sm md:btn-md font-black uppercase tracking-widest gap-2 shadow-md md:shadow-lg shadow-success/40"
          :disabled="store.loading || !newSensor.serial_number">
          <span v-if="store.loading" class="loading loading-spinner loading-xs md:loading-sm"></span>
          <i v-else class="fa-solid fa-plus"></i>
          Aggiungi Sensore
        </button>

      </div>
    </div>

    <!-- TABELLONE STORICO SENSORI -->
    <div
      class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
      <div class="card-body p-4 md:p-6 lg:p-8 gap-4 md:gap-6">

        <!-- Header Tabella -->
        <div class="flex items-center gap-2 md:gap-3">
          <div class="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl shadow-sm">
            <i class="fa-solid fa-list text-primary text-lg md:text-xl"></i>
          </div>
          <div class="flex items-center gap-2">
            <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">Storico Completo</h3>
            <span class="px-2 py-0.5 rounded-md bg-primary/10 text-[9px] font-black text-primary">{{
              store.sensors.length }}</span>
          </div>
        </div>

        <!-- Nessun sensore -->
        <div v-if="store.sensors.length === 0" class="text-center py-10 opacity-30">
          <i class="fa-solid fa-microchip text-4xl mb-2"></i>
          <p class="text-[10px] font-black uppercase tracking-widest">Nessun sensore registrato</p>
        </div>

        <!-- Tabella -->
        <div v-else class="overflow-x-auto rounded-xl md:rounded-2xl border border-base-content/10 shadow-sm">
          <table class="table table-sm">

            <thead class="bg-base-100/50">
              <tr class="text-[10px] font-black uppercase opacity-50 tracking-widest">
                <th class="text-center py-3">Seriale</th>
                <th class="text-center py-3">Lotto</th>
                <th class="text-center py-3">Inizio</th>
                <th class="text-center py-3">Fine Prevista</th>
                <th class="text-center py-3">Stato</th>
                <th class="text-center py-3">Tempo</th>
                <th class="text-center py-3">Note</th>
                <th class="text-center py-3">Azioni</th>
              </tr>
            </thead>

            <tbody>

              <tr v-for="sensor in store.sensors" :key="sensor.id"
                class="text-xs hover:bg-base-100/50 transition-colors">

                <!-- Seriale -->
                <td class="font-black text-center py-3">
                  {{ sensor.serial_number }}
                </td>

                <!-- Lotto -->
                <td class="opacity-70 text-center py-3">
                  {{ sensor.lot_number || '-' }}
                </td>

                <!-- Inizio -->
                <td class="text-center py-3">
                  {{ formatDate(sensor.start_date) }}
                </td>

                <!-- Fine Prevista -->
                <td class="text-center py-3">
                  {{ formatDate(sensor.end_date) }}
                </td>

                <!-- STATO -->
                <td class="text-center py-3">
                  <div class="flex flex-col items-center gap-1">
                    <span v-if="!sensor.actual_end_date"
                      class="px-2 py-0.5 rounded-md bg-success/10 text-success border border-success/20 text-[9px] font-black uppercase tracking-widest">
                      Attivo
                    </span>

                    <span v-else
                      class="px-2 py-0.5 rounded-md bg-error/10 text-error border border-error/20 text-[9px] font-black uppercase tracking-widest">
                      Scaduto
                    </span>

                    <span v-if="sensor.actual_end_date && isEarlyEnd(sensor)"
                      class="px-2 py-0.5 rounded-md bg-warning/10 text-warning border border-warning/20 text-[8px] font-black uppercase tracking-widest">
                      Terminato prima
                    </span>
                  </div>
                </td>

                <!-- TEMPO RIMANENTE -->
                <td class="text-center font-bold opacity-60 py-3">
                  <span v-if="!sensor.actual_end_date">
                    {{ getCountdown(sensor.end_date) }}
                  </span>
                  <span v-else class="opacity-40">-</span>
                </td>

                <!-- NOTE -->
                <td class="text-center max-w-[200px] py-3">
                  <div v-if="sensor.early_end_note" class="text-[9px] opacity-70 truncate"
                    :title="sensor.early_end_note">
                    {{ sensor.early_end_note }}
                  </div>
                  <span v-else class="opacity-30">-</span>
                </td>

                <!-- AZIONI -->
                <td class="text-center py-3">
                  <div class="flex justify-center gap-1">

                    <!-- Termina -->
                    <button v-if="!sensor.actual_end_date" @click="showEndModal(sensor)"
                      class="btn btn-ghost btn-xs btn-circle text-warning" title="Termina sensore">
                      <i class="fa-solid fa-flag-checkered text-[10px]"></i>
                    </button>

                    <!-- Elimina -->
                    <button @click="deleteSensor(sensor.id)" class="btn btn-ghost btn-xs btn-circle text-error"
                      title="Elimina">
                      <i class="fa-solid fa-trash text-[10px]"></i>
                    </button>

                  </div>
                </td>

              </tr>

            </tbody>

          </table>
        </div>

      </div>
    </div>

    <!-- MODAL TERMINAZIONE SENSORE -->
    <dialog ref="endModal" class="modal">
      <div
        class="modal-box bg-gradient-to-br from-base-200 to-base-300 border border-base-content/10 shadow-2xl shadow-black/10 rounded-2xl md:rounded-3xl p-4 md:p-6">

        <!-- Header Modal -->
        <div class="flex items-center gap-2 md:gap-3 mb-4">
          <div class="p-2 md:p-3 bg-warning/10 rounded-lg md:rounded-xl shadow-sm">
            <i class="fa-solid fa-flag-checkered text-warning text-lg md:text-xl"></i>
          </div>
          <div>
            <h3 class="text-base md:text-lg font-black uppercase tracking-tight leading-none">
              Termina Sensore
            </h3>
            <span class="text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-widest">
              Chiusura Anticipata o Scadenza
            </span>
          </div>
        </div>

        <p class="text-xs md:text-sm opacity-70 mb-4 leading-relaxed">
          Il sensore verrà spostato nello storico con la data odierna.
          Puoi aggiungere una nota per indicare il motivo della terminazione anticipata.
        </p>

        <!-- Nota -->
        <div class="space-y-1 md:space-y-2 mb-6">
          <label class="text-[10px] font-black uppercase opacity-40">Nota (opzionale)</label>
          <textarea v-model="endNote"
            class="textarea textarea-bordered h-28 text-xs font-black border-warning/30 focus:border-warning w-full rounded-lg md:rounded-xl shadow-sm"
            placeholder="Spiega perché il sensore è durato meno di 15 giorni..."></textarea>
        </div>

        <!-- Pulsanti -->
        <div class="flex justify-end gap-2">
          <button @click="closeEndModal"
            class="btn btn-ghost btn-sm md:btn-md px-4 font-black uppercase tracking-widest opacity-60 hover:opacity-100">
            Annulla
          </button>

          <button @click="confirmEndSensor"
            class="btn btn-warning btn-sm md:btn-md px-6 font-black uppercase tracking-widest shadow-md md:shadow-lg shadow-warning/40"
            :disabled="store.loading">
            <span v-if="store.loading" class="loading loading-spinner loading-xs md:loading-sm"></span>
            <span v-else>Conferma</span>
          </button>
        </div>

      </div>

      <form method="dialog" class="modal-backdrop">
        <button @click="closeEndModal">close</button>
      </form>
    </dialog>

  </div>
</template>


<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useGlucoseStore } from '../stores/glucose'

const store = useGlucoseStore()
const endModal = ref(null)
const endNote = ref('')
const sensorToEnd = ref(null)

const newSensor = reactive({
  serial_number: '',
  lot_number: '',
  start_date: new Date().toISOString().slice(0, 16)
})

onMounted(async () => {
  await store.fetchSensors()
})

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getCountdown(endDateStr) {
  const now = new Date()
  const end = new Date(endDateStr)
  const diffMs = end - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (diffMs <= 0) return 'Scaduto'
  if (diffDays > 0) return `${diffDays}g ${diffHours}h rimanenti`
  return `${diffHours}h rimanenti`
}

function isEarlyEnd(sensor) {
  if (!sensor.actual_end_date) return false
  const start = new Date(sensor.start_date)
  const actualEnd = new Date(sensor.actual_end_date)
  const diffDays = (actualEnd - start) / (1000 * 60 * 60 * 24)
  return diffDays < 15
}

async function addSensor() {
  if (!newSensor.serial_number.trim()) return

  await store.addSensor(
    newSensor.serial_number,
    newSensor.lot_number,
    newSensor.start_date
  )

  if (!store.error) {
    newSensor.serial_number = ''
    newSensor.lot_number = ''
    newSensor.start_date = new Date().toISOString().slice(0, 16)
  }
}

function showEndModal(sensor) {
  sensorToEnd.value = sensor
  endNote.value = ''
  endModal.value?.showModal()
}

function closeEndModal() {
  endModal.value?.close()
  sensorToEnd.value = null
  endNote.value = ''
}

async function confirmEndSensor() {
  if (!sensorToEnd.value) return

  await store.endSensor(
    sensorToEnd.value.id,
    new Date().toISOString(),
    endNote.value
  )

  if (!store.error) {
    closeEndModal()
  }
}

async function deleteSensor(id) {
  if (confirm('Sei sicuro di voler eliminare questo sensore?')) {
    await store.deleteSensor(id)
  }
}
</script>
