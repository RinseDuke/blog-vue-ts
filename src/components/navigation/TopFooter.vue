<template>
  <footer class="footer">
    <div class="footer__content">
      <p><strong>墨言社区</strong><span>写作、思考与工程实践</span></p>
      <nav aria-label="页脚导航">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/article">全部主题</RouterLink>
        <RouterLink to="/write">发起主题</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
      <small>&copy; {{ new Date().getFullYear() }} 墨言社区</small>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped lang="less">
.footer {
  margin-top: 2rem;
  padding: 1.4rem 1.25rem 2rem;
  border-top: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--ink-muted);
}

.footer__content {
  width: min(100%, 1280px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1.5rem;
}

.footer p {
  margin: 0;
}

.footer p strong,
.footer p span {
  display: block;
}

.footer p strong {
  color: var(--ink-strong);
  font-size: 0.82rem;
}

.footer p span {
  margin-top: 0.15rem;
  font-size: 0.68rem;
}

.footer nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer a {
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 580;
  text-decoration: none;
}

.footer a:hover {
  color: var(--brand-500);
}

.footer small {
  font-size: 0.68rem;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .footer__content {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .footer nav {
    gap: 0.75rem;
  }
}
</style>
