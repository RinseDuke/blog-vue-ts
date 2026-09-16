import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'
import { sortPostsByDateDesc } from '@/features/post/utils/post'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let hasLoaded = false
  let inflight: Promise<Post[]> | null = null

  function getErrorMessage(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback
  }

  async function fetchAndCachePosts() {
    try {
      const result = await fetchPosts()
      posts.value = result
      hasLoaded = true
      return posts.value
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to load posts')
      throw err
    } finally {
      loading.value = false
      inflight = null
    }
  }

  // 已加载则返回缓存；有飞行中请求则复用同一 Promise
  async function ensurePosts(options: { force?: boolean } = {}) {
    const { force = false } = options

    if (hasLoaded && !force) return posts.value
    if (inflight) return inflight

    loading.value = true
    error.value = null

    inflight = fetchAndCachePosts()

    return inflight
  }

  function refreshPosts() {
    return ensurePosts({ force: true })
  }

  const sortedPosts = computed(() => posts.value.slice().sort(sortPostsByDateDesc))

  return {
    posts,
    sortedPosts,
    loading,
    error,
    ensurePosts,
    refreshPosts,
  }
})
