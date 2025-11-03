<template>
  <div v-if="recipe" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[250]" @click.self="$emit('close')">
    <div class="bg-white max-w-2xl w-[92vw] rounded-lg border-2 border-[#0A0910] overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 border-b">
        <h3 class="text-lg font-bold">{{ recipe.name }} · 做法</h3>
        <button class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" @click="$emit('close')">关闭</button>
      </div>
      <div class="p-4 max-h-[70vh] overflow-auto">
        <div class="mb-3 text-sm text-gray-600">
          ⏱️ 用时：{{ formatTime(recipe.cookingTime) }} · 
          菜系：{{ recipe.cuisine }} · 
          难度：{{ recipe.difficulty }}
        </div>
        <div class="mb-4">
          <div class="font-semibold mb-2">食材</div>
          <div class="flex flex-wrap gap-2">
            <span v-for="ing in recipe.ingredients" :key="ing" class="px-2 py-1 rounded bg-gray-100 text-sm border">
              {{ ing }}
            </span>
          </div>
        </div>
        <div>
          <div class="font-semibold mb-2">步骤</div>
          <ol class="list-decimal ml-5 space-y-2">
            <li v-for="s in recipe.steps" :key="s.step" class="text-sm leading-relaxed flex items-center justify-between">
              <span>{{ s.description }}</span>
              <button v-if="s.time" @click="startTimer(s.time, s.description)" class="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                ⏱️ {{ s.time }}分钟
              </button>
            </li>
          </ol>
        </div>
        <div v-if="recipe.tips && recipe.tips.length > 0" class="mt-4 pt-4 border-t">
          <div class="font-semibold mb-2">💡 烹饪技巧</div>
          <ul class="list-disc ml-5 space-y-1">
            <li v-for="tip in recipe.tips" :key="tip" class="text-sm text-gray-700">{{ tip }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Recipe } from '@/types'

defineProps<{
  recipe: Recipe | null
}>()

defineEmits<{
  close: []
}>()

// 格式化时间
const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

// 统一的计时功能
const startTimer = (minutes: number, description: string) => {
  const seconds = minutes * 60
  let remaining = seconds
  
  const timer = setInterval(() => {
    remaining--
    if (remaining <= 0) {
      clearInterval(timer)
      alert(`⏰ 计时完成！\n步骤：${description}`)
    }
  }, 1000)
  
  alert(`⏱️ 开始计时\n步骤：${description}\n时长：${minutes} 分钟`)
}
</script>

