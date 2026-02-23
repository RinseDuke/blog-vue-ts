<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'
import { sortPostsByDateDesc } from '@/features/post/utils/post'
import PostList from '@/components/post/PostList.vue'
import ArticleFilters from '@/components/post/ArticleFilters.vue'

type DatePreset = 'all' | '7d' | '30d' | '90d' | '365d' | 'custom'
type SortMode = 'newest' | 'oldest' | 'readDesc' | 'readAsc' | 'titleAsc'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const posts = ref<Post[]>([])

const selectedTag = ref<string>('all')
const datePreset = ref<DatePreset>('all')
const customStartDate = ref('')
const customEndDate = ref('')
const keyword = ref('')
const sortMode = ref<SortMode>('newest')
const pageSize = ref(6)
const currentPage = ref(1)

const dateOptions: { label: string; value: DatePreset }[] = [
  { label: 'All time', value: 'all' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '90d' },
  { label: 'Last 1 year', value: '365d' },
  { label: 'Custom range', value: 'custom' },
]

const sortOptions: { label: string; value: SortMode }[] = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Read time: high to low', value: 'readDesc' },
  { label: 'Read time: low to high', value: 'readAsc' },
  { label: 'Title: A to Z', value: 'titleAsc' },
]

const pageSizeOptions = [6, 9, 12, 18]
const isApplyingRouteState = ref(false)

const tagOptions = computed(() => {
  const counter = new Map<string, number>()
  for (const post of posts.value) {
    for (const tag of post.tags) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1)
    }
  }

  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

const isCustomDateInvalid = computed(() => {
  if (!customStartDate.value || !customEndDate.value) return false
  return new Date(customStartDate.value).getTime() > new Date(customEndDate.value).getTime()
})

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())

const filteredPosts = computed(() => {
  let result = posts.value.slice()

  if (selectedTag.value !== 'all') {
    result = result.filter((post) => post.tags.includes(selectedTag.value))
  }

  if (datePreset.value !== 'all') {
    result = result.filter((post) => isPostInDateRange(post.publishedAt))
  }

  if (normalizedKeyword.value) {
    result = result.filter((post) => {
      const haystack = [post.title, post.excerpt, post.author.name, post.tags.join(' ')].join(' ').toLowerCase()
      return haystack.includes(normalizedKeyword.value)
    })
  }

  return result.sort(sortByMode)
})

const displayCount = computed(() => filteredPosts.value.length)
const totalPosts = computed(() => posts.value.length)
const totalTags = computed(() => tagOptions.value.length)
const totalAuthors = computed(() => new Set(posts.value.map((post) => post.author.id)).size)

const totalPages = computed(() => Math.max(1, Math.ceil(displayCount.value / pageSize.value)))

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredPosts.value.slice(start, start + pageSize.value)
})

const rangeStart = computed(() => (displayCount.value ? (currentPage.value - 1) * pageSize.value + 1 : 0))
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, displayCount.value))

const selectedDateLabel = computed(() => {
  const matched = dateOptions.find((item) => item.value === datePreset.value)
  if (!matched) return 'All time'
  if (matched.value !== 'custom') return matched.label

  const start = customStartDate.value || 'No limit'
  const end = customEndDate.value || 'No limit'
  return `${start} to ${end}`
})

const hasActiveFilters = computed(
  () => selectedTag.value !== 'all' || datePreset.value !== 'all' || normalizedKeyword.value.length > 0
)

