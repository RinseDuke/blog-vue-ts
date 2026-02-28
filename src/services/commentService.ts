import type { Comment } from '@/types/post'
import { mockComments } from '@/mocks/comments'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const networkDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

let nextMockId = 100

export async function fetchCommentsByPostId(postId: string): Promise<Comment[]> {
    if (USE_MOCK || !API_BASE_URL) {
        await networkDelay()
        return mockComments
            .filter((c) => c.postId === postId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }

    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`)

    if (!response.ok) {
        throw new Error(`获取评论失败：${response.status}`)
    }

    return (await response.json()) as Comment[]
}

export interface CreateCommentPayload {
    postId: string
    content: string
    parentId?: string
}

export async function createComment(payload: CreateCommentPayload): Promise<Comment> {
    if (USE_MOCK || !API_BASE_URL) {
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

    const response = await fetch(`${API_BASE_URL}/posts/${payload.postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error(`提交评论失败：${response.status}`)
    }

    return (await response.json()) as Comment
}

export async function likeComment(commentId: string): Promise<number> {
    if (USE_MOCK || !API_BASE_URL) {
        await networkDelay(100)

        const comment = mockComments.find((c) => c.id === commentId)
        if (comment) {
            comment.likes = (comment.likes ?? 0) + 1
            return comment.likes
        }
        return 1
    }

    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, {
        method: 'POST',
    })

    if (!response.ok) {
        throw new Error(`点赞失败：${response.status}`)
    }

    const data = (await response.json()) as { likes: number }
    return data.likes
}
