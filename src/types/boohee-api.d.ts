// 薄荷健康API类型定义

export interface BooheeAccessTokenResponse {
  access_token: string
  expired_at: string
}

export interface BooheeFood {
  name: string
  code: string
  thumb_image_url?: string
  large_image_url?: string
}

export interface BooheeCaloryItem {
  name_en: string
  name: string
  value: number
  unit_name: string
  percent?: number
}

export interface BooheeNutrientItem {
  name_en: string
  name: string
  value: number
  unit_name: string
  items?: BooheeNutrientItem[]
}

export interface BooheeNutrientCategory {
  name_en: string
  name: string
  value: number
  unit_name: string
  items: BooheeNutrientItem[]
}

export interface BooheeFoodDetailResponse {
  food: BooheeFood
  lights?: string[]
  warnings?: string[]
  calory: BooheeCaloryItem[]
  base_ingredients: BooheeNutrientCategory[]
}

export interface BooheeApiError {
  error?: string
  message?: string
}

