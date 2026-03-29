# Write Status Bar Material Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `write` 页底部状态栏和发布设置面板使用一致的材质层级，并补齐中文回答规则。

**Architecture:** 通过在全局主题变量中抽出 write 页面共用 surface token，让 `PublishPanel` 和 `StatusBar` 共享相同的卡片背景、边框与阴影。状态栏保留固定定位，但新增内部壳层结构来承接统一的材质、按钮和下拉菜单表现，同时调整 `Write.vue` 的底部安全区以适配新高度。

**Tech Stack:** Vue 3、TypeScript、Less、Vitest、Vite

---

### Task 1: 为状态栏材质结构建立回归测试

**Files:**
- Create: `src/components/post/StatusBar.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('StatusBar source contract', () => {
  it('includes the material shell structure used by the write dock', () => {
    const source = readFileSync(resolve('src/components/post/StatusBar.vue'), 'utf8')

    expect(source).toContain('status-bar__inner')
    expect(source).toContain('status-bar__shell')
    expect(source).toContain('sb-surface-btn')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/post/StatusBar.test.ts`
Expected: FAIL because the new wrapper classes do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```vue
<footer class="status-bar">
  <div class="status-bar__inner">
    <div class="status-bar__shell">
      <!-- existing content -->
    </div>
  </div>
</footer>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/post/StatusBar.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/post/StatusBar.test.ts src/components/post/StatusBar.vue
git commit -m "test: cover write status bar material structure"
```

### Task 2: 抽出 write 页面共享 surface token 并统一面板样式

**Files:**
- Modify: `src/assets/base.css`
- Modify: `src/components/post/PublishPanel.vue`

- [ ] **Step 1: Add shared write surface tokens**

```css
:root {
  --write-panel-border: var(--line-soft);
  --write-panel-shadow: var(--shadow-sm);
  --write-panel-bg:
    radial-gradient(circle at top left, color-mix(in srgb, var(--brand-100) 72%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 98%, transparent), color-mix(in srgb, var(--surface) 96%, transparent));
}
```

- [ ] **Step 2: Update publish panel to use the new tokens**

```less
.publish-panel__card {
  border: 1px solid var(--write-panel-border);
  background: var(--write-panel-bg);
  box-shadow: var(--write-panel-shadow);
}
```

- [ ] **Step 3: Run the targeted test**

Run: `npm run test:run -- src/components/post/StatusBar.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/assets/base.css src/components/post/PublishPanel.vue
git commit -m "style: share write page surface tokens"
```

### Task 3: 重构状态栏结构并统一交互控件材质

**Files:**
- Modify: `src/components/post/StatusBar.vue`
- Modify: `src/views/Write.vue`
- Modify: `AGENTS.md`

- [ ] **Step 1: Wrap the fixed bar with aligned inner containers**

```vue
<footer class="status-bar">
  <div class="status-bar__inner">
    <div class="status-bar__shell">
      <!-- left and right groups -->
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Convert text buttons to surface buttons and align the menu**

```less
.sb-surface-btn {
  border: 1px solid color-mix(in srgb, var(--write-panel-border) 92%, transparent);
  background: color-mix(in srgb, var(--surface-strong) 82%, transparent);
}
```

- [ ] **Step 3: Increase write page bottom safe area**

```less
.write-page {
  padding-bottom: calc(var(--write-status-bar-height, 92px) + 24px);
}
```

- [ ] **Step 4: Record the Chinese response rule**

```md
## Communication

- Default to replying to the user in Chinese unless they explicitly ask for another language.
```

- [ ] **Step 5: Run the targeted test**

Run: `npm run test:run -- src/components/post/StatusBar.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/post/StatusBar.vue src/views/Write.vue AGENTS.md
git commit -m "style: unify write status bar material"
```

### Task 4: 完整验证

**Files:**
- Verify only

- [ ] **Step 1: Run runtime verification**

Run: `npm run build`
Expected: exit code 0

- [ ] **Step 2: Run type checking**

Run: `npm run type-check`
Expected: exit code 0

- [ ] **Step 3: Run visual regression on write page**

Run the app or preview and verify:
- desktop light
- desktop dark
- mobile light
- mobile dark

- [ ] **Step 4: Commit verification artifacts if needed**

```bash
git add .codex-artifacts
git commit -m "chore: capture write page visual regression"
```
