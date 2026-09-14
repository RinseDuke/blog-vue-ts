<template>
  <div class="search-dropdown" :class="[`search-dropdown--${density}`]">
    <div v-if="!normalizedQuery && recommendedPosts.length" class="search-dropdown__section">
      <div class="search-dropdown__header">
        <span>推荐主题</span>
        <span class="search-dropdown__hint">按预计阅读时长排序</span>
      </div>
      <ol class="search-dropdown__hot-list">
        <li v-for="(post, index) in recommendedPosts" :key="post.id">
          <button type="button" class="search-dropdown__hot-item" @click="emit('select', post.title)">
            <span class="search-dropdown__rank" :data-top="index < 3">{{ index + 1 }}</span>
            <div class="search-dropdown__hot-text">
              <span class="search-dropdown__hot-title">{{ post.title }}</span>
              <span v-if="showRecommendedReadMinutes" class="search-dropdown__hot-meta">{{ post.readMinutes }} 分钟阅读</span>
            </div>
          </button>
        </li>
      </ol>
    </div>

    <div v-if="!normalizedQuery && searchHistory.length" class="search-dropdown__section">
      <div class="search-dropdown__header">
        <span>搜索历史</span>
        <button type="button" class="search-dropdown__link-btn" @click="emit('clearHistory')">
          {{ clearHistoryLabel }}
        </button>
      </div>
      <div class="search-dropdown__history-list">
        <button v-for="item in searchHistory" :key="item" type="button" class="search-dropdown__chip" @click="emit('select', item)">
          {{ item }}
        </button>
      </div>
    </div>

    <div v-if="normalizedQuery && suggestionPosts.length" class="search-dropdown__section">
      <div class="search-dropdown__header">
        <span>搜索建议</span>
        <span class="search-dropdown__hint">按相关度排序</span>
      </div>
      <ul class="search-dropdown__suggestion-list">
        <li v-for="post in suggestionPosts" :key="post.id">
          <button type="button" class="search-dropdown__suggestion-item" @click="emit('select', post.title)">
            <span class="search-dropdown__suggestion-title">{{ post.title }}</span>
            <span class="search-dropdown__suggestion-meta">{{ formatSuggestionMeta(post) }}</span>
          </button>
        </li>
      </ul>
    </div>

    <div v-else-if="normalizedQuery" class="search-dropdown__section search-dropdown__section--empty">
      <span>未找到结果，请尝试其他关键词。</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '@/types/post'

interface SearchDropdownProps {
  recommendedPosts: Post[]
  suggestionPosts: Post[]
  searchHistory: string[]
  normalizedQuery: string
  density?: 'compact' | 'regular'
  clearHistoryLabel?: string
  showRecommendedReadMinutes?: boolean
  suggestionMetaFormatter?: (post: Post) => string
}

const props = withDefaults(defineProps<SearchDropdownProps>(), {
  density: 'regular',
  clearHistoryLabel: '清空历史',
  showRecommendedReadMinutes: false,
})

const emit = defineEmits<{
  (e: 'select', term: string): void
  (e: 'clearHistory'): void
}>()

function formatSuggestionMeta(post: Post) {
  if (props.suggestionMetaFormatter) return props.suggestionMetaFormatter(post)
  return `${post.author.name} - ${new Date(post.publishedAt).toLocaleDateString('zh-CN')}`
}
</script>

<style scoped lang="less">
.search-dropdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &--regular {
    gap: 1rem;
  }
}

.search-dropdown__section {
  display: flex;
  flex-direction: column;
  gap: 0.58rem;
}

.search-dropdown__section + .search-dropdown__section {
  padding-top: 0.85rem;
  border-top: 1px solid var(--line-soft);
}

.search-dropdown__section--empty {
  color: var(--ink-muted);
}

.search-dropdown__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
  color: var(--ink-strong);
  font-weight: 700;
}

.search-dropdown__hint {
  color: var(--ink-muted);
  font-weight: 500;
}

.search-dropdown__hot-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.search-dropdown__hot-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.62rem 0.72rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  cursor: pointer;
  text-align: left;
  min-height: 60px;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: var(--rule-ink);
    background: var(--surface-hover);
  }
}

.search-dropdown__rank {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  background: var(--bg-canvas-soft);
  color: var(--ink-main);
  font-family: var(--font-mono);
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.search-dropdown__rank[data-top='true'] {
  background: var(--brand-500);
  color: var(--on-accent);
}

.search-dropdown__hot-text {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.search-dropdown__hot-title {
  color: var(--ink-strong);
  font-weight: 700;
  line-height: 1.3;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-dropdown__hot-meta {
  color: var(--ink-muted);
  font-size: 0.79rem;
}

.search-dropdown__history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.44rem;
}

.search-dropdown__chip {
  padding: 0.34rem 0.72rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--ink-main);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: var(--brand-500);
    color: var(--brand-500);
    background: var(--surface-hover);
  }
}

.search-dropdown__link-btn {
  background: none;
  border: none;
  color: var(--brand-500);
  cursor: pointer;
  font-weight: 600;
  padding: 0;
}

.search-dropdown__suggestion-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
}

.search-dropdown__suggestion-item {
  width: 100%;
  padding: 0.6rem 0.72rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: var(--rule-ink);
    background: var(--surface-hover);
  }
}

.search-dropdown__suggestion-title {
  display: block;
  color: var(--ink-strong);
  font-weight: 700;
  margin-bottom: 0.08rem;
}

.search-dropdown__suggestion-meta {
  color: var(--ink-muted);
  font-size: 0.8rem;
}

.search-dropdown--regular .search-dropdown__header {
  gap: 0.5rem;
}

.search-dropdown--regular .search-dropdown__hint {
  font-size: 0.9rem;
}

.search-dropdown--regular .search-dropdown__hot-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.search-dropdown--regular .search-dropdown__hot-item {
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
}

.search-dropdown--regular .search-dropdown__rank {
  width: 24px;
  height: 24px;
}

.search-dropdown--regular .search-dropdown__hot-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-dropdown--regular .search-dropdown__chip {
  padding: 0.45rem 0.85rem;
}

.search-dropdown--regular .search-dropdown__suggestion-item {
  padding: 0.75rem 0.85rem;
}

.search-dropdown--regular .search-dropdown__suggestion-title {
  margin-bottom: 0.15rem;
}

.search-dropdown--regular .search-dropdown__suggestion-meta {
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .search-dropdown--regular .search-dropdown__hot-list {
    grid-template-columns: 1fr;
  }
}
</style>
