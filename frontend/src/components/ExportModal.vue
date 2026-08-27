<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
        <Download class="w-5 h-5 text-primary" />
        {{ $t('export.title') }}
      </h3>
      
      <!-- Tipo di dati -->
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text font-semibold">{{ $t('export.dataType') }}</span>
        </label>
        <select v-model="exportType" class="select select-bordered w-full">
          <option value="complete">{{ $t('export.types.complete') }}</option>
          <option value="glucose">{{ $t('export.types.glucose') }}</option>
          <option value="insulin">{{ $t('export.types.insulin') }}</option>
          <option value="carbs">{{ $t('export.types.carbs') }}</option>
          <option value="notes">{{ $t('export.types.notes') }}</option>
          <option value="settings">{{ $t('export.types.settings') }}</option>
        </select>
      </div>

      <!-- Format -->
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text font-semibold">{{ $t('export.format') }}</span>
        </label>
        <div class="flex gap-4">
          <label class="label cursor-pointer gap-2">
            <input v-model="format" type="radio" name="format" value="csv" class="radio radio-primary" :disabled="exportType === 'complete'" />
            <span class="label-text">{{ $t('export.csv') }}</span>
          </label>
          <label class="label cursor-pointer gap-2">
            <input v-model="format" type="radio" name="format" value="pdf" class="radio radio-primary" />
            <span class="label-text">{{ $t('export.pdf') }}</span>
          </label>
        </div>
        <label class="label">
          <span class="label-text-alt text-xs opacity-60">
            {{ $t('export.pdfCompleteRecommendation') }}
          </span>
        </label>
      </div>

      <!-- Range date -->
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text font-semibold">{{ $t('export.dateRangeOptional') }}</span>
        </label>
        <div class="flex items-center gap-2 mb-2">
          <label class="label cursor-pointer gap-2">
            <input v-model="useDateRange" type="checkbox" class="checkbox checkbox-sm checkbox-primary" />
            <span class="label-text">{{ $t('export.filterByPeriod') }}</span>
          </label>
        </div>
        
        <label class="label">
          <span class="label-text-alt text-xs opacity-60">
            {{ $t('export.default30DaysNote') }}
          </span>
        </label>
        <div v-if="useDateRange" class="grid grid-cols-2 gap-4 mt-2">
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">{{ $t('export.startDate') }}</span>
            </label>
            <input v-model="dateRange.start" type="date" class="input input-bordered input-sm" />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">{{ $t('export.endDate') }}</span>
            </label>
            <input v-model="dateRange.end" type="date" class="input input-bordered input-sm" />
          </div>
        </div>
      </div>

      <!-- Info dati -->
      <div class="bg-base-200 rounded-lg p-3 mb-4">
        <div class="text-xs font-semibold mb-2 opacity-70">{{ $t('export.preview') }}:</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex justify-between">
            <span class="opacity-60">{{ $t('export.glucoseReadings') }}:</span>
            <span class="font-mono">{{ store.readings.length }}</span>
          </div>
          <div class="flex justify-between">
            <span class="opacity-60">{{ $t('export.insulinRecords') }}:</span>
            <span class="font-mono">{{ store.insulinRecords.length }}</span>
          </div>
          <div class="flex justify-between">
            <span class="opacity-60">{{ $t('export.carbsRecords') }}:</span>
            <span class="font-mono">{{ store.carbRecords.length }}</span>
          </div>
          <div class="flex justify-between">
            <span class="opacity-60">{{ $t('export.notesRecords') }}:</span>
            <span class="font-mono">{{ store.notes.length }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <form method="dialog">
          <button class="btn btn-ghost">{{ $t('common.cancel') }}</button>
        </form>
        <button 
          @click="handleExport" 
          class="btn btn-primary" 
          :disabled="exporting || !canExport"
        >
          <span v-if="exporting" class="loading loading-spinner loading-sm"></span>
          <Download v-else class="w-4 h-4" />
          {{ exporting ? $t('export.generating') : $t('export.exportBtn') }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>{{ $t('common.close') }}</button>
    </form>
  </dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlucoseStore } from '../stores/glucose'
import ExportService from '../utils/exportService'
import { Download } from 'lucide-vue-next'
import axios from 'axios'

const { t } = useI18n()

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

const setDefaultDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  
  dateRange.value.end = end.toISOString().split('T')[0]
  dateRange.value.start = start.toISOString().split('T')[0]
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    dialogRef.value.showModal()
    setDefaultDateRange()
  } else {
    dialogRef.value.close()
  }
})

watch(exportType, (newType) => {
  if (newType === 'complete') {
    format.value = 'pdf'
  }
})

const canExport = computed(() => {
  if (useDateRange.value) {
    return dateRange.value.start && dateRange.value.end
  }
  return true
})

const handleExport = async () => {
  exporting.value = true
  
  try {
    const range = useDateRange.value ? dateRange.value : null

    let readings = store.readings
    let insulin = store.insulinRecords
    let carbs = store.carbRecords
    let notes = store.notes

    let fetchRange = 43200 // Default 30 giorni
    if (useDateRange.value && dateRange.value.start && dateRange.value.end) {
      const startMs = new Date(dateRange.value.start).setHours(0, 0, 0, 0)
      const endMs = new Date(dateRange.value.end).setHours(23, 59, 59, 999)
      const diffMs = endMs - startMs
      fetchRange = Math.max(180, Math.ceil(diffMs / (60 * 1000)))
    }

    if (exportType.value !== 'settings') {
      const [{ data: rData }, { data: iData }, { data: cData }, { data: nData }] = await Promise.all([
        axios.get('/api/readings', { params: { range: fetchRange } }),
        axios.get('/api/insulin', { params: { range: fetchRange } }),
        axios.get('/api/carbs', { params: { range: fetchRange } }),
        axios.get('/api/notes', { params: { range: fetchRange } })
      ])
      readings = rData
      insulin = iData
      carbs = cData
      notes = nData
    }
    
    switch (exportType.value) {
      case 'complete':
        ExportService.exportCompleteReport({
          readings,
          insulin,
          carbs,
          notes,
          settings: store.settings
        }, format.value, range)
        break
        
      case 'glucose':
        ExportService.exportGlucoseReadings(readings, format.value, range, store.settings)
        break
        
      case 'insulin':
        ExportService.exportInsulin(insulin, format.value, range)
        break
        
      case 'carbs':
        ExportService.exportCarbs(carbs, format.value, range)
        break
        
      case 'notes':
        ExportService.exportNotes(notes, format.value, range)
        break
        
      case 'settings':
        ExportService.exportSettings(store.settings, format.value)
        break
    }
    
    setTimeout(() => {
      emit('close')
    }, 500)
    
  } catch (error) {
    console.error('Export error:', error)
    store.error = t('errors.exportData')
  } finally {
    exporting.value = false
  }
}
</script>
