<template>
  <div class="card bg-base-200 shadow-2xl border border-base-content/5 overflow-hidden h-full">
    <div class="card-body p-4 flex flex-col gap-4">
      <!-- Header -->
      <div class="h-8 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-primary/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 text-primary">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span class="text-[10px] uppercase font-black tracking-widest opacity-40">Gestione Insulina</span>
        </div>
        <div class="px-2 py-0.5 rounded-md bg-base-300 text-[9px] font-black opacity-40">{{ store.insulinRecords.length }}</div>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Parte Superiore: Inserimento -->
        <div class="flex flex-col gap-4 h-[180px]">
          <div class="grid grid-cols-2 gap-4">
            <!-- Tipo Insulina -->
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between px-1">
                <span class="text-[10px] font-black uppercase opacity-30 tracking-widest">Tipo</span>
                <span class="text-[9px] font-black uppercase" :class="type === 'rapid' ? 'text-primary' : 'text-secondary'">
                  {{ type === 'rapid' ? 'Rapida' : 'Lenta' }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2 p-1 bg-base-300 rounded-xl h-[38px] items-center">
                <button 
                  @click="type = 'rapid'"
                  class="btn btn-xs border-none rounded-lg transition-all duration-300 h-full"
                  :class="type === 'rapid' ? 'bg-primary hover:bg-primary text-primary-content shadow-lg' : 'bg-transparent opacity-50 hover:opacity-100'"
                >
                  <span class="text-[9px] font-black uppercase">Rapida</span>
                </button>
                <button 
                  @click="type = 'slow'"
                  class="btn btn-xs border-none rounded-lg transition-all duration-300 h-full"
                  :class="type === 'slow' ? 'bg-secondary hover:bg-secondary text-secondary-content shadow-lg' : 'bg-transparent opacity-50 hover:opacity-100'"
                >
                  <span class="text-[9px] font-black uppercase">Lenta</span>
                </button>
              </div>
            </div>

            <!-- Unità -->
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between px-1">
                <span class="text-[10px] font-black uppercase opacity-30 tracking-widest">Dosaggio</span>
                <span class="text-xs font-black text-primary">{{ formatUnits(units) }} <span class="opacity-50">U</span></span>
              </div>
              <div class="flex items-center gap-2 bg-base-300 p-1 rounded-xl h-[38px]">
                <button @click="units = Math.max(0, units - 0.5)" class="btn btn-xs btn-ghost btn-circle font-black text-base">-</button>
                <input 
                  type="number" 
                  v-model.number="units" 
                  step="0.5"
                  lang="en-US"
                  class="input input-xs bg-transparent w-full text-center font-black text-base border-none focus:outline-none h-full no-spinner"
                />
                <button @click="units += 0.5" class="btn btn-xs btn-ghost btn-circle font-black text-base">+</button>
              </div>
            </div>
          </div>

          <!-- Quick Tags -->
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="val in [1, 2, 3, 5, 10]" 
              :key="val"
              @click="units = val"
              class="btn btn-xs btn-ghost rounded-xl font-black uppercase tracking-widest text-[9px] opacity-70 hover:opacity-100 bg-base-300/50"
            >
              {{ val }}U
            </button>
          </div>

          <!-- Conferma -->
          <button 
            @click="save" 
            class="btn btn-sm btn-primary rounded-xl border-none font-black uppercase tracking-widest text-[10px] h-10 mt-auto"
            :class="(store.loading || units <= 0) ? '' : 'shadow-lg shadow-primary/20'"
            :disabled="store.loading || units <= 0"
          >
            <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>
            <span v-else>Conferma</span>
          </button>
        </div>

        <!-- Separatore -->
        <div class="h-px bg-base-content/5"></div>

        <!-- Parte Inferiore: Storico -->
        <div class="flex flex-col gap-2 h-[160px]">
          <div class="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3 opacity-30">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span class="text-[8px] uppercase font-black tracking-widest opacity-30">Recenti</span>
          </div>

          <div class="flex-1 overflow-y-auto pr-1 scrollbar-hide">
            <div v-if="!store.insulinRecords.length" class="text-center py-8 opacity-20 flex flex-col items-center gap-1">
              <span class="text-[8px] font-bold uppercase tracking-widest">Nessun record</span>
            </div>
            
            <div class="flex flex-col gap-1.5">
              <div 
                v-for="ins in sortedInsulin" 
                :key="ins.id"
                class="bg-base-100/40 p-2 rounded-xl group transition-all border border-transparent hover:border-base-content/5"
              >
                <!-- Vista normale -->
                <div class="flex items-center justify-between">
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
                    >
                      <i class="fi fi-sr-pencil text-[10px]"></i>
                    </button>
                    <button 
                      @click="store.removeInsulin(ins.id)"
                      class="btn btn-ghost btn-circle btn-xs text-error hover:bg-error/10 h-6 w-6"
                    >
                      <i class="fi fi-sr-trash text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Modifica -->
    <dialog :id="`edit_modal_insulin_${id}`" class="modal">
      <div class="modal-box bg-base-200 border border-base-content/10 shadow-2xl rounded-3xl p-6">
        <h3 class="font-black text-lg uppercase italic tracking-tight mb-4 flex items-center gap-2">
          <i class="fi fi-sr-pencil text-primary"></i> Modifica Insulina
        </h3>
        
        <div class="space-y-4">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black uppercase opacity-40">Unità</label>
            <input 
              type="number" 
              step="0.5" 
              v-model="editForm.units" 
              class="input input-bordered bg-base-300/50 font-black text-xl"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black uppercase opacity-40">Tipo</label>
            <select v-model="editForm.type" class="select select-bordered bg-base-300/50 font-black">
              <option value="rapid">Rapida</option>
              <option value="slow">Lenta</option>
            </select>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black uppercase opacity-40">Orario</label>
            <input 
              type="datetime-local" 
              v-model="editForm.timestamp" 
              class="input input-bordered bg-base-300/50 font-black"
            />
          </div>
        </div>

        <div class="modal-action gap-2">
          <form method="dialog">
            <button class="btn btn-ghost uppercase font-black text-xs">Annulla</button>
          </form>
          <button 
            @click="saveEdit" 
            class="btn btn-primary uppercase font-black text-xs px-8"
            :disabled="store.loading"
          >
            Salva
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGlucoseStore } from '../stores/glucose'

