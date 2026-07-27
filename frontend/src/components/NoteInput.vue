<template>
  <div class="card bg-base-200 shadow-2xl border border-base-content/5 overflow-hidden h-full">
    <div class="card-body p-4 flex flex-col gap-4">
      <!-- Header -->
      <div class="h-8 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-info/10 rounded-lg">
            <i class="fi fi-sr-note-sticky text-info text-sm"></i>
          </div>
          <span class="text-[10px] uppercase font-black tracking-widest opacity-40">Note / Eventi</span>
        </div>
        <div class="px-2 py-0.5 rounded-md bg-base-300 text-[9px] font-black opacity-40">{{ store.notes.length }}</div>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Parte Superiore: Inserimento -->
        <div class="flex flex-col gap-4 h-[180px]">
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between px-1">
              <span class="text-[10px] font-black uppercase opacity-30 tracking-widest">Testo nota</span>
            </div>
            <div class="h-[38px]">
              <input
                v-model="text"
                type="text"
                class="input input-sm bg-base-300/60 rounded-xl font-black tracking-widest text-[10px] w-full h-full border-none focus:outline-none"
                placeholder="Scrivi una nota (es. Sport, Pizza...)"
              />
            </div>

            <div class="flex flex-wrap gap-2 mt-1">
              <button
                v-for="t in quickTags"
                :key="t"
                class="btn btn-xs btn-ghost rounded-xl font-black uppercase tracking-widest text-[9px] opacity-70 hover:opacity-100"
                @click="applyQuickTag(t)"
              >
                {{ t }}
              </button>
            </div>
          </div>

          <button
            class="btn btn-sm btn-info rounded-xl border-none font-black uppercase tracking-widest text-[10px] h-10 mt-auto"
            :class="(store.loading || !canSave) ? '' : 'shadow-lg shadow-info/20'"
            :disabled="store.loading || !canSave"
            @click="save"
          >
            <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>
            <span v-else>Salva Nota</span>
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
            <div v-if="!sortedNotes.length" class="text-center py-8 opacity-20 flex flex-col items-center gap-1">
              <span class="text-[8px] font-bold uppercase tracking-widest">Nessuna nota</span>
            </div>

            <div class="flex flex-col gap-1.5">
              <div
                v-for="n in sortedNotes"
                :key="n.id"
                class="bg-base-100/40 p-2 rounded-xl group transition-all border border-transparent hover:border-base-content/5"
              >
                <!-- Vista normale -->
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-1 h-8 rounded-full bg-info"></div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-xs font-black tracking-tight truncate">{{ n.text }}</span>
                      <span class="text-[8px] font-black opacity-30 uppercase tracking-wider">{{ formatTime(n.timestamp) }}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      @click="startEdit(n)"
                      class="btn btn-ghost btn-circle btn-xs text-info hover:bg-info/10 h-6 w-6"
                    >
                      <i class="fi fi-sr-pencil text-[10px]"></i>
                    </button>
                    <button
                      class="btn btn-ghost btn-circle btn-xs text-error hover:bg-error/10 h-6 w-6"
                      @click="store.removeNote(n.id)"
                      title="Elimina"
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
    <dialog :id="`edit_modal_note_${id}`" class="modal">
      <div class="modal-box bg-base-200 border border-base-content/10 shadow-2xl rounded-3xl p-6">
        <h3 class="font-black text-lg uppercase italic tracking-tight mb-4 flex items-center gap-2">
          <i class="fi fi-sr-pencil text-info"></i> Modifica Nota
        </h3>
        
        <div class="space-y-4">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black uppercase opacity-40">Testo Nota</label>
            <textarea 
              v-model="editForm.text" 
              class="textarea textarea-bordered bg-base-300/50 font-bold h-24"
            ></textarea>
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
            class="btn btn-info uppercase font-black text-xs px-8"
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
import { computed, ref } from 'vue'
import { useGlucoseStore } from '../stores/glucose'

const store = useGlucoseStore()
const id = Math.random().toString(36).substr(2, 9)

const quickTags = ['Sport', 'Stress', 'Pizza', 'Correzione', 'Passeggiata', 'Ipoglicemia', 'Cena']
const text = ref('')
const editingId = ref(null)
const editForm = ref({ text: '', timestamp: '' })

const canSave = computed(() => {
  const t = String(text.value || '').trim()
  return t.length > 0 && t.length <= 200
})

const sortedNotes = computed(() => {
  return [...store.notes].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)
})

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function applyQuickTag(t) {
  const current = String(text.value || '').trim()
  if (!current) {
    text.value = t
    return
  }
  if (current.toLowerCase().includes(t.toLowerCase())) return
  text.value = `${current} • ${t}`
}

async function save() {
  const t = String(text.value || '').trim()
  if (!t) return
  await store.addNote(t)
  if (!store.error) text.value = ''
}

function startEdit(n) {
  editingId.value = n.id
  const d = new Date(n.timestamp)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  editForm.value = {
    text: n.text,
    timestamp: d.toISOString().slice(0, 16)
  }
  document.getElementById(`edit_modal_note_${id}`).showModal()
}

async function saveEdit() {
  await store.editNote(editingId.value, {
    text: editForm.value.text,
    timestamp: new Date(editForm.value.timestamp).toISOString()
  })
  if (!store.error) {
    editingId.value = null
    document.getElementById(`edit_modal_note_${id}`).close()
  }
}
</script>
