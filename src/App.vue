<script setup lang="ts">
import { useRoute, useRouter, RouterView } from 'vue-router'
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { usePostSearchBundle } from '@/features/search/composables/usePostSearchBundle'
import { useSearchHistory } from '@/features/search/composables/useSearchHistory'
import TopBrand from '@/components/navigation/TopBrand.vue'
import TopFooter from '@/components/navigation/TopFooter.vue'
import TopHeaderLayout from '@/components/navigation/TopHeaderLayout.vue'
import TopSearchBox from '@/components/search/TopSearchBox.vue'
import TopNavigation from '@/components/navigation/TopNavigation.vue'

const route = useRoute()
const router = useRouter()
const searchQuery = ref<string>((route.query.q as string) ?? '')
const isNavHidden = ref(false)

const isWritePage = computed(() => route.name === 'write')
let lastScrollTop = 0

const { posts, ensurePosts } = usePostsStore()
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
  searchQuery.value = term
  persistHistory(term)
  router.push({ path: '/search', query: { q: term } })
}

const handleScroll = (event: Event) => {
  const target = event.target
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
    <TopHeaderLayout :is-hidden="isNavHidden">
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
    </TopHeaderLayout>

    <main class="page">
      <RouterView />
    </main>

    <TopFooter />
  </div>
</template>

<style lang="less">

.layout {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding-top: 78px;
}

.page {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>


