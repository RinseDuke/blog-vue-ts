<template>
  <footer class="footer">
    <p>&copy; {{ new Date().getFullYear() }} Sign Blog</p>
  </footer>
</template>

<style scoped lang="less">
.footer {
  padding: 2.2rem 1.2rem 2.6rem;
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
