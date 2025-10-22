<!-- SkeletonCard.vue -->
<template>
  <div class="skeleton-card bg-white rounded-lg border-2 border-[#0A0910] overflow-hidden shadow-lg">
    <!-- 卡片头部骨架 -->
    <div class="bg-gradient-to-r from-orange-300 to-red-400 p-4">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <!-- 标题骨架 -->
          <div class="skeleton-wave skeleton-delay-1 h-6 bg-white/40 rounded w-3/4 mb-2"></div>
          <!-- 标签骨架 -->
          <div class="flex items-center gap-2">
            <div class="skeleton-wave skeleton-delay-2 h-5 bg-white/40 rounded w-16"></div>
            <div class="skeleton-wave skeleton-delay-3 h-5 bg-white/40 rounded w-20"></div>
          </div>
        </div>
        <!-- Emoji 骨架 -->
        <div class="skeleton-wave skeleton-delay-4 w-10 h-10 bg-white/40 rounded-full"></div>
      </div>
    </div>

    <!-- 卡片内容骨架 -->
    <div class="p-4">
      <!-- 食材预览骨架 -->
      <div class="mb-3">
        <div class="skeleton-wave skeleton-delay-5 h-4 bg-orange-100 rounded w-24 mb-2"></div>
        <div class="flex flex-wrap gap-1">
          <div class="skeleton-wave skeleton-delay-6 h-6 bg-orange-100 rounded w-16"></div>
          <div class="skeleton-wave skeleton-delay-7 h-6 bg-orange-100 rounded w-20"></div>
          <div class="skeleton-wave skeleton-delay-8 h-6 bg-orange-100 rounded w-14"></div>
          <div class="skeleton-wave skeleton-delay-9 h-6 bg-orange-100 rounded w-18"></div>
        </div>
      </div>

      <!-- 难度和口味骨架 -->
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="bg-orange-50 rounded p-2">
          <div class="skeleton-wave skeleton-delay-10 h-3 bg-orange-200 rounded w-8 mx-auto mb-1"></div>
          <div class="skeleton-wave skeleton-delay-11 h-4 bg-orange-200 rounded w-12 mx-auto"></div>
        </div>
        <div class="bg-orange-50 rounded p-2">
          <div class="skeleton-wave skeleton-delay-12 h-3 bg-orange-200 rounded w-8 mx-auto mb-1"></div>
          <div class="skeleton-wave skeleton-delay-13 h-4 bg-orange-200 rounded w-16 mx-auto"></div>
        </div>
      </div>

      <!-- 描述骨架 -->
      <div class="mb-3">
        <div class="skeleton-wave skeleton-delay-14 h-3 bg-orange-100 rounded w-full mb-1"></div>
        <div class="skeleton-wave skeleton-delay-15 h-3 bg-orange-100 rounded w-4/5"></div>
      </div>

      <!-- 按钮骨架 -->
      <div class="skeleton-wave skeleton-delay-16 h-8 bg-orange-200 rounded w-24"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
/* 波浪动画：元素依次亮起 */
.skeleton-wave {
  position: relative;
  overflow: hidden;
  animation: wave-pulse 2s ease-in-out infinite;
  opacity: 0.6;
}

@keyframes wave-pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 8px rgba(251, 146, 60, 0.4);
  }
}

/* 波浪延迟 - 每个元素递增 0.08s 延迟，形成波浪效果 */
.skeleton-delay-1 { animation-delay: 0s; }
.skeleton-delay-2 { animation-delay: 0.08s; }
.skeleton-delay-3 { animation-delay: 0.16s; }
.skeleton-delay-4 { animation-delay: 0.24s; }
.skeleton-delay-5 { animation-delay: 0.32s; }
.skeleton-delay-6 { animation-delay: 0.4s; }
.skeleton-delay-7 { animation-delay: 0.48s; }
.skeleton-delay-8 { animation-delay: 0.56s; }
.skeleton-delay-9 { animation-delay: 0.64s; }
.skeleton-delay-10 { animation-delay: 0.72s; }
.skeleton-delay-11 { animation-delay: 0.8s; }
.skeleton-delay-12 { animation-delay: 0.88s; }
.skeleton-delay-13 { animation-delay: 0.96s; }
.skeleton-delay-14 { animation-delay: 1.04s; }
.skeleton-delay-15 { animation-delay: 1.12s; }
.skeleton-delay-16 { animation-delay: 1.2s; }

/* 添加渐变扫过效果作为额外层 */
.skeleton-wave::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.5) 50%,
    transparent 100%
  );
  animation: shimmer 2.5s infinite;
  animation-delay: inherit;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}
</style>

