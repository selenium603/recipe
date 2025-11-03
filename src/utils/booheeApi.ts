// 薄荷健康API工具类
import MD5 from 'crypto-js/md5'
import type {
  BooheeAccessTokenResponse,
  BooheeFoodDetailResponse,
  BooheeApiError
} from '@/types/boohee-api'

// 开发环境使用代理，生产环境直接调用API
// 注意：使用代理时，API_BASE_URL不包含 /api 前缀，因为代理会自动处理
const API_BASE_URL = import.meta.env.DEV 
  ? '/api/boohee'  // 开发环境使用Vite代理
  : 'https://fc.boohee.com'  // 生产环境直接调用
// 根据API文档，AppID应该是从注册后获取的，这里使用提供的值
const APP_ID = '48cf6cdb7c'
// AppKey用于签名计算，不应该在请求中发送
// 注意：请确认这个AppKey是否正确，如果不正确会导致"非法sign值"错误
const APP_KEY = '1780f13c9178e455f5ea875dc4783660'

// 验证配置是否正确（AppKey应该是32位十六进制字符串）
if (APP_KEY.length !== 32 && import.meta.env.DEV) {
  console.warn('⚠️ 警告: APP_KEY长度不是32位，可能导致签名错误')
}
const TOKEN_STORAGE_KEY = 'boohee_access_token'
const TOKEN_EXPIRY_KEY = 'boohee_token_expiry'

// 常见食物名称到code的映射表
const commonFoodsMap: Record<string, string> = {
  // 水果类
  '苹果': 'pingguo_junzhi',
  '香蕉': 'xiangjiao_junzhi',
  '橙子': 'chengzi_junzhi',
  '葡萄': 'putao_junzhi',
  '草莓': 'caomei_junzhi',
  '西瓜': 'xigua_junzhi',
  '梨': 'li_junzhi',
  '桃子': 'taozi_junzhi',
  
  // 常见菜品
  '番茄炒蛋': 'fanqiechaodan',
  '宫保鸡丁': 'gongbaojiding',
  '麻婆豆腐': 'mapodoufu',
  '糖醋里脊': 'tangculiji',
  '红烧肉': 'hongshaorou',
  '鱼香肉丝': 'yuxiangrousi',
  '青椒土豆丝': 'qingjiaotudousi',
  '西红柿鸡蛋': 'fanqiechaodan',
  
  // 主食类
  '米饭': 'mifan',
  '面条': 'miantiao',
  '饺子': 'jiaozi',
  '包子': 'baozi',
  '馒头': 'mantou',
  
  // 蔬菜类
  '番茄': 'fanqie',
  '土豆': 'tudou',
  '白菜': 'baicai',
  '青菜': 'qingcai',
  '胡萝卜': 'huluobo',
  '黄瓜': 'huanggua',
  '茄子': 'qiezi',
  
  // 肉类
  '鸡胸肉': 'jixiongru',
  '牛肉': 'niurou',
  '猪肉': 'zhurou',
  '鱼肉': 'yurou',
  
  // 其他
  '鸡蛋': 'jidan',
  '牛奶': 'niunai',
  '豆浆': 'doujiang',
  '酸奶': 'suannai'
}

/**
 * 生成Sign签名（根据薄荷健康API文档的签名算法）
 * 
 * 算法步骤（根据API文档）：
 * 1. 对所有请求参数按照键名进行正序排序（app_key不参与排序）
 * 2. 循环对每个键值进行拼接处理：key1+value1+key2+value2+...
 *    注意：直接拼接，没有=和&分隔符
 * 3. 将app_key拼接在字符串的前面和后面：app_key + 字符串 + app_key
 * 4. 对拼接后的字符串进行MD5加密，得到32位小写MD5值
 */
