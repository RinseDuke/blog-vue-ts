import type { Comment } from '@/types/post'
import { mockComments } from '@/mocks/comments'
import { readStoredAuthSession } from '@/features/auth/stores/useAuthStore'
import { apiFetch, isMockMode, networkDelay } from './apiClient'

let nextMockId = 100

function requireAuthSession(errorMessage: string) {
    const session = readStoredAuthSession()
    if (!session) {
        throw new Error(errorMessage)
    }

    return session
}

export async function fetchCommentsByPostId(postId: string): Promise<Comment[]> {
    if (isMockMode()) {
        await networkDelay()
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
    if (isMockMode()) {
        await networkDelay(200)
        const session = requireAuthSession('请先登录后再发表评论')

        const authorName = session.email.split('@')[0] || '已登录用户'

        const newComment: Comment = {
            id: `mock-c-${nextMockId++}`,
            postId: payload.postId,
            author: {
                id: `user-${session.email}`,
                name: authorName,
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
    if (isMockMode()) {
        await networkDelay(100)
        requireAuthSession('请先登录后再点赞评论')

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
