import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/features/theme/stores/useThemeStore'

interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

function createStorageMock(): StorageLike {
  const store = new Map<string, string>()

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

function createDocumentMock() {
  return {
    documentElement: {
      dataset: {} as Record<string, string>,
      style: {} as Record<string, string>,
    },
  }
}

describe('useThemeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('document', createDocumentMock())
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('hydrates the persisted theme and applies it to the document', () => {
    localStorage.setItem('blog_theme_v1', 'dark')
    const themeStore = useThemeStore()

    themeStore.hydrateTheme()

    expect(themeStore.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('toggles theme and persists the next value', () => {
    const themeStore = useThemeStore()
    themeStore.hydrateTheme()

    themeStore.toggleTheme()

    expect(themeStore.isDark).toBe(true)
    expect(localStorage.getItem('blog_theme_v1')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
