<template>
  <div class="article-container">
    <div v-if="loading" class="article-content" style="padding: 2rem">
      <SkeletonLoader variant="article-detail" />
    </div>
    <div v-else-if="error" class="article-error">
      <p class="article-error__message">{{ error }}</p>
      <router-link to="/article" class="article-error__recovery">返回文章列表</router-link>
    </div>

    <article v-else-if="post" class="article-wrapper">
      <header class="article-hero">
        <div class="article-hero__fallback">
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
        <div class="article-body" v-html="safeHtml"></div>
        <CommentSection :post-id="post.id" />
      </div>

      <footer class="article-footer">
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
  margin: 0;
  padding: 0;
}

.article-error {
  max-width: 720px;
  margin: 2rem auto;
  text-align: center;
  padding: 2rem 1.2rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-overlay);
  box-shadow: var(--shadow-sm);
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
}

.article-hero {
  position: relative;
  margin-bottom: 2.5rem;
  background: var(--surface-strong);
}

.article-hero__fallback {
  max-width: min(760px, 92vw);
  margin: 0 auto;
  padding: 4rem 1.5rem 2rem;
  background: transparent;
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
}

.article-hero__excerpt {
  font-size: clamp(1.05rem, 1.6vw, 1.25rem);
  line-height: 1.55;
  color: var(--ink-muted);
  margin: 0 0 2rem;
  max-width: 60ch;
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
  .article-hero__fallback {
    padding: 2.25rem 1rem 1.5rem;
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

  .article-prose {
    padding: 0 1rem;
  }

  .article-body {
    font-size: 16px;
  }

  .article-footer {
    padding: 0 1rem;
  }
}
</style>
