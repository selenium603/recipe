<!-- ShaderBackground.vue -->
<template>
  <canvas ref="canvasRef" class="shader-background"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let gl: WebGLRenderingContext | null = null
let program: WebGLProgram | null = null
let animationId: number | null = null
let startTime = Date.now()

// 顶点着色器
const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

// 片元着色器 - 沸腾油锅效果
const fragmentShaderSource = `
  precision highp float;
  
  uniform vec2 resolution;
  uniform float time;
  
  // 简化的噪声函数
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  // FBM (Fractional Brownian Motion)
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 5; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    
    return value;
  }
  
  // 气泡效果 - 小且低调
  float bubbles(vec2 uv, float t) {
    float bubble = 0.0;
    
    // 多层气泡
    for(float i = 0.0; i < 20.0; i++) {
      // 每个气泡的随机位置和速度
      float offset = hash(vec2(i, 0.0)) * 6.28;
      float speed = 0.3 + hash(vec2(i, 1.0)) * 0.4;
      float x = hash(vec2(i, 2.0));
      
      // 气泡上升
      float y = fract((hash(vec2(i, 3.0)) + t * speed));
      
      // 气泡位置 - 减少横向摇摆，使气泡更圆
      vec2 bubblePos = vec2(
        x + sin(t * 2.0 + offset) * 0.05,
        y
      );
      
      // 气泡大小 - 更小
      float size = 0.008 + y * 0.012;
      
      // 计算距离 - 使用更圆的距离计算
      vec2 delta = uv - bubblePos;
      float aspectRatio = 1.0;  // 1.0表示完美圆形
      float dist = length(vec2(delta.x, delta.y * aspectRatio));
      
      // 气泡强度 - 降低对比度，更低调
      float bubbleStrength = smoothstep(size, size * 0.4, dist);
      bubbleStrength *= (1.0 - y * 0.6);  // 增加淡化程度，使气泡更低调
      
      bubble += bubbleStrength;
    }
    
    return bubble;
  }
  
  void main() {
    // 归一化坐标
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;
    
    float t = time * 0.15;
    
    // 流动的背景噪声
    vec2 flowUV = uv + vec2(t * 0.05, t * 0.03);
    float n1 = fbm(flowUV * 3.0);
    float n2 = fbm(flowUV * 4.0 + vec2(t * 0.1, -t * 0.08));
    
    // 扭曲效果
    vec2 distortion = vec2(
      fbm(uv * 2.0 + t * 0.1),
      fbm(uv * 2.0 - t * 0.1)
    ) * 0.1;
    
    // 气泡效果
    float bubbleEffect = bubbles(uv + distortion, t);
    
    // 基础渐变色（暖色调：橙色到红色） - 更明亮的配色
    vec3 color1 = vec3(1.0, 0.75, 0.5);   // 明亮橙色
    vec3 color2 = vec3(1.0, 0.65, 0.45);  // 明亮橙红
    vec3 color3 = vec3(1.0, 0.85, 0.6);   // 明亮橙黄
    
    // 混合颜色
    vec3 baseColor = mix(color1, color2, n1);
    baseColor = mix(baseColor, color3, n2 * 0.5);
    
    // 添加气泡高光 - 低调的高光
    vec3 bubbleColor = vec3(1.0, 0.96, 0.88); // 柔和的高光
    baseColor = mix(baseColor, bubbleColor, bubbleEffect * 0.3);  // 降低气泡效果
    
    // 添加整体的波动
    float wave = sin(uv.x * 10.0 + t) * cos(uv.y * 8.0 - t * 0.7) * 0.03;
    baseColor += wave;
    
    // 添加渐变叠加（从上到下稍微变暗）- 减少变暗程度
    baseColor *= 1.0 - uv.y * 0.05;
    
    // 最终输出 - 提高整体亮度
    gl_FragColor = vec4(baseColor * 1.0, 1.0);
  }
`

const createShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
  const shader = gl.createShader(type)
  if (!shader) return null
  
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  
  return shader
}

const initWebGL = () => {
  if (!canvasRef.value) return false
  
  gl = canvasRef.value.getContext('webgl') || canvasRef.value.getContext('experimental-webgl')
  if (!gl) {
    console.error('WebGL not supported')
    return false
  }
  
  // 创建着色器
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  
  if (!vertexShader || !fragmentShader) return false
  
  // 创建程序
  program = gl.createProgram()
  if (!program) return false
  
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program))
    return false
  }
  
  gl.useProgram(program)
  
  // 创建全屏四边形
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
  ])
  
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  
  const positionLocation = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
  
  return true
}

// 性能优化：限制DPR，降低内存占用
const resizeCanvas = () => {
  if (!canvasRef.value) return
  
  // 限制DPR最大为2，避免高分辨率设备内存占用过高
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = window.innerWidth
  const height = window.innerHeight
  
  canvasRef.value.width = width * dpr
  canvasRef.value.height = height * dpr
  canvasRef.value.style.width = width + 'px'
  canvasRef.value.style.height = height + 'px'
  
  if (gl) {
    gl.viewport(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

const render = () => {
  if (!gl || !program || !canvasRef.value) return
  
  const currentTime = (Date.now() - startTime) / 1000
  
  // 设置 uniform
  const resolutionLocation = gl.getUniformLocation(program, 'resolution')
  const timeLocation = gl.getUniformLocation(program, 'time')
  
  gl.uniform2f(resolutionLocation, canvasRef.value.width, canvasRef.value.height)
  gl.uniform1f(timeLocation, currentTime)
  
  // 绘制
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  
  animationId = requestAnimationFrame(render)
}

onMounted(() => {
  if (initWebGL()) {
    resizeCanvas()
    render()
    
    // 防抖处理resize事件，避免频繁重渲染
    let resizeTimer: number
    const debouncedResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(resizeCanvas, 150)
    }
    window.addEventListener('resize', debouncedResize)
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', resizeCanvas)
  
  if (gl && program) {
    gl.deleteProgram(program)
  }
})
</script>

<style scoped>
.shader-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>

