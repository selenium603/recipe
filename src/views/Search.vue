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
        <div class="text-center mb-4 md:mb-6">
          <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg border-4 border-white">
            <span class="text-white text-2xl sm:text-3xl">🔍</span>
          </div>
        </div>

        <div class="bg-white border-2 border-[#0A0910] rounded-lg p-4 md:p-6 mb-6 md:mb-8">
          <div class="flex gap-2 mb-4">
            <input
              v-model="searchQuery"
              @keyup.enter="performSearch"
              placeholder="输入菜名、食材或口味..."
              class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-base md:text-lg"
            />
            <button
              @click="performSearch"
              :disabled="!searchQuery.trim() || isSearching"
              class="px-5 py-3 md:px-8 md:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 disabled:bg-gray-300 transition-colors font-medium text-base md:text-base whitespace-nowrap"
            >
              {{ isSearching ? '搜索中...' : '搜索' }}
            </button>
          </div>
          
          <div v-if="searchSuggestions.length > 0 && !hasSearched" class="mb-4">
            <div class="text-sm md:text-sm text-gray-600 mb-2">热门搜索：</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="suggestion in searchSuggestions"
                :key="suggestion"
                @click="selectSuggestion(suggestion)"
                class="px-3 py-1.5 md:px-3 md:py-1 bg-gray-100 text-gray-700 rounded-full text-base md:text-sm hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="searchResults.length > 0" class="mb-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
            <h2 class="text-xl md:text-2xl font-bold text-dark-800">搜索结果 ({{ searchResults.length }} 道菜)</h2>
            <button
              @click="clearSearch"
              class="px-4 py-2.5 md:px-4 md:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-colors text-base md:text-sm font-medium"
            >
              清除结果
            </button>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <div
              v-for="recipe in searchResults"
              :key="recipe.id"
              @click="openRecipe(recipe)"
              class="cursor-pointer card-hover-wrapper"
            >
              <FoodCard :recipe="recipe" />
            </div>
          </div>
        </div>
        
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
        
        <div v-if="isSearching">
          <div class="text-center mb-6">
            <div class="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-orange-200 shadow-sm">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
              <span class="text-gray-700 font-medium">AI正在为你搜索美食...</span>
            </div>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <SkeletonCard v-for="i in 4" :key="i" />
          </div>
        </div>

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

    <RecipeModal :recipe="modalRecipe" @close="closeModal" />
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
import RecipeModal from '@/components/RecipeModal.vue'

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
  
  // 记录搜索关键词
  recipeStore.trackSearchKeyword(searchQuery.value.trim())
  
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
  // 追踪用户点击行为
  recipeStore.trackRecipeClick(recipe)
  modalRecipe.value = recipe
}

const closeModal = () => {
  modalRecipe.value = null
}

// 初始化（目前无需特殊初始化逻辑）
</script>

<style scoped>
/* 卡片悬停缩放动画 */
.card-hover-wrapper {
  transition: transform 0.2s ease-out, z-index 0s;
  position: relative;
  z-index: 10;
}

.card-hover-wrapper:hover {
  transform: scale(1.05);
  z-index: 100; /* 悬停时提升层级 */
}
</style>
