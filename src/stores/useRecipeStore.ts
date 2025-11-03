import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Recipe } from '@/types'
import recipesData from '@/data/recipes.json'
import { SimpleLRUArray, LRUCache } from '@/utils/lruCache'

interface UserProfile {
  cuisinePreferences: Record<string, number>
  flavorPreferences: Record<string, number>
  difficultyPreferences: Record<string, number>
  cookingTimePreferences: Record<string, number>
  ingredientPreferences: Record<string, number>
  clickedRecipes: string[]
  searchKeywords: string[]
  timeScenarios: Record<string, string[]>
  lastUpdated: number
}

export const useRecipeStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>(recipesData)
  const favorites = ref<Recipe[]>([])
  
  const searchKeywordsCache = new SimpleLRUArray<string>(30)
  const clickedRecipesCache = new SimpleLRUArray<string>(100)
  
  const userProfile = ref<UserProfile>({
    cuisinePreferences: {},
    flavorPreferences: {},
    difficultyPreferences: {},
    cookingTimePreferences: {},
    ingredientPreferences: {},
    clickedRecipes: [],
    searchKeywords: [],
    timeScenarios: { '早餐': [], '午餐': [], '晚餐': [], '宵夜': [] },
    lastUpdated: Date.now()
  })

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

  const searchRecipes = async (query: string): Promise<Recipe[]> => {
    try {
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
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content
        console.log('🤖 AI回复内容:', aiResponse)
        
        try {
          let cleanedResponse = aiResponse.trim()
          if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
          } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
          }
          
          const aiRecipes = JSON.parse(cleanedResponse)
          console.log('✅ 成功解析AI返回的菜谱:', aiRecipes)
          
          if (Array.isArray(aiRecipes)) {
            return aiRecipes.map((recipe: any, index: number) => {
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
      console.log('🔄 降级到本地搜索...')
      return localSearch(query)
    }
  }

  const localSearch = (query: string): Recipe[] => {
    let keywords = query.toLowerCase().trim().split(/\s+/)
    
    keywords = keywords.map(keyword => {
      if (keyword.endsWith('类') && keyword.length > 1) {
        return keyword.slice(0, -1)
      }
      if (keyword.endsWith('菜') && keyword.length > 2) {
        return keyword.slice(0, -1)
      }
      return keyword
    })
    
    return recipes.value
      .map(recipe => {
        let score = 0
        
        keywords.forEach(keyword => {
          if (keyword.length === 1) {
            if (recipe.name.toLowerCase().includes(keyword)) score += 15
            if (recipe.cuisine.toLowerCase().includes(keyword)) score += 10
          } else {
            if (recipe.name.toLowerCase() === keyword) score += 25
            if (recipe.name.toLowerCase().includes(keyword)) score += 15
            if (recipe.cuisine.toLowerCase().includes(keyword)) score += 10
            if (recipe.flavor.toLowerCase().includes(keyword)) score += 8
            if (recipe.ingredients.some(ing => ing.toLowerCase().includes(keyword))) score += 6
            if (recipe.description.toLowerCase().includes(keyword)) score += 2
            if (recipe.difficulty.toLowerCase().includes(keyword)) score += 5
          }
        })
        
        return { ...recipe, matchScore: score }
      })
      .filter(recipe => recipe.matchScore > 0)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore
        }
        return a.cookingTime - b.cookingTime
      })
      .slice(0, 12)
  }

  const trackRecipeClick = (recipe: Recipe) => {
    clickedRecipesCache.add(recipe.id)
    userProfile.value.clickedRecipes = clickedRecipesCache.getAll()
    
    userProfile.value.cuisinePreferences[recipe.cuisine] = 
      (userProfile.value.cuisinePreferences[recipe.cuisine] || 0) + 1
    
    userProfile.value.flavorPreferences[recipe.flavor] = 
      (userProfile.value.flavorPreferences[recipe.flavor] || 0) + 1
    
    userProfile.value.difficultyPreferences[recipe.difficulty] = 
      (userProfile.value.difficultyPreferences[recipe.difficulty] || 0) + 1
    
    const timeRange = getTimeRange(recipe.cookingTime)
    userProfile.value.cookingTimePreferences[timeRange] = 
      (userProfile.value.cookingTimePreferences[timeRange] || 0) + 1
    
    recipe.ingredients.forEach(ing => {
      const currentPref = userProfile.value.ingredientPreferences[ing] || 0
      userProfile.value.ingredientPreferences[ing] = Math.min(currentPref + 1, 50)
    })
    
    const timeOfDay = getCurrentTimeScenario()
    if (!userProfile.value.timeScenarios[timeOfDay]) {
      userProfile.value.timeScenarios[timeOfDay] = []
    }
    const scenarios = userProfile.value.timeScenarios[timeOfDay] || []
    const index = scenarios.indexOf(recipe.name)
    if (index > -1) {
      scenarios.splice(index, 1)
    }
    scenarios.push(recipe.name)
    if (scenarios.length > 10) {
      scenarios.shift()
    }
    userProfile.value.timeScenarios[timeOfDay] = scenarios
    
    userProfile.value.lastUpdated = Date.now()
    saveUserProfile()
  }
  
  const trackSearchKeyword = (keyword: string) => {
    if (keyword.trim()) {
      searchKeywordsCache.add(keyword.trim())
      userProfile.value.searchKeywords = searchKeywordsCache.getAll()
      userProfile.value.lastUpdated = Date.now()
      saveUserProfile()
    }
  }
  
  const getTimeRange = (minutes: number): string => {
    if (minutes <= 15) return '15分钟内'
    if (minutes <= 30) return '15-30分钟'
    if (minutes <= 60) return '30-60分钟'
    return '60分钟以上'
  }
  
  const getCurrentTimeScenario = (): string => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 10) return '早餐'
    if (hour >= 10 && hour < 14) return '午餐'
    if (hour >= 14 && hour < 18) return '下午茶'
    if (hour >= 18 && hour < 22) return '晚餐'
    return '宵夜'
  }
  
  const saveUserProfile = () => {
    try {
      localStorage.setItem('userProfile', JSON.stringify(userProfile.value))
    } catch (e) {
      console.warn('Failed to save user profile:', e)
    }
  }
  
  const loadUserProfile = () => {
    const saved = localStorage.getItem('userProfile')
    if (saved) {
      try {
        userProfile.value = JSON.parse(saved)
        
        if (userProfile.value.searchKeywords?.length > 0) {
          userProfile.value.searchKeywords.forEach(keyword => {
            searchKeywordsCache.add(keyword)
          })
        }
        
        if (userProfile.value.clickedRecipes?.length > 0) {
          userProfile.value.clickedRecipes.forEach(recipeId => {
            clickedRecipesCache.add(recipeId)
          })
        }
        
        console.log('✅ 用户画像已加载，LRU缓存已同步')
      } catch (e) {
        console.error('Failed to load user profile:', e)
      }
    }
  }
  
  const getUserProfileSummary = computed(() => {
    const profile = userProfile.value
    
    const topCuisines = Object.entries(profile.cuisinePreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cuisine, count]) => `${cuisine}(${count}次)`)
    
    const topFlavors = Object.entries(profile.flavorPreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([flavor, count]) => `${flavor}(${count}次)`)
    
    const topIngredients = Object.entries(profile.ingredientPreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ing]) => ing)
    
    const topTimeRange = Object.entries(profile.cookingTimePreferences)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '未知'
    
    const topDifficulty = Object.entries(profile.difficultyPreferences)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '未知'
    
    return {
      topCuisines: topCuisines.join('、') || '暂无偏好',
      topFlavors: topFlavors.join('、') || '暂无偏好',
      topIngredients: topIngredients.join('、') || '暂无偏好',
      topTimeRange,
      topDifficulty,
      totalClicks: profile.clickedRecipes.length,
      recentSearches: profile.searchKeywords.slice(-5).reverse()
    }
  })
  
  const preFilterRecipes = (query: string, maxResults: number = 10): Recipe[] => {
    const keywords = query.toLowerCase().trim().split(/\s+/)
    
    const scoredRecipes = recipes.value
      .map(recipe => {
        let score = 0
        
        keywords.forEach(keyword => {
          if (recipe.name.toLowerCase().includes(keyword)) score += 20
          if (recipe.cuisine.toLowerCase().includes(keyword)) score += 15
          if (recipe.flavor.toLowerCase().includes(keyword)) score += 15
          if (recipe.difficulty.toLowerCase().includes(keyword)) score += 10
          if (recipe.ingredients.some(ing => ing.toLowerCase().includes(keyword))) score += 12
          if (recipe.description.toLowerCase().includes(keyword)) score += 5
          
          const cuisinePref = userProfile.value.cuisinePreferences[recipe.cuisine]
          if (cuisinePref) {
            score += cuisinePref * 0.5
          }
          const flavorPref = userProfile.value.flavorPreferences[recipe.flavor]
          if (flavorPref) {
            score += flavorPref * 0.5
          }
        })
        
        if (score > 0) {
          const randomFactor = Math.random() * 5
          score += randomFactor
        }
        
        return { recipe, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
    
    return scoredRecipes.map(item => item.recipe)
  }
  
  const getAIRecommendations = async (userQuery: string = ''): Promise<Recipe[]> => {
    try {
      const apiUrl = import.meta.env.VITE_AI_API_URL
      const apiKey = import.meta.env.VITE_AI_API_KEY
      const aiModel = import.meta.env.VITE_AI_MODEL || 'openai/gpt-3.5-turbo'
      
      if (!apiUrl || !apiKey) {
        console.warn('AI API配置不完整，使用本地推荐')
        return getLocalRecommendations(userQuery)
      }
      
      let candidates: Recipe[] = []
      if (userQuery) {
        candidates = preFilterRecipes(userQuery, 8)
      } else {
        candidates = getPersonalizedCandidates(8)
      }
      
      if (candidates.length === 0) {
        candidates = recipes.value.slice(0, 8)
      }
      
      const candidateSummaries = candidates.map(r => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        flavor: r.flavor,
        cookingTime: r.cookingTime,
        difficulty: r.difficulty,
        ingredients: r.ingredients.slice(0, 5),
        description: r.description
      }))
      
      const profileSummary = getUserProfileSummary.value
      const timeScenario = getCurrentTimeScenario()
      const randomSeed = Date.now()
      
      const systemPrompt = `你是一个专业的私人厨师助手。根据用户画像和候选菜谱，推荐3道最合适的菜品。

用户画像：
- 偏好菜系：${profileSummary.topCuisines}
- 偏好口味：${profileSummary.topFlavors}
- 常用食材：${profileSummary.topIngredients}
- 烹饪时间偏好：${profileSummary.topTimeRange}
- 难度偏好：${profileSummary.topDifficulty}
- 当前时段：${timeScenario}
- 总点击量：${profileSummary.totalClicks}次

候选菜谱：
${JSON.stringify(candidateSummaries, null, 2)}

重要说明：
1. 请从候选菜谱中选择3道最合适的推荐给用户
2. 保持推荐的多样性，不要总是推荐相同的菜品
3. 可以在用户偏好的基础上，适当推荐一些新口味，帮助用户探索
4. 考虑菜系、口味、难度的搭配平衡
5. 随机种子：${randomSeed}（用于增加推荐多样性）

返回JSON格式：
{
  "recommendations": [
    {
      "id": "菜谱ID",
      "name": "菜名",
      "reason": "推荐理由（50字以内，说明为什么适合用户）"
    }
  ]
}

只返回JSON，不要其他内容。`
      
      const userPrompt = userQuery || `请根据我的口味偏好和当前时段（${timeScenario}），推荐3道适合的菜品。`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.9,
          max_tokens: 1000
        })
      })
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }
      
      const data = await response.json()
      const aiResponse = data.choices?.[0]?.message?.content
      
      if (!aiResponse) {
        throw new Error('AI返回格式错误')
      }
      
      let cleanedResponse = aiResponse.trim()
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const result = JSON.parse(cleanedResponse)
      
      const recommendedRecipes = result.recommendations
        .map((rec: any) => {
          const recipe = recipes.value.find(r => r.id === rec.id)
          if (recipe) {
            return {
              ...recipe,
              aiReason: rec.reason
            }
          }
          return null
        })
        .filter(Boolean) as Recipe[]
      
      return recommendedRecipes.slice(0, 3)
      
    } catch (error) {
      console.error('AI推荐失败:', error)
      return getLocalRecommendations(userQuery)
    }
  }
  
  const getLocalRecommendations = (query: string = ''): Recipe[] => {
    if (query) {
      return preFilterRecipes(query, 3)
    }
    return getPersonalizedCandidates(3)
  }
  
  const getPersonalizedCandidates = (count: number): Recipe[] => {
    const profile = userProfile.value
    const timeScenario = getCurrentTimeScenario()
    
    const scoredRecipes = recipes.value
      .map(recipe => {
        let score = 0
        
        score += (profile.cuisinePreferences[recipe.cuisine] || 0) * 3
        score += (profile.flavorPreferences[recipe.flavor] || 0) * 2
        score += (profile.difficultyPreferences[recipe.difficulty] || 0) * 1
        
        recipe.ingredients.forEach(ing => {
          score += (profile.ingredientPreferences[ing] || 0) * 0.5
        })
        
        if (profile.timeScenarios[timeScenario]?.includes(recipe.name)) {
          score += 10
        }
        
        if (profile.clickedRecipes.slice(-5).includes(recipe.id)) {
          score -= 5
        }
        
        const randomFactor = Math.random() * 0.3 * score
        score += randomFactor
        
        return { recipe, score }
      })
      .sort((a, b) => b.score - a.score)
    
    if (profile.clickedRecipes.length === 0) {
      const shuffled = [...recipes.value].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, count)
    }
    
    const topCandidates = scoredRecipes.slice(0, Math.min(20, scoredRecipes.length))
    const shuffled = [...topCandidates].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count).map(item => item.recipe)
  }

  const getAIChatResponseStream = async (
    userQuery: string, 
    onChunk: (text: string) => void
  ): Promise<void> => {
    try {
      const apiUrl = import.meta.env.VITE_AI_API_URL
      const apiKey = import.meta.env.VITE_AI_API_KEY
      const aiModel = import.meta.env.VITE_AI_MODEL || 'openai/gpt-3.5-turbo'
      
      if (!apiUrl || !apiKey) {
        onChunk('抱歉，AI服务暂时不可用。')
        return
      }

      const profileSummary = getUserProfileSummary.value
      
      const systemPrompt = `你是一个专业的厨师助手和营养顾问。

用户画像：
- 已浏览 ${profileSummary.totalClicks} 道菜品
- 偏好菜系：${profileSummary.topCuisines}
- 偏好口味：${profileSummary.topFlavors}

请用简洁、友好的语气回答用户问题。`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuery }
          ],
          temperature: 0.7,
          max_tokens: 300,
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error('AI请求失败')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder('utf-8')
      
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          const trimmedLine = line.trim()
          
          if (trimmedLine === '' || trimmedLine === 'data: [DONE]') {
            continue
          }
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6)
              const data = JSON.parse(jsonStr)
              const content = data.choices[0]?.delta?.content
              
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              console.warn('解析SSE数据失败:', e)
            }
          }
        }
      }
      
    } catch (error) {
      console.error('AI对话失败:', error)
      onChunk('抱歉，出现了一些问题。请稍后再试。')
    }
  }

  return {
    recipes,
    favorites,
    addToFavorites,
    removeFromFavorites,
    loadFavorites,
    searchRecipes,
    userProfile,
    trackRecipeClick,
    trackSearchKeyword,
    getUserProfileSummary,
    saveUserProfile,
    loadUserProfile,
    preFilterRecipes,
    getAIRecommendations,
    getAIChatResponseStream,
    getCurrentTimeScenario
  }
})