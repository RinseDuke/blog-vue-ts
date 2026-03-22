/**
 * 搜索聚合 Composable
 * 组合搜索引擎 + 推荐文章 + 实时建议，为搜索框与搜索结果页提供数据。
 */

import { computed, type Ref } from 'vue'
import type { Post } from '@/types/post'
import { buildRecommendedPosts, sortPostsByDateDesc } from '@/features/post/utils/post'
import { usePostSearch } from '@/features/search/composables/usePostSearch'

/** 搜索配置选项 */
interface SearchBundleOptions {
  suggestionLimit?: number         // 建议结果数量上限
  includeAllWhenQueryEmpty?: boolean  // 查询为空时是否返回全部文章
  recommendation?: {               // 推荐文章配置
    poolMin?: number
    poolMax?: number
    take?: number
    randomize?: boolean
  }
}

export function usePostSearchBundle(posts: Ref<Post[]>, rawQuery: Ref<string>, options: SearchBundleOptions = {}) {
  const { suggestionLimit = 5, includeAllWhenQueryEmpty = true, recommendation } = options
  const { normalizedQuery, rankedByRelevance } = usePostSearch(posts, rawQuery)

  /** 搜索结果：查询为空时返回全部（按日期倒序），否则返回按相关性排序的结果 */
  const filteredPosts = computed(() => {
    if (!normalizedQuery.value) {
      return includeAllWhenQueryEmpty ? posts.value.slice().sort(sortPostsByDateDesc) : []
    }

    return rankedByRelevance.value.map((item) => item.post)
  })

  /** 搜索框下拉建议（取 Top N） */
  const suggestionPosts = computed(() => rankedByRelevance.value.slice(0, suggestionLimit).map((item) => item.post))

  /** 推荐文章（从阅读量 Top 池中随机抽取） */
  const recommendedPosts = computed(() => buildRecommendedPosts(posts.value, recommendation))

  return {
    normalizedQuery,
    rankedByRelevance,
    filteredPosts,
    suggestionPosts,
    recommendedPosts,
  }
}
