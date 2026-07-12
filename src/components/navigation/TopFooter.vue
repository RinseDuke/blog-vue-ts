<template>
  <footer class="footer">
    <div class="footer__content">
      <div class="footer__columns">
        <div class="footer__column">
          <h3 class="footer__title">关于</h3>
          <ul class="footer__links">
            <li><RouterLink to="/about">个人中心</RouterLink></li>
          </ul>
        </div>
        <div class="footer__column">
          <h3 class="footer__title">导航</h3>
          <ul class="footer__links">
            <li><RouterLink to="/">首页</RouterLink></li>
            <li><RouterLink to="/article">文章</RouterLink></li>
            <li><RouterLink to="/write">写作</RouterLink></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <p class="footer__copyright">&copy; {{ new Date().getFullYear() }} Sign 博客. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped lang="less">
.footer {
  padding: 3rem 1rem 2rem;
  color: var(--ink-muted);
  background: transparent;
  border-top: 1px solid var(--line-soft);
  margin-top: 4rem;
}

.footer__content {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.footer__columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.footer__column {
  min-width: 0;
}

.footer__title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--ink-strong);
  margin-bottom: 0.8rem;
  letter-spacing: 0.02em;
}

.footer__links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer__links a {
  color: var(--ink-muted);
  text-decoration: none;
  font-size: 0.88rem;
  transition: color var(--motion-base) var(--ease-out);
}

.footer__links a:hover {
  color: var(--brand-500);
}

.footer__bottom {
  padding-top: 1.5rem;
  border-top: 1px solid var(--line-soft);
  text-align: center;
}

.footer__copyright {
  font-size: 0.88rem;
  margin: 0;
}

@media (max-width: 768px) {
  .footer {
    padding: 2rem 0.75rem 1.5rem;
  }

  .footer__columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

}
</style>



