<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'
import Article from '@/components/Article.vue'

type DatePreset = 'all' | '7d' | '30d' | '90d' | '365d' | 'custom'

const route = useRoute()
const loading = ref(true)
const error = ref<string | null>(null)
const posts = ref<Post[]>([])
const selectedTag = ref<string>('all')
const datePreset = ref<DatePreset>('all')
const customStartDate = ref('')
const customEndDate = ref('')

const dateOptions: { label: string; value: DatePreset }[] = [
  { label: '全部时间', value: 'all' },
  { label: '最近 7 天', value: '7d' },
  { label: '最近 30 天', value: '30d' },
  { label: '最近 3 个月', value: '90d' },
  { label: '最近 1 年', value: '365d' },
  { label: '自定义日期范围', value: 'custom' },
]

const hasSlug = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug.trim().length > 0
})

const sortedPosts = computed(() => posts.value.slice().sort(sortByDateDesc))

const tagOptions = computed(() => {
  const counter = new Map<string, number>()
  for (const post of posts.value) {
    for (const tag of post.tags) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1)
    }
  }

  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
})

const isCustomDateInvalid = computed(() => {
  if (!customStartDate.value || !customEndDate.value) return false
  return new Date(customStartDate.value).getTime() > new Date(customEndDate.value).getTime()
})

const filteredPosts = computed(() => {
  let result = sortedPosts.value

  if (selectedTag.value !== 'all') {
    result = result.filter((post) => post.tags.includes(selectedTag.value))
  }

  if (datePreset.value !== 'all') {
    result = result.filter((post) => isPostInDateRange(post.publishedAt))
  }

  return result
})

const displayCount = computed(() => filteredPosts.value.length)

const selectedDateLabel = computed(() => {
  const matched = dateOptions.find((item) => item.value === datePreset.value)
  if (!matched) return '全部时间'
  if (matched.value !== 'custom') return matched.label

  const start = customStartDate.value || '不限'
  const end = customEndDate.value || '不限'
  return `${start} 至 ${end}`
})

const hasActiveFilters = computed(() => selectedTag.value !== 'all' || datePreset.value !== 'all')

const activeFiltersSummary = computed(() => {
  const parts: string[] = []
  if (selectedTag.value !== 'all') parts.push(`标签：${selectedTag.value}`)
  if (datePreset.value !== 'all') parts.push(`日期：${selectedDateLabel.value}`)
  return parts.join('，')
})

async function loadPosts() {
  loading.value = true
  error.value = null
  try {
    posts.value = await fetchPosts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载文章失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!hasSlug.value) {
    void loadPosts()
  }
})

watch(hasSlug, (value) => {
  if (!value && posts.value.length === 0) {
    void loadPosts()
  }
})

function selectTag(tag: string) {
  selectedTag.value = tag
}

function clearFilters() {
  selectedTag.value = 'all'
  datePreset.value = 'all'
  customStartDate.value = ''
  customEndDate.value = ''
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

function sortByDateDesc(a: Post, b: Post) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateIso))
}
</script>

<template>
  <section v-if="hasSlug" class="article-detail">
    <Article />
  </section>

  <section v-else class="article-page">
    <header class="article-page__hero">
      <p class="article-page__eyebrow">文章</p>
      <h1>全部文章</h1>
      <p class="article-page__hint">在右侧筛选标签和发布日期，快速找到你想看的内容。</p>
    </header>

    <section class="article-layout">
      <section class="feed" aria-live="polite">
        <header class="feed__head">
          <h2>文章列表</h2>
          <p class="feed__meta">
            共 {{ displayCount }} 篇
            <span v-if="hasActiveFilters">，{{ activeFiltersSummary }}</span>
          </p>
        </header>

        <div v-if="loading" class="feed__state">加载中...</div>
        <div v-else-if="error" class="feed__state feed__state--error">{{ error }}</div>

        <div v-else>
          <div v-if="!filteredPosts.length" class="feed__state feed__state--empty">
            暂无匹配的文章，请调整右侧筛选条件。
          </div>

          <div v-else class="feed__grid feed__grid--list">
            <article v-for="post in filteredPosts" :key="post.id" class="post-card post-card--list">
              <router-link :to="`/article/${post.slug}`" class="card-link-wrapper">
                <img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" class="post-card__cover" />

                <div class="post-card__body">
                  <div class="post-card__meta">
                    <span class="post-card__date">{{ formatDate(post.publishedAt) }}</span>
                    <span class="post-card__dot" aria-hidden="true">·</span>
                    <span>{{ post.readMinutes }} 分钟读完</span>
                  </div>

                  <h3>{{ post.title }}</h3>
                  <p class="post-card__excerpt">{{ post.excerpt }}</p>

                  <div class="post-card__footer">
                    <div class="author">
                      <img v-if="post.author.avatarUrl" :src="post.author.avatarUrl" :alt="post.author.name" />
                      <span>{{ post.author.name }}</span>
                    </div>

                    <div class="tags">
                      <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
                    </div>
                  </div>
                </div>
              </router-link>
            </article>
          </div>
        </div>
      </section>

      <aside class="filter-box">
        <header class="filter-box__head">
          <h3>筛选</h3>
          <button type="button" class="filter-reset" :disabled="!hasActiveFilters" @click="clearFilters">
            重置
          </button>
        </header>

        <section class="filter-group">
          <p class="filter-group__title">标签</p>
          <div class="filter-tags">
            <button
              type="button"
              class="tag-chip"
              :class="{ 'tag-chip--active': selectedTag === 'all' }"
              @click="selectTag('all')"
            >
              <span>全部</span>
              <span class="tag-chip__count">{{ posts.length }}</span>
            </button>

            <button
              v-for="item in tagOptions"
              :key="item.name"
              type="button"
              class="tag-chip"
              :class="{ 'tag-chip--active': selectedTag === item.name }"
              @click="selectTag(item.name)"
            >
              <span>#{{ item.name }}</span>
              <span class="tag-chip__count">{{ item.count }}</span>
            </button>
          </div>
        </section>

        <section class="filter-group">
          <p class="filter-group__title">发布日期</p>
          <select v-model="datePreset" class="filter-select">
            <option v-for="option in dateOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <div v-if="datePreset === 'custom'" class="date-range">
            <label>
              <span>开始日期</span>
              <input v-model="customStartDate" type="date" />
            </label>
            <label>
              <span>结束日期</span>
              <input v-model="customEndDate" type="date" />
            </label>
          </div>

          <p v-if="isCustomDateInvalid" class="filter-error">结束日期不能早于开始日期。</p>
        </section>
      </aside>
    </section>
  </section>
