<!-- 全局页脚 -->
<template>
  <footer class="footer">
    <p>&copy; {{ new Date().getFullYear() }} Sign 博客</p>
  </footer>
</template>

<style scoped lang="less">
.footer {
  padding: 1.35rem 1rem 1.8rem;
  color: var(--ink-muted);
  background: transparent;
}

.footer p {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding-top: 1.1rem;
  text-align: center;
  border-top: 1px solid var(--line-soft);
  font-size: 0.88rem;
  letter-spacing: 0.02em;
}
</style>


