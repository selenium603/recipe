<template>
  <ClickSpark :spark-color="'#ff6b6b'" :spark-size="12" :spark-radius="20" :spark-count="12" :duration="600" easing="ease-out" :extra-scale="1.2">
    <div class="min-h-screen px-2 md:px-6 pt-16 md:pt-20 flex flex-col relative">
      <ShaderBackground />
      <EmojiCursor 
        :emojis="['🍲', '🥘', '🍛', '🍜', '🍕', '🍔', '🍱', '🍣']"
        :spacing="200"
        :maxPoints="8"
        :randomFloat="true"
        :followMouseDirection="false"
        :exitDuration="0.2"
        :removalInterval="15"
      />
      <GlobalNavigation />

      <div class="max-w-7xl mx-auto flex-1 w-full pb-8">
        <div class="text-center mb-2 md:mb-1">
          <div
            class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg border-4 border-white"
          >
            <span class="text-white text-2xl sm:text-3xl">🍽️</span>
          </div>
        </div>

        <ScrollStack 
          :use-window-scroll="true" 
          :item-distance="80"
          :item-stack-distance="50"
          stack-position="20%"
          :base-scale="0.94"
        >
          <ScrollStackItem item-className="bg-gradient-to-br from-orange-100 to-orange-50">
            <div class="bg-orange-400 text-white px-4 py-2.5 md:px-4 md:py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 md:-mx-12 md:-mt-12 mb-4">
              <span class="font-bold text-base md:text-sm">1. 选择食材</span>
            </div>
            <div class="bg-white border-2 border-[#0A0910] rounded-lg p-4 md:p-6">
              <IngredientSelector v-model:selectedIngredients="selectedIngredients" />
              <div class="px-3 py-2 bg-gray-50 border-t border-gray-200 text-sm md:text-xs text-gray-500 flex justify-between items-center mt-4">
                <span class="hidden sm:inline">点击食材快速添加到列表</span>
                <span class="sm:hidden">点击添加</span>
                <span class="font-medium text-base md:text-sm">{{ selectedIngredients.length }}/10</span>
              </div>
            </div>
          </ScrollStackItem>

          <ScrollStackItem item-className="bg-gradient-to-br from-green-100 to-green-50">
            <div class="bg-green-400 text-white px-4 py-2.5 md:px-4 md:py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 md:-mx-12 md:-mt-12 mb-4">
              <span class="font-bold text-base md:text-sm">2. 选择菜系</span>
            </div>
            <div class="bg-white border-2 border-[#0A0910] rounded-lg p-4 md:p-6">
              <CuisineSelector v-model:selectedCuisines="selectedCuisines" />
            </div>
          </ScrollStackItem>

          <ScrollStackItem item-className="bg-gradient-to-br from-blue-100 to-blue-50">
            <div class="bg-blue-400 text-white px-4 py-2.5 md:px-4 md:py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 md:-mx-12 md:-mt-12 mb-4">
              <span class="font-bold text-base md:text-sm">3. 生成推荐</span>
            </div>
            <div class="bg-white border-2 border-[#0A0910] rounded-lg p-4 md:p-6">
              <div v-if="healthySuggestions.length" class="mb-4 bg-blue-50 border border-blue-200 text-blue-800 rounded p-3 text-sm">
                <div class="font-semibold mb-2">更健康的替换建议</div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="s in healthySuggestions"
                    :key="s.from + '->' + s.to"
                    @click="applyHealthySuggestion(s.from, s.to)"
                    class="px-3 py-1 rounded-full bg-white border border-blue-300 hover:bg-blue-100"
                    :title="`将 ${s.from} 替换为 ${s.to}`"
                  >
                    {{ s.from }} → {{ s.to }}
                  </button>
                </div>
              </div>

              <div class="flex justify-center">
                <ElectricBorder
                  color="#7df9ff"
                  :speed="1"
                  :chaos="0.5"
                  :thickness="4"
                  :style="{ borderRadius: '12px' }"
                >
                  <button
                    @click="generateRecommendation"
                    :disabled="!canDraw"
                    class="relative px-8 py-4 md:px-8 md:py-4 font-semibold text-white rounded-xl disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95 text-lg md:text-base"
                    style="background: radial-gradient(60% 100% at 50% 0%, #1f2937 0%, #111827 60%, #0b1220 100%); box-shadow: 0 0 32px rgba(125,249,255,.25) inset, 0 0 12px rgba(125,249,255,.35);"
                  >
                    <span class="relative z-[1] flex items-center gap-2">
                      <template v-if="isGenerating">
                        <span>抽卡中...</span>
                      </template>
                      <template v-else>
                        <span class="text-2xl md:text-xl">🎲</span>
                        <span>开始抽卡</span>
                      </template>
                    </span>
                  </button>
                </ElectricBorder>
              </div>

              <div class="text-sm text-center text-gray-600 mt-4">
                <p>✨ 将从 {{ filteredRecipes.length }} 道菜品中随机推荐</p>
                <p class="text-xs mt-1">选择困难症指数: {{ difficultyIndex }}%</p>
              </div>
            </div>
          </ScrollStackItem>
        </ScrollStack>

        <section v-if="drawnCards.length" class="mb-8 mt-8 animate-fade-in-up relative z-10" ref="resultsSection">
          <div
            class="bg-orange-400 text-white px-4 py-2.5 md:px-4 md:py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block"
          >
            <span class="font-bold text-base md:text-sm">🎉 推荐结果</span>
          </div>
          <div
            class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 md:p-6"
            :style="resultsMinHeight ? { minHeight: resultsMinHeight + 'px' } : undefined"
            ref="resultsContainerRef"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" ref="gridRef">
              <div v-for="card in drawnCards" :key="card.id" v-memo="[card.revealed, card.settled, card.showingPicker]" class="relative" :class="{ 'z-50': card.showingPicker }">
                <div v-if="!card.settled" class="card" :class="{ 'is-flipped': card.revealed }" @click="openRecipe(card.recipe)">
                  <div class="card-face front">
                    <div class="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                      <span class="text-6xl">❓</span>
                    </div>
                  </div>
                  <div class="card-face back">
                    <FoodCard :recipe="card.recipe" @show-picker="onShowPicker" @hide-picker="onHidePicker" />
                  </div>
                </div>
                <div v-else class="rounded-lg cursor-pointer" @click="openRecipe(card.recipe)">
                  <FoodCard :recipe="card.recipe" @show-picker="onShowPicker" @hide-picker="onHidePicker" />
                </div>
              </div>
            </div>

            <div class="text-center mt-8">
              <h3 class="text-xl md:text-2xl font-bold text-dark-800 mb-4 md:mb-2">已抽到 {{ drawnCards.length }} 张</h3>

              <div class="flex flex-wrap justify-center gap-3 md:gap-4 mb-4">
                <div
                  v-for="item in history"
                  :key="item.name + item.cuisine"
                  @click="selectHistory(item)"
                  :title="item.name"
                  class="cursor-pointer text-center active:scale-95 transition-transform"
                >
                  <div class="text-xl md:text-lg mb-1">{{ item.emoji }}</div>
                  <p class="text-sm font-medium text-dark-800 truncate max-w-[80px]">{{ item.name }}</p>
                  <p class="text-xs text-gray-600">{{ item.cuisine }}</p>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap gap-2 md:gap-3 justify-center">
                <button
                  v-if="history.length"
                  @click="clearHistory"
                  class="px-4 py-2.5 md:px-4 md:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors text-base md:text-sm font-medium"
                >
                  清除历史
                </button>
                <button
                  @click="router.push('/search')"
                  class="px-4 py-2.5 md:px-4 md:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors text-base md:text-sm font-medium"
                >
                  🔍 AI智能搜索
                </button>
                <button
                  @click="router.push('/collections')"
                  class="px-4 py-2.5 md:px-4 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors text-base md:text-sm font-medium"
                >
                  管理收藏夹 →
                </button>
              </div>
            </div>
          </div>
        </section>

        <RecipeModal :recipe="modalRecipe" @close="closeModal" />
      </div>

      <GlobalFooter />
    </div>
  </ClickSpark>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipeStore } from '@/stores/useRecipeStore'
