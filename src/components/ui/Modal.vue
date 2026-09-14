<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
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
import { watch, onMounted, onUnmounted } from 'vue'

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

const close = () => {
  emit('update:modelValue', false)
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close()
  }
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
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
  background: var(--surface-overlay);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--line-soft);
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
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
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
