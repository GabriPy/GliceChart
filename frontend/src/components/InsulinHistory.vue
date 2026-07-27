<template>
  <div class="card bg-base-200 shadow-2xl border border-base-content/5 overflow-hidden">
    <div class="card-body p-0">
      <div class="p-4 pb-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-base-300 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3 opacity-50">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <span class="text-[9px] uppercase font-black tracking-widest opacity-40">Storico</span>
        </div>
        <div class="px-2 py-0.5 rounded-md bg-base-300 text-[9px] font-black opacity-40">{{ store.insulinRecords.length }}</div>
      </div>

      <div class="max-h-[180px] overflow-y-auto px-3 pb-4 scrollbar-hide">
        <div v-if="!store.insulinRecords.length" class="text-center py-6 opacity-20 flex flex-col items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <span class="text-[8px] font-bold uppercase tracking-widest">Vuoto</span>
        </div>
        
        <div class="flex flex-col gap-1.5">
          <div 
            v-for="ins in sortedInsulin" 
            :key="ins.id"
            class="bg-base-100/40 p-2 rounded-xl group transition-all border border-transparent hover:border-base-content/5"
          >
            <!-- Vista normale -->
            <div v-if="editingId !== ins.id" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div 
                  class="w-1 h-8 rounded-full" 
                  :class="ins.type === 'rapid' ? 'bg-primary' : 'bg-secondary'"
                ></div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-2 leading-none">
                    <span class="text-xs font-black tracking-tight">{{ formatUnits(ins.units) }}U</span>
                    <span class="text-[7px] font-black uppercase px-1 rounded bg-base-300 opacity-60">
                      {{ ins.type === 'rapid' ? 'R' : 'L' }}
                    </span>
                  </div>
                  <span class="text-[8px] font-black opacity-30 uppercase tracking-wider">{{ formatTime(ins.timestamp) }}</span>
                </div>
              </div>

              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  @click="startEdit(ins)"
                  class="btn btn-ghost btn-circle btn-xs text-primary hover:bg-primary/10 h-6 w-6"
                  title="Modifica"
                >
                  <i class="fi fi-sr-pencil text-[10px] mt-0.5"></i>
                </button>
                <button 
                  @click="store.removeInsulin(ins.id)"
                  class="btn btn-ghost btn-circle btn-xs text-error hover:bg-error/10 h-6 w-6"
                  title="Elimina"
                >
                  <i class="fi fi-sr-trash text-[10px] mt-0.5"></i>
                </button>
              </div>
            </div>

            <!-- Vista modifica -->
            <div v-else class="flex flex-col gap-2 p-1">
              <div class="flex items-center justify-between px-1">
                <span class="text-[8px] font-black uppercase opacity-40">Modifica</span>
                <span class="text-[10px] font-black text-primary">{{ formatUnits(editForm.units) }}U</span>
                <button @click="editingId = null" class="btn btn-ghost btn-xs h-4 min-h-0 text-[8px] uppercase">Annulla</button>
              </div>
              
              <div class="grid grid-cols-2 gap-1">
                <button 
                  @click="editForm.type = 'rapid'"
                  class="btn btn-xs rounded-lg text-[8px] uppercase font-black"
                  :class="editForm.type === 'rapid' ? 'btn-primary' : 'btn-outline opacity-50'"
                >Rapida</button>
                <button 
                  @click="editForm.type = 'slow'"
                  class="btn btn-xs rounded-lg text-[8px] uppercase font-black"
                  :class="editForm.type === 'slow' ? 'btn-secondary' : 'btn-outline opacity-50'"
                >Lenta</button>
              </div>

              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  v-model.number="editForm.units" 
                  step="0.5"
                  lang="en-US"
                  class="input input-xs bg-base-300 w-16 text-center font-black text-[10px] rounded-lg"
                />
                <input 
                  type="datetime-local" 
                  v-model="editForm.timestamp"
                  class="input input-xs bg-base-300 flex-1 font-black text-[10px] rounded-lg"
                />
              </div>

              <button 
                @click="saveEdit"
                class="btn btn-xs btn-primary w-full rounded-lg text-[8px] font-black uppercase"
                :disabled="store.loading"
              >
                <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { watch } from 'vue'
import { useGlucoseStore } from '../stores/glucose'

const store = useGlucoseStore()

const sortedInsulin = computed(() => {
  return [...store.insulinRecords].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function formatUnits(val) {
  if (val === null || val === undefined) return '0.0'
  return Number(val).toFixed(1).replace(',', '.')
}

// ── Logica Editing ────────────────────────────────────────────────────────────
const editingId = ref(null)
const editForm = reactive({
  type: 'rapid',
  units: 0,
  timestamp: ''
})

// Forza l'arrotondamento allo 0.5 più vicino anche in modifica
watch(() => editForm.units, (newVal) => {
  if (newVal === null || newVal === undefined) return
  const rounded = Math.round(newVal * 2) / 2
  if (rounded !== newVal) {
    editForm.units = rounded
  }
})

function startEdit(ins) {
  editingId.value = ins.id
  editForm.type = ins.type
  editForm.units = ins.units
  // Formato per input datetime-local: YYYY-MM-DDThh:mm
  const d = new Date(ins.timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  editForm.timestamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function saveEdit() {
  await store.editInsulin(editingId.value, {
    type: editForm.type,
    units: editForm.units,
    timestamp: new Date(editForm.timestamp).toISOString()
  })
  if (!store.error) {
    editingId.value = null
  }
}
</script>