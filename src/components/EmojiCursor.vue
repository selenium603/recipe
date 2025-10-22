<!-- EmojiCursor.vue -->
<template>
  <div ref="containerRef" class="emoji-cursor-container">
    <div class="emoji-trail">
      <TransitionGroup name="emoji">
        <div
          v-for="item in trail"
          :key="item.id"
          class="emoji-item"
          :style="{
            left: item.x + 'px',
            top: item.y + 'px',
            transform: `rotate(${item.angle}deg)`,
            '--random-x': item.randomX + 'px',
            '--random-y': item.randomY + 'px',
            '--random-rotate': item.randomRotate + 'deg'
          }"
        >
          {{ item.emoji }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface TrailItem {
  id: number
  x: number
  y: number
  angle: number
  emoji: string
  randomX: number
  randomY: number
  randomRotate: number
}

interface Props {
  emojis?: string[]
  delay?: number
  spacing?: number
  followMouseDirection?: boolean
  randomFloat?: boolean
  exitDuration?: number
  removalInterval?: number
  maxPoints?: number
}

const props = withDefaults(defineProps<Props>(), {
  emojis: () => ['🍲', '🥘', '🍛', '🍜', '🥗', '🍝', '🍕', '🍔', '🌮', '🥙'],
  delay: 0.01,
  spacing: 80,
  followMouseDirection: true,
  randomFloat: true,
  exitDuration: 0.3,
  removalInterval: 20,
  maxPoints: 10
})

const containerRef = ref<HTMLElement | null>(null)
const trail = ref<TrailItem[]>([])
const lastMoveTime = ref(Date.now())
const idCounter = ref(0)

const getRandomEmoji = (): string => {
  return props.emojis[Math.floor(Math.random() * props.emojis.length)] || '🍽️'
}

const handleMouseMove = (e: MouseEvent) => {
  // 直接使用全局鼠标坐标
  const mouseX = e.clientX
  const mouseY = e.clientY
  
  console.log('Mouse move:', { mouseX, mouseY, trailLength: trail.value.length })

  const newTrail = [...trail.value]

  if (newTrail.length === 0) {
    newTrail.push({
      id: idCounter.value++,
      x: mouseX,
      y: mouseY,
      angle: 0,
      emoji: getRandomEmoji(),
      randomX: props.randomFloat ? Math.random() * 10 - 5 : 0,
      randomY: props.randomFloat ? Math.random() * 10 - 5 : 0,
      randomRotate: props.randomFloat ? Math.random() * 10 - 5 : 0
    })
  } else {
    const last = newTrail[newTrail.length - 1]
    if (!last) return
    
    const dx = mouseX - last.x
    const dy = mouseY - last.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance >= props.spacing) {
      let rawAngle = (Math.atan2(dy, dx) * 180) / Math.PI
      if (rawAngle > 90) rawAngle -= 180
      else if (rawAngle < -90) rawAngle += 180
      const computedAngle = props.followMouseDirection ? rawAngle : 0
      
      const steps = Math.floor(distance / props.spacing)
      for (let i = 1; i <= steps; i++) {
        const t = (props.spacing * i) / distance
        const newX = last.x + dx * t
        const newY = last.y + dy * t
        newTrail.push({
          id: idCounter.value++,
          x: newX,
          y: newY,
          angle: computedAngle,
          emoji: getRandomEmoji(),
          randomX: props.randomFloat ? Math.random() * 10 - 5 : 0,
          randomY: props.randomFloat ? Math.random() * 10 - 5 : 0,
          randomRotate: props.randomFloat ? Math.random() * 10 - 5 : 0
        })
      }
    }
  }

  // 限制最大数量
  if (newTrail.length > props.maxPoints) {
    trail.value = newTrail.slice(newTrail.length - props.maxPoints)
  } else {
    trail.value = newTrail
  }

  lastMoveTime.value = Date.now()
}

let removalIntervalId: number | null = null

onMounted(() => {
  console.log('EmojiCursor mounted')
  // 监听全局鼠标移动
  window.addEventListener('mousemove', handleMouseMove)
  console.log('Global mouse event listener added')

  // 定期移除旧的 emoji
  removalIntervalId = window.setInterval(() => {
    if (Date.now() - lastMoveTime.value > 100) {
      if (trail.value.length > 0) {
        trail.value = trail.value.slice(1)
      }
    }
  }, props.removalInterval)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  if (removalIntervalId !== null) {
    clearInterval(removalIntervalId)
  }
})
</script>

<style scoped>
.emoji-cursor-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 9999;
}

.emoji-trail {
  position: absolute;
  inset: 0;
}

.emoji-item {
  position: absolute;
  font-size: 1.75rem;
  user-select: none;
  white-space: nowrap;
  pointer-events: none;
  transform-origin: center;
  animation: emoji-float 2.5s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

@keyframes emoji-float {
  0%, 100% {
    transform: translate(0, 0) rotate(var(--random-rotate, 0deg)) scale(1);
  }
  50% {
    transform: translate(var(--random-x, 0), var(--random-y, 0)) rotate(calc(var(--random-rotate, 0deg) * 2)) scale(1.1);
  }
}

/* Vue TransitionGroup 动画 */
.emoji-enter-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.emoji-leave-active {
  transition: all 0.25s ease-in;
}

.emoji-enter-from {
  opacity: 0;
  transform: scale(0) rotate(-180deg);
}

.emoji-leave-to {
  opacity: 0;
  transform: scale(0) translateY(30px);
}
</style>

