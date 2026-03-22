<!-- 发布设置面板：按后端规范配置状态与可见性 -->
<template>
  <div class="publish-panel">
    <div class="publish-panel__inner">
      <h3 class="publish-panel__title">发布设置</h3>

      <div class="publish-grid">
        <label class="control-field">
          <span>状态</span>
          <select :value="status" @change="emitStatusChange">
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </label>

        <label class="control-field">
          <span>可见性</span>
          <select :value="visibility" @change="emitVisibilityChange">
            <option value="public">公开</option>
            <option value="private">仅自己可见</option>
          </select>
        </label>
      </div>

      <div class="publish-note">
        <p>当前后端仅支持标题、正文、状态和可见性。</p>
        <p>封面、标签等扩展字段已暂时停用，后续接口补齐后可继续接回。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  status: 'draft' | 'published'
  visibility: 'public' | 'private'
}>()

const emit = defineEmits<{
  (e: 'update:status', value: 'draft' | 'published'): void
  (e: 'update:visibility', value: 'public' | 'private'): void
}>()

function emitStatusChange(event: Event) {
  emit('update:status', (event.target as HTMLSelectElement).value as 'draft' | 'published')
}

function emitVisibilityChange(event: Event) {
  emit('update:visibility', (event.target as HTMLSelectElement).value as 'public' | 'private')
}
</script>

<style scoped lang="less">
.publish-panel {
    border-top: 1px solid var(--line-soft);
    background: var(--surface-strong);
    width: 100%;
}

.publish-panel__inner {
    max-width: var(--write-content-max-width, 980px);
    width: 100%;
    margin: 0 auto;
    padding: 22px 24px 60px;
}

.publish-panel__title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink-strong);
    margin-bottom: 18px;
}

.publish-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
}

.control-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    span {
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--brand-500);
    }

    select {
        width: 100%;
        border: 1px solid var(--line-soft);
        border-radius: var(--radius-sm);
        background: var(--surface);
        color: var(--ink-strong);
        padding: 0.62rem 0.72rem;
    }
}

.publish-note {
    margin-top: 1rem;
    padding: 0.9rem 1rem;
    border-radius: var(--radius-md);
    border: 1px dashed var(--line-strong);
    background: var(--bg-canvas-soft);
    color: var(--ink-muted);
    font-size: 0.86rem;
    line-height: 1.65;

    p {
        margin: 0;
    }

    p + p {
        margin-top: 0.35rem;
    }
}

@media (max-width: 768px) {
    .publish-panel__inner {
        padding-left: 14px;
        padding-right: 14px;
    }

    .publish-grid {
        grid-template-columns: 1fr;
    }
}
</style>
