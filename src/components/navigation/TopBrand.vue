<!-- 顶部品牌标识 -->
<template>
  <RouterLink to="/" class="brand">
    <img src="@/assets/logo.svg" alt="博客 Logo" />
    <span class="brand__text">
      <strong>Sign</strong>
      <em>博客实验室</em>
    </span>
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped lang="less">
.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--ink-strong);
  text-decoration: none;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
  min-width: fit-content;

  img {
    width: 34px;
    height: 34px;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.12));
  }
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.brand__text strong {
  font-size: 0.97rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.brand__text em {
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ink-muted);
}

@media (max-width: 768px) {
  .brand__text em {
    display: none;
  }
}
</style>
