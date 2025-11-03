<template>
  <ClickSpark :spark-color="'#ff6b6b'" :spark-size="12" :spark-radius="20" :spark-count="12" :duration="600" easing="ease-out" :extra-scale="1.2">
    <div class="min-h-screen px-2 md:px-6 pt-16 md:pt-20 pb-36 flex flex-col relative">
      <ShaderBackground />
      <EmojiCursor 
        :emojis="['🤖', '👨‍🍳', '🍳', '🥗', '🍜', '🎯', '✨', '💡']"
        :spacing="200"
        :maxPoints="8"
        :randomFloat="true"
        :followMouseDirection="false"
        :exitDuration="0.2"
        :removalInterval="15"
      />
      <GlobalNavigation />

      <div class="max-w-7xl mx-auto w-full">
        <div class="text-center mb-2 md:mb-1">
          <div
            class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg border-4 border-white"
          >
            <span class="text-white text-2xl sm:text-3xl">🤖</span>
          </div>
        </div>

        <div class="px-2 md:px-4 relative">
          <div class="max-w-5xl mx-auto">
            <div v-if="messages.length > 0" class="space-y-3 pb-4">
              <div
                v-for="(msg, index) in messages"
                :key="msg.id"
                class="animate-fade-in"
              >
                <div v-if="msg.role === 'user'" class="flex justify-end" style="position: relative; z-index: 1;">
                    <div class="max-w-[75%] bg-orange-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow">
                      <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ msg.content }}</p>
                      <span class="text-xs opacity-75 mt-1 block">{{ msg.time }}</span>
                    </div>
                  </div>

                <div v-else class="flex gap-2 relative" style="z-index: 1;">
                  <div class="w-12 flex-shrink-0 flex justify-center">
                    <div class="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center shadow">
                      <span class="text-white text-sm">🤖</span>
                    </div>
                  </div>
                  
                  <div class="flex-1 max-w-[85%]">
                    <div v-if="msg.type === 'text'" class="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow border border-gray-200">
                      <div v-if="index === messages.length - 1 && isLoading && !msg.content" class="flex gap-1">
                        <div class="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                        <div class="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        <div class="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                      </div>
                      <div v-else>
                        <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {{ msg.content }}
                          <span v-if="index === messages.length - 1 && isLoading && msg.content" class="typing-cursor">|</span>
                        </p>
                        <span class="text-xs text-gray-400 mt-1 block">{{ msg.time }}</span>
                      </div>
                    </div>

                    <div v-else-if="msg.type === 'recipes'" class="space-y-3">
                      <div class="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow border border-gray-200">
                        <p class="text-sm text-gray-800 leading-relaxed">{{ msg.content }}</p>
                        <span class="text-xs text-gray-400 mt-1 block">{{ msg.time }}</span>
                      </div>
                      
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                        <div
                          v-for="recipe in msg.recipes"
                          :key="recipe.id"
                          class="cursor-pointer relative card-hover-wrapper"
                          @click="openRecipe(recipe)"
                        >
                          <FoodCard :recipe="recipe" />
                          <div v-if="recipe.aiReason" class="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800">
                            <div class="font-medium mb-1">💡 {{ recipe.aiReason }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="fixed bottom-0 left-0 right-0 py-3 px-2 md:px-6" style="background: transparent; z-index: 300;">
        <div class="max-w-5xl mx-auto">
          <div v-if="messages.length === 0" class="mb-3">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="q in quickQuestions"
                :key="q"
                @click="sendMessage(q)"
                class="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 active:bg-orange-200 transition-colors text-xs border border-orange-200 whitespace-nowrap"
              >
                {{ q }}
              </button>
            </div>
          </div>

          <div class="flex gap-2 relative" style="align-items: center;">
            <div class="flex-shrink-0">
              <button
                v-if="messages.length > 0"
                @click="clearHistory"
                class="w-12 h-12 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center"
                title="清空历史"
              >
                <span class="text-xl">🗑️</span>
              </button>
            </div>
            
            <div class="flex-1 relative" style="display: flex; align-items: center;">
              <textarea
                ref="inputRef"
                v-model="userInput"
                @keydown.enter.exact.prevent="sendMessage()"
                @input="autoResize"
                :disabled="isLoading"
                placeholder="输入你的问题..."
                rows="1"
                class="w-full px-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm disabled:bg-gray-100 bg-white shadow-sm hide-scrollbar"
                style="resize: none; overflow: hidden; height: 48px; max-height: 120px; line-height: 20px; padding-top: 12px; padding-bottom: 12px; box-sizing: border-box;"
              ></textarea>
            </div>
            <button
              @click="sendMessage()"
              :disabled="!userInput.trim() || isLoading"
              class="w-12 h-12 bg-orange-500 text-white rounded-full hover:bg-orange-600 active:bg-orange-700 disabled:bg-gray-300 transition-colors flex items-center justify-center flex-shrink-0 shadow-lg"
              title="发送 (Enter)"
            >
              <span class="text-xl">{{ isLoading ? '⏳' : '↑' }}</span>
            </button>
          </div>
        </div>
      </div>

      <RecipeModal :recipe="modalRecipe" @close="closeModal" />
    </div>
  </ClickSpark>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import { useRecipeStore } from '@/stores/useRecipeStore'
import type { Recipe } from '@/types'
import { LRUCache } from '@/utils/lruCache'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import FoodCard from '@/components/FoodCard.vue'
import ClickSpark from '@/components/ClickSpark.vue'
import ShaderBackground from '@/components/ShaderBackground.vue'
import EmojiCursor from '@/components/EmojiCursor.vue'
import RecipeModal from '@/components/RecipeModal.vue'

const recipeStore = useRecipeStore()

interface Message {
  id: string
  role: 'user' | 'assistant'
  type: 'text' | 'recipes'
  content: string
  time: string
  order: number
  recipes?: Recipe[]
}

const chatHistoryCache = new LRUCache<Message>(50, 'aiChatHistoryLRU')

const userInput = ref('')
const messages = ref<Message[]>([])
const isLoading = ref(false)
const modalRecipe = ref<Recipe | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)

