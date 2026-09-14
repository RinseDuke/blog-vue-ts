<script setup lang="ts">
import { ref } from 'vue'
import type { ReportReason, ReportTargetType } from '@/types/post'
import { submitReport } from '@/services/reportService'

const props = defineProps<{
  targetType: ReportTargetType
  targetId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const reasons: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: '垃圾信息 / 广告' },
  { value: 'harassment', label: '骚扰或人身攻击' },
  { value: 'misinformation', label: '虚假或误导性内容' },
  { value: 'inappropriate', label: '不当内容' },
  { value: 'other', label: '其他原因' },
]

const selectedReason = ref<ReportReason | ''>('')
const detail = ref('')
const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (!selectedReason.value) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await submitReport({
      targetType: props.targetType,
      targetId: props.targetId,
      reason: selectedReason.value,
      detail: detail.value.trim() || undefined,
    })
    submitted.value = true
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="report-overlay" @click="handleOverlayClick">
      <div class="report-dialog" role="dialog" aria-labelledby="report-title">
        <template v-if="!submitted">
          <header class="report-dialog__header">
            <h3 id="report-title">举报{{ targetType === 'comment' ? '评论' : '文章' }}</h3>
            <button type="button" class="report-dialog__close" aria-label="关闭" @click="emit('close')">✕</button>
          </header>

          <p class="report-dialog__hint">请选择举报原因，我们会尽快审核处理。</p>

          <form class="report-form" @submit.prevent="handleSubmit">
            <div class="report-form__reasons">
              <label
                v-for="reason in reasons"
                :key="reason.value"
                class="report-form__reason"
                :class="{ 'report-form__reason--selected': selectedReason === reason.value }"
              >
                <input
                  v-model="selectedReason"
                  type="radio"
                  name="report-reason"
                  :value="reason.value"
                  class="sr-only"
                />
                <span>{{ reason.label }}</span>
              </label>
            </div>

            <textarea
              v-model="detail"
              class="report-form__detail"
              placeholder="补充说明（可选）"
              rows="3"
            />

            <p v-if="errorMessage" class="report-form__error">{{ errorMessage }}</p>

            <div class="report-form__actions">
              <button type="button" class="report-form__btn report-form__btn--cancel" @click="emit('close')">取消</button>
              <button
                type="submit"
                class="report-form__btn report-form__btn--submit"
                :disabled="!selectedReason || submitting"
              >
                {{ submitting ? '提交中...' : '提交举报' }}
              </button>
            </div>
          </form>
        </template>

        <template v-else>
          <div class="report-dialog__success">
            <div class="report-dialog__check">✓</div>
            <h3>举报已提交</h3>
            <p>感谢你的反馈，我们的管理员会尽快审核。</p>
            <button type="button" class="report-form__btn report-form__btn--submit" @click="emit('close')">关闭</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.report-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.35);
  animation: overlay-in 0.2s ease;
}

.report-dialog {
  width: min(460px, calc(100% - 2rem));
  background: var(--surface-strong);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  padding: 1.5rem;
  animation: dialog-in 0.25s ease;
}

.report-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.report-dialog__header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--ink-strong);
}

.report-dialog__close {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: var(--ink-muted);
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.report-dialog__close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--ink-strong);
}

.report-dialog__hint {
  margin: 0 0 1rem;
  color: var(--ink-muted);
  font-size: 0.9rem;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.report-form__reasons {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.report-form__reason {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line-soft);
  cursor: pointer;
  font-size: 0.92rem;
  color: var(--ink-main);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.report-form__reason:hover {
  border-color: rgba(198, 40, 40, 0.3);
  background: var(--danger-bg);
}

.report-form__reason--selected {
  border-color: var(--danger-500);
  background: var(--danger-bg);
  color: var(--danger-500);
  font-weight: 600;
}

.report-form__detail {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--ink-strong);
  resize: vertical;
  min-height: 60px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.report-form__detail:focus {
  outline: none;
  border-color: rgba(198, 40, 40, 0.35);
  box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.08);
}

.report-form__error {
  margin: 0;
  color: var(--danger-500);
  font-size: 0.87rem;
  font-weight: 600;
}

.report-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.report-form__btn {
  padding: 0.5rem 1.1rem;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.report-form__btn--cancel {
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--ink-muted);
}

.report-form__btn--cancel:hover {
  color: var(--ink-strong);
}

.report-form__btn--submit {
  border: none;
  background: var(--danger-500);
  color: var(--on-accent);
}

.report-form__btn--submit:hover:enabled {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(198, 40, 40, 0.24);
}

.report-form__btn--submit:disabled {
  cursor: not-allowed;
  background: var(--disabled-bg);
}

.report-dialog__success {
  text-align: center;
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.report-dialog__check {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--success-bg);
  color: var(--success-500);
  font-size: 1.5rem;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.report-dialog__success h3 {
  margin: 0;
  color: var(--ink-strong);
}

.report-dialog__success p {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.92rem;
}

@keyframes overlay-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
