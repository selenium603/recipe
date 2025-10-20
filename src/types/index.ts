// types/index.ts
export interface Recipe {
  id: string
  name: string
  cuisine: string
  emoji: string
  ingredients: string[]
  cookingTime: number
  difficulty: string
  flavor: string
  description: string
  steps: RecipeStep[]
  tips?: string[]
  comment: string
}

export interface RecipeStep {
  step: number
  description: string
  time?: number
  temperature?: string
}

export interface NutritionAnalysis {
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

export interface WinePairing {
  type: string
  name: string
  description: string
  reason: string
}