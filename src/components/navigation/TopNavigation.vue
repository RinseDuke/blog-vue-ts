<template>
  <nav class="navigation">
    <RouterLink to="/">首页</RouterLink>
    <RouterLink to="/article">文章</RouterLink>
    <RouterLink to="/write">写作</RouterLink>
    <RouterLink to="/about">{{ isLoggedIn ? '个人中心' : '登录' }}</RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'

const { isLoggedIn } = storeToRefs(useAuthStore())
</script>

<style scoped lang="less">
.navigation {
  display: flex;
  gap: 0.2rem;
  flex-shrink: 0;
  min-width: fit-content;
  padding: 0.22rem;
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  background: var(--glass-surface);
  box-shadow: inset 0 1px 0 var(--glass-highlight);

  a {
    color: var(--ink-muted);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.88rem;
    position: relative;
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    padding: 0.38rem 0.72rem;
    border: 1px solid transparent;
    border-radius: 11px;
    transition:
      color var(--motion-base) var(--ease-out-quint),
      background-color var(--motion-base) var(--ease-out),
      border-color var(--motion-base) var(--ease-out),
      box-shadow var(--motion-base) var(--ease-out);

    &::after {
      content: '';
      position: absolute;
      bottom: 0.3rem;
      left: 50%;
      transform: translateX(-50%) scaleX(0);
      width: calc(100% - 1.6rem);
      height: 2px;
      background: var(--brand-500);
      border-radius: 2px;
      transition: transform var(--motion-base) var(--ease-out-quint);
    }

    &.router-link-active {
      color: var(--ink-strong);
      border-color: color-mix(in srgb, var(--glass-border) 72%, var(--brand-500) 28%);
      background: color-mix(in srgb, var(--glass-surface) 72%, var(--surface-strong) 28%);
      box-shadow: inset 0 1px 0 var(--glass-highlight);

      &::after {
        transform: translateX(-50%) scaleX(1);
      }
    }

    &:hover {
      color: var(--ink-strong);
      background: color-mix(in srgb, var(--glass-surface) 84%, var(--surface-hover) 16%);
    }
  }
}

.navigation a.router-link-active:focus-visible {
  box-shadow: var(--focus-ring), inset 0 1px 0 var(--glass-highlight);
}

:global(html[data-theme='dark']) .navigation {
  background: var(--glass-surface) !important;
}

@media (max-width: 768px) {
  .navigation {
    display: none;
  }
}
</style>
