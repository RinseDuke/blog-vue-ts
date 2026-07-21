<template>
  <div class="empty-state">
    <div class="empty-state__icon" aria-hidden="true">
      <slot name="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      </slot>
    </div>
    <h3 class="empty-state__title">
      <slot name="title">{{ title }}</slot>
    </h3>
    <p v-if="description || $slots.description" class="empty-state__description">
      <slot name="description">{{ description }}</slot>
    </p>
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: '暂无内容',
    description: '',
  }
)
</script>

<style scoped lang="less">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-surface);
  box-shadow: var(--shadow-sm);
}

.empty-state__icon {
  width: 80px;
  height: 80px;
  margin-bottom: 1.5rem;
  color: var(--ink-muted);
  opacity: 0.6;
}

.empty-state__icon svg {
  width: 100%;
  height: 100%;
}

.empty-state__title {
  font-size: 1.13rem;
  font-weight: 600;
  color: var(--ink-strong);
  margin: 0 0 0.5rem;
}

.empty-state__description {
  font-size: 0.94rem;
  color: var(--ink-muted);
  margin: 0 0 1.5rem;
  max-width: 400px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.empty-state__action {
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-state__icon {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
  }
}
</style>
