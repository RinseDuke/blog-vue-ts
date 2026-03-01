<template>
  <footer class="status-bar">
    <div class="status-bar__left">
      <button
        type="button"
        :class="['sb-btn', 'sb-toggle', { 'sb-toggle--active': showPublishSettings }]"
        @click="$emit('toggle-publish-settings')"
      >
        发布设置
        <svg class="sb-toggle__arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1,1 5,5 9,1"/>
        </svg>
      </button>
      <i class="sb-sep" />
      <span class="sb-meta">字数: {{ wordCount }}</span>
      <i class="sb-sep" />
      <span class="sb-meta">{{ currentModeLabel }}</span>
    </div>

    <div class="status-bar__right">
      <button type="button" class="sb-btn" @click="$emit('clear-draft')">删除</button>
      <span class="sb-dot">·</span>
      <button type="button" class="sb-btn sb-draft" @click="$emit('save-draft')">
        草稿
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
        </svg>
      </button>
      <span v-if="saveLabel" class="sb-saved">{{ saveLabel }}</span>
      <button type="button" class="sb-btn" @click="$emit('export-markdown')">预期</button>
      <button type="button" class="sb-publish" @click="$emit('publish')">发布</button>
    </div>
  </footer>
</template>

<script setup lang="ts">
defineProps<{
  showPublishSettings: boolean
  wordCount: number
  currentModeLabel: string
  saveLabel: string
}>()

defineEmits<{
  (e: 'toggle-publish-settings'): void
  (e: 'clear-draft'): void
  (e: 'save-draft'): void
  (e: 'export-markdown'): void
  (e: 'publish'): void
}>()
</script>

<style scoped lang="less">
.status-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 44px;
    background: #fff;
    border-top: 1px solid #e0e6ef;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.04);
    font-size: 0.82rem;
    color: #64748b;
    flex-shrink: 0;
}

.status-bar__left,
.status-bar__right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sb-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.82rem;
    color: #64748b;
    padding: 2px 3px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    transition: color 0.15s;

    &:hover {
        color: var(--brand-500);
    }
}

.sb-toggle {
    font-weight: 600;
    color: var(--brand-500);

    .sb-toggle__arrow {
        transition: transform 0.28s cubic-bezier(.4, 0, .2, 1);
    }

    &--active .sb-toggle__arrow {
        transform: rotate(180deg);
    }
}

.sb-sep {
    width: 1px;
    height: 13px;
    background: #dce2ec;
    display: block;
}

.sb-meta {
    white-space: nowrap;
}

.sb-dot {
    color: #b0b8c8;
    font-weight: 700;
}

.sb-draft svg {
    color: #94a3b8;
}

.sb-saved {
    font-size: 0.76rem;
    color: #94a3b8;
}

.sb-publish {
    background: var(--brand-500);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 4px 20px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.16s, transform 0.12s;

    &:hover {
        background: #005ec5;
    }

    &:active {
        transform: scale(0.97);
    }
}

@media (max-width: 768px) {
    .status-bar {
        padding: 0 10px;
        height: 40px;
    }

    .status-bar__left,
    .status-bar__right {
        gap: 5px;
    }

    .sb-saved {
        display: none;
    }

    .sb-meta:last-child {
        display: none;
    }
}
</style>
