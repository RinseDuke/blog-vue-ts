import type { Comment } from '@/types/post'
import { requireAuthSession } from './authSession'
import { apiFetch, isMockMode, networkDelay } from './apiClient'

let nextMockId = 100

async function getMockComments() {
    if (!import.meta.env.DEV) return []
    const { mockComments } = await import('@/mocks/comments')
    return mockComments
}

export async function fetchCommentsByPostId(postId: string): Promise<Comment[]> {
  if (import.meta.env.DEV && isMockMode()) {
    await networkDelay()
    const mockComments = await getMockComments()
    return structuredClone(mockComments
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
  }

  return apiFetch<Comment[]>(`/posts/${postId}/comments`)
}

export interface CreateCommentPayload {
  postId: string
  content: string
  parentId?: string
}

export async function createComment(payload: CreateCommentPayload): Promise<Comment> {
  if (import.meta.env.DEV && isMockMode()) {
    await networkDelay(200)
    const session = requireAuthSession('请先登录后再发表评论')
    const mockComments = await getMockComments()

    const newComment: Comment = {
      id: `mock-c-${nextMockId++}`,
      postId: payload.postId,
      author: {
        id: session.user.id,
        name: session.user.username || '已登录用户',
        avatarUrl: 'https://i.pravatar.cc/150?img=68',
      },
      content: payload.content,
      createdAt: new Date().toISOString(),
      parentId: payload.parentId,
      likes: 0,
    }

    mockComments.push(newComment)
    return newComment
  }

  return apiFetch<Comment>(`/posts/${payload.postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function setCommentLike(commentId: string, liked: boolean): Promise<number> {
  if (import.meta.env.DEV && isMockMode()) {
    await networkDelay(100)
    requireAuthSession('请先登录后再点赞评论')
    const mockComments = await getMockComments()

    const comment = mockComments.find((c) => c.id === commentId)
    if (comment) {
      comment.likes = Math.max(0, (comment.likes ?? 0) + (liked ? 1 : -1))
      return comment.likes
    }
    return liked ? 1 : 0
  }

  const data = await apiFetch<{ likes: number }>(`/comments/${commentId}/like`, {
    method: liked ? 'POST' : 'DELETE',
  })
  return data.likes
}
