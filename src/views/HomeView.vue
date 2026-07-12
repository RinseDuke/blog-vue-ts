<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { formatPostDate } from '@/features/post/utils/post'

const HOME_POST_LIMIT = 12

const postsStore = usePostsStore()
const { sortedPosts, loading, error } = storeToRefs(postsStore)
const { ensurePosts, refreshPosts } = postsStore

const latestPosts = computed(() => sortedPosts.value.slice(0, HOME_POST_LIMIT))
const latestLeadPost = computed(() => latestPosts.value[0] ?? null)
const latestDigestPosts = computed(() => latestPosts.value.slice(1, 4))
const latestStreamPosts = computed(() => latestPosts.value.slice(4))

function formatLatestDate(dateString: string) {
  return formatPostDate(dateString)
}

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
          <div>
            <p class="feed__eyebrow">LATEST POSTS</p>
            <h2>最新文章</h2>
          </div>
          <p class="feed__summary">共 {{ latestPosts.length }} 篇，首篇作为最新发布优先展示。</p>
        </header>

        <div v-if="latestLeadPost" class="latest-board">
          <div class="latest-stack">
            <RouterLink
              :to="{ name: 'article-detail', params: { id: latestLeadPost.id } }"
              class="latest-lead"
            >
              <div class="latest-lead__content">
                <span class="latest-lead__kicker">最新发布</span>
                <h3 class="latest-lead__title">{{ latestLeadPost.title }}</h3>
                <p v-if="latestLeadPost.excerpt" class="latest-lead__excerpt">{{ latestLeadPost.excerpt }}</p>

                <div class="latest-lead__meta">
                  <span>{{ latestLeadPost.author.name }}</span>
                  <span>{{ formatLatestDate(latestLeadPost.publishedAt) }}</span>
                  <span>{{ latestLeadPost.readMinutes }} 分钟阅读</span>
                </div>

                <div v-if="latestLeadPost.tags.length" class="latest-lead__tags">
                  <span v-for="tag in latestLeadPost.tags.slice(0, 3)" :key="tag" class="latest-lead__tag">
                    {{ tag }}
                  </span>
                </div>

                <span class="latest-lead__cta">阅读文章</span>
              </div>

              <div class="latest-lead__rail" aria-hidden="true">
                <span class="latest-lead__index">01</span>
                <span class="latest-lead__rail-line"></span>
              </div>
            </RouterLink>

            <div v-if="latestDigestPosts.length" class="latest-digest">
              <RouterLink
                v-for="(post, index) in latestDigestPosts"
                :key="post.id"
                :to="{ name: 'article-detail', params: { id: post.id } }"
                class="latest-digest__item"
              >
                <span class="latest-digest__index">#{{ index + 2 }}</span>

                <div class="latest-digest__body">
                  <h3>{{ post.title }}</h3>
                  <p>{{ post.excerpt }}</p>
                  <div class="latest-digest__meta">
                    <span>{{ post.author.name }}</span>
                    <span>{{ formatLatestDate(post.publishedAt) }}</span>
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>

          <div v-if="latestStreamPosts.length" class="latest-stream">
            <RouterLink
              v-for="(post, index) in latestStreamPosts"
              :key="post.id"
              :to="{ name: 'article-detail', params: { id: post.id } }"
              class="latest-stream__item"
            >
              <span class="latest-stream__index">#{{ index + 5 }}</span>

              <div class="latest-stream__body">
                <h3>{{ post.title }}</h3>
                <p>{{ post.excerpt }}</p>
                <div class="latest-stream__meta">
                  <span>{{ post.author.name }}</span>
                  <span>{{ formatLatestDate(post.publishedAt) }}</span>
                </div>
              </div>

              <span class="latest-stream__arrow" aria-hidden="true">↗</span>
            </RouterLink>
          </div>
        </div>

        <div v-else class="feed__state feed__state--empty">
          <p>暂无文章</p>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped lang="less">
.front {
  width: 100%;
  padding: 60px 20px 32px;
  position: relative;
}

.list-wrapper {
  width: min(100%, 1040px);
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
    align-items: flex-end;
    gap: 1rem;
    margin-bottom: 1rem;

    h2 {
      margin: 0;
      font-size: clamp(1.45rem, 2.8vw, 2rem);
      color: var(--ink-strong);
      letter-spacing: -0.01em;
    }
  }

  &__eyebrow {
    margin: 0 0 0.2rem;
    color: var(--brand-500);
    font-weight: 700;
    letter-spacing: 0.14em;
    font-size: 0.72rem;
  }

  &__summary {
    margin: 0;
    color: var(--ink-muted);
    font-size: 0.92rem;
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
    box-shadow: var(--shadow-sm);

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
      gap: 1.15rem;
      margin-top: 1.15rem;
    }
  }
}