let messageIdCounter = 0
const generateMessageId = () => {
  return `msg_${Date.now()}_${messageIdCounter++}`
}

const quickQuestions = [
  '推荐适合晚餐的家常菜',
  '低脂高蛋白的快手菜',
  '给我一些健康饮食建议',
  '早餐吃什么更有营养'
]

const getTimeString = () => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const scrollToBottom = async () => {
  await nextTick()
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  })
}

const autoResize = () => {
  if (inputRef.value) {
    inputRef.value.style.height = '48px'
    const newHeight = Math.max(48, Math.min(inputRef.value.scrollHeight, 120))
    inputRef.value.style.height = newHeight + 'px'
  }
}

const RECIPE_KEYWORDS = [
  '推荐', '菜', '食谱', '菜谱', '做', '吃', '烹饪', '美食', '料理', '餐',
  '早餐', '午餐', '晚餐', '宵夜', '快手', '家常', '川菜', '粤菜', '湘菜',
  '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜', '东北菜', '西北菜', '辣', '甜',
  '酸', '咸', '鲜', '简单', '困难', '食材', '番茄', '鸡蛋', '肉', '鱼', '虾'
]

const CHAT_KEYWORDS = [
  '健康', '营养', '建议', '怎么办', '如何', '为什么', '什么是', '介绍',
  '减肥', '增肌', '养生', '禁忌', '搭配', '功效', '好处', '坏处', '注意',
  '适合', '不适合', '人群', '疾病', '过敏'
]

const detectIntent = (query: string): 'recipe' | 'chat' => {
  const lowerQuery = query.toLowerCase()
  
  let recipeScore = 0
  let chatScore = 0
  
  for (const keyword of RECIPE_KEYWORDS) {
    if (lowerQuery.includes(keyword)) recipeScore++
  }
  
  for (const keyword of CHAT_KEYWORDS) {
    if (lowerQuery.includes(keyword)) chatScore++
  }
  
  return chatScore > recipeScore ? 'chat' : 'recipe'
}

