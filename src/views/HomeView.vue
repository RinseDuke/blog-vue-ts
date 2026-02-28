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
    console.warn('Failed to load home posts', err)
  }
}

onMounted(() => {
  void loadHomePosts()
})
</script>

<template>
  <section class="front">
    <section class="feed" aria-live="polite">
      <div v-if="loading" class="feed__state">Loading posts...</div>
      <div v-else-if="error" class="feed__state feed__state--error">
        <p>{{ error }}</p>
        <button type="button" class="feed__retry" @click="loadHomePosts(true)">Retry</button>
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

</style>
