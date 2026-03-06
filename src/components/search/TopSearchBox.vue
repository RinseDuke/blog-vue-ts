<template>
  <div class="search-box">
    <div class="search-input-wrapper">
      <input
        v-model="searchValue"
        ref="inputEl"
        type="text"
        placeholder="搜索文章..."
        autocomplete="off"
        @keyup.enter="triggerSearch"
        @focus="openDropdown"
        @input="openDropdown"
      />
      <button class="search-btn" @click="triggerSearch">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <div v-show="showDropdown" ref="dropdownEl" class="top-search__dropdown" role="listbox">
        <SearchDropdownContent
          density="compact"
          clear-history-label="清空"
          :show-recommended-read-minutes="true"
          :recommended-posts="recommendedPosts"
          :search-history="searchHistory"
          :suggestion-posts="suggestionPosts"
          :normalized-query="normalizedQuery"
          :suggestion-meta-formatter="formatSuggestionMeta"
          @select="selectSuggestion"
          @clear-history="emit('clearHistory')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Post } from '@/types/post'
import { useSearchDropdown } from '@/features/search/composables/useSearchDropdown'
import SearchDropdownContent from '@/components/search/SearchDropdownContent.vue'

const props = defineProps<{
  modelValue: string
  recommendedPosts: Post[]
  suggestionPosts: Post[]
  searchHistory: string[]
  normalizedQuery: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', term: string): void
  (e: 'clearHistory'): void
}>()

const searchValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

const normalizedQueryRef = computed(() => props.normalizedQuery)
const { showDropdown, inputEl, dropdownEl, openDropdown, triggerSearch, selectSuggestion } = useSearchDropdown({
  normalizedQuery: normalizedQueryRef,
  getCurrentInput: () => props.modelValue,
  setInputValue: (value: string) => {
    emit('update:modelValue', value)
  },
  onSearch: (term: string) => {
    emit('search', term)
  },
})

function formatSuggestionMeta(post: Post) {
  return `${post.author.name} - ${new Date(post.publishedAt).toLocaleDateString('zh-CN')}`
}
</script>

<style scoped lang="less">
.search-box {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
  padding: 0 0.55rem;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 620px;
  display: flex;
  align-items: center;
}

.search-box input {
  width: 100%;
  padding: 0.66rem 2.8rem 0.66rem 1rem;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  font-size: 0.9rem;
  color: var(--ink-strong);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.search-box input::placeholder {
  color: var(--ink-muted);
}

.search-box input:focus {
  border-color: rgba(0, 113, 227, 0.4);
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.12);
  background: #fff;
}

.search-btn {
  position: absolute;
  right: 0.9rem;
  background: transparent;
  border: none;
  color: var(--ink-muted);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.search-btn:hover {
  color: var(--brand-500);
}

.top-search__dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  padding: 0.92rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 40;
  max-height: 70vh;
  overflow-y: auto;
  backdrop-filter: blur(12px);
}

@media (max-width: 768px) {
  .search-box {
    padding: 0;
    width: 100%;
    flex: 1 1 100%;
    order: 2;
  }

  .search-input-wrapper {
    max-width: 100%;
  }

  .top-search__dropdown {
    max-width: 100%;
  }
}
</style>