const activeFiltersSummary = computed(() => {
  const parts: string[] = []
  if (selectedTag.value !== 'all') parts.push(`Tag: ${selectedTag.value}`)
  if (datePreset.value !== 'all') parts.push(`Date: ${selectedDateLabel.value}`)
  if (normalizedKeyword.value) parts.push(`Search: "${normalizedKeyword.value}"`)
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

watch([selectedTag, datePreset, customStartDate, customEndDate, keyword, sortMode, pageSize], () => {
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
    isApplyingRouteState.value = false
  },
  { immediate: true }
)

watch(
  [selectedTag, datePreset, customStartDate, customEndDate, keyword, sortMode, pageSize, currentPage],
  () => {
    if (isApplyingRouteState.value) return
    const nextQuery = buildQueryFromState()
    if (isSameQuery(route.query, nextQuery)) return
    void router.replace({ query: nextQuery })
  }
)

async function loadPosts() {
  loading.value = true
  error.value = null
  try {
    posts.value = await fetchPosts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load posts'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadPosts()
})

function sortByMode(a: Post, b: Post) {
  if (sortMode.value === 'newest') return sortPostsByDateDesc(a, b)
  if (sortMode.value === 'oldest') return sortPostsByDateDesc(b, a)
  if (sortMode.value === 'readDesc') return b.readMinutes - a.readMinutes || sortPostsByDateDesc(a, b)
  if (sortMode.value === 'readAsc') return a.readMinutes - b.readMinutes || sortPostsByDateDesc(a, b)
  return a.title.localeCompare(b.title)
}

function clearFilters() {
  selectedTag.value = 'all'
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
  const tag = toQueryString(query.tag)
  selectedTag.value = tag || 'all'

  const date = toQueryString(query.date)
  if (isDatePreset(date)) {
    datePreset.value = date
  } else {
    datePreset.value = 'all'
  }

  customStartDate.value = datePreset.value === 'custom' ? toQueryString(query.start) : ''
  customEndDate.value = datePreset.value === 'custom' ? toQueryString(query.end) : ''

  keyword.value = toQueryString(query.q)

  const sort = toQueryString(query.sort)
  sortMode.value = isSortMode(sort) ? sort : 'newest'

  const size = Number.parseInt(toQueryString(query.size), 10)
  pageSize.value = pageSizeOptions.includes(size) ? size : 6

  const page = Number.parseInt(toQueryString(query.page), 10)
  currentPage.value = Number.isFinite(page) && page > 0 ? page : 1
}

function buildQueryFromState() {
  const query: Record<string, string> = {}

  if (selectedTag.value !== 'all') query.tag = selectedTag.value
  if (datePreset.value !== 'all') query.date = datePreset.value
  if (datePreset.value === 'custom') {
    if (customStartDate.value) query.start = customStartDate.value
    if (customEndDate.value) query.end = customEndDate.value
  }
  if (normalizedKeyword.value) query.q = normalizedKeyword.value
  if (sortMode.value !== 'newest') query.sort = sortMode.value
  if (pageSize.value !== 6) query.size = String(pageSize.value)
  if (currentPage.value > 1) query.page = String(currentPage.value)

  return query
}

function isSameQuery(current: Record<string, unknown>, next: Record<string, string>) {
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

function toQueryString(value: unknown) {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : ''
  return typeof value === 'string' ? value : ''
}

function isDatePreset(value: string): value is DatePreset {
  return ['all', '7d', '30d', '90d', '365d', 'custom'].includes(value)
}

function isSortMode(value: string): value is SortMode {
  return ['newest', 'oldest', 'readDesc', 'readAsc', 'titleAsc'].includes(value)
}

function isPostInDateRange(publishedAt: string) {
  const publishedTime = new Date(publishedAt).getTime()

  if (datePreset.value === 'custom') {
    if (isCustomDateInvalid.value) return false
    const start = customStartDate.value ? new Date(`${customStartDate.value}T00:00:00`).getTime() : -Infinity
    const end = customEndDate.value ? new Date(`${customEndDate.value}T23:59:59`).getTime() : Infinity
    return publishedTime >= start && publishedTime <= end
  }

  const dayMap: Record<Exclude<DatePreset, 'all' | 'custom'>, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '365d': 365,
  }
  const days = dayMap[datePreset.value as Exclude<DatePreset, 'all' | 'custom'>]
  const limit = Date.now() - days * 24 * 60 * 60 * 1000
  return publishedTime >= limit
}
</script>

<template>
  <section class="article-page">
    <header class="article-page__hero">
      <p class="article-page__eyebrow">Articles</p>
      <h1>Article Showcase</h1>
      <p class="article-page__hint">
        Search, filter, and sort your content quickly. This page is now ready for larger-scale content management.
      </p>

      <div class="article-page__stats">
        <article class="hero-stat">
          <p>Total posts</p>
          <strong>{{ totalPosts }}</strong>
        </article>
        <article class="hero-stat">
          <p>Topics</p>
          <strong>{{ totalTags }}</strong>
        </article>
        <article class="hero-stat">
          <p>Authors</p>
          <strong>{{ totalAuthors }}</strong>
        </article>
        <article class="hero-stat">
          <p>Visible now</p>
          <strong>{{ displayCount }}</strong>
        </article>
      </div>
    </header>

    <section class="article-layout">
      <section class="feed" aria-live="polite">
        <header class="feed__head">
          <div class="feed__title">
            <h2>Article List</h2>
            <p class="feed__meta">
              Showing {{ rangeStart }}-{{ rangeEnd }} of {{ displayCount }} posts
              <span v-if="hasActiveFilters">({{ activeFiltersSummary }})</span>
            </p>
          </div>

          <div class="feed__toolbar">
            <label class="control-field control-field--search">
              <span>Search</span>
              <input v-model="keyword" type="search" placeholder="Title, excerpt, author, tag..." />
            </label>

            <label class="control-field">
              <span>Sort</span>
              <select v-model="sortMode">
                <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="control-field">
              <span>Per page</span>
              <select v-model.number="pageSize">
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </label>
          </div>
        </header>

        <div v-if="loading" class="feed__state">Loading...</div>
        <div v-else-if="error" class="feed__state feed__state--error">{{ error }}</div>

        <div v-else>
          <div v-if="!filteredPosts.length" class="feed__state feed__state--empty">
            <p>No articles match the current criteria.</p>
            <button v-if="hasActiveFilters" type="button" class="empty-reset" @click="clearFilters">Clear filters</button>
          </div>

          <template v-else>
            <PostList class="feed__grid feed__grid--list" :posts="paginatedPosts" />

            <nav v-if="totalPages > 1" class="pagination" aria-label="Pagination">
              <button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Previous</button>
              <button
                v-for="page in visiblePages"
                :key="page"
                type="button"
                :class="{ 'is-active': page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <button type="button" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next</button>
            </nav>
          </template>
        </div>
      </section>

      <ArticleFilters
        v-model:selected-tag="selectedTag"
        v-model:date-preset="datePreset"
        v-model:custom-start-date="customStartDate"
        v-model:custom-end-date="customEndDate"
        :tag-options="tagOptions"
        :total-posts="posts.length"
        :date-options="dateOptions"
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
  padding: 72px 20px 42px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.article-page__hero {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  h1 {
    margin: 0;
    font-size: clamp(2rem, 3.4vw, 2.8rem);
    color: var(--ink-strong);
    letter-spacing: -0.02em;
  }
}

.article-page__eyebrow {
  margin: 0;
  color: var(--brand-500);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.article-page__hint {
  margin: 0;
  color: var(--ink-muted);
}

.article-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.hero-stat {
  border-radius: 16px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.78);
  padding: 0.84rem 0.9rem;
  backdrop-filter: blur(8px);

  p {
    margin: 0;
    color: var(--ink-muted);
    font-size: 0.85rem;
  }

  strong {
    margin-top: 0.2rem;
    display: block;
    color: var(--ink-strong);
    font-size: 1.3rem;
    letter-spacing: -0.01em;
  }
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
    display: grid;
    grid-template-columns: minmax(0, 1fr) 230px 120px;
    gap: 0.7rem;
  }

  &__state {
    padding: 2rem;
    text-align: center;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid var(--line-soft);
    color: var(--ink-muted);

    p {
      margin: 0;
    }

    &--error {
      background: #fff5f5;
      color: var(--danger-500);
    }

    &--empty {
      background: #f7f9fc;
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
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.88);
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
  background: #fff;
  color: var(--brand-500);
  border-radius: 10px;
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
    background: #fff;
    color: var(--ink-main);
    border-radius: 10px;
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    font-weight: 600;
    min-width: 40px;

    &:disabled {
      cursor: not-allowed;
      color: #a1a1aa;
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
  .article-page__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .feed__toolbar {
    grid-template-columns: 1fr;
  }

  .feed__title {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 560px) {
  .article-page__stats {
    grid-template-columns: 1fr;
  }
}
</style>
