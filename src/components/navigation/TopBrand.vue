<template>
  <RouterLink to="/" class="brand">
    <img src="@/assets/logo.svg" alt="博客 Logo" />
    <span class="brand__text">
      <strong>Sign</strong>
      <!-- <em></em> -->
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
  min-height: 44px;
  padding: 0.15rem 0.25rem 0.15rem 0.15rem;
  border-radius: 14px;
  transition:
    color var(--motion-base) var(--ease-out),
    background-color var(--motion-base) var(--ease-out);

  &:hover {
    background: color-mix(in srgb, var(--glass-surface) 66%, transparent);
  }

  img {
    width: 34px;
    height: 34px;
    padding: 0.2rem;
    border: 1px solid var(--glass-border);
    border-radius: 11px;
    background: var(--glass-surface);
    box-shadow:
      inset 0 1px 0 var(--glass-highlight),
      0 7px 16px color-mix(in srgb, var(--glass-border) 36%, transparent);
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
  letter-spacing: 0.03em;
}

.brand__text em {
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ink-muted);
}

@media (max-width: 768px) {
  .brand {
    gap: 0.42rem;
    min-height: 52px;
    padding-right: 0.15rem;
  }

  .brand img {
    width: 32px;
    height: 32px;
  }

  .brand__text em {
    display: none;
  }
}

@media (max-width: 360px) {
  .brand__text {
    display: none;
  }
}
</style>
