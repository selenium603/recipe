import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Collections from '@/views/Collections.vue'
import Search from '@/views/Search.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/collections',
    name: 'Collections',
    component: Collections
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router