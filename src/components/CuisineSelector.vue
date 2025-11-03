<template>
  <div>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 md:gap-2">
      <button
        v-for="cuisine in cuisines"
        :key="cuisine.id"
        @click="toggleCuisine(cuisine.id)"
        :class="[
          'p-4 md:p-3 rounded-lg border-2 border-[#0A0910] font-medium text-base md:text-sm transition-all duration-200 relative flex items-center justify-center gap-1.5 md:gap-1 active:scale-95',
          selectedCuisines.includes(cuisine.id) 
            ? 'bg-green-400 text-white shadow-md' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
        ]"
      >
        <span class="text-lg md:text-base">{{ cuisine.emoji }}</span>
        <span>{{ cuisine.name }}</span>
        <span v-if="selectedCuisines.includes(cuisine.id)" class="absolute -top-1 -right-1 w-5 h-5 md:w-4 md:h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center shadow-md">
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