<template>
  <button
    type="button"
    class="theme-switch"
    :class="{ 'theme-switch--dark': isDark }"
    role="switch"
    :aria-checked="isDark"
    :title="themeToggleTitle"
    @click="themeStore.toggleTheme()"
  >
    <span class="theme-switch__thumb" aria-hidden="true">
      <svg v-if="isDark" viewBox="0 0 24 24">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg v-else viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.5 17.5l1.57 1.57M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.5 6.5l1.57-1.57" />
      </svg>
    </span>
    <span class="sr-only">{{ themeToggleLabel }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/features/theme/stores/useThemeStore'

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
const themeToggleLabel = computed(() => (isDark.value ? '切换到浅色模式' : '切换到暗色模式'))
const themeToggleTitle = computed(() => themeToggleLabel.value)
</script>

<style scoped lang="less">
.theme-switch {
  width: 58px;
  height: 34px;
  padding: 4px;
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  background: linear-gradient(180deg, var(--surface-frost), var(--surface));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.32),
    0 8px 18px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  flex-shrink: 0;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
}

.theme-switch:hover {
  background: var(--surface-hover);
}

.theme-switch__thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-strong);
  color: var(--ink-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.16);
  transform: translateX(0);
  transition:
    transform 0.24s var(--ease-out-quint),
    background-color 0.24s ease,
    color 0.24s ease,
    box-shadow 0.24s ease;

  svg {
    width: 13px;
    height: 13px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.4s var(--ease-out-quint);
  }
}

.theme-switch--dark {
  background: rgba(105, 180, 255, 0.18);
  border-color: rgba(105, 180, 255, 0.28);

  .theme-switch__thumb {
    transform: translateX(24px);
    color: var(--brand-400);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.28);

    svg {
      transform: rotate(360deg);
    }
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .theme-switch {
    order: 1;
  }
}
</style>
