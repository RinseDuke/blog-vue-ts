<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Post } from '@/types/post'
import { storeToRefs } from 'pinia'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import {
  type DatePreset,
  type SortMode,
  parseArticleListQueryState,
  buildArticleListQuery,
  isSameQuery,
} from '@/features/post/utils/articleListQuery'
import { sortPostsByDateDesc } from '@/features/post/utils/post'
import PostList from '@/components/post/PostList.vue'
import ArticleFilters from '@/components/post/ArticleFilters.vue'
import CommunityLayout from '@/components/community/CommunityLayout.vue'

const route = useRoute()
const router = useRouter()

const postsStore = usePostsStore()
const { posts, loading, error } = storeToRefs(postsStore)
const { ensurePosts } = postsStore

const datePreset = ref<DatePreset>('all')
const customStartDate = ref('')
const customEndDate = ref('')
const keyword = ref('')
const selectedTag = ref('')
const sortMode = ref<SortMode>('newest')
const pageSize = ref(6)
const currentPage = ref(1)

const dateOptions: { label: string; value: DatePreset }[] = [
  { label: '全部时间', value: 'all' },
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
  { label: '近 3 个月', value: '90d' },
  { label: '近 1 年', value: '365d' },
  { label: '自定义范围', value: 'custom' },
]

const sortOptions: { label: string; value: SortMode }[] = [
  { label: '最新优先', value: 'newest' },
  { label: '热门：点赞最多', value: 'popular' },
  { label: '最早优先', value: 'oldest' },
  { label: '阅读时长：从高到低', value: 'readDesc' },
  { label: '阅读时长：从低到高', value: 'readAsc' },
  { label: '标题：按拼音/字母', value: 'titleAsc' },
]

const pageSizeOptions = [6, 9, 12, 18]
const isApplyingRouteState = ref(false)

const isCustomDateInvalid = computed(() => {
  if (!customStartDate.value || !customEndDate.value) return false
  return new Date(customStartDate.value).getTime() > new Date(customEndDate.value).getTime()
})

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())
const hasPopularityData = computed(() => posts.value.some((post) => typeof post.likes === 'number' && Number.isFinite(post.likes)))

const filteredPosts = computed(() => {
  let result = posts.value.slice()

  if (selectedTag.value) {
    result = result.filter((post) => post.tags.some((tag) => tag.toLowerCase() === selectedTag.value.toLowerCase()))
  }

  if (datePreset.value !== 'all') {
    result = result.filter((post) => isPostInDateRange(post.publishedAt))
  }

  if (normalizedKeyword.value) {
    result = result.filter((post) => {
      const haystack = [post.title, post.excerpt, post.author.name, ...post.tags].join(' ').toLowerCase()
      return haystack.includes(normalizedKeyword.value)
    })
  }

  return result.sort(sortByMode)
})

const displayCount = computed(() => filteredPosts.value.length)

const totalPages = computed(() => Math.max(1, Math.ceil(displayCount.value / pageSize.value)))

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredPosts.value.slice(start, start + pageSize.value)
})

const rangeStart = computed(() => (displayCount.value ? (currentPage.value - 1) * pageSize.value + 1 : 0))
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, displayCount.value))

const selectedDateLabel = computed(() => {
  const matched = dateOptions.find((item) => item.value === datePreset.value)
  if (!matched) return '全部时间'
  if (matched.value !== 'custom') return matched.label

  const start = customStartDate.value || '不限'
  const end = customEndDate.value || '不限'
  return `${start} 至 ${end}`
})

const hasActiveFilters = computed(
  () => datePreset.value !== 'all' || normalizedKeyword.value.length > 0 || Boolean(selectedTag.value)
)

const activeFiltersSummary = computed(() => {
  const parts: string[] = []
  if (selectedTag.value) parts.push(`标签: ${selectedTag.value}`)
  if (datePreset.value !== 'all') parts.push(`日期: ${selectedDateLabel.value}`)
  if (normalizedKeyword.value) parts.push(`搜索: "${normalizedKeyword.value}"`)
  return parts.join(', ')
})

