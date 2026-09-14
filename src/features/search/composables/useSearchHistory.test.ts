import { useSearchHistory } from './useSearchHistory'

function createStorageMock() {
  const store = new Map<string, string>()

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  }
}

describe('useSearchHistory', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ignores non-string entries loaded from browser storage', () => {
    localStorage.setItem('history', JSON.stringify(['vue', 42, null, 'typescript']))
    const { searchHistory, loadHistory } = useSearchHistory({ storageKey: 'history' })

    loadHistory()

    expect(searchHistory.value).toEqual(['vue', 'typescript'])
  })

  it('deduplicates and limits persisted terms', () => {
    const { searchHistory, persistHistory } = useSearchHistory({ storageKey: 'history', limit: 2 })

    persistHistory('vue')
    persistHistory('typescript')
    persistHistory(' vue ')

    expect(searchHistory.value).toEqual(['vue', 'typescript'])
    expect(JSON.parse(localStorage.getItem('history') ?? '[]')).toEqual(['vue', 'typescript'])
  })
})
