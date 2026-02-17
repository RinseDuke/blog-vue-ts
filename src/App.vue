<script setup lang="ts">
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'

const route=useRoute()
const router = useRouter()
const searchQuery = ref('')
const isNavHidden=ref(false)
const posts = ref<Post[]>([])
const recommendedPosts = ref<Post[]>([])
const searchHistory = ref<string[]>([])
const showDropdown = ref(false)
const navInputEl = ref<HTMLInputElement | null>(null)
const navDropdownEl = ref<HTMLElement | null>(null)
const HISTORY_KEY = 'blog_search_history'
//isWritePage
const isWritePage=computed(()=> route.name==='write')
let lastScrollTop=0;
//监听器
watch(route,()=>{
  isNavHidden.value=false
  lastScrollTop=0
  showDropdown.value=false
})

const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase())

const rankedByRelevance = computed(() => {
  const query = normalizedQuery.value
  if (!query) return [] as { post: Post; score: number }[]

  return posts.value
    .map((post) => ({ post, score: relevanceScore(post, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || sortByDateDesc(a.post, b.post))
})

const suggestionPosts = computed(() => {
  const query = normalizedQuery.value
  if (!query) return recommendedPosts.value.slice(0, 5)
  return rankedByRelevance.value.slice(0, 5).map((item) => item.post)
})

watch(
  () => route.query.q,
  (value) => {
    searchQuery.value = (value as string) ?? ''
  }
)

watch(normalizedQuery, () => {
  showDropdown.value = true
})

const handleSearch = () => {
  const term = searchQuery.value.trim()
  if (!term) return
  persistHistory(term)
  showDropdown.value = false
  router.push({ path: '/search', query: { q: term } })
}

const hadndleScroll=(e: Event)=>{
  const target = e.target
  const scrollTop = target instanceof Document
    ? window.scrollY
    : target instanceof HTMLElement
      ? target.scrollTop
      : window.scrollY
  if(scrollTop<0) return;
  if(scrollTop>lastScrollTop && scrollTop>100 && isWritePage.value){
    isNavHidden.value=true
  }
  else if(scrollTop<lastScrollTop){
    isNavHidden.value=false
  }
  lastScrollTop = scrollTop
}

const selectSuggestion = (term: string) => {
  searchQuery.value = term
  handleSearch()
}

const openDropdown = () => {
  showDropdown.value = true
}

const handleOutsideClick = (event: MouseEvent) => {
  const target = event.target as Node
  const insideDropdown = navDropdownEl.value?.contains(target)
  const insideInput = navInputEl.value?.contains(target)
  if (!insideDropdown && !insideInput) {
    showDropdown.value = false
  }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      searchHistory.value = parsed.slice(0, 12)
    }
  } catch (err) {
    console.warn('无法读取搜索历史', err)
  }
}

function persistHistory(term: string) {
  const normalized = term.trim()
  if (!normalized) return
  const next = [normalized, ...searchHistory.value.filter((item) => item !== normalized)].slice(0, 12)
  searchHistory.value = next
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

function clearHistory() {
  searchHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
}

function refreshRecommendations() {
  const sortedByRead = posts.value.slice().sort((a, b) => b.readMinutes - a.readMinutes || sortByDateDesc(a, b))
  const topPool = sortedByRead.slice(0, Math.max(6, Math.min(12, sortedByRead.length)))
  const shuffled = topPool.sort(() => Math.random() - 0.5)
  recommendedPosts.value = shuffled.slice(0, Math.min(6, shuffled.length))
}

function relevanceScore(post: Post, query: string) {
  const title = post.title.toLowerCase()
  const excerpt = (post.excerpt ?? '').toLowerCase()
  const author = (post.author?.name ?? '').toLowerCase()
  const tags = post.tags.map((tag) => tag.toLowerCase())
  let score = 0

  if (title.includes(query)) score += 6
  if (excerpt.includes(query)) score += 3
  if (author.includes(query)) score += 2
  const tagHits = tags.reduce((total, tag) => (tag.includes(query) ? total + 3 : total), 0)
  score += tagHits

  const frequency = (title + ' ' + excerpt).split(query).length - 1
  score += frequency

  return score
}

function sortByDateDesc(a: Post, b: Post) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}


onMounted(async ()=>{
  window.addEventListener('scroll',hadndleScroll,true)
  document.addEventListener('click', handleOutsideClick)
  loadHistory()

  try {
    posts.value = await fetchPosts()
    refreshRecommendations()
  } catch (err) {
    console.warn('无法加载推荐文章', err)
  }
})

onUnmounted(()=>{
  window.removeEventListener('scroll',hadndleScroll,true)
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div class="layout">
    <header class="topbar" :class="{'hidden': isNavHidden}">
      <RouterLink to="/" class="brand">
        <img src="@/assets/logo.svg" alt="Blog Logo" />
        <span>Sign</span>
      </RouterLink>
      <div class="search-box">
        <div class="search-input-wrapper">
          <input 
            v-model="searchQuery"
            ref="navInputEl"
            type="text" 
            placeholder="搜索文章..." 
            autocomplete="off"
            @keyup.enter="handleSearch"
            @focus="openDropdown"
            @input="openDropdown"
          />
          <button class="search-btn" @click="handleSearch">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          <div v-show="showDropdown" ref="navDropdownEl" class="top-search__dropdown" role="listbox">
            <div class="top-dropdown__section">
              <div class="top-dropdown__header">
                <span>推荐阅读</span>
              </div>
              <ol class="top-hot-list">
                <li v-for="(post, index) in recommendedPosts" :key="post.id">
                  <button type="button" class="top-hot-list__item" @click="selectSuggestion(post.title)">
                    <span class="top-hot-list__rank" :data-top="index < 3">{{ index + 1 }}</span>
                    <div class="top-hot-list__text">
                      <span class="top-hot-list__title">{{ post.title }}</span>
                      <span class="top-hot-list__meta">{{ post.readMinutes }} 分钟读完</span>
                    </div>
                  </button>
                </li>
              </ol>
            </div>

            <div v-if="searchHistory.length" class="top-dropdown__section">
              <div class="top-dropdown__header">
                <span>搜索历史</span>
                <button type="button" class="top-link-btn" @click="clearHistory">清空</button>
              </div>
              <div class="top-history-list">
                <button
                  v-for="item in searchHistory"
                  :key="item"
                  type="button"
                  class="top-chip"
                  @click="selectSuggestion(item)"
                >
                  {{ item }}
                </button>
              </div>
            </div>

            <div v-if="normalizedQuery && suggestionPosts.length" class="top-dropdown__section">
              <div class="top-dropdown__header">
                <span>匹配结果</span>
                <span class="top-dropdown__hint">按相关度排序</span>
              </div>
              <ul class="top-suggestion-list">
                <li v-for="post in suggestionPosts" :key="post.id">
                  <button type="button" class="top-suggestion" @click="selectSuggestion(post.title)">
                    <span class="top-suggestion__title">{{ post.title }}</span>
                    <span class="top-suggestion__meta">{{ post.author.name }} · {{ new Date(post.publishedAt).toLocaleDateString('zh-CN') }}</span>
                  </button>
                </li>
              </ul>
            </div>

            <div v-else-if="normalizedQuery" class="top-dropdown__section top-dropdown__section--empty">
              <span>暂无匹配项，换个关键词试试</span>
            </div>
          </div>
        </div>
      </div>
      <nav class="navigation">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/article">文章</RouterLink>
        <RouterLink to="/write">写作</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
    </header>

    <main class="page">
      <RouterView />
    </main>

    <footer class="footer">
      <p>{{ new Date().getFullYear() }}</p>
    </footer>
  </div>
</template>

<style lang="less">
/* 布局 */
.layout {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  padding-top: 100px;

}

.page {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #0f172a;
  color: #e2e8f0;
  position: fixed;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid #1e293b;
  margin: 0;
  transition: transform 0.3s ease-in-out;
}

/*隐藏导航栏 */
.topbar.hidden {
  transform: translateY(-100px);
}

/* 图标标识 */
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1rem;

  img {
    width: 42px;
    height: 42px;
  }
}

/* 搜索框容器 */
.search-box {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  padding: 0 2rem;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
  display: flex;
  align-items: center;
}

// 搜索建议下拉框
.top-search__dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: #0b1729;
  border: 1px solid #1f2a3b;
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 30;
  max-height: 70vh;
  overflow-y: auto;
}

.top-dropdown__section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  &--empty {
    color: #94a3b8;
  }
}

