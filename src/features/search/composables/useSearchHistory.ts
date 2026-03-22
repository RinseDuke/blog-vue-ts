/**
 * 搜索历史 Composable
 * 将搜索记录持久化到 localStorage，上限 12 条。
 */

import { ref } from 'vue'

interface UseSearchHistoryOptions {
  storageKey?: string
  limit?: number
}

export function useSearchHistory(options: UseSearchHistoryOptions = {}) {
  const { storageKey = 'blog_search_history', limit = 12 } = options
  const searchHistory = ref<string[]>([])  // 搜索历史列表

  /** 从 localStorage 加载搜索历史 */
  function loadHistory() {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        searchHistory.value = parsed.slice(0, limit)
      }
    } catch (err) {
      console.warn('Failed to load search history', err)
    }
  }

  /** 保存搜索词并置顶（去重） */
  function persistHistory(term: string) {
    const normalized = term.trim()
    if (!normalized) return

    const next = [normalized, ...searchHistory.value.filter((item) => item !== normalized)].slice(0, limit)
    searchHistory.value = next
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  /** 清空搜索历史 */
  function clearHistory() {
    searchHistory.value = []
    localStorage.removeItem(storageKey)
  }

  return {
    searchHistory,
    loadHistory,
    persistHistory,
    clearHistory,
  }
}
