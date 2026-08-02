<template>
  <div class="flex flex-col gap-6">
    <!-- Header Sensori -->
    <div class="card bg-base-200 shadow-sm border border-base-content/10">
      <div class="card-body p-4 md:p-6">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-primary/10 rounded-2xl">
            <i class="fi fi-sr-microchip text-primary text-xl"></i>
          </div>
          <div>
            <h2 class="text-lg font-black uppercase tracking-tight leading-none">Storico Sensori</h2>
            <span class="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">Tracking e Gestione</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Nuovo Sensore -->
    <div class="card bg-base-200 shadow-xl border border-base-content/5">
      <div class="card-body p-6 gap-4">
        <div class="flex items-center gap-2 mb-2">
          <i class="fi fi-rr-add-circle text-success"></i>
          <span class="text-xs font-black uppercase tracking-widest opacity-50">Nuovo Sensore</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text text-[10px] font-black uppercase opacity-40">Numero Seriale</span>
            </label>
            <input 
              type="text" 
              v-model="newSensor.serial_number" 
              placeholder="SN12345678" 
              class="input input-bordered font-black" 
            />
          </div>
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text text-[10px] font-black uppercase opacity-40">Numero Lotto</span>
            </label>
            <input 
              type="text" 
              v-model="newSensor.lot_number" 
              placeholder="LOT12345" 
              class="input input-bordered font-black" 
            />
          </div>
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text text-[10px] font-black uppercase opacity-40">Data Applicazione</span>
            </label>
            <input 
              type="datetime-local" 
              v-model="newSensor.start_date" 
              class="input input-bordered font-black" 
            />
          </div>
        </div>

        <button 
          @click="addSensor" 
          class="btn btn-success btn-sm font-black uppercase tracking-widest gap-2 mt-2"
          :disabled="store.loading || !newSensor.serial_number"
        >
          <span v-if="store.loading" class="loading loading-spinner"></span>
          <i class="fi fi-sr-plus"></i>
          Aggiungi Sensore
        </button>
      </div>
    </div>

    <!-- Tabella Sensori -->
    <div class="card bg-base-200 shadow-sm border border-base-content/10">
      <div class="card-body p-6 gap-4">
        <div class="flex items-center gap-2 mb-2">
          <i class="fi fi-sr-list text-primary"></i>
          <span class="text-xs font-black uppercase tracking-widest opacity-50">Storico Completo</span>
        </div>

        <div v-if="store.sensors.length === 0" class="text-center py-8 opacity-40">
          <i class="fi fi-sr-microchip text-4xl mb-2"></i>
          <p class="text-xs font-black uppercase">Nessun sensore registrato</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr class="text-[10px] font-black uppercase opacity-50">
                <th>Seriale</th>
                <th>Lotto</th>
                <th>Inizio</th>
                <th>Fine Prevista</th>
                <th>Stato</th>
                <th>Note</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sensor in store.sensors" :key="sensor.id" class="text-xs">
                <td class="font-black">{{ sensor.serial_number }}</td>
                <td class="opacity-70">{{ sensor.lot_number || '-' }}</td>
                <td>{{ formatDate(sensor.start_date) }}</td>
                <td>{{ formatDate(sensor.end_date) }}</td>
                <td>
                  <div v-if="!sensor.actual_end_date" class="flex flex-col gap-1">
                    <span class="badge badge-success badge-sm font-black">Attivo</span>
                    <span class="text-[9px] font-bold opacity-50">{{ getCountdown(sensor.end_date) }}</span>
                  </div>
                  <div v-else class="flex flex-col gap-1">
                    <span class="badge badge-error badge-sm font-black">Scaduto</span>
                    <span v-if="isEarlyEnd(sensor)" class="badge badge-warning badge-xs font-black">Terminato prima</span>
                  </div>
                </td>
                <td class="max-w-[200px]">
                  <div v-if="sensor.early_end_note" class="text-[9px] opacity-70 truncate" :title="sensor.early_end_note">
                    {{ sensor.early_end_note }}
                  </div>
                  <span v-else class="opacity-30">-</span>
                </td>
                <td>
                  <div v-if="!sensor.actual_end_date" class="flex gap-1">
                    <button 
                      @click="showEndModal(sensor)" 
                      class="btn btn-warning btn-xs font-black uppercase"
                    >
                      Termina
                    </button>
                    <button 
                      @click="deleteSensor(sensor.id)" 
                      class="btn btn-ghost btn-xs text-error"
                    >
                      <i class="fi fi-sr-trash"></i>
                    </button>
                  </div>
                  <button 
                    v-else 
                    @click="deleteSensor(sensor.id)" 
                    class="btn btn-ghost btn-xs text-error"
                  >
                    <i class="fi fi-sr-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Terminazione Sensore -->
    <dialog ref="endModal" class="modal">
      <div class="modal-box">
        <h3 class="font-black text-lg mb-4">Termina Sensore</h3>
        <p class="text-sm opacity-70 mb-4">Il sensore verrà spostato nello storico con la data odierna.</p>
        
        <div class="form-control mb-4">
          <label class="label py-1">
            <span class="label-text text-xs font-black uppercase opacity-50">Nota (opzionale)</span>
          </label>
          <textarea 
            v-model="endNote" 
            class="textarea textarea-bordered h-24 text-xs" 
            placeholder="Spiega perché il sensore è durato meno di 15 giorni..."
          ></textarea>
        </div>

        <div class="flex justify-end gap-2">
          <button @click="closeEndModal" class="btn btn-ghost btn-sm">Annulla</button>
          <button 
            @click="confirmEndSensor" 
            class="btn btn-warning btn-sm font-black uppercase"
            :disabled="store.loading"
          >
            <span v-if="store.loading" class="loading loading-spinner"></span>
            Conferma
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
