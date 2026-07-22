<template>
  <Transition name="back-to-top">
    <button
      v-if="visible"
      type="button"
      class="back-to-top"
      :class="{ 'back-to-top--write': isWritePage }"
      aria-label="返回顶部"
      title="返回顶部"
      @click="scrollToTop"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const visible = ref(false)

const writePages = new Set(['write'])
const isWritePage = computed(() => writePages.has(route.name as string))

let ticking = false

function onScroll() {
  if (ticking) return
  ticking = true

  requestAnimationFrame(() => {
    visible.value = window.scrollY > 600
    ticking = false
  })
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--glass-surface);
  color: var(--ink-main);
  box-shadow: var(--glass-shadow);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  backdrop-filter: blur(var(--glass-blur)) saturate(145%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(145%);
}

.back-to-top:hover {
  background: var(--surface-strong);
  color: var(--brand-500);
}

.back-to-top:active {
  transform: scale(0.95);
}

.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: opacity var(--motion-base) var(--ease-out),
    transform var(--motion-base) var(--ease-out);
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.back-to-top--write {
  bottom: calc(var(--write-status-bar-height, 112px) + 16px + env(safe-area-inset-bottom, 0px));
  z-index: 110;
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .back-to-top {
    background: var(--surface-strong);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-md);
  }
}

@media (max-width: 640px) {
  .back-to-top {
    right: 16px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }

  .back-to-top--write {
    bottom: calc(var(--write-status-bar-height-mobile, 150px) + 16px + env(safe-area-inset-bottom, 0px));
    z-index: 110;
  }
}
</style>
