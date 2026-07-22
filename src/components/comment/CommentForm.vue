<!-- 评论表单：提交新评论或回复 (弃用中)-->  
<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const MAX_COMMENT_LENGTH = 500

const props = defineProps<{
  parentId?: string
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { content: string; parentId?: string }): void
  (e: 'cancel'): void
}>()

const content = ref('')
const touched = ref(false)
const errorId = useId()

const trimmedContent = computed(() => content.value.trim())
const charCount = computed(() => trimmedContent.value.length)
const isTooLong = computed(() => charCount.value > MAX_COMMENT_LENGTH)
const isEmpty = computed(() => charCount.value === 0)
const validationError = computed(() => {
  if (!touched.value) return ''
  if (isEmpty.value) return '评论内容不能为空'
  if (isTooLong.value) return `超出字数限制（${charCount.value}/${MAX_COMMENT_LENGTH}）`
  return ''
})

function handleSubmit() {
  touched.value = true
  if (isEmpty.value || isTooLong.value) return

  emit('submit', {
    content: trimmedContent.value,
    parentId: props.parentId,
  })

  content.value = ''
  touched.value = false
}

function handleBlur() {
  if (content.value.length > 0) {
    touched.value = true
  }
}
</script>

<template>
  <form class="comment-form" @submit.prevent="handleSubmit">
    <div class="comment-form__field">
      <textarea
        v-model="content"
        class="comment-form__input"
        :class="{ 'comment-form__input--error': validationError }"
        :placeholder="parentId ? '写下你的回复...' : '写下你的评论...'"
        :maxlength="MAX_COMMENT_LENGTH + 50"
        :aria-invalid="Boolean(validationError)"
        :aria-describedby="validationError ? errorId : undefined"
        rows="3"
        @blur="handleBlur"
      />
      <div class="comment-form__info">
        <span v-if="validationError" :id="errorId" class="comment-form__error" role="alert">{{ validationError }}</span>
        <span class="comment-form__counter" :class="{ 'comment-form__counter--warn': isTooLong }">
          {{ charCount }}/{{ MAX_COMMENT_LENGTH }}
        </span>
      </div>
    </div>
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
        :disabled="isEmpty || isTooLong || submitting"
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
  padding: 0.85rem;
  border: 1px solid var(--control-border);
  border-radius: var(--radius-md);
  background: var(--control-surface-hover);
}

.comment-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.comment-form__input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--control-border);
  border-radius: 12px;
  background: var(--control-surface);
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

.comment-form__input--error {
  border-color: var(--danger-500);
  background: color-mix(in srgb, var(--danger-bg) 45%, var(--control-surface));
}

.comment-form__input--error:focus {
  box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.08);
}

.comment-form__input::placeholder {
  color: var(--ink-muted);
}

.comment-form__info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.2rem;
  min-height: 1.2rem;
}

.comment-form__error {
  color: var(--danger-500);
  font-size: 0.8rem;
  font-weight: 600;
}

.comment-form__counter {
  margin-left: auto;
  color: var(--ink-muted);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

.comment-form__counter--warn {
  color: var(--danger-500);
  font-weight: 700;
}

.comment-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.comment-form__btn {
  min-height: 44px;
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
  color: var(--on-brand);
}

.comment-form__btn--submit:hover:enabled {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 113, 227, 0.24);
}

.comment-form__btn--submit:disabled {
  cursor: not-allowed;
  border: 1px dashed var(--control-border);
  background: var(--control-disabled);
  color: var(--ink-muted);
}

.comment-form__btn--cancel {
  border: 1px solid var(--control-border);
  background: var(--control-surface);
  color: var(--ink-muted);
}

.comment-form__btn--cancel:hover {
  color: var(--ink-strong);
  border-color: var(--ink-muted);
}

@media (max-width: 390px) {
  .comment-form__actions {
    width: 100%;
  }

  .comment-form__btn {
    flex: 1;
  }
}
</style>
