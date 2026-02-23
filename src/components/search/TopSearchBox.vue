<template>
  <div class="search-box">
    <div class="search-input-wrapper">
      <input
        v-model="searchValue"
        ref="inputEl"
        type="text"
        placeholder="Search articles..."
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
        <div class="top-dropdown__section">
          <div class="top-dropdown__header">
            <span>Recommended</span>
            <span class="top-dropdown__hint">Top reads by estimated reading time</span>
          </div>
          <ol class="top-hot-list">
            <li v-for="(post, index) in recommendedPosts" :key="post.id">
              <button type="button" class="top-hot-list__item" @click="selectSuggestion(post.title)">
                <span class="top-hot-list__rank" :data-top="index < 3">{{ index + 1 }}</span>
                <div class="top-hot-list__text">
                  <span class="top-hot-list__title">{{ post.title }}</span>
                  <span class="top-hot-list__meta">{{ post.readMinutes }} min read</span>
                </div>
              </button>
            </li>
          </ol>
        </div>

        <div v-if="searchHistory.length" class="top-dropdown__section">
          <div class="top-dropdown__header">
            <span>Search history</span>
            <button type="button" class="top-link-btn" @click="emit('clearHistory')">Clear</button>
          </div>
          <div class="top-history-list">
            <button
              v-for="item in searchHistory"
              :key="item"
              type="button"
              class="top-chip"
              @click="selectSuggestion(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div v-if="normalizedQuery && suggestionPosts.length" class="top-dropdown__section">
          <div class="top-dropdown__header">
            <span>Suggestions</span>
            <span class="top-dropdown__hint">Sorted by relevance</span>
          </div>
          <ul class="top-suggestion-list">
            <li v-for="post in suggestionPosts" :key="post.id">
              <button type="button" class="top-suggestion" @click="selectSuggestion(post.title)">
                <span class="top-suggestion__title">{{ post.title }}</span>
                <span class="top-suggestion__meta">
                  {{ post.author.name }} - {{ new Date(post.publishedAt).toLocaleDateString('en-US') }}
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div v-else-if="normalizedQuery" class="top-dropdown__section top-dropdown__section--empty">
          <span>No result found. Try another keyword.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Post } from '@/types/post'

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

const inputEl = ref<HTMLInputElement | null>(null)
const dropdownEl = ref<HTMLElement | null>(null)
const showDropdown = ref(false)

const searchValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

watch(
  () => props.normalizedQuery,
  () => {
    showDropdown.value = true
  }
)

function triggerSearch() {
  const term = props.modelValue.trim()
  if (!term) return
  showDropdown.value = false
  emit('search', term)
}

function selectSuggestion(term: string) {
  emit('update:modelValue', term)
  showDropdown.value = false
  emit('search', term)
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

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})
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

.top-dropdown__section {
  display: flex;
  flex-direction: column;
  gap: 0.58rem;

  &--empty {
    color: var(--ink-muted);
  }
}

.top-dropdown__header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--ink-strong);
  font-weight: 700;
  font-size: 0.9rem;
}

.top-dropdown__hint {
  color: var(--ink-muted);
  font-size: 0.82rem;
  font-weight: 500;
}

.top-hot-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.5rem;
}

.top-hot-list__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.62rem 0.72rem;
  border-radius: 12px;
  border: 1px solid var(--line-soft);
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(0, 113, 227, 0.32);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
}

.top-hot-list__rank {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: #ececf0;
  color: #45454a;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.top-hot-list__rank[data-top='true'] {
  background: #0071e3;
  color: #fff;
}

.top-hot-list__text {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.top-hot-list__title {
  color: var(--ink-strong);
  font-weight: 700;
  line-height: 1.3;
  font-size: 0.9rem;
}

.top-hot-list__meta {
  color: var(--ink-muted);
  font-size: 0.79rem;
}

.top-link-btn {
  background: none;
  border: none;
  color: var(--brand-500);
  cursor: pointer;
  font-weight: 600;
  padding: 0;
}

.top-history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.44rem;
}

.top-chip {
  padding: 0.34rem 0.72rem;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.92);
  color: var(--ink-main);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.82rem;

  &:hover {
    border-color: rgba(0, 113, 227, 0.35);
    color: var(--brand-500);
  }
}

.top-suggestion-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
}

.top-suggestion {
  width: 100%;
  padding: 0.6rem 0.72rem;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: rgba(0, 113, 227, 0.35);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
}

.top-suggestion__title {
  display: block;
  color: var(--ink-strong);
  font-weight: 700;
  margin-bottom: 0.08rem;
}

.top-suggestion__meta {
  color: var(--ink-muted);
  font-size: 0.8rem;
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
