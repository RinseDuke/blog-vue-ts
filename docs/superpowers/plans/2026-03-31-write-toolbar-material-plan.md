# Write Toolbar Material Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一 `write` 页顶部工具栏的材质层级，同时保持所有工具直接可见。

**Architecture:** 复用 write 页面已有的 surface token，把 `EditorToolbar` 从扁平条重构为卡片式 sticky 容器，并让分组和按钮进入同一套按钮系统。通过一个最小源码契约测试锁定新结构，再完成样式重构和视觉验证。

**Tech Stack:** Vue 3、TypeScript、Less、Vitest、Vite、Chrome DevTools MCP

---

### Task 1: 为工具栏新结构建立回归测试

**Files:**
- Create: `src/components/post/EditorToolbar.test.ts`
- Test: `src/components/post/EditorToolbar.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import source from './EditorToolbar.vue?raw'

describe('EditorToolbar source contract', () => {
  it('includes the shared surface structure for the write toolbar', () => {
    expect(source).toContain('editor-toolbar__surface')
    expect(source).toContain('toolbar-group--surface')
    expect(source).toContain('toolbar-btn--surface')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/post/EditorToolbar.test.ts`
Expected: FAIL because the new toolbar classes do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```vue
<div class="editor-toolbar">
  <div class="editor-toolbar__surface">
    <div class="toolbar-group toolbar-group--surface"></div>
    <button class="toolbar-btn toolbar-btn--surface"></button>
  </div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/post/EditorToolbar.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/post/EditorToolbar.test.ts src/components/post/EditorToolbar.vue
git commit -m "test: cover write toolbar surface structure"
```

### Task 2: 重构工具栏卡片容器、分组和按钮材质

**Files:**
- Modify: `src/components/post/EditorToolbar.vue`
- Modify: `src/assets/base.css`
- Modify: `src/views/Write.vue`

- [ ] **Step 1: Add toolbar surface tokens if needed**

```css
:root {
  --write-toolbar-group-bg: color-mix(in srgb, var(--write-panel-inline-bg) 84%, transparent);
  --write-toolbar-sticky-top: 18px;
}
```

- [ ] **Step 2: Wrap toolbar content in a surface shell**

```vue
<div class="editor-toolbar" v-if="editor">
  <div class="editor-toolbar__surface">
    <!-- existing groups -->
  </div>
</div>
```

- [ ] **Step 3: Upgrade group containers and button classes**

```vue
<div class="toolbar-group toolbar-group--surface">
  <button class="toolbar-btn toolbar-btn--surface"></button>
</div>
```

- [ ] **Step 4: Rebuild sticky, group and button styles**

```less
.editor-toolbar__surface {
  border: 1px solid var(--write-panel-border);
  background: var(--write-panel-bg);
  box-shadow: var(--write-panel-shadow), var(--write-panel-inset-shadow);
}
```

- [ ] **Step 5: Tighten mobile layout without hiding actions**

```less
@media (max-width: 768px) {
  .toolbar-group--surface {
    width: 100%;
    justify-content: flex-start;
  }
}
```

- [ ] **Step 6: Run targeted tests**

Run: `npm run test:run -- src/components/post/EditorToolbar.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/post/EditorToolbar.vue src/assets/base.css src/views/Write.vue
git commit -m "style: unify write toolbar material"
```

### Task 3: 完整验证

**Files:**
- Verify only

- [ ] **Step 1: Run toolbar tests**

Run: `npm run test:run -- src/components/post/EditorToolbar.test.ts`
Expected: PASS

- [ ] **Step 2: Run existing status bar regression**

Run: `npm run test:run -- src/components/post/StatusBar.test.ts`
Expected: PASS

- [ ] **Step 3: Run type checking**

Run: `npm run type-check`
Expected: exit code 0

- [ ] **Step 4: Run runtime verification**

Run: `npm run build`
Expected: exit code 0

- [ ] **Step 5: Run visual regression on write page**

Verify:
- desktop light
- desktop dark
- mobile light
- mobile dark
- sticky toolbar state
- active / hover toolbar controls

- [ ] **Step 6: Commit verification artifacts if needed**

```bash
git add .codex-artifacts
git commit -m "chore: capture write toolbar visual regression"
```
