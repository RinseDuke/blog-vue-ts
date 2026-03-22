/**
 * 应用入口文件
 * 初始化 Vue 实例、Pinia 状态管理、Router 路由，并在挂载前同步水合主题以避免闪烁。
 */

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useThemeStore } from '@/features/theme/stores/useThemeStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
// 挂载 Router 之前先水合主题，确保首屏渲染即为正确的亮/暗模式
useThemeStore(pinia).hydrateTheme()
app.use(router)

app.mount('#app')
