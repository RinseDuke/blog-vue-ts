<!-- 编辑器底部状态栏 -->
<template>
  <footer class="status-bar">
    <div class="status-bar__inner">
      <div class="status-bar__shell">
        <div class="status-bar__left">
          <span class="sb-chip">字数 {{ wordCount }}</span>
          <i class="sb-sep" />

          <div class="mode-switcher" ref="switcherRef" @keydown.esc.stop="menuOpen = false">
            <button
              type="button"
              class="sb-btn sb-surface-btn sb-mode-btn"
              aria-haspopup="menu"
              :aria-expanded="menuOpen"
              aria-controls="write-mode-menu"
              @click="toggleMenu"
            >
              {{ currentModeLabel }}
              <svg
                class="sb-mode-arrow"
                :class="{ 'sb-mode-arrow--open': menuOpen }"
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="1,5 5,1 9,5" />
              </svg>
            </button>

            <Transition name="mode-menu">
              <div v-if="menuOpen" id="write-mode-menu" class="mode-menu" role="menu">
                <button
                  v-for="mode in modes"
                  :key="mode.value"
                  type="button"
                  role="menuitemradio"
                  :aria-checked="mode.value === viewMode"
                  :class="['mode-menu__item', { 'mode-menu__item--active': mode.value === viewMode }]"
                  @click="selectMode(mode.value)"
                >
                  <span class="mode-menu__icon" v-html="mode.icon"></span>
                  <span class="mode-menu__label">{{ mode.label }}</span>
                  <svg
                    v-if="mode.value === viewMode"
                    class="mode-menu__check"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            </Transition>
          </div>

          <span v-if="saveLabel" class="sb-saved">{{ saveLabel }}</span>
        </div>

        <div class="status-bar__right">
          <button type="button" class="sb-btn sb-surface-btn" @click="$emit('clear-draft')">删除</button>
          <button
            type="button"
            class="sb-btn sb-surface-btn sb-draft"
            :disabled="isPublishing"
            @click="$emit('save-draft')"
          >
            草稿
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path
                d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
              />
            </svg>
          </button>
          <button type="button" class="sb-btn sb-surface-btn" :disabled="isPublishing" @click="$emit('export-markdown')">
            导出
          </button>
          <button type="button" class="sb-publish" :disabled="isPublishing" @click="$emit('publish')">
            {{ publishLabel }}
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{
  wordCount: number
  currentModeLabel: string
  viewMode: string
  saveLabel: string
  isPublishing?: boolean
  publishLabel?: string
}>()

const emit = defineEmits<{
  (e: 'clear-draft'): void
  (e: 'save-draft'): void
  (e: 'export-markdown'): void
  (e: 'publish'): void
  (e: 'change-mode', mode: string): void
}>()

const menuOpen = ref(false)
const switcherRef = ref<HTMLElement | null>(null)

const modes = [
  {
    value: 'read',
    label: '阅读视图',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  },
  {
    value: 'source',
    label: '源码模式',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  },
  {
    value: 'live',
    label: '实时阅览',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  },
]

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function selectMode(mode: string) {
  emit('change-mode', mode)
  menuOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  if (switcherRef.value && !switcherRef.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped lang="less">
.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 18px 0 16px;
  background: var(--write-status-rail-bg);
  backdrop-filter: blur(12px);
  pointer-events: none;
  font-size: 0.82rem;
  color: var(--ink-muted);
  flex-shrink: 0;
}

.status-bar__inner {
  max-width: var(--write-content-max-width, 980px);
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
}

.status-bar__shell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px 18px;
  min-height: 60px;
  padding: 10px 12px;
  border: 1px solid var(--write-panel-border);
  border-radius: var(--radius-lg);
  background: var(--write-panel-bg);
  box-shadow: var(--write-panel-shadow), var(--write-panel-inset-shadow);
  backdrop-filter: blur(16px);
  pointer-events: auto;
}

.status-bar__left,
.status-bar__right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.status-bar__left {
  flex: 1 1 auto;
}

.status-bar__right {
  justify-content: flex-end;
}

.sb-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px solid var(--write-panel-inline-border);
  background: var(--write-panel-inline-bg);
  box-shadow: var(--write-panel-inset-shadow);
  color: var(--ink-strong);
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.sb-btn {
  appearance: none;
  border: 1px solid var(--write-panel-inline-border);
  background: var(--write-panel-inline-bg);
  box-shadow: var(--write-panel-inset-shadow);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-main);
  padding: 0 14px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.12s ease,
    box-shadow 0.16s ease;
  white-space: nowrap;
}

