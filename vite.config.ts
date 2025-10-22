import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      script: {
        defineModel: true,
        propsDestructure: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'animation': ['gsap', 'lenis']
        }
      }
    },
    // 压缩优化
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false
      },
      mangle: true,
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'] // 移除特定console方法
      }
    } as any,
    // chunk大小警告阈值
    chunkSizeWarningLimit: 600,  // 降低阈值以提醒优化大文件
    // CSS代码分割
    cssCodeSplit: true,
    // 启用更激进的代码分割
    target: 'esnext',
    // 减小输出大小
    cssMinify: true
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia'],  // 移除未使用的依赖
    exclude: []  // 排除不需要预构建的依赖
  },
  // 性能优化
  server: {
    hmr: {
      overlay: false  // 减少开发环境内存占用
    }
  }
})
