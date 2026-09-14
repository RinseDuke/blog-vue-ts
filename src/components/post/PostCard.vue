<template>
  <article class="post-card post-card--list">
    <RouterLink :to="{ name: 'article-detail', params: { id: post.id } }" class="card-link-wrapper">
      <div class="post-card__meta">
        <span class="post-card__date">{{ formatPostDate(post.publishedAt) }}</span>
        <span class="post-card__dot" aria-hidden="true">／</span>
        <span>{{ post.readMinutes }} 分钟</span>
      </div>

      <h3>{{ post.title }}</h3>
      <p class="post-card__excerpt">{{ post.excerpt }}</p>
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
  display: block;
  width: 100%;
  min-width: 0;
}

.post-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  position: relative;
  background: transparent;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--line-soft);
  transition: none;

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--post-card-meta);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
  }

  &__dot {
    color: var(--line-strong);
  }

  h3 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(1.4rem, 2.4vw, 1.85rem);
    color: var(--post-card-title);
    line-height: 1.18;
    letter-spacing: 0;
    transition: color var(--motion-base) var(--ease-out);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__excerpt {
    margin: 0;
    color: var(--post-card-text);
    line-height: 1.65;
    font-size: var(--text-base);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &:hover h3 {
    color: var(--brand-500);
  }
}

.post-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 0.15rem;
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
  gap: 0.55rem;
  color: var(--post-card-meta);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 600;

  img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--post-card-avatar-border);
  }
}

@media (max-width: 900px) {
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
