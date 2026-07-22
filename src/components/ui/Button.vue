<template>
  <button
    :type="type"
    :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--loading': loading, 'btn--disabled': disabled }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true"></span>
    <span :class="{ 'btn__content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit' | 'reset'
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    loading: false,
    disabled: false,
  }
)

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped lang="less">
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--motion-base) var(--ease-out-quint);
  position: relative;
  white-space: nowrap;
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.btn--sm {
  padding: 0.4rem 0.9rem;
  font-size: 0.88rem;
}

.btn--md {
  padding: 0.6rem 1.2rem;
  font-size: 0.94rem;
}

.btn--lg {
  padding: 0.8rem 1.6rem;
  font-size: 1rem;
}

.btn--primary {
  background: linear-gradient(135deg, var(--brand-500), var(--brand-400));
  color: var(--on-brand);
  box-shadow: 0 4px 12px rgba(0, 113, 227, 0.24);
}

.btn--primary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(0, 113, 227, 0.32);
  transform: translateY(-1px);
}

.btn--secondary {
  background: var(--control-surface);
  color: var(--ink-strong);
  border: 1px solid var(--line-strong);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--surface-hover);
  border-color: var(--brand-500);
}

.btn--ghost {
  background: color-mix(in srgb, var(--control-surface) 72%, transparent);
  color: var(--ink-main);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--brand-500);
}

.btn--danger {
  background: var(--danger-500);
  color: var(--on-danger);
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.24);
}

.btn--danger:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(198, 40, 40, 0.32);
  transform: translateY(-1px);
}

.btn--disabled,
.btn:disabled {
  color: var(--ink-muted);
  border: 1px dashed var(--control-border);
  background: var(--control-disabled);
  box-shadow: none;
  cursor: not-allowed;
  transform: none !important;
}

.btn--loading {
  cursor: wait;
}

.btn__spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.btn__content--hidden {
  visibility: hidden;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
