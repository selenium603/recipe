<template>
  <div
    :class="`scroll-stack-card relative w-full h-auto my-8 p-4 sm:p-6 md:p-12 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] shadow-[0_0_20px_rgba(0,0,0,0.08)] md:shadow-[0_0_30px_rgba(0,0,0,0.1)] box-border origin-top will-change-transform ${itemClassName}`.trim()"
    :style="{
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    }"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  itemClassName?: string
}

withDefaults(defineProps<Props>(), {
  itemClassName: ''
})
</script>

