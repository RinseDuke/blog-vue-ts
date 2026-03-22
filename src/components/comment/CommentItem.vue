<!-- 单条评论：显示评论内容、点赞按钮、回复入口 -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import type { Comment } from '@/types/post'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import CommentForm from './CommentForm.vue'
import ReportDialog from './ReportDialog.vue'

const props = defineProps<{
  comment: Comment
  replies: Comment[]
  submitting?: boolean
  depth?: number
  canReply?: boolean
  isLiked?: (commentId: string) => boolean
}>()

const emit = defineEmits<{
  (e: 'reply', payload: { content: string; parentId: string }): void
  (e: 'like', commentId: string): void
}>()

const route = useRoute()
const router = useRouter()
const { isLoggedIn } = storeToRefs(useAuthStore())
const showReplyForm = ref(false)
const showReport = ref(false)
const commentLiked = computed(() => props.isLiked?.(props.comment.id) ?? false)
const loginLocation = computed(() => ({
  name: 'about',
  query: { redirect: route.fullPath },
}))

function formatTime(iso: string) {
  const date = new Date(iso)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHour = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 30) return `${diffDay} 天前`
  return date.toLocaleDateString('zh-CN')
}

function handleReply(payload: { content: string; parentId?: string }) {
  emit('reply', { content: payload.content, parentId: payload.parentId! })
  showReplyForm.value = false
}

async function handleReportClick() {
  if (!isLoggedIn.value) {
    await router.push(loginLocation.value)
    return
  }

  showReport.value = true
}
</script>

<template>
  <article class="comment-item" :class="{ 'comment-item--nested': (depth ?? 0) > 0 }">
    <div class="comment-item__header">
      <div class="comment-item__avatar">
        <img
          v-if="comment.author.avatarUrl"
          :src="comment.author.avatarUrl"
          :alt="comment.author.name"
        />
        <span v-else class="comment-item__avatar-fallback">{{ comment.author.name[0] }}</span>
      </div>
      <div class="comment-item__meta">
        <span class="comment-item__author">{{ comment.author.name }}</span>
        <span class="comment-item__time">{{ formatTime(comment.createdAt) }}</span>
      </div>
    </div>

    <p class="comment-item__content">{{ comment.content }}</p>

    <div class="comment-item__actions">
      <button
        type="button"
        class="comment-item__action-btn"
        :class="{ 'comment-item__action-btn--liked': commentLiked }"
        :title="isLoggedIn ? undefined : '登录后可点赞评论'"
        @click="emit('like', comment.id)"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <span>{{ comment.likes ?? 0 }}</span>
      </button>

      <button
        v-if="canReply && (depth ?? 0) < 1"
        type="button"
        class="comment-item__action-btn"
        @click="showReplyForm = !showReplyForm"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{{ showReplyForm ? '取消' : '回复' }}</span>
      </button>

      <button
        type="button"
        class="comment-item__action-btn comment-item__action-btn--report"
        :title="isLoggedIn ? undefined : '登录后可举报评论'"
        @click="handleReportClick"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        <span>举报</span>
      </button>
    </div>

    <CommentForm
      v-if="showReplyForm"
      :parent-id="comment.id"
      :submitting="submitting"
      @submit="handleReply"
      @cancel="showReplyForm = false"
    />

    <div v-if="replies.length" class="comment-item__replies">
      <CommentItem
        v-for="reply in replies"
        :key="reply.id"
        :comment="reply"
        :replies="[]"
        :submitting="submitting"
        :depth="(depth ?? 0) + 1"
        :can-reply="canReply"
        :is-liked="isLiked"
        @reply="(p) => emit('reply', p)"
        @like="(id) => emit('like', id)"
      />
    </div>

    <ReportDialog
      v-if="showReport"
      target-type="comment"
      :target-id="comment.id"
      @close="showReport = false"
    />
  </article>
</template>

<script lang="ts">
export default { name: 'CommentItem' }
</script>

<style scoped>
.comment-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--line-soft);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-item--nested {
  padding: 0.75rem 0 0.75rem 1rem;
  border-bottom: none;
  border-left: 2px solid rgba(0, 113, 227, 0.18);
}

.comment-item__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.comment-item__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.comment-item__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-item__avatar-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #2f8fff, #0071e3);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}

.comment-item__meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.comment-item__author {
  font-weight: 700;
  color: var(--ink-strong);
  font-size: 0.9rem;
}

.comment-item__time {
  color: var(--ink-muted);
  font-size: 0.8rem;
}

.comment-item__content {
  margin: 0;
  line-height: 1.7;
  color: var(--ink-main);
  font-size: 0.93rem;
}

.comment-item__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.comment-item__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: none;
  color: var(--ink-muted);
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.comment-item__action-btn:hover {
  color: var(--brand-500);
  background: rgba(0, 113, 227, 0.06);
}

.comment-item__action-btn--liked {
  color: var(--brand-500);
}


.comment-item__action-btn--report:hover {
  color: #c62828;
  background: rgba(198, 40, 40, 0.06);
}

.comment-item__replies {
  display: flex;
  flex-direction: column;
  margin-top: 0.25rem;
}
</style>