import type { Recipe } from '@/types'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import IngredientSelector from '@/components/IngredientSelector.vue'
import CuisineSelector from '@/components/CuisineSelector.vue'
import FoodCard from '@/components/FoodCard.vue'
import ClickSpark from '@/components/ClickSpark.vue'
import ScrollStack from '@/components/ScrollStack.vue'
import ScrollStackItem from '@/components/ScrollStackItem.vue'
import ElectricBorder from '@/components/ElectricBorder.vue'
import EmojiCursor from '@/components/EmojiCursor.vue'
import ShaderBackground from '@/components/ShaderBackground.vue'
import RecipeModal from '@/components/RecipeModal.vue'

const router = useRouter()
const recipeStore = useRecipeStore()

const selectedIngredients = ref<string[]>([])
const selectedCuisines = ref<string[]>([])
const recommendedRecipe = ref<Recipe | null>(null) // 兼容旧逻辑，已不直接使用
const isGenerating = ref(false)
const isFlipping = ref(false)
const drawnCards = ref<Array<{ id: string; recipe: Recipe; revealed: boolean; settled: boolean; showingPicker: boolean }>>([])
const modalRecipe = ref<Recipe | null>(null)
const history = ref<Array<{ name: string; cuisine: string; emoji: string }>>([])
const resultsContainerRef = ref<HTMLDivElement | null>(null)
const gridRef = ref<HTMLDivElement | null>(null)
const resultsMinHeight = ref<number>(0)
const resultsSection = ref<HTMLElement | null>(null)

