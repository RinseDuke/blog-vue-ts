<template>
  <footer class="status-bar">
    <div class="status-bar__left">
      <span class="sb-meta">字数: {{ wordCount }}</span>
      <i class="sb-sep" />

      <!-- Mode Switcher Button -->
      <div class="mode-switcher" ref="switcherRef">
        <button type="button" class="sb-btn sb-mode-btn" @click="toggleMenu">
          {{ currentModeLabel }}
          <svg class="sb-mode-arrow" :class="{ 'sb-mode-arrow--open': menuOpen }" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1,5 5,1 9,5"/>
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <Transition name="mode-menu">
          <div v-if="menuOpen" class="mode-menu">
            <button
              v-for="mode in modes"
              :key="mode.value"
              type="button"
              :class="['mode-menu__item', { 'mode-menu__item--active': mode.value === viewMode }]"
              @click="selectMode(mode.value)"
            >
              <span class="mode-menu__icon" v-html="mode.icon"></span>
              <span class="mode-menu__label">{{ mode.label }}</span>
              <svg v-if="mode.value === viewMode" class="mode-menu__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </Transition>
      </div>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  wordCount: number
  currentModeLabel: string
  viewMode: string
  saveLabel: string
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

/* Mode Switcher */
.mode-switcher {
    position: relative;
}

.sb-mode-btn {
    font-weight: 500;
    gap: 4px;
}

.sb-mode-arrow {
    transition: transform 0.22s cubic-bezier(.4, 0, .2, 1);

    &--open {
        transform: rotate(180deg);
    }
}

.mode-menu {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 0;
    min-width: 160px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.04);
    padding: 4px;
    z-index: 200;
}

.mode-menu__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 12px;
    border: none;
    background: none;
    border-radius: 7px;
    cursor: pointer;
    font-size: 0.84rem;
    color: #334155;
    transition: background 0.14s, color 0.14s;
    white-space: nowrap;

    &:hover {
        background: #f1f5f9;
    }

    &--active {
        color: var(--brand-500);
        background: rgba(0, 113, 227, 0.06);
        font-weight: 600;
    }
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

/* Menu transition */
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
