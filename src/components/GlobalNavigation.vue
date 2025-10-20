<template>
  <nav class="bg-orange-400 text-white p-4 shadow-md mb-8">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <h1 class="text-xl font-bold select-none">🍱 美食决策大师</h1>
      <div class="flex items-center gap-3">
        <RouterLink 
          to="/" 
          class="px-4 py-2 rounded-lg transition-colors font-medium"
          :class="$route.path === '/' ? 'bg-white text-orange-500' : 'bg-white/20 text-white hover:bg-white/30'"
        >
          首页
        </RouterLink>
        <RouterLink 
          to="/search" 
          class="px-4 py-2 rounded-lg transition-colors font-medium"
          :class="$route.path === '/search' ? 'bg-white text-orange-500' : 'bg-white/20 text-white hover:bg-white/30'"
        >
          🔍 AI搜索
        </RouterLink>
        <RouterLink 
          to="/collections" 
          class="px-4 py-2 rounded-lg transition-colors font-medium"
          :class="$route.path === '/collections' ? 'bg-white text-orange-500' : 'bg-white/20 text-white hover:bg-white/30'"
        >
          收藏夹
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
// 简单静态，功能可结合vue-router拓展
</script>

<style scoped>
nav {
  user-select: none;
}
</style>