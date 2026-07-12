import { ref } from 'vue'
import type { Post } from '@/types/post'
import { fetchPosts, type FetchPostsParams } from '@/services/postService'

type PostLoader = (params: FetchPostsParams) => Promise<Post[]>

export function useAuthorProfile(loadPosts: PostLoader = fetchPosts) {
  const author = ref<Post['author'] | null>(null)
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let activeRequestId = 0
  let currentAuthorId = ''

  async function load(authorId: string) {
    currentAuthorId = authorId
    const requestId = ++activeRequestId
    loading.value = true
    error.value = null
    author.value = null
    posts.value = []

    if (!authorId) {
      loading.value = false
      return
    }

    try {
      const fetchedPosts = await loadPosts({ authorId })
      if (requestId !== activeRequestId) return

      posts.value = fetchedPosts
      author.value = fetchedPosts[0]?.author ?? null
    } catch (err) {
      if (requestId !== activeRequestId) return
      error.value = err instanceof Error ? err.message : '加载作者信息失败'
    } finally {
      if (requestId === activeRequestId) {
        loading.value = false
      }
    }
  }

  async function retry() {
    await load(currentAuthorId)
  }

  return { author, posts, loading, error, load, retry }
}
