// stores/useRecipeStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Recipe } from '@/types'
import recipesData from '@/data/recipes.json'

export const useRecipeStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>(recipesData)
  const favorites = ref<Recipe[]>([])

  const addToFavorites = (recipe: Recipe) => {
    if (!favorites.value.some(fav => fav.id === recipe.id)) {
      favorites.value.push(recipe)
      localStorage.setItem('favoriteRecipes', JSON.stringify(favorites.value))
    }
  }

  const removeFromFavorites = (recipeId: string) => {
    favorites.value = favorites.value.filter(fav => fav.id !== recipeId)
    localStorage.setItem('favoriteRecipes', JSON.stringify(favorites.value))
  }

  // 初始化时从localStorage恢复收藏
  const loadFavorites = () => {
    const saved = localStorage.getItem('favoriteRecipes')
    if (saved) {
      try {
        favorites.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to load favorites:', e)
      }
    }
  }

  // AI搜索功能
  const searchRecipes = async (query: string): Promise<Recipe[]> => {
    try {
      // 获取API配置
      const apiUrl = import.meta.env.VITE_AI_API_URL
      const apiKey = import.meta.env.VITE_AI_API_KEY
      const timeout = parseInt(import.meta.env.VITE_AI_API_TIMEOUT || '10000')

      if (!apiUrl || !apiKey) {
        console.warn('AI API配置不完整，使用本地搜索')
        return localSearch(query)
      }

      // 准备OpenRouter API格式的请求数据
      const recipesData = recipes.value.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        cuisine: recipe.cuisine,
        ingredients: recipe.ingredients,
        flavor: recipe.flavor,
        difficulty: recipe.difficulty,
        cookingTime: recipe.cookingTime,
        description: recipe.description
      }))

      const userHistory = JSON.parse(localStorage.getItem('foodHistory') || '[]')
      
      const searchData = {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `你是一个专业的美食推荐助手。根据用户输入的关键词，从提供的菜谱数据中推荐最合适的菜品。

可用菜谱数据：
${JSON.stringify(recipesData, null, 2)}

用户历史偏好：
${JSON.stringify(userHistory, null, 2)}

匹配规则：
1. 菜名完全匹配：100分
2. 食材匹配：80分  
3. 口味匹配：70分
4. 菜系匹配：60分
5. 难度匹配：50分

优先推荐：
- 简单易做的菜谱
- 制作时间短的菜谱
- 食材常见的菜谱
- 用户历史偏好的菜系

请返回JSON格式的结果，包含recipe_id、match_score和match_reason。`
          },
          {
            role: "user",
            content: `用户搜索关键词：${query}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }

      // 调用AI API
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(searchData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }

      const data = await response.json()
      
      // 处理OpenRouter Chat Completions API的响应
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content
        
        try {
          // 尝试解析AI返回的JSON
          const aiResults = JSON.parse(aiResponse)
          
          if (Array.isArray(aiResults)) {
            return aiResults
              .map((aiResult: any) => {
                const recipe = recipes.value.find(r => r.id === aiResult.recipe_id)
                return recipe ? { ...recipe, matchScore: aiResult.match_score || 0 } : null
              })
              .filter((recipe): recipe is Recipe & { matchScore: number } => recipe !== null)
              .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
          }
        } catch (parseError) {
          console.warn('AI返回的不是有效JSON，尝试文本解析:', parseError)
          
          // 如果AI返回的不是JSON，尝试从文本中提取菜谱ID
          const recipeIds = aiResponse.match(/"recipe_id":\s*"([^"]+)"/g)
          if (recipeIds) {
            return recipeIds
              .map((match: string) => {
                const id = match.match(/"recipe_id":\s*"([^"]+)"/)?.[1]
                return recipes.value.find(r => r.id === id)
              })
              .filter((recipe: Recipe | undefined): recipe is Recipe => recipe !== undefined)
              .slice(0, 5) // 限制结果数量
          }
        }
      }

      console.warn('AI API返回格式不正确，使用本地搜索')
      return localSearch(query)
    } catch (error) {
      console.error('AI搜索失败:', error)
      // 降级到本地搜索
      return localSearch(query)
    }
  }

  // 本地搜索降级方案
  const localSearch = (query: string): Recipe[] => {
    const keywords = query.toLowerCase().split(' ')
    
    return recipes.value
      .map(recipe => {
        const searchText = [
          recipe.name,
          recipe.cuisine,
          recipe.flavor,
          recipe.description,
          recipe.difficulty,
          ...recipe.ingredients
        ].join(' ').toLowerCase()
        
        // 计算匹配分数
        let score = 0
        keywords.forEach(keyword => {
          if (recipe.name.toLowerCase().includes(keyword)) score += 10
          if (recipe.cuisine.toLowerCase().includes(keyword)) score += 8
          if (recipe.flavor.toLowerCase().includes(keyword)) score += 6
          if (recipe.description.toLowerCase().includes(keyword)) score += 4
          if (recipe.ingredients.some(ing => ing.toLowerCase().includes(keyword))) score += 5
          if (recipe.difficulty.toLowerCase().includes(keyword)) score += 3
        })
        
        return { ...recipe, matchScore: score }
      })
      .filter(recipe => recipe.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10) // 限制结果数量
  }

  return {
    recipes,
    favorites,
    addToFavorites,
    removeFromFavorites,
    loadFavorites,
    searchRecipes
  }
})