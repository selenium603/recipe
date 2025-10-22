import { createRouter, createWebHistory } from 'vue-router'

// 路由懒加载 - 按需加载页面组件，减少初始bundle大小
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/collections',
    name: 'Collections',
    component: () => import('@/views/Collections.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router