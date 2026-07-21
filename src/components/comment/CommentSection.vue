<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useCommentStore } from '@/features/comment/stores/useCommentStore'
import CommentItem from './CommentItem.vue'
import CommentForm from './CommentForm.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'

const props = defineProps<{
  postId: string
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const commentStore = useCommentStore()
const { isLoggedIn } = storeToRefs(authStore)
const { submitting } = storeToRefs(commentStore)

const comments = computed(() => commentStore.getComments(props.postId))
const loading = computed(() => commentStore.isLoading(props.postId))
const error = computed(() => commentStore.getError(props.postId))
const loginLocation = computed(() => ({
  name: 'about',
  query: { redirect: route.fullPath },
}))

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
    //.......
  }
}

async function handleLike(commentId: string) {
  if (!isLoggedIn.value) {
    await router.push(loginLocation.value)
    return
  }

  try {
    await commentStore.likeComment(props.postId, commentId)
  } catch {
    //......
  }
}

watch(
  () => props.postId,
  (postId) => {
    void commentStore.loadComments(postId)
  },
  { immediate: true }
)
</script>

<template>
  <section class="comment-section">
    <header class="comment-section__header">
      <h3>评论 <span v-if="commentCount" class="comment-section__count">{{ commentCount }}</span></h3>
    </header>

    <CommentForm v-if="isLoggedIn" :submitting="submitting" @submit="handleSubmit" />
    <div v-else class="comment-section__login-gate">
      <p>登录后才能发表评论和回复。</p>
      <RouterLink class="comment-section__login-link" :to="loginLocation">前往登录</RouterLink>
    </div>

    <div v-if="loading" class="comment-section__skeletons">
      <SkeletonLoader v-for="i in 3" :key="i" variant="comment" />
    </div>
    <div v-else-if="error" class="comment-section__state comment-section__state--error" role="alert">{{ error }}</div>

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
        :can-reply="isLoggedIn"
        :is-liked="commentStore.isCommentLiked"
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
  padding: clamp(1rem, 3vw, 1.5rem);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-surface);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur)) saturate(145%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(145%);
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
  border: 1px solid var(--control-border);
  background: var(--control-surface);
  color: var(--ink-muted);
  font-size: 0.92rem;
}

.comment-section__state--error {
  border-color: color-mix(in srgb, var(--danger-500) 34%, var(--control-border));
  background: var(--danger-bg);
  color: var(--danger-500);
}

.comment-section__state--empty {
  background: var(--control-surface-hover);
  color: var(--ink-main);
}

.comment-section__list {
  display: flex;
  flex-direction: column;
}

.comment-section__login-gate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  border: 1px solid var(--control-border);
  background: var(--control-surface);
  color: var(--ink-muted);

  p {
    margin: 0;
  }
}

.comment-section__login-link {
  flex-shrink: 0;
  padding: 0.5rem 0.9rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--brand-500);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.comment-section__skeletons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .comment-section {
    background: var(--surface-strong);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-sm);
  }
}

@media (max-width: 640px) {
  .comment-section {
    padding: 1rem;
  }

  .comment-section__login-gate {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
