<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <RouterLink to="/" class="brand">
        <img src="@/assets/logo.svg" alt="Blog Logo" />
        <span>Sign</span>
      </RouterLink>

      <nav class="navigation">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/article">文章</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
    </header>

    <RouterView />

    <footer class="footer">
      <p>{{ new Date().getFullYear() }}</p>
    </footer>
  </div>
</template>

<style>
/* 布局 */
.layout {
  width: 100%;
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #f8fafc;

}

/* 顶部导航栏 */
.topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #0f172a;
  color: #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid #1e293b;
  margin: 0;
}

/* 图标标识 */
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1rem;

  img {
    width: 42px;
    height: 42px;
  }
}

.navigation {
  display: flex;
  gap: 1.5rem;

  a {
    color: #cbd5f5;
    text-decoration: none;
    font-weight: 500;
    position: relative;
    padding: 0.25rem 0;

    &.router-link-active::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -0.35rem;
      width: 100%;
      height: 2px;
      background: #60a5fa;
    }

    &:hover {
      color: #fff;
    }
  }
}

.footer {
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
  background: #0f172a;
}

@media (max-width: 768px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .navigation {
    width: 100%;
    justify-content: space-around;
  }
}
</style>
