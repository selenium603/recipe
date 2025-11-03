<template>
  <ClickSpark :spark-color="'#ff6b6b'" :spark-size="12" :spark-radius="20" :spark-count="12" :duration="600" easing="ease-out" :extra-scale="1.2">
    <div class="min-h-screen px-2 md:px-6 pt-16 md:pt-20 pb-0 flex flex-col relative">
      <ShaderBackground />
      <EmojiCursor 
        :emojis="['🍎', '🍌', '🥗', '🍲', '🥩', '🍳', '🥛', '🍞']"
        :spacing="200"
        :maxPoints="8"
        :randomFloat="true"
        :followMouseDirection="false"
        :exitDuration="0.2"
        :removalInterval="15"
      />
      <GlobalNavigation />

      <div class="max-w-7xl mx-auto flex-1 w-full pb-8 flex-grow">
        <div class="text-center mb-4 md:mb-6">
          <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg border-4 border-white">
            <span class="text-white text-2xl sm:text-3xl">📊</span>
          </div>
        </div>

        <!-- 搜索区域 -->
        <div class="bg-white border-2 border-[#0A0910] rounded-lg p-4 md:p-6 mb-6 md:mb-8">
          <div class="flex gap-2 mb-4">
            <input
              v-model="searchQuery"
              @keyup.enter="performSearch"
              placeholder="输入食物名称，如：苹果、番茄炒蛋..."
              class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-base md:text-lg"
            />
            <button
              @click="performSearch"
              :disabled="!searchQuery.trim() || isLoading"
              class="px-5 py-3 md:px-8 md:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 disabled:bg-gray-300 transition-colors font-medium text-base md:text-base whitespace-nowrap"
            >
              {{ isLoading ? '查询中...' : '查询' }}
            </button>
          </div>
          
          <!-- 热门食物建议 -->
          <div v-if="!hasSearched && !foodDetail" class="mb-4">
            <div class="text-sm md:text-sm text-gray-600 mb-2">热门查询：</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="suggestion in hotFoods"
                :key="suggestion"
                @click="selectSuggestion(suggestion)"
                class="px-3 py-1.5 md:px-3 md:py-1 bg-gray-100 text-gray-700 rounded-full text-base md:text-sm hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="text-center py-16">
          <div class="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-orange-200 shadow-sm">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
            <span class="text-gray-700 font-medium">正在查询营养信息...</span>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-else-if="error" class="bg-red-50 border-2 border-red-200 rounded-lg p-4 md:p-6 mb-6">
          <div class="flex items-center gap-3">
            <span class="text-2xl">❌</span>
            <div>
              <h3 class="text-lg font-semibold text-red-800 mb-1">查询失败</h3>
              <p class="text-red-600 text-sm">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- 未找到提示 -->
        <div v-else-if="hasSearched && !foodDetail && !isLoading" class="text-center py-16">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">未找到该食物</h3>
          <p class="text-gray-500 mb-6">试试其他食物名称，或点击上方热门查询</p>
        </div>

        <!-- 食物详情展示 -->
        <div v-else-if="foodDetail" class="space-y-6">
          <!-- 食物基础信息卡片 -->
          <div class="bg-white border-2 border-[#0A0910] rounded-lg overflow-hidden shadow-lg">
            <!-- 白色背景头部 -->
            <div class="bg-white p-4 md:p-6">
              <div class="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
                <!-- 菜品图片 -->
                <div v-if="foodDetail.food.thumb_image_url" class="flex-shrink-0">
                  <img 
                    :src="foodDetail.food.thumb_image_url" 
                    :alt="foodDetail.food.name"
                    class="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl border-4 border-gray-200 shadow-lg"
                  />
                </div>
                <!-- 菜品名称和标签 -->
                <div class="flex-1 text-center md:text-left">
                  <h2 class="text-2xl md:text-3xl font-bold text-dark-800 mb-3 md:mb-4">{{ foodDetail.food.name }}</h2>
                  
                  <!-- 标签容器 -->
                  <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                    <!-- 优点标签 -->
                    <span 
                      v-for="light in (foodDetail.lights || [])"
                      :key="light"
                      class="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200 shadow-sm"
                    >
                      ✓ {{ light }}
                    </span>
                    
                    <!-- 警告标签 -->
                    <span 
                      v-for="warning in (foodDetail.warnings || [])"
                      :key="warning"
                      class="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium border border-yellow-300 shadow-sm"
                    >
                      ⚠️ {{ warning }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 图表展示区域 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 饼状图1：热量占比 -->
            <div class="bg-white border-2 border-[#0A0910] rounded-lg p-4 md:p-6">
              <h3 class="text-lg md:text-xl font-bold text-dark-800 mb-4 text-center">热量占比</h3>
              <div ref="caloryChartRef" class="w-full" style="height: 350px;"></div>
            </div>

            <!-- 饼状图2：营养素重量占比 -->
            <div class="bg-white border-2 border-[#0A0910] rounded-lg p-4 md:p-6">
              <h3 class="text-lg md:text-xl font-bold text-dark-800 mb-4 text-center">营养素占比</h3>
              <div ref="nutrientChartRef" class="w-full" style="height: 350px;"></div>
            </div>
          </div>

          <!-- 营养素详细表格 -->
          <div class="bg-white border-2 border-[#0A0910] rounded-lg p-4 md:p-6">
            <h3 class="text-lg md:text-xl font-bold text-dark-800 mb-4">营养素详细信息</h3>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="px-4 py-2 text-left border border-gray-300 font-semibold text-sm md:text-base hover:bg-orange-50 transition-colors">类别</th>
                    <th class="px-4 py-2 text-left border border-gray-300 font-semibold text-sm md:text-base hover:bg-orange-50 transition-colors">名称</th>
                    <th class="px-4 py-2 text-right border border-gray-300 font-semibold text-sm md:text-base hover:bg-orange-50 transition-colors">含量</th>
                    <th class="px-4 py-2 text-left border border-gray-300 font-semibold text-sm md:text-base hover:bg-orange-50 transition-colors">单位</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(category, categoryIndex) in foodDetail.base_ingredients" :key="categoryIndex">
                    <tr 
                      class="cursor-pointer"
                      @click="highlightNutrient(category.name_en)"
                    >
                      <td class="px-4 py-2 border border-gray-300 font-medium text-sm md:text-base hover:bg-orange-50 transition-colors" :rowspan="category.items ? category.items.length + 1 : 1">
                        {{ category.name }}
                      </td>
                      <td class="px-4 py-2 border border-gray-300 text-sm md:text-base hover:bg-orange-50 transition-colors">
                        {{ category.name }} (总计)
                      </td>
                      <td class="px-4 py-2 border border-gray-300 text-right text-sm md:text-base hover:bg-orange-50 transition-colors">
                        {{ category.value.toFixed(1) }}
                      </td>
                      <td class="px-4 py-2 border border-gray-300 text-sm md:text-base hover:bg-orange-50 transition-colors">
                        {{ category.unit_name }}
                      </td>
                    </tr>
                    <tr 
                      v-for="(item, itemIndex) in category.items"
                      :key="itemIndex"
                      class="cursor-pointer"
                      @click="highlightNutrient(item.name_en)"
                    >
                      <td class="px-4 py-2 border border-gray-300 text-sm md:text-base pl-8 hover:bg-orange-50 transition-colors">
                        └ {{ item.name }}
                      </td>
                      <td class="px-4 py-2 border border-gray-300 text-right text-sm md:text-base hover:bg-orange-50 transition-colors">
                        {{ item.value.toFixed(1) }}
                      </td>
                      <td class="px-4 py-2 border border-gray-300 text-sm md:text-base hover:bg-orange-50 transition-colors">
                        {{ item.unit_name }}
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 初始状态提示 -->
        <div v-if="!hasSearched && !foodDetail && !isLoading" class="text-center py-16">
          <div class="text-6xl mb-2">📊</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">开始查询食物热量</h3>
          <p class="text-gray-500 mb-6">输入食物名称，查看详细的营养信息</p>
        </div>
      </div>

      <GlobalFooter />
    </div>
  </ClickSpark>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import type { BooheeFoodDetailResponse } from '@/types/boohee-api'
import { searchFoodAndGetDetail } from '@/utils/booheeApi'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import ClickSpark from '@/components/ClickSpark.vue'
import ShaderBackground from '@/components/ShaderBackground.vue'
import EmojiCursor from '@/components/EmojiCursor.vue'

const searchQuery = ref('')
const foodDetail = ref<BooheeFoodDetailResponse | null>(null)
const isLoading = ref(false)
const hasSearched = ref(false)
const error = ref<string | null>(null)

const caloryChartRef = ref<HTMLDivElement | null>(null)
const nutrientChartRef = ref<HTMLDivElement | null>(null)
let caloryChart: ECharts | null = null
let nutrientChart: ECharts | null = null

// 热门食物
const hotFoods = [
  '苹果', '香蕉', '番茄炒蛋', '米饭', '鸡胸肉', 
  '鸡蛋', '牛奶', '青椒土豆丝', '宫保鸡丁', '红烧肉'
]

const selectSuggestion = (food: string) => {
  searchQuery.value = food
  performSearch()
}

const performSearch = async () => {
  if (!searchQuery.value.trim() || isLoading.value) return
  
  error.value = null
  foodDetail.value = null
  isLoading.value = true
  hasSearched.value = true
  
  try {
    const result = await searchFoodAndGetDetail(searchQuery.value.trim())
    
    if (!result) {
      error.value = '未找到该食物，请尝试其他名称'
      return
    }
    
    foodDetail.value = result
    
    // 等待DOM更新后渲染图表
    await nextTick()
    // 再次等待一小段时间确保DOM完全渲染
    setTimeout(() => {
      renderCharts()
      // 确保图表正确调整大小
      setTimeout(() => {
        caloryChart?.resize()
        nutrientChart?.resize()
      }, 100)
    }, 50)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '查询失败，请稍后再试'
  } finally {
    isLoading.value = false
  }
}

const renderCharts = () => {
  if (!foodDetail.value) return
  
  // 渲染热量占比饼状图
  if (caloryChartRef.value) {
    try {
      if (caloryChart) {
        caloryChart.dispose()
        caloryChart = null
      }
      
      // 检查容器是否有尺寸
      const rect = caloryChartRef.value.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        setTimeout(() => renderCharts(), 100)
        return
      }
      
      caloryChart = echarts.init(caloryChartRef.value)
      
      // 提取蛋白质、脂肪、碳水化合物的热量数据
      const proteinCal = foodDetail.value.calory?.find(c => c.name_en === 'protein')
      const fatCal = foodDetail.value.calory?.find(c => c.name_en === 'fat')
      const carbCal = foodDetail.value.calory?.find(c => c.name_en === 'carbohydrate')
      
      const caloryData: Array<{ name: string; value: number }> = []
      if (proteinCal && proteinCal.value > 0) {
        caloryData.push({
          name: proteinCal.name || '蛋白质',
          value: Number(proteinCal.value) || 0
        })
      }
      if (fatCal && fatCal.value > 0) {
        caloryData.push({
          name: fatCal.name || '脂肪',
          value: Number(fatCal.value) || 0
        })
      }
      if (carbCal && carbCal.value > 0) {
        caloryData.push({
          name: carbCal.name || '碳水化合物',
          value: Number(carbCal.value) || 0
        })
      }
      
      if (caloryData.length === 0) return
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} 千卡 ({d}%)',
          backgroundColor: 'rgba(50, 50, 50, 0.9)',
          borderColor: '#fff',
          borderWidth: 1,
          textStyle: {
            color: '#fff',
            fontSize: 14
          },
          padding: [10, 15]
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle',
          itemGap: 12,
          textStyle: {
            fontSize: 13,
            fontWeight: '500'
          }
        },
        series: [
          {
            name: '热量',
            type: 'pie',
            radius: ['45%', '75%'],
            center: ['60%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            },
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              fontSize: 12,
              fontWeight: '500',
              color: '#333'
            },
            labelLine: {
              show: true,
              length: 15,
              length2: 8,
              smooth: 0.2
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 20,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              },
              label: {
                show: true,
                fontSize: 15,
                fontWeight: 'bold'
              }
            },
            data: caloryData,
            color: ['#ff6b35', '#ffa726', '#fdc830', '#ff8c42', '#ff7043'],
            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: function (idx: number) {
              return Math.random() * 200
            }
          }
        ]
      }
      
      caloryChart.setOption(option)
    } catch (err) {
      // 静默处理错误
    }
  }
  
  // 渲染营养素重量占比饼状图
  if (nutrientChartRef.value) {
    try {
      if (nutrientChart) {
        nutrientChart.dispose()
        nutrientChart = null
      }
      
      // 检查容器是否有尺寸
      const rect = nutrientChartRef.value.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        setTimeout(() => renderCharts(), 100)
        return
      }
      
      nutrientChart = echarts.init(nutrientChartRef.value)
      
      // 提取三大营养素的数据
      const nutrientData = (foodDetail.value.base_ingredients || [])
        .filter(cat => ['carbohydrate', 'protein', 'fat'].includes(cat.name_en))
        .map(cat => ({
          name: cat.name || cat.name_en,
          value: Number(cat.value) || 0
        }))
        .filter(item => item.value > 0) // 过滤掉值为0的数据
      
      if (nutrientData.length === 0) return
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}g ({d}%)',
          backgroundColor: 'rgba(50, 50, 50, 0.9)',
          borderColor: '#fff',
          borderWidth: 1,
          textStyle: {
            color: '#fff',
            fontSize: 14
          },
          padding: [10, 15]
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle',
          itemGap: 12,
          textStyle: {
            fontSize: 13,
            fontWeight: '500'
          }
        },
        series: [
          {
            name: '重量',
            type: 'pie',
            radius: ['45%', '75%'],
            center: ['60%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            },
            label: {
              show: true,
              formatter: '{b}\n{c}g',
              fontSize: 12,
              fontWeight: '500',
              color: '#333'
            },
            labelLine: {
              show: true,
              length: 15,
              length2: 8,
              smooth: 0.2
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 20,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              },
              label: {
                show: true,
                fontSize: 15,
                fontWeight: 'bold'
              }
            },
            data: nutrientData,
            color: ['#ff6b35', '#ffa726', '#fdc830', '#ff8c42', '#ff7043'],
            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: function (idx: number) {
              return Math.random() * 200
            }
          }
        ]
      }
      
      nutrientChart.setOption(option)
    } catch (err) {
      // 静默处理错误
    }
  }
}

