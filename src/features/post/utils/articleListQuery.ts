/**
 * 文章列表页 URL 状态管理
 * 实现筛选参数与 URL query 的双向同步。
 */

/** 日期筛选预设 */
export type DatePreset = 'all' | '7d' | '30d' | '90d' | '365d' | 'custom'
/** 排序模式 */
export type SortMode = 'newest' | 'oldest' | 'readDesc' | 'readAsc' | 'titleAsc'

/** 列表页完整查询状态 */
export interface ArticleListQueryState {
  datePreset: DatePreset    // 日期预设
  customStartDate: string   // 自定义开始日期
  customEndDate: string     // 自定义结束日期
  keyword: string           // 搜索关键词
  sortMode: SortMode        // 排序方式
  pageSize: number          // 每页数量
  currentPage: number       // 当前页码
}

export interface ParseQueryOptions {
  pageSizeOptions: number[]
  defaultPageSize?: number
  defaultSortMode?: SortMode
}

const DATE_PRESETS: DatePreset[] = ['all', '7d', '30d', '90d', '365d', 'custom']
const SORT_MODES: SortMode[] = ['newest', 'oldest', 'readDesc', 'readAsc', 'titleAsc']

/** 从 URL query 解析出结构化查询状态（容错处理） */
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
    keyword: toQueryString(query.q),
    sortMode: parsedSortMode,
    pageSize: pageSizeOptions.includes(size) ? size : defaultPageSize,
    currentPage: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

/** 将查询状态转换为 URL query 参数（自动省略默认值） */
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
  if (state.sortMode !== defaultSortMode) query.sort = state.sortMode
  if (state.pageSize !== defaultPageSize) query.size = String(state.pageSize)
  if (state.currentPage > 1) query.page = String(state.currentPage)

  return query
}

/** 比较两个 query 是否相同（防止重复路由推送） */
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

/** 将任意值转为字符串（处理数组、undefined 等情况） */
export function toQueryString(value: unknown) {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : ''
  return typeof value === 'string' ? value : ''
}

/** 类型守卫：是否为合法的日期预设值 */
export function isDatePreset(value: string): value is DatePreset {
  return DATE_PRESETS.includes(value as DatePreset)
}

/** 类型守卫：是否为合法的排序模式值 */
export function isSortMode(value: string): value is SortMode {
  return SORT_MODES.includes(value as SortMode)
}
