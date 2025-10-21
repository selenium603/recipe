<!-- FoodCard.vue -->
<template>
  <div class="food-card bg-white rounded-lg border-2 border-[#0A0910] overflow-visible shadow-lg relative">
    <!-- 卡片头部 -->
    <div class="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold line-clamp-1">{{ recipe.name }}</h3>
          <div class="flex items-center gap-2 mt-1">
            <span class="bg-white/20 px-2 py-1 rounded text-xs">👨‍🍳 {{ recipe.cuisine }}</span>
            <span class="text-xs">⏱️ {{ formatTime(recipe.cookingTime) }}</span>
          </div>
        </div>
        <span class="text-2xl">{{ recipe.emoji }}</span>
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="p-4">
      <!-- 食材预览 -->
      <div class="mb-3">
        <h4 class="text-sm font-bold text-dark-800 mb-2 flex items-center gap-1">
          <span>🥬</span>
          <span>主要食材</span>
        </h4>
        <div class="flex flex-wrap gap-1">
          <span 
            v-for="ingredient in recipe.ingredients.slice(0, 4)" 
            :key="ingredient"
            class="bg-yellow-100 text-dark-800 px-2 py-1 rounded text-xs font-medium border border-yellow-300"
          >
            {{ ingredient }}
          </span>
          <span v-if="recipe.ingredients.length > 4" class="text-xs text-gray-500">
            +{{ recipe.ingredients.length - 4 }}种
          </span>
        </div>
      </div>

      <!-- 难度和口味 -->
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="bg-gray-50 rounded p-2 text-center">
          <div class="text-xs text-gray-600 mb-1">难度</div>
          <div class="text-sm font-bold text-dark-800">{{ difficultyText }}</div>
        </div>
        <div class="bg-gray-50 rounded p-2 text-center">
          <div class="text-xs text-gray-600 mb-1">口味</div>
          <div class="text-sm font-bold text-dark-800">{{ recipe.flavor }}</div>
        </div>
      </div>

      <!-- 描述 -->
      <p class="text-sm text-gray-700 line-clamp-2">
        {{ recipe.description }}
      </p>
      <div class="mt-3 relative">
        <button class="px-3 py-1 text-sm rounded border hover:bg-gray-50" @click.stop="togglePicker">
          加入收藏夹
        </button>
        <div v-if="pickerOpen" class="absolute z-50 mt-1 w-64 bg-white border-2 border-[#0A0910] rounded-lg shadow-xl p-2 left-0">
          <div class="text-xs text-gray-500 px-1 mb-1">选择收藏夹</div>
          <button
            v-for="c in collections"
            :key="c.id"
            @click.stop="addToCollection(c.id)"
            class="w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm flex items-center justify-between"
          >
            <span>{{ c.name }}</span>
            <span class="text-[10px] text-gray-500">点击加入</span>
          </button>
          <div class="border-t my-2"></div>
          <div class="flex gap-1 px-1">
            <input v-model="newName" placeholder="新建收藏夹" class="flex-1 px-2 py-1 border rounded text-sm" @keyup.enter="createAndAdd" />
            <button class="px-2 text-sm bg-blue-600 text-white rounded" @click.stop="createAndAdd">新建</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import type { Recipe } from '@/types'

const props = defineProps<{
  recipe: Recipe
}>()

const emit = defineEmits(['show-picker', 'hide-picker'])

const difficultyText = computed(() => {
  // 直接使用 recipe 中定义的 difficulty 字段
  return props.recipe.difficulty
})

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

// 收藏夹选择器（本地持久化）
type Collection = { id: string; name: string; items: Recipe[] }
const pickerOpen = ref(false)
const collections = ref<Collection[]>([])
const newName = ref('')

function loadCollections() {
  try {
    const saved = localStorage.getItem('recipeCollections')
    collections.value = saved ? JSON.parse(saved) : [{ id: crypto.randomUUID(), name: '默认收藏夹', items: [] }]
  } catch {
    collections.value = [{ id: crypto.randomUUID(), name: '默认收藏夹', items: [] }]
  }
}

function persist() {
  localStorage.setItem('recipeCollections', JSON.stringify(collections.value))
}

function togglePicker() {
  pickerOpen.value = !pickerOpen.value
  if (pickerOpen.value) {
    emit('show-picker', props.recipe.id)
  } else {
    emit('hide-picker', props.recipe.id)
  }
}

function closeOnOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.food-card')) {
    pickerOpen.value = false
    emit('hide-picker', props.recipe.id)
  }
}

function addToCollection(id: string) {
  const col = collections.value.find(c => c.id === id)
  if (!col) return
  if (!col.items.some(r => r.id === props.recipe.id)) {
    col.items.push(props.recipe)
    persist()
  }
  pickerOpen.value = false
  emit('hide-picker', props.recipe.id)
}

function createAndAdd() {
  const name = newName.value.trim() || `收藏夹${collections.value.length + 1}`
  const created: Collection = { id: crypto.randomUUID(), name, items: [] }
  collections.value.push(created)
  newName.value = ''
  addToCollection(created.id)
}

onMounted(() => {
  loadCollections()
  window.addEventListener('click', closeOnOutside)
})
onBeforeUnmount(() => {
  window.removeEventListener('click', closeOnOutside)
})
</script>

<style scoped>
.food-card {
  transition: all 0.3s ease;
}

.food-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>