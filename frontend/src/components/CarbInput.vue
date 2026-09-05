<template>
  <div class="card bg-base-200 shadow-2xl border border-base-content/5 overflow-hidden h-full">
    <div class="card-body p-4 flex flex-col gap-4">
      <!-- Header -->
      <div class="h-8 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-accent/10 rounded-lg">
            <i class="fa-solid fa-utensils text-accent text-sm"></i>
          </div>
          <span class="text-[10px] uppercase font-black tracking-widest opacity-40">{{ $t('carbs.title') }}</span>
        </div>
        <div class="px-2 py-0.5 rounded-md bg-base-300 text-[9px] font-black opacity-40">{{ store.carbRecords.length }}
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Parte Superiore: Inserimento -->
        <div class="flex flex-col gap-4 h-[180px]">
          <!-- Quantità CHO -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between px-1">
              <span class="text-[10px] font-black uppercase opacity-30 tracking-widest">{{ $t('common.quantity') }}</span>
              <span class="text-xs font-black text-accent">{{ amount }} <span class="opacity-50">{{ $t('carbs.choGrams') }}</span></span>
            </div>
            <div class="flex items-center gap-2 bg-base-300 p-1 rounded-xl h-[38px]">
              <button @click="amount = Math.max(0, amount - 5)"
                class="btn btn-xs btn-ghost btn-circle font-black text-base" :aria-label="'-5 ' + $t('common.grams')">-</button>
              <input type="number" v-model.number="amount" step="1"
                class="input input-xs bg-transparent w-full text-center font-black text-base border-none focus:outline-none h-full no-spinner" />
              <button @click="amount += 5" class="btn btn-xs btn-ghost btn-circle font-black text-base" :aria-label="'+5 ' + $t('common.grams')">+</button>
            </div>
          </div>

          <!-- Quick Tags -->
          <div class="flex flex-wrap gap-2">
            <button v-for="val in [10, 20, 30, 50, 80]" :key="val" @click="amount = val"
              class="btn btn-xs btn-ghost rounded-xl font-black uppercase tracking-widest text-[9px] opacity-70 hover:opacity-100 bg-base-300/50">
              {{ val }}{{ $t('common.gramSymbol') }}
            </button>
          </div>

          <!-- Conferma -->
          <button @click="save"
            class="btn btn-sm btn-accent rounded-xl border-none font-black uppercase tracking-widest text-[10px] h-10 mt-auto"
            :class="(store.loading || amount <= 0) ? '' : 'shadow-lg shadow-accent/20'"
            :disabled="store.loading || amount <= 0">
            <span v-if="store.loading" class="loading loading-spinner loading-xs"></span>
            <span v-else>{{ $t('carbs.confirm') }}</span>
          </button>
        </div>

        <!-- Separatore -->
        <div class="h-px bg-base-content/5"></div>

        <!-- Parte Inferiore: Storico -->
        <div class="flex flex-col gap-2 h-[160px]">
          <div class="flex items-center gap-2 mb-1">
            <i class="fa-solid fa-clock w-3 h-3 opacity-30 text-[12px]"></i>
            <span class="text-[8px] uppercase font-black tracking-widest opacity-30">{{ $t('common.recent') }}</span>
          </div>

          <div class="flex-1 overflow-y-auto pr-1 scrollbar-hide">
            <div v-if="!store.carbRecords.length" class="text-center py-8 opacity-20 flex flex-col items-center gap-1">
              <span class="text-[8px] font-bold uppercase tracking-widest">{{ $t('carbs.noRecords') }}</span>
            </div>

            <div class="flex flex-col gap-1.5">
              <div v-for="carb in sortedCarbs" :key="carb.id"
                class="bg-base-100/40 p-2 rounded-xl group transition-all border border-transparent hover:border-base-content/5">
                <!-- Vista normale -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-1 h-8 rounded-full bg-accent"></div>
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2 leading-none">
                        <span class="text-xs font-black tracking-tight">{{ carb.amount }}{{ $t('carbs.choGrams') }}</span>
                      </div>
                      <span class="text-[8px] font-black opacity-30 uppercase tracking-wider">{{
                        formatTime(carb.timestamp) }}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button @click="startEdit(carb)"
                      class="btn btn-ghost btn-circle btn-xs text-accent hover:bg-accent/10 h-6 w-6" :title="$t('common.edit')">
                      <i class="fa-solid fa-pencil text-[10px]"></i>
                    </button>
                    <button @click="store.removeCarb(carb.id)"
                      class="btn btn-ghost btn-circle btn-xs text-error hover:bg-error/10 h-6 w-6" :title="$t('common.delete')">
                      <i class="fa-solid fa-trash text-[10px]"></i>
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
    <dialog :id="`edit_modal_carb_${id}`" class="modal">
      <div class="modal-box bg-base-200 border border-base-content/10 shadow-2xl rounded-3xl p-6">
        <h3 class="font-black text-lg uppercase italic tracking-tight mb-4 flex items-center gap-2">
          <i class="fa-solid fa-pencil text-accent"></i> {{ $t('carbs.editTitle') }}
        </h3>

        <div class="space-y-4">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black uppercase opacity-40">{{ $t('common.quantity') }} ({{ $t('common.gramSymbol') }})</label>
            <input type="number" v-model="editForm.amount"
              class="input input-bordered bg-base-300/50 font-black text-xl" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black uppercase opacity-40">{{ $t('common.dateTime') }}</label>
            <input type="datetime-local" v-model="editForm.timestamp"
              class="input input-bordered bg-base-300/50 font-black" />
          </div>
        </div>

        <div class="modal-action gap-2">
          <form method="dialog">
            <button class="btn btn-ghost uppercase font-black text-xs">{{ $t('common.cancel') }}</button>
          </form>
          <button @click="saveEdit" class="btn btn-accent uppercase font-black text-xs px-8" :disabled="store.loading">
            {{ $t('common.save') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>{{ $t('common.close') }}</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlucoseStore } from '../stores/glucose'

const { t, locale } = useI18n()
const store = useGlucoseStore()
const id = Math.random().toString(36).substr(2, 9)
const amount = computed({
  get: () => Number(store.carbDraftAmount) || 0,
  set: (v) => {
    const n = Number(v)
    store.carbDraftAmount = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
  }
})
const editingId = ref(null)
const editForm = ref({ amount: 0, timestamp: '' })

const sortedCarbs = computed(() => {
  return [...store.carbRecords].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

function formatTime(ts) {
  const activeLoc = locale.value === 'en' ? 'en-US' : 'it-IT'
  return new Date(ts).toLocaleTimeString(activeLoc, { hour: '2-digit', minute: '2-digit' })
}

async function save() {
  await store.addCarb(amount.value)
  if (!store.error) amount.value = 0
}

function startEdit(carb) {
  editingId.value = carb.id
  const d = new Date(carb.timestamp)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  editForm.value = {
    amount: carb.amount,
    timestamp: d.toISOString().slice(0, 16)
  }
  document.getElementById(`edit_modal_carb_${id}`).showModal()
}

async function saveEdit() {
  await store.editCarb(editingId.value, {
    amount: editForm.value.amount,
    timestamp: new Date(editForm.value.timestamp).toISOString()
  })
  if (!store.error) {
    editingId.value = null
    document.getElementById(`edit_modal_carb_${id}`).close()
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
