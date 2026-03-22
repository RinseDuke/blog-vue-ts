<!-- 文章详情组件：按后端 blogs 模型渲染正文 -->
<template>
  <div class="article-container">
    <div v-if="loading" class="article-content" style="padding: 2rem">
      <SkeletonLoader variant="article-detail" />
    </div>
    <div v-else-if="error" class="status-message error">{{ error }}</div>

    <article v-else-if="post" class="article-content">
      <header class="article-header">
        <div class="article-header__meta">
          <span class="article-badge">{{ post.status === 'draft' ? '草稿' : '文章' }}</span>
          <span class="article-badge article-badge--ghost">
            {{ post.visibility === 'private' ? '仅自己可见' : '公开' }}
          </span>
        </div>

        <h1 class="article-title">{{ post.title }}</h1>
        <p class="article-excerpt">{{ post.excerpt }}</p>

        <div class="article-meta">
          <div class="author-info">
            <img
              v-if="post.author.avatarUrl"
              :src="post.author.avatarUrl"
              :alt="post.author.name"
              class="author-avatar"
            />
            <div>
              <span class="author-name">{{ post.author.name }}</span>
              <span class="publish-date">
                发布于 {{ formatDate(post.publishedAt) }}
                <template v-if="post.updatedAt"> · 更新于 {{ formatDate(post.updatedAt) }}</template>
              </span>
            </div>
          </div>
        </div>
      </header>

      <div class="article-body" v-html="safeHtml"></div>

      <div class="feature-note">
        当前详情页已按后端博客模型收口，点赞、评论、举报等互动能力待后端接口补充后再接回。
      </div>

      <footer class="article-footer">
        <router-link to="/article" class="back-line">返回文章列表</router-link>
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
  max-width: 860px;
  margin: 3.2rem auto 2.4rem;
  padding: 0 1.2rem;
}

.status-message {
  text-align: center;
  color: var(--ink-muted);
  font-size: 1.05rem;
  padding: 4rem 0;
}

.status-message.error {
  color: var(--danger-500);
}

.article-content {
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-sm);
  padding: clamp(1.25rem, 2.8vw, 2.2rem);
}

.article-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--line-soft);
  padding-bottom: 1.5rem;
}

.article-header__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-bottom: 1rem;
}

.article-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0.3rem 0.72rem;
  border-radius: 999px;
  background: var(--brand-500);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
}

.article-badge--ghost {
  background: var(--surface-strong);
  color: var(--ink-main);
  border: 1px solid var(--line-soft);
}

.article-title {
  font-size: clamp(2rem, 4.5vw, 3rem);
  font-weight: 800;
  line-height: 1.12;
  color: var(--ink-strong);
  letter-spacing: -0.02em;
  margin: 0 0 1rem;
}

.article-excerpt {
  font-size: clamp(1.02rem, 2vw, 1.2rem);
  color: var(--ink-main);
  margin: 0;
}

.article-meta {
  margin-top: 1.5rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--line-soft);
}

.author-name {
  display: block;
  font-weight: 700;
  color: var(--ink-strong);
}

.publish-date {
  font-size: 0.84rem;
  color: var(--ink-muted);
}

.article-body {
  line-height: 1.76;
  color: var(--ink-main);
  font-size: 1.02rem;

  :deep(p) {
    margin-bottom: 1.3rem;
  }

  :deep(h2),
  :deep(h3) {
    font-weight: 800;
    color: var(--ink-strong);
    margin-top: 2rem;
    margin-bottom: 0.85rem;
    letter-spacing: -0.01em;
  }

  :deep(blockquote) {
    margin: 1.8rem 0;
    padding: 1rem 1.2rem;
    border-left: 3px solid rgba(0, 113, 227, 0.42);
    background: rgba(0, 113, 227, 0.08);
    border-radius: 12px;
    color: var(--ink-main);
  }
}

.feature-note {
  margin-top: 2rem;
  padding: 0.95rem 1rem;
  border-radius: var(--radius-md);
  border: 1px dashed var(--line-strong);
  background: var(--bg-canvas-soft);
  color: var(--ink-muted);
  line-height: 1.65;
}

.article-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line-soft);
  display: flex;
  justify-content: flex-end;
}

.back-line {
  color: var(--brand-500);
  text-decoration: none;
  font-weight: 700;

  &:hover {
    opacity: 0.8;
  }
}

@media (max-width: 640px) {
  .article-container {
    padding: 0 0.7rem;
  }

  .article-content {
    border-radius: 18px;
  }
}
</style>
