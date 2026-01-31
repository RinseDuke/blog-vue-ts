import type { Post } from '@/types/post'
import { mockPosts } from '@/mocks/posts'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const networkDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export interface FetchPostsParams {
  limit?: number
  featuredOnly?: boolean
}

//获取文章
export async function fetchPosts(params: FetchPostsParams = {}): Promise<Post[]> {
  if (USE_MOCK || !API_BASE_URL) {
    await networkDelay()
    let result = [...mockPosts]

    if (params.featuredOnly) {
      result = result.filter((post) => post.featured)
    }

    if (params.limit) {
      result = result.slice(0, params.limit)
    }

    return result
  }

  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.append('limit', String(params.limit))
  if (params.featuredOnly) searchParams.append('featured', 'true')

  const response = await fetch(`${API_BASE_URL}/posts?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error(`获取文章列表失败：${response.status}`)
  }

  return (await response.json()) as Post[]
}

export async function fetchPostBySlug(slug: string): Promise<Post | undefined> {
  if (USE_MOCK || !API_BASE_URL) {
    await networkDelay()
    return mockPosts.find((post) => post.slug === slug)
  }

  const response = await fetch(`${API_BASE_URL}/posts/${slug}`)

  if (!response.ok) {
    if (response.status === 404) return undefined
    throw new Error(`获取文章失败：${response.status}`)
  }

  return (await response.json()) as Post
}
