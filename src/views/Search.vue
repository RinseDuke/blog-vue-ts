<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { usePostSearchBundle } from '@/features/search/composables/usePostSearchBundle'
import PostList from '@/components/post/PostList.vue'
import CommunityLayout from '@/components/community/CommunityLayout.vue'

const route = useRoute()

const postsStore = usePostsStore()
const { posts, loading, error } = storeToRefs(postsStore)
const { ensurePosts } = postsStore
const searchQuery = computed(() => ((route.query.q as string) ?? '').trim())

const { normalizedQuery, filteredPosts } = usePostSearchBundle(posts, searchQuery, {
  includeAllWhenQueryEmpty: true,
})

const displayQuery = computed(() => searchQuery.value || '全部主题')
const summaryLabel = computed(() =>
  normalizedQuery.value ? `“${displayQuery.value}” 的搜索结果` : '全部主题'
)

onMounted(async () => {
  try {
    await ensurePosts()
  } catch (err) {
    console.warn('搜索页预加载主题失败', err)
  }
})
</script>

<template>
  <CommunityLayout
    :title="normalizedQuery ? '搜索结果' : '全部主题'"
    :description="normalizedQuery ? summaryLabel + ' · ' + filteredPosts.length + ' 条匹配' : '浏览社区中的全部公开主题'"
  >
    <div v-if="loading" class="search-state">搜索中...</div>
    <div v-else-if="error" class="search-state search-state--error">{{ error }}</div>
    <div v-else-if="!filteredPosts.length" class="search-state search-state--empty">
      未找到匹配内容，请尝试其他关键词。
    </div>
    <PostList v-else :posts="filteredPosts" />
  </CommunityLayout>
</template>

<style scoped>
.search-state {
  min-height: 260px;
  padding: 2rem;
  display: grid;
  place-content: center;
  color: var(--ink-muted);
  text-align: center;
}

.search-state--error {
  color: var(--danger-500);
}

.search-state--empty {
  background: var(--bg-canvas-soft);
}
</style>
