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
        <div class="text-center mb-6">
          <div class="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg border-4 border-white">
            <span class="text-white text-3xl">📁</span>
          </div>
        </div>

        <div class="flex items-center gap-3 mb-6">
          <div class="bg-white border-2 border-[#0A0910] rounded-lg px-4 py-3 flex items-center gap-2 flex-1">
            <span class="text-sm text-gray-600 whitespace-nowrap">筛选标签：</span>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="t in tagOptions"
                :key="t"
                @click="selectedTag = t"
                :class="['px-3 py-1 rounded-full text-sm transition-colors', selectedTag===t? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200']"
              >{{ t }}</button>
            </div>
          </div>
          
          <button 
            @click="showCreateInput = true" 
            class="w-12 h-12 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all duration-200 font-bold text-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 flex-shrink-0"
            title="新建收藏夹"
          >
            +
          </button>
        </div>

        <div v-if="showCreateInput" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="cancelCreate">
          <div class="bg-white rounded-lg border-2 border-[#0A0910] p-6 w-[90%] max-w-md shadow-2xl">
            <h3 class="text-lg font-bold mb-4">新建收藏夹</h3>
            <input 
              ref="createInputRef"
              v-model="newCollectionName" 
              placeholder="收藏夹名称，如 家宴/便当"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4" 
              @keyup.enter="createCollectionAndHide"
            />
            <div class="flex justify-end gap-2">
              <button @click="cancelCreate" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">取消</button>
              <button @click="createCollectionAndHide" class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">确认</button>
            </div>
          </div>
        </div>

        <draggable 
          v-model="collections" 
          @start="onDragStart" 
          @end="onDragEnd"
          item-key="id"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          :animation="300"
          ghost-class="ghost-collection"
          drag-class="dragging-collection"
          chosen-class="chosen-collection"
          :force-fallback="true"
          :fallback-tolerance="3"
        >
          <template #item="{element: col}">
            <div :key="col.id" class="bg-white border-2 border-[#0A0910] rounded-lg p-3 cursor-move transition-all duration-200">
              <div class="flex items-center justify-between mb-2 gap-2">
                <input v-model="col.name" class="font-semibold flex-1 mr-2 border-b focus:outline-none min-w-0" />
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button 
                    :class="['text-xs px-2 py-1 rounded border whitespace-nowrap', activeCandidateId === col.id ? 'bg-orange-500 text-white' : 'bg-gray-100']" 
                    @click="toggleCandidate(col.id)"
                  >
                    {{ activeCandidateId === col.id ? '取消候选集' : '设为抽卡候选集' }}
                  </button>
                  <button class="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 whitespace-nowrap" @click="removeCollection(col.id)">删除</button>
                </div>
              </div>
              <div class="text-xs text-gray-500 mb-2">
                {{ getVisibleCount(col.items) }} / {{ col.items.length }} 道菜
                <span v-if="activeCandidateId===col.id" class="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700">当前候选集</span>
              </div>
              <draggable 
                v-model="col.items" 
                @start="onItemDragStart" 
                @end="onItemDragEnd"
                item-key="id"
                class="space-y-2 max-h-64 overflow-auto"
                :animation="300"
                ghost-class="ghost-item"
                drag-class="dragging-item"
                chosen-class="chosen-item"
                @change="persist"
                :force-fallback="true"
                :fallback-tolerance="3"
              >
                <template #item="{element: r}">
                  <div
                    v-show="isItemVisible(r)"
                    :key="r.id"
                    v-memo="[r.id, r.name]"
                    class="flex items-center justify-between border rounded px-2 py-1 hover:bg-gray-50 cursor-move transition-all duration-200"
                  >
                    <div class="flex items-center gap-2 flex-1" @click="openRecipe(r)">
                      <span>{{ r.emoji }}</span>
                      <span class="text-sm">{{ r.name }}</span>
                      <span class="text-xs text-gray-500">· {{ r.cuisine }}</span>
                    </div>
                    <button class="text-xs text-red-500 hover:text-red-700" @click.stop="removeFromCollection(col.id, r.id)">移除</button>
                  </div>
                </template>
              </draggable>
            </div>
          </template>
        </draggable>

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

        <RecipeModal :recipe="modalRecipe" @close="closeModal" />
      </div>

      <GlobalFooter />
    </div>
  </ClickSpark>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Recipe } from '@/types'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import ClickSpark from '@/components/ClickSpark.vue'
