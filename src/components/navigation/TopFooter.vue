<template>
  <footer class="footer">
    <div class="footer__content">
      <div class="footer__columns">
        <div class="footer__column">
          <h3 class="footer__title">关于</h3>
          <ul class="footer__links">
            <li><a href="/about">关于我们</a></li>
            <li><a href="/about">联系方式</a></li>
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
        <div class="footer__column">
          <h3 class="footer__title">资源</h3>
          <ul class="footer__links">
            <li><a href="#">文档</a></li>
            <li><a href="#">API</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <p class="footer__copyright">&copy; {{ new Date().getFullYear() }} Sign 博客. All rights reserved.</p>
        <div class="footer__social">
          <a href="#" class="footer__social-link" aria-label="GitHub">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </a>
          <a href="#" class="footer__social-link" aria-label="Email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </a>
          <a href="#" class="footer__social-link" aria-label="RSS">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 11a9 9 0 0 1 9 9"/>
              <path d="M4 4a16 16 0 0 1 16 16"/>
              <circle cx="5" cy="19" r="1"/>
            </svg>
          </a>
        </div>
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
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line-soft);
  flex-wrap: wrap;
  gap: 1rem;
}

.footer__copyright {
  font-size: 0.88rem;
  margin: 0;
}

.footer__social {
  display: flex;
  gap: 0.8rem;
}

.footer__social-link {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-muted);
  border-radius: 8px;
  transition: color var(--motion-base) var(--ease-out), background-color var(--motion-base) var(--ease-out);
}

.footer__social-link:hover {
  color: var(--brand-500);
  background: var(--surface-hover);
}

.footer__social-link svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 768px) {
  .footer {
    padding: 2rem 0.75rem 1.5rem;
  }

  .footer__columns {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .footer__bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>



