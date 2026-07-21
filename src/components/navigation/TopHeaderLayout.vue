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
  width: calc(100% - 2rem);
  max-width: 1388px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.85rem;
  background: var(--glass-surface);
  backdrop-filter: blur(var(--glass-blur)) saturate(145%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(145%);
  border: 1px solid var(--glass-border);
  border-radius: 22px;
  box-shadow: var(--glass-shadow);
  color: var(--ink-main);
  position: fixed;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  margin: 0;
  overflow: visible;
  transition:
    transform 0.32s var(--ease-out-quint),
    top 0.22s var(--ease-standard),
    width 0.22s var(--ease-standard),
    background-color 0.24s ease,
    border-color 0.24s ease,
    box-shadow 0.24s ease,
    border-radius 0.22s var(--ease-standard);
}

.topbar.scrolled {
  background: color-mix(in srgb, var(--glass-surface) 88%, var(--surface-strong) 12%);
  border-color: color-mix(in srgb, var(--glass-border) 78%, var(--line-strong) 22%);
  box-shadow: var(--glass-shadow), var(--nav-shadow-scrolled);
}

.topbar__inner {
  width: min(1360px, 100%);
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  min-height: 60px;
  padding: 0.35rem 0;
  transition:
    min-height 0.22s var(--ease-standard),
    padding 0.22s var(--ease-standard);
}

.topbar.hidden {
  transform: translate(-50%, calc(-100% - 1.5rem));
}

.topbar.condensed {
  top: 0.5rem;
  width: calc(100% - 2.5rem);
  border-color: color-mix(in srgb, var(--glass-border) 76%, var(--line-strong) 24%);
  box-shadow: var(--glass-shadow), var(--nav-shadow-scrolled);
}

.topbar.condensed .topbar__inner {
  min-height: 54px;
  padding: 0.2rem 0;
}

@media (max-width: 768px) {
  .topbar {
    width: calc(100% - 1rem);
    top: 0.5rem;
    padding: 0 0.4rem;
    border-radius: 18px;
  }

  .topbar__inner {
    display: block;
    min-height: 52px;
    padding: 0.25rem 0;
  }

  .topbar.condensed {
    width: calc(100% - 1rem);
  }

  .topbar.condensed .topbar__inner {
    min-height: 48px;
    padding: 0.15rem 0;
  }
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .topbar,
  .topbar.scrolled {
    background: var(--surface-strong);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-sm);
  }
}
</style>
