import type { Post } from '@/types/post'
import { mockPosts } from '@/mocks/posts'
import { apiFetch, isMockMode, networkDelay } from './apiClient'

export interface FetchPostsParams {
  limit?: number
  featuredOnly?: boolean
}

//获取文章
export async function fetchPosts(params: FetchPostsParams = {}): Promise<Post[]> {
  if (isMockMode()) {
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

  return apiFetch<Post[]>(`/posts?${searchParams.toString()}`)
}

export async function fetchPostBySlug(slug: string): Promise<Post | undefined> {
  if (isMockMode()) {
    await networkDelay()
    return mockPosts.find((post) => post.slug === slug)
  }

  try {
    return await apiFetch<Post>(`/posts/${slug}`)
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
      return undefined
    }
    throw err
  }
}

export async function likePost(postId: string): Promise<number> {
  if (isMockMode()) {
    await networkDelay(100)
    const post = mockPosts.find((p) => p.id === postId)
    if (post) {
      post.likes = (post.likes ?? 0) + 1
      return post.likes
    }
    return 1
  }

  const data = await apiFetch<{ likes: number }>(`/posts/${postId}/like`, {
    method: 'POST',
  })
  return data.likes
}
