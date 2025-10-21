<template>
  <div :class="containerClassName" ref="scrollerRef" :style="containerStyles">
    <div class="scroll-stack-inner pt-[5vh] px-4 md:px-20 pb-[10vh] min-h-screen">
      <slot></slot>
      <!-- Spacer so the last pin can release cleanly -->
      <div class="scroll-stack-end w-full h-px"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Lenis from 'lenis'

interface Props {
  className?: string
  itemDistance?: number
  itemScale?: number
  itemStackDistance?: number
  stackPosition?: string
  scaleEndPosition?: string
  baseScale?: number
  scaleDuration?: number
  rotationAmount?: number
  blurAmount?: number
  useWindowScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  itemDistance: 100,
  itemScale: 0.03,
  itemStackDistance: 30,
  stackPosition: '20%',
  scaleEndPosition: '10%',
  baseScale: 0.85,
  scaleDuration: 0.5,
  rotationAmount: 0,
  blurAmount: 0,
  useWindowScroll: false
})

const emit = defineEmits(['stackComplete'])

const scrollerRef = ref<HTMLElement | null>(null)
const stackCompletedRef = ref(false)
const animationFrameRef = ref<number | null>(null)
const lenisRef = ref<Lenis | null>(null)
const cardsRef = ref<HTMLElement[]>([])
const lastTransformsRef = ref(new Map())

const calculateProgress = (scrollTop: number, start: number, end: number): number => {
  if (scrollTop < start) return 0
  if (scrollTop > end) return 1
  return (scrollTop - start) / (end - start)
}

const parsePercentage = (value: string | number, containerHeight: number): number => {
  if (typeof value === 'string' && value.includes('%')) {
    return (parseFloat(value) / 100) * containerHeight
  }
  return parseFloat(value.toString())
}

const getScrollData = () => {
  if (props.useWindowScroll) {
    return {
      scrollTop: window.scrollY,
      containerHeight: window.innerHeight,
      scrollContainer: document.documentElement
    }
  } else {
    const scroller = scrollerRef.value
    return {
      scrollTop: scroller?.scrollTop || 0,
      containerHeight: scroller?.clientHeight || 0,
      scrollContainer: scroller
    }
  }
}

const getElementOffset = (element: HTMLElement): number => {
  if (props.useWindowScroll) {
    const rect = element.getBoundingClientRect()
    return rect.top + window.scrollY
  } else {
    return element.offsetTop
  }
}

const updateCardTransforms = () => {
  if (!cardsRef.value.length) return

  const { scrollTop, containerHeight } = getScrollData()
  const stackPositionPx = parsePercentage(props.stackPosition, containerHeight)
  const scaleEndPositionPx = parsePercentage(props.scaleEndPosition, containerHeight)

  const endElement = props.useWindowScroll
    ? document.querySelector('.scroll-stack-end') as HTMLElement | null
    : scrollerRef.value?.querySelector('.scroll-stack-end') as HTMLElement | null

  const endElementTop = endElement ? getElementOffset(endElement) : 0

  cardsRef.value.forEach((card, i) => {
    if (!card) return

    const cardTop = getElementOffset(card)
    const triggerStart = cardTop - stackPositionPx - props.itemStackDistance * i
    const triggerEnd = cardTop - scaleEndPositionPx
    const pinStart = cardTop - stackPositionPx - props.itemStackDistance * i
    const pinEnd = endElementTop - containerHeight * 0.8

    const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd)
    const targetScale = props.baseScale + i * props.itemScale
    const scale = 1 - scaleProgress * (1 - targetScale)
    const rotation = props.rotationAmount ? i * props.rotationAmount * scaleProgress : 0

    let blur = 0
    if (props.blurAmount) {
      let topCardIndex = 0
      for (let j = 0; j < cardsRef.value.length; j++) {
        const jCard = cardsRef.value[j]
        if (!jCard) continue
        const jCardTop = getElementOffset(jCard)
        const jTriggerStart = jCardTop - stackPositionPx - props.itemStackDistance * j
        if (scrollTop >= jTriggerStart) {
          topCardIndex = j
        }
      }

      if (i < topCardIndex) {
        const depthInStack = topCardIndex - i
        blur = Math.max(0, depthInStack * props.blurAmount)
      }
    }

    let translateY = 0
    const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd

    if (isPinned) {
      translateY = scrollTop - cardTop + stackPositionPx + props.itemStackDistance * i
    } else if (scrollTop > pinEnd) {
      translateY = pinEnd - cardTop + stackPositionPx + props.itemStackDistance * i
    }

    const newTransform = {
      translateY: translateY,
      scale: scale,
      rotation: rotation,
      blur: blur
    }

    const lastTransform = lastTransformsRef.value.get(i)
    
    // 使用较大的阈值，过滤微小抖动同时保持动画流畅
    const hasChanged =
      !lastTransform ||
      Math.abs(lastTransform.translateY - newTransform.translateY) > 3 ||
      Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
      Math.abs(lastTransform.rotation - newTransform.rotation) > 2 ||
      Math.abs(lastTransform.blur - newTransform.blur) > 2

    if (hasChanged) {
      const transform = `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rotation}deg)`
      const filter = blur > 0 ? `blur(${blur}px)` : ''

      // 添加更长的 transition 平滑跳跃
      card.style.transition = 'transform 0.12s ease-out'
      card.style.transform = transform
      card.style.filter = filter

      lastTransformsRef.value.set(i, newTransform)
    }

    if (i === cardsRef.value.length - 1) {
      const isInView = scrollTop >= pinStart && scrollTop <= pinEnd
      if (isInView && !stackCompletedRef.value) {
        stackCompletedRef.value = true
        emit('stackComplete')
      } else if (!isInView && stackCompletedRef.value) {
        stackCompletedRef.value = false
      }
    }
  })
}

