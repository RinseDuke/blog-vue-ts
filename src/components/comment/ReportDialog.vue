<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
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
const dialogRef = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements() {
  if (!dialogRef.value) return []
  return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(focusableSelector))
}

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

function handleEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  emit('close')
}

function handleTabKey(event: KeyboardEvent) {
  if (event.key !== 'Tab') return

  const focusable = getFocusableElements()
  if (!focusable.length) {
    event.preventDefault()
    dialogRef.value?.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function handleKeydown(event: KeyboardEvent) {
  handleEscape(event)
  if (!event.defaultPrevented) handleTabKey(event)
}

onMounted(() => {
  previousFocus = document.activeElement as HTMLElement | null
  document.addEventListener('keydown', handleKeydown)
  void nextTick(() => (getFocusableElements()[0] ?? dialogRef.value)?.focus())
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  previousFocus?.focus()
})
</script>

<template>
  <Teleport to="body">
    <div class="report-overlay" @click="handleOverlayClick">
      <div
        ref="dialogRef"
        class="report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        tabindex="-1"
      >
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

            <p v-if="errorMessage" class="report-form__error" role="alert">{{ errorMessage }}</p>

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
  padding: 1rem;
  background: rgba(0, 0, 0, 0.35);
  animation: overlay-in 0.2s ease;
}

.report-dialog {
  width: min(460px, calc(100% - 2rem));
  max-height: min(90vh, 720px);
  overflow-y: auto;
  border: 1px solid var(--glass-border);
  background: var(--glass-surface);
  border-radius: 20px;
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur)) saturate(145%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(145%);
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
  width: 44px;
  height: 44px;
  background: var(--control-surface);
  border: 1px solid var(--control-border);
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
  min-height: 44px;
  padding: 0.6rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--control-border);
  background: var(--control-surface);
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

.report-form__reason--selected::after {
  content: '✓';
  margin-left: auto;
  font-weight: 800;
}

.report-form__detail {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--control-border);
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--ink-strong);
  resize: vertical;
  min-height: 60px;
  background: var(--control-surface);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.report-form__detail:focus {
  outline: none;
  border-color: rgba(198, 40, 40, 0.35);
  box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.08);
}

.report-form__error {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--danger-500) 34%, var(--control-border));
  border-radius: var(--radius-sm);
  background: var(--danger-bg);
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
  min-height: 44px;
  padding: 0.5rem 1.1rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.report-form__btn--cancel {
  border: 1px solid var(--control-border);
  background: var(--control-surface);
  color: var(--ink-muted);
}

.report-form__btn--cancel:hover {
  color: var(--ink-strong);
}

.report-form__btn--submit {
  border: none;
  background: var(--danger-500);
  color: #fff;
}

.report-form__btn--submit:hover:enabled {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(198, 40, 40, 0.24);
}

.report-form__btn--submit:disabled {
  cursor: not-allowed;
  border: 1px dashed var(--control-border);
  background: var(--control-disabled);
  color: var(--ink-muted);
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

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .report-dialog {
    background: var(--surface-strong);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-md);
  }
}

@media (max-width: 390px) {
  .report-dialog {
    width: 100%;
    padding: 1rem;
  }

  .report-form__actions {
    width: 100%;
  }

  .report-form__btn {
    flex: 1;
  }
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
