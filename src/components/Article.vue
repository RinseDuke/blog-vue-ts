<template>
  <div class="article-container">
    <div v-if="loading" class="article-content glass-surface" style="padding: 2rem">
      <SkeletonLoader variant="article-detail" />
    </div>
    <div v-else-if="error" class="article-error glass-surface" role="alert">
      <p class="article-error__message">{{ error }}</p>
      <router-link to="/article" class="article-error__recovery">返回文章列表</router-link>
    </div>

    <article v-else-if="post" class="article-wrapper">
      <header class="article-hero">
        <div class="article-hero__fallback glass-surface">
          <nav class="article-hero__breadcrumb" aria-label="文章分类">
            <router-link to="/article" class="article-hero__crumb article-hero__crumb--link">Blog</router-link>
            <template v-for="tag in post.tags" :key="tag">
              <span class="article-hero__crumb-sep" aria-hidden="true">/</span>
              <span class="article-hero__crumb">{{ tag }}</span>
            </template>
          </nav>
          <h1 class="article-hero__title">{{ post.title }}</h1>
          <p v-if="post.excerpt" class="article-hero__excerpt">{{ post.excerpt }}</p>
          <router-link
            :to="{ name: 'author', params: { id: post.author.id } }"
            class="article-hero__meta"
            aria-label="查看作者主页"
          >
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
          </router-link>
        </div>
      </header>

      <div class="article-prose">
        <div class="article-reading-panel">
          <div class="article-body" v-html="safeHtml"></div>
        </div>
        <CommentSection :post-id="post.id" />
      </div>

      <footer class="article-footer glass-surface">
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
import CommentSection from '@/components/comment/CommentSection.vue'
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
  min-width: 0;
  margin: 0;
  padding: 0;
}

.article-error {
  max-width: 720px;
  margin: 2rem auto;
  text-align: center;
  padding: 2rem 1.2rem;
  border-radius: var(--radius-lg);
}

.article-error__message {
  margin: 0 0 1rem;
  color: var(--danger-500);
  font-size: 1.05rem;
}

.article-error__recovery {
  color: var(--brand-500);
  font-weight: 600;
  text-decoration: none;

  &:hover {
    color: var(--brand-400);
  }
}

.article-wrapper {
  min-height: 100vh;
  min-width: 0;
}

.article-hero {
  position: relative;
  margin-bottom: 2.5rem;
  background: transparent;
}

.article-hero__fallback {
  width: min(760px, calc(100vw - 2rem));
  margin: 0 auto;
  padding: clamp(1.5rem, 5vw, 3rem);
  border-radius: var(--radius-lg);
  color: var(--ink-strong);
  text-align: left;
}

.article-hero__breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.005em;
}

.article-hero__crumb {
  color: var(--brand-500);
  text-decoration: none;
  transition: color var(--motion-base) var(--ease-out);
}

.article-hero__crumb--link:hover {
  color: var(--brand-400);
}

.article-hero__crumb-sep {
  color: var(--ink-muted);
  font-weight: 400;
  user-select: none;
}

.article-hero__title {
  font-size: clamp(2rem, 5vw, 3.4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 1.25rem;
  color: var(--ink-strong);
  overflow-wrap: anywhere;
}

.article-hero__excerpt {
  font-size: clamp(1.05rem, 1.6vw, 1.25rem);
  line-height: 1.55;
  color: var(--ink-muted);
  margin: 0 0 2rem;
  max-width: 60ch;
  overflow-wrap: anywhere;
}

.article-hero__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-sm);
  padding: 0.25rem 0.5rem;
  margin-left: -0.5rem;
  transition: background var(--motion-base) var(--ease-out);

  &:hover {
    background: var(--surface-hover);

    .author-name {
      color: var(--brand-500);
    }
  }
}

.author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--line-soft);
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.author-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--ink-strong);
}

.publish-info {
  font-size: 0.85rem;
  color: var(--ink-muted);
}

.article-prose {
  width: min(760px, calc(100vw - 2rem));
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
  min-width: 0;
}

.article-reading-panel {
  min-width: 0;
  max-width: 100%;
  padding: clamp(1.35rem, 4vw, 3rem);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  box-shadow: 0 20px 52px color-mix(in srgb, var(--ink-strong) 10%, transparent);
}

.article-body {
  min-width: 0;
  max-width: 100%;
  line-height: 1.85;
  color: var(--article-prose-text);
  font-size: 17px;
  overflow-wrap: anywhere;

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
    max-width: 100%;

    code {
      display: block;
      min-width: max-content;
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

  :deep(a) {
    color: var(--brand-500);
    text-decoration: underline;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }

  :deep(table) {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
  }

  :deep(th),
  :deep(td) {
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--line-soft);
    text-align: left;
  }
}

.article-footer {
  width: min(760px, calc(100vw - 2rem));
  margin: 3rem auto 2rem;
  padding: 0.65rem;
  border-radius: var(--radius-md);
}

.back-link {
  display: inline-flex;
  align-items: center;
  color: var(--brand-500);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.94rem;
  min-height: 44px;
  padding: 0.45rem 0.65rem;
  transition: color var(--motion-base) var(--ease-out);

  &:hover {
    color: var(--brand-400);
  }
}

@media (max-width: 768px) {
  .article-hero__fallback {
    padding: 1.35rem;
    border-radius: var(--radius-md);
  }

  .article-hero__breadcrumb {
    font-size: 0.92rem;
    margin-bottom: 1rem;
  }

  .article-hero__title {
    font-size: clamp(1.55rem, 6vw, 2rem);
    margin-bottom: 0.9rem;
  }

  .article-hero__excerpt {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .author-avatar {
    width: 40px;
    height: 40px;
  }

  .article-reading-panel {
    padding: 1.25rem;
    border-radius: var(--radius-md);
  }

  .article-body {
    font-size: 16px;
  }

}

@media (max-width: 390px) {
  .article-hero__fallback,
  .article-prose,
  .article-footer {
    width: min(760px, calc(100vw - 1.4rem));
  }

  .article-hero__fallback,
  .article-reading-panel {
    padding: 1.05rem;
  }

  .article-hero__title {
    font-size: clamp(1.45rem, 8vw, 1.9rem);
  }

  .article-body {
    font-size: 15.5px;
  }
}
</style>