import ShaderBackground from '@/components/ShaderBackground.vue'
import EmojiCursor from '@/components/EmojiCursor.vue'
import RecipeModal from '@/components/RecipeModal.vue'
import draggable from 'vuedraggable'

interface Collection { id: string; name: string; items: Recipe[] }

const router = useRouter()
const newCollectionName = ref('')
const collections = ref<Collection[]>([])
const history = ref<Array<{ name: string; cuisine: string; emoji: string }>>([])
const chooserOpenFor = ref<string | null>(null)
const activeCandidateId = ref<string | null>(null)
const selectedTag = ref<string>('全部')
const modalRecipe = ref<Recipe | null>(null)
const showCreateInput = ref(false)
const createInputRef = ref<HTMLInputElement | null>(null)

const tagOptions = computed(() => {
  const set = new Set<string>(['全部'])
  collections.value.forEach(c => c.items.forEach(i => set.add(i.cuisine)))
  return Array.from(set)
})

// 计算每个收藏夹的可见菜品数量
function getVisibleCount(items: Recipe[]) {
  if (selectedTag.value === '全部') return items.length
  return items.filter(i => i.cuisine === selectedTag.value).length
}

// 判断单个菜品是否应该显示
function isItemVisible(item: Recipe) {
  if (selectedTag.value === '全部') return true
  return item.cuisine === selectedTag.value
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

function createCollectionAndHide() {
  if (newCollectionName.value.trim()) {
    createCollection()
  }
  showCreateInput.value = false
}

function cancelCreate() {
  newCollectionName.value = ''
  showCreateInput.value = false
}


// 监听 showCreateInput 变化，自动聚焦输入框
async function focusCreateInput() {
  if (showCreateInput.value) {
    await nextTick()
    createInputRef.value?.focus()
  }
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

// 使用 watch 监听 showCreateInput，自动聚焦输入框
watch(showCreateInput, () => {
  focusCreateInput()
})

// 拖拽处理函数
function onDragStart() {
  // 收藏夹拖拽开始
}

function onDragEnd() {
  // 收藏夹拖拽结束，保存顺序
  persist()
}

function onItemDragStart() {
  // 菜品拖拽开始
}

function onItemDragEnd() {
  // 菜品拖拽结束，已在change事件中保存
}
</script>

<style scoped>
/* 拖拽样式 - 收藏夹 */
.chosen-collection {
  cursor: grabbing !important;
}

.dragging-collection {
  opacity: 1 !important;
  transform: scale(1.08) rotate(3deg) translateY(-8px) !important;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.35),
    0 10px 30px rgba(255, 107, 53, 0.2),
    0 0 0 1px rgba(255, 107, 53, 0.1) !important;
  z-index: 9999 !important;
  transition: all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28) !important;
  background: white !important;
  border-color: #ff6b35 !important;
}

.ghost-collection {
  opacity: 1 !important;
  background: linear-gradient(135deg, #ffeee5 0%, #fff5f0 100%) !important;
  border: 2px dashed #ff6b35 !important;
  transform: scale(0.98) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.ghost-collection > * {
  opacity: 0.4;
}

/* 拖拽样式 - 菜品 */
.chosen-item {
  cursor: grabbing !important;
}

.dragging-item {
  opacity: 1 !important;
  transform: scale(1.1) translateY(-4px) !important;
  box-shadow: 
    0 12px 24px rgba(255, 107, 53, 0.3),
    0 6px 12px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(255, 107, 53, 0.2) !important;
  background: #ffffff !important;
  border-color: #ff6b35 !important;
  z-index: 9999 !important;
  transition: all 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28) !important;
}

.ghost-item {
  opacity: 1 !important;
  background: linear-gradient(90deg, #ffeee5 0%, #fff8f0 100%) !important;
  border: 2px dashed #ffb899 !important;
  transform: scale(0.95) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.ghost-item > * {
  opacity: 0.3;
}

/* 添加平滑过渡到所有可拖拽元素 */
.cursor-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cursor-move:active {
  cursor: grabbing;
}

.cursor-move:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>