.top-dropdown__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e2e8f0;
  font-weight: 700;
}

.top-dropdown__hint {
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
}

.top-hot-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.5rem;
}

.top-hot-list__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  border: 1px solid #1f2a3b;
  background: linear-gradient(135deg, #101b30 0%, #0f172a 100%);
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #3b82f6;
    box-shadow: 0 10px 26px rgba(59, 130, 246, 0.22);
  }
}

.top-hot-list__rank {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: #1e293b;
  color: #cbd5f5;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.top-hot-list__rank[data-top='true'] {
  background: #f87171;
  color: #fff;
}

.top-hot-list__text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.top-hot-list__title {
  color: #e2e8f0;
  font-weight: 700;
  line-height: 1.4;
}

.top-hot-list__meta {
  color: #94a3b8;
  font-size: 0.85rem;
}

.top-link-btn {
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  font-weight: 600;
  padding: 0;
}

.top-history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.top-chip {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #1f2a3b;
  background: #111c30;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #3b82f6;
    color: #bfdbfe;
    background: #0b1b32;
  }
}

.top-suggestion-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.top-suggestion {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid #1f2a3b;
  border-radius: 12px;
  background: #0f172a;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
  }
}

.top-suggestion__title {
  display: block;
  color: #e2e8f0;
  font-weight: 700;
  margin-bottom: 0.1rem;
}

.top-suggestion__meta {
  color: #94a3b8;
  font-size: 0.85rem;
}

/* 搜索框输入 */
.search-box input {
  width: 100%;
  padding: 0.5rem 2.8rem 0.5rem 1.2rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 999px;
  font-size: 0.9rem;
  color: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
}

.search-box input::placeholder {
  color: #64748b;
}

.search-box input:focus {
  border-color: #3b82f6;
  background: #0f172a;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 搜索按钮 */
.search-btn {
  position: absolute;
  right: 1rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.search-btn:hover {
  color: #3b82f6;
}

.navigation {
  display: flex;
  gap: 1.5rem;

  a {
    color: #cbd5f5;
    text-decoration: none;
    font-weight: 500;
    position: relative;
    padding: 0.25rem 0;

    &.router-link-active::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -0.35rem;
      width: 100%;
      height: 2px;
      background: #60a5fa;
    }

    &:hover {
      color: #fff;
    }
  }
}

.footer {
  padding: 1.25rem 2.5rem;
  text-align: center;
  color: #e2e8f0;
  background: #0f172a;
  border-top: 1px solid #1e293b;
}

@media (max-width: 768px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .search-box {
    padding: 0;
    width: 100%;
    order: 3;
  }

  .navigation {
    width: 100%;
    justify-content: space-around;
  }
}
</style>
