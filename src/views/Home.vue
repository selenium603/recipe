<template>
  <ClickSpark :spark-color="'#ff6b6b'" :spark-size="12" :spark-radius="20" :spark-count="12" :duration="600" easing="ease-out" :extra-scale="1.2">
    <div class="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 px-2 md-4 py-6">
      <GlobalNavigation />

    <div class="max-w-7xl mx-auto">
      <!-- 主标题区域 -->
      <div class="text-center mb-8">
        <div
          class="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-white"
        >
          <span class="text-white text-3xl">🍽️</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold text-dark-800 mb-2">今天吃什么？</h1>
        <p class="text-gray-600 max-w-md mx-auto">让美食抽卡帮你终结选择困难症！</p>
      </div>

      <!-- 步骤1: 选择食材 -->
      <section class="mb-6">
        <div
          class="bg-orange-400 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block"
        >
          <span class="font-bold">1. 选择食材</span>
        </div>
        <div
          class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 md:p-6"
        >
          <IngredientSelector v-model:selectedIngredients="selectedIngredients" />
          <div
            class="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center mt-4"
          >
            <span>点击食材快速添加到列表</span>
            <span class="font-medium">已选择 {{ selectedIngredients.length }}/10</span>
          </div>
        </div>
      </section>

      <!-- 步骤2: 选择菜系 -->
      <section class="mb-6">
        <div
          class="bg-green-400 text-white px-4 py-2 rounded-t-lg border-2 border-[#00910] border-b-0 inline-block"
        >
          <span class="font-bold">2. 选择菜系</span>
        </div>
        <div
          class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 md:p-6"
        >
          <CuisineSelector v-model:selectedCuisines="selectedCuisines" />
        </div>
      </section>

      <!-- 步骤3: 生成推荐 -->
      <section class="mb-6">
        <div
          class="bg-blue-400 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block"
        >
          <span class="font-bold">3. 生成推荐</span>
        </div>
        <div
          class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 md:p-6"
        >
          <!-- 健康替换建议 -->
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
            <button
              @click="generateRecommendation"
              :disabled="!canDraw"
              class="relative electric-border px-7 py-3 font-semibold text-white rounded-lg disabled:opacity-50"
              style="--electric-border-color:#22d3ee; background: radial-gradient(60% 100% at 50% 0%, #1f2937 0%, #111827 60%, #0b1220 100%); box-shadow: 0 0 32px rgba(34,211,238,.25) inset, 0 0 12px rgba(34,211,238,.35);"
            >
              <span class="relative z-[1] flex items-center gap-2">
                <template v-if="isGenerating">
                  <span>抽卡中...</span>
                </template>
                <template v-else>
                  <span class="text-xl">🎲</span>
                  <span>开始抽卡</span>
                </template>
              </span>
              <span class="eb-stroke"></span>
              <span class="eb-glow-1"></span>
              <span class="eb-glow-2"></span>
              <span class="eb-background-glow"></span>
            </button>
          </div>

          <div class="text-sm text-center text-gray-600 mt-4">
            <p>✨ 将从 {{ filteredRecipes.length }} 道菜品中随机推荐</p>
            <p class="text-xs mt-1">选择困难症指数: {{ difficultyIndex }}%</p>
          </div>
        </div>
      </section>

      <!-- 推荐结果展示 -->
      <section v-if="drawnCards.length" class="mb-8 animate-fade-in-up">
        <div
          class="bg-orange-400 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block"
        >
          <span class="font-bold">🎉 推荐结果</span>
        </div>
        <div
          class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 md:p-6"
          :style="resultsMinHeight ? { minHeight: resultsMinHeight + 'px' } : undefined"
          ref="resultsContainerRef"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" ref="gridRef">
            <div v-for="card in drawnCards" :key="card.id" class="relative" :class="{ 'z-50': card.showingPicker }">
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
            <h3 class="text-2xl font-bold text-dark-800 mb-2">已抽到 {{ drawnCards.length }} 张</h3>

            <div class="flex justify-center gap-4">
            <div
              v-for="item in history"
              :key="item.name + item.cuisine"
              @click="selectHistory(item)"
              :title="item.name"
              class="cursor-pointer text-center"
            >
                <div class="text-lg mb-1">{{ item.emoji }}</div>
                <p class="text-sm font-medium text-dark-800 truncate">{{ item.name }}</p>
                <p class="text-xs text-gray-600">{{ item.cuisine }}</p>
              </div>
            </div>

            <div class="mt-4 flex gap-3 justify-center">
              <button
                v-if="history.length"
                @click="clearHistory"
                class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                清除历史
              </button>
              <button
                @click="router.push('/search')"
                class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                🔍 AI智能搜索
              </button>
              <button
                @click="router.push('/collections')"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                管理收藏夹 →
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 详情弹窗 -->
      <div v-if="modalRecipe" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeModal">
        <div class="bg-white max-w-2xl w-[92vw] rounded-lg border-2 border-[#0A0910] overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b">
            <h3 class="text-lg font-bold">{{ modalRecipe.name }} · 做法</h3>
            <button class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" @click="closeModal">关闭</button>
          </div>
          <div class="p-4 max-h-[70vh] overflow-auto">
            <div class="mb-3 text-sm text-gray-600">⏱️ 用时：{{ formatTime(modalRecipe.cookingTime) }} · 菜系：{{ modalRecipe.cuisine }}</div>
            <div class="mb-4">
              <div class="font-semibold mb-2">食材</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="ing in modalRecipe.ingredients" :key="ing" class="px-2 py-1 rounded bg-gray-100 text-sm border">{{ ing }}</span>
              </div>
            </div>
            <div>
              <div class="font-semibold mb-2">步骤</div>
              <ol class="list-decimal ml-5 space-y-2">
                <li v-for="s in modalRecipe.steps" :key="s.step" class="text-sm leading-relaxed flex items-center justify-between">
                  <span>{{ s.description }}</span>
                  <button v-if="s.time" @click="startTimer(s.time, s.description)" class="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    ⏱️ {{ s.time }}分钟
                  </button>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
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

  // 轻微延迟触发展示翻转动画
  await new Promise(resolve => setTimeout(resolve, 50))
  card.revealed = true
  // 翻转完成后将卡片切换为静态布局以自适应高度
  setTimeout(() => {
    card.settled = true
    nextTickResize()
  }, 650)

  // 记录历史，最多7条
  history.value.unshift({
    name: recipe.name,
    cuisine: recipe.cuisine,
    emoji: recipe.emoji || '🍽️',
  })
  // 立即截断到7条
  history.value = history.value.slice(0, 7)
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
  modalRecipe.value = recipe
}

function closeModal() {
  modalRecipe.value = null
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

// 让"家常菜"和"小吃"不受菜系筛选限制
function relaxedCuisineMatch(recipe: Recipe) {
  if (recipe.cuisine === '家常菜' || recipe.cuisine === '小吃') return true
  return selectedCuisines.value.length === 0 || selectedCuisines.value.includes(recipe.cuisine)
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

// 烹饪计时器
function startTimer(minutes: number, description: string) {
  const seconds = minutes * 60
  let remaining = seconds
  
  const timer = setInterval(() => {
    remaining--
    if (remaining <= 0) {
      clearInterval(timer)
      alert(`⏰ 时间到！${description}`)
    }
  }, 1000)
  
  // 显示倒计时提示
  const minutesLeft = Math.ceil(remaining / 60)
  alert(`⏱️ 开始计时：${description}\n剩余时间：${minutesLeft}分钟`)
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