const visiblePages = computed(() => {
  const maxButtons = 5
  const pages: number[] = []
  let start = Math.max(1, currentPage.value - Math.floor(maxButtons / 2))
  const end = Math.min(totalPages.value, start + maxButtons - 1)
  start = Math.max(1, end - maxButtons + 1)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
})

watch([datePreset, customStartDate, customEndDate, keyword, selectedTag, sortMode, pageSize], () => {
  if (isApplyingRouteState.value) return
  currentPage.value = 1
})

watch(totalPages, (nextTotal) => {
  if (currentPage.value > nextTotal) {
    currentPage.value = nextTotal
  }
})

watch(
  () => route.query,
  (query) => {
    isApplyingRouteState.value = true
    applyQueryState(query)
    void nextTick().then(() => {
      isApplyingRouteState.value = false
    })
  },
  { immediate: true }
)

watch(
  [datePreset, customStartDate, customEndDate, keyword, selectedTag, sortMode, pageSize, currentPage],
  () => {
    if (isApplyingRouteState.value) return
    const nextQuery = buildQueryFromState()
    if (isSameQuery(route.query, nextQuery)) return
    void router.replace({ query: nextQuery })
  }
)

onMounted(() => {
  void ensurePosts().catch((err) => {
    console.warn('文章列表预加载失败', err)
  })
})

function sortByMode(a: Post, b: Post) {
  if (sortMode.value === 'newest') return sortPostsByDateDesc(a, b)
  if (sortMode.value === 'popular') return (b.likes ?? 0) - (a.likes ?? 0) || sortPostsByDateDesc(a, b)
  if (sortMode.value === 'oldest') return sortPostsByDateDesc(b, a)
  if (sortMode.value === 'readDesc') return b.readMinutes - a.readMinutes || sortPostsByDateDesc(a, b)
  if (sortMode.value === 'readAsc') return a.readMinutes - b.readMinutes || sortPostsByDateDesc(a, b)
  return a.title.localeCompare(b.title, 'zh-CN')
}

function clearFilters() {
  datePreset.value = 'all'
  customStartDate.value = ''
  customEndDate.value = ''
  keyword.value = ''
  selectedTag.value = ''
  currentPage.value = 1
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

function applyQueryState(query: Record<string, unknown>) {
  const nextState = parseArticleListQueryState(query, { pageSizeOptions })
  datePreset.value = nextState.datePreset
  customStartDate.value = nextState.customStartDate
  customEndDate.value = nextState.customEndDate
  keyword.value = nextState.keyword
  selectedTag.value = nextState.tag ?? ''
  sortMode.value = nextState.sortMode
  pageSize.value = nextState.pageSize
  currentPage.value = nextState.currentPage
}

function buildQueryFromState() {
  return buildArticleListQuery({
    datePreset: datePreset.value,
    customStartDate: customStartDate.value,
    customEndDate: customEndDate.value,
    keyword: keyword.value,
    tag: selectedTag.value,
    sortMode: sortMode.value,
    pageSize: pageSize.value,
    currentPage: currentPage.value,
  })
}

function isPostInDateRange(publishedAt: string) {
  const publishedTime = new Date(publishedAt).getTime()

  if (datePreset.value === 'custom') {
    if (isCustomDateInvalid.value) return false
    const start = customStartDate.value ? new Date(`${customStartDate.value}T00:00:00`).getTime() : -Infinity
    const end = customEndDate.value ? new Date(`${customEndDate.value}T23:59:59`).getTime() : Infinity
    return publishedTime >= start && publishedTime <= end
  }

  const dayMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '365d': 365,
  }
  const days = dayMap[datePreset.value]
  if (!days) return true
  const limit = Date.now() - days * 24 * 60 * 60 * 1000
  return publishedTime >= limit
}
</script>

