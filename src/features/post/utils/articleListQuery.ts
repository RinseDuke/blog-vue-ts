export type DatePreset = 'all' | '7d' | '30d' | '90d' | '365d' | 'custom'
export type SortMode = 'newest' | 'popular' | 'oldest' | 'readDesc' | 'readAsc' | 'titleAsc'

export interface ArticleListQueryState {
  datePreset: DatePreset
  customStartDate: string
  customEndDate: string
  keyword: string
  tag?: string
  sortMode: SortMode
  pageSize: number
  currentPage: number
}

export interface ParseQueryOptions {
  pageSizeOptions: number[]
  defaultPageSize?: number
  defaultSortMode?: SortMode
}

const DATE_PRESETS: DatePreset[] = ['all', '7d', '30d', '90d', '365d', 'custom']
const SORT_MODES: SortMode[] = ['newest', 'popular', 'oldest', 'readDesc', 'readAsc', 'titleAsc']

export function parseArticleListQueryState(query: Record<string, unknown>, options: ParseQueryOptions): ArticleListQueryState {
  const { pageSizeOptions, defaultPageSize = 6, defaultSortMode = 'newest' } = options

  const date = toQueryString(query.date)
  const parsedDatePreset = isDatePreset(date) ? date : 'all'
  const sort = toQueryString(query.sort)
  const parsedSortMode = isSortMode(sort) ? sort : defaultSortMode

  const size = Number.parseInt(toQueryString(query.size), 10)
  const page = Number.parseInt(toQueryString(query.page), 10)

  return {
    datePreset: parsedDatePreset,
    customStartDate: parsedDatePreset === 'custom' ? toQueryString(query.start) : '',
    customEndDate: parsedDatePreset === 'custom' ? toQueryString(query.end) : '',
    keyword: toQueryString(query.q) || toQueryString(query.keyword),
    ...(toQueryString(query.tag).trim() ? { tag: toQueryString(query.tag).trim() } : {}),
    sortMode: parsedSortMode,
    pageSize: pageSizeOptions.includes(size) ? size : defaultPageSize,
    currentPage: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export function buildArticleListQuery(state: ArticleListQueryState, options: { defaultPageSize?: number; defaultSortMode?: SortMode } = {}) {
  const { defaultPageSize = 6, defaultSortMode = 'newest' } = options
  const query: Record<string, string> = {}
  const normalizedKeyword = state.keyword.trim().toLowerCase()

  if (state.datePreset !== 'all') query.date = state.datePreset
  if (state.datePreset === 'custom') {
    if (state.customStartDate) query.start = state.customStartDate
    if (state.customEndDate) query.end = state.customEndDate
  }
  if (normalizedKeyword) query.q = normalizedKeyword
  if (state.tag?.trim()) query.tag = state.tag.trim()
  if (state.sortMode !== defaultSortMode) query.sort = state.sortMode
  if (state.pageSize !== defaultPageSize) query.size = String(state.pageSize)
  if (state.currentPage > 1) query.page = String(state.currentPage)

  return query
}

export function isSameQuery(current: Record<string, unknown>, next: Record<string, string>) {
  const currentNormalized: Record<string, string> = {}

  for (const [key, value] of Object.entries(current)) {
    const normalized = toQueryString(value)
    if (normalized) currentNormalized[key] = normalized
  }

  const currentKeys = Object.keys(currentNormalized).sort()
  const nextKeys = Object.keys(next).sort()

  if (currentKeys.length !== nextKeys.length) return false

  for (const key of nextKeys) {
    if (currentNormalized[key] !== next[key]) return false
  }

  return true
}

export function toQueryString(value: unknown) {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : ''
  return typeof value === 'string' ? value : ''
}

export function isDatePreset(value: string): value is DatePreset {
  return DATE_PRESETS.includes(value as DatePreset)
}

export function isSortMode(value: string): value is SortMode {
  return SORT_MODES.includes(value as SortMode)
}
