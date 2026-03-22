/**
 * 文章 Store
 * 管理全局文章列表，提供加载一次 + 并发请求去重机制。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'
import { sortPostsByDateDesc } from '@/features/post/utils/post'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let hasLoaded = false                          // 是否已加载过
  let inflight: Promise<Post[]> | null = null    // 当前飞行中的请求（去重复用）

  function getErrorMessage(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback
  }

  /**
   * 确保文章已加载
   * - 已加载过且非强制刷新 → 直接返回缓存
   * - 有飞行中的请求 → 复用同一个 Promise（并发去重）
   */
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

  /** 强制重新加载文章 */
  function refreshPosts() {
    return ensurePosts({ force: true })
  }

  /** 按发布日期倒序排列的计算属性 */
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
