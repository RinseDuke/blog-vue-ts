import { computed, type Ref } from 'vue'
import type { Post } from '@/types/post'
import { buildRecommendedPosts, sortPostsByDateDesc } from '@/features/post/utils/post'
import { usePostSearch } from '@/features/search/composables/usePostSearch'

interface SearchBundleOptions {
  suggestionLimit?: number
  includeAllWhenQueryEmpty?: boolean
  recommendation?: {
    poolMin?: number
    poolMax?: number
    take?: number
    randomize?: boolean
  }
}

export function usePostSearchBundle(posts: Ref<Post[]>, rawQuery: Ref<string>, options: SearchBundleOptions = {}) {
  const { suggestionLimit = 5, includeAllWhenQueryEmpty = true, recommendation } = options
  const { normalizedQuery, rankedByRelevance } = usePostSearch(posts, rawQuery)

  const filteredPosts = computed(() => {
    if (!normalizedQuery.value) {
      return includeAllWhenQueryEmpty ? posts.value.slice().sort(sortPostsByDateDesc) : []
    }

    return rankedByRelevance.value.map((item) => item.post)
  })

  const suggestionPosts = computed(() => rankedByRelevance.value.slice(0, suggestionLimit).map((item) => item.post))

  const recommendedPosts = computed(() => buildRecommendedPosts(posts.value, recommendation))

  return {
    normalizedQuery,
    rankedByRelevance,
    filteredPosts,
    suggestionPosts,
    recommendedPosts,
  }
}