.sb-btn:hover {
  background: var(--write-panel-inline-hover);
  color: var(--ink-strong);
  border-color: color-mix(in srgb, var(--write-panel-inline-border) 78%, var(--brand-100) 22%);
}

.sb-btn:active {
  transform: translateY(1px);
}

.sb-btn:disabled {
  cursor: not-allowed;
  color: var(--ink-muted);
  opacity: 0.58;
  transform: none;
}

.sb-surface-btn:focus-visible,
.sb-publish:focus-visible,
.mode-menu__item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-100) 72%, transparent), var(--write-panel-inset-shadow);
}

.mode-switcher {
  position: relative;
}

.sb-mode-btn {
  font-weight: 700;
  gap: 8px;
}

.sb-mode-arrow {
  color: var(--ink-muted);
  transition: transform 0.22s cubic-bezier(.4, 0, .2, 1);
}

.sb-mode-arrow--open {
  transform: rotate(180deg);
}

.mode-menu {
  position: absolute;
  bottom: calc(100% + 14px);
  left: 0;
  min-width: 188px;
  padding: 6px;
  border: 1px solid var(--write-panel-border);
  border-radius: var(--radius-md);
  background: var(--write-panel-bg);
  box-shadow: var(--write-panel-shadow);
  backdrop-filter: blur(16px);
  z-index: 200;
  pointer-events: auto;
}

.mode-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--ink-main);
  transition: background 0.14s, color 0.14s, border-color 0.14s;
  white-space: nowrap;
}

.mode-menu__item:hover {
  background: var(--write-panel-inline-hover);
}

.mode-menu__item--active {
  color: var(--brand-500);
  background: color-mix(in srgb, var(--brand-100) 66%, transparent);
  border-color: color-mix(in srgb, var(--brand-100) 80%, transparent);
  font-weight: 600;
}

.mode-menu__icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: inherit;
}

.mode-menu__label {
  flex: 1;
  text-align: left;
}

.mode-menu__check {
  flex-shrink: 0;
  color: var(--brand-500);
}

.mode-menu-enter-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(.4, 0, .2, 1);
}

.mode-menu-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.mode-menu-enter-from,
.mode-menu-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.sb-sep {
  width: 1px;
  height: 22px;
  background: var(--write-panel-divider);
  display: block;
  flex-shrink: 0;
}

.sb-draft svg {
  color: currentColor;
}

.sb-saved {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px dashed var(--write-panel-divider);
  background: color-mix(in srgb, var(--write-panel-inline-bg) 78%, transparent);
  color: var(--ink-muted);
  font-size: 0.74rem;
  white-space: nowrap;
}

.sb-publish {
  min-height: 36px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, var(--brand-500) 60%, var(--write-panel-inline-border) 40%);
  border-radius: 999px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--brand-400) 86%, white 14%), var(--brand-500));
  color: #fff;
  box-shadow: 0 14px 24px color-mix(in srgb, var(--brand-100) 42%, transparent);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    filter 0.16s ease,
    box-shadow 0.16s ease;
}

.sb-publish:hover {
  filter: saturate(1.05) brightness(1.03);
  box-shadow: 0 16px 26px color-mix(in srgb, var(--brand-100) 48%, transparent);
}

.sb-publish:active {
  transform: translateY(1px);
}

.sb-publish:disabled {
  cursor: not-allowed;
  filter: grayscale(0.12);
  opacity: 0.62;
  box-shadow: none;
}

@media (max-width: 768px) {
  .status-bar {
    padding: 12px 0;
  }

  .status-bar__inner {
    padding: 0 14px;
  }

  .status-bar__shell {
    align-items: stretch;
    padding: 10px;
    border-radius: 20px;
  }

  .status-bar__left,
  .status-bar__right {
    width: 100%;
    gap: 8px;
  }

  .status-bar__right {
    justify-content: space-between;
  }

  .sb-sep,
  .sb-saved {
    display: none;
  }

  .sb-chip,
  .sb-btn,
  .sb-publish {
    min-height: 36px;
  }

  .sb-btn,
  .sb-publish {
    flex: 1 1 auto;
    justify-content: center;
    padding: 0 12px;
  }

  .mode-menu {
    bottom: calc(100% + 12px);
  }
}

@media (max-width: 520px) {
  .status-bar__right .sb-btn,
  .status-bar__right .sb-publish {
    flex: 1 1 calc(50% - 4px);
  }
}
</style>
