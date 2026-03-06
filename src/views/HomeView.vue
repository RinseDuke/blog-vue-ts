<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import PostList from '@/components/post/PostList.vue'

const HOME_POST_LIMIT = 12

const postsStore = usePostsStore()
const { sortedPosts, loading, error } = storeToRefs(postsStore)
const { ensurePosts, refreshPosts } = postsStore
const latestPosts = computed(() => sortedPosts.value.slice(0, HOME_POST_LIMIT))

async function loadHomePosts(force = false) {
  try {
    if (force) {
      await refreshPosts()
      return
    }

    await ensurePosts()
  } catch (err) {
    console.warn('首页文章加载失败', err)
  }
}

onMounted(() => {
  void loadHomePosts()
})
</script>

<template>
  <section class="front">
    <section class="feed" aria-live="polite">
      <div v-if="loading" class="feed__state">正在加载文章...</div>
      <div v-else-if="error" class="feed__state feed__state--error">
        <p>{{ error }}</p>
        <button type="button" class="feed__retry" @click="loadHomePosts(true)">重试</button>
      </div>

      <div v-else class="list-wrapper">
        <header class="feed__head">
          <h2>最新文章</h2>
        </header>
        <PostList class="feed__grid feed__grid--list" :posts="latestPosts" />
      </div>
    </section>
  </section>
</template>

<style scoped lang="less">
.front {
  width: 100%;
  padding: 64px 20px 24px;
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
    border-radius: var(--radius-lg);
    border: 1px solid var(--line-soft);
    background: var(--surface);
    color: var(--ink-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;

    p {
      margin: 0;
    }

    &--error {
      background: var(--danger-bg);
      color: var(--danger-500);
    }
  }

  &__retry {
    border: 1px solid rgba(198, 40, 40, 0.35);
    background: var(--surface-strong);
    color: var(--danger-500);
    border-radius: var(--radius-sm);
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

</style>

