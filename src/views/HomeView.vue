<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import FeaturedHero from '@/components/post/FeaturedHero.vue'
import PostList from '@/components/post/PostList.vue'
import { usePostsStore } from '@/features/post/composables/usePostsStore'

const HOME_POST_LIMIT = 12

const postsStore = usePostsStore()
const { sortedPosts, loading, error } = storeToRefs(postsStore)
const { ensurePosts, refreshPosts } = postsStore

const homePosts = computed(() => sortedPosts.value.slice(0, HOME_POST_LIMIT))
const heroPost = computed(
  () => homePosts.value.find((post) => post.featured) ?? homePosts.value[0] ?? null,
)
const latestPosts = computed(() =>
  homePosts.value.filter((post) => post.id !== heroPost.value?.id),
)

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
    <header class="front__intro">
      <p class="front__eyebrow">Ideas, craft and better work</p>
      <h1 class="front__title">把复杂的事，写得清楚一点。</h1>
      <p class="front__lede">
        关于产品、技术与持续成长的实践笔记。精选内容先落在聚光灯下，其余文章沿着轻盈的卡片流继续展开。
      </p>
    </header>

    <section class="feed" aria-live="polite">
      <div v-if="loading" class="feed__state glass-surface">正在加载文章...</div>

      <div v-else-if="error" class="feed__state feed__state--error glass-surface" role="alert">
        <p>{{ error }}</p>
        <button type="button" class="feed__retry" @click="loadHomePosts(true)">重试</button>
      </div>

      <div v-else-if="!homePosts.length" class="feed__state feed__state--empty glass-surface">
        <p>暂无文章，新的内容正在准备中。</p>
      </div>

      <template v-else>
        <section class="featured-section" aria-labelledby="featured-heading">
          <div class="section-heading section-heading--featured">
            <div>
              <p class="section-heading__eyebrow">Featured</p>
              <h2 id="featured-heading">精选文章</h2>
            </div>
            <p>从这里开始，进入本期最值得细读的主题。</p>
          </div>

          <FeaturedHero v-if="heroPost" :post="heroPost" />
        </section>

        <section class="latest-section" aria-labelledby="latest-heading">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Latest notes</p>
              <h2 id="latest-heading">最新文章</h2>
            </div>
            <p>{{ latestPosts.length }} 篇更新，按发布时间依次排列。</p>
          </div>

          <PostList v-if="latestPosts.length" class="latest-section__grid" :posts="latestPosts" />
          <p v-else class="latest-section__empty">更多文章正在路上。</p>
        </section>
      </template>
    </section>
  </section>
</template>

<style scoped lang="less">
.front {
  position: relative;
  width: 100%;
  padding: clamp(3.5rem, 8vw, 7rem) 1.25rem 4rem;
  overflow: hidden;
}

.front::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 50%;
  width: min(980px, 96vw);
  height: 340px;
  transform: translateX(-50%);
  background:
    radial-gradient(circle at 28% 34%, color-mix(in srgb, var(--brand-100) 70%, transparent), transparent 42%),
    radial-gradient(circle at 72% 18%, color-mix(in srgb, var(--bg-ambient-warm) 72%, transparent), transparent 38%);
  pointer-events: none;
}

.front__intro,
.feed {
  position: relative;
  z-index: 1;
  width: min(100%, 1180px);
  margin-inline: auto;
}

.front__intro {
  display: grid;
  gap: 1rem;
  margin-bottom: clamp(3rem, 7vw, 5.5rem);
}

.front__eyebrow,
.section-heading__eyebrow {
  margin: 0;
  color: var(--brand-500);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.front__title {
  max-width: 900px;
  margin: 0;
  color: var(--ink-strong);
  font-size: clamp(2.65rem, 8vw, 6.6rem);
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: -0.065em;
  overflow-wrap: anywhere;
}

.front__lede {
  max-width: 62ch;
  margin: 0;
  color: var(--ink-main);
  font-size: clamp(1rem, 1.8vw, 1.18rem);
  line-height: 1.75;
}

.feed {
  display: flex;
  flex-direction: column;
  gap: clamp(3rem, 7vw, 5rem);
}

.featured-section,
.latest-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.section-heading > div {
  display: grid;
  gap: 0.35rem;
}

.section-heading h2 {
  margin: 0;
  color: var(--ink-strong);
  font-size: clamp(1.65rem, 3vw, 2.5rem);
  line-height: 1.08;
  letter-spacing: -0.035em;
}

.section-heading > p {
  max-width: 42ch;
  margin: 0;
  color: var(--ink-muted);
  line-height: 1.65;
  text-align: right;
}

.feed__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  padding: 2rem;
  border-radius: var(--radius-lg);
  color: var(--ink-main);
  text-align: center;
}

.feed__state p {
  margin: 0;
}

.feed__state--error {
  color: var(--danger-500);
}

.feed__retry {
  min-height: 44px;
  padding: 0.55rem 1rem;
  border: 1px solid color-mix(in srgb, var(--danger-500) 32%, var(--glass-border));
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  color: var(--danger-500);
  font: inherit;
  font-weight: 750;
  cursor: pointer;
}

.latest-section__empty {
  margin: 0;
  padding: 1.25rem;
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--ink-muted);
  text-align: center;
}

@media (max-width: 768px) {
  .front {
    padding: 3.25rem 1rem 3rem;
  }

  .front__intro {
    margin-bottom: 3.25rem;
  }

  .front__title {
    font-size: clamp(2.6rem, 13vw, 4.5rem);
    line-height: 1.02;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.65rem;
  }

  .section-heading > p {
    text-align: left;
  }
}

@media (max-width: 390px) {
  .front {
    padding-inline: 0.85rem;
  }

  .front__title {
    font-size: clamp(2.35rem, 12vw, 3rem);
    letter-spacing: -0.05em;
  }
}
</style>
