<template>
  <section v-if="post" class="featured-hero">
    <div class="featured-hero__bg" />

    <div class="featured-hero__body">
      <span class="featured-hero__kicker">最新</span>

      <h2 class="featured-hero__title">{{ post.title }}</h2>

      <p v-if="post.excerpt" class="featured-hero__excerpt">{{ post.excerpt }}</p>

      <div class="featured-hero__meta">
        <span class="featured-hero__author">{{ post.author.name }}</span>
        <span class="featured-hero__dot">&middot;</span>
        <span class="featured-hero__date">{{ formatDate(post.publishedAt) }}</span>
        <span class="featured-hero__dot">&middot;</span>
        <span class="featured-hero__read">{{ post.readMinutes }} 分钟阅读</span>
      </div>

      <router-link :to="`/article/${post.id}`" class="featured-hero__cta">
        阅读文章
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Post } from '@/types/post'
import { formatPostDate } from '@/features/post/utils/post'

defineProps<{
  post: Post
}>()

function formatDate(dateString: string) {
  return formatPostDate(dateString)
}
</script>

<style scoped>
.featured-hero {
  position: relative;
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  height: 380px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  padding: 2rem 2.5rem;
  border: 1px solid var(--line-soft);
  box-shadow: var(--shadow-sm);
}

.featured-hero__bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--brand-100) 72%, transparent), transparent 52%),
    linear-gradient(135deg, var(--write-panel-bg));
  z-index: 0;
}

.featured-hero__body {
  position: relative;
  z-index: 1;
  max-width: 680px;
}

.featured-hero__kicker {
  display: inline-block;
  font-size: var(--text-xs, 0.78rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0;
  color: var(--brand-500);
  margin-bottom: 0.75rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid color-mix(in srgb, var(--brand-500) 30%, transparent);
  border-radius: var(--radius-sm);
}

.featured-hero__title {
  font-size: var(--text-display, 2.75rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0;
  color: var(--ink-strong);
  margin: 0 0 1rem;
}

.featured-hero__excerpt {
  font-size: var(--text-base, 1rem);
  line-height: 1.6;
  color: var(--ink-muted);
  margin: 0 0 1.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-hero__meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--text-sm, 0.88rem);
  color: var(--ink-muted);
  margin-bottom: 1.5rem;
}

.featured-hero__dot {
  opacity: 0.4;
}

.featured-hero__cta {
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 1.4rem;
  border-radius: var(--radius-sm);
  background: var(--brand-500);
  color: var(--on-accent);
  font-weight: 700;
  font-size: var(--text-sm, 0.88rem);
  text-decoration: none;
  transition: opacity var(--motion-fast, 120ms) ease;
}

.featured-hero__cta:hover {
  opacity: 0.88;
}

@media (max-width: 768px) {
  .featured-hero {
    height: 220px;
    padding: 1.25rem 1.5rem;
    border-radius: var(--radius-md);
  }

  .featured-hero__title {
    font-size: var(--text-2xl, 1.63rem);
  }

  .featured-hero__excerpt {
    display: none;
  }

  .featured-hero__meta {
    font-size: var(--text-xs, 0.78rem);
    margin-bottom: 1rem;
  }
}
</style>
