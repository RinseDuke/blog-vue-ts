<template>
  <div class="article-container">
    <div v-if="loading" class="article-content" style="padding: 2rem">
      <SkeletonLoader variant="article-detail" />
    </div>
    <div v-else-if="error" class="status-message error">{{ error }}</div>

    <article v-else-if="post" class="article-wrapper">
      <header class="article-hero">
        <div v-if="post.coverImage" class="article-hero__image">
          <img :src="post.coverImage" :alt="post.title" loading="eager" decoding="async" />
          <div class="article-hero__overlay"></div>
          <div class="article-hero__content">
            <div class="article-hero__tags">
              <span v-for="tag in post.tags" :key="tag" class="tag-chip">{{ tag }}</span>
            </div>
            <h1 class="article-hero__title">{{ post.title }}</h1>
            <div class="article-hero__meta">
              <img
                v-if="post.author.avatarUrl"
                :src="post.author.avatarUrl"
                :alt="post.author.name"
                class="author-avatar"
                loading="eager"
                decoding="async"
              />
              <div class="author-details">
                <span class="author-name">{{ post.author.name }}</span>
                <span class="publish-info">
                  {{ formatDate(post.publishedAt) }} · {{ post.readMinutes }} 分钟阅读
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="article-hero__fallback">
          <div class="article-hero__tags">
            <span v-for="tag in post.tags" :key="tag" class="tag-chip">{{ tag }}</span>
          </div>
          <h1 class="article-hero__title">{{ post.title }}</h1>
          <div class="article-hero__meta">
            <img
              v-if="post.author.avatarUrl"
              :src="post.author.avatarUrl"
              :alt="post.author.name"
              class="author-avatar"
              loading="eager"
              decoding="async"
            />
            <div class="author-details">
              <span class="author-name">{{ post.author.name }}</span>
              <span class="publish-info">
                {{ formatDate(post.publishedAt) }} · {{ post.readMinutes }} 分钟阅读
              </span>
            </div>
          </div>
        </div>
      </header>

      <div class="article-prose">
        <div class="article-body" v-html="safeHtml"></div>
      </div>

      <footer class="article-footer">
        <div v-if="post.author" class="author-card">
          <img
            v-if="post.author.avatarUrl"
            :src="post.author.avatarUrl"
            :alt="post.author.name"
            class="author-card__avatar"
            loading="lazy"
            decoding="async"
          />
          <div class="author-card__info">
            <h3 class="author-card__name">{{ post.author.name }}</h3>
            <p class="author-card__bio">{{ post.author.bio || '这位作者很神秘，什么都没有留下。' }}</p>
          </div>
        </div>
        <router-link to="/article" class="back-link">← 返回文章列表</router-link>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DOMPurify from 'dompurify'
import type { Post } from '@/types/post'
import { fetchPostById } from '@/services/postService'
import { formatPostDate } from '@/features/post/utils/post'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'

const route = useRoute()
const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const fallbackHtml = computed(() => {
  const excerpt = post.value?.excerpt ?? ''
  return `<h3>内容暂不可用</h3><p>${excerpt}</p>`
})

const safeHtml = computed(() => {
  const raw = post.value?.content ?? fallbackHtml.value
  return DOMPurify.sanitize(raw)
})

async function loadPostById(id: string) {
  if (!id) {
    post.value = null
    error.value = '未找到文章'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const fetchedPost = await fetchPostById(id)
    if (!fetchedPost) {
      post.value = null
      error.value = '未找到文章'
      return
    }

    post.value = fetchedPost
    document.title = `${fetchedPost.title} - Sign 博客`
  } catch (err) {
    post.value = null
    error.value = err instanceof Error ? err.message : '加载文章失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  (value) => {
    const id = typeof value === 'string' ? value : ''
    void loadPostById(id)
  },
  { immediate: true }
)

function formatDate(dateString: string) {
  return formatPostDate(dateString)
}
</script>

<style scoped lang="less">
.article-container {
  max-width: 100%;
  margin: 0;
  padding: 0;
}

