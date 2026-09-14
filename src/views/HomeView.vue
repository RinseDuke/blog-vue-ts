<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { mapPostToTopic, sortTopics } from '@/features/topic/topic'
import CommunityLayout from '@/components/community/CommunityLayout.vue'
import CommunityContextRail from '@/components/community/CommunityContextRail.vue'
import TopicList from '@/components/topic/TopicList.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const HOME_POST_LIMIT = 12

const postsStore = usePostsStore()
const { sortedPosts, loading, error } = storeToRefs(postsStore)
const { ensurePosts, refreshPosts } = postsStore

const latestPosts = computed(() => sortedPosts.value.slice(0, HOME_POST_LIMIT))
const topics = computed(() => sortTopics(latestPosts.value.map(mapPostToTopic)))

async function loadHomePosts(force = false) {
  try {
    if (force) {
      await refreshPosts()
      return
    }
    await ensurePosts()
  } catch (err) {
    console.warn('首页主题加载失败', err)
  }
}

onMounted(() => {
  void loadHomePosts()
})
</script>

<template>
  <CommunityLayout title="社区动态" description="写作、思考与工程实践">
    <template #header-action>
      <RouterLink :to="{ name: 'write' }" class="home-compose">发起主题</RouterLink>
    </template>

    <nav class="topic-tabs" aria-label="主题排序">
      <button type="button" class="topic-tabs__item is-active" aria-current="page">最新</button>
      <RouterLink :to="{ name: 'article-list', query: { sort: 'popular' } }" class="topic-tabs__item">
        热门
      </RouterLink>
      <RouterLink :to="{ name: 'article-list' }" class="topic-tabs__item">全部</RouterLink>
    </nav>

    <div v-if="loading" class="topic-state" aria-live="polite">
      <div v-for="index in 6" :key="index" class="topic-state__row">
        <span></span><div><i></i><b></b></div>
      </div>
    </div>

    <div v-else-if="error" class="topic-state topic-state--error" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="loadHomePosts(true)">重新加载</button>
    </div>

    <TopicList v-else-if="topics.length" :topics="topics" />

    <EmptyState v-else title="还没有主题" description="发布第一个主题，开始一次讨论。">
      <template #action>
        <RouterLink :to="{ name: 'write' }" class="empty-compose">发布第一篇</RouterLink>
      </template>
    </EmptyState>

    <template #context>
      <CommunityContextRail :posts="latestPosts" />
    </template>
  </CommunityLayout>
</template>

<style scoped lang="less">
.home-compose,
.empty-compose {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 0.9rem;
  border-radius: var(--radius-sm);
  background: var(--brand-500);
  color: var(--on-accent);
  font-size: 0.82rem;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
}

.topic-tabs {
  min-height: 48px;
  padding: 0 1.25rem;
  display: flex;
  align-items: flex-end;
  gap: 1.15rem;
  border-bottom: 1px solid var(--line-soft);
}

.topic-tabs__item {
  position: relative;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  border: 0;
  background: transparent;
  color: var(--ink-muted);
  font-size: 0.82rem;
  font-weight: 620;
  text-decoration: none;
  cursor: pointer;
}

.topic-tabs__item:hover,
.topic-tabs__item.is-active {
  color: var(--ink-strong);
}

.topic-tabs__item.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--brand-500);
}

.topic-state {
  padding: 1rem 1.25rem;
}

.topic-state__row {
  min-height: 84px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 0.85rem;
  border-bottom: 1px solid var(--line-soft);
}

.topic-state__row > span,
.topic-state__row i,
.topic-state__row b {
  display: block;
  background: var(--surface-hover);
  animation: topic-pulse 1.5s ease-in-out infinite;
}

.topic-state__row > span {
  width: 42px;
  height: 42px;
  border-radius: 13px;
}

.topic-state__row i {
  width: min(70%, 420px);
  height: 14px;
  border-radius: 5px;
}

.topic-state__row b {
  width: min(45%, 260px);
  height: 9px;
  margin-top: 0.7rem;
  border-radius: 4px;
}

.topic-state--error {
  min-height: 220px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.8rem;
  color: var(--danger-500);
  text-align: center;
}

.topic-state--error p {
  margin: 0;
}

.topic-state--error button {
  min-height: 36px;
  padding: 0 0.8rem;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  color: var(--ink-main);
  cursor: pointer;
}

@keyframes topic-pulse {
  50% { opacity: 0.55; }
}

@media (max-width: 640px) {
  .home-compose {
    display: none;
  }

  .topic-tabs {
    padding: 0 0.85rem;
  }

  .topic-state {
    padding: 0.75rem 0.85rem;
  }
}
</style>
