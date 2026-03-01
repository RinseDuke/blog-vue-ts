import type { Comment } from '@/types/post'
import { mockComments } from '@/mocks/comments'
import { apiFetch, isMockMode, networkDelay } from './apiClient'

let nextMockId = 100

export async function fetchCommentsByPostId(postId: string): Promise<Comment[]> {
    if (isMockMode()) {
        await networkDelay()
        return mockComments
            .filter((c) => c.postId === postId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
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

        const newComment: Comment = {
            id: `mock-c-${nextMockId++}`,
            postId: payload.postId,
            author: {
                id: 'current-user',
                name: '当前用户',
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

export async function likeComment(commentId: string): Promise<number> {
    if (isMockMode()) {
        await networkDelay(100)

        const comment = mockComments.find((c) => c.id === commentId)
        if (comment) {
            comment.likes = (comment.likes ?? 0) + 1
            return comment.likes
        }
        return 1
    }

    const data = await apiFetch<{ likes: number }>(`/comments/${commentId}/like`, {
        method: 'POST',
    })
    return data.likes
}
