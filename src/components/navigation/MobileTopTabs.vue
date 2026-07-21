<template>
  <div ref="rootRef" class="mobile-top-tabs" :class="{ 'mobile-top-tabs--open': menuOpen }" @keydown.esc.stop="closeMenu">
    <button
      type="button"
      class="mobile-top-tabs__trigger"
      :aria-expanded="menuOpen"
      aria-controls="mobile-top-tabs-panel"
      aria-label="打开移动端导航"
      @click="toggleMenu"
    >
      <span class="mobile-top-tabs__current">{{ currentTabLabel }}</span>
      <svg
        class="mobile-top-tabs__arrow"
        :class="{ 'mobile-top-tabs__arrow--open': menuOpen }"
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="1,1 5,5 9,1" />
      </svg>
    </button>

    <Transition name="mobile-top-tabs-panel">
      <nav v-if="menuOpen" id="mobile-top-tabs-panel" class="mobile-top-tabs__panel" aria-label="移动端主导航">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" @click="closeMenu">
          {{ item.label }}
        </RouterLink>
      </nav>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'

const props = withDefaults(
  defineProps<{
    searchOpen?: boolean
  }>(),
  {
    searchOpen: false,
  }
)

const route = useRoute()
const { isLoggedIn } = storeToRefs(useAuthStore())

const rootRef = ref<HTMLElement | null>(null)
const menuOpen = ref(false)

const navItems = computed(() => [
  {
    to: '/',
    label: '首页',
    active: route.path === '/',
  },
  {
    to: '/article',
    label: '文章',
    active: route.path === '/article' || route.path.startsWith('/article/') || route.path.startsWith('/search'),
  },
  {
    to: '/write',
    label: '写作',
    active: route.path.startsWith('/write'),
  },
  {
    to: '/about',
    label: isLoggedIn.value ? '个人中心' : '登录',
    active:
      route.path.startsWith('/about') || route.path.startsWith('/login') || route.path.startsWith('/register'),
  },
])

const currentTabLabel = computed(() => navItems.value.find((item) => item.active)?.label ?? '导航')

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function onClickOutside(event: MouseEvent) {
  const target = event.target
  if (rootRef.value && target instanceof Node && !rootRef.value.contains(target)) {
    closeMenu()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  }
)

watch(
  () => props.searchOpen,
  (open) => {
    if (open) closeMenu()
  }
)

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped lang="less">
.mobile-top-tabs {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 108px;
}

.mobile-top-tabs__trigger {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0 0.68rem;
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  background: var(--glass-surface);
  color: var(--ink-main);
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
  box-shadow: inset 0 1px 0 var(--glass-highlight);
  transition:
    border-color 0.22s ease,
    background-color 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.16s ease;
}

.mobile-top-tabs__trigger:active {
  transform: scale(0.985);
}

.mobile-top-tabs__trigger:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--brand-100) 72%, transparent),
    0 10px 22px rgba(15, 23, 42, 0.08);
}

.mobile-top-tabs--open .mobile-top-tabs__trigger {
  border-color: color-mix(in srgb, var(--glass-border) 58%, var(--brand-500) 42%);
  background: color-mix(in srgb, var(--glass-surface) 78%, var(--brand-100) 22%);
  box-shadow:
    0 12px 24px rgba(15, 23, 42, 0.08),
    0 2px 8px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.56);
}

.mobile-top-tabs__current {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1;
}

.mobile-top-tabs__arrow {
  flex: 0 0 auto;
  transition: transform 0.2s cubic-bezier(.4, 0, .2, 1);
}

.mobile-top-tabs__arrow--open {
  transform: rotate(180deg);
}

.mobile-top-tabs__panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: max(100%, 188px);
  max-width: calc(100vw - 1.5rem);
  padding: 0.36rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.3rem;
  overflow: hidden;
  isolation: isolate;
  border-radius: 18px;
  border: 1px solid var(--glass-border);
  background: color-mix(in srgb, var(--glass-surface) 32%, var(--surface-strong) 68%);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur)) saturate(135%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(135%);
  z-index: 50;

  a {
    min-width: 0;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0.74rem 0.9rem;
    border-radius: 13px;
    border: 1px solid transparent;
    background: color-mix(in srgb, var(--glass-surface) 24%, var(--surface-strong) 76%);
    color: var(--ink-muted);
    text-decoration: none;
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.18s ease;
  }

  a.router-link-active {
    color: var(--ink-strong);
    border-color: color-mix(in srgb, var(--brand-100) 88%, transparent);
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--surface-strong) 98%, transparent),
        color-mix(in srgb, var(--surface-overlay) 96%, transparent));
    box-shadow:
      0 8px 18px rgba(15, 23, 42, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.72);
  }

  a:active {
    transform: scale(0.98);
  }
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .mobile-top-tabs__panel {
    background: var(--surface-strong);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-sm);
  }
}

.mobile-top-tabs-panel-enter-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(.4, 0, .2, 1);
}

.mobile-top-tabs-panel-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.mobile-top-tabs-panel-enter-from,
.mobile-top-tabs-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (min-width: 769px) {
  .mobile-top-tabs {
    display: none;
  }
}
</style>
