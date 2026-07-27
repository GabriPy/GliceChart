<template>
  <div class="flex flex-col gap-6">
    <div class="card bg-base-200 shadow-xl border border-base-content/5">
      <div class="card-body p-4 md:p-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-accent/10 rounded-2xl">
              <i class="fi fi-sr-wheat text-accent text-xl"></i>
            </div>
            <div>
              <h2 class="text-lg font-black uppercase tracking-tight leading-none">Dietometro</h2>
              <span class="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">Stima carboidrati per porzione</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <!-- Ricerca -->
            <div class="relative w-full sm:w-64">
              <i class="fi fi-sr-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] opacity-30"></i>
              <input
                v-model="searchQuery"
                type="text"
                class="input input-sm bg-base-300/60 rounded-xl font-black tracking-widest text-[10px] w-full pl-9 h-10 border-none focus:outline-none"
                placeholder="CERCA ALIMENTO..."
              />
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button
                class="btn btn-sm btn-outline rounded-xl border-base-content/10 font-black uppercase tracking-widest text-[10px] h-10 flex-1 sm:flex-none"
                @click="showAddFood = !showAddFood"
              >
                <i class="fi fi-sr-plus text-[10px]"></i>
                Aggiungi
              </button>

              <button
                class="btn btn-sm btn-accent rounded-xl border-none font-black uppercase tracking-widest text-[10px] h-10 flex-1 sm:flex-none"
                :class="cartTotal > 0 ? 'shadow-lg shadow-accent/20' : ''"
                :disabled="cartTotal <= 0"
                @click="openCart"
                title="Apri pasto"
              >
                <i class="fi fi-sr-shopping-cart text-sm"></i>
                <span>Pasto</span>
                <span class="badge badge-neutral font-black text-[10px]">{{ Math.round(cartTotal) }}g</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddFood" class="card bg-base-200 shadow-xl border border-base-content/5">
      <div class="card-body p-6 gap-4">
        <div class="flex items-center justify-between gap-4">
          <div class="text-xs font-black uppercase tracking-widest opacity-50">Nuovo alimento</div>
          <button class="btn btn-ghost btn-xs font-black uppercase tracking-widest" @click="showAddFood = false">Chiudi</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Nome -->
            <div class="flex flex-col gap-1.5">
              <div class="text-[8px] font-black uppercase tracking-widest opacity-30 ml-1">Nome alimento</div>
              <input
                v-model="newFood.name"
                type="text"
                class="input input-sm bg-base-300/60 rounded-xl font-black tracking-widest text-[10px] uppercase h-10 border-none focus:outline-none w-full"
                placeholder="ES. PASTA..."
              />
            </div>
            <!-- Carb/100g -->
            <div class="flex flex-col gap-1.5">
              <div class="text-[8px] font-black uppercase tracking-widest opacity-30 ml-1">Carb/100g</div>
              <input
                v-model.number="newFood.carbsPer100g"
                type="number"
                min="0"
                max="100"
                class="input input-sm bg-base-300/60 rounded-xl font-black tracking-widest text-[10px] uppercase h-10 border-none focus:outline-none w-full no-spinner"
                placeholder="ES. 70..."
              />
            </div>
          </div>

          <!-- Selettore Categoria (Stile Button Group) -->
          <div class="flex flex-col gap-1.5">
            <div class="text-[8px] font-black uppercase tracking-widest opacity-30 ml-1">Categoria</div>
            <div class="grid grid-cols-4 gap-1 p-1 bg-base-300/60 rounded-xl h-10 items-center">
              <button 
                v-for="cat in categories" 
                :key="cat"
                @click="newFood.category = cat"
                class="btn btn-xs border-none rounded-lg transition-all duration-300 h-full"
                :class="newFood.category === cat ? 'bg-accent text-accent-content shadow-lg' : 'bg-transparent opacity-50 hover:opacity-100'"
              >
                <span class="text-[8px] font-black uppercase">{{ cat }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button
            class="btn btn-sm btn-ghost rounded-xl font-black uppercase tracking-widest text-[10px]"
            :disabled="creatingFood"
            @click="resetNewFood"
          >
            Reset
          </button>
          <button
            class="btn btn-sm btn-accent rounded-xl border-none font-black uppercase tracking-widest text-[10px]"
            :class="canCreateFood ? 'shadow-lg shadow-accent/20' : ''"
            :disabled="!canCreateFood || creatingFood"
            @click="createFood"
          >
            <span v-if="creatingFood" class="loading loading-spinner loading-xs"></span>
            <span v-else>Salva</span>
          </button>
        </div>

        <div v-if="foodError" class="alert alert-warning border-none text-[10px] font-black uppercase tracking-wider py-2">
          <span>{{ foodError }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-6">
      <div v-if="foodsLoading" class="card bg-base-200 shadow-xl border border-base-content/5">
        <div class="card-body p-8 flex items-center justify-center">
          <span class="loading loading-dots loading-md text-accent"></span>
        </div>
      </div>

      <div v-else-if="foodsError" class="alert alert-error shadow-lg border-none">
        <span class="text-xs font-black uppercase tracking-widest">{{ foodsError }}</span>
      </div>

      <div v-else-if="!foods.length" class="card bg-base-200 shadow-xl border border-base-content/5">
        <div class="card-body p-10 text-center opacity-30">
          <div class="text-[10px] font-black uppercase tracking-widest">Nessun alimento disponibile</div>
        </div>
      </div>

      <template v-else>
        <div v-for="(categoryFoods, category) in groupedFoods" :key="category" class="flex flex-col gap-4">
          <div 
            v-if="categoryFoods.length"
            class="flex items-center gap-3 cursor-pointer group w-fit"
            @click="collapsedCategories[category] = !collapsedCategories[category]"
          >
            <div class="w-1.5 h-6 rounded-full bg-accent/40 group-hover:bg-accent transition-colors"></div>
            <h3 class="text-xs font-black uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">
              {{ category }}
            </h3>
            <span class="badge badge-sm badge-neutral text-[9px] font-black opacity-40">{{ categoryFoods.length }}</span>
            <i 
              class="fi text-[10px] opacity-30 group-hover:opacity-100 transition-all ml-1"
              :class="collapsedCategories[category] ? 'fi-sr-angle-down' : 'fi-sr-angle-up'"
            ></i>
          </div>

          <div 
            v-if="categoryFoods.length && !collapsedCategories[category]" 
            class="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div
              v-for="food in categoryFoods"
              :key="food.id"
              :id="'card-cibo-' + food.name.toLowerCase().replace(/\s+/g, '-')"
              class="card bg-base-200 shadow-xl border border-base-content/5 transition-all duration-300"
            >
              <div class="card-body p-5 gap-5">
                <!-- Nome e CHO Totali (Grande) -->
                <div class="flex items-start justify-between gap-4">
                  <div class="flex flex-col min-w-0">
                    <div class="text-lg font-black uppercase tracking-tight truncate leading-none">{{ food.name }}</div>
                    <div class="mt-1 text-[8px] font-black opacity-30 uppercase tracking-[0.2em]">
                      {{ food.carbsPer100g }}g CHO / 100g
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-3xl font-black tracking-tighter text-accent leading-none">
                      {{ carbsFor(food).toFixed(0) }}<span class="text-xs ml-0.5 opacity-50">g</span>
                    </div>
                    <div class="text-[8px] font-black opacity-30 uppercase tracking-widest mt-1">CHO STIMATI</div>
                  </div>
                </div>

                <!-- Info Peso (Grande) -->
                <div class="flex items-center justify-between bg-base-300/30 rounded-xl px-4 py-3 border border-base-content/5">
                  <span class="text-[9px] font-black uppercase opacity-30 tracking-widest">Peso</span>
                  <span class="text-2xl font-black text-base-content leading-none">
                    {{ grams[food.id] }}<span class="text-[10px] ml-1 opacity-40 uppercase tracking-widest">grammi</span>
                  </span>
                </div>

                <!-- Slider Ultra-Sottile -->
                <div class="px-1">
                  <input
                    v-model.number="grams[food.id]"
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    class="range range-accent range-xs"
                  />
                  <div class="flex justify-between text-[8px] font-black opacity-20 uppercase tracking-[0.2em] mt-2">
                    <span>0g</span>
                    <span>150g</span>
                    <span>300g</span>
                  </div>
                </div>

                <button
                  class="btn btn-sm btn-accent rounded-xl border-none font-black uppercase tracking-widest text-[10px] h-10 mt-auto"
                  :class="grams[food.id] > 0 ? 'shadow-lg shadow-accent/20' : ''"
                  :disabled="grams[food.id] <= 0"
                  @click="addToCart(food)"
                >
                  <i class="fi fi-sr-plus text-[10px]"></i>
                  Aggiungi
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <dialog ref="cartDialog" class="modal">
      <div class="modal-box bg-base-200 border border-base-content/10 shadow-2xl rounded-2xl">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-accent/10 rounded-xl">
              <i class="fi fi-sr-shopping-cart text-accent text-lg"></i>
            </div>
            <div>
              <div class="text-sm font-black uppercase tracking-widest">Totale CHO</div>
              <div class="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">Totale {{ Math.round(cartTotal) }}g</div>
            </div>
          </div>
          <form method="dialog">
            <button class="btn btn-ghost btn-sm btn-circle">✕</button>
          </form>
        </div>

        <div class="mt-4">
          <div v-if="!cartItems.length" class="py-10 text-center opacity-30">
            <div class="text-[10px] font-black uppercase tracking-widest">Nessun alimento selezionato</div>
          </div>

          <div v-else class="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            <div
              v-for="item in cartItems"
              :key="item.id"
              class="bg-base-300/30 p-3 rounded-2xl border border-base-content/5 flex items-center justify-between gap-4"
            >
              <div class="min-w-0">
                <div class="text-[10px] font-black uppercase tracking-widest truncate">{{ item.name }}</div>
                <div class="text-[9px] font-black opacity-30 uppercase tracking-widest mt-1">
                  {{ item.grams }}g • {{ item.carbs.toFixed(0) }}g CHO
                </div>
              </div>
              <button
                class="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                @click="removeFromCart(item.id)"
                title="Rimuovi"
              >
                <i class="fi fi-sr-trash text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="modal-action mt-5 flex items-center justify-between w-full">
          <button
            class="btn btn-ghost btn-sm rounded-xl font-black uppercase tracking-widest text-[10px]"
            :disabled="!cartItems.length"
            @click="clearCart"
          >
            Svuota
          </button>

          <button
            class="btn btn-accent btn-sm rounded-xl border-none font-black uppercase tracking-widest text-[10px]"
            :class="cartTotal > 0 ? 'shadow-lg shadow-accent/20' : ''"
            :disabled="cartTotal <= 0"
            @click="sendToCarbInput"
          >
            Inserisci nel CHO
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGlucoseStore } from '../stores/glucose'
import axios from 'axios'

const store = useGlucoseStore()
const router = useRouter()

const foods = ref([])
const foodsLoading = ref(false)
const foodsError = ref(null)

const showAddFood = ref(false)
const searchQuery = ref('')
const creatingFood = ref(false)
const foodError = ref(null)

const newFood = reactive({
  name: '',
  carbsPer100g: 0,
  category: 'contorno'
})

const categories = ['primo', 'secondo', 'contorno', 'frutta']
const collapsedCategories = reactive({})

const grams = reactive({})
const cartItems = ref([])
const cartDialog = ref(null)

onMounted(() => {
  fetchFoods()
  categories.forEach(c => collapsedCategories[c] = false)
})

function carbsFor(food) {
  const g = Number(grams[food.id]) || 0
  return (food.carbsPer100g * g) / 100
}

const groupedFoods = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()
  const groups = {}
  categories.forEach(c => groups[c] = [])
  
  foods.value.forEach(f => {
    // Filtro per ricerca
    if (query && !f.name.toLowerCase().includes(query)) return
    
    if (groups[f.category]) groups[f.category].push(f)
    else groups['contorno'].push(f)
  })
  return groups
})

