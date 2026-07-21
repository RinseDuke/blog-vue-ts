<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
        <div
          ref="modalRef"
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          @click.stop
        >
          <div class="modal__header">
            <h2 :id="titleId" class="modal__title">
              <slot name="title">{{ title }}</slot>
            </h2>
            <button
              class="modal__close"
              type="button"
              aria-label="关闭"
              @click="close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { isTopModal, registerModal, unregisterModal } from './modalManager'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    closeOnOverlay?: boolean
  }>(),
  {
    title: '',
    closeOnOverlay: true,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`
const instanceId = Symbol(titleId)
const modalRef = ref<HTMLElement | null>(null)
let previouslyFocusedElement: HTMLElement | null = null
let isRegistered = false

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements() {
  if (!modalRef.value) return []
  return Array.from(modalRef.value.querySelectorAll<HTMLElement>(focusableSelector))
}

const close = () => {
  emit('update:modelValue', false)
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay && isTopModal(instanceId)) {
    close()
  }
}

const handleTabKey = (event: KeyboardEvent) => {
  if (!props.modelValue || event.key !== 'Tab' || !modalRef.value || !isTopModal(instanceId)) return

  const focusable = getFocusableElements()

  if (!focusable.length) {
    event.preventDefault()
    modalRef.value.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!document.activeElement || !modalRef.value.contains(document.activeElement)) {
    event.preventDefault()
    const recoveryTarget = event.shiftKey ? last : first
    recoveryTarget.focus()
    return
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!props.modelValue || !isTopModal(instanceId)) return

  if (e.key === 'Escape' && props.modelValue) {
    e.preventDefault()
    close()
    return
  }
  handleTabKey(e)
}

function activateModal() {
  if (isRegistered) return

  previouslyFocusedElement = document.activeElement as HTMLElement | null
  registerModal(instanceId)
  isRegistered = true
  void nextTick(() => {
    if (!isTopModal(instanceId)) return
    const firstFocusable = getFocusableElements()[0]
    ;(firstFocusable ?? modalRef.value)?.focus()
  })
}

function deactivateModal() {
  if (!isRegistered) return

  const { wasTop } = unregisterModal(instanceId)
  isRegistered = false
  if (wasTop) previouslyFocusedElement?.focus()
  previouslyFocusedElement = null
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    activateModal()
  } else {
    deactivateModal()
  }
}, { immediate: true })

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  deactivateModal()
})
</script>

<style scoped lang="less">
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
}

.modal {
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  background: var(--glass-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur)) saturate(145%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(145%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--line-soft);
  flex-shrink: 0;
}

.modal__title {
  font-size: 1.13rem;
  font-weight: 700;
  color: var(--ink-strong);
  margin: 0;
}

.modal__close {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--control-border);
  background: var(--control-surface);
  color: var(--ink-muted);
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--motion-fast) var(--ease-out);
  flex-shrink: 0;
}

.modal__close:hover {
  color: var(--ink-strong);
  background: var(--surface-hover);
}

.modal__close svg {
  width: 18px;
  height: 18px;
}

.modal__body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  color: var(--ink-main);
  line-height: 1.6;
}

.modal__footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--line-soft);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-shrink: 0;
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .modal {
    background: var(--surface-strong);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-md);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--motion-base) var(--ease-out-quint);
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: all var(--motion-base) var(--ease-out-quint);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  opacity: 0;
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .modal {
    max-width: none;
    max-height: 95vh;
  }

  .modal__header {
    padding: 1rem 1.25rem;
  }

  .modal__body {
    padding: 1.25rem;
  }

  .modal__footer {
    padding: 0.875rem 1.25rem;
  }
}
</style>
