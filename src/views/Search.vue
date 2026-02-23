<template>
  <section class="search">
    <header class="search__hero">
      <p class="search__eyebrow">Search Results</p>
      <h1>{{ displayQuery }}</h1>
      <p class="search__hint">Search by title, excerpt, tags, or author.</p>

      <div class="search__bar">
        <input
          v-model="searchInput"
          ref="inputEl"
          type="text"
          placeholder="Search articles, tags, or author..."
          autocomplete="off"
          @keyup.enter="applySearch"
          @focus="openDropdown"
          @input="openDropdown"
        />
        <button type="button" class="search__submit" aria-label="Search" @click="applySearch">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79L20 22l2-2-6.5-6zM10 15.5A5.5 5.5 0 1 1 10 4a5.5 5.5 0 0 1 0 11.5z"
            />
          </svg>
        </button>
      </div>

      <div v-show="showDropdown" ref="dropdownEl" class="search__dropdown" role="listbox">
        <div class="dropdown__section">
          <div class="dropdown__header">
            <span>Recommended</span>
            <span class="dropdown__hint">Top reads by estimated reading time</span>
          </div>
          <ol class="hot-list">
            <li v-for="(post, index) in hotPosts" :key="post.id">
              <button type="button" class="hot-list__item" @click="selectSuggestion(post.title)">
                <span class="hot-list__rank" :data-top="index < 3">{{ index + 1 }}</span>
                <span class="hot-list__text">{{ post.title }}</span>
              </button>
            </li>
          </ol>
        </div>

        <div v-if="searchHistory.length" class="dropdown__section">
          <div class="dropdown__header">
            <span>Search history</span>
            <button type="button" class="link-btn" @click="clearHistory">Clear history</button>
          </div>
          <div class="history-list">
            <button
              v-for="item in searchHistory"
              :key="item"
              type="button"
              class="chip"
              @click="selectSuggestion(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div v-if="normalizedQuery && suggestionPosts.length" class="dropdown__section">
          <div class="dropdown__header">
            <span>Suggestions</span>
            <span class="dropdown__hint">Sorted by relevance</span>
          </div>
          <ul class="suggestion-list">
            <li v-for="post in suggestionPosts" :key="post.id">
              <button type="button" class="suggestion" @click="selectSuggestion(post.title)">
                <span class="suggestion__title">{{ post.title }}</span>
                <span class="suggestion__meta">{{ post.author.name }} - {{ formatDate(post.publishedAt) }}</span>
              </button>
            </li>
          </ul>
        </div>

        <div v-else-if="normalizedQuery" class="dropdown__section dropdown__section--empty">
          <span>No result found. Try another keyword.</span>
        </div>
      </div>

      <p v-if="!loading && !error" class="search__meta">{{ filteredPosts.length }} matched post(s)</p>
    </header>

    <section class="feed" aria-live="polite">
      <div v-if="loading" class="feed__state">Searching...</div>
      <div v-else-if="error" class="feed__state feed__state--error">{{ error }}</div>

      <div v-else>
        <div v-if="!filteredPosts.length" class="feed__state feed__state--empty">
          <p>No matched content found. Try other keywords.</p>
        </div>

        <PostList v-else class="feed__grid feed__grid--list" :posts="filteredPosts" />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'
import { buildRecommendedPosts, formatPostDate, sortPostsByDateDesc } from '@/features/post/utils/post'
import { usePostSearch } from '@/features/search/composables/usePostSearch'
import { useSearchHistory } from '@/features/search/composables/useSearchHistory'
import PostList from '@/components/post/PostList.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const posts = ref<Post[]>([])
const searchInput = ref<string>((route.query.q as string) ?? '')
const showDropdown = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)
const dropdownEl = ref<HTMLElement | null>(null)

const { searchHistory, loadHistory, persistHistory, clearHistory } = useSearchHistory()
const { normalizedQuery, rankedByRelevance } = usePostSearch(posts, searchInput)

const displayQuery = computed(() => searchInput.value.trim() || 'All posts')

const filteredPosts = computed(() => {
  if (!normalizedQuery.value) return posts.value.slice().sort(sortPostsByDateDesc)
  return rankedByRelevance.value.map((item) => item.post)
})

const hotPosts = computed(() =>
  buildRecommendedPosts(posts.value, {
    poolMin: 10,
    poolMax: 10,
    take: 10,
    randomize: false,
  })
)