const highlightNutrient = (nutrientNameEn: string) => {
  // 高亮对应的饼状图区域（可选功能）
  if (nutrientChart && nutrientChartRef.value) {
    const option = nutrientChart.getOption() as any
    if (option && option.series && option.series[0] && option.series[0].data) {
      const dataIndex = option.series[0].data.findIndex((item: any) => {
        // 根据name_en找到对应的数据项
        const category = foodDetail.value?.base_ingredients.find(cat => 
          cat.name_en === nutrientNameEn || cat.items?.some(item => item.name_en === nutrientNameEn)
        )
        return category && item.name === category.name
      })
      
      if (dataIndex !== -1) {
        nutrientChart.dispatchAction({
          type: 'highlight',
          dataIndex: dataIndex
        })
        
        setTimeout(() => {
          nutrientChart.dispatchAction({
            type: 'downplay'
          })
        }, 1000)
      }
    }
  }
}

// 清理函数
const cleanup = () => {
  if (caloryChart) {
    caloryChart.dispose()
    caloryChart = null
  }
  if (nutrientChart) {
    nutrientChart.dispose()
    nutrientChart = null
  }
  
  // 移除resize事件监听器
  window.removeEventListener('resize', handleResize)
}

const handleResize = () => {
  caloryChart?.resize()
  nutrientChart?.resize()
}

onMounted(() => {
  // 组件挂载时的初始化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cleanup()
})

// 监听foodDetail变化，重新渲染图表
watch(() => foodDetail.value, () => {
  if (foodDetail.value) {
    nextTick(() => {
      renderCharts()
    })
  }
})
</script>

<style scoped>
/* 响应式表格 */
@media (max-width: 768px) {
  table {
    font-size: 0.875rem;
  }
  
  th, td {
    padding: 0.5rem;
  }
}
</style>

