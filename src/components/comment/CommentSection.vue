<script setup lang="ts">
import { computed, onMounted } from 'vue'
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
const { loading, error, submitting } = storeToRefs(commentStore)

const comments = computed(() => commentStore.getComments(props.postId))
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

onMounted(() => {
  void commentStore.loadComments(props.postId)
})
</script>

<template>
  <section class="comment-section">
    <header class="comment-section__header">
      <h3>回复 <span v-if="commentCount" class="comment-section__count">{{ commentCount }}</span></h3>
    </header>

    <CommentForm v-if="isLoggedIn" :submitting="submitting" @submit="handleSubmit" />
    <div v-else class="comment-section__login-gate">
      <p>登录后可以参与这次讨论。</p>
      <RouterLink class="comment-section__login-link" :to="loginLocation">前往登录</RouterLink>
    </div>

    <div v-if="loading" class="comment-section__skeletons">
      <SkeletonLoader v-for="i in 3" :key="i" variant="comment" />
    </div>
    <div v-else-if="error" class="comment-section__state comment-section__state--error">{{ error }}</div>

    <div v-else-if="!topLevelComments.length" class="comment-section__state comment-section__state--empty">
      还没有回复，开始这次讨论吧。
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
  margin: 0;
  padding: 1.5rem clamp(1rem, 4vw, 2rem) 2rem;
}

.comment-section__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comment-section__header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--ink-strong);
  letter-spacing: 0;
}

.comment-section__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.4rem;
  border-radius: 7px;
  background: var(--brand-100);
  color: var(--brand-500);
  font-size: 0.78rem;
  font-weight: 700;
}

.comment-section__state {
  padding: 1.5rem;
  text-align: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-soft);
  background: var(--bg-canvas-soft);
  color: var(--ink-muted);
  font-size: 0.92rem;
}

.comment-section__state--error {
  background: var(--danger-bg);
  color: var(--danger-500);
}

.comment-section__state--empty {
  background: var(--bg-canvas-soft);
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
  border-radius: var(--radius-md);
  border: 1px solid var(--line-soft);
  background: var(--bg-canvas-soft);
  color: var(--ink-muted);

  p {
    margin: 0;
  }
}

.comment-section__login-link {
  flex-shrink: 0;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radius-sm);
  background: var(--brand-500);
  color: var(--on-accent);
  font-weight: 700;
  text-decoration: none;
}

.comment-section__skeletons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

@media (max-width: 640px) {
  .comment-section__login-gate {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
