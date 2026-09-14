<template>
  <RouterLink to="/" class="brand" aria-label="墨言社区首页">
    <span class="brand__glyph" aria-hidden="true">墨</span>
    <span class="brand__text">
      <strong>墨言社区</strong>
      <em>写作与讨论</em>
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
  gap: 0.55rem;
  color: var(--ink-strong);
  text-decoration: none;
  flex-shrink: 0;
  min-width: fit-content;
}

.brand__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--ink-strong);
  color: var(--on-accent);
  font-size: 0.88rem;
  font-weight: 720;
  line-height: 1;
  border-radius: 10px;
  user-select: none;
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand__text strong {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 720;
  letter-spacing: 0;
}

.brand__text em {
  font-style: normal;
  font-size: 0.64rem;
  font-weight: 520;
  color: var(--ink-muted);
}

@media (max-width: 768px) {
  .brand__text em {
    display: none;
  }
}
</style>
