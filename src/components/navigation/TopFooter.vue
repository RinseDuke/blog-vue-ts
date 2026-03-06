<template>
  <footer class="footer">
    <p>&copy; {{ new Date().getFullYear() }} Sign 博客</p>
  </footer>
</template>

<style scoped lang="less">
.footer {
  padding: 1rem 1.2rem 1.2rem;
  text-align: center;
  color: var(--ink-muted);
  background: transparent;
  border-top: 1px solid var(--line-soft);
}

.footer p {
  font-size: 0.88rem;
  letter-spacing: 0.02em;
}
</style>


