<template>
  <article class="post-card post-card--list">
    <RouterLink :to="`/article/${post.slug}`" class="card-link-wrapper">
      <img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" class="post-card__cover" />

      <div class="post-card__body">
        <div class="post-card__meta">
          <span class="post-card__date">{{ formatPostDate(post.publishedAt) }}</span>
          <span class="post-card__dot" aria-hidden="true">|</span>
          <span>{{ post.readMinutes }} min read</span>
        </div>

        <h3>{{ post.title }}</h3>
        <p class="post-card__excerpt">{{ post.excerpt }}</p>

        <div class="post-card__footer">
          <div class="author">
            <img v-if="post.author.avatarUrl" :src="post.author.avatarUrl" :alt="post.author.name" />
            <span>{{ post.author.name }}</span>
          </div>

          <div class="tags">
            <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>
        </div>
      </div>
    </RouterLink>
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
}

.post-card {
  display: flex;
  flex-direction: row;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24px;
  border: 1px solid var(--line-soft);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-5px);
    border-color: rgba(0, 113, 227, 0.26);
    box-shadow: var(--shadow-md);
  }

  &__cover {
    width: 320px;
    height: auto;
    flex-shrink: 0;
    object-fit: cover;
    background: #e8eaee;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1.35rem 1.4rem;
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
  }

  &__excerpt {
    margin: 0;
    color: var(--ink-main);
    line-height: 1.55;
    flex-grow: 1;
    font-size: 0.93rem;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
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
    border: 1px solid rgba(0, 0, 0, 0.08);
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;

  .tag {
    padding: 0.26rem 0.62rem;
    border-radius: 999px;
    border: 1px solid var(--line-soft);
    background: rgba(255, 255, 255, 0.8);
    color: var(--ink-muted);
    font-size: 0.78rem;
    font-weight: 600;
  }
}

@media (max-width: 900px) {
  .post-card {
    flex-direction: column;
    border-radius: 20px;

    &__cover {
      width: 100%;
      height: 210px;
    }
  }

  .post-card__footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
