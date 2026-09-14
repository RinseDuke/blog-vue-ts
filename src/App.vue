<script setup lang="ts">
import { useRoute, useRouter, RouterView } from 'vue-router'
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { usePostSearchBundle } from '@/features/search/composables/usePostSearchBundle'
import { useSearchHistory } from '@/features/search/composables/useSearchHistory'
import { useScrollCondense } from '@/features/ui/composables/useScrollCondense'
import TopBrand from '@/components/navigation/TopBrand.vue'
import TopFooter from '@/components/navigation/TopFooter.vue'
import TopHeaderLayout from '@/components/navigation/TopHeaderLayout.vue'
import TopSearchBox from '@/components/search/TopSearchBox.vue'
import TopNavigation from '@/components/navigation/TopNavigation.vue'
import TopThemeToggle from '@/components/navigation/TopThemeToggle.vue'
import MobileTopTabs from '@/components/navigation/MobileTopTabs.vue'
import MobileSearchSheet from '@/components/search/MobileSearchSheet.vue'
import BackToTop from '@/components/ui/BackToTop.vue'

const route = useRoute()
const router = useRouter()
const searchQuery = ref<string>((route.query.q as string) ?? '')
const isNavHidden = ref(false)
const isMobileSearchOpen = ref(false)

const isWritePage = computed(() => route.name === 'write')
const isFocusPage = computed(() => ['write', 'login', 'register'].includes(String(route.name)))
let lastScrollTop = 0

const { isCondensed } = useScrollCondense()

const postsStore = usePostsStore()
const { posts } = storeToRefs(postsStore)
const { ensurePosts } = postsStore
const { searchHistory, loadHistory, persistHistory, clearHistory } = useSearchHistory()
const { normalizedQuery, suggestionPosts, recommendedPosts } = usePostSearchBundle(posts, searchQuery, {
  suggestionLimit: 5,
  includeAllWhenQueryEmpty: false,
  recommendation: {
    poolMin: 6,
    poolMax: 12,
    take: 6,
    randomize: true,
  },
})

watch(
  () => route.fullPath,
  () => {
    isNavHidden.value = false
    isMobileSearchOpen.value = false
    lastScrollTop = 0
  }
)

watch(
  () => route.query.q,
  (value) => {
    searchQuery.value = (value as string) ?? ''
  }
)

const handleSearch = (searchTerm: string) => {
  const term = searchTerm.trim()
  if (!term) return

  isMobileSearchOpen.value = false
  searchQuery.value = term
  persistHistory(term)
  router.push({ path: '/search', query: { q: term } })
}

const toggleMobileSearch = () => {
  isMobileSearchOpen.value = !isMobileSearchOpen.value
}

const closeMobileSearch = () => {
  isMobileSearchOpen.value = false
}

const handleScroll = (event: Event) => {
  const target = event.target
  if (isWritePage.value && isScrollFromWriteEditor(target)) return

  const scrollTop =
    target instanceof Document ? window.scrollY : target instanceof HTMLElement ? target.scrollTop : window.scrollY

  if (scrollTop < 0) return

  if (scrollTop > lastScrollTop && scrollTop > 100 && isWritePage.value) {
    isNavHidden.value = true
  } else if (scrollTop < lastScrollTop) {
    isNavHidden.value = false
  }

  lastScrollTop = scrollTop
}

const isScrollFromWriteEditor = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      '.write-page .editor-shell, .write-page .tiptap-editor, .write-page .source-editor-wrap, .write-page .read-preview'
    )
  )
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll, true)
  loadHistory()

  try {
    await ensurePosts()
  } catch (err) {
    console.warn('Unable to load recommended posts', err)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll, true)
})
</script>

<template>
  <div class="layout">
    <div id="scroll-condense-sentinel" style="position: absolute; top: 0; left: 0; width: 1px; height: 1px; pointer-events: none;" />

    <TopHeaderLayout :is-hidden="isNavHidden" :is-condensed="isCondensed">
      <div class="desktop-topbar">
        <TopBrand />
        <TopSearchBox
          v-model="searchQuery"
          :recommended-posts="recommendedPosts"
          :suggestion-posts="suggestionPosts"
          :search-history="searchHistory"
          :normalized-query="normalizedQuery"
          @search="handleSearch"
          @clear-history="clearHistory"
        />
        <TopNavigation />
        <TopThemeToggle />
      </div>

      <div class="mobile-topbar">
        <div class="mobile-topbar__main">
          <TopBrand />
          <div class="mobile-topbar__actions">
            <button
              type="button"
              class="mobile-search-trigger"
              :aria-expanded="isMobileSearchOpen"
              aria-label="打开搜索"
              @click="toggleMobileSearch"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <MobileTopTabs :search-open="isMobileSearchOpen" />
            <TopThemeToggle />
          </div>
        </div>

        <MobileSearchSheet
          :open="isMobileSearchOpen"
          :model-value="searchQuery"
          :recommended-posts="recommendedPosts"
          :suggestion-posts="suggestionPosts"
          :search-history="searchHistory"
          :normalized-query="normalizedQuery"
          @update:model-value="searchQuery = $event"
          @search="handleSearch"
          @clear-history="clearHistory"
          @close="closeMobileSearch"
        />
      </div>
    </TopHeaderLayout>

    <main class="page">
      <RouterView />
    </main>

    <TopFooter v-if="!isFocusPage" />
    <BackToTop />
  </div>
</template>

<style lang="less">
.layout {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding-top: 68px;
}

.page {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.desktop-topbar {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.72rem;
}

.mobile-topbar {
  display: none;
  width: 100%;
  flex-direction: column;
  gap: 0.4rem;
}

.mobile-topbar__main {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.mobile-topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.42rem;
  margin-left: auto;
}

.mobile-search-trigger {
  width: 38px;
  height: 38px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  color: var(--ink-main);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

@media (max-width: 768px) {
  .layout {
    padding-top: 52px;
  }

  .desktop-topbar {
    display: none;
  }

  .mobile-topbar {
    display: flex;
  }

  .mobile-topbar__actions .theme-switch {
    margin-left: 0;
    order: initial;
  }
}

@media (min-width: 769px) {
  .mobile-topbar {
    display: none;
  }
}
</style>
