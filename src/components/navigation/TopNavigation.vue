<!-- 顶部导航链接列表 -->
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
    transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

    &.router-link-active {
      color: var(--ink-strong);
      background: var(--surface-strong);
      box-shadow:
        0 8px 20px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }

    &:hover {
      color: var(--ink-strong);
      background: var(--surface-hover);
      transform: translateY(-1px);
    }
  }
}

@media (max-width: 768px) {
  .navigation {
    width: 100%;
    justify-content: flex-start;
    gap: 0.3rem;
    order: 3;
    overflow-x: auto;
    white-space: nowrap;
    border-radius: 16px;
    padding: 0.3rem;
    scrollbar-width: none;
  }

  .navigation::-webkit-scrollbar {
    display: none;
  }
}
</style>
