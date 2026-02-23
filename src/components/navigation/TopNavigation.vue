<template>
  <nav class="navigation">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/article">Articles</RouterLink>
    <RouterLink to="/write">Write</RouterLink>
    <RouterLink to="/about">About</RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped lang="less">
.navigation {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
  min-width: fit-content;
  padding: 0.25rem;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.74);

  a {
    color: var(--ink-muted);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.88rem;
    position: relative;
    padding: 0.42rem 0.8rem;
    border-radius: 999px;
    transition: color 0.2s ease, background-color 0.2s ease;

    &.router-link-active {
      color: var(--ink-strong);
      background: #fff;
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
    }

    &:hover {
      color: var(--ink-strong);
      background: rgba(255, 255, 255, 0.82);
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
  }
}
</style>
