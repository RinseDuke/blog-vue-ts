import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'blog_theme_v1'

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function getPreferredTheme(): ThemeMode {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeMode>('light')
  const isDark = computed(() => theme.value === 'dark')

  function setTheme(nextTheme: ThemeMode, options: { persist?: boolean } = {}) {
    const { persist = true } = options

    theme.value = nextTheme
    applyThemeToDocument(nextTheme)

    if (!persist) return

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
    }
  }

  // 优先读取 localStorage，回退到系统偏好
  function hydrateTheme() {
    let initialTheme = getPreferredTheme()

    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (isThemeMode(storedTheme)) {
        initialTheme = storedTheme
      }
    } catch {
    }

    setTheme(initialTheme, { persist: false })
  }

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  return {
    theme,
    isDark,
    setTheme,
    hydrateTheme,
    toggleTheme,
  }
})
