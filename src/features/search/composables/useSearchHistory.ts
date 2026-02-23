import { ref } from 'vue'

interface UseSearchHistoryOptions {
  storageKey?: string
  limit?: number
}

export function useSearchHistory(options: UseSearchHistoryOptions = {}) {
  const { storageKey = 'blog_search_history', limit = 12 } = options
  const searchHistory = ref<string[]>([])

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

  function persistHistory(term: string) {
    const normalized = term.trim()
    if (!normalized) return

    const next = [normalized, ...searchHistory.value.filter((item) => item !== normalized)].slice(0, limit)
    searchHistory.value = next
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

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
