<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useCommentStore } from '@/features/comment/stores/useCommentStore'
import CommentItem from './CommentItem.vue'
import CommentForm from './CommentForm.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'

const props = defineProps<{
  postId: string
}>()

const commentStore = useCommentStore()
const { loading, error, submitting } = storeToRefs(commentStore)

const comments = computed(() => commentStore.getComments(props.postId))

const topLevelComments = computed(() =>
  comments.value.filter((c) => !c.parentId)
)

function getReplies(parentId: string) {
  return comments.value.filter((c) => c.parentId === parentId)
}

const commentCount = computed(() => comments.value.length)

async function handleSubmit(payload: { content: string; parentId?: string }) {
  try {
    await commentStore.addComment({
      postId: props.postId,
      content: payload.content,
      parentId: payload.parentId,
    })
  } catch {
    // error is already set in store
  }
}

function handleLike(commentId: string) {
  void commentStore.likeComment(props.postId, commentId)
}

onMounted(() => {
  void commentStore.loadComments(props.postId)
})
</script>

<template>
  <section class="comment-section">
    <header class="comment-section__header">
      <h3>评论 <span v-if="commentCount" class="comment-section__count">{{ commentCount }}</span></h3>
    </header>

    <CommentForm :submitting="submitting" @submit="handleSubmit" />

    <div v-if="loading" class="comment-section__skeletons">
      <SkeletonLoader v-for="i in 3" :key="i" variant="comment" />
    </div>
    <div v-else-if="error" class="comment-section__state comment-section__state--error">{{ error }}</div>

    <div v-else-if="!topLevelComments.length" class="comment-section__state comment-section__state--empty">
      还没有评论，来发表第一条吧！
    </div>

    <div v-else class="comment-section__list">
      <CommentItem
        v-for="comment in topLevelComments"
        :key="comment.id"
        :comment="comment"
        :replies="getReplies(comment.id)"
        :submitting="submitting"
        :liked="commentStore.isCommentLiked(comment.id)"
        @reply="handleSubmit"
        @like="handleLike"
      />
    </div>
  </section>
</template>

<style scoped>
.comment-section {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--line-soft);
}

.comment-section__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comment-section__header h3 {
  margin: 0;
  font-size: 1.35rem;
  color: var(--ink-strong);
  letter-spacing: -0.01em;
}

.comment-section__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: var(--brand-500);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
}

.comment-section__state {
  padding: 1.5rem;
  text-align: center;
  border-radius: 14px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.78);
  color: var(--ink-muted);
  font-size: 0.92rem;
}

.comment-section__state--error {
  background: #fff5f5;
  color: var(--danger-500);
}

.comment-section__state--empty {
  background: #f7f9fc;
  color: var(--ink-main);
}

.comment-section__list {
  display: flex;
  flex-direction: column;
}

.comment-section__skeletons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}
</style>
