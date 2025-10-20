<!-- CuisineSelector.vue -->
<template>
  <div>
    <h4 class="text-sm font-bold text-dark-800 mb-3 flex items-center gap-1">
      <span>🏮</span>
      <span>选择菜系（可选）</span>
    </h4>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
      <button
        v-for="cuisine in cuisines"
        :key="cuisine.id"
        @click="toggleCuisine(cuisine.id)"
        :class="[
          'p-3 rounded-lg border-2 border-[#0A0910] font-medium text-sm transition-all duration-200 relative flex items-center justify-center gap-1',
          selectedCuisines.includes(cuisine.id) 
            ? 'bg-green-400 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        <span>{{ cuisine.emoji }}</span>
        <span>{{ cuisine.name }}</span>
        <span v-if="selectedCuisines.includes(cuisine.id)" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
          ✓
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  selectedCuisines: string[]
}>()

const emit = defineEmits(['update:selectedCuisines'])

const cuisines = ref([
  { id: 'chuan', name: '川菜', emoji: '🌶️' },
  { id: 'yue', name: '粤菜', emoji: '🍤' },
  { id: 'su', name: '苏菜', emoji: '🍲' },
  { id: 'lu', name: '鲁菜', emoji: '🥘' },
  { id: 'zhe', name: '浙菜', emoji: '🐟' },
  { id: 'min', name: '闽菜', emoji: '🍜' },
  { id: 'xiang', name: '湘菜', emoji: '🔥' },
  { id: 'hui', name: '徽菜', emoji: '🏔️' }
])

const toggleCuisine = (cuisineId: string) => {
  const updated = [...props.selectedCuisines]
  const index = updated.indexOf(cuisineId)
  
  if (index > -1) {
    updated.splice(index, 1)
  } else {
    updated.push(cuisineId)
  }
  
  emit('update:selectedCuisines', updated)
}
</script>