# Write 主编辑卡统一 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `write` 页标题区与正文编辑画布合并成一张主编辑卡，并保持工具栏位于卡片上方，统一材质层级与深浅色观感。

**Architecture:** 在 `src/views/Write.vue` 中重组主编辑区结构，建立统一的 `editor-main-card` 表面；在 `src/assets/base.css` 中补充主编辑卡 token；必要时微调 `src/components/post/EditorToolbar.vue` 以稳定与主卡片之间的间距关系。通过一个最小 source-contract 测试锁定结构，再完成样式重构和视觉回归。

**Tech Stack:** Vue 3、TypeScript、Less、Vitest、Vite、Chrome DevTools MCP

---

### Task 1: 为主编辑卡结构写回归测试

**Files:**
- Create: `src/views/Write.test.ts`
- Test: `src/views/Write.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import source from './Write.vue?raw'

describe('Write view source contract', () => {
  it('keeps the toolbar above a unified editor main card', () => {
    expect(source).toContain('editor-main-card')
    expect(source).toContain('editor-main-card__header')
    expect(source).toContain('editor-main-card__canvas')
    expect(source.indexOf('<EditorToolbar')).toBeLessThan(source.indexOf('editor-main-card'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/views/Write.test.ts`
Expected: FAIL because the new main-card structure does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```vue
<EditorToolbar :editor="editor || null" />
<section class="editor-main-card">
  <div class="editor-main-card__header"></div>
  <div class="editor-main-card__canvas"></div>
</section>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/views/Write.test.ts`
Expected: PASS

### Task 2: 重组 Write 主编辑区结构

**Files:**
- Modify: `src/views/Write.vue`

- [ ] **Step 1: Move toolbar above the main editor card**

```vue
<div class="editor-main">
  <EditorToolbar :editor="editor || null" />
  <section class="editor-main-card">
```

- [ ] **Step 2: Split title area and canvas area inside the same card**

```vue
<header class="editor-main-card__header">
  <input class="title-input" />
</header>
<div class="editor-main-card__canvas"></div>
```

- [ ] **Step 3: Wrap live / source / read in a shared canvas container**

```vue
<div class="editor-canvas editor-canvas--live"></div>
<div class="editor-canvas editor-canvas--source"></div>
<div class="editor-canvas editor-canvas--read"></div>
```

- [ ] **Step 4: Run the new structure test**

Run: `npm run test:run -- src/views/Write.test.ts`
Expected: PASS

### Task 3: 统一主编辑卡材质与模式画布样式

**Files:**
- Modify: `src/views/Write.vue`
- Modify: `src/assets/base.css`
- Modify: `src/components/post/EditorToolbar.vue`（仅在需要时）

- [ ] **Step 1: Add write main-card tokens**

```css
:root {
  --write-editor-card-bg: ...;
  --write-editor-canvas-bg: ...;
  --write-editor-divider: ...;
}
```

- [ ] **Step 2: Apply the card shell and internal spacing**

```less
.editor-main-card {
  border: 1px solid var(--write-panel-border);
  background: var(--write-editor-card-bg);
}
```

- [ ] **Step 3: Soften source / read / live canvas transitions**

```less
.editor-canvas {
  background: var(--write-editor-canvas-bg);
  border: 1px solid var(--write-editor-canvas-border);
}
```

- [ ] **Step 4: Tune responsive spacing**

Run: ensure desktop and mobile still keep clear toolbar/card separation without crowding.

- [ ] **Step 5: Run relevant tests**

Run: `npm run test:run -- src/views/Write.test.ts src/components/post/EditorToolbar.test.ts src/components/post/StatusBar.test.ts`
Expected: PASS

### Task 4: 完整验证

**Files:**
- Verify only

- [ ] **Step 1: Run type checking**

Run: `npm run type-check`
Expected: exit code 0

- [ ] **Step 2: Run runtime verification**

Run: `npm run build`
Expected: exit code 0

- [ ] **Step 3: Perform visual regression on write page**

Verify:
- desktop light
- desktop dark
- mobile light
- mobile dark
- toolbar above main editor card
- live / source / read card material continuity
