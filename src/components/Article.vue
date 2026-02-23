<template>
  <div class="article-container">
    <div v-if="loading" class="status-message">Loading article...</div>
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
        <router-link to="/article" class="back-line">Back to articles</router-link>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DOMPurify from 'dompurify'
import type { Post } from '@/types/post'
import { fetchPostBySlug } from '@/services/postService'
import { formatPostDate } from '@/features/post/utils/post'

const route = useRoute()
const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const fallbackHtml = computed(() => {
  const excerpt = post.value?.excerpt ?? ''
  return `<h3>Content unavailable</h3><p>${excerpt}</p>`
})

const safeHtml = computed(() => {
  const raw = post.value?.content ?? fallbackHtml.value
  return DOMPurify.sanitize(raw)
})

async function loadPostBySlug(slug: string) {
  if (!slug) {
    post.value = null
    error.value = 'Article not found'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const fetchedPost = await fetchPostBySlug(slug)
    if (!fetchedPost) {
      post.value = null
      error.value = 'Article not found'
      return
    }

    post.value = fetchedPost
  } catch (err) {
    post.value = null
    error.value = err instanceof Error ? err.message : 'Failed to load article'
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
  font-family: 'Manrope', sans-serif;
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
  border-radius: 24px;
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

@media (max-width: 640px) {
  .article-container {
    padding: 0 0.7rem;
  }

  .article-content {
    border-radius: 18px;
  }
}
</style>
