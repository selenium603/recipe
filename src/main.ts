import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import './assets/main.css'
import 'lenis/dist/lenis.css'
import recipes from '@/data/recipes.json'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// 暴露所有菜谱到 localStorage，供收藏夹视图快速匹配
try {
  localStorage.setItem('allRecipes', JSON.stringify(recipes))
} catch {}