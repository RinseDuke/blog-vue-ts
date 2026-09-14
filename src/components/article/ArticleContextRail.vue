<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/post'
import { formatPostDate } from '@/features/post/utils/post'

const props = defineProps<{
  post: Post
}>()

interface HeadingItem {
  id: string
  text: string
  level: number
}

const headings = ref<HeadingItem[]>([])

function collectHeadings() {
  const nodes = [...document.querySelectorAll<HTMLElement>('.article-body h2, .article-body h3')]
  headings.value = nodes.map((node, index) => {
    const id = node.id || `section-${index + 1}`
    node.id = id
    return { id, text: node.textContent?.trim() || `第 ${index + 1} 节`, level: Number(node.tagName.slice(1)) }
  })
}

function scheduleCollection() {
  void nextTick().then(collectHeadings)
}

onMounted(scheduleCollection)
watch(() => props.post.id, scheduleCollection)
</script>

<template>
  <div class="article-context">
    <section class="article-context__card">
      <p class="article-context__label">作者</p>
      <RouterLink :to="{ name: 'about' }" class="article-context__author">
        <span class="article-context__avatar" aria-hidden="true">
          <img v-if="post.author.avatarUrl" :src="post.author.avatarUrl" alt="" />
          <b v-else>{{ post.author.name.slice(0, 1) }}</b>
        </span>
        <span><strong>{{ post.author.name }}</strong><small>{{ formatPostDate(post.publishedAt) }}</small></span>
      </RouterLink>
      <p v-if="post.author.bio" class="article-context__bio">{{ post.author.bio }}</p>
    </section>

    <nav v-if="headings.length >= 3" class="article-context__card article-context__toc" aria-label="文章目录">
      <p class="article-context__label">本文目录</p>
      <a
        v-for="item in headings"
        :key="item.id"
        :href="`#${item.id}`"
        :class="{ 'is-subsection': item.level === 3 }"
      >
        {{ item.text }}
      </a>
    </nav>

    <section v-if="post.tags.length" class="article-context__card">
      <p class="article-context__label">标签</p>
      <div class="article-context__tags">
        <RouterLink
          v-for="tag in post.tags"
          :key="tag"
          :to="{ name: 'article-list', query: { tag } }"
        >{{ tag }}</RouterLink>
      </div>
    </section>

    <RouterLink :to="{ name: 'article-list' }" class="article-context__back">← 返回全部主题</RouterLink>
  </div>
</template>

<style scoped lang="less">
.article-context {
  display: grid;
  gap: 0.8rem;
}

.article-context__card {
  padding: 1rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
}

.article-context__label {
  margin: 0 0 0.65rem;
  color: var(--ink-muted);
  font-size: 0.7rem;
  font-weight: 650;
}

.article-context__author {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--ink-main);
  text-decoration: none;
}

.article-context__avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 12px;
  background: var(--bg-canvas);
}

.article-context__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-context__avatar b {
  font-size: 0.85rem;
}

.article-context__author strong,
.article-context__author small {
  display: block;
}

.article-context__author strong {
  color: var(--ink-strong);
  font-size: 0.82rem;
}

.article-context__author small {
  margin-top: 0.15rem;
  color: var(--ink-muted);
  font-size: 0.68rem;
}

.article-context__bio {
  margin: 0.75rem 0 0;
  color: var(--ink-muted);
  font-size: 0.75rem;
  line-height: 1.55;
}

.article-context__toc a {
  display: block;
  padding: 0.42rem 0;
  border-top: 1px solid var(--line-soft);
  color: var(--ink-main);
  font-size: 0.75rem;
  line-height: 1.4;
  text-decoration: none;
}

.article-context__toc a:hover {
  color: var(--brand-500);
}

.article-context__toc a.is-subsection {
  padding-left: 0.7rem;
  color: var(--ink-muted);
}

.article-context__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.article-context__tags a {
  padding: 0.3rem 0.45rem;
  border-radius: 6px;
  background: var(--bg-canvas);
  color: var(--ink-main);
  font-size: 0.7rem;
  text-decoration: none;
}

.article-context__back {
  padding: 0.4rem 0.15rem;
  color: var(--brand-500);
  font-size: 0.76rem;
  font-weight: 620;
  text-decoration: none;
}
</style>
