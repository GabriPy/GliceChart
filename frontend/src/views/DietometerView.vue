<template>
  <div class="flex flex-col gap-4 md:gap-6 lg:gap-8 px-2 md:px-4 lg:px-0">

    <!-- Header -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-base-200 to-base-300 shadow-lg md:shadow-xl lg:shadow-2xl shadow-black/5 md:shadow-black/10 border border-base-content/10 rounded-2xl md:rounded-3xl">
      <div
        class="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-accent/15 rounded-full blur-2xl md:blur-3xl opacity-70">
      </div>
      <div class="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-primary/15 rounded-xl md:blur-2xl opacity-70">
      </div>

      <div class="relative card-body p-4 md:p-6 lg:p-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
          <div class="flex items-center gap-3 md:gap-4">
            <div
              class="p-3 md:p-4 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl md:rounded-2xl shadow-md md:shadow-lg shadow-accent/30">
              <i class="fa-solid fa-wheat-awn text-accent text-xl md:text-2xl"></i>
            </div>
            <div>
              <h2 class="text-lg md:text-2xl font-black uppercase tracking-tight leading-none">{{ $t('dietometer.title') }}</h2>
              <span class="text-[10px] md:text-xs font-black opacity-40 uppercase tracking-[0.2em]">{{ $t('dietometer.subtitle') }}</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-2 md:gap-3 w-full sm:w-auto">
            <div class="relative w-full sm:w-64">
              <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] opacity-30"></i>
              <input v-model="searchQuery" type="text"
                class="input input-sm bg-base-100/50 border border-base-content/10 rounded-lg md:rounded-xl font-black tracking-widest text-[10px] w-full pl-9 h-10 focus:outline-none shadow-sm uppercase"
                :placeholder="$t('dietometer.searchPlaceholder')" />
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button
                class="btn btn-sm rounded-lg md:rounded-xl bg-base-100/50 border border-base-content/10 font-black uppercase tracking-widest text-[10px] h-10 flex-1 sm:flex-none shadow-sm"
                @click="showAddFood = !showAddFood">
                <i class="fa-solid fa-plus text-[10px]"></i>
                {{ $t('dietometer.addFood') }}
              </button>

              <button
                class="btn btn-sm btn-accent rounded-lg md:rounded-xl border-none font-black uppercase tracking-widest text-[10px] h-10 flex-1 sm:flex-none"
                :class="cartTotal > 0 ? 'shadow-md md:shadow-lg shadow-accent/40' : ''" :disabled="cartTotal <= 0"
                @click="openCart" :title="$t('dietometer.mealCart')">
                <i class="fa-solid fa-cart-shopping text-sm"></i>
                <span>{{ $t('dietometer.mealCart') }}</span>
                <span class="px-1.5 py-0.5 rounded-md bg-base-100/30 font-black text-[10px]">{{
                  Math.round(cartTotal) }}{{ $t('common.gramSymbol') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Nuovo Alimento -->
    <div v-if="showAddFood"
      class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
      <div class="card-body p-4 md:p-6 gap-4 md:gap-6">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-accent/10 rounded-lg md:rounded-xl shadow-sm">
              <i class="fa-solid fa-plus text-accent text-lg md:text-xl"></i>
            </div>
            <div>
              <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">{{ $t('dietometer.newFoodTitle') }}</h3>
              <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">{{ $t('dietometer.newFoodSubtitle') }}</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-xs font-black uppercase tracking-widest"
            @click="showAddFood = false">{{ $t('common.close') }}</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div class="space-y-1 md:space-y-2">
              <label class="text-[10px] font-black uppercase opacity-40">{{ $t('dietometer.foodName') }}</label>
              <input v-model="newFood.name" type="text"
                class="input input-bordered bg-base-100/50 font-black tracking-widest text-[10px] uppercase h-10 w-full shadow-sm"
                :placeholder="$t('dietometer.foodNamePlaceholder')" />
            </div>

            <div class="space-y-1 md:space-y-2">
              <label class="text-[10px] font-black uppercase opacity-40">{{ $t('dietometer.carbsPer100') }}</label>
              <input v-model.number="newFood.carbsPer100g" type="number" min="0" max="100"
                class="input input-bordered bg-base-100/50 font-black tracking-widest text-[10px] uppercase h-10 w-full no-spinner shadow-sm"
                :placeholder="$t('dietometer.carbsPer100Placeholder')" />
            </div>
          </div>

          <div class="space-y-1 md:space-y-2">
            <label class="text-[10px] font-black uppercase opacity-40">{{ $t('dietometer.category') }}</label>
            <div
              class="grid grid-cols-4 md:grid-cols-7 gap-1 p-1 bg-base-100/50 border border-base-content/10 rounded-lg md:rounded-xl h-auto min-h-[40px] items-center shadow-sm">
              <button v-for="cat in categories" :key="cat" @click="newFood.category = cat"
                class="btn btn-xs border-none rounded-lg transition-all duration-300 min-h-[32px]"
                :class="newFood.category === cat ? 'bg-accent text-accent-content shadow-md' : 'bg-transparent opacity-50 hover:opacity-100'">
                <span class="text-[8px] font-black uppercase">{{ labelForCategory(cat) }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button class="btn btn-sm btn-ghost rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[10px]"
            :disabled="creatingFood" @click="resetNewFood">
            {{ $t('common.reset') }}
          </button>

          <button
            class="btn btn-sm btn-accent rounded-lg md:rounded-xl border-none font-black uppercase tracking-widest text-[10px]"
            :class="canCreateFood ? 'shadow-md md:shadow-lg shadow-accent/40' : ''"
            :disabled="!canCreateFood || creatingFood" @click="createFood">
            <span v-if="creatingFood" class="loading loading-spinner loading-xs"></span>
            <template v-else>
              <i class="fa-regular fa-floppy-disk mr-1"></i>
              {{ $t('common.save') }}
            </template>
          </button>
        </div>

        <div v-if="foodError"
          class="flex items-center gap-2 md:gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg md:rounded-xl">
          <i class="fa-solid fa-triangle-exclamation text-warning text-sm"></i>
          <span class="text-[10px] font-black uppercase tracking-wider">{{ foodError }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4 md:gap-6">
      <div v-if="foodsLoading"
        class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
        <div class="card-body p-8 flex items-center justify-center">
          <span class="loading loading-dots loading-md text-accent"></span>
        </div>
      </div>

      <div v-else-if="foodsError"
        class="flex items-center gap-2 md:gap-3 p-4 bg-error/10 border border-error/20 rounded-xl md:rounded-2xl shadow-sm">
        <i class="fa-solid fa-circle-exclamation text-error text-lg"></i>
        <span class="text-xs font-black uppercase tracking-widest">{{ foodsError }}</span>
      </div>

      <div v-else-if="!foods.length"
        class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10">
        <div class="card-body p-10 text-center opacity-30">
          <div class="text-[10px] font-black uppercase tracking-widest">{{ $t('dietometer.noFoodsAvailable') }}</div>
        </div>
      </div>

      <template v-else>
        <div v-for="(categoryFoods, category) in groupedFoods" :key="category" class="flex flex-col gap-3 md:gap-4">
          <div v-if="categoryFoods.length" class="flex items-center gap-2 md:gap-3 cursor-pointer group w-fit"
            @click="collapsedCategories[category] = !collapsedCategories[category]">
            <div class="w-1.5 h-6 rounded-full bg-accent/40 group-hover:bg-accent transition-colors"></div>
            <h3
              class="text-xs font-black uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">
              {{ labelForCategory(category) }}
            </h3>
            <span
              class="px-2 py-0.5 rounded-md bg-base-100/50 border border-base-content/10 text-[9px] font-black opacity-40">{{
                categoryFoods.length }}</span>
            <i class="fa-solid text-[10px] opacity-30 group-hover:opacity-100 transition-all ml-1"
              :class="collapsedCategories[category] ? 'fa-angle-down' : 'fa-angle-up'"></i>
          </div>

          <div v-if="categoryFoods.length && !collapsedCategories[category]"
            class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div v-for="food in categoryFoods" :key="food.id"
              :id="'card-cibo-' + food.name.toLowerCase().replace(/\s+/g, '-')"
              class="card bg-gradient-to-br from-base-200 to-base-300 shadow-md md:shadow-lg lg:shadow-xl shadow-black/5 md:shadow-black/10 border border-base-content/10 transition-all duration-300">
              <div class="card-body p-4 md:p-5 gap-3 md:gap-4">
                <div class="flex items-start justify-between gap-4 cursor-pointer" @click="toggleFoodCard(food.id)">
                  <div class="flex flex-col min-w-0">
                    <div class="text-base md:text-lg font-black uppercase tracking-tight truncate leading-none">{{
                      food.name }}</div>
                    <div class="mt-1 text-[8px] font-black opacity-30 uppercase tracking-[0.2em]">
                      {{ food.carbsPer100g }}{{ $t('common.gramSymbol') }} CHO / 100{{ $t('common.gramSymbol') }}
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <div class="text-right">
                      <div class="text-2xl md:text-3xl font-black tracking-tighter text-accent leading-none">
                        {{ carbsFor(food).toFixed(0) }}<span class="text-xs ml-0.5 opacity-50">{{ $t('common.gramSymbol') }}</span>
                      </div>
                      <div class="text-[8px] font-black opacity-30 uppercase tracking-widest mt-1">
                        {{ $t('dietometer.estimatedCho') }} <span v-if="!expandedFoodCards[food.id]">/ 100{{ $t('common.gramSymbol') }}</span>
                      </div>
                    </div>
                    <i class="fa-solid text-[10px] opacity-40 transition-all"
                      :class="expandedFoodCards[food.id] ? 'fa-angle-up' : 'fa-angle-down'"></i>
                  </div>
                </div>

                <div v-if="expandedFoodCards[food.id]" class="flex flex-col gap-3 md:gap-4">
                  <div
                    class="flex items-center justify-between bg-base-100/50 rounded-lg md:rounded-xl px-4 py-3 border border-base-content/10 shadow-sm">
                    <span class="text-[9px] font-black uppercase opacity-40 tracking-widest">{{ $t('dietometer.weight') }}</span>
                    <div class="flex items-center justify-end leading-none">
                      <input v-model.number="grams[food.id]" type="number" min="0" max="300" step="1"
                        inputmode="numeric" pattern="[0-9]*"
                        class="w-20 text-right text-2xl font-black text-base-content leading-none bg-transparent border-none outline-none focus:ring-0 p-0 no-spinner"
                        @input="clampGrams(food.id)" @blur="clampGrams(food.id)" />
                      <span class="text-[10px] ml-1 opacity-40 uppercase tracking-widest">{{ $t('common.grams') }}</span>
                    </div>
                  </div>

                  <div class="px-1">
                    <input v-model.number="grams[food.id]" type="range" min="0" max="300" step="5"
                      class="range range-accent range-xs" @input="clampGrams(food.id)" />
                    <div class="flex justify-between text-[8px] font-black opacity-20 uppercase tracking-[0.2em] mt-2">
                      <span>0{{ $t('common.gramSymbol') }}</span>
                      <span>150{{ $t('common.gramSymbol') }}</span>
                      <span>300{{ $t('common.gramSymbol') }}</span>
                    </div>
                  </div>

                  <button
                    class="btn btn-sm btn-accent rounded-lg md:rounded-xl border-none font-black uppercase tracking-widest text-[10px] h-10 mt-auto"
                    :class="grams[food.id] > 0 ? 'shadow-md md:shadow-lg shadow-accent/40' : ''"
                    :disabled="grams[food.id] <= 0" @click.stop="addToCart(food)">
                    <i class="fa-solid fa-plus text-[10px]"></i>
                    {{ $t('common.add') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal Carrello -->
    <dialog ref="cartDialog" class="modal">
      <div
        class="modal-box bg-gradient-to-br from-base-200 to-base-300 border border-base-content/10 shadow-2xl shadow-black/10 rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="p-2 md:p-3 bg-accent/10 rounded-lg md:rounded-xl shadow-sm">
              <i class="fa-solid fa-cart-shopping text-accent text-lg md:text-xl"></i>
            </div>
            <div>
              <h3 class="text-xs md:text-sm font-black uppercase tracking-wider">{{ $t('dietometer.totalChoTitle') }}</h3>
              <span class="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">{{ $t('dietometer.totalChoAmount', { count: Math.round(cartTotal) }) }}</span>
            </div>
          </div>
          <form method="dialog">
            <button class="btn btn-ghost btn-sm btn-circle">✕</button>
          </form>
        </div>

        <div class="mt-4">
          <div v-if="!cartItems.length" class="py-10 text-center opacity-30">
            <div class="text-[10px] font-black uppercase tracking-widest">{{ $t('dietometer.noSelectedFoods') }}</div>
          </div>

          <div v-else class="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            <div v-for="item in cartItems" :key="item.id"
              class="bg-base-100/50 p-3 rounded-lg md:rounded-xl border border-base-content/10 shadow-sm flex items-center justify-between gap-4">
              <div class="min-w-0">
                <div class="text-[10px] font-black uppercase tracking-widest truncate">{{ item.name }}</div>
                <div class="text-[9px] font-black opacity-30 uppercase tracking-widest mt-1">
                  {{ item.grams }}{{ $t('common.gramSymbol') }} • {{ item.carbs.toFixed(0) }}{{ $t('common.gramSymbol') }} CHO
                </div>
              </div>
              <button class="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                @click="removeFromCart(item.id)" :title="$t('common.delete')">
                <i class="fa-solid fa-trash text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="modal-action mt-5 flex items-center justify-between w-full">
          <button class="btn btn-ghost btn-sm rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[10px]"
            :disabled="!cartItems.length" @click="clearCart">
            {{ $t('dietometer.clearCart') }}
          </button>

          <button
            class="btn btn-accent btn-sm rounded-lg md:rounded-xl border-none font-black uppercase tracking-widest text-[10px]"
            :class="cartTotal > 0 ? 'shadow-md md:shadow-lg shadow-accent/40' : ''" :disabled="cartTotal <= 0"
            @click="sendToCarbInput">
            {{ $t('dietometer.recordCho') }}
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlucoseStore } from '../stores/glucose'
import axios from 'axios'

const { t } = useI18n()
const store = useGlucoseStore()

const foods = ref([])
const foodsLoading = ref(false)
const foodsError = ref(null)

const showAddFood = ref(false)
const searchQuery = ref('')
const creatingFood = ref(false)
const foodError = ref(null)

const categories = ['primi', 'secondi', 'contorni', 'frutta', 'latticini', 'bevande', 'prodotti_da_forno']
function labelForCategory(cat) { 
  return t(`dietometer.categories.${cat}`) || cat
}

const newFood = reactive({
  name: '',
  carbsPer100g: 0,
  category: 'contorni'
})

const collapsedCategories = reactive({})
const expandedFoodCards = reactive({})

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

function clampGrams(foodId) {
  let v = Number(grams[foodId])
  if (!Number.isFinite(v) || v < 0) v = 0
  if (v > 300) v = 300
  grams[foodId] = Math.round(v)
}

function toggleFoodCard(foodId) {
  expandedFoodCards[foodId] = !expandedFoodCards[foodId]
}

const groupedFoods = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()
  const groups = {}
  categories.forEach(c => groups[c] = [])

  foods.value.forEach(f => {
    if (query && !f.name.toLowerCase().includes(query)) return

    if (groups[f.category]) groups[f.category].push(f)
    else groups['contorni'].push(f)
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
  newFood.category = 'contorni'
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
      if (expandedFoodCards[f.id] === undefined) expandedFoodCards[f.id] = false
    })
  } catch (e) {
    foodsError.value = e?.response?.data?.error || t('errors.loadFoods')
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
    foodError.value = e?.response?.data?.error || t('errors.addFood')
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
  await store.addCarb(total)
  if (store.error) return
  clearCart()
  if (cartDialog.value) cartDialog.value.close()
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
