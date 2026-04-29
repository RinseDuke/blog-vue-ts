<template>
  <Transition name="back-to-top">
    <button
      v-if="visible"
      type="button"
      class="back-to-top"
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const visible = ref(false)

const writePages = new Set(['write'])
const isWritePage = () => writePages.has(route.name as string)

let ticking = false

function onScroll() {
  if (ticking) return
  ticking = true

  requestAnimationFrame(() => {
    visible.value = !isWritePage() && window.scrollY > 600
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
  border: 1px solid var(--line-soft);
  background: var(--surface-overlay);
  color: var(--ink-main);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
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
</style>
