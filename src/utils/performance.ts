// 性能优化工具函数

/**
 * 防抖函数 - 延迟执行，多次触发只执行最后一次
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = window.setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数 - 限制执行频率
 * @param fn 要执行的函数
 * @param delay 时间间隔（毫秒）
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * RequestAnimationFrame 节流
 * 确保回调在每一帧只执行一次
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  return function(this: any, ...args: Parameters<T>) {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args)
      rafId = null
    })
  }
}

/**
 * 懒加载图片/组件观察器
 */
export function createLazyObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.01,
    ...options
  }
  
  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry)
      }
    })
  }, defaultOptions)
}

/**
 * 内存清理辅助函数
 */
export function cleanupResources(...cleanupFns: (() => void)[]) {
  return () => {
    cleanupFns.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.warn('Cleanup error:', error)
      }
    })
  }
}

