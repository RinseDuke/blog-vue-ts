<template>
  <section class="search">
    <header v-if="!loading && !error" class="search__summary glass-surface">
      <p class="search__meta">{{ summaryLabel }}</p>
      <p class="search__count">{{ filteredPosts.length }} 篇匹配文章</p>
    </header>

    <section class="feed" aria-live="polite">
      <div v-if="loading" class="feed__state glass-surface">搜索中...</div>
      <div v-else-if="error" class="feed__state feed__state--error glass-surface">{{ error }}</div>

      <div v-else>
        <div v-if="!filteredPosts.length" class="feed__state feed__state--empty glass-surface">
          <p>未找到匹配内容，请尝试其他关键词。</p>
        </div>

        <PostList v-else class="feed__grid feed__grid--list" :posts="filteredPosts" />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { usePostSearchBundle } from '@/features/search/composables/usePostSearchBundle'
import PostList from '@/components/post/PostList.vue'

const route = useRoute()

const postsStore = usePostsStore()
const { posts, loading, error } = storeToRefs(postsStore)
const { ensurePosts } = postsStore
const searchQuery = computed(() => ((route.query.q as string) ?? '').trim())

const { normalizedQuery, filteredPosts } = usePostSearchBundle(posts, searchQuery, {
  includeAllWhenQueryEmpty: true,
})

const displayQuery = computed(() => searchQuery.value || '全部文章')
const summaryLabel = computed(() =>
  normalizedQuery.value ? `“${displayQuery.value}” 的搜索结果` : '全部文章'
)

onMounted(async () => {
  try {
    await ensurePosts()
  } catch (err) {
    console.warn('搜索页预加载文章失败', err)
  }
})
</script>

<style scoped lang="less">
.search {
  width: 100%;
  padding: 60px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

.search__summary {
  max-width: 1040px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.15rem;
  border-radius: var(--radius-lg);
}

.search__meta {
  margin: 0;
  color: var(--ink-strong);
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.search__count {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.95rem;
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  padding-bottom: 8px;

  &__state {
    padding: 2rem;
    text-align: center;
    border-radius: var(--radius-lg);
    color: var(--ink-muted);

    &--error {
      background: var(--danger-bg);
      color: var(--danger-500);
    }

    &--empty {
      background: var(--bg-canvas-soft);
      color: var(--ink-main);
    }
  }

}

@media (max-width: 900px) {
  .search__summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }
}

@media (max-width: 768px) {
  .search {
    padding: 3rem 0.95rem;
    gap: 1rem;
  }

  .search__summary {
    padding: 0.95rem;
    border-radius: var(--radius-md);
  }

  .feed__state {
    border-radius: var(--radius-md);
  }
}

@media (max-width: 390px) {
  .search {
    padding-inline: 0.85rem;
  }

  .search__meta {
    overflow-wrap: anywhere;
  }
}
</style>
