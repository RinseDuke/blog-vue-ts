<template>
  <div class="search-box" :class="{ 'search-box--focused': isFocused }">
    <div class="search-input-wrapper">
      <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        v-model="searchValue"
        ref="inputEl"
        type="text"
        placeholder="搜索文章..."
        autocomplete="off"
        @keyup.enter="triggerSearch"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="openDropdown"
      />
      <kbd v-if="!isFocused" class="search-shortcut" aria-hidden="true">{{ shortcutLabel }}</kbd>
      <button class="search-btn" @click="triggerSearch" aria-label="搜索">
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
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

const isFocused = ref(false)
const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
const shortcutLabel = isMac ? '⌘K' : 'Ctrl+K'

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

function handleFocus() {
  isFocused.value = true
  openDropdown()
}

function handleBlur() {
  isFocused.value = false
}

function handleGlobalShortcut(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    inputEl.value?.focus()
  }
}

function formatSuggestionMeta(post: Post) {
  return `${post.author.name} - ${new Date(post.publishedAt).toLocaleDateString('zh-CN')}`
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalShortcut)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalShortcut)
})
</script>

<style scoped lang="less">
.search-box {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
  padding: 0 0.15rem;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 640px;
  display: flex;
  align-items: center;
  transition: max-width var(--motion-base) var(--ease-out-quint);
}

.search-box--focused .search-input-wrapper {
  max-width: 720px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--ink-muted);
  pointer-events: none;
  z-index: 1;
  transition: color var(--motion-base) var(--ease-out);
}

.search-box--focused .search-icon {
  color: var(--brand-500);
}

.search-box input {
  width: 100%;
  padding: 0.72rem 3.4rem 0.72rem 2.6rem;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  font-size: 0.9rem;
  color: var(--ink-strong);
  outline: none;
  box-shadow: var(--glass-shadow);
  transition: border-color var(--motion-base) var(--ease-out), box-shadow var(--motion-base) var(--ease-out), background-color var(--motion-base) var(--ease-out);
}

.search-box input::placeholder {
  color: var(--ink-muted);
}

.search-box input:focus {
  border-color: color-mix(in srgb, var(--glass-border) 54%, var(--brand-500) 46%);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--brand-100) 72%, transparent),
    var(--glass-shadow);
  background: color-mix(in srgb, var(--glass-surface) 82%, var(--surface-strong) 18%);
}

.search-shortcut {
  position: absolute;
  right: 3rem;
  padding: 0.2rem 0.5rem;
  background: color-mix(in srgb, var(--glass-surface) 72%, var(--surface-strong) 28%);
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  color: var(--ink-muted);
  font-size: 0.75rem;
  font-family: inherit;
  pointer-events: none;
  line-height: 1;
}

.search-btn {
  position: absolute;
  right: 0.45rem;
  width: 34px;
  height: 34px;
  background: color-mix(in srgb, var(--glass-surface) 64%, var(--surface-strong) 36%);
  border: 1px solid var(--glass-border);
  border-radius: 50%;
  color: var(--ink-main);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
  transition: color var(--motion-base) var(--ease-out);
}

.search-btn:hover {
  color: var(--brand-500);
}

.top-search__dropdown {
  position: absolute;
  top: calc(100% + 0.7rem);
  left: 0;
  right: 0;
  background: color-mix(in srgb, var(--glass-surface) 38%, var(--surface-strong) 62%);
  border: 1px solid var(--glass-border);
  border-radius: 22px;
  box-shadow: var(--glass-shadow);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 40;
  max-height: 70vh;
  overflow-y: auto;
  backdrop-filter: blur(var(--glass-blur)) saturate(135%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(135%);
}

:global(html[data-theme='dark']) .search-box input {
  background: var(--glass-surface) !important;
}

:global(html[data-theme='dark']) .top-search__dropdown {
  background: color-mix(in srgb, var(--glass-surface) 38%, var(--surface-strong) 62%) !important;
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .search-box input,
  .top-search__dropdown {
    background: var(--surface-strong);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-sm);
  }

  :global(html[data-theme='dark']) .search-box input,
  :global(html[data-theme='dark']) .top-search__dropdown {
    background: var(--surface-strong) !important;
  }
}

@media (max-width: 768px) {
  .search-box {
    display: none;
  }
}
</style>
