<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'
import { sortPostsByDateDesc } from '@/features/post/utils/post'
import PostList from '@/components/post/PostList.vue'

const HOME_POST_LIMIT = 12

const loading = ref(true)
const error = ref<string | null>(null)
const latestPosts = ref<Post[]>([])

async function loadHomePosts() {
  loading.value = true
  error.value = null

  try {
    const posts = await fetchPosts({ limit: HOME_POST_LIMIT })
    // Sort once after loading instead of sorting on each reactive update.
    latestPosts.value = posts.slice().sort(sortPostsByDateDesc)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load posts'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadHomePosts()
})
</script>

<template>
  <section class="front">
    <header class="front__hero">
      <p class="front__eyebrow">SIGN BLOG</p>
      <h1>Thoughtful writing, engineered clarity.</h1>
      <p class="front__lead">
        Insights on frontend architecture, product thinking, and practical workflows for building better digital
        experiences.
      </p>
      <div class="front__actions">
        <RouterLink to="/article" class="hero-btn hero-btn--primary">Browse Articles</RouterLink>
        <RouterLink to="/write" class="hero-btn">Start Writing</RouterLink>
      </div>
    </header>

    <section class="feed" aria-live="polite">
      <div v-if="loading" class="feed__state">Loading posts...</div>
      <div v-else-if="error" class="feed__state feed__state--error">
        <p>{{ error }}</p>
        <button type="button" class="feed__retry" @click="loadHomePosts">Retry</button>
      </div>

      <div v-else class="list-wrapper">
        <header class="feed__head">
          <h2>Latest posts</h2>
        </header>
        <PostList class="feed__grid feed__grid--list" :posts="latestPosts" />
      </div>
    </section>
  </section>
</template>

<style scoped lang="less">
.front {
  width: 100%;
  padding: 70px 20px 40px;
}

.front__hero {
  width: min(100%, 980px);
  margin: 0 auto 2.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  h1 {
    margin: 0;
    font-size: clamp(2.2rem, 5vw, 3.7rem);
    line-height: 1.08;
    letter-spacing: -0.03em;
    color: var(--ink-strong);
  }
}

.front__eyebrow {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--brand-500);
  font-weight: 700;
}

.front__lead {
  margin: 0;
  color: var(--ink-muted);
  font-size: clamp(1rem, 2vw, 1.18rem);
}

.front__actions {
  margin-top: 0.55rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem;
}

.hero-btn {
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  padding: 0.62rem 1.18rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ink-main);
  background: rgba(255, 255, 255, 0.8);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(0, 113, 227, 0.35);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
}

.hero-btn--primary {
  color: #fff;
  border-color: #0071e3;
  background: linear-gradient(180deg, #2d91ff 0%, #0071e3 100%);
  box-shadow: 0 12px 24px rgba(0, 113, 227, 0.28);
}

.list-wrapper {
  width: min(100%, 900px);
  margin: 0 auto;
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;

    h2 {
      margin: 0;
      font-size: clamp(1.45rem, 2.8vw, 2rem);
      color: var(--ink-strong);
      letter-spacing: -0.01em;
    }
  }

  &__state {
    padding: 2rem;
    text-align: center;
    border-radius: 18px;
    border: 1px solid var(--line-soft);
    background: rgba(255, 255, 255, 0.74);
    color: var(--ink-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;

    p {
      margin: 0;
    }

    &--error {
      background: #fff5f5;
      color: var(--danger-500);
    }
  }

  &__retry {
    border: 1px solid rgba(198, 40, 40, 0.35);
    background: #fff;
    color: var(--danger-500);
    border-radius: 10px;
    padding: 0.45rem 0.85rem;
    font-weight: 700;
    cursor: pointer;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;

    &--list {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 680px) {
  .front__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-btn {
    text-align: center;
  }
}
</style>
