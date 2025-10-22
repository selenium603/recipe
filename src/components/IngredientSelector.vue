<!-- IngredientSelector.vue -->
<template>
  <div>
    <!-- 可展开/收起的选择面板 -->
    <details class="mb-4 group" :open="panelOpen" @toggle="onDetailsToggle">
      <summary
        class="cursor-pointer select-none px-4 py-3 md:py-2 border-2 border-[#0A0910] rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-between"
      >
        <span class="font-medium text-base md:text-sm">▼食材列表</span>
        <div class="flex items-center gap-2">
          <button
            v-if="selectedIngredients.length > 0"
            @click.prevent="clearAllIngredients"
            class="text-sm md:text-xs px-3 py-1 md:px-2 md:py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300 transition-colors font-medium border border-red-300"
            title="清空所有已选食材"
          >
            清空
          </button>
          <span class="text-lg md:text-base">{{ panelOpen ? '－' : '＋' }}</span>
        </div>
      </summary>

      <div class="mt-3 space-y-4">
        <!-- 蔬菜 -->
        <div>
          <div class="text-sm md:text-xs font-semibold text-gray-600 mb-2">蔬菜</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ingredient in groupedIngredients.vegetables"
              :key="'veg-' + ingredient"
              @click="toggleIngredient(ingredient)"
              :class="buttonClass(ingredient)"
            >
              {{ ingredient }}
            </button>
          </div>
        </div>

        <!-- 肉类 -->
        <div>
          <div class="text-sm md:text-xs font-semibold text-gray-600 mb-2">肉</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ingredient in groupedIngredients.meat"
              :key="'meat-' + ingredient"
              @click="toggleIngredient(ingredient)"
              :class="buttonClass(ingredient)"
            >
              {{ ingredient }}
            </button>
          </div>
        </div>

        <!-- 蛋奶 -->
        <div>
          <div class="text-sm md:text-xs font-semibold text-gray-600 mb-2">蛋奶</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ingredient in groupedIngredients.eggsDairy"
              :key="'eggdairy-' + ingredient"
              @click="toggleIngredient(ingredient)"
              :class="buttonClass(ingredient)"
            >
              {{ ingredient }}
            </button>
          </div>
        </div>

        <!-- 其他/主食等 -->
        <div v-if="groupedIngredients.others.length">
          <div class="text-sm md:text-xs font-semibold text-gray-600 mb-2">其他</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ingredient in groupedIngredients.others"
              :key="'other-' + ingredient"
              @click="toggleIngredient(ingredient)"
              :class="buttonClass(ingredient)"
            >
              {{ ingredient }}
            </button>
          </div>
        </div>
      </div>
    </details>

    <!-- 自定义食材输入 -->
    <div>
      <div class="flex gap-2 mb-2">
        <input
          v-model="newIngredient"
          @keyup.enter="addCustomIngredient"
          placeholder="输入其他食材..."
          class="flex-1 p-3 md:p-3 border-2 border-[#0A0910] rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          :disabled="selectedIngredients.length >= 10"
        />
        <button
          @click="addCustomIngredient"
          :disabled="!newIngredient.trim() || selectedIngredients.length >= 10"
          class="bg-yellow-400 text-dark-800 px-5 py-3 md:px-4 md:py-3 rounded-lg border-2 border-[#0A0910] hover:bg-yellow-500 active:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-base md:text-sm whitespace-nowrap"
        >
          添加
        </button>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  selectedIngredients: string[]
}>()

const emit = defineEmits(['update:selectedIngredients'])

const newIngredient = ref('')
const panelOpen = ref(false)

// 基础清单：包含用户要求新增的食材（去重）
const baseIngredients = Array.from(new Set([
  '包菜','午餐肉','土豆','方便面','木耳','洋葱','牛肉', '猪肉',
  '番茄','白菜','白萝卜','米','胡萝卜','腊肠','花菜','芹菜',
  '茄子','莴笋','菌菇','虾','虾仁','西葫芦','豆腐','青椒','面包','面食',
  '香肠','鸡肉','鸡蛋','鸭蛋','鹅蛋','黄瓜'
]))

// 分类规则：蔬菜 / 肉 / 蛋奶（将鸡蛋、牛奶等放在蛋奶）
const vegetablesSet = new Set([
  '包菜','土豆','木耳','洋葱','番茄','白菜','白萝卜','胡萝卜','花菜','芹菜',
  '茄子','莴笋','菌菇','西葫芦','青椒','黄瓜'
])
const meatSet = new Set([
  '牛肉','猪肉','腊肠','香肠','午餐肉','鸡肉','虾','虾仁'
])
const eggsDairySet = new Set([
  '鸡蛋','鸭蛋','鹅蛋','牛奶','奶酪'
])

const groupedIngredients = computed(() => {
  const vegetables: string[] = []
  const meat: string[] = []
  const eggsDairy: string[] = []
  const others: string[] = []

  baseIngredients.forEach(item => {
    if (vegetablesSet.has(item)) {
      vegetables.push(item)
    } else if (meatSet.has(item)) {
      meat.push(item)
    } else if (eggsDairySet.has(item)) {
      eggsDairy.push(item)
    } else {
      // 例如主食：米、米饭、面包、面食、方便面、豆腐等
      others.push(item)
    }
  })

  return { vegetables, meat, eggsDairy, others }
})

const buttonClass = (ingredient: string) => [
  'px-3 py-2.5 md:px-3 md:py-2 rounded-lg border-2 border-[#0A0910] font-medium text-base md:text-sm transition-all duration-200 active:scale-95',
  props.selectedIngredients.includes(ingredient)
    ? 'bg-yellow-400 text-dark-800 shadow-md'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
]

const toggleIngredient = (ingredient: string) => {
  const updated = [...props.selectedIngredients]
  const index = updated.indexOf(ingredient)
  
  if (index > -1) {
    updated.splice(index, 1)
  } else if (updated.length < 10) {
    updated.push(ingredient)
  }
  
  emit('update:selectedIngredients', updated)
}

const addCustomIngredient = () => {
  if (newIngredient.value.trim() && props.selectedIngredients.length < 10) {
    const updated = [...props.selectedIngredients, newIngredient.value.trim()]
    emit('update:selectedIngredients', updated)
    newIngredient.value = ''
  }
}

const clearAllIngredients = () => {
  emit('update:selectedIngredients', [])
}

function onDetailsToggle(event: Event) {
  const el = event.target as HTMLDetailsElement
  panelOpen.value = !!el.open
}
</script>