<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import DOMPurify from 'dompurify'
import type { Post } from '@/types/post'
import { fetchPostById, setPostLike } from '@/services/postService'
import { formatPostDate } from '@/features/post/utils/post'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import CommentSection from '@/components/comment/CommentSection.vue'
import CommunityLayout from '@/components/community/CommunityLayout.vue'
import ArticleContextRail from '@/components/article/ArticleContextRail.vue'
import ReadingProgress from '@/components/article/ReadingProgress.vue'
import MarkdownPreview from '@/components/post/MarkdownPreview.vue'
import { useReadingProgress } from '@/features/article/composables/useReadingProgress'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isLoggedIn } = storeToRefs(authStore)

const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isLiked = ref(false)
const isUpdatingLike = ref(false)
const isBookmarked = ref(false)
const shareLabel = ref('分享')
const { progress } = useReadingProgress()

type ArticleSourcePost = Post & {
  html_content?: string
  htmlContent?: string
  markdown?: string
}

const HTML_BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'caption',
  'dd',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'body',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'html',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
])
const HTML_INLINE_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'br',
  'cite',
  'code',
  'del',
  'em',
  'i',
  'img',
  'input',
  'kbd',
  'label',
  'mark',
  'q',
  's',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'wbr',
])
const HTML_VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'wbr'])
const historicalHtmlPattern = /^\s*<([a-z][\w:-]*)\b[^>]*>/iu

function isHistoricalHtml(source: string) {
  const openingTag = historicalHtmlPattern.exec(source)
  if (!openingTag) return false

  const tagName = openingTag[1].toLowerCase()
  if (HTML_BLOCK_TAGS.has(tagName) || HTML_VOID_TAGS.has(tagName)) return true
  if (!HTML_INLINE_TAGS.has(tagName)) return false

  return new RegExp(`</${tagName}\\s*>`, 'iu').test(source)
}

function getArticleSource(value: Post | null) {
  const source = value as ArticleSourcePost | null
  const candidates = [source?.markdown, source?.content, source?.html_content, source?.htmlContent]
  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0) ?? ''
}

