/**
 * 文章搜索 Composable
 * 提供基于多维评分的实时搜索能力。
 */

import { computed, type Ref } from 'vue'
import type { Post } from '@/types/post'
import { rankPostsByRelevance } from '@/features/post/utils/post'

/** 核心搜索引擎：标准化查询 + 相关性排序 */
export function usePostSearch(posts: Ref<Post[]>, rawQuery: Ref<string>) {
  /** 去空格 + 小写的查询字符串 */
  const normalizedQuery = computed(() => rawQuery.value.trim().toLowerCase())

  /** 按相关性评分排序的搜索结果 */
  const rankedByRelevance = computed(() => {
    return rankPostsByRelevance(posts.value, normalizedQuery.value)
  })

  return {
    normalizedQuery,
    rankedByRelevance,
  }
}
