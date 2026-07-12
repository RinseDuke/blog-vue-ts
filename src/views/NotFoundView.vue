<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <section class="not-found" aria-labelledby="not-found-title">
    <div class="not-found__edition" aria-hidden="true">
      <span>THE INK GAZETTE</span>
      <span>LOST EDITION</span>
    </div>

    <div class="not-found__rule" aria-hidden="true"></div>

    <div class="not-found__body">
      <p class="not-found__kicker">请求的版面未能付印</p>
      <h1 id="not-found-title" class="not-found__title">
        <span class="not-found__code">404</span>
        页面不存在
      </h1>
      <p class="not-found__summary">这条链接可能已经迁移、失效，或从未被收录。</p>

      <p class="not-found__path-label">当前路径</p>
      <code class="not-found__path">{{ route.fullPath }}</code>

      <nav class="not-found__actions" aria-label="页面恢复选项">
        <RouterLink to="/" class="not-found__action not-found__action--primary">返回首页</RouterLink>
        <RouterLink to="/article" class="not-found__action">浏览文章</RouterLink>
      </nav>
    </div>

    <div class="not-found__footer-rule" aria-hidden="true"></div>
    <p class="not-found__folio" aria-hidden="true">错误号 · 404</p>
  </section>
</template>

<style scoped lang="less">
.not-found {
  width: min(920px, calc(100% - 3rem));
  min-height: clamp(520px, 68vh, 720px);
  margin: 0 auto;
  padding: 3.2rem 0 4.5rem;
  color: var(--ink-main);
}

.not-found__edition {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
}

.not-found__rule {
  height: 5px;
  margin-top: 0.65rem;
  border-top: 3px solid var(--rule-ink);
  border-bottom: 1px solid var(--rule-ink);
}

.not-found__body {
  display: grid;
  justify-items: center;
  padding: clamp(4rem, 10vw, 7.5rem) 1.5rem clamp(3.5rem, 8vw, 6rem);
  text-align: center;
}

.not-found__kicker,
.not-found__path-label,
.not-found__folio {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.not-found__kicker {
  color: var(--brand-500);
}

.not-found__title {
  display: grid;
  gap: 0.25rem;
  margin: 0.7rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 7vw, 4.75rem);
  font-weight: 800;
  line-height: 1;
  color: var(--ink-strong);
}

.not-found__code {
  font-size: clamp(5.5rem, 20vw, 12rem);
  line-height: 0.82;
  letter-spacing: -0.06em;
}

.not-found__summary {
  max-width: 34rem;
  margin-top: 1.4rem;
  font-size: var(--text-lg);
  line-height: 1.7;
  color: var(--ink-muted);
}

.not-found__path-label {
  margin-top: 2.25rem;
  color: var(--ink-muted);
}

.not-found__path {
  max-width: 100%;
  margin-top: 0.5rem;
  padding: 0.55rem 0.8rem;
  overflow-wrap: anywhere;
  border-block: 1px solid var(--line-soft);
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--ink-strong);
}

.not-found__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2.25rem;
}

.not-found__action {
  min-width: 8.5rem;
  padding: 0.72rem 1.2rem;
  border: 1px solid var(--rule-ink);
  color: var(--ink-strong);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 800;
  text-decoration: none;
  transition:
    background var(--motion-base) var(--ease-out),
    color var(--motion-base) var(--ease-out);
}

.not-found__action:hover,
.not-found__action:focus-visible {
  background: var(--ink-strong);
  color: var(--bg-canvas);
}

.not-found__action:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.not-found__action--primary {
  border-color: var(--brand-500);
  background: var(--brand-500);
  color: var(--on-accent);
}

.not-found__action--primary:hover,
.not-found__action--primary:focus-visible {
  border-color: var(--ink-strong);
}

.not-found__footer-rule {
  border-top: 3px double var(--rule-ink);
}

.not-found__folio {
  margin-top: 0.6rem;
  text-align: right;
  color: var(--ink-muted);
}

@media (max-width: 560px) {
  .not-found {
    width: min(920px, calc(100% - 2rem));
    min-height: 0;
    padding: 2rem 0 3rem;
  }

  .not-found__edition span:first-child {
    display: none;
  }

  .not-found__edition {
    justify-content: flex-end;
  }

  .not-found__body {
    padding: 4.5rem 0 4rem;
  }

  .not-found__summary {
    font-size: var(--text-base);
  }

  .not-found__actions,
  .not-found__action {
    width: 100%;
  }
}
</style>
