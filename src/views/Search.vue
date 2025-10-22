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
        <!-- Logo 区域 -->
        <div class="text-center mb-6">
          <div class="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg border-4 border-white">
            <span class="text-white text-3xl">🔍</span>
          </div>
        </div>

        <!-- 搜索区域 -->
        <div class="bg-white border-2 border-[#0A0910] rounded-lg p-6 mb-8">
          <div class="flex gap-2 mb-4">
            <input
              v-model="searchQuery"
              @keyup.enter="performSearch"
              placeholder="输入菜名、食材或口味，如：麻辣、简单、下饭..."
              class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg"
            />
            <button
              @click="performSearch"
              :disabled="!searchQuery.trim() || isSearching"
              class="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors font-medium"
            >
              {{ isSearching ? '搜索中...' : '搜索' }}
            </button>
          </div>
          
          <!-- 搜索建议 -->
          <div v-if="searchSuggestions.length > 0 && !hasSearched" class="mb-4">
            <div class="text-sm text-gray-600 mb-2">热门搜索：</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="suggestion in searchSuggestions"
                :key="suggestion"
                @click="selectSuggestion(suggestion)"
                class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-dark-800">搜索结果 ({{ searchResults.length }} 道菜)</h2>
            <button
              @click="clearSearch"
              class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              清除结果
            </button>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div
              v-for="recipe in searchResults"
              :key="recipe.id"
              @click="openRecipe(recipe)"
              class="cursor-pointer transform hover:scale-105 transition-transform duration-200"
            >
              <FoodCard :recipe="recipe" @show-picker="onShowPicker" @hide-picker="onHidePicker" />
            </div>
          </div>
        </div>
        
        <!-- 无结果提示 -->
        <div v-else-if="hasSearched && !isSearching" class="text-center py-16">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">没有找到相关菜谱</h3>
          <p class="text-gray-500 mb-6">试试其他关键词吧！</p>
          <div class="text-sm">
            <p class="text-gray-600 mb-3">建议尝试：</p>
            <div class="flex flex-wrap gap-2 justify-center">
              <span class="px-3 py-1 bg-gray-100 rounded-full text-xs">简单</span>
              <span class="px-3 py-1 bg-gray-100 rounded-full text-xs">下饭</span>
              <span class="px-3 py-1 bg-gray-100 rounded-full text-xs">家常菜</span>
              <span class="px-3 py-1 bg-gray-100 rounded-full text-xs">川菜</span>
              <span class="px-3 py-1 bg-gray-100 rounded-full text-xs">快手菜</span>
              <span class="px-3 py-1 bg-gray-100 rounded-full text-xs">汤类</span>
            </div>
          </div>
        </div>
        
        <!-- 加载状态 - 骨架屏 -->
        <div v-if="isSearching">
          <div class="text-center mb-6">
            <div class="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-orange-200 shadow-sm">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
              <span class="text-gray-700 font-medium">AI正在为你搜索美食...</span>
            </div>
          </div>
          
          <!-- 骨架屏卡片 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <SkeletonCard v-for="i in 4" :key="i" />
          </div>
        </div>

        <!-- 默认状态 -->
        <div v-if="!hasSearched && !isSearching" class="text-center py-16">
          <div class="text-6xl mb-2">🍽️</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">开始你的美食探索之旅</h3>
          <p class="text-gray-500 mb-6">输入关键词，发现更多美味菜谱</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div class="bg-white p-4 rounded-lg border-2 border-gray-200">
              <div class="text-2xl mb-2">🌶️</div>
              <div class="text-sm font-medium">口味搜索</div>
            </div>
            <div class="bg-white p-4 rounded-lg border-2 border-gray-200">
              <div class="text-2xl mb-2">⏱️</div>
              <div class="text-sm font-medium">时间搜索</div>
            </div>
            <div class="bg-white p-4 rounded-lg border-2 border-gray-200">
              <div class="text-2xl mb-2">🥬</div>
              <div class="text-sm font-medium">食材搜索</div>
            </div>
            <div class="bg-white p-4 rounded-lg border-2 border-gray-200">
              <div class="text-2xl mb-2">🏮</div>
              <div class="text-sm font-medium">菜系搜索</div>
            </div>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </div>

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
  </ClickSpark>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRecipeStore } from '@/stores/useRecipeStore'
import type { Recipe } from '@/types'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import FoodCard from '@/components/FoodCard.vue'
import ClickSpark from '@/components/ClickSpark.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import ShaderBackground from '@/components/ShaderBackground.vue'
import EmojiCursor from '@/components/EmojiCursor.vue'

const recipeStore = useRecipeStore()
const searchQuery = ref('')
const searchResults = ref<Recipe[]>([])
const isSearching = ref(false)
const hasSearched = ref(false)
const modalRecipe = ref<Recipe | null>(null)

// 搜索建议
const searchSuggestions = ref([
  '简单易做', '下饭菜', '川菜', '家常菜', '快手菜', 
  '麻辣', '酸甜', '清淡', '汤类', '面食', '电饭煲', '15分钟'
])

// 移除自动搜索功能，只在按Enter或点击按钮时搜索

const selectSuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
  performSearch()
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  // 清空之前的搜索结果
  searchResults.value = []
  
  isSearching.value = true
  hasSearched.value = true
  
  // 记录开始时间
  const startTime = Date.now()
  
  try {
    // 调用AI搜索（失败时会自动降级到本地搜索）
    const results = await recipeStore.searchRecipes(searchQuery.value)
    
    // 确保至少显示2秒加载动画
    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, 2000 - elapsed)
    
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    }
    
    searchResults.value = results
    
    if (results.length === 0) {
      console.warn('⚠️ 未返回任何结果')
    } else {
      console.log(`✅ 成功返回 ${results.length} 个菜谱`)
    }
  } catch (error) {
    console.error('❌ 搜索出错:', error)
    
    // 确保至少显示2秒加载动画
    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, 2000 - elapsed)
    
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    }
    
    // 使用本地搜索作为后备
    searchResults.value = localSearch(searchQuery.value)
  } finally {
    isSearching.value = false
  }
}

// 本地搜索降级方案
const localSearch = (query: string): Recipe[] => {
  const keywords = query.toLowerCase().split(' ')
  return recipeStore.recipes.filter(recipe => {
    const searchText = [
      recipe.name,
      recipe.cuisine,
      recipe.flavor,
      recipe.description,
      recipe.difficulty,
      ...recipe.ingredients
    ].join(' ').toLowerCase()
    
    return keywords.some(keyword => searchText.includes(keyword))
  })
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
}

const openRecipe = (recipe: Recipe) => {
  modalRecipe.value = recipe
}

const closeModal = () => {
  modalRecipe.value = null
}

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
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

// 卡片置顶逻辑
function onShowPicker(recipeId: string) {
  // 这里可以添加置顶逻辑
}

function onHidePicker(recipeId: string) {
  // 这里可以添加取消置顶逻辑
}

// 初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
})
</script>

<style scoped>
/* 可以添加页面特定的样式 */
</style>