<template>
  <CommunityLayout
    compact
    wide-content
    :title="sortMode === 'popular' ? '热门主题 · 按点赞数' : '全部主题'"
    :description="`显示 ${rangeStart}-${rangeEnd} / 共 ${displayCount} 篇${hasActiveFilters ? ` · ${activeFiltersSummary}` : ''}`"
  >
    <ArticleFilters
      v-model:date-preset="datePreset"
      v-model:sort-mode="sortMode"
      v-model:custom-start-date="customStartDate"
      v-model:custom-end-date="customEndDate"
      :date-options="dateOptions"
      :sort-options="sortOptions"
      :has-active-filters="hasActiveFilters"
      :is-custom-date-invalid="isCustomDateInvalid"
      @clear-filters="clearFilters"
    />
    <div v-if="selectedTag" class="tag-filter">
      <span>标签：{{ selectedTag }}</span>
      <button type="button" class="empty-reset" @click="selectedTag = ''">移除标签筛选</button>
    </div>
    <p v-if="sortMode === 'popular' && !loading && !error && !hasPopularityData" class="archive-notice" role="status">
      当前数据源尚未提供点赞统计，暂按最新发布展示。
    </p>
    <div v-if="loading" class="archive-state">正在加载主题...</div>
    <div v-else-if="error" class="archive-state archive-state--error" role="alert">{{ error }}</div>

    <div v-else-if="!filteredPosts.length" class="archive-state archive-state--empty">
      <p>没有符合当前条件的主题。</p>
      <button v-if="hasActiveFilters" type="button" class="empty-reset" @click="clearFilters">清空筛选</button>
    </div>

    <template v-else>
      <PostList :posts="paginatedPosts" />

      <div class="archive-pagination">
        <label class="page-size-control">
          <span>每页</span>
          <select v-model.number="pageSize" aria-label="每页显示数量">
            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} 篇</option>
          </select>
        </label>
        <nav v-if="totalPages > 1" class="pagination" aria-label="分页">
        <button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一页</button>
        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          :class="{ 'is-active': page === currentPage }"
          :aria-current="page === currentPage ? 'page' : undefined"
          :aria-label="`第 ${page} 页`"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button type="button" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">下一页</button>
        </nav>
        <span v-else class="page-total">共 {{ displayCount }} 篇</span>
      </div>
    </template>
  </CommunityLayout>
</template>

<style scoped lang="less">
.archive-notice {
  padding: 0 1rem;
  color: var(--ink-muted);
  font-size: 0.875rem;
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid var(--line-soft);
}
.archive-state {
  min-height: 260px;
  padding: 2rem 1rem;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.8rem;
  color: var(--ink-muted);
  text-align: center;
}

.archive-state p {
  margin: 0;
}

.archive-state--error {
  color: var(--danger-500);
}

.empty-reset {
  min-height: 36px;
  padding: 0 0.85rem;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  color: var(--ink-main);
  font-weight: 620;
  cursor: pointer;
}

.archive-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--line-soft);
}

.page-size-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ink-muted);
  font-size: 0.8rem;
}

.page-size-control select {
  min-height: 36px;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  color: var(--ink-main);
  background: var(--surface-strong);
  font: inherit;
  cursor: pointer;
}

.page-total { color: var(--ink-muted); font-size: 0.8rem; }

.archive-pagination :is(button, select):focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: 3px;
}

.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.pagination button {
  min-width: 38px;
  min-height: 36px;
  padding: 0 0.65rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  color: var(--ink-main);
  font-size: 0.8rem;
  font-weight: 620;
  cursor: pointer;
}

.pagination button:hover:enabled {
  border-color: var(--brand-500);
  color: var(--brand-500);
}

.pagination button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.pagination .is-active {
  border-color: var(--brand-500);
  background: var(--brand-500);
  color: var(--on-accent);
}

@media (max-width: 600px) {
  .archive-pagination { justify-content: center; padding: 0.85rem 0.75rem; }
  .pagination { flex-basis: 100%; }
  .pagination button { min-width: 32px; min-height: 40px; padding: 0 0.5rem; }
  .page-size-control select { font-size: 16px; }
}
</style>
