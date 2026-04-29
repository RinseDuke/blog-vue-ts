<template>
  <header class="topbar" :class="{ hidden: props.isHidden, condensed: props.isCondensed, scrolled: isScrolled }">
    <div class="topbar__inner">
      <slot />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    isHidden?: boolean
    isCondensed?: boolean
  }>(),
  {
    isHidden: false,
    isCondensed: false,
  }
)

const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 4
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="less">
.topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  background: var(--nav-backdrop);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border-bottom: 1px solid transparent;
  color: var(--ink-main);
  position: fixed;
  top: 0;
  z-index: 40;
  margin: 0;
  transition:
    transform 0.32s var(--ease-out-quint),
    background-color 0.24s ease,
    border-color 0.24s ease,
    box-shadow 0.24s ease,
    padding 0.22s var(--ease-standard),
    min-height 0.22s var(--ease-standard);
}

.topbar.scrolled {
  border-bottom-color: var(--nav-border-scrolled);
  box-shadow: var(--nav-shadow-scrolled);
}

.topbar__inner {
  width: min(1360px, 100%);
  display: flex;
  align-items: center;
  gap: 0.72rem;
  min-width: 0;
  min-height: 68px;
  padding: 0.7rem 0;
  transition:
    min-height 0.22s var(--ease-standard),
    padding 0.22s var(--ease-standard);
}

.topbar.hidden {
  transform: translateY(-100%);
}

.topbar.condensed .topbar__inner {
  min-height: 56px;
  padding: 0.5rem 0;
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

  .topbar.condensed .topbar__inner {
    min-height: 48px;
    padding: 0.25rem 0;
  }
}
</style>
