<template>
  <ClickSpark :spark-color="'#ff6b6b'" :spark-size="12" :spark-radius="20" :spark-count="12" :duration="600" easing="ease-out" :extra-scale="1.2">
    <div class="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 px-2 md:px-6 pt-20 md:pt-24">
      <GlobalNavigation />

      <div class="max-w-7xl mx-auto">
        <!-- 页面标题 -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-white">
            <span class="text-white text-3xl">📁</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold text-dark-800 mb-2">收藏夹</h1>
          <p class="text-gray-600 max-w-md mx-auto">管理你的美食收藏，创建专属菜谱集合</p>
        </div>

        <!-- 操作行 -->
        <div class="bg-white border-2 border-[#0A0910] rounded-lg p-6 mb-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div class="flex items-center gap-2">
              <input v-model="newCollectionName" placeholder="新建收藏夹名称，如 家宴/便当"
                     class="px-3 py-2 border rounded w-72" @keyup.enter="createCollection" />
              <button @click="createCollection" class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">新建收藏夹</button>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">筛选标签：</span>
              <button
                v-for="t in tagOptions"
                :key="t"
                @click="selectedTag = t"
                :class="['px-3 py-1 rounded-full text-sm', selectedTag===t? 'bg-orange-500 text-white' : 'bg-gray-100']"
              >{{ t }}</button>
            </div>
          </div>
        </div>

        <!-- 收藏夹列表 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="col in collections" :key="col.id" class="bg-white border-2 border-[#0A0910] rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <input v-model="col.name" class="font-semibold flex-1 mr-2 border-b focus:outline-none" />
              <div class="flex items-center gap-2">
                <button 
                  :class="['text-xs px-2 py-1 rounded border', activeCandidateId === col.id ? 'bg-orange-500 text-white' : 'bg-gray-100']" 
                  @click="toggleCandidate(col.id)"
                >
                  {{ activeCandidateId === col.id ? '取消候选集' : '设为抽卡候选集' }}
                </button>
                <button class="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600" @click="removeCollection(col.id)">删除</button>
              </div>
            </div>
            <div class="text-xs text-gray-500 mb-2">
              {{ col.items.length }} 道菜
              <span v-if="activeCandidateId===col.id" class="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700">当前候选集</span>
            </div>
            <div class="space-y-2 max-h-64 overflow-auto">
              <div
                v-for="r in visibleItems(col.items)"
                :key="r.id"
                class="flex items-center justify-between border rounded px-2 py-1 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div class="flex items-center gap-2 flex-1" @click="openRecipe(r)">
                  <span>{{ r.emoji }}</span>
                  <span class="text-sm">{{ r.name }}</span>
                  <span class="text-xs text-gray-500">· {{ r.cuisine }}</span>
                </div>
                <button class="text-xs text-red-500 hover:text-red-700" @click.stop="removeFromCollection(col.id, r.id)">移除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 历史快捷加入 -->
        <div class="mt-8 bg-white border-2 border-[#0A0910] rounded-lg p-6">
          <h3 class="font-semibold mb-2">从历史快速加入</h3>
          <div class="flex flex-wrap gap-2">
            <div v-for="h in history" :key="h.name + h.cuisine" class="relative">
              <button @click="openChooser(h)" class="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                {{ h.emoji }} {{ h.name }}
              </button>
              <div v-if="chooserOpenFor === keyOf(h)" class="absolute z-50 mt-1 bg-white border-2 border-[#0A0910] rounded-lg shadow-xl p-2">
                <div class="text-xs text-gray-500 px-1 mb-1">选择收藏夹</div>
                <button v-for="c in collections" :key="c.id" class="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm" @click.stop="addHistoryToSpecific(h, c.id)">{{ c.name }}</button>
              </div>
            </div>
          </div>
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
      </div>

      <GlobalFooter />
    </div>
  </ClickSpark>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Recipe } from '@/types'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import ClickSpark from '@/components/ClickSpark.vue'

interface Collection { id: string; name: string; items: Recipe[] }

const router = useRouter()
const newCollectionName = ref('')
const collections = ref<Collection[]>([])
const history = ref<Array<{ name: string; cuisine: string; emoji: string }>>([])
const chooserOpenFor = ref<string | null>(null)
const activeCandidateId = ref<string | null>(null)
const selectedTag = ref<string>('全部')
const modalRecipe = ref<Recipe | null>(null)