const handleScroll = () => {
  // 直接更新，不使用 RAF 节流，让 Lenis 的 RAF 控制节奏
  updateCardTransforms()
}

const setupLenis = () => {
  if (props.useWindowScroll) {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      wheelMultiplier: 1,
      lerp: 0.09,
      syncTouch: true,
      syncTouchLerp: 0.09
    })

    lenis.on('scroll', handleScroll)

    const raf = (time: number) => {
      lenis.raf(time)
      animationFrameRef.value = requestAnimationFrame(raf)
    }
    animationFrameRef.value = requestAnimationFrame(raf)

    lenisRef.value = lenis
    return lenis
  } else {
    const scroller = scrollerRef.value
    if (!scroller) return

    const content = scroller.querySelector('.scroll-stack-inner') as HTMLElement
    if (!content) return

    const lenis = new Lenis({
      wrapper: scroller,
      content: content,
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      wheelMultiplier: 1,
      lerp: 0.09,
      syncTouch: true,
      syncTouchLerp: 0.09
    })

    lenis.on('scroll', handleScroll)

    const raf = (time: number) => {
      lenis.raf(time)
      animationFrameRef.value = requestAnimationFrame(raf)
    }
    animationFrameRef.value = requestAnimationFrame(raf)

    lenisRef.value = lenis
    return lenis
  }
}

const containerStyles = computed((): Record<string, any> => {
  if (props.useWindowScroll) {
    return {
      overscrollBehavior: 'contain',
      WebkitOverflowScrolling: 'touch',
      WebkitTransform: 'translateZ(0)',
      transform: 'translateZ(0)'
    }
  } else {
    return {
      overscrollBehavior: 'contain',
      WebkitOverflowScrolling: 'touch',
      scrollBehavior: 'smooth',
      WebkitTransform: 'translateZ(0)',
      transform: 'translateZ(0)',
      willChange: 'scroll-position'
    }
  }
})

const containerClassName = computed(() => {
  if (props.useWindowScroll) {
    return `relative w-full ${props.className}`.trim()
  } else {
    return `relative w-full h-full overflow-y-auto overflow-x-visible ${props.className}`.trim()
  }
})

onMounted(() => {
  const scroller = scrollerRef.value
  if (!scroller) return

  const cards = Array.from(
    props.useWindowScroll
      ? document.querySelectorAll('.scroll-stack-card')
      : scroller.querySelectorAll('.scroll-stack-card')
  ) as HTMLElement[]

  cardsRef.value = cards

  cards.forEach((card, i) => {
    if (i < cards.length - 1) {
      card.style.marginBottom = `${props.itemDistance}px`
    }
    card.style.willChange = 'transform'
    card.style.transformOrigin = 'top center'
    card.style.backfaceVisibility = 'hidden'
    card.style.transform = 'translate3d(0, 0, 0)'
    card.style.webkitTransform = 'translate3d(0, 0, 0)'
    card.style.contain = 'layout style paint'
  })

  setupLenis()
  updateCardTransforms()
})

onUnmounted(() => {
  if (animationFrameRef.value) {
    cancelAnimationFrame(animationFrameRef.value)
  }
  if (lenisRef.value) {
    lenisRef.value.destroy()
  }
  stackCompletedRef.value = false
  cardsRef.value = []
  lastTransformsRef.value.clear()
})
</script>

