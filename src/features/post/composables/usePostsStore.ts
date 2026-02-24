import { computed, ref } from 'vue'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'
import { sortPostsByDateDesc } from '@/features/post/utils/post'

const posts = ref<Post[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

let hasLoaded = false
let inflight: Promise<Post[]> | null = null

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

async function ensurePosts(options: { force?: boolean } = {}) {
  const { force = false } = options

  if (hasLoaded && !force) return posts.value
  if (inflight) return inflight

  loading.value = true
  error.value = null

  inflight = fetchPosts()
    .then((result) => {
      posts.value = result
      hasLoaded = true
      return posts.value
    })
    .catch((err: unknown) => {
      error.value = getErrorMessage(err, 'Failed to load posts')
      throw err
    })
    .finally(() => {
      loading.value = false
      inflight = null
    })

  return inflight
}

function refreshPosts() {
  return ensurePosts({ force: true })
}

const sortedPosts = computed(() => posts.value.slice().sort(sortPostsByDateDesc))

export function usePostsStore() {
  return {
    posts,
    sortedPosts,
    loading,
    error,
    ensurePosts,
    refreshPosts,
  }
}