const tagOptions = computed(() => {
  const set = new Set<string>(['全部'])
  collections.value.forEach(c => c.items.forEach(i => set.add(i.cuisine)))
  return Array.from(set)
})

function visibleItems(items: Recipe[]) {
  if (selectedTag.value === '全部') return items
  return items.filter(i => i.cuisine === selectedTag.value)
}

function load() {
  try {
    const saved = localStorage.getItem('recipeCollections')
    collections.value = saved ? JSON.parse(saved) : [{ id: crypto.randomUUID(), name: '默认收藏夹', items: [] }]
  } catch {
    collections.value = [{ id: crypto.randomUUID(), name: '默认收藏夹', items: [] }]
  }
  activeCandidateId.value = localStorage.getItem('activeCandidateCollectionId')
  loadHistory()
}

function loadHistory() {
  const h = localStorage.getItem('foodHistory')
  if (h && h.trim() !== '') {
    try { 
      const parsed = JSON.parse(h)
      // 确保解析出来的是数组，并且限制数量
      if (Array.isArray(parsed)) {
        history.value = parsed.slice(0, 7) // 确保不超过7条
      } else {
        history.value = []
      }
    } catch (error) {
      console.warn('解析历史记录失败:', error)
      history.value = []
    }
  } else {
    history.value = []
  }
  console.log('历史记录已加载，数量:', history.value.length)
}

function persist() {
  localStorage.setItem('recipeCollections', JSON.stringify(collections.value))
}

function createCollection() {
  const name = newCollectionName.value.trim() || `收藏夹${collections.value.length + 1}`
  collections.value.push({ id: crypto.randomUUID(), name, items: [] })
  newCollectionName.value = ''
  persist()
}

function removeCollection(id: string) {
  collections.value = collections.value.filter(c => c.id !== id)
  persist()
}

function removeFromCollection(id: string, recipeId: string) {
  const col = collections.value.find(c => c.id === id)
  if (!col) return
  col.items = col.items.filter(r => r.id !== recipeId)
  persist()
}

function addHistoryToCollection(h: { name: string; cuisine: string; emoji: string }) {
  // 历史只有 name/cuisine/emoji，真实菜谱需要按 name + cuisine 回表匹配
  try {
    const all = JSON.parse(localStorage.getItem('allRecipes') || '[]') as Recipe[]
    const recipe = all.find(r => r.name === h.name && r.cuisine === h.cuisine)
    if (!recipe) return
    const target = collections.value[0]
    if (target && !target.items.some(r => r.id === recipe.id)) {
      target.items.push(recipe)
      persist()
    }
  } catch {}
}

function keyOf(h: { name: string; cuisine: string }) { return h.name + '|' + h.cuisine }
function openChooser(h: { name: string; cuisine: string }) {
  chooserOpenFor.value = keyOf(h)
}

function addHistoryToSpecific(h: { name: string; cuisine: string }, collectionId: string) {
  try {
    const all = JSON.parse(localStorage.getItem('allRecipes') || '[]') as Recipe[]
    const recipe = all.find(r => r.name === h.name && r.cuisine === h.cuisine)
    if (!recipe) return
    const target = collections.value.find(c => c.id === collectionId)
    if (!target) return
    if (!target.items.some(r => r.id === recipe.id)) {
      target.items.push(recipe)
      persist()
    }
    chooserOpenFor.value = null
  } catch {}
}

function toggleCandidate(id: string) {
  if (activeCandidateId.value === id) {
    // 如果当前已经是候选集，则取消
    activeCandidateId.value = null
    localStorage.removeItem('activeCandidateCollectionId')
  } else {
    // 否则设为候选集
    activeCandidateId.value = id
    localStorage.setItem('activeCandidateCollectionId', id)
  }
}

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

function startTimer(minutes: number, description: string) {
  const seconds = minutes * 60
  let remaining = seconds
  
  const timer = setInterval(() => {
    remaining--
    if (remaining <= 0) {
      clearInterval(timer)
      alert(`⏰ 计时完成：${description}`)
    }
  }, 1000)
  
  alert(`⏱️ 开始计时 ${minutes} 分钟：${description}`)
}

onMounted(() => {
  load()
  
  // 监听 localStorage 变化，当 foodHistory 被清除时自动更新
  window.addEventListener('storage', (e) => {
    if (e.key === 'foodHistory') {
      loadHistory()
    }
  })
  
  // 监听自定义事件，当历史记录被清除时立即更新
  window.addEventListener('foodHistoryCleared', () => {
    loadHistory()
  })
})
</script>

<style scoped>
</style>



