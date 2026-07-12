import {
  buildArticleListQuery,
  hasNonDefaultArticleListState,
  isSameQuery,
  parseArticleListQueryState,
  toQueryString,
  type ArticleListQueryState,
} from '@/features/post/utils/articleListQuery'

describe('article list query state utils', () => {
  const pageSizeOptions = [6, 9, 12, 18]

  const defaultListState = {
    datePreset: 'all' as const,
    customStartDate: '',
    customEndDate: '',
    keyword: '',
    sortMode: 'newest' as const,
    pageSize: 6,
  }

  it('hasNonDefaultArticleListState returns false for defaults', () => {
    expect(hasNonDefaultArticleListState(defaultListState)).toBe(false)
  })

  it('hasNonDefaultArticleListState returns true for a non-default date preset', () => {
    expect(hasNonDefaultArticleListState({ ...defaultListState, datePreset: '7d' })).toBe(true)
  })

  it.each(['oldest', 'readDesc', 'readAsc', 'titleAsc'] as const)(
    'hasNonDefaultArticleListState returns true for %s sort mode',
    (sortMode) => {
      expect(hasNonDefaultArticleListState({ ...defaultListState, sortMode })).toBe(true)
    }
  )

  it('hasNonDefaultArticleListState returns true for a non-default page size', () => {
    expect(hasNonDefaultArticleListState({ ...defaultListState, pageSize: 12 })).toBe(true)
  })

  it('hasNonDefaultArticleListState ignores whitespace-only keywords', () => {
    expect(hasNonDefaultArticleListState({ ...defaultListState, keyword: '   ' })).toBe(false)
    expect(hasNonDefaultArticleListState({ ...defaultListState, keyword: '  Vue  ' })).toBe(true)
  })

  it('hasNonDefaultArticleListState detects custom date values', () => {
    expect(hasNonDefaultArticleListState({ ...defaultListState, customStartDate: '2025-01-01' })).toBe(true)
    expect(hasNonDefaultArticleListState({ ...defaultListState, customEndDate: '2025-01-31' })).toBe(true)
  })

  it('parseArticleListQueryState returns defaults for empty query', () => {
    const state = parseArticleListQueryState({}, { pageSizeOptions })

    expect(state).toEqual({
      datePreset: 'all',
      customStartDate: '',
      customEndDate: '',
      keyword: '',
      sortMode: 'newest',
      pageSize: 6,
      currentPage: 1,
    })
  })

  it('parseArticleListQueryState reads valid query values', () => {
    const state = parseArticleListQueryState(
      {
        date: 'custom',
        start: '2025-01-01',
        end: '2025-02-01',
        q: 'performance',
        sort: 'readDesc',
        size: '12',
        page: '3',
      },
      { pageSizeOptions }
    )

    expect(state).toEqual({
      datePreset: 'custom',
      customStartDate: '2025-01-01',
      customEndDate: '2025-02-01',
      keyword: 'performance',
      sortMode: 'readDesc',
      pageSize: 12,
      currentPage: 3,
    })
  })

  it('parseArticleListQueryState falls back for invalid values', () => {
    const state = parseArticleListQueryState(
      {
        date: 'invalid',
        sort: 'invalid',
        size: '999',
        page: '-2',
      },
      { pageSizeOptions }
    )

    expect(state.datePreset).toBe('all')
    expect(state.sortMode).toBe('newest')
    expect(state.pageSize).toBe(6)
    expect(state.currentPage).toBe(1)
  })

  it('buildArticleListQuery omits defaults and normalizes keyword', () => {
    const state: ArticleListQueryState = {
      datePreset: 'all',
      customStartDate: '',
      customEndDate: '',
      keyword: '  Vue  ',
      sortMode: 'newest',
      pageSize: 6,
      currentPage: 1,
    }

    expect(buildArticleListQuery(state)).toEqual({ q: 'vue' })
  })

  it('buildArticleListQuery includes custom range and page info', () => {
    const state: ArticleListQueryState = {
      datePreset: 'custom',
      customStartDate: '2025-01-01',
      customEndDate: '2025-01-31',
      keyword: '',
      sortMode: 'readAsc',
      pageSize: 12,
      currentPage: 2,
    }

    expect(buildArticleListQuery(state)).toEqual({
      date: 'custom',
      start: '2025-01-01',
      end: '2025-01-31',
      sort: 'readAsc',
      size: '12',
      page: '2',
    })
  })

  it('isSameQuery ignores key order and array query values', () => {
    const current = {
      q: ['vue'],
      page: '2',
      size: '12',
    }
    const next = {
      size: '12',
      page: '2',
      q: 'vue',
    }

    expect(isSameQuery(current, next)).toBe(true)
  })

  it('toQueryString handles string, array and invalid values', () => {
    expect(toQueryString('vue')).toBe('vue')
    expect(toQueryString(['vue', 'react'])).toBe('vue')
    expect(toQueryString(123)).toBe('')
  })
})
