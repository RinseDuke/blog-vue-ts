<template>
  <Transition name="mobile-search-sheet">
    <section
      v-if="open"
      ref="sheetEl"
      class="mobile-search-sheet"
      data-testid="mobile-search-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="移动端文章搜索"
      tabindex="-1"
      @keydown="handleKeydown"
    >
      <div class="mobile-search-sheet__toolbar">
        <div class="mobile-search-sheet__input-wrap">
          <input
            ref="inputEl"
            v-model="searchValue"
            type="text"
            placeholder="搜索文章..."
            autocomplete="off"
            @keyup.enter="triggerSearch"
          />
          <button type="button" class="mobile-search-sheet__submit" aria-label="搜索文章" @click="triggerSearch">
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
import { getMobileSearchKeyAction } from '@/components/search/mobileSearchKeyboard'

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

const sheetEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const previousFocusedElement = ref<HTMLElement | null>(null)
const searchValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

watch(
  () => props.open,
  async (open, wasOpen) => {
    if (open) {
      previousFocusedElement.value =
        typeof document !== 'undefined' &&
        typeof HTMLElement !== 'undefined' &&
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      await nextTick()
      inputEl.value?.focus()
      return
    }

    if (wasOpen) {
      previousFocusedElement.value?.focus()
      previousFocusedElement.value = null
    }
  },
  { immediate: true }
)

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])'

function handleKeydown(event: KeyboardEvent) {
  const focusableElements = Array.from(sheetEl.value?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])
  const activeElement =
    typeof document !== 'undefined' &&
    typeof HTMLElement !== 'undefined' &&
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  const action = getMobileSearchKeyAction(event.key, event.shiftKey, focusableElements, activeElement)

  if (action.type === 'none') return

  event.preventDefault()
  if (action.type === 'close') {
    emit('close')
  } else if (action.type === 'focus-sheet') {
    sheetEl.value?.focus()
  } else {
    action.target.focus()
  }
}

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
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--line-strong) 86%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 94%, transparent), color-mix(in srgb, var(--surface) 96%, transparent)),
    radial-gradient(circle at top left, var(--brand-100), transparent 46%);
  box-shadow:
    0 18px 44px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.34);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
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
  border: 1px solid color-mix(in srgb, var(--line-strong) 88%, transparent);
  background: linear-gradient(180deg, var(--surface-strong), var(--surface));
  color: var(--ink-strong);
  outline: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    0 8px 20px rgba(15, 23, 42, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.mobile-search-sheet__input-wrap input::placeholder {
  color: var(--ink-muted);
}

.mobile-search-sheet__input-wrap input:focus {
  border-color: rgba(0, 113, 227, 0.34);
  box-shadow:
    0 0 0 4px rgba(0, 113, 227, 0.1),
    0 12px 28px rgba(15, 23, 42, 0.08);
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
  border-radius: 999px;
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
