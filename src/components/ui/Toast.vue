<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast--${toast.type}`]"
          role="alert"
        >
          <div class="toast__icon" aria-hidden="true">
            <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="toast__content">{{ toast.message }}</div>
          <button class="toast__close" @click="removeToast(toast.id)" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

const toasts = ref<Toast[]>([])
let nextId = 1

const addToast = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
  const id = nextId++
  toasts.value.push({ id, message, type, duration })

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }
}

const removeToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

defineExpose({ addToast })
</script>

<style scoped lang="less">
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 300px;
  max-width: 400px;
  padding: 0.9rem 1rem;
  background: var(--glass-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--glass-shadow);
  border: 1px solid var(--glass-border);
  pointer-events: auto;
  backdrop-filter: blur(var(--glass-blur)) saturate(145%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(145%);
}

.toast__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast__icon svg {
  width: 100%;
  height: 100%;
}

.toast--success {
  border-left: 3px solid var(--success-500);
}

.toast--success .toast__icon {
  color: var(--success-500);
}

.toast--error {
  border-left: 3px solid var(--danger-500);
}

.toast--error .toast__icon {
  color: var(--danger-500);
}

.toast--warning {
  border-left: 3px solid var(--warning-500);
}

.toast--warning .toast__icon {
  color: var(--warning-500);
}

.toast--info {
  border-left: 3px solid var(--brand-500);
}

.toast--info .toast__icon {
  color: var(--brand-500);
}

.toast__content {
  flex: 1;
  font-size: 0.94rem;
  color: var(--ink-main);
  line-height: 1.5;
  min-width: 0;
  overflow-wrap: anywhere;
}

.toast__close {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border: 1px solid var(--control-border);
  background: var(--control-surface);
  color: var(--ink-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--motion-fast) var(--ease-out);
}

.toast__close:hover {
  color: var(--ink-strong);
  background: var(--surface-hover);
}

.toast__close svg {
  width: 14px;
  height: 14px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--motion-base) var(--ease-out-quint);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-move {
  transition: transform var(--motion-base) var(--ease-out-quint);
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .toast {
    background: var(--surface-strong);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-md);
  }
}

@media (max-width: 768px) {
  .toast-container {
    top: auto;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
  }

  .toast {
    width: 100%;
    min-width: auto;
    max-width: none;
  }

  .toast-enter-from {
    transform: translateY(100%) scale(0.95);
  }

  .toast-leave-to {
    transform: translateY(100%) scale(0.95);
  }
}
</style>