function generateSign(params: Record<string, any>, appKey: string): string {
  // 第一步：过滤并排序参数（不包括sign本身、app_key和空值）
  const sortedKeys = Object.keys(params)
    .filter(key => 
      key !== 'sign' && 
      key !== 'app_key' && // app_key不参与排序和拼接
      params[key] !== null && 
      params[key] !== undefined
    )
    .sort() // 按键名正序排序
  
  // 第二步：循环对每个键值进行拼接处理
  // 格式：key1+value1+key2+value2+...（直接拼接，没有分隔符）
  const paramString = sortedKeys
    .map(key => {
      const value = params[key]
      // 直接拼接键和值，转换为字符串
      return `${key}${String(value)}`
    })
    .join('') // 注意：直接join，没有分隔符
  
  // 第三步：将app_key拼接在字符串的前面和后面
  const signString = `${appKey}${paramString}${appKey}`
  
  // 第四步：MD5加密并转为小写
  const md5Hash = MD5(signString).toString()
  const finalSign = md5Hash.toLowerCase()
  
  return finalSign
}

/**
 * 获取缓存的access_token
 */
function getCachedToken(): { token: string; expiredAt: number } | null {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    
    if (token && expiry) {
      const expiredAt = new Date(expiry).getTime()
      return { token, expiredAt }
    }
  } catch (e) {
    // 静默处理缓存读取失败
  }
  return null
}

/**
 * 缓存access_token
 */
function cacheToken(token: string, expiredAt: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiredAt)
  } catch (e) {
    // 静默处理缓存写入失败
  }
}

/**
 * 检查token是否过期或即将过期（提前5分钟刷新）
 */
function isTokenExpired(expiredAt: number): boolean {
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000
  return now >= (expiredAt - fiveMinutes)
}

/**
 * 获取access_token
 */
export async function getAccessToken(): Promise<string> {
  // 1. 检查缓存
  const cached = getCachedToken()
  if (cached && !isTokenExpired(cached.expiredAt)) {
    return cached.token
  }
  
  // 2. 获取新token
  // 注意：timestamp必须是Unix时间戳（秒级），不是毫秒
  // 根据API文档，timestamp应该是整数（秒级Unix时间戳）
  const timestamp = Math.floor(Date.now() / 1000)
  
  // 验证时间戳是否合理
  // 正常的Unix时间戳应该在2000-2100年之间（946684800 - 4102444800）
  const MIN_TIMESTAMP = 946684800 // 2000-01-01
  const MAX_TIMESTAMP = 4102444800 // 2100-01-01
  
  if (timestamp < MIN_TIMESTAMP || timestamp > MAX_TIMESTAMP) {
    throw new Error(`时间戳无效: ${timestamp} (对应时间: ${new Date(timestamp * 1000).toLocaleString('zh-CN')})`)
  }
  
  // 确保参数类型正确：app_id是字符串，timestamp是数字
  // 注意：根据API文档示例，timestamp在签名时作为数字拼接，但在请求中可能需要是字符串
  const params: Record<string, any> = {
    app_id: String(APP_ID),  // 确保是字符串
    timestamp: timestamp      // 确保是数字（用于签名计算）
  }
  
  // 生成sign（在添加sign之前）
  const sign = generateSign(params, APP_KEY)
  
  // 添加sign到参数中
  params.sign = sign
  
  try {
    // 根据API文档，使用表单数据格式
    // 注意：timestamp在表单中应该是字符串，但签名计算时用的是数字
    const formData = new URLSearchParams()
    formData.append('app_id', String(params.app_id))
    formData.append('timestamp', String(params.timestamp)) // 表单中转换为字符串
    formData.append('sign', params.sign)
    
    // 验证timestamp格式（确保是合理的Unix时间戳）
    const timestampValue = Number(params.timestamp)
    if (isNaN(timestampValue) || timestampValue < 1000000000 || timestampValue > 9999999999) {
      throw new Error(`无效的时间戳: ${params.timestamp}`)
    }
    
    // 验证：确保参数值正确
    if (!params.app_id || !params.timestamp || !params.sign) {
      throw new Error('请求参数不完整')
    }
    
    // 构建完整的URL（代理会处理路径重写）
    const fullUrl = `${API_BASE_URL}/api/v2/access_tokens`
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })
    
    if (!response.ok) {
      // 尝试解析错误响应
      let errorMessage = `HTTP ${response.status}`
      let errorCode = null
      try {
        const errorText = await response.text()
        
        // 尝试解析为JSON
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
          
          // 提取错误信息（根据API返回格式调整）
          if (errorData.error) {
            if (typeof errorData.error === 'object') {
              errorCode = errorData.error.code
              errorMessage = errorData.error.message || String(errorData.error.code) || JSON.stringify(errorData.error)
            } else {
              errorMessage = errorData.error
            }
          } else if (errorData.message) {
            errorMessage = errorData.message
          } else {
            errorMessage = JSON.stringify(errorData)
          }
        } catch {
          errorData = { raw: errorText }
          errorMessage = errorText
        }
        
      } catch (e) {
        // 静默处理错误解析失败
      }
      
      throw new Error(`Failed to get access token: ${response.status} - ${errorMessage}${errorCode ? ` (错误码: ${errorCode})` : ''}`)
    }
    
    const data: BooheeAccessTokenResponse = await response.json()
    
    // 缓存token
    cacheToken(data.access_token, data.expired_at)
    
    return data.access_token
  } catch (error) {
    throw error
  }
}