.status-message {
  max-width: 720px;
  margin: 2rem auto;
  text-align: center;
  color: var(--ink-muted);
  font-size: 1.05rem;
  padding: 2rem 1.2rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-overlay);
  box-shadow: var(--shadow-sm);
}

.status-message.error {
  color: var(--danger-500);
}

.article-wrapper {
  min-height: 100vh;
}

.article-hero {
  position: relative;
  margin-bottom: 3rem;
}

.article-hero__image {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 7;
  overflow: hidden;
  background: var(--surface-strong);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.article-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.55));
}

.article-hero__content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2rem min(5vw, 3rem) 2.5rem;
  color: white;
}

.article-hero__fallback {
  padding: 3rem min(5vw, 3rem) 2rem;
  background: linear-gradient(135deg, var(--brand-500), var(--brand-400));
  color: white;
  text-align: center;
}

.article-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.8rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 600;
  color: white;
}

.article-hero__title {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0 0 1.5rem;
  color: white;
}

.article-hero__meta {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.author-name {
  font-weight: 700;
  font-size: 1rem;
  color: white;
}

.publish-info {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.85);
}

.article-prose {
  max-width: min(720px, 92vw);
  margin: 0 auto;
  padding: 0 1.5rem;
}

.article-body {
  line-height: 1.8;
  color: var(--article-prose-text);
  font-size: 17px;

  :deep(p) {
    margin-bottom: 1.5em;
  }

  :deep(h1) {
    font-size: 2rem;
    font-weight: 800;
    color: var(--article-prose-heading);
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    letter-spacing: -0.01em;
  }

  :deep(h2) {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--article-prose-heading);
    margin-top: 2.5rem;
    margin-bottom: 0.85rem;
    letter-spacing: -0.01em;
  }

  :deep(h3) {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--article-prose-heading);
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    letter-spacing: -0.01em;
  }

  :deep(blockquote) {
    margin: 1.8rem 0;
    padding: 1rem 1.2rem;
    border-left: 3px solid var(--brand-500);
    background: var(--article-quote-bg);
    border-radius: var(--radius-sm);
    color: var(--ink-main);
  }

  :deep(code) {
    background: var(--article-code-bg);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: 'Consolas', 'Monaco', monospace;
  }

  :deep(pre) {
    background: var(--article-code-block-bg);
    padding: 1.2rem;
    border-radius: var(--radius-md);
    overflow-x: auto;
    margin: 1.5rem 0;

    code {
      background: none;
      padding: 0;
      color: #e6edf3;
    }
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    margin: 1.5rem 0;
  }
}

.article-footer {
  max-width: min(720px, 92vw);
  margin: 3rem auto 2rem;
  padding: 0 1.5rem;
}

.author-card {
  display: flex;
  gap: 1.2rem;
  padding: 1.5rem;
  background: var(--surface-overlay);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  margin-bottom: 2rem;
}

.author-card__avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.author-card__info {
  flex: 1;
}

.author-card__name {
  font-size: 1.13rem;
  font-weight: 700;
  color: var(--ink-strong);
  margin: 0 0 0.5rem;
}

.author-card__bio {
  font-size: 0.94rem;
  color: var(--ink-muted);
  margin: 0;
  line-height: 1.6;
}

.back-link {
  display: inline-flex;
  align-items: center;
  color: var(--brand-500);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.94rem;
  transition: color var(--motion-base) var(--ease-out);

  &:hover {
    color: var(--brand-400);
  }
}

@media (max-width: 768px) {
  .article-hero__content,
  .article-hero__fallback {
    padding: 1.5rem 1rem 1.8rem;
  }

  .article-hero__title {
    font-size: clamp(1.5rem, 5vw, 2rem);
    margin-bottom: 1rem;
  }

  .author-avatar {
    width: 40px;
    height: 40px;
  }

  .article-prose {
    padding: 0 1rem;
  }

  .article-body {
    font-size: 16px;
  }

  .article-footer {
    padding: 0 1rem;
  }

  .author-card {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
}
</style>
