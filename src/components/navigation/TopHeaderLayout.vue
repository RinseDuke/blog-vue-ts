<!-- 顶部导航栏布局容器 -->
<template>
  <header class="topbar" :class="{ hidden: props.isHidden }">
    <div class="topbar__inner">
      <slot />
    </div>
  </header>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isHidden?: boolean
  }>(),
  {
    isHidden: false,
  }
)
</script>

<style scoped lang="less">
.topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  background: color-mix(in srgb, var(--surface-strong) 96%, var(--bg-canvas) 4%);
  border-bottom: 1px solid color-mix(in srgb, var(--line-strong) 82%, transparent);
  color: var(--ink-main);
  position: fixed;
  top: 0;
  z-index: 40;
  margin: 0;
  transition: transform 0.32s ease, background-color 0.24s ease, border-color 0.24s ease;
}

.topbar__inner {
  width: min(1360px, 100%);
  display: flex;
  align-items: center;
  gap: 0.72rem;
  min-width: 0;
  min-height: 68px;
  padding: 0.7rem 0;
}

.topbar.hidden {
  transform: translateY(-100%);
}

@media (max-width: 768px) {
  .topbar {
    padding: 0 0.75rem;
  }

  .topbar__inner {
    display: block;
    min-height: 52px;
    padding: 0.35rem 0;
  }
}
</style>
