<!-- 文章卡片：展示标题、摘要、作者 -->
<template>
  <article class="post-card post-card--list">
    <RouterLink :to="{ name: 'article-detail', params: { id: post.id } }" class="card-link-wrapper">
      <div class="post-card__body">
        <div class="post-card__meta">
          <span class="post-card__date">{{ formatPostDate(post.publishedAt) }}</span>
          <span class="post-card__dot" aria-hidden="true">|</span>
          <span>{{ post.readMinutes }} 分钟阅读</span>
        </div>

        <h3>{{ post.title }}</h3>
        <p class="post-card__excerpt">{{ post.excerpt }}</p>
      </div>
    </RouterLink>

    <div class="post-card__footer">
      <div class="author">
        <img v-if="post.author.avatarUrl" :src="post.author.avatarUrl" :alt="post.author.name" @error="($event.target as HTMLImageElement).style.display = 'none'" />
        <span>{{ post.author.name }}</span>
      </div>

      <div v-if="$slots['footer-actions']" class="post-card__footer-actions">
        <slot name="footer-actions" :post="post" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/post'
import { formatPostDate } from '@/features/post/utils/post'

defineProps<{
  post: Post
}>()
</script>

<style scoped lang="less">
.card-link-wrapper {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  flex: 1;
}

.post-card {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--card-top), var(--card-bottom));
  border-radius: var(--radius-lg);
  border: 1px solid var(--line-soft);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-5px);
    border-color: rgba(0, 113, 227, 0.26);
    box-shadow: var(--shadow-md);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    padding: 1.25rem 1.4rem 1rem;
    flex: 1;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--ink-muted);
    font-size: 0.83rem;
    font-weight: 600;
  }

  &__dot {
    opacity: 0.5;
  }

  h3 {
    margin: 0;
    font-size: clamp(1.15rem, 2vw, 1.34rem);
    color: var(--ink-strong);
    line-height: 1.3;
    letter-spacing: -0.01em;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__excerpt {
    margin: 0;
    color: var(--ink-main);
    line-height: 1.55;
    font-size: 0.93rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

}

.post-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1.4rem 1rem;
  border-top: 1px solid var(--line-soft);
}

.post-card__footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--ink-main);
  font-size: 0.88rem;
  font-weight: 600;

  img {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--line-soft);
  }
}

@media (max-width: 900px) {
  .post-card {
    border-radius: var(--radius-lg);
  }

  .post-card__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .post-card__footer-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
