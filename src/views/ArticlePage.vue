<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'
import Article from '@/components/Article.vue'

const route = useRoute()
const loading = ref(true)
const error = ref<string | null>(null)
const posts = ref<Post[]>([])
const selectedTag = ref<string>('all')

const hasSlug = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug.trim().length > 0
})

const sortedPosts = computed(() => posts.value.slice().sort(sortByDateDesc))

const allTags = computed(() => {
  const tagSet = new Set<string>()
  posts.value.forEach((post) => {
    post.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
})

const filteredPosts = computed(() => {
  if (selectedTag.value === 'all') return sortedPosts.value
  return sortedPosts.value.filter((post) => post.tags.includes(selectedTag.value))
})

const displayCount = computed(() => filteredPosts.value.length)

async function loadPosts() {
  loading.value = true
  error.value = null
  try {
    posts.value = await fetchPosts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载文章失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!hasSlug.value) {
    void loadPosts()
  }
})

watch(hasSlug, (value) => {
  if (!value && posts.value.length === 0) {
    void loadPosts()
  }
})

function selectTag(tag: string) {
  selectedTag.value = tag
}

function sortByDateDesc(a: Post, b: Post) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateIso))
}
</script>

<template>
  <section v-if="hasSlug" class="article-detail">
    <Article />
  </section>

  <section v-else class="article-page">
    <header class="article-page__hero">
      <p class="article-page__eyebrow">文章</p>
      <h1>全部文章</h1>
      <p class="article-page__hint">浏览所有文章，并按标签筛选。</p>
    </header>

    <section class="filter">
      <div class="filter__tags">
        <button
          type="button"
          class="tag-chip"
          :class="{ 'tag-chip--active': selectedTag === 'all' }"
          @click="selectTag('all')"
        >
          全部
        </button>
        <button
          v-for="tag in allTags"
          :key="tag"
          type="button"
          class="tag-chip"
          :class="{ 'tag-chip--active': selectedTag === tag }"
          @click="selectTag(tag)"
        >
          #{{ tag }}
        </button>
      </div>
      <p class="filter__meta">
        共 {{ displayCount }} 篇
        <span v-if="selectedTag !== 'all'">，当前标签：{{ selectedTag }}</span>
      </p>
    </section>

    <section class="feed" aria-live="polite">
      <div v-if="loading" class="feed__state">加载中...</div>
      <div v-else-if="error" class="feed__state feed__state--error">{{ error }}</div>

      <div v-else>
        <div v-if="!filteredPosts.length" class="feed__state feed__state--empty">
          暂无匹配的文章，请切换标签再试。
        </div>

        <div v-else class="feed__grid feed__grid--list">
          <article v-for="post in filteredPosts" :key="post.id" class="post-card post-card--list">
            <router-link :to="`/article/${post.slug}`" class="card-link-wrapper">
              <img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" class="post-card__cover" />

              <div class="post-card__body">
                <div class="post-card__meta">
                  <span class="post-card__date">{{ formatDate(post.publishedAt) }}</span>
                  <span class="post-card__dot" aria-hidden="true">·</span>
                  <span>{{ post.readMinutes }} 分钟读完</span>
                </div>

                <h3>{{ post.title }}</h3>
                <p class="post-card__excerpt">{{ post.excerpt }}</p>

                <div class="post-card__footer">
                  <div class="author">
                    <img v-if="post.author.avatarUrl" :src="post.author.avatarUrl" :alt="post.author.name" />
                    <span>{{ post.author.name }}</span>
                  </div>

                  <div class="tags">
                    <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
                  </div>
                </div>
              </div>
            </router-link>
          </article>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped lang="less">
.article-page {
  width: 100%;
  padding: 80px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.article-page__hero {
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  h1 {
    margin: 0;
    font-size: clamp(2rem, 3.4vw, 2.6rem);
    color: #0f172a;
  }
}

.article-page__eyebrow {
  margin: 0;
  color: #2563eb;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.article-page__hint {
  margin: 0;
  color: #475569;
}

.filter {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.tag-chip {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #0f172a;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.15s ease;

  &:hover {
    border-color: #2563eb;
    color: #2563eb;
  }
}

.tag-chip--active {
  border-color: transparent;
  background: #2563eb;
  color: #fff;
}

.filter__meta {
  margin: 0;
  color: #475569;
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;

  &__state {
    padding: 2rem;
    text-align: center;
    border-radius: 16px;
    background: #f1f5f9;
    color: #475569;

    &--error {
      background: #fee2e2;
      color: #b91c1c;
    }

    &--empty {
      background: #eef2ff;
      color: #4338ca;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

.card-link-wrapper {
  text-decoration: none;
  color: inherit;
  display: contents;
}

.post-card {
  display: flex;
  flex-direction: row;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  }

  &__cover {
    width: 320px;
    height: auto;
    flex-shrink: 0;
    object-fit: cover;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1.4rem;
    flex: 1;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #64748b;
    font-size: 0.9rem;
  }

  &__dot {
    opacity: 0.6;
  }

  h3 {
    margin: 0;
    font-size: 1.35rem;
    color: #0f172a;
  }

  &__excerpt {
    margin: 0;
    color: #475569;
    line-height: 1.6;
    flex-grow: 1;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
}

.author {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .tag {
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 0.85rem;
  }
}

@media (max-width: 900px) {
  .post-card {
    flex-direction: column;

    &__cover {
      width: 100%;
      height: 200px;
    }
  }
}
</style>
