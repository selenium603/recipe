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
    textColor: "#fff",
    route: "/",
    links: [],
    flex: 4.5
  },
  {
    label: "AI 搜索", 
    bgColor: "#f7931e",
    textColor: "#fff",
    route: "/search",
    links: [],
    flex: 4.5
  },
  {
    label: "收藏夹",
    bgColor: "#fdc830", 
    textColor: "#fff",
    route: "/collections",
    links: [],
    flex: 1
  }
]
</script>

<style scoped>
</style>