<template>
  <CardNav
    :items="navItems"
    base-color="#fff"
    menu-color="#ff6b35"
    button-bg-color="#ff6b35"
    button-text-color="#fff"
    ease="power3.out"
  />
</template>

<script setup lang="ts">
import CardNav from './CardNav.vue'

const navItems = [
  {
    label: "主页",
    bgColor: "#ff6b35",
    gradient: "linear-gradient(135deg, #ff6b35, #ff8c42)",
    textColor: "#fff",
    route: "/",
    links: [],
    flex: 3
  },
  {
    label: "AI 搜索", 
    bgColor: "#f7931e",
    gradient: "linear-gradient(135deg, #f7931e, #ffa726)",
    textColor: "#fff",
    route: "/search",
    links: [],
    flex: 3
  },
  {
    label: "AI 助手",
    bgColor: "#ffa726",
    gradient: "linear-gradient(135deg, #ffa726, #ffb74d)",
    textColor: "#fff",
    route: "/ai-assistant",
    links: [],
    flex: 3
  },
  {
    label: "热量查询",
    bgColor: "#ff8c42",
    gradient: "linear-gradient(135deg, #ff8c42, #ffa726)",
    textColor: "#fff",
    route: "/nutrition",
    links: [],
    flex: 3
  },
  {
    label: "收藏夹",
    bgColor: "#fdc830",
    gradient: "linear-gradient(135deg, #fdc830, #ffeb3b)", 
    textColor: "#fff",
    route: "/collections",
    links: [],
    flex: 1
  }
]
</script>

<style scoped>
</style>