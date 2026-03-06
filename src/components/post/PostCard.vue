<template>
  <article class="post-card post-card--list">
    <RouterLink :to="`/article/${post.slug}`" class="card-link-wrapper">
      <div class="post-card__body">
        <div class="post-card__meta">
          <span class="post-card__date">{{ formatPostDate(post.publishedAt) }}</span>
          <span class="post-card__dot" aria-hidden="true">|</span>
          <span>{{ post.readMinutes }} 分钟阅读</span>
        </div>

        <h3>{{ post.title }}</h3>
        <p class="post-card__excerpt">{{ post.excerpt }}</p>

        <div class="tags post-card__tags">
          <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
        </div>
      </div>

      <div class="post-card__footer">
        <div class="author">
          <img v-if="post.author.avatarUrl" :src="post.author.avatarUrl" :alt="post.author.name" />
          <span>{{ post.author.name }}</span>
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
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.post-card {
  display: flex;
  flex-direction: row;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92));
  border-radius: 22px;
  border: 1px solid var(--line-soft);
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-5px);
    border-color: rgba(0, 113, 227, 0.26);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
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

.post-card__tags {
  margin-top: 0.15rem;
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
    background: rgba(248, 250, 252, 0.9);
    color: var(--ink-muted);
    font-size: 0.78rem;
    font-weight: 600;
  }
}

@media (max-width: 900px) {
  .post-card {
    border-radius: 20px;
  }

  .post-card__footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
