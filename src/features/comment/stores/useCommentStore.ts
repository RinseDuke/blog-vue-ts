/**
 * 评论 Store
 * 管理评论的加载、新增、点赞（乐观更新 + 失败回滚）。
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
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
    const loading = ref(false)
    const error = ref<string | null>(null)
    const submitting = ref(false)
    const likedCommentIds = ref<Set<string>>(new Set())

    /** 加载指定文章的评论 */
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

    /** 发表新评论 */
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

    /**
     * 评论点赞 / 取消点赞
     * 采用乐观更新策略：先更新 UI → 请求后端 → 失败时回滚
     */
    async function likeComment(postId: string, commentId: string) {
        if (!authStore.isLoggedIn) {
            const authError = new Error('请先登录后再点赞评论')
            error.value = authError.message
            throw authError
        }

        error.value = null
        const wasLiked = likedCommentIds.value.has(commentId)
        const delta = wasLiked ? -1 : 1

        //切换点赞状态
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
            //请求，用服务端返回值纠正
            const serverLikes = await setCommentLikeApi(commentId, !wasLiked)
            const target = comments?.find((c) => c.id === commentId)
            if (target) {
                target.likes = serverLikes
            }
        } catch (err: unknown) {
            // 失败时回滚点赞状态和计数
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

    /** 查询评论是否已点赞 */
    function isCommentLiked(commentId: string): boolean {
        return likedCommentIds.value.has(commentId)
    }

    /** 获取指定文章的评论列表 */
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
