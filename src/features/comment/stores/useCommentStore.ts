import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Comment } from '@/types/post'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import {
    fetchCommentsByPostId,
    createComment,
    setCommentLike as setCommentLikeApi,
    type CreateCommentPayload,
} from '@/services/commentService'

export const useCommentStore = defineStore('comments', () => {
    const authStore = useAuthStore()
    const commentsByPost = ref<Record<string, Comment[]>>({})
    const loadingByPost = ref<Record<string, boolean>>({})
    const errorByPost = ref<Record<string, string | null>>({})
    const requestVersionByPost: Record<string, number> = {}
    const loading = computed(() => Object.values(loadingByPost.value).some(Boolean))
    const error = ref<string | null>(null)
    const submitting = ref(false)
    const likedCommentIds = ref<Set<string>>(new Set())

    async function loadComments(postId: string) {
        const requestVersion = (requestVersionByPost[postId] ?? 0) + 1
        requestVersionByPost[postId] = requestVersion
        loadingByPost.value[postId] = true
        errorByPost.value[postId] = null

        try {
            const comments = await fetchCommentsByPostId(postId)
            if (requestVersionByPost[postId] === requestVersion) {
                commentsByPost.value[postId] = comments
            }
        } catch (err: unknown) {
            if (requestVersionByPost[postId] === requestVersion) {
                errorByPost.value[postId] = err instanceof Error ? err.message : 'Failed to load comments'
            }
        } finally {
            if (requestVersionByPost[postId] === requestVersion) {
                loadingByPost.value[postId] = false
            }
        }
    }

    async function addComment(payload: CreateCommentPayload) {
        submitting.value = true
        error.value = null

        try {
            const newComment = await createComment(payload)
            const existing = commentsByPost.value[payload.postId] ?? []
            commentsByPost.value[payload.postId] = [...existing, newComment]
            return newComment
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Failed to submit comment'
            throw err
        } finally {
            submitting.value = false
        }
    }

    // 乐观更新：先更新 UI，失败时回滚
    async function likeComment(postId: string, commentId: string) {
        if (!authStore.isLoggedIn) {
            const authError = new Error('请先登录后再点赞评论')
            error.value = authError.message
            throw authError
        }

        error.value = null
        const wasLiked = likedCommentIds.value.has(commentId)
        const delta = wasLiked ? -1 : 1

        if (wasLiked) {
            likedCommentIds.value.delete(commentId)
        } else {
            likedCommentIds.value.add(commentId)
        }

        const comments = commentsByPost.value[postId]
        if (comments) {
            const target = comments.find((c) => c.id === commentId)
            if (target) {
                target.likes = Math.max(0, (target.likes ?? 0) + delta)
            }
        }

        try {
            const serverLikes = await setCommentLikeApi(commentId, !wasLiked)
            const target = comments?.find((c) => c.id === commentId)
            if (target) {
                target.likes = serverLikes
            }
        } catch (err: unknown) {
            if (wasLiked) {
                likedCommentIds.value.add(commentId)
            } else {
                likedCommentIds.value.delete(commentId)
            }
            const target = comments?.find((c) => c.id === commentId)
            if (target) {
                target.likes = Math.max(0, (target.likes ?? 0) - delta)
            }
            error.value = err instanceof Error ? err.message : 'Failed to update comment like'
            throw err
        }
    }

    function isCommentLiked(commentId: string): boolean {
        return likedCommentIds.value.has(commentId)
    }

    function getComments(postId: string): Comment[] {
        return commentsByPost.value[postId] ?? []
    }

    function isLoading(postId: string): boolean {
        return loadingByPost.value[postId] ?? false
    }

    function getError(postId: string): string | null {
        return errorByPost.value[postId] ?? null
    }

    return {
        commentsByPost,
        loadingByPost,
        errorByPost,
        loading,
        error,
        submitting,
        likedCommentIds,
        loadComments,
        addComment,
        likeComment,
        isCommentLiked,
        getComments,
        isLoading,
        getError,
    }
})
