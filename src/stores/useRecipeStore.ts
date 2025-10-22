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
      const aiModel = import.meta.env.VITE_AI_MODEL || 'openai/gpt-3.5-turbo'
      const timeout = parseInt(import.meta.env.VITE_AI_API_TIMEOUT || '10000')

      if (!apiUrl || !apiKey) {
        console.warn('AI API配置不完整，使用本地搜索')
        return localSearch(query)
      }
      
      console.log('🤖 AI搜索配置:')
      console.log('  - API URL:', apiUrl)
      console.log('  - 模型:', aiModel)
      console.log('  - 查询:', query)

      // AI生成菜谱模式
      const searchData = {
        model: aiModel,
        messages: [
          {
            role: "system",
            content: `你是一个专业的菜谱生成助手。根据用户的搜索关键词，生成3-4个相关的详细菜谱。

重要：只返回纯JSON数组，不要任何解释或markdown标记。

返回格式：
[
  {
    "name": "菜名（中文）",
    "cuisine": "菜系（如：川菜/粤菜/家常菜/湘菜等）",
    "emoji": "合适的食物emoji",
    "ingredients": ["食材1", "食材2", "食材3", "食材4", "食材5"],
    "cookingTime": 30,
    "difficulty": "简单",
    "flavor": "口味（如：咸鲜/麻辣/酸甜等）",
    "description": "简短描述（中文）",
    "steps": [
      {"step": 1, "description": "详细的第一步操作"},
      {"step": 2, "description": "详细的第二步操作", "time": 5},
      {"step": 3, "description": "详细的第三步操作", "time": 10}
    ],
    "tips": ["烹饪技巧1", "烹饪技巧2"]
  }
]

重要要求：
1. steps必须包含5-8个详细步骤
2. 每个步骤描述要具体可操作，不少于10个字
3. 关键步骤（如：炒、煮、蒸、焖等）必须包含time字段（单位：分钟）
4. tips提供2-3个实用的烹饪技巧
5. ingredients至少5个
6. 所有文字必须是中文
7. cookingTime是总时间（数字，分钟）
8. difficulty只能是：简单/中等/困难
9. 确保JSON格式正确，不要有多余的逗号`
          },
          {
            role: "user",
            content: `请为"${query}"生成详细菜谱，包含完整的烹饪步骤和时间`
          }
        ],
        max_tokens: 3000,
        temperature: 0.8
      }

      // 调用AI API
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      console.log('📡 正在调用AI API...')
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://recipe-app.com',
          'X-Title': 'Recipe App'
        },
        body: JSON.stringify(searchData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('✅ API响应状态:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API错误响应:', errorText)
        throw new Error(`API请求失败: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('📦 AI返回数据:', data)
      
      // 处理OpenRouter Chat Completions API的响应
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content
        console.log('🤖 AI回复内容:', aiResponse)
        
        try {
          // 清理可能的markdown代码块标记
          let cleanedResponse = aiResponse.trim()
          if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
          } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
          }
          
          // 解析AI生成的菜谱
          const aiRecipes = JSON.parse(cleanedResponse)
          console.log('✅ 成功解析AI返回的菜谱:', aiRecipes)
          
          if (Array.isArray(aiRecipes)) {
            // 将AI生成的菜谱转换为Recipe对象
            return aiRecipes.map((recipe: any, index: number) => {
              // 确保steps格式正确
              const steps = Array.isArray(recipe.steps) && recipe.steps.length > 0
                ? recipe.steps.map((s: any, i: number) => ({
                    step: s.step || i + 1,
                    description: s.description || '按照传统方法操作',
                    ...(s.time && { time: s.time })
                  }))
                : [
                    { step: 1, description: '准备所需食材，清洗干净' },
                    { step: 2, description: '按照传统方法进行烹饪', time: 15 },
                    { step: 3, description: '调味并装盘', time: 2 }
                  ]

              return {
                id: `ai-${Date.now()}-${index}`,
                name: recipe.name || '未命名菜品',
                cuisine: recipe.cuisine || '其他',
                emoji: recipe.emoji || '🍽️',
                ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
                  ? recipe.ingredients
                  : ['主要食材', '调料', '辅料'],
                cookingTime: recipe.cookingTime || 30,
                difficulty: recipe.difficulty || '中等',
                flavor: recipe.flavor || '咸鲜',
                description: recipe.description || '美味可口的家常菜',
                steps: steps,
                tips: Array.isArray(recipe.tips) && recipe.tips.length > 0
                  ? recipe.tips
                  : ['注意火候', '适量调味']
              } as Recipe
            })
          }
        } catch (parseError) {
          console.error('❌ JSON解析失败:', parseError)
          console.error('AI原始响应:', aiResponse)
        }
      }

      console.warn('⚠️ AI API返回格式不正确，使用本地搜索')
      return localSearch(query)
    } catch (error) {
      console.error('❌ AI搜索失败:', error)
      if (error instanceof Error) {
        console.error('错误详情:', error.message)
      }
      // 降级到本地搜索
      console.log('🔄 降级到本地搜索...')
      return localSearch(query)
    }
  }

  // 本地搜索降级方案
  const localSearch = (query: string): Recipe[] => {
    let keywords = query.toLowerCase().trim().split(/\s+/)
    
    // 处理带"类"、"菜"等后缀的搜索词
    keywords = keywords.map(keyword => {
      // 如果以"类"、"菜"等结尾，去掉后缀作为额外关键词
      if (keyword.endsWith('类') && keyword.length > 1) {
        return keyword.slice(0, -1) // 去掉"类"字
      }
      if (keyword.endsWith('菜') && keyword.length > 2) {
        return keyword.slice(0, -1) // 去掉"菜"字
      }
      return keyword
    })
    
    return recipes.value
      .map(recipe => {
        let score = 0
        
        keywords.forEach(keyword => {
          // 对于单字关键词，只匹配菜名和菜系（更严格）
          if (keyword.length === 1) {
            if (recipe.name.toLowerCase().includes(keyword)) score += 15
            if (recipe.cuisine.toLowerCase().includes(keyword)) score += 10
          } else {
            // 多字关键词，正常匹配各个字段
            if (recipe.name.toLowerCase() === keyword) score += 25
            if (recipe.name.toLowerCase().includes(keyword)) score += 15
            if (recipe.cuisine.toLowerCase().includes(keyword)) score += 10
            if (recipe.flavor.toLowerCase().includes(keyword)) score += 8
            if (recipe.ingredients.some(ing => ing.toLowerCase().includes(keyword))) score += 6
            // 降低描述的权重，避免匹配到步骤中的"汤汁"等
            if (recipe.description.toLowerCase().includes(keyword)) score += 2
            if (recipe.difficulty.toLowerCase().includes(keyword)) score += 5
          }
        })
        
        return { ...recipe, matchScore: score }
      })
      .filter(recipe => recipe.matchScore > 0)
      .sort((a, b) => {
        // 先按分数排序，分数相同按烹饪时间排序（简单的优先）
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore
        }
        return a.cookingTime - b.cookingTime
      })
      .slice(0, 12)
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