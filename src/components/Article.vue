<template>
  <div class="article-container">
    <div v-if="loading" class="article-content" style="padding: 2rem">
      <SkeletonLoader variant="article-detail" />
    </div>
    <div v-else-if="error" class="status-message error">{{ error }}</div>

    <article v-else-if="post" class="article-content">
      <header class="article-header">
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
              <span class="publish-date">{{ formatDate(post.publishedAt) }}</span>
            </div>
          </div>
        </div>
      </header>

      <figure v-if="post.coverImage" class="cover-image-container">
        <img :src="post.coverImage" :alt="post.title" />
      </figure>

      <div class="article-body" v-html="safeHtml"></div>

      <footer class="article-footer">
        <div class="tags">
          <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
        </div>
        <router-link to="/article" class="back-line">返回文章列表</router-link>
      </footer>

      <div class="article-actions">
        <button
          type="button"
          class="article-actions__btn"
          :class="{ 'article-actions__btn--liked': articleLiked }"
          @click="handleArticleLike"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          <span>{{ articleLikeCount }}</span>
        </button>
        <button
          type="button"
          class="article-actions__btn article-actions__btn--report"
          @click="showArticleReport = true"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          <span>举报文章</span>
        </button>
      </div>

      <ReportDialog
        v-if="showArticleReport"
        target-type="post"
        :target-id="post.id"
        @close="showArticleReport = false"
      />

      <CommentSection :post-id="post.id" />
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DOMPurify from 'dompurify'
import type { Post } from '@/types/post'
import { fetchPostBySlug, likePost } from '@/services/postService'
import { formatPostDate } from '@/features/post/utils/post'
import CommentSection from '@/components/comment/CommentSection.vue'
import ReportDialog from '@/components/comment/ReportDialog.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'

const route = useRoute()
const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const articleLiked = ref(false)
const articleLikeCount = ref(0)
const showArticleReport = ref(false)

function handleArticleLike() {
  const wasLiked = articleLiked.value
  articleLiked.value = !wasLiked
  articleLikeCount.value += wasLiked ? -1 : 1

  if (!wasLiked && post.value) {
    likePost(post.value.id).catch(() => {
      articleLiked.value = wasLiked
      articleLikeCount.value += wasLiked ? 1 : -1
    })
  }
}

const fallbackHtml = computed(() => {
  const excerpt = post.value?.excerpt ?? ''
  return `<h3>内容暂不可用</h3><p>${excerpt}</p>`
})

const safeHtml = computed(() => {
  const raw = post.value?.content ?? fallbackHtml.value
  return DOMPurify.sanitize(raw)
})

async function loadPostBySlug(slug: string) {
  if (!slug) {
    post.value = null
    error.value = '未找到文章'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const fetchedPost = await fetchPostBySlug(slug)
    if (!fetchedPost) {
      post.value = null
      error.value = '未找到文章'
      return
    }

    post.value = fetchedPost
    articleLikeCount.value = fetchedPost.likes ?? 0
    document.title = `${fetchedPost.title} - Sign 博客`
  } catch (err) {
    post.value = null
    error.value = err instanceof Error ? err.message : '加载文章失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.slug,
  (value) => {
    const slug = typeof value === 'string' ? value : ''
    void loadPostBySlug(slug)
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
}

.article-meta {
  margin-top: 1.5rem;

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
}

.cover-image-container {
  margin: 2rem 0;

  img {
    width: 100%;
    border-radius: 16px;
    border: 1px solid var(--line-soft);
  }
}

.article-content {
  line-height: 1.76;
  color: var(--ink-main);
  font-size: 1.02rem;
}

.article-body {
  p {
    margin-bottom: 1.3rem;
  }

  h2,
  h3 {
    font-weight: 800;
    color: var(--ink-strong);
    margin-top: 2rem;
    margin-bottom: 0.85rem;
    letter-spacing: -0.01em;
  }

  blockquote {
    margin: 1.8rem 0;
    padding: 1rem 1.2rem;
    border-left: 3px solid rgba(0, 113, 227, 0.42);
    background: rgba(0, 113, 227, 0.08);
    border-radius: 12px;
    color: var(--ink-main);
  }
}

.article-footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line-soft);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;

  .tags {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;

    .tag {
      border: 1px solid var(--line-soft);
      padding: 0.28rem 0.62rem;
      border-radius: 999px;
      color: var(--ink-muted);
      font-size: 0.8rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.9);
    }
  }

  .back-line {
    color: var(--brand-500);
    text-decoration: none;
    font-weight: 700;

    &:hover {
      text-decoration: none;
      opacity: 0.8;
    }
  }
}

.article-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
}

.article-actions__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink-muted);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.article-actions__btn:hover:enabled {
  color: var(--brand-500);
  border-color: rgba(0, 113, 227, 0.3);
  background: rgba(0, 113, 227, 0.04);
}

.article-actions__btn--liked {
  color: var(--brand-500);
  border-color: rgba(0, 113, 227, 0.3);
}


.article-actions__btn--report:hover {
  color: var(--danger-500);
  border-color: rgba(198, 40, 40, 0.3);
  background: var(--danger-bg);
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