const store = useGlucoseStore()
const id = Math.random().toString(36).substr(2, 9)
const type = ref('rapid')
const units = ref(0)
const editingId = ref(null)
const editForm = ref({ type: 'rapid', units: 1.0, timestamp: '' })

const sortedInsulin = computed(() => {
  return [...store.insulinRecords].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

function formatUnits(val) {
  if (val === null || val === undefined) return '0.0'
  return Number(val).toFixed(1).replace(',', '.')
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

watch(() => units.value, (newVal) => {
  if (newVal === null || newVal === undefined) return
  const rounded = Math.round(newVal * 2) / 2
  if (rounded !== newVal) units.value = rounded
})

async function save() {
  await store.addInsulin(type.value, units.value)
  if (!store.error) units.value = 0
}

function startEdit(ins) {
  editingId.value = ins.id
  const d = new Date(ins.timestamp)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  editForm.value = {
    type: ins.type,
    units: ins.units,
    timestamp: d.toISOString().slice(0, 16)
  }
  document.getElementById(`edit_modal_insulin_${id}`).showModal()
}

async function saveEdit() {
  await store.editInsulin(editingId.value, {
    type: editForm.value.type,
    units: editForm.value.units,
    timestamp: new Date(editForm.value.timestamp).toISOString()
  })
  if (!store.error) {
    editingId.value = null
    document.getElementById(`edit_modal_insulin_${id}`).close()
  }
}
</script>

<style scoped>
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.no-spinner {
  -moz-appearance: textfield;
}
</style>
