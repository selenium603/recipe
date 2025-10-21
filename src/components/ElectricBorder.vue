<template>
  <div 
    ref="rootRef" 
    :class="['relative isolate', className]" 
    :style="style"
  >
    <!-- Hidden SVG for filter definition -->
    <svg
      ref="svgRef"
      class="fixed -left-[10000px] -top-[10000px] w-[10px] h-[10px] opacity-[0.001] pointer-events-none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter 
          :id="filterId" 
          color-interpolation-filters="sRGB" 
          x="-20%" 
          y="-20%" 
          width="140%" 
          height="140%"
        >
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
          <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
            <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
          <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
            <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
          <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
            <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
          <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
            <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
          <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
          <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="combinedNoise"
            scale="30"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </defs>
    </svg>

    <!-- Border layers -->
    <div class="absolute inset-0 pointer-events-none" :style="inheritRadius">
      <div ref="strokeRef" class="absolute inset-0 box-border" :style="strokeStyle" />
      <div class="absolute inset-0 box-border" :style="glow1Style" />
      <div class="absolute inset-0 box-border" :style="glow2Style" />
      <div class="absolute inset-0" :style="bgGlowStyle" />
    </div>

    <!-- Content -->
    <div class="relative" :style="inheritRadius">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  color?: string
  speed?: number
  chaos?: number
  thickness?: number
  className?: string
  style?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  color: '#5227FF',
  speed: 1,
  chaos: 1,
  thickness: 2,
  className: '',
  style: () => ({})
})

const rootRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGElement | null>(null)
const strokeRef = ref<HTMLElement | null>(null)
const filterId = ref(`turbulent-displace-${Math.random().toString(36).substring(2, 9)}`)

let resizeObserver: ResizeObserver | null = null

function hexToRgba(hex: string, alpha = 1): string {
  if (!hex) return `rgba(0,0,0,${alpha})`
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('')
  }
  const int = parseInt(h, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const updateAnim = () => {
  const svg = svgRef.value
  const host = rootRef.value
  if (!svg || !host) return

  if (strokeRef.value) {
    strokeRef.value.style.filter = `url(#${filterId.value})`
  }

  const width = Math.max(1, Math.round(host.clientWidth || host.getBoundingClientRect().width || 0))
  const height = Math.max(1, Math.round(host.clientHeight || host.getBoundingClientRect().height || 0))

  const dyAnims = Array.from(svg.querySelectorAll('feOffset > animate[attributeName="dy"]'))
  if (dyAnims.length >= 2) {
    dyAnims[0]?.setAttribute('values', `${height}; 0`)
    dyAnims[1]?.setAttribute('values', `0; -${height}`)
  }

  const dxAnims = Array.from(svg.querySelectorAll('feOffset > animate[attributeName="dx"]'))
  if (dxAnims.length >= 2) {
    dxAnims[0]?.setAttribute('values', `${width}; 0`)
    dxAnims[1]?.setAttribute('values', `0; -${width}`)
  }

  const baseDur = 6
  const dur = Math.max(0.001, baseDur / (props.speed || 1))
  ;[...dyAnims, ...dxAnims].forEach(a => a.setAttribute('dur', `${dur}s`))

  const disp = svg.querySelector('feDisplacementMap')
  if (disp) disp.setAttribute('scale', String(30 * (props.chaos || 1)))

  const filterEl = svg.querySelector(`#${CSS.escape(filterId.value)}`)
  if (filterEl) {
    filterEl.setAttribute('x', '-200%')
    filterEl.setAttribute('y', '-200%')
    filterEl.setAttribute('width', '500%')
    filterEl.setAttribute('height', '500%')
  }

  requestAnimationFrame(() => {
    ;[...dyAnims, ...dxAnims].forEach(a => {
      const animEl = a as SVGAnimateElement
      if (typeof animEl.beginElement === 'function') {
        try {
          animEl.beginElement()
        } catch {
          console.warn('ElectricBorder: beginElement failed')
        }
      }
    })
  })
}

const inheritRadius = computed(() => ({
  borderRadius: props.style?.borderRadius ?? 'inherit'
}))

const strokeStyle = computed(() => ({
  ...inheritRadius.value,
  borderWidth: `${props.thickness}px`,
  borderStyle: 'solid',
  borderColor: props.color
}))

const glow1Style = computed(() => ({
  ...inheritRadius.value,
  borderWidth: `${props.thickness}px`,
  borderStyle: 'solid',
  borderColor: hexToRgba(props.color, 0.6),
  filter: `blur(${0.5 + props.thickness * 0.25}px)`,
  opacity: 0.5
}))

const glow2Style = computed(() => ({
  ...inheritRadius.value,
  borderWidth: `${props.thickness}px`,
  borderStyle: 'solid',
  borderColor: props.color,
  filter: `blur(${2 + props.thickness * 0.5}px)`,
  opacity: 0.5
}))

const bgGlowStyle = computed(() => ({
  ...inheritRadius.value,
  transform: 'scale(1.08)',
  filter: 'blur(32px)',
  opacity: 0.3,
  zIndex: -1,
  background: `linear-gradient(-30deg, ${hexToRgba(props.color, 0.8)}, transparent, ${props.color})`
}))

onMounted(() => {
  if (rootRef.value) {
    resizeObserver = new ResizeObserver(() => updateAnim())
    resizeObserver.observe(rootRef.value)
    updateAnim()
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

watch(() => [props.speed, props.chaos], () => {
  updateAnim()
})
</script>

<style scoped>
.isolate {
  isolation: isolate;
}
</style>

