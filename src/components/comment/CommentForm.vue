<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  parentId?: string
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { content: string; parentId?: string }): void
  (e: 'cancel'): void
}>()

const content = ref('')

function handleSubmit() {
  const trimmed = content.value.trim()
  if (!trimmed) return

  emit('submit', {
    content: trimmed,
    parentId: props.parentId,
  })

  content.value = ''
}
</script>

<template>
  <form class="comment-form" @submit.prevent="handleSubmit">
    <textarea
      v-model="content"
      class="comment-form__input"
      :placeholder="parentId ? '写下你的回复...' : '写下你的评论...'"
      rows="3"
    />
    <div class="comment-form__actions">
      <button
        v-if="parentId"
        type="button"
        class="comment-form__btn comment-form__btn--cancel"
        @click="emit('cancel')"
      >
        取消
      </button>
      <button
        type="submit"
        class="comment-form__btn comment-form__btn--submit"
        :disabled="!content.trim() || submitting"
      >
        {{ submitting ? '提交中...' : '发表评论' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.comment-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.comment-form__input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  color: var(--ink-strong);
  font-size: 0.92rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.comment-form__input:focus {
  outline: none;
  border-color: rgba(0, 113, 227, 0.35);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.comment-form__input::placeholder {
  color: var(--ink-muted);
}

.comment-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.comment-form__btn {
  padding: 0.5rem 1.1rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.comment-form__btn--submit {
  border: none;
  background: var(--brand-500);
  color: #fff;
}

.comment-form__btn--submit:hover:enabled {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 113, 227, 0.24);
}

.comment-form__btn--submit:disabled {
  cursor: not-allowed;
  background: #9ca3af;
}

.comment-form__btn--cancel {
  border: 1px solid var(--line-soft);
  background: #fff;
  color: var(--ink-muted);
}

.comment-form__btn--cancel:hover {
  color: var(--ink-strong);
  border-color: var(--ink-muted);
}
</style>