/**
 * 刷新access_token（如果过期）
 */
export async function refreshAccessToken(): Promise<string> {
  const cached = getCachedToken()
  
  if (!cached || isTokenExpired(cached.expiredAt)) {
    return await getAccessToken()
  }
  
  return cached.token
}

/**
 * 根据食物名称搜索对应的code
 * 优先使用本地映射表，如果找不到则返回null
 */
export function searchFoodByName(foodName: string): string | null {
  const normalizedName = foodName.trim()
  
  // 精确匹配
  if (commonFoodsMap[normalizedName]) {
    return commonFoodsMap[normalizedName]
  }
  
  // 模糊匹配（包含关系）
  for (const [key, code] of Object.entries(commonFoodsMap)) {
    if (key.includes(normalizedName) || normalizedName.includes(key)) {
      return code
    }
  }
  
  return null
}

/**
 * 使用API搜索食物（如果API支持）
 * 目前使用本地映射表作为降级方案
 */
export async function searchFoodByAPI(keyword: string): Promise<string | null> {
  // 暂时使用本地映射表
  // 如果有API搜索接口，可以在这里实现
  // 例如：POST /api/v3/foods/search?keyword=xxx
  return searchFoodByName(keyword)
}

/**
 * 获取食物详细信息
 */
export async function getFoodDetail(code: string): Promise<BooheeFoodDetailResponse> {
  // 确保token有效
  const token = await refreshAccessToken()
  
  try {
    // 构建完整的URL
    const fullUrl = `${API_BASE_URL}/api/v3/foods/${code}`
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'AccessToken': token,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('食物不存在')
      }
      
      const errorData: BooheeApiError = await response.json().catch(() => ({}))
      throw new Error(`Failed to get food detail: ${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`)
    }
    
    const data: BooheeFoodDetailResponse = await response.json()
    return data
  } catch (error) {
    throw error
  }
}

/**
 * 搜索食物并获取详情（组合函数）
 */
export async function searchFoodAndGetDetail(foodName: string): Promise<BooheeFoodDetailResponse | null> {
  try {
    // 1. 根据名称查找code（优先使用API，如果支持的话）
    const code = await searchFoodByAPI(foodName)
    
    if (!code) {
      return null
    }
    
    // 2. 获取详情
    const detail = await getFoodDetail(code)
    return detail
  } catch (error) {
    // 如果是网络错误，提供更友好的提示
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('网络请求失败，请检查网络连接或API服务是否可用。如果使用开发环境，请确保Vite代理配置正确。')
    }
    throw error
  }
}

