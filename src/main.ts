import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useThemeStore } from '@/features/theme/stores/useThemeStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
useThemeStore(pinia).hydrateTheme()
app.use(router)

app.mount('#app')
