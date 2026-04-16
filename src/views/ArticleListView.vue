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

const route = useRoute()
const router = useRouter()

const postsStore = usePostsStore()
const { posts, loading, error } = storeToRefs(postsStore)
const { ensurePosts } = postsStore

const datePreset = ref<DatePreset>('all')
const customStartDate = ref('')
const customEndDate = ref('')
const keyword = ref('')
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

const filteredPosts = computed(() => {
  let result = posts.value.slice()

  if (datePreset.value !== 'all') {
    result = result.filter((post) => isPostInDateRange(post.publishedAt))
  }

  if (normalizedKeyword.value) {
    result = result.filter((post) => {
      const haystack = [post.title, post.excerpt, post.author.name].join(' ').toLowerCase()
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
  () => datePreset.value !== 'all' || normalizedKeyword.value.length > 0
)

const activeFiltersSummary = computed(() => {
  const parts: string[] = []
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

watch([datePreset, customStartDate, customEndDate, keyword, sortMode, pageSize], () => {
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
  [datePreset, customStartDate, customEndDate, keyword, sortMode, pageSize, currentPage],
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
  sortMode.value = 'newest'
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
  <section class="article-page">
    <section class="article-layout">
      <section class="feed" aria-live="polite">
        <header class="feed__head">
          <div class="feed__title">
            <h2>文章列表</h2>
            <p class="feed__meta">
              显示 {{ rangeStart }}-{{ rangeEnd }} / 共 {{ displayCount }} 篇
              <span v-if="hasActiveFilters">({{ activeFiltersSummary }})</span>
            </p>
          </div>

          <div class="feed__toolbar">
            <label class="control-field control-field--search">
              <span>搜索</span>
              <input v-model="keyword" type="search" placeholder="标题、摘要、作者..." />
            </label>

            <label class="control-field">
              <span>排序</span>
              <select v-model="sortMode">
                <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="control-field">
              <span>每页</span>
              <select v-model.number="pageSize">
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </label>
          </div>
        </header>

        <div v-if="loading" class="feed__state">加载中...</div>
        <div v-else-if="error" class="feed__state feed__state--error">{{ error }}</div>

        <div v-else>
          <div v-if="!filteredPosts.length" class="feed__state feed__state--empty">
            <p>没有符合当前条件的文章。</p>
            <button v-if="hasActiveFilters" type="button" class="empty-reset" @click="clearFilters">清空筛选</button>
          </div>

          <template v-else>
            <PostList class="feed__grid feed__grid--list" :posts="paginatedPosts" />

            <nav v-if="totalPages > 1" class="pagination" aria-label="分页">
              <button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一页</button>
              <button
                v-for="page in visiblePages"
                :key="page"
                type="button"
                :class="{ 'is-active': page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <button type="button" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">下一页</button>
            </nav>
          </template>
        </div>
      </section>

      <ArticleFilters
        v-model:date-preset="datePreset"
        v-model:sort-mode="sortMode"
        v-model:page-size="pageSize"
        v-model:custom-start-date="customStartDate"
        v-model:custom-end-date="customEndDate"
        :date-options="dateOptions"
        :sort-options="sortOptions"
        :page-size-options="pageSizeOptions"
        :has-active-filters="hasActiveFilters"
        :is-custom-date-invalid="isCustomDateInvalid"
        @clear-filters="clearFilters"
      />
    </section>
  </section>
</template>

<style scoped lang="less">
.article-page {
  width: 100%;
  padding: 60px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

.article-page::before {
  content: '';
  position: absolute;
  inset: 8px auto auto 50%;
  width: min(1040px, 92vw);
  height: 180px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(circle, rgba(0, 113, 227, 0.08), transparent 72%);
  pointer-events: none;
  filter: blur(12px);
}

.article-layout {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.5rem;
  align-items: flex-start;
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;

  &__head {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1.1rem 1.2rem;
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-lg);
    background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--brand-100) 55%, transparent), transparent 36%),
      linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 98%, transparent), color-mix(in srgb, var(--surface) 96%, transparent));
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(14px);
  }

  &__title {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;

    h2 {
      margin: 0;
      color: var(--ink-strong);
      font-size: clamp(1.4rem, 2.4vw, 2rem);
      letter-spacing: -0.01em;
    }
  }

  &__meta {
    margin: 0;
    color: var(--ink-muted);
    font-size: 0.9rem;
  }

  &__toolbar {
    display: none;
  }

  &__state {
    padding: 2rem;
    text-align: center;
    border-radius: var(--radius-lg);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 98%, transparent), color-mix(in srgb, var(--surface) 96%, transparent));
    border: 1px solid var(--line-soft);
    color: var(--ink-muted);
    box-shadow: var(--shadow-sm);

    p {
      margin: 0;
    }

    &--error {
      background: var(--danger-bg);
      color: var(--danger-500);
    }

    &--empty {
      background: var(--bg-canvas-soft);
      color: var(--ink-main);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.8rem;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

.control-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  span {
    font-size: 0.82rem;
    color: var(--ink-muted);
    font-weight: 600;
  }

  input,
  select {
    width: 100%;
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--ink-strong);
    padding: 0.55rem 0.65rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: rgba(0, 113, 227, 0.35);
      box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
    }
  }
}

.empty-reset {
  border: 1px solid var(--line-soft);
  background: linear-gradient(180deg, var(--surface-strong), var(--surface));
  color: var(--brand-500);
  border-radius: var(--radius-sm);
  padding: 0.45rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.pagination {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  justify-content: center;

  button {
    border: 1px solid var(--line-soft);
    background: linear-gradient(180deg, var(--surface-strong), var(--surface));
    color: var(--ink-main);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    font-weight: 600;
    min-width: 40px;

    &:disabled {
      cursor: not-allowed;
      color: var(--ink-muted);
      border-color: var(--line-soft);
    }
  }

  .is-active {
    background: var(--brand-500);
    color: #fff;
    border-color: var(--brand-500);
  }
}

@media (max-width: 1100px) {
  .article-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .feed__toolbar {
    grid-template-columns: 1fr;
  }

  .feed__title {
    flex-direction: column;
    align-items: flex-start;
  }
}

</style>
