<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
        <Download class="w-5 h-5 text-primary" />
        Esporta Dati
      </h3>
      
      <!-- Tipo di dati -->
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text font-semibold">Tipo di dati</span>
        </label>
        <select v-model="exportType" class="select select-bordered w-full">
          <option value="complete">Report Completo (tutti i dati)</option>
          <option value="glucose">Solo Glicemia</option>
          <option value="insulin">Solo Insulina</option>
          <option value="carbs">Solo Carboidrati</option>
          <option value="notes">Solo Note</option>
          <option value="settings">Impostazioni</option>
        </select>
      </div>

      <!-- Format -->
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text font-semibold">Formato</span>
        </label>
        <div class="flex gap-4">
          <label class="label cursor-pointer gap-2">
            <input v-model="format" type="radio" name="format" value="csv" class="radio radio-primary" :disabled="exportType === 'complete'" />
            <span class="label-text">CSV</span>
          </label>
          <label class="label cursor-pointer gap-2">
            <input v-model="format" type="radio" name="format" value="pdf" class="radio radio-primary" />
            <span class="label-text">PDF</span>
          </label>
        </div>
        <label class="label">
          <span class="label-text-alt text-xs opacity-60">
            * Per report completo, PDF è raccomandato per un documento unico
          </span>
        </label>
      </div>

      <!-- Range date -->
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text font-semibold">Range date (opzionale)</span>
        </label>
        <div class="flex items-center gap-2 mb-2">
          <label class="label cursor-pointer gap-2">
            <input v-model="useDateRange" type="checkbox" class="checkbox checkbox-sm checkbox-primary" />
            <span class="label-text">Filtra per periodo</span>
          </label>
        </div>
        
        <div v-if="useDateRange" class="grid grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">Data inizio</span>
            </label>
            <input v-model="dateRange.start" type="date" class="input input-bordered input-sm" />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">Data fine</span>
            </label>
            <input v-model="dateRange.end" type="date" class="input input-bordered input-sm" />
          </div>
        </div>
      </div>

      <!-- Info dati -->
      <div class="bg-base-200 rounded-lg p-3 mb-4">
        <div class="text-xs font-semibold mb-2 opacity-70">Anteprima dati:</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex justify-between">
            <span class="opacity-60">Letture glicemia:</span>
            <span class="font-mono">{{ store.readings.length }}</span>
          </div>
          <div class="flex justify-between">
            <span class="opacity-60">Insulina:</span>
            <span class="font-mono">{{ store.insulinRecords.length }}</span>
          </div>
          <div class="flex justify-between">
            <span class="opacity-60">Carboidrati:</span>
            <span class="font-mono">{{ store.carbRecords.length }}</span>
          </div>
          <div class="flex justify-between">
            <span class="opacity-60">Note:</span>
            <span class="font-mono">{{ store.notes.length }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <form method="dialog">
          <button class="btn btn-ghost">Annulla</button>
        </form>
        <button 
          @click="handleExport" 
          class="btn btn-primary" 
          :disabled="exporting || !canExport"
        >
          <span v-if="exporting" class="loading loading-spinner loading-sm"></span>
          <Download v-else class="w-4 h-4" />
          {{ exporting ? 'Generazione...' : 'Esporta' }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGlucoseStore } from '../stores/glucose'
import ExportService from '../utils/exportService'
import { Download } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const store = useGlucoseStore()
const dialogRef = ref(null)
const exportType = ref('complete')
const format = ref('pdf')
const useDateRange = ref(false)
const dateRange = ref({
  start: '',
  end: ''
})
const exporting = ref(false)

// Set default date range (last 30 days)
const setDefaultDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  
  dateRange.value.end = end.toISOString().split('T')[0]
  dateRange.value.start = start.toISOString().split('T')[0]
}

// Watch dialog open/close
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    dialogRef.value.showModal()
    setDefaultDateRange()
  } else {
    dialogRef.value.close()
  }
})

// Watch export type to adjust format
watch(exportType, (newType) => {
  if (newType === 'complete') {
    format.value = 'pdf'
  }
})

// Compute if export is possible
const canExport = computed(() => {
  if (useDateRange.value) {
    return dateRange.value.start && dateRange.value.end
  }
  return true
})

// Handle export
const handleExport = async () => {
  exporting.value = true
  
  try {
    const range = useDateRange.value ? dateRange.value : null
    
    switch (exportType.value) {
      case 'complete':
        ExportService.exportCompleteReport({
          readings: store.readings,
          insulin: store.insulinRecords,
          carbs: store.carbRecords,
          notes: store.notes,
          settings: store.settings
        }, format.value, range)
        break
        
      case 'glucose':
        ExportService.exportGlucoseReadings(store.readings, format.value, range)
        break
        
      case 'insulin':
        ExportService.exportInsulin(store.insulinRecords, format.value, range)
        break
        
      case 'carbs':
        ExportService.exportCarbs(store.carbRecords, format.value, range)
        break
        
      case 'notes':
        ExportService.exportNotes(store.notes, format.value, range)
        break
        
      case 'settings':
        ExportService.exportSettings(store.settings, format.value)
        break
    }
    
    // Close modal after successful export
    setTimeout(() => {
      emit('close')
    }, 500)
    
  } catch (error) {
    console.error('Export error:', error)
    store.error = 'Errore durante l\'export dei dati'
  } finally {
    exporting.value = false
  }
}
</script>