function normalizeHeadingText(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/`([^`]+)`/gu, '$1')
    .replace(/[*_~]/gu, '')
    .replace(/<[^>]+>/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()
}

function stripLeadingMarkdownTitle(source: string, title: string) {
  const atxHeading = /^\s{0,3}#{1,6}[ \t]+([^\r\n]+)(?:\r?\n|$)/u.exec(source)
  if (atxHeading) {
    const headingText = atxHeading[1].replace(/[ \t]+#+[ \t]*$/u, '')
    if (normalizeHeadingText(headingText) === normalizeHeadingText(title)) {
      return source.slice(atxHeading[0].length)
    }
  }

  const setextHeading = /^\s{0,3}([^\r\n]+)\r?\n[ \t]*(?:=+|-+)[ \t]*(?:\r?\n|$)/u.exec(source)
  if (setextHeading && normalizeHeadingText(setextHeading[1]) === normalizeHeadingText(title)) {
    return source.slice(setextHeading[0].length)
  }

  return source
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/gu, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      "'": '&#39;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;',
    }
    return entities[character] ?? character
  })
}

const rawContent = computed(() => getArticleSource(post.value))
const contentMode = computed<'empty' | 'html' | 'markdown'>(() => {
  if (!rawContent.value.trim()) return 'empty'
  return isHistoricalHtml(rawContent.value) ? 'html' : 'markdown'
})

const markdownSource = computed(() => {
  if (!post.value || contentMode.value !== 'markdown') return ''
  return stripLeadingMarkdownTitle(rawContent.value, post.value.title)
})

const fallbackHtml = computed(() => {
  const excerpt = escapeHtml(post.value?.excerpt ?? '')
  return '<h3>内容暂不可用</h3><p>' + excerpt + '</p>'
})

function stripLeadingTitle(html: string, title: string) {
  const match = /^\s*<h([12])[^>]*>([\s\S]*?)<\/h\1>/i.exec(html)
  if (!match) return html

  const headingText = match[2].replace(/<[^>]+>/g, '').trim()
  if (headingText !== title.trim()) return html

  return html.slice(match.index + match[0].length)
}

const safeHtml = computed(() => {
  if (contentMode.value !== 'html' || !post.value) {
    return DOMPurify.sanitize(fallbackHtml.value)
  }

  const deduped = stripLeadingTitle(rawContent.value, post.value.title)
  return DOMPurify.sanitize(deduped)
})

const likeCount = computed(() => post.value?.likes ?? 0)
const authorInitial = computed(() => post.value?.author.name.trim().slice(0, 1) || '墨')

async function loadPostById(id: string) {
  if (!id) {
    post.value = null
    error.value = '未找到主题'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const fetchedPost = await fetchPostById(id)
    if (!fetchedPost) {
      post.value = null
      error.value = '未找到主题'
      return
    }

    post.value = fetchedPost
    isLiked.value = false
    isBookmarked.value = false
    document.title = fetchedPost.title + ' · 墨言'
  } catch (err) {
    post.value = null
    error.value = err instanceof Error ? err.message : '加载主题失败'
  } finally {
    loading.value = false
  }
}

async function handleLike() {
  if (!post.value || isUpdatingLike.value) return
  if (!isLoggedIn.value) {
    await router.push({ name: 'about', query: { redirect: route.fullPath } })
    return
  }

  isUpdatingLike.value = true
  const nextLiked = !isLiked.value
  try {
    post.value.likes = await setPostLike(post.value.id, nextLiked)
    isLiked.value = nextLiked
  } finally {
    isUpdatingLike.value = false
  }
}

function scrollToReplies() {
  document.querySelector('#topic-replies')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function sharePost() {
  if (!post.value) return

  if (navigator.share) {
    await navigator.share({ title: post.value.title, url: window.location.href })
    return
  }

  await navigator.clipboard?.writeText(window.location.href)
  shareLabel.value = '已复制'
  window.setTimeout(() => {
    shareLabel.value = '分享'
  }, 1600)
}

watch(
  () => route.params.id,
  (value) => {
    const id = typeof value === 'string' ? value : ''
    void loadPostById(id)
  },
  { immediate: true }
)
</script>

<template>
  <ReadingProgress :progress="progress" />
  <CommunityLayout compact>
    <div v-if="loading" class="topic-loading">
      <SkeletonLoader variant="article-detail" />
    </div>
    <div v-else-if="error" class="topic-message topic-message--error">{{ error }}</div>

    <template v-else-if="post">
      <article class="topic-first-post">
        <aside class="topic-author">
          <span class="topic-author__avatar" aria-hidden="true">
            <img v-if="post.author.avatarUrl" :src="post.author.avatarUrl" alt="" />
            <b v-else>{{ authorInitial }}</b>
          </span>
          <strong>{{ post.author.name }}</strong>
          <small>主题作者</small>
        </aside>

        <div class="topic-content">
          <header class="topic-content__header">
            <div class="topic-content__labels">
              <span v-if="post.featured" class="topic-content__official">官方</span>
              <span v-for="tag in post.tags" :key="tag" class="topic-content__tag">{{ tag }}</span>
            </div>
            <h1>{{ post.title }}</h1>
            <p v-if="post.excerpt" class="topic-content__excerpt">{{ post.excerpt }}</p>
            <p class="topic-content__meta">
              {{ formatPostDate(post.publishedAt) }} · {{ post.readMinutes }} 分钟阅读
            </p>
          </header>

          <div class="article-body">
            <MarkdownPreview v-if="contentMode === 'markdown'" :source="markdownSource" />
            <div v-else v-html="safeHtml"></div>
          </div>

          <footer class="topic-actions" aria-label="主题操作">
            <button
              type="button"
              :class="{ 'is-active': isLiked }"
              :aria-pressed="isLiked"
              :disabled="isUpdatingLike"
              @click="handleLike"
            >
              赞 <span v-if="likeCount">{{ likeCount }}</span>
            </button>
            <button type="button" @click="scrollToReplies">回复</button>
            <button
              type="button"
              :class="{ 'is-active': isBookmarked }"
              :aria-pressed="isBookmarked"
              @click="isBookmarked = !isBookmarked"
            >
              {{ isBookmarked ? '已收藏' : '收藏' }}
            </button>
            <button type="button" @click="sharePost">{{ shareLabel }}</button>
          </footer>
        </div>
      </article>

      <section id="topic-replies" class="topic-replies">
        <CommentSection :post-id="post.id" />
      </section>
    </template>

    <template v-if="post" #context>
      <ArticleContextRail :post="post" />
    </template>
  </CommunityLayout>
</template>

<style scoped lang="less">
.topic-loading,
.topic-message {
  min-height: 420px;
  padding: 2rem;
}

.topic-message {
  display: grid;
  place-content: center;
  color: var(--ink-muted);
  text-align: center;
}

.topic-message--error {
  color: var(--danger-500);
}

.topic-first-post {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  min-height: 520px;
}

.topic-author {
  padding: 1.5rem 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1px solid var(--line-soft);
  background: color-mix(in srgb, var(--bg-canvas-soft) 72%, var(--surface-strong));
  text-align: center;
}

.topic-author__avatar {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 15px;
  background: var(--surface-hover);
  color: var(--ink-strong);
}

.topic-author__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.topic-author__avatar b {
  font-size: 1rem;
}

.topic-author strong {
  margin-top: 0.65rem;
  color: var(--ink-strong);
  font-size: 0.78rem;
  line-height: 1.3;
}

.topic-author small {
  margin-top: 0.2rem;
  color: var(--ink-muted);
  font-size: 0.66rem;
}

.topic-content {
  min-width: 0;
  padding: 2rem clamp(1.25rem, 4vw, 3rem) 1.4rem;
}

.topic-content__header {
  max-width: 720px;
  margin: 0 auto 2.4rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--line-soft);
}

.topic-content__labels {
  min-height: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.topic-content__official,
.topic-content__tag {
  padding: 0.22rem 0.5rem;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 650;
}

.topic-content__official {
  background: var(--brand-100);
  color: var(--brand-500);
}

.topic-content__tag {
  background: var(--bg-canvas);
  color: var(--ink-muted);
}

.topic-content h1 {
  margin: 0;
  color: var(--ink-strong);
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  font-weight: 730;
  line-height: 1.18;
}

.topic-content__excerpt {
  margin: 0.9rem 0 0;
  color: var(--ink-muted);
  font-size: 1rem;
  line-height: 1.65;
}

.topic-content__meta {
  margin: 0.85rem 0 0;
  color: var(--ink-muted);
  font-size: 0.74rem;
}

.article-body {
  max-width: 720px;
  margin: 0 auto;
  color: var(--article-prose-text);
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.82;
}

.article-body :deep(p) {
  margin: 0 0 1.45em;
}

.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3) {
  color: var(--article-prose-heading);
  font-family: var(--font-display);
  scroll-margin-top: 90px;
}

.article-body :deep(h1) {
  margin: 2.5rem 0 1rem;
  font-size: 1.8rem;
}

.article-body :deep(h2) {
  margin: 2.3rem 0 0.85rem;
  font-size: 1.45rem;
}

.article-body :deep(h3) {
  margin: 1.9rem 0 0.7rem;
  font-size: 1.18rem;
}

.article-body :deep(blockquote) {
  margin: 1.6rem 0;
  padding: 0.8rem 1rem;
  border-left: 3px solid var(--brand-500);
  background: var(--bg-canvas-soft);
  color: var(--ink-main);
}

.article-body :deep(code) {
  padding: 0.18em 0.38em;
  border-radius: 5px;
  background: var(--article-code-bg);
  color: var(--article-inline-code-text);
  font-family: var(--font-mono);
  font-size: 0.88em;
}

.article-body :deep(pre) {
  margin: 1.5rem 0;
  padding: 1rem;
  overflow-x: auto;
  border-radius: var(--radius-md);
  background: var(--article-code-block-bg);
  color: var(--article-code-block-text);
  font-family: var(--font-mono);
  font-size: 1em;
}

.article-body :deep(pre code) {
  padding: 0;
  background: transparent;
  color: var(--article-code-block-text);
}

.article-body :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 1.5rem auto;
  border-radius: var(--radius-md);
}

.topic-actions {
  max-width: 720px;
  margin: 2.5rem auto 0;
  padding-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  border-top: 1px solid var(--line-soft);
}

.topic-actions button {
  min-height: 34px;
  padding: 0 0.72rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  color: var(--ink-muted);
  font-size: 0.75rem;
  font-weight: 620;
  cursor: pointer;
}

.topic-actions button:hover,
.topic-actions button.is-active {
  border-color: color-mix(in srgb, var(--brand-500) 35%, var(--line-soft));
  background: var(--brand-100);
  color: var(--brand-500);
}

.topic-actions button:disabled {
  opacity: 0.55;
  cursor: wait;
}

.topic-replies {
  border-top: 12px solid var(--bg-canvas);
}

@media (max-width: 800px) {
  .topic-first-post {
    display: block;
  }

  .topic-author {
    padding: 0.9rem 1rem;
    flex-direction: row;
    justify-content: flex-start;
    gap: 0.55rem;
    border-right: 0;
    border-bottom: 1px solid var(--line-soft);
    text-align: left;
  }

  .topic-author__avatar {
    width: 38px;
    height: 38px;
    border-radius: 12px;
  }

  .topic-author strong {
    margin-top: 0;
  }

  .topic-author small {
    margin-left: auto;
  }

  .topic-content {
    padding: 1.35rem 1rem 1rem;
  }

  .topic-content__header {
    margin-bottom: 1.8rem;
  }

  .article-body {
    font-size: 16px;
  }
}
</style>
