import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Comment } from '@/types/post'
import {
    fetchCommentsByPostId,
    createComment,
    likeComment as likeCommentApi,
    type CreateCommentPayload,
} from '@/services/commentService'

export const useCommentStore = defineStore('comments', () => {
    const commentsByPost = ref<Record<string, Comment[]>>({})
    const loading = ref(false)
    const error = ref<string | null>(null)
    const submitting = ref(false)
    const likedCommentIds = ref<Set<string>>(new Set())

    async function loadComments(postId: string) {
        loading.value = true
        error.value = null

        try {
            const comments = await fetchCommentsByPostId(postId)
            commentsByPost.value[postId] = comments
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Failed to load comments'
        } finally {
            loading.value = false
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

    async function likeComment(postId: string, commentId: string) {
        const wasLiked = likedCommentIds.value.has(commentId)
        const delta = wasLiked ? -1 : 1

        // Toggle liked state
        if (wasLiked) {
            likedCommentIds.value.delete(commentId)
        } else {
            likedCommentIds.value.add(commentId)
        }

        // Optimistic update
        const comments = commentsByPost.value[postId]
        if (comments) {
            const target = comments.find((c) => c.id === commentId)
            if (target) {
                target.likes = Math.max(0, (target.likes ?? 0) + delta)
            }
        }

        try {
            await likeCommentApi(commentId)
        } catch {
            // Rollback on failure
            if (wasLiked) {
                likedCommentIds.value.add(commentId)
            } else {
                likedCommentIds.value.delete(commentId)
            }
            const target = comments?.find((c) => c.id === commentId)
            if (target) {
                target.likes = Math.max(0, (target.likes ?? 0) - delta)
            }
        }
    }

    function isCommentLiked(commentId: string): boolean {
        return likedCommentIds.value.has(commentId)
    }

    function getComments(postId: string): Comment[] {
        return commentsByPost.value[postId] ?? []
    }

    return {
        commentsByPost,
        loading,
        error,
        submitting,
        likedCommentIds,
        loadComments,
        addComment,
        likeComment,
        isCommentLiked,
        getComments,
    }
})
