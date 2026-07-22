<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthorProfile } from '@/features/author/composables/useAuthorProfile'
import PostList from '@/components/post/PostList.vue'

const route = useRoute()
const { author, posts, loading, error, load, retry } = useAuthorProfile()

watch(
  () => route.params.id,
  (value) => {
    const authorId = typeof value === 'string' ? value : ''
    document.title = '作者主页 - Sign 博客'
    void load(authorId)
  },
  { immediate: true },
)

watch(author, (value) => {
  if (value) {
    document.title = `${value.name} - Sign 博客`
  }
})
</script>

<template>
  <main class="author-page">
    <section v-if="loading" class="author-state" aria-live="polite">
      <p class="author-state__eyebrow">AUTHOR PROFILE</p>
      <h1>正在加载作者主页</h1>
    </section>

    <section v-else-if="error" class="author-state author-state--error" role="alert">
      <p class="author-state__eyebrow">LOAD ERROR</p>
      <h1>作者主页加载失败</h1>
      <p>{{ error }}</p>
      <div class="author-state__actions">
        <button type="button" class="author-retry" @click="retry">重试</button>
        <router-link to="/article" class="author-link">返回文章列表</router-link>
      </div>
    </section>

    <section v-else-if="!author" class="author-state">
      <p class="author-state__eyebrow">AUTHOR PROFILE</p>
      <h1>作者未找到</h1>
      <p>该作者暂无公开文章，或主页已不可用。</p>
      <router-link to="/article" class="author-link">返回文章列表</router-link>
    </section>

    <template v-else>
      <header class="author-hero">
        <div class="author-hero__identity">
          <img
            v-if="author.avatarUrl"
            :src="author.avatarUrl"
            alt=""
            class="author-avatar"
          />
          <div v-else class="author-avatar author-avatar--fallback" aria-hidden="true">
            {{ author.name.slice(0, 1).toUpperCase() }}
          </div>

          <div>
            <p class="author-hero__eyebrow">PUBLIC AUTHOR</p>
            <h1>{{ author.name }}</h1>
            <p v-if="author.username" class="author-hero__username">@{{ author.username }}</p>
          </div>
        </div>

        <p v-if="author.bio" class="author-hero__bio">{{ author.bio }}</p>
      </header>

      <section class="author-posts" aria-labelledby="author-posts-title">
        <div class="author-posts__heading">
          <div>
            <p class="author-posts__eyebrow">PUBLISHED NOTES</p>
            <h2 id="author-posts-title">公开文章</h2>
          </div>
          <span>{{ posts.length }} 篇</span>
        </div>

        <PostList :posts="posts" />
      </section>
    </template>
  </main>
</template>

<style scoped lang="less">
.author-page {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 54px 0 64px;
  color: var(--ink-strong);
}

.author-hero,
.author-state {
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.author-hero {
  padding: clamp(1.5rem, 4vw, 2.5rem);
  background:
    linear-gradient(120deg, color-mix(in srgb, var(--brand-100) 72%, transparent), transparent 64%),
    var(--surface);
}

.author-hero__identity {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.author-avatar {
  width: 104px;
  height: 104px;
  flex: 0 0 auto;
  border: 3px solid var(--surface-strong);
  border-radius: var(--radius-lg);
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}

.author-avatar--fallback {
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, var(--accent-500), var(--brand-500));
  color: var(--on-brand);
  font-size: 2.3rem;
  font-weight: 800;
}

.author-hero__eyebrow,
.author-posts__eyebrow,
.author-state__eyebrow {
  margin: 0;
  color: var(--accent-500);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 700;
}

.author-hero h1,
.author-state h1 {
  margin: 0.28rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.08;
}

.author-hero__username {
  margin: 0.5rem 0 0;
  color: var(--ink-muted);
}

.author-hero__bio {
  max-width: 68ch;
  margin: 1.5rem 0 0;
  color: var(--ink-main);
  line-height: 1.75;
}

.author-posts {
  margin-top: 1.5rem;
}

.author-posts__heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.author-posts__heading h2 {
  margin: 0.2rem 0 0;
  font-size: clamp(1.45rem, 3vw, 2rem);
}

.author-posts__heading span {
  color: var(--ink-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.author-state {
  padding: clamp(2rem, 8vw, 5rem) 1.5rem;
  text-align: center;
}

.author-state p:not(.author-state__eyebrow) {
  margin: 0.9rem 0 0;
  color: var(--ink-muted);
}

.author-state--error h1 {
  color: var(--danger-500);
}

.author-state__actions {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.4rem;
}

.author-retry {
  min-height: 42px;
  padding: 0.65rem 1rem;
  border: 1px solid var(--brand-500);
  border-radius: var(--radius-sm);
  background: var(--brand-500);
  color: var(--on-brand);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.author-retry:hover {
  background: var(--brand-400);
  border-color: var(--brand-400);
}

.author-retry:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.author-link {
  display: inline-flex;
  color: var(--brand-500);
  font-weight: 700;
  text-decoration: none;
}

.author-state > .author-link {
  margin-top: 1.4rem;
}

.author-link:hover {
  color: var(--brand-400);
}

@media (max-width: 640px) {
  .author-page {
    width: min(100% - 28px, 1120px);
    padding: 40px 0;
  }

  .author-hero__identity {
    align-items: flex-start;
    gap: 0.9rem;
  }

  .author-avatar {
    width: 76px;
    height: 76px;
    border-radius: var(--radius-md);
  }

  .author-avatar--fallback {
    font-size: 1.7rem;
  }
}
</style>
