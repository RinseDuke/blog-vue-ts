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
  padding: 0.9rem 1.2rem 0;
  background: transparent;
  color: var(--ink-main);
  position: fixed;
  top: 0;
  z-index: 40;
  margin: 0;
  transition: transform 0.32s ease;
}

.topbar__inner {
  width: min(1220px, 100%);
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  padding: 0.72rem 0.85rem;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--line-strong) 88%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 92%, transparent), color-mix(in srgb, var(--surface-frost) 96%, transparent)),
    radial-gradient(circle at top left, var(--brand-100), transparent 42%);
  box-shadow:
    0 22px 54px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(18px) saturate(1.2);
  -webkit-backdrop-filter: blur(18px) saturate(1.2);
}

.topbar.hidden {
  transform: translateY(calc(-100% - 12px));
}

@media (max-width: 768px) {
  .topbar {
    padding: 0.7rem 0.75rem 0;
  }

  .topbar__inner {
    display: block;
    padding: 0.62rem;
    border-radius: 22px;
  }
}
</style>