const canCreateFood = computed(() => {
  const name = String(newFood.name || '').trim()
  const carbs = Number(newFood.carbsPer100g)
  return name.length > 0 && Number.isFinite(carbs) && carbs >= 0 && carbs <= 100
})

function resetNewFood() {
  newFood.name = ''
  newFood.carbsPer100g = 0
  newFood.category = 'contorno'
  foodError.value = null
}

async function fetchFoods() {
  foodsLoading.value = true
  foodsError.value = null
  try {
    const { data } = await axios.get('/api/diet/foods')
    const list = Array.isArray(data) ? data : []
    const uniqueFoods = []
    const seenIds = new Set()
    
    list.forEach(x => {
      if (!seenIds.has(x.id)) {
        seenIds.add(x.id)
        uniqueFoods.push({
          id: x.id,
          name: x.name,
          carbsPer100g: Number(x.carbs_per_100g),
          category: x.category
        })
      }
    })
    foods.value = uniqueFoods
    foods.value.forEach(f => {
      if (grams[f.id] === undefined) grams[f.id] = 100
    })
  } catch (e) {
    foodsError.value = e?.response?.data?.error || 'Errore caricamento alimenti'
    foods.value = []
  } finally {
    foodsLoading.value = false
  }
}

async function createFood() {
  if (!canCreateFood.value) return
  creatingFood.value = true
  foodError.value = null
  try {
    await axios.post('/api/diet/foods', {
      name: String(newFood.name || '').trim(),
      carbs_per_100g: Number(newFood.carbsPer100g),
      category: newFood.category
    })
    resetNewFood()
    showAddFood.value = false
    await fetchFoods()
  } catch (e) {
    foodError.value = e?.response?.data?.error || 'Errore aggiunta alimento'
  } finally {
    creatingFood.value = false
  }
}

function addToCart(food) {
  const g = Math.max(0, Math.round(Number(grams[food.id]) || 0))
  if (g <= 0) return
  const carbs = (food.carbsPer100g * g) / 100
  const existing = cartItems.value.find(i => i.id === food.id)
  if (existing) {
    existing.grams = g
    existing.carbs = carbs
    return
  }
  cartItems.value.push({ id: food.id, name: food.name, grams: g, carbs })
}

function removeFromCart(id) {
  cartItems.value = cartItems.value.filter(i => i.id !== id)
}

function clearCart() {
  cartItems.value = []
}

const cartTotal = computed(() => cartItems.value.reduce((sum, i) => sum + Number(i.carbs || 0), 0))

function openCart() {
  if (!cartDialog.value) return
  cartDialog.value.showModal()
}

async function sendToCarbInput() {
  const total = Math.round(cartTotal.value)
  if (total <= 0) return
  store.carbDraftAmount = total
  clearCart()
  if (cartDialog.value) cartDialog.value.close()
  await router.push('/')
}
</script>

<style scoped>
/* Rimuove le freccette (spinner) dall'input numerico */
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.no-spinner {
  -moz-appearance: textfield; /* Per Firefox */
}
</style>