const filteredRecipes = computed(() => {
  return recipeStore.recipes.filter(recipe => {
    const matchIngredients =
      selectedIngredients.value.length === 0 ||
      selectedIngredients.value.some(ingredient => recipe.ingredients.includes(ingredient))
    const matchCuisines = relaxedCuisineMatch(recipe)
    return matchIngredients && matchCuisines
  })
})

const difficultyIndex = computed(() => {
  // 这里示例随机数，替换成你的计算逻辑
  return Math.floor(Math.random() * 100)
})

const canDraw = computed(() => {
  return !isGenerating.value && selectedIngredients.value.length !== 0 && availableRecipes.value.length > 0
})

const availableRecipes = computed(() => {
  const drawnIds = new Set(drawnCards.value.map(c => c.recipe.id))
  return filteredRecipes.value.filter(r => !drawnIds.has(r.id))
})

async function generateRecommendation() {
  if (filteredRecipes.value.length === 0) return
  if (availableRecipes.value.length === 0) return

  isGenerating.value = true
  // 新卡：先以未翻开的状态加入，随后触发翻转
  const randomIndex = Math.floor(Math.random() * availableRecipes.value.length)
  const recipe = availableRecipes.value[randomIndex]!
  const card = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` , recipe, revealed: false, settled: false, showingPicker: false }
  drawnCards.value.push(card)

  // 等待 DOM 更新后滚动到推荐结果区域的中间位置
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (resultsSection.value) {
    const sectionTop = resultsSection.value.offsetTop
    const sectionHeight = resultsSection.value.offsetHeight
    const windowHeight = window.innerHeight
    // 计算让推荐结果区域居中的滚动位置
    const scrollToPosition = sectionTop - (windowHeight / 2) + (sectionHeight / 2)
    window.scrollTo({ top: scrollToPosition, behavior: 'smooth' })
  }

  // 轻微延迟触发展示翻转动画
  await new Promise(resolve => setTimeout(resolve, 50))
  card.revealed = true
  // 翻转完成后将卡片切换为静态布局以自适应高度
  setTimeout(() => {
    card.settled = true
    nextTickResize()
  }, 650)

  // 记录历史，最多7条，避免重复
  const newHistoryItem = {
    name: recipe.name,
    cuisine: recipe.cuisine,
    emoji: recipe.emoji || '🍽️',
  }
  
  // 检查是否已存在相同的菜谱
  const existingIndex = history.value.findIndex(
    item => item.name === newHistoryItem.name && item.cuisine === newHistoryItem.cuisine
  )
  
  if (existingIndex !== -1) {
    // 如果存在，移除旧的，添加到开头
    history.value.splice(existingIndex, 1)
  }
  
  // 添加到开头
  history.value.unshift(newHistoryItem)
  
  // 截断到7条
  history.value = history.value.slice(0, 7)
  
  // 保存到localStorage
  localStorage.setItem('foodHistory', JSON.stringify(history.value))

  isGenerating.value = false
}

function regenerate() {
  recommendedRecipe.value = null
  generateRecommendation()
}

function addToFavorites() {
  if (recommendedRecipe.value) {
    recipeStore.addToFavorites(recommendedRecipe.value)
    // 你可以加提示或其他业务逻辑
  }
}

function selectHistory(item: { name: string; cuisine: string }) {
  const target = recipeStore.recipes.find(
    r => r.name === item.name && r.cuisine === item.cuisine
  )
  if (target) {
    recommendedRecipe.value = target
  }
}

function clearHistory() {
  // 清空当前页面的历史记录
  history.value = []
  
  // 清除 localStorage 中的历史记录
  localStorage.removeItem('foodHistory')
  
  // 额外检查：确保 localStorage 中确实没有 foodHistory
  if (localStorage.getItem('foodHistory') !== null) {
    localStorage.removeItem('foodHistory')
  }
  
  // 触发自定义事件通知其他页面
  window.dispatchEvent(new CustomEvent('foodHistoryCleared'))
  
  // 强制触发storage事件，确保其他页面能收到更新
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'foodHistory',
    newValue: null,
    oldValue: localStorage.getItem('foodHistory'),
    storageArea: localStorage
  }))
  
  // 确保清除操作完成
  console.log('历史记录已清除，当前历史记录数量:', history.value.length)
}

onMounted(() => {
  const saved = localStorage.getItem('foodHistory')
  if (saved) {
    try {
      history.value = JSON.parse(saved)
    } catch {
      // 忽略 JSON 解析错误
    }
  }
  // 初始计算一次
  nextTickResize()
})

function openRecipe(recipe: Recipe) {
  // 追踪用户点击行为
  recipeStore.trackRecipeClick(recipe)
  modalRecipe.value = recipe
}

function closeModal() {
  modalRecipe.value = null
}

// 让"家常菜"和"小吃"不受菜系筛选限制
function relaxedCuisineMatch(recipe: Recipe) {
  if (recipe.cuisine === '家常菜' || recipe.cuisine === '小吃') return true
  if (selectedCuisines.value.length === 0) return true
  
  // ID到中文名的映射
  const cuisineIdToName: Record<string, string> = {
    'chuan': '川菜',
    'yue': '粤菜',
    'su': '苏菜',
    'lu': '鲁菜',
    'zhe': '浙菜',
    'min': '闽菜',
    'xiang': '湘菜',
    'hui': '徽菜',
    'hu': '沪菜'
  }
  
  // 将选中的ID转换为中文名
  const selectedCuisineNames = selectedCuisines.value.map(id => cuisineIdToName[id]).filter(Boolean)
  return selectedCuisineNames.includes(recipe.cuisine)
}

// 健康替换建议
const healthyMap: Record<string, string> = {
  '五花肉': '鸡胸肉',
  '猪肉': '鸡胸肉',
  '腊肠': '鸡胸肉',
  '香肠': '鸡胸肉',
  '午餐肉': '鸡胸肉',
  '米': '糙米',
  '面包': '全麦面包',
  '面食': '全麦面食',
}

const healthySuggestions = computed(() => {
  const suggestions: Array<{ from: string; to: string }> = []
  selectedIngredients.value.forEach(i => {
    const to = healthyMap[i]
    if (to && !selectedIngredients.value.includes(to)) {
      suggestions.push({ from: i, to })
    }
  })
  return suggestions
})

function applyHealthySuggestion(from: string, to: string) {
  const idx = selectedIngredients.value.indexOf(from)
  if (idx !== -1) {
    const next = [...selectedIngredients.value]
    next.splice(idx, 1, to)
    selectedIngredients.value = next
  }
}

// 卡片置顶逻辑（仅设置z-index，不改变顺序）

function onShowPicker(recipeId: string) {
  const card = drawnCards.value.find(c => c.recipe.id === recipeId)
  if (card) card.showingPicker = true
}

function onHidePicker(recipeId: string) {
  const card = drawnCards.value.find(c => c.recipe.id === recipeId)
  if (card) card.showingPicker = false
}

function nextTickResize() {
  requestAnimationFrame(resizeResultsMinHeight)
}

function resizeResultsMinHeight() {
  const container = resultsContainerRef.value
  const grid = gridRef.value
  if (!container || !grid) return
  // 计算网格真实高度，加上标题等额外空间
  const gridHeight = grid.scrollHeight
  const headerExtra = 120 // 标题与说明区域的保底高度
  const paddingExtra = 24
  const needed = gridHeight + headerExtra + paddingExtra
  resultsMinHeight.value = Math.max(needed, 0)
}
</script>

<style scoped>
/* 电光边框特效 - 采用用户提供的核心CSS（红色） */
.electric-border {
  --electric-light-color: oklch(from var(--electric-border-color) l c h);
  --eb-border-width: 2px;
  position: relative;
  border-radius: 16px;
  overflow: visible;
  isolation: isolate;
}

.eb-stroke {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: var(--eb-border-width) solid var(--electric-border-color);
  pointer-events: none;
  filter: url(#turbulent-displace);
}

.eb-glow-1 {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: var(--eb-border-width) solid oklch(from var(--electric-border-color) l c h / 0.6);
  opacity: 0.5;
  filter: blur(0.75px);
  pointer-events: none;
}

.eb-glow-2 {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: var(--eb-border-width) solid var(--electric-light-color);
  opacity: 0.5;
  filter: blur(3px);
  pointer-events: none;
}

.eb-background-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: -1;
  transform: scale(1.08);
  filter: blur(32px);
  opacity: 0.3;
  background: linear-gradient(-30deg, var(--electric-light-color), transparent, var(--electric-border-color));
  pointer-events: none;
}
.card {
  position: relative;
  width: 100%;
  height: 12rem;
  perspective: 1000px;
}

.card-face {
  position: absolute;
  inset: 0;
  border-radius: 0.5rem;
  backface-visibility: hidden;
  transition: transform 0.7s cubic-bezier(.2,.7,.2,1);
}

.card .back {
  background-color: white;
  transform: rotateY(180deg);
}

.card.is-flipped .front {
  transform: rotateY(180deg);
}

.card.is-flipped .back {
  transform: rotateY(0deg);
}

/* 让推荐块内容在多排卡片时留出更多空间，避免遮挡标题 */
.grid + .text-center { margin-top: 1.5rem; }
</style>