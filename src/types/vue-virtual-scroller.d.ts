declare module 'vue-virtual-scroller' {
  import { Component } from 'vue'
  
  export const DynamicScroller: Component
  export const DynamicScrollerItem: Component
  export const RecycleScroller: Component
  
  export default function install(app: any): void
}