</template>

<style scoped lang="less">
.article-page {
  width: 100%;
  padding: 80px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
    font-size: clamp(2rem, 3.4vw, 2.6rem);
    color: #0f172a;
  }
}

.article-page__eyebrow {
  margin: 0;
  color: #2563eb;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.article-page__hint {
  margin: 0;
  color: #475569;
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

.filter-box {
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
  padding: 1rem;
  position: sticky;
  top: 120px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #0f172a;
      font-weight: 700;
    }
  }
}

.filter-reset {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #2563eb;
  padding: 0.35rem 0.75rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    color: #94a3b8;
    border-color: #e2e8f0;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    border-color: #2563eb;
    background: #eff6ff;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.filter-group + .filter-group {
  margin-top: 1.1rem;
  padding-top: 1.1rem;
  border-top: 1px dashed #e2e8f0;
}

.filter-group__title {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-chip {
  border: 1px solid #dbeafe;
  background: #f8fbff;
  color: #1d4ed8;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  &:hover {
    border-color: #93c5fd;
    background: #eff6ff;
  }
}

.tag-chip--active {
  border-color: transparent;
  background: #2563eb;
  color: #fff;
}

.tag-chip__count {
  font-size: 0.8rem;
  opacity: 0.85;
}

.filter-select {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  background: #fff;
  color: #0f172a;
}

.date-range {
  display: grid;
  gap: 0.6rem;

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    color: #475569;
    font-size: 0.85rem;
  }

  input {
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 0.5rem 0.6rem;
    color: #0f172a;
  }
}

.filter-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.85rem;
  font-weight: 600;
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;

    h2 {
      margin: 0;
      color: #0f172a;
      font-size: clamp(1.4rem, 2.4vw, 2rem);
    }
  }

  &__meta {
    margin: 0;
    color: #475569;
    font-size: 0.95rem;
  }

  &__state {
    padding: 2rem;
    text-align: center;
    border-radius: 16px;
    background: #f1f5f9;
    color: #475569;

    &--error {
      background: #fee2e2;
      color: #b91c1c;
    }

    &--empty {
      background: #eef2ff;
      color: #4338ca;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

.card-link-wrapper {
  text-decoration: none;
  color: inherit;
  display: contents;
}

.post-card {
  display: flex;
  flex-direction: row;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  }

  &__cover {
    width: 320px;
    height: auto;
    flex-shrink: 0;
    object-fit: cover;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1.4rem;
    flex: 1;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #64748b;
    font-size: 0.9rem;
  }

  &__dot {
    opacity: 0.6;
  }

  h3 {
    margin: 0;
    font-size: 1.35rem;
    color: #0f172a;
  }

  &__excerpt {
    margin: 0;
    color: #475569;
    line-height: 1.6;
    flex-grow: 1;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
}

.author {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .tag {
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 0.85rem;
  }
}

@media (max-width: 1100px) {
  .article-layout {
    grid-template-columns: 1fr;
  }

  .filter-box {
    position: static;
    order: -1;
  }
}

@media (max-width: 900px) {
  .post-card {
    flex-direction: column;

    &__cover {
      width: 100%;
      height: 200px;
    }
  }
}
</style>
