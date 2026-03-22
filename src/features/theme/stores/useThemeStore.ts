/**
 * 主题 Store
 * 管理亮/暗模式切换，支持系统偏好检测和持久化存储。
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'blog_theme_v1'

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

/** 检测系统偏好的主题模式 */
function getPreferredTheme(): ThemeMode {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

/** 将主题应用到 <html> 元素的 data-theme 和 colorScheme */
function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeMode>('light')
  const isDark = computed(() => theme.value === 'dark')

  /** 设置主题并可选持久化到 localStorage */
  function setTheme(nextTheme: ThemeMode, options: { persist?: boolean } = {}) {
    const { persist = true } = options

    theme.value = nextTheme
    applyThemeToDocument(nextTheme)

    if (!persist) return

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // Ignore storage failures and keep the in-memory theme.
    }
  }

  /**
   * 主题水合（应用启动时调用）
   * 优先读取 localStorage → 回退到系统偏好
   */
  function hydrateTheme() {
    let initialTheme = getPreferredTheme()

    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (isThemeMode(storedTheme)) {
        initialTheme = storedTheme
      }
    } catch {
      // Fall back to the system preference when storage is unavailable.
    }

    setTheme(initialTheme, { persist: false })
  }

  /** 切换亮/暗模式 */
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
