<template>
  <div class="publish-panel">
    <div class="publish-panel__inner">
      <div class="publish-panel__card">
        <h3 class="publish-panel__title">发布设置</h3>

        <div class="publish-grid">
          <label class="control-field">
            <span>状态</span>
            <DropdownSelect
              :model-value="status"
              :options="statusOptions"
              placeholder="选择状态"
              @update:model-value="emitStatusChange"
            />
          </label>

          <label class="control-field">
            <span>可见性</span>
            <DropdownSelect
              :model-value="visibility"
              :options="visibilityOptions"
              placeholder="选择可见范围"
              @update:model-value="emitVisibilityChange"
            />
          </label>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DropdownSelect from '@/components/ui/DropdownSelect.vue'

type PublishStatus = 'draft' | 'published'
type PublishVisibility = 'public' | 'private'

defineProps<{
  status: PublishStatus
  visibility: PublishVisibility
}>()

const emit = defineEmits<{
  (e: 'update:status', value: PublishStatus): void
  (e: 'update:visibility', value: PublishVisibility): void
}>()

const statusOptions: { label: string; value: PublishStatus }[] = [
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' },
]

const visibilityOptions: { label: string; value: PublishVisibility }[] = [
  { label: '公开', value: 'public' },
  { label: '仅自己可见', value: 'private' },
]

function emitStatusChange(value: string | number) {
  emit('update:status', value as PublishStatus)
}

function emitVisibilityChange(value: string | number) {
  emit('update:visibility', value as PublishVisibility)
}
</script>

<style scoped lang="less">
.publish-panel {
  width: 100%;
  border-top: 1px solid var(--line-soft);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 98%, transparent), color-mix(in srgb, var(--bg-canvas-soft) 82%, transparent));
}

.publish-panel__inner {
  max-width: var(--write-content-max-width, 980px);
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 60px;
}

.publish-panel__card {
  border: 1px solid color-mix(in srgb, var(--write-panel-border) 88%, transparent);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 94%, transparent), color-mix(in srgb, var(--surface) 88%, transparent));
  box-shadow:
    0 14px 28px rgba(15, 23, 42, 0.05),
    var(--write-panel-inset-shadow);
  backdrop-filter: blur(14px);
  padding: 1.1rem;
}

.publish-panel__title {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink-strong);
}

.publish-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.95rem;
}

.control-field {
  display: flex;
  flex-direction: column;
  gap: 0.48rem;

  span {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--ink-strong);
  }
}

@media (max-width: 768px) {
  .publish-panel__inner {
    padding-left: 14px;
    padding-right: 14px;
  }

  .publish-panel__card {
    padding: 1rem;
  }

  .publish-grid {
    grid-template-columns: 1fr;
  }
}
</style>
