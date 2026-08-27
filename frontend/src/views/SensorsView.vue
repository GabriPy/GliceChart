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
            <h2 class="text-lg md:text-2xl font-black uppercase tracking-tight leading-none">{{ $t('sensors.title') }}</h2>
            <span class="text-[10px] md:text-xs font-black opacity-40 uppercase tracking-[0.2em]">{{ $t('sensors.subtitle') }}</span>
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
            <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">{{ $t('sensors.newSensorTitle') }}</h3>
            <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">{{ $t('sensors.newSensorSubtitle') }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

          <!-- Numero Seriale -->
          <div class="space-y-1 md:space-y-2">
            <label class="text-[10px] font-black uppercase opacity-40">{{ $t('sensors.serialNumber') }}</label>
            <input type="text" v-model="newSensor.serial_number" placeholder="SN12345678"
              class="input input-bordered font-black input-xs md:input-sm w-full border-primary/30 focus:border-primary placeholder:opacity-30" />
          </div>

          <!-- Numero Lotto -->
          <div class="space-y-1 md:space-y-2">
            <label class="text-[10px] font-black uppercase opacity-40">{{ $t('sensors.lotNumber') }}</label>
            <input type="text" v-model="newSensor.lot_number" placeholder="LOT12345"
              class="input input-bordered font-black input-xs md:input-sm w-full border-accent/30 focus:border-accent placeholder:opacity-30" />
          </div>

          <!-- Data Applicazione -->
          <div class="space-y-1 md:space-y-2">
            <label class="text-[10px] font-black uppercase opacity-40">{{ $t('sensors.applicationDate') }}</label>
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
          {{ $t('sensors.addSensorBtn') }}
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
            <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">{{ $t('sensors.fullHistoryTitle') }}</h3>
            <span class="px-2 py-0.5 rounded-md bg-primary/10 text-[9px] font-black text-primary">{{
              store.sensors.length }}</span>
          </div>
        </div>

        <!-- Nessun sensore -->
        <div v-if="store.sensors.length === 0" class="text-center py-10 opacity-30">
          <i class="fa-solid fa-microchip text-4xl mb-2"></i>
          <p class="text-[10px] font-black uppercase tracking-widest">{{ $t('sensors.noSensorsRegistered') }}</p>
        </div>

        <!-- Tabella -->
        <div v-else class="overflow-x-auto rounded-xl md:rounded-2xl border border-base-content/10 shadow-sm">
          <table class="table table-sm">

            <thead class="bg-base-100/50">
              <tr class="text-[10px] font-black uppercase opacity-50 tracking-widest">
                <th class="text-center py-3">{{ $t('sensors.serial') }}</th>
                <th class="text-center py-3">{{ $t('sensors.lot') }}</th>
                <th class="text-center py-3">{{ $t('sensors.start') }}</th>
                <th class="text-center py-3">{{ $t('sensors.expectedEnd') }}</th>
                <th class="text-center py-3">{{ $t('sensors.status') }}</th>
                <th class="text-center py-3">{{ $t('sensors.timeRemaining') }}</th>
                <th class="text-center py-3">{{ $t('sensors.notes') }}</th>
                <th class="text-center py-3">{{ $t('common.actions') }}</th>
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
                      {{ $t('sensors.statusActive') }}
                    </span>

                    <span v-else
                      class="px-2 py-0.5 rounded-md bg-error/10 text-error border border-error/20 text-[9px] font-black uppercase tracking-widest">
                      {{ $t('sensors.statusExpired') }}
                    </span>

                    <span v-if="sensor.actual_end_date && isEarlyEnd(sensor)"
                      class="px-2 py-0.5 rounded-md bg-warning/10 text-warning border border-warning/20 text-[8px] font-black uppercase tracking-widest">
                      {{ $t('sensors.statusTerminatedEarly') }}
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
                      class="btn btn-ghost btn-xs btn-circle text-warning" :title="$t('sensors.endSensorBtn')">
                      <i class="fa-solid fa-flag-checkered text-[10px]"></i>
                    </button>

                    <!-- Elimina -->
                    <button @click="openDeleteModal(sensor.id)" class="btn btn-ghost btn-xs btn-circle text-error"
                      :title="$t('common.delete')">
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
              {{ $t('sensors.endSensorTitle') }}
            </h3>
            <span class="text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-widest">
              {{ $t('sensors.endSensorSubtitle') }}
            </span>
          </div>
        </div>

        <p class="text-xs md:text-sm opacity-70 mb-4 leading-relaxed">
          {{ $t('sensors.endSensorExplanation') }}
        </p>

        <!-- Nota -->
        <div class="space-y-1 md:space-y-2 mb-6">
          <label class="text-[10px] font-black uppercase opacity-40">{{ $t('sensors.noteOptional') }}</label>
          <textarea v-model="endNote"
            class="textarea textarea-bordered h-28 text-xs font-black border-warning/30 focus:border-warning w-full rounded-lg md:rounded-xl shadow-sm"
            :placeholder="$t('sensors.earlyEndPlaceholder')"></textarea>
        </div>

        <!-- Pulsanti -->
        <div class="flex justify-end gap-2">
          <button @click="closeEndModal"
            class="btn btn-ghost btn-sm md:btn-md px-4 font-black uppercase tracking-widest opacity-60 hover:opacity-100">
            {{ $t('common.cancel') }}
          </button>

          <button @click="confirmEndSensor"
            class="btn btn-warning btn-sm md:btn-md px-6 font-black uppercase tracking-widest shadow-md md:shadow-lg shadow-warning/40"
            :disabled="store.loading">
            <span v-if="store.loading" class="loading loading-spinner loading-xs md:loading-sm"></span>
            <span v-else>{{ $t('common.confirm') }}</span>
          </button>
        </div>

      </div>

      <form method="dialog" class="modal-backdrop">
        <button @click="closeEndModal">{{ $t('common.close') }}</button>
      </form>
    </dialog>

    <!-- MODAL ELIMINAZIONE SENSORE -->
    <dialog ref="deleteModal" class="modal">
      <div
        class="modal-box bg-gradient-to-br from-base-200 to-base-300 border border-base-content/10 shadow-2xl shadow-black/10 rounded-2xl md:rounded-3xl p-4 md:p-6">

        <!-- Header Modal -->
        <div class="flex items-center gap-2 md:gap-3 mb-4">
          <div class="p-2 md:p-3 bg-error/10 rounded-lg md:rounded-xl shadow-sm">
            <i class="fa-solid fa-trash text-error text-lg md:text-xl"></i>
          </div>
          <div>
            <h3 class="text-base md:text-lg font-black uppercase tracking-tight leading-none">
              {{ $t('sensors.deleteSensorTitle') }}
            </h3>
            <span class="text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-widest">
              {{ $t('sensors.deleteSensorSubtitle') }}
            </span>
          </div>
        </div>

        <p class="text-xs md:text-sm opacity-70 mb-6 leading-relaxed">
          {{ $t('sensors.deleteConfirmation') }}
        </p>

        <!-- Buttons -->
        <div class="flex gap-3 justify-end">
          <button @click="closeDeleteModal"
            class="btn btn-ghost btn-sm md:btn-md font-black uppercase tracking-widest">
            {{ $t('common.cancel') }}
          </button>

          <button @click="confirmDeleteSensor"
            class="btn btn-error btn-sm md:btn-md px-6 font-black uppercase tracking-widest shadow-md md:shadow-lg shadow-error/40"
            :disabled="store.loading">
            <span v-if="store.loading" class="loading loading-spinner loading-xs md:loading-sm"></span>
            <span v-else>{{ $t('common.delete') }}</span>
          </button>
        </div>

      </div>

      <form method="dialog" class="modal-backdrop">
        <button @click="closeDeleteModal">{{ $t('common.close') }}</button>
      </form>
    </dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlucoseStore } from '../stores/glucose'

const { t, locale } = useI18n()
const store = useGlucoseStore()
const endModal = ref(null)
const deleteModal = ref(null)
const endNote = ref('')
const sensorToEnd = ref(null)
const sensorToDelete = ref(null)

const newSensor = reactive({
  serial_number: '',
  lot_number: '',
  start_date: new Date().toISOString().slice(0, 16)
})

onMounted(async () => {
  await store.fetchSensors()
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const activeLoc = locale.value === 'en' ? 'en-US' : 'it-IT'
  return date.toLocaleDateString(activeLoc, {
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

  if (diffMs <= 0) return t('sensors.expired')
  if (diffDays > 0) return t('sensors.countdownDaysHours', { days: diffDays, hours: diffHours })
  return t('sensors.countdownHours', { hours: diffHours })
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

function openDeleteModal(id) {
  sensorToDelete.value = id
  deleteModal.value.showModal()
}

function closeDeleteModal() {
  deleteModal.value.close()
  sensorToDelete.value = null
}

async function confirmDeleteSensor() {
  if (sensorToDelete.value) {
    await store.deleteSensor(sensorToDelete.value)
    closeDeleteModal()
  }
}
</script>