const suggestionPosts = computed(() => rankedByRelevance.value.slice(0, 5).map((item) => item.post))

onMounted(async () => {
  loadHistory()
  document.addEventListener('click', handleOutsideClick)

  try {
    posts.value = await fetchPosts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load search results'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})

watch(
  () => route.query.q,
  (value) => {
    searchInput.value = (value as string) ?? ''
  }
)

watch(normalizedQuery, () => {
  showDropdown.value = true
})

function applySearch() {
  const q = searchInput.value.trim()
  if (q) persistHistory(q)
  showDropdown.value = false
  router.push({ path: '/search', query: q ? { q } : {} })
}

function selectSuggestion(term: string) {
  searchInput.value = term
  applySearch()
}

function formatDate(dateIso: string) {
  return formatPostDate(dateIso)
}

function openDropdown() {
  showDropdown.value = true
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as Node
  const insideDropdown = dropdownEl.value?.contains(target)
  const insideInput = inputEl.value?.contains(target)
  if (!insideDropdown && !insideInput) {
    showDropdown.value = false
  }
}
</script>

<style scoped lang="less">
.search {
  width: 100%;
  padding: 72px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search__hero {
  max-width: 1080px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;

  h1 {
    margin: 0;
    font-size: clamp(1.8rem, 3vw, 2.4rem);
    color: var(--ink-strong);
    letter-spacing: -0.02em;
  }
}

.search__eyebrow {
  margin: 0;
  color: var(--brand-500);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.search__hint,
.search__meta {
  margin: 0;
  color: var(--ink-muted);
}

.search__dropdown {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: calc(100% + 0.5rem);
  width: 100%;
  max-width: 840px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 1.25rem;
  text-align: left;
  z-index: 5;
  backdrop-filter: blur(10px);
}

.dropdown__section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &--empty {
    color: var(--ink-muted);
  }
}

.dropdown__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--ink-strong);
}

.dropdown__hint {
  font-weight: 500;
  color: var(--ink-muted);
  font-size: 0.9rem;
}

.hot-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.hot-list__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--line-soft);
  background: #fff;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  text-align: left;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(0, 113, 227, 0.35);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.09);
  }
}

.hot-list__rank {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: #ececf0;
  color: #2d2d32;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.hot-list__rank[data-top='true'] {
  background: var(--brand-500);
  color: #fff;
}

.hot-list__text {
  flex: 1;
  color: var(--ink-strong);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.84);
  color: var(--ink-main);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(0, 113, 227, 0.35);
    color: var(--brand-500);
  }
}

.link-btn {
  background: none;
  border: none;
  color: var(--brand-500);
  cursor: pointer;
  font-weight: 600;
  padding: 0;
}

.suggestion-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.suggestion {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: rgba(0, 113, 227, 0.35);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
  }
}

.suggestion__title {
  display: block;
  color: var(--ink-strong);
  font-weight: 700;
  margin-bottom: 0.15rem;
}

.suggestion__meta {
  color: var(--ink-muted);
  font-size: 0.9rem;
}

.search__bar {
  margin: 0.5rem auto 0;
  width: 100%;
  max-width: 840px;
  position: relative;
  display: flex;

  input {
    flex: 1;
    padding: 1rem 3.25rem 1rem 1.25rem;
    border-radius: 16px;
    border: 1px solid var(--line-soft);
    background: rgba(255, 255, 255, 0.88);
    font-size: 1rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: rgba(0, 113, 227, 0.4);
      box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.12);
    }
  }

  .search__submit {
    position: absolute;
    right: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    width: 2.2rem;
    height: 2.2rem;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--brand-500);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;

    &:hover {
      background: rgba(0, 113, 227, 0.12);
    }

    svg {
      width: 1.3rem;
      height: 1.3rem;
      fill: currentColor;
    }
  }
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: 8px;

  &__state {
    padding: 2rem;
    text-align: center;
    border-radius: 18px;
    border: 1px solid var(--line-soft);
    background: rgba(255, 255, 255, 0.78);
    color: var(--ink-muted);

    &--error {
      background: #fff5f5;
      color: var(--danger-500);
    }

    &--empty {
      background: #f7f9fc;
      color: var(--ink-main);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

@media (max-width: 900px) {
  .hot-list {
    grid-template-columns: 1fr;
  }

  .search__bar {
    max-width: 100%;
  }
}
</style>
