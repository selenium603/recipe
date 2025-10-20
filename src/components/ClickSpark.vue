<template>
  <div
    ref="containerRef"
    class="click-spark-container"
    @click="handleClick"
  >
    <canvas
      ref="canvasRef"
      class="click-spark-canvas"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

interface Props {
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  extraScale?: number
}

const props = withDefaults(defineProps<Props>(), {
  sparkColor: '#fff',
  sparkSize: 10,
  sparkRadius: 15,
  sparkCount: 8,
  duration: 400,
  easing: 'ease-out',
  extraScale: 1.0
})

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const sparksRef = ref<Array<{
  x: number
  y: number
  angle: number
  startTime: number
}>>([])
const animationId = ref<number | null>(null)
const resizeObserver = ref<ResizeObserver | null>(null)

const easeFunc = (t: number): number => {
  switch (props.easing) {
    case 'linear':
      return t
    case 'ease-in':
      return t * t
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    default:
      return t * (2 - t)
  }
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const { width, height } = container.getBoundingClientRect()
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
}

const draw = (timestamp: number) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  sparksRef.value = sparksRef.value.filter(spark => {
    const elapsed = timestamp - spark.startTime
    if (elapsed >= props.duration) {
      return false
    }

    const progress = elapsed / props.duration
    const eased = easeFunc(progress)

    const distance = eased * props.sparkRadius * props.extraScale
    const lineLength = props.sparkSize * (1 - eased)

    const x1 = spark.x + distance * Math.cos(spark.angle)
    const y1 = spark.y + distance * Math.sin(spark.angle)
    const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle)
    const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle)

    ctx.strokeStyle = props.sparkColor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    return true
  })

  animationId.value = requestAnimationFrame(draw)
}

const handleClick = (e: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const now = performance.now()
  const newSparks = Array.from({ length: props.sparkCount }, (_, i) => ({
    x,
    y,
    angle: (2 * Math.PI * i) / props.sparkCount,
    startTime: now
  }))

  sparksRef.value.push(...newSparks)
}

onMounted(async () => {
  await nextTick()
  
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  // 初始化画布大小
  resizeCanvas()

  // 设置 ResizeObserver
  resizeObserver.value = new ResizeObserver(() => {
    resizeCanvas()
  })
  resizeObserver.value.observe(container)

  // 开始动画循环
  animationId.value = requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
})
</script>

<style scoped>
.click-spark-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.click-spark-canvas {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}
</style>

