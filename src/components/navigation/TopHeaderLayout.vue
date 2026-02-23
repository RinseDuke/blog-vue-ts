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
  padding: 0.65rem 1.25rem;
  background: rgba(251, 251, 253, 0.74);
  color: var(--ink-main);
  backdrop-filter: blur(18px) saturate(1.3);
  -webkit-backdrop-filter: blur(18px) saturate(1.3);
  position: fixed;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--line-soft);
  margin: 0;
  transition: transform 0.32s ease, background-color 0.32s ease;
}

.topbar__inner {
  width: min(1280px, 100%);
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.topbar.hidden {
  transform: translateY(calc(-100% - 6px));
}

@media (max-width: 768px) {
  .topbar {
    padding: 0.55rem 0.8rem;
  }

  .topbar__inner {
    flex-wrap: wrap;
    gap: 0.6rem;
  }
}
</style>
