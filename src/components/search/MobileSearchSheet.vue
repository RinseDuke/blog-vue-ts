<template>
  <Transition name="mobile-search-sheet">
    <section v-if="open" class="mobile-search-sheet" data-testid="mobile-search-sheet">
      <div class="mobile-search-sheet__toolbar">
        <div class="mobile-search-sheet__input-wrap">
          <input
            ref="inputEl"
            v-model="searchValue"
            type="text"
            placeholder="搜索主题..."
            autocomplete="off"
            @keyup.enter="triggerSearch"
          />
          <button type="button" class="mobile-search-sheet__submit" aria-label="搜索主题" @click="triggerSearch">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        <button type="button" class="mobile-search-sheet__close" @click="emit('close')">取消</button>
      </div>

      <div class="mobile-search-sheet__content">
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
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Post } from '@/types/post'
import SearchDropdownContent from '@/components/search/SearchDropdownContent.vue'

const props = defineProps<{
  open: boolean
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
  (e: 'close'): void
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const searchValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await nextTick()
    inputEl.value?.focus()
  }
)

function triggerSearch() {
  const term = props.modelValue.trim()
  if (!term) return
  emit('search', term)
}

function selectSuggestion(term: string) {
  emit('update:modelValue', term)
  emit('search', term)
}

function formatSuggestionMeta(post: Post) {
  return `${post.author.name} - ${new Date(post.publishedAt).toLocaleDateString('zh-CN')}`
}
</script>

<style scoped lang="less">
.mobile-search-sheet {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  width: 100%;
  padding: 0.45rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line-strong);
  background: var(--surface-overlay);
  box-shadow: var(--shadow-md);
}

.mobile-search-sheet__toolbar {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.mobile-search-sheet__input-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.mobile-search-sheet__input-wrap input {
  width: 100%;
  height: 42px;
  padding: 0 2.95rem 0 0.95rem;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: var(--surface-strong);
  color: var(--ink-strong);
  outline: none;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.mobile-search-sheet__input-wrap input::placeholder {
  color: var(--ink-muted);
}

.mobile-search-sheet__input-wrap input:focus {
  border-color: var(--brand-500);
  box-shadow: var(--focus-ring);
}

.mobile-search-sheet__submit {
  position: absolute;
  top: 50%;
  right: 0.38rem;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: 1px solid var(--line-soft);
  border-radius: 50%;
  background: color-mix(in srgb, var(--surface-strong) 92%, transparent);
  color: var(--ink-main);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

.mobile-search-sheet__close {
  flex-shrink: 0;
  min-width: 48px;
  height: 42px;
  padding: 0 0.8rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: linear-gradient(180deg, var(--surface-strong), var(--surface));
  color: var(--ink-main);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.mobile-search-sheet__content {
  max-height: min(58vh, 420px);
  overflow-y: auto;
  padding: 0.2rem 0.1rem 0.1rem;
}

.mobile-search-sheet-enter-active,
.mobile-search-sheet-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-search-sheet-enter-from,
.mobile-search-sheet-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (min-width: 769px) {
  .mobile-search-sheet {
    display: none;
  }
}
</style>
