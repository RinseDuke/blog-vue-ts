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
  gap: 0.35rem;
  flex-shrink: 0;
  min-width: fit-content;
  padding: 0.28rem;
  border-radius: 18px;
  border: 1px solid var(--line-soft);
  background: linear-gradient(180deg, var(--surface-frost), var(--surface));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32);

  a {
    color: var(--ink-muted);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.88rem;
    position: relative;
    padding: 0.42rem 0.8rem;
    border-radius: 999px;
    transition: color var(--motion-base) var(--ease-out-quint);

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

      &::after {
        transform: translateX(-50%) scaleX(1);
      }
    }

    &:hover {
      color: var(--ink-strong);
    }
  }
}

@media (max-width: 768px) {
  .navigation {
    display: none;
  }
}
</style>
