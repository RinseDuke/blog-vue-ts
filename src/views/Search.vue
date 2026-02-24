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
          @keyup.enter="triggerSearch"
          @focus="openDropdown"
          @input="openDropdown"
        />
        <button type="button" class="search__submit" aria-label="Search" @click="triggerSearch">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79L20 22l2-2-6.5-6zM10 15.5A5.5 5.5 0 1 1 10 4a5.5 5.5 0 0 1 0 11.5z"
            />
          </svg>
        </button>
      </div>

      <div v-show="showDropdown" ref="dropdownEl" class="search__dropdown" role="listbox">
        <SearchDropdownContent
          :recommended-posts="hotPosts"
          :search-history="searchHistory"
          :suggestion-posts="suggestionPosts"
          :normalized-query="normalizedQuery"
          :suggestion-meta-formatter="formatSuggestionMeta"
          @select="selectSuggestion"
          @clear-history="clearHistory"
        />
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Post } from '@/types/post'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { formatPostDate } from '@/features/post/utils/post'
import { usePostSearchBundle } from '@/features/search/composables/usePostSearchBundle'
import { useSearchHistory } from '@/features/search/composables/useSearchHistory'
import { useSearchDropdown } from '@/features/search/composables/useSearchDropdown'
import PostList from '@/components/post/PostList.vue'
import SearchDropdownContent from '@/components/search/SearchDropdownContent.vue'

const route = useRoute()
const router = useRouter()

const { posts, loading, error, ensurePosts } = usePostsStore()
const searchInput = ref<string>((route.query.q as string) ?? '')

const { searchHistory, loadHistory, persistHistory, clearHistory } = useSearchHistory()
const { normalizedQuery, filteredPosts, suggestionPosts, recommendedPosts: hotPosts } = usePostSearchBundle(
  posts,
  searchInput,
  {
    suggestionLimit: 5,
    includeAllWhenQueryEmpty: true,
    recommendation: {
      poolMin: 10,
      poolMax: 10,
      take: 10,
      randomize: false,
    },
  }
)
const { showDropdown, inputEl, dropdownEl, openDropdown, triggerSearch, selectSuggestion } = useSearchDropdown({
  normalizedQuery,
  getCurrentInput: () => searchInput.value,
  setInputValue: (value: string) => {
    searchInput.value = value
  },
  allowEmptySearch: true,
  onSearch: (term: string) => {
    if (term) persistHistory(term)
    void router.push({ path: '/search', query: term ? { q: term } : {} })
  },
})

const displayQuery = computed(() => searchInput.value.trim() || 'All posts')

onMounted(async () => {
  loadHistory()

  try {
    await ensurePosts()
  } catch (err) {
    console.warn('Failed to preload posts for search page', err)
  }
})

watch(
  () => route.query.q,
  (value) => {
    searchInput.value = (value as string) ?? ''
  }
)

function formatDate(dateIso: string) {
  return formatPostDate(dateIso)
}

function formatSuggestionMeta(post: Post) {
  return `${post.author.name} - ${formatDate(post.publishedAt)}`
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
  .search__bar {
    max-width: 100%;
  }
}
</style>
