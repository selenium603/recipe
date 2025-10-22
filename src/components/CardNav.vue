<template>
  <div 
    class="card-nav-container fixed left-1/2 -translate-x-1/2 w-[90%] max-w-7xl z-[99] top-[0.5em] md:top-[0.8em]"
  >
    <nav
      ref="navRef"
      :class="['card-nav block h-[60px] p-0 rounded-xl shadow-md relative overflow-hidden', isExpanded ? 'open' : '']"
      :style="{ backgroundColor: baseColor }"
    >
      <!-- Top Bar -->
      <div class="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-[1.1rem] z-[2]">
        <!-- Hamburger Menu -->
        <div
          :class="['hamburger-menu group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none', isHamburgerOpen ? 'open' : '']"
          @click="toggleMenu"
          role="button"
          :aria-label="isExpanded ? '关闭菜单' : '打开菜单'"
          tabindex="0"
          @keydown.enter="toggleMenu"
          @keydown.space.prevent="toggleMenu"
          :style="{ color: menuColor || '#000' }"
        >
          <div
            :class="['hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-200 ease-out origin-center group-hover:opacity-75', isHamburgerOpen ? 'translate-y-[4px] rotate-45' : '']"
          />
          <div
            :class="['hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-200 ease-out origin-center group-hover:opacity-75', isHamburgerOpen ? '-translate-y-[4px] -rotate-45' : '']"
          />
        </div>

        <!-- Logo -->
        <div class="logo-container flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none">
          <h1 class="text-xl font-bold select-none">🍱 今天吃什么？</h1>
        </div>
      </div>

      <!-- Expanded Content -->
      <div
        :class="['card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] md:flex-row md:items-center md:gap-3', isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none']"
        :aria-hidden="!isExpanded"
      >
        <div
          v-for="(item, idx) in items"
          :key="`${item.label}-${idx}`"
          :ref="el => setCardRef(idx, el)"
          class="nav-card select-none relative flex items-center justify-center px-4 py-3 rounded-lg min-w-0 h-[50px] cursor-pointer transition-all duration-200 ease-out hover:opacity-90 hover:scale-[1.02]"
          :style="{ backgroundColor: item.bgColor, color: item.textColor, flex: item.flex ? `${item.flex} 1 auto` : '1 1 auto' }"
          @click="navigateTo(item.route)"
        >
          <div class="nav-card-label font-medium text-base whitespace-nowrap">
            {{ item.label }}
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { gsap } from 'gsap'

interface NavLink {
  label: string
}

interface NavItem {
  label: string
  bgColor: string
  textColor: string
  route: string
  links: NavLink[]
  flex?: number
}

interface Props {
  items: NavItem[]
  baseColor?: string
  menuColor?: string
  buttonBgColor?: string
  buttonTextColor?: string
  ease?: string
}

const props = withDefaults(defineProps<Props>(), {
  baseColor: '#fff',
  menuColor: '#000',
  buttonBgColor: '#111',
  buttonTextColor: '#fff',
  ease: 'power3.out'
})

const router = useRouter()
const route = useRoute()

const isHamburgerOpen = ref(false)
const isExpanded = ref(false)
const navRef = ref<HTMLElement | null>(null)
const cardsRef = ref<(HTMLElement | null)[]>([])
const tlRef = ref<gsap.core.Timeline | null>(null)

const setCardRef = (idx: number, el: any) => {
  if (el && el instanceof HTMLElement) {
    cardsRef.value[idx] = el
  }
}

const calculateHeight = () => {
  const navEl = navRef.value
  if (!navEl) return 130

  const isMobile = window.matchMedia('(max-width: 768px)').matches
  if (isMobile) {
    const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement
    if (contentEl) {
      const wasVisible = contentEl.style.visibility
      const wasPointerEvents = contentEl.style.pointerEvents
      const wasPosition = contentEl.style.position
      const wasHeight = contentEl.style.height

      contentEl.style.visibility = 'visible'
      contentEl.style.pointerEvents = 'auto'
      contentEl.style.position = 'static'
      contentEl.style.height = 'auto'

      // Force reflow
      contentEl.offsetHeight

      const topBar = 60
      const padding = 16
      const contentHeight = contentEl.scrollHeight

      contentEl.style.visibility = wasVisible
      contentEl.style.pointerEvents = wasPointerEvents
      contentEl.style.position = wasPosition
      contentEl.style.height = wasHeight

      return topBar + contentHeight + padding
    }
  }
  return 130
}

const createTimeline = () => {
  const navEl = navRef.value
  if (!navEl) return null

  gsap.set(navEl, { height: 60, overflow: 'hidden' })
  gsap.set(cardsRef.value, { y: 30, opacity: 0 })

  const tl = gsap.timeline({ paused: true })

  tl.to(navEl, {
    height: calculateHeight,
    duration: 0.25,
    ease: 'power2.out'
  })

  tl.to(cardsRef.value, { y: 0, opacity: 1, duration: 0.2, ease: 'power2.out', stagger: 0.03 }, '-=0.15')

  return tl
}

const toggleMenu = () => {
  const tl = tlRef.value
  if (!tl) return
  if (!isExpanded.value) {
    isHamburgerOpen.value = true
    isExpanded.value = true
    tl.play(0)
  } else {
    isHamburgerOpen.value = false
    tl.eventCallback('onReverseComplete', () => {
      isExpanded.value = false
    })
    tl.reverse()
  }
}

const navigateTo = (path: string) => {
  router.push(path)
  // Close menu after navigation
  setTimeout(() => {
    if (isExpanded.value) {
      toggleMenu()
    }
  }, 200)
}

const handleResize = () => {
  if (!tlRef.value) return

  if (isExpanded.value) {
    const newHeight = calculateHeight()
    gsap.set(navRef.value, { height: newHeight })

    tlRef.value.kill()
    const newTl = createTimeline()
    if (newTl) {
      newTl.progress(1)
      tlRef.value = newTl
    }
  } else {
    tlRef.value.kill()
    const newTl = createTimeline()
    if (newTl) {
      tlRef.value = newTl
    }
  }
}

onMounted(() => {
  const tl = createTimeline()
  tlRef.value = tl

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  tlRef.value?.kill()
  tlRef.value = null
  window.removeEventListener('resize', handleResize)
})

// Watch route changes to close menu
watch(() => route.path, () => {
  if (isExpanded.value) {
    toggleMenu()
  }
})
</script>

<style scoped>
.card-nav {
  will-change: height;
}

.hamburger-line {
  transform-origin: 50% 50%;
}
</style>

