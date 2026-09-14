import {
  buildArticleListQuery,
  isSameQuery,
  parseArticleListQueryState,
  toQueryString,
  type ArticleListQueryState,
} from '@/features/post/utils/articleListQuery'

describe('article list query state utils', () => {
  const pageSizeOptions = [6, 9, 12, 18]

  it('round-trips a tag with popularity and pagination and accepts old keyword links', () => {
    const query = { tag: 'Vue', sort: 'popular', page: '2' }
    const state = parseArticleListQueryState(query, { pageSizeOptions })
    expect(state).toMatchObject({ tag: 'Vue', sortMode: 'popular', currentPage: 2 })
    expect(buildArticleListQuery(state)).toEqual(query)
    expect(parseArticleListQueryState({ keyword: 'Vue' }, { pageSizeOptions }).keyword).toBe('Vue')
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
