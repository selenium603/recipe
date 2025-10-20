# AI搜索功能配置说明

## 环境变量配置

请在项目根目录创建 `.env.local` 文件，并添加以下配置：

### OpenRouter 配置（推荐）
```env
# OpenRouter AI搜索API配置
VITE_AI_API_URL=https://openrouter.ai/api/v1/chat/completions
VITE_AI_API_KEY=sk-or-v1-your-openrouter-api-key
VITE_AI_API_TIMEOUT=10000
```

### 其他AI服务配置
```env
# 其他AI服务配置
VITE_AI_API_URL=https://your-ai-api-endpoint.com
VITE_AI_API_KEY=your-api-key-here
VITE_AI_API_TIMEOUT=10000
```

## API接口规范

### 请求格式

**端点**: `POST {VITE_AI_API_URL}/search`

**请求头**:
```
Content-Type: application/json
Authorization: Bearer {VITE_AI_API_KEY}
```

**请求体**:
```json
{
  "query": "用户搜索关键词",
  "context": "recipe_search",
  "available_recipes": [
    {
      "id": "1",
      "name": "宫保鸡丁",
      "cuisine": "川菜",
      "ingredients": ["鸡胸肉", "花生", "干辣椒"],
      "flavor": "麻辣酸甜",
      "difficulty": "中等",
      "cookingTime": 30,
      "description": "经典的川菜名菜"
    }
  ],
  "user_preferences": {
    "favorites": ["1", "2"],
    "history": [
      {
        "name": "番茄炒蛋",
        "cuisine": "家常菜",
        "emoji": "🍅"
      }
    ]
  },
  "filters": {
    "max_results": 10,
    "sort_by": "relevance"
  }
}
```

### 响应格式

**成功响应**:
```json
{
  "recipes": [
    {
      "recipe_id": "1",
      "match_score": 95,
      "match_reason": "菜名完全匹配，食材符合要求"
    },
    {
      "recipe_id": "2", 
      "match_score": 80,
      "match_reason": "口味匹配，制作简单"
    }
  ],
  "total_count": 2,
  "search_time": 150
}
```

**错误响应**:
```json
{
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## AI模型指令建议

给你的AI模型发送这样的指令：

```
你是一个专业的美食推荐助手。根据用户输入的关键词，从提供的菜谱数据中推荐最合适的菜品。

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

返回格式：JSON数组，每个元素包含recipe_id、match_score和match_reason。

如果没有完全匹配，返回相似度最高的3-5个菜谱。
```

## 功能特性

- ✅ AI智能搜索
- ✅ 本地搜索降级
- ✅ 搜索建议
- ✅ 防抖搜索
- ✅ 超时处理
- ✅ 错误处理
- ✅ 用户偏好学习

## 测试方法

1. 配置环境变量
2. 启动开发服务器：`npm run dev`
3. 在搜索框中输入关键词测试
4. 检查浏览器控制台的日志信息

## 故障排除

如果AI搜索不工作，系统会自动降级到本地搜索功能，确保基本功能可用。

检查项目：
- [ ] 环境变量是否正确配置
- [ ] API地址是否可访问
- [ ] API密钥是否有效
- [ ] 网络连接是否正常