const sendMessage = async (question?: string) => {
  const query = question || userInput.value.trim()
  if (!query || isLoading.value) return

  messages.value.push({
    id: generateMessageId(),
    role: 'user',
    type: 'text',
    content: query,
    time: getTimeString(),
    order: messages.value.length
  })

  userInput.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = '48px'
  }

  recipeStore.trackSearchKeyword(query)
  scrollToBottom()

  isLoading.value = true

  try {
    const intent = detectIntent(query)
    
    if (intent === 'recipe') {
      const results = await recipeStore.getAIRecommendations(query)
      
      if (results.length > 0) {
        messages.value.push({
          id: generateMessageId(),
          role: 'assistant',
          type: 'recipes',
          content: `根据您的需求，为您推荐以下 ${results.length} 道菜品：`,
          time: getTimeString(),
          order: messages.value.length,
          recipes: results
        })
      } else {
        messages.value.push({
          id: generateMessageId(),
          role: 'assistant',
          type: 'text',
          content: '抱歉，暂时没有找到符合条件的菜谱。试试换个关键词，或者先去主页逛逛积累口味数据吧！',
          time: getTimeString(),
          order: messages.value.length
        })
      }
    } else {
      const messageIndex = messages.value.length
      
      messages.value.push({
        id: generateMessageId(),
        role: 'assistant',
        type: 'text',
        content: '',
        time: getTimeString(),
        order: messages.value.length
      })
      
      let scrollThrottle = 0
      await recipeStore.getAIChatResponseStream(query, (chunk: string) => {
        if (messages.value[messageIndex]) {
          messages.value[messageIndex].content += chunk
          
          const now = Date.now()
          if (now - scrollThrottle > 50) {
            scrollThrottle = now
            nextTick(() => scrollToBottom())
          }
        }
      })
      
      nextTick(() => scrollToBottom())
    }
  } catch (error) {
    console.error('处理失败:', error)
    messages.value.push({
      id: generateMessageId(),
      role: 'assistant',
      type: 'text',
      content: '抱歉，出现了一些问题。请稍后再试。',
      time: getTimeString(),
      order: messages.value.length
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const openRecipe = (recipe: Recipe) => {
  recipeStore.trackRecipeClick(recipe)
  modalRecipe.value = recipe
}

const closeModal = () => {
  modalRecipe.value = null
}

const clearHistory = () => {
  if (confirm('确定要清空所有聊天记录吗？')) {
    messages.value = []
    chatHistoryCache.clear()
    localStorage.removeItem('aiChatHistory')
    userInput.value = ''
    if (inputRef.value) {
      inputRef.value.style.height = '48px'
    }
    console.log('✅ 聊天历史已清空')
  }
}

onMounted(() => {
  recipeStore.loadUserProfile()
  
  const cachedMessages = chatHistoryCache.getAll()
  if (cachedMessages.length > 0) {
    messages.value = cachedMessages
      .map((msg, index) => ({
        ...msg,
        id: msg.id || `msg_loaded_${Date.now()}_${index}`,
        order: msg.order !== undefined ? msg.order : index
      }))
      .sort((a, b) => a.order - b.order)
    scrollToBottom()
  } else {
    const savedMessages = localStorage.getItem('aiChatHistory')
    if (savedMessages) {
      try {
        const oldMessages = JSON.parse(savedMessages)
        messages.value = oldMessages.map((msg: any, index: number) => ({
          ...msg,
          id: msg.id || `msg_old_${Date.now()}_${index}`,
          order: msg.order !== undefined ? msg.order : index
        }))
        messages.value.forEach((msg: Message) => {
          chatHistoryCache.set(msg.id, msg)
        })
        localStorage.removeItem('aiChatHistory')
        scrollToBottom()
      } catch (e) {
        console.error('Failed to load chat history:', e)
      }
    }
  }
  
  if (import.meta.env.DEV) {
    console.log('💾 LRU Chat Cache Stats:', chatHistoryCache.getStats())
  }
})

const saveChatHistory = () => {
  try {
    chatHistoryCache.clear()
    
    messages.value.forEach((msg) => {
      if (msg.id) {
        chatHistoryCache.set(msg.id, msg)
      }
    })
    
    if (import.meta.env.DEV) {
      console.log('💾 Chat history saved to LRU cache:', chatHistoryCache.getStats())
    }
  } catch (e) {
    console.error('Failed to save chat history:', e)
  }
}

let saveTimer: number | null = null
watch(messages, () => {
  if (isLoading.value) return
  
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveChatHistory()
  }, 500)
}, { deep: true })

watch(isLoading, (newValue, oldValue) => {
  if (oldValue && !newValue) {
    saveChatHistory()
  }
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #ff6b35;
  font-weight: bold;
  margin-left: 2px;
}

textarea {
  line-height: 1.5;
  resize: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  appearance: none !important;
}

textarea::-webkit-resizer {
  display: none !important;
}

textarea::-webkit-scrollbar-corner {
  display: none !important;
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.hide-scrollbar::-webkit-scrollbar-track {
  display: none !important;
}

.hide-scrollbar::-webkit-scrollbar-thumb {
  display: none !important;
}

.card-hover-wrapper {
  transition: transform 0.2s ease-out, z-index 0s;
  position: relative;
  z-index: 10;
}

.card-hover-wrapper:hover {
  transform: scale(1.05);
  z-index: 100;
}
</style>

