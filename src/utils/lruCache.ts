/**
 * LRU (Least Recently Used) 缓存实现
 * 用于管理有限容量的缓存，自动淘汰最久未使用的项
 */

export interface LRUCacheItem<T> {
  key: string
  value: T
  timestamp: number
  accessCount: number
}

export class LRUCache<T = any> {
  private cache: Map<string, LRUCacheItem<T>>
  private maxSize: number
  private storageKey?: string

  constructor(maxSize: number = 50, storageKey?: string) {
    this.maxSize = maxSize
    this.storageKey = storageKey
    this.cache = new Map()
    
    // 如果提供了storageKey，从localStorage加载
    if (storageKey) {
      this.loadFromStorage()
    }
  }

  /**
   * 获取缓存项
   */
  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    // 更新访问信息
    item.timestamp = Date.now()
    item.accessCount++
    
    // 将访问的项移到最后（Map保持插入顺序）
    this.cache.delete(key)
    this.cache.set(key, item)
    
    this.saveToStorage()
    return item.value
  }

  /**
   * 设置缓存项
   */
  set(key: string, value: T): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // 如果达到容量上限，删除最久未使用的项
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    // 添加新项
    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 1
    })

    this.saveToStorage()
  }

  /**
   * 检查是否存在
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * 删除指定项
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key)
    this.saveToStorage()
    return result
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    if (this.storageKey) {
      localStorage.removeItem(this.storageKey)
    }
  }

  /**
   * 获取所有值（按最近使用排序）
   */
  getAll(): T[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(item => item.value)
  }

  /**
   * 获取所有键值对
   */
  getAllItems(): LRUCacheItem<T>[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 淘汰最久未使用的项
   */
  private evictLRU(): void {
    // Map的第一项就是最久未访问的（因为每次访问都会移到最后）
    const firstKey = this.cache.keys().next().value
    if (firstKey) {
      this.cache.delete(firstKey)
    }
  }

  /**
   * 保存到localStorage
   */
  private saveToStorage(): void {
    if (!this.storageKey) return

    try {
      const data = {
        items: Array.from(this.cache.entries()),
        maxSize: this.maxSize
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (e) {
      console.warn('LRU Cache save to storage failed:', e)
      // 如果存储失败（可能是容量满了），尝试清理一些旧数据
      if (this.cache.size > 10) {
        const itemsToKeep = Math.floor(this.cache.size * 0.7)
        const entries = Array.from(this.cache.entries()).slice(-itemsToKeep)
        this.cache = new Map(entries)
        this.saveToStorage() // 重试
      }
    }
  }

  /**
   * 从localStorage加载
   */
  private loadFromStorage(): void {
    if (!this.storageKey) return

    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        this.cache = new Map(data.items)
        if (data.maxSize) {
          this.maxSize = data.maxSize
        }
      }
    } catch (e) {
      console.warn('LRU Cache load from storage failed:', e)
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const items = Array.from(this.cache.values())
    const now = Date.now()
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: `${((this.cache.size / this.maxSize) * 100).toFixed(1)}%`,
      totalAccess: items.reduce((sum, item) => sum + item.accessCount, 0),
      avgAge: items.length > 0 
        ? Math.round(items.reduce((sum, item) => sum + (now - item.timestamp), 0) / items.length / 1000) + 's'
        : '0s'
    }
  }
}

/**
 * 创建一个基于数组的简化LRU缓存（适用于简单场景）
 */
export class SimpleLRUArray<T> {
  private items: Array<{ value: T; timestamp: number }>
  private maxSize: number

  constructor(maxSize: number = 20) {
    this.items = []
    this.maxSize = maxSize
  }

  /**
   * 添加项（如果已存在则更新时间戳并移到最后）
   */
  add(value: T, compareFn?: (a: T, b: T) => boolean): void {
    // 查找是否已存在
    const index = this.items.findIndex(item => 
      compareFn ? compareFn(item.value, value) : item.value === value
    )

    // 如果存在，删除旧的
    if (index !== -1) {
      this.items.splice(index, 1)
    }

    // 添加到最后
    this.items.push({
      value,
      timestamp: Date.now()
    })

    // 如果超过容量，删除最旧的
    if (this.items.length > this.maxSize) {
      this.items.shift()
    }
  }

  /**
   * 获取所有值（最新的在前）
   */
  getAll(): T[] {
    return this.items.slice().reverse().map(item => item.value)
  }

  /**
   * 清空
   */
  clear(): void {
    this.items = []
  }

  /**
   * 获取数量
   */
  size(): number {
    return this.items.length
  }
}

