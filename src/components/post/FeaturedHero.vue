<template>
  <article class="featured-hero">
    <img
      v-if="post.coverImage"
      :src="post.coverImage"
      :alt="''"
      class="featured-hero__media"
      loading="eager"
      decoding="async"
    />
    <div class="featured-hero__ambient" aria-hidden="true"></div>

    <div class="featured-hero__body glass-surface">
      <span class="featured-hero__kicker">编辑精选</span>
      <h3 class="featured-hero__title">{{ post.title }}</h3>
      <p v-if="post.excerpt" class="featured-hero__excerpt">{{ post.excerpt }}</p>

      <div class="featured-hero__meta">
        <span>{{ post.author.name }}</span>
        <span>{{ formatDate(post.publishedAt) }}</span>
        <span>{{ post.readMinutes }} 分钟阅读</span>
      </div>

      <RouterLink
        :to="{ name: 'article-detail', params: { id: post.id } }"
        class="featured-hero__cta"
      >
        阅读精选
        <span aria-hidden="true">↗</span>
      </RouterLink>
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

function formatDate(dateString: string) {
  return formatPostDate(dateString)
}
</script>

<style scoped lang="less">
.featured-hero {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: flex-end;
  min-height: clamp(420px, 52vw, 580px);
  padding: clamp(1rem, 3vw, 2rem);
  overflow: hidden;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  box-shadow: 0 28px 72px color-mix(in srgb, var(--ink-strong) 14%, transparent);
}

.featured-hero__media,
.featured-hero__ambient {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.featured-hero__media {
  z-index: -3;
  object-fit: cover;
  transform: scale(1.01);
}

.featured-hero__ambient {
  z-index: -2;
  background:
    linear-gradient(180deg, transparent 8%, color-mix(in srgb, var(--bg-canvas) 42%, transparent) 54%, color-mix(in srgb, var(--bg-canvas) 82%, transparent) 100%),
    radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--brand-400) 48%, transparent), transparent 42%),
    linear-gradient(135deg, color-mix(in srgb, var(--brand-100) 78%, var(--surface-strong)), var(--surface-strong));
}

.featured-hero__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.9rem;
  width: min(680px, 100%);
  padding: clamp(1.25rem, 3vw, 2rem);
  border-radius: var(--radius-lg);
}

.featured-hero__kicker {
  color: var(--brand-500);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.featured-hero__title {
  margin: 0;
  color: var(--ink-strong);
  font-size: clamp(2rem, 5vw, 4.5rem);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.055em;
  overflow-wrap: anywhere;
}

.featured-hero__excerpt {
  max-width: 58ch;
  margin: 0;
  color: var(--ink-main);
  font-size: clamp(0.98rem, 1.5vw, 1.08rem);
  line-height: 1.72;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.featured-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 1rem;
  color: var(--ink-muted);
  font-size: 0.86rem;
  font-weight: 650;
}

.featured-hero__meta span + span::before {
  content: '·';
  margin-right: 1rem;
  color: color-mix(in srgb, var(--ink-muted) 58%, transparent);
}

.featured-hero__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 44px;
  margin-top: 0.25rem;
  padding: 0.65rem 1rem;
  border-radius: var(--radius-sm);
  background: var(--ink-strong);
  color: var(--surface-strong);
  font-weight: 800;
  text-decoration: none;
}

@media (hover: hover) {
  .featured-hero__cta:hover {
    color: var(--surface-strong);
    transform: translateY(-2px);
  }
}

@media (max-width: 768px) {
  .featured-hero {
    min-height: 300px;
    padding: 0.75rem;
    border-radius: var(--radius-md);
  }

  .featured-hero__body {
    gap: 0.7rem;
    padding: 1.1rem;
    border-radius: var(--radius-md);
  }

  .featured-hero__title {
    font-size: clamp(1.65rem, 8vw, 2.45rem);
    letter-spacing: -0.04em;
  }

  .featured-hero__excerpt {
    -webkit-line-clamp: 2;
  }

  .featured-hero__meta span + span::before {
    margin-right: 0.55rem;
  }
}

@media (max-width: 390px) {
  .featured-hero__meta {
    gap: 0.35rem 0.55rem;
    font-size: 0.78rem;
  }
}
</style>
