<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/post'

const props = defineProps<{
  posts: Post[]
}>()

const popularTags = computed(() => {
  const counts = new Map<string, number>()
  props.posts.forEach((post) => post.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)))
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .slice(0, 6)
})

const activePosts = computed(() => props.posts.slice(0, 3))
</script>

<template>
  <div class="context-rail">
    <section class="context-card context-card--intro">
      <span class="context-card__dot" aria-hidden="true"></span>
      <h2>墨言社区</h2>
      <p>记录实践，也欢迎不同经验在这里继续生长。</p>
      <RouterLink :to="{ name: 'write' }">发起一个主题</RouterLink>
    </section>

    <section v-if="popularTags.length" class="context-card">
      <h2>热门标签</h2>
      <div class="context-tags">
        <RouterLink
          v-for="([tag, count]) in popularTags"
          :key="tag"
          :to="{ name: 'article-list', query: { tag } }"
        >
          <span>{{ tag }}</span><small>{{ count }}</small>
        </RouterLink>
      </div>
    </section>

    <section v-if="activePosts.length" class="context-card">
      <h2>正在讨论</h2>
      <RouterLink
        v-for="post in activePosts"
        :key="post.id"
        :to="{ name: 'article-detail', params: { id: post.id } }"
        class="context-topic"
      >
        {{ post.title }}
      </RouterLink>
    </section>
  </div>
</template>

<style scoped lang="less">
.context-rail {
  display: grid;
  gap: 0.8rem;
}

.context-card {
  padding: 1rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
}

.context-card h2 {
  margin: 0 0 0.7rem;
  color: var(--ink-strong);
  font-size: 0.82rem;
  font-weight: 680;
}

.context-card p {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.82rem;
  line-height: 1.55;
}

.context-card--intro > a {
  display: inline-flex;
  margin-top: 0.85rem;
  color: var(--brand-500);
  font-size: 0.8rem;
  font-weight: 650;
  text-decoration: none;
}

.context-card__dot {
  width: 8px;
  height: 8px;
  display: block;
  margin-bottom: 0.75rem;
  border-radius: 50%;
  background: var(--brand-500);
}

.context-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.context-tags a {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--bg-canvas);
  color: var(--ink-main);
  font-size: 0.75rem;
  text-decoration: none;
}

.context-tags small {
  color: var(--ink-muted);
}

.context-topic {
  display: block;
  padding: 0.65rem 0;
  border-top: 1px solid var(--line-soft);
  color: var(--ink-main);
  font-size: 0.78rem;
  font-weight: 580;
  line-height: 1.45;
  text-decoration: none;
}

.context-topic:hover {
  color: var(--brand-500);
}
</style>