.latest-board {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    'stack'
    'stream';
  gap: 1.25rem;
  align-items: start;
}

.latest-stack {
  grid-area: stack;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-self: start;
  min-height: 0;
}

.latest-lead {
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  min-height: 0;
  padding: 1.4rem 1.4rem 1.25rem;
  border-radius: calc(var(--radius-lg) + 2px);
  border: 1px solid color-mix(in srgb, var(--brand-500) 22%, var(--line-soft));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--brand-100) 55%, transparent), transparent 46%),
    linear-gradient(180deg, var(--surface-overlay), var(--surface));
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  align-self: stretch;
}

.latest-lead::before {
  content: '';
  position: absolute;
  inset: auto auto 0 0;
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, var(--brand-500), color-mix(in srgb, var(--brand-500) 35%, transparent));
}

.latest-lead__content {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-width: 640px;
}

.latest-lead__kicker {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-500) 11%, transparent);
  color: var(--brand-500);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.latest-lead__title {
  margin: 0;
  color: var(--ink-strong);
  font-size: clamp(1.5rem, 3vw, 2.35rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.latest-lead__excerpt {
  margin: 0;
  max-width: 62ch;
  color: var(--ink-muted);
  font-size: 0.98rem;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.latest-lead__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  color: var(--ink-muted);
  font-size: 0.84rem;
  font-weight: 600;
}

.latest-lead__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.latest-lead__tag {
  padding: 0.28rem 0.64rem;
  border-radius: 999px;
  background: var(--surface-strong);
  border: 1px solid var(--line-soft);
  color: var(--ink-main);
  font-size: 0.78rem;
  font-weight: 700;
}

.latest-lead__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  width: fit-content;
  margin-top: auto;
  color: var(--brand-500);
  font-size: 0.9rem;
  font-weight: 800;
}

.latest-lead__rail {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  min-width: 72px;
}

.latest-lead__index {
  color: color-mix(in srgb, var(--brand-500) 52%, var(--ink-muted));
  font-size: 2.4rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.06em;
}

.latest-lead__rail-line {
  width: 2px;
  flex: 1;
  margin-top: 0.8rem;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--brand-500), transparent);
}

.latest-stream {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  grid-area: stream;
  align-self: stretch;
}

.latest-digest {
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: auto;
  gap: 0.85rem;
  min-height: 0;
}

.latest-digest__item {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 100%;
  padding: 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--brand-500) 12%, var(--line-soft));
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--brand-100) 35%, transparent), transparent 46%),
    var(--surface);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.latest-digest__item:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--brand-500) 18%, var(--line-soft));
  box-shadow: var(--shadow-md);
}

.latest-digest__index {
  width: fit-content;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-500) 10%, transparent);
  color: var(--brand-500);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.latest-digest__body {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
}

.latest-digest__body h3 {
  margin: 0;
  color: var(--ink-strong);
  font-size: 0.98rem;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.latest-digest__body p {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.86rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.latest-digest__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: var(--ink-muted);
  font-size: 0.76rem;
}

.latest-digest__meta span + span::before,
.latest-stream__meta span + span::before,
.latest-lead__meta span + span::before {
  content: '·';
  margin-right: 0.5rem;
  color: color-mix(in srgb, var(--ink-muted) 65%, transparent);
}

.latest-stream__item {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1rem 1rem 1rem 0.95rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line-soft);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.latest-stream__item:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--brand-500) 18%, var(--line-soft));
  box-shadow: var(--shadow-md);
}

.latest-stream__index {
  min-width: 42px;
  padding-top: 0.1rem;
  color: var(--brand-500);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.latest-stream__body {
  flex: 1;
  min-width: 0;
}

.latest-stream__body h3 {
  margin: 0 0 0.4rem;
  color: var(--ink-strong);
  font-size: 1.02rem;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.latest-stream__body p {
  margin: 0 0 0.65rem;
  color: var(--ink-muted);
  font-size: 0.88rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.latest-stream__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  color: var(--ink-muted);
  font-size: 0.78rem;
}

.latest-stream__arrow {
  color: var(--brand-500);
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
  margin-top: 0.15rem;
}

@media (max-width: 840px) {
  .front {
    padding-top: 48px;
  }

  .feed__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .latest-board {
    grid-template-columns: 1fr;
    grid-template-areas:
      'stack'
      'stream';
  }

  .latest-lead {
    min-height: auto;
    padding: 1.2rem;
    flex-direction: column;
  }

  .latest-lead__rail {
    flex-direction: row;
    align-items: center;
    min-width: 0;
  }

  .latest-lead__rail-line {
    width: auto;
    height: 2px;
    flex: 1;
    margin-top: 0;
    margin-left: 0.75rem;
  }

  .latest-digest {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }
}

</style>

