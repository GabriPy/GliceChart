<template>
  <div class="card bg-base-200 shadow-2xl border border-base-content/5 overflow-hidden">
    <div class="card-body p-0">
      <div class="p-4 pb-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-base-300 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3 opacity-50 text-accent">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <span class="text-[9px] uppercase font-black tracking-widest opacity-40">Storico CHO</span>
        </div>
        <div class="px-2 py-0.5 rounded-md bg-base-300 text-[9px] font-black opacity-40">{{ store.carbRecords.length }}</div>
      </div>

      <div class="max-h-[180px] overflow-y-auto px-3 pb-4 scrollbar-hide">
        <div v-if="!store.carbRecords.length" class="text-center py-6 opacity-20 flex flex-col items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <span class="text-[8px] font-bold uppercase tracking-widest">Vuoto</span>
        </div>
        
        <div class="flex flex-col gap-1.5">
          <div 
            v-for="carb in sortedCarbs" 
            :key="carb.id"
            class="bg-base-100/40 p-2 rounded-xl group transition-all border border-transparent hover:border-base-content/5"
          >
            <!-- Vista normale -->
            <div v-if="editingId !== carb.id" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-1 h-8 rounded-full bg-accent"></div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-2 leading-none">
                    <span class="text-xs font-black tracking-tight">{{ carb.amount }}g CHO</span>
                  </div>
                  <span class="text-[8px] font-black opacity-30 uppercase tracking-wider">{{ formatTime(carb.timestamp) }}</span>
                </div>
              </div>

              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  @click="startEdit(carb)"
                  class="btn btn-ghost btn-circle btn-xs text-accent hover:bg-accent/10 h-6 w-6"
                  title="Modifica"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button 
                  @click="store.removeCarb(carb.id)"
                  class="btn btn-ghost btn-circle btn-xs text-error hover:bg-error/10 h-6 w-6"
                  title="Elimina"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Vista modifica -->
            <div v-else class="flex flex-col gap-2 p-1">
              <div class="flex items-center justify-between px-1">
                <span class="text-[8px] font-black uppercase opacity-40">Modifica CHO</span>
                <span class="text-[10px] font-black text-accent">{{ editForm.amount }}g</span>
                <button @click="editingId = null" class="btn btn-ghost btn-xs h-4 min-h-0 text-[8px] uppercase">Annulla</button>
              </div>
              
              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  v-model.number="editForm.amount" 
                  step="1"
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
                class="btn btn-xs btn-accent w-full font-black uppercase text-[8px] tracking-widest"
                :disabled="store.loading"
              >Salva</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGlucoseStore } from '../stores/glucose'

const store = useGlucoseStore()
const editingId = ref(null)
const editForm = ref({
  amount: 0,
  timestamp: ''
})

const sortedCarbs = computed(() => {
  return [...store.carbRecords].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function startEdit(carb) {
  editingId.value = carb.id
  // Convert ISO to datetime-local format (YYYY-MM-DDTHH:mm)
  const d = new Date(carb.timestamp)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  editForm.value = {
    amount: carb.amount,
    timestamp: d.toISOString().slice(0, 16)
  }
}

async function saveEdit() {
  await store.editCarb(editingId.value, {
    amount: editForm.value.amount,
    timestamp: new Date(editForm.value.timestamp).toISOString()
  })
  if (!store.error) {
    editingId.value = null
  }
}
</script>
