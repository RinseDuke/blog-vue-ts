import { computed, type Ref } from 'vue'
import type { Post } from '@/types/post'
import { rankPostsByRelevance } from '@/features/post/utils/post'

export function usePostSearch(posts: Ref<Post[]>, rawQuery: Ref<string>) {
  const normalizedQuery = computed(() => rawQuery.value.trim().toLowerCase())

  const rankedByRelevance = computed(() => {
    return rankPostsByRelevance(posts.value, normalizedQuery.value)
  })

  return {
    normalizedQuery,
    rankedByRelevance,
  }
}
