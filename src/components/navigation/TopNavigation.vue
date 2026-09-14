<template>
  <nav class="navigation">
    <RouterLink to="/article">浏览主题</RouterLink>
    <RouterLink class="navigation__compose" to="/write">发起主题</RouterLink>
    <RouterLink to="/about">{{ isLoggedIn ? '我的账户' : '登录' }}</RouterLink>
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
  gap: 0.35rem;
  flex-shrink: 0;
  min-width: fit-content;

  a {
    color: var(--ink-muted);
    text-decoration: none;
    font-weight: 620;
    font-size: 0.84rem;
    position: relative;
    padding: 0.5rem 0.7rem;
    border-radius: var(--radius-sm);
    transition: color var(--motion-base) var(--ease-out);

    &.router-link-active {
      color: var(--ink-strong);
      background: var(--surface-hover);
    }

    &:hover {
      color: var(--ink-strong);

      background: var(--surface-hover);
    }
  }

  .navigation__compose {
    background: var(--brand-500);
    color: var(--on-accent);

    &:hover,
    &.router-link-active {
      background: var(--brand-400);
      color: var(--on-accent);
    }
  }
}

@media (max-width: 768px) {
  .navigation {
    display: none;
  }
}
</style>
