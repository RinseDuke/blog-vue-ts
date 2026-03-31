# Write Slim Focus Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `WritePage` 收敛为“主内容优先”的写作界面，通过单行紧凑工具栏、统一控制面板材质和更克制的间距节奏，减少工具区占用并提升整体一致性。

**Architecture:** 保持 `WritePage` 现有主结构不变，重点重构 `EditorToolbar` 为一行常驻高频按钮加“更多”菜单的组合，再同步调整 `Write.vue`、`PublishPanel.vue` 和 `StatusBar.vue` 的容器密度与视觉层级。测试层继续使用现有的源码契约测试模式，先锁定新结构，再实施 UI 改动并完成浏览器回归。

**Tech Stack:** Vue 3、TypeScript、Less、Vitest、Vite、Chrome DevTools MCP

---

## File Structure

- `src/components/post/EditorToolbar.vue`
  负责一行紧凑工具栏、常驻高频操作、“更多”菜单和对应交互状态。
- `src/components/post/EditorToolbar.test.ts`
  锁定工具栏的单行 compact 结构与“更多”菜单入口。
- `src/views/Write.vue`
  负责工具栏与主编辑卡的节奏关系，保证工具栏仍在主编辑卡上方且占用更小。
- `src/views/Write.test.ts`
  锁定 `WritePage` 上工具栏与主编辑卡的结构关系。
- `src/components/post/PublishPanel.vue`
  下调发布设置的材质强度，让它更像附属设置区。
- `src/components/post/StatusBar.vue`
  收敛底部状态栏的按钮密度和外层材质，使其与新工具栏属于同一系统。
- `src/assets/base.css`
  复用并补充 write 页共享 token，避免把视觉差异散落在单文件里。

### Task 1: 用失败测试锁定单行工具栏和页面结构

**Files:**
- Modify: `src/components/post/EditorToolbar.test.ts`
- Modify: `src/views/Write.test.ts`
- Test: `src/components/post/EditorToolbar.test.ts`
- Test: `src/views/Write.test.ts`

- [ ] **Step 1: Write the failing toolbar source contract**

```ts
import source from './EditorToolbar.vue?raw'

describe('EditorToolbar source contract', () => {
  it('renders a compact single-row toolbar with a more menu trigger', () => {
    expect(source).toContain('editor-toolbar__track')
    expect(source).toContain('toolbar-btn--compact')
    expect(source).toContain('toolbar-more')
    expect(source).toContain('toolbar-more__menu')
  })
})
```

- [ ] **Step 2: Write the failing write page source contract**

```ts
import source from './Write.vue?raw'

describe('Write view source contract', () => {
  it('keeps the toolbar above the editor card with a compact toolbar wrapper', () => {
    expect(source).toContain('editor-toolbar-wrap')
    expect(source).toContain('editor-main-card')
    expect(source.indexOf('editor-toolbar-wrap')).toBeLessThan(source.indexOf('editor-main-card'))
  })
})
```

- [ ] **Step 3: Run the focused tests to verify they fail for the expected reason**

Run: `npm run test:run -- src/components/post/EditorToolbar.test.ts src/views/Write.test.ts`
Expected: FAIL because `EditorToolbar.vue` and `Write.vue` do not yet include `editor-toolbar__track`, `toolbar-more`, `toolbar-more__menu`, or `editor-toolbar-wrap`.

- [ ] **Step 4: Run the required local Vitest check in run mode**

Run: `npm test -- --run src/components/post/EditorToolbar.test.ts src/views/Write.test.ts`
Expected: FAIL with the same missing-source assertions, confirming the required `npm test` pass is using the new tests.

- [ ] **Step 5: Commit the red-state tests**

```bash
git add src/components/post/EditorToolbar.test.ts src/views/Write.test.ts
git commit -m "test: lock write slim focus toolbar structure"
```

### Task 2: 重构 `EditorToolbar` 为一行 compact 常驻工具栏

**Files:**
- Modify: `src/components/post/EditorToolbar.vue`
- Test: `src/components/post/EditorToolbar.test.ts`

- [ ] **Step 1: Add compact toolbar state for the more menu**

```ts
import { Editor } from '@tiptap/vue-3'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  editor: Editor | null
}>()

const menuOpen = ref(false)
const moreRef = ref<HTMLElement | null>(null)

function toggleMoreMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMoreMenu() {
  menuOpen.value = false
}

function onClickOutside(event: MouseEvent) {
  if (moreRef.value && !moreRef.value.contains(event.target as Node)) {
    closeMoreMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
```

- [ ] **Step 2: Rewrite the template to separate primary actions from the more menu**

```vue
<template>
  <div v-if="editor" class="editor-toolbar">
    <div class="editor-toolbar__surface">
      <div class="editor-toolbar__track">
        <button type="button" class="toolbar-btn toolbar-btn--compact" title="撤销 (Ctrl+Z)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
          <span class="toolbar-label">撤销</span>
        </button>

        <button type="button" class="toolbar-btn toolbar-btn--compact">
          <span class="toolbar-icon-text">H2</span>
          <span class="toolbar-label">H2</span>
        </button>

        <button type="button" class="toolbar-btn toolbar-btn--compact">
          <span class="toolbar-icon-text">B</span>
          <span class="toolbar-label">加粗</span>
        </button>

        <div ref="moreRef" class="toolbar-more">
          <button
            type="button"
            class="toolbar-btn toolbar-btn--compact toolbar-btn--more"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            @click="toggleMoreMenu"
          >
            <span class="toolbar-label">更多</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="1,1 5,5 9,1" />
            </svg>
          </button>

          <Transition name="toolbar-more-menu">
            <div v-if="menuOpen" class="toolbar-more__menu" role="menu">
              <button type="button" class="toolbar-more__item" role="menuitem">删除线</button>
              <button type="button" class="toolbar-more__item" role="menuitem">有序列表</button>
              <button type="button" class="toolbar-more__item" role="menuitem">链接</button>
              <button type="button" class="toolbar-more__item" role="menuitem">表格</button>
              <button type="button" class="toolbar-more__item" role="menuitem">分割线</button>
              <button type="button" class="toolbar-more__item" role="menuitem">清空格式</button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Replace the old multi-row grouping styles with a single-row compact track**

```less
.editor-toolbar {
  position: sticky;
  top: 0;
  z-index: 12;
  padding: 8px 0 0;
  margin-bottom: 10px;
}

.editor-toolbar__surface {
  border: 1px solid var(--write-toolbar-border);
  border-radius: 18px;
  background: var(--write-toolbar-bg);
  box-shadow: var(--write-toolbar-shadow), var(--write-panel-inset-shadow);
  backdrop-filter: blur(16px);
}

.editor-toolbar__track {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.editor-toolbar__track::-webkit-scrollbar {
  display: none;
}

.toolbar-btn--compact {
  min-width: 44px;
  min-height: 42px;
  padding: 8px 10px;
  gap: 4px;
  border-radius: 12px;
}
```

- [ ] **Step 4: Add the more menu styles with the same interaction language as the mode menu**

```less
.toolbar-more {
  position: relative;
  margin-left: auto;
  flex: 0 0 auto;
}

.toolbar-more__menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 168px;
  padding: 6px;
  border: 1px solid var(--write-panel-border);
  border-radius: 14px;
  background: var(--write-panel-bg);
  box-shadow: var(--write-panel-shadow);
  backdrop-filter: blur(16px);
}

.toolbar-more__item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--ink-main);
}
```

- [ ] **Step 5: Re-run the focused tests until they pass**

Run: `npm run test:run -- src/components/post/EditorToolbar.test.ts src/views/Write.test.ts`
Expected: PASS

- [ ] **Step 6: Run the required local `npm test` check after editing the Vue component**

Run: `npm test -- --run src/components/post/EditorToolbar.test.ts src/views/Write.test.ts`
Expected: PASS

- [ ] **Step 7: Commit the compact toolbar refactor**

```bash
git add src/components/post/EditorToolbar.vue src/components/post/EditorToolbar.test.ts src/views/Write.test.ts
git commit -m "improve: compact write toolbar actions"
```

### Task 3: 收敛 `WritePage` 其余控制区的材质和节奏

**Files:**
- Modify: `src/views/Write.vue`
- Modify: `src/components/post/PublishPanel.vue`
- Modify: `src/components/post/StatusBar.vue`
- Modify: `src/assets/base.css`
- Test: `src/views/Write.test.ts`
- Test: `src/components/post/StatusBar.test.ts`

- [ ] **Step 1: Add shared write toolbar tokens in the base stylesheet**

```css
:root {
  --write-toolbar-bg:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 98%, transparent), color-mix(in srgb, var(--surface) 94%, transparent));
  --write-toolbar-border: color-mix(in srgb, var(--line-soft) 92%, transparent);
  --write-toolbar-shadow:
    0 14px 28px rgba(15, 23, 42, 0.06),
    0 6px 14px rgba(15, 23, 42, 0.04);
}

:root[data-theme='dark'] {
  --write-toolbar-bg:
    linear-gradient(180deg, rgba(23, 29, 39, 0.96), rgba(18, 24, 33, 0.94));
  --write-toolbar-border: rgba(110, 118, 129, 0.28);
  --write-toolbar-shadow:
    0 16px 28px rgba(1, 4, 9, 0.22),
    0 8px 16px rgba(1, 4, 9, 0.14);
}
```

- [ ] **Step 2: Add a dedicated toolbar wrapper above the main card in `Write.vue`**

```vue
<div class="editor-main">
  <div v-if="viewMode === 'live'" class="editor-toolbar-wrap">
    <EditorToolbar :editor="editor || null" />
  </div>

  <section class="editor-main-card">
    <!-- existing title and canvas -->
  </section>
</div>
```

- [ ] **Step 3: Tighten `Write.vue` spacing so the toolbar gives more room back to the editor**

```less
.editor-main {
  max-width: 860px;
  padding: 0 24px 36px;
}

.editor-toolbar-wrap {
  margin-bottom: 8px;
}

.editor-main-card {
  border-radius: 22px;
  box-shadow: var(--write-editor-card-shadow), var(--write-panel-inset-shadow);
}
```

- [ ] **Step 4: Tone down `PublishPanel.vue` so it reads as secondary to the editor**

```less
.publish-panel__card {
  border: 1px solid color-mix(in srgb, var(--write-panel-border) 88%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 94%, transparent), color-mix(in srgb, var(--surface) 88%, transparent));
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05), var(--write-panel-inset-shadow);
  padding: 1.1rem;
}
```

- [ ] **Step 5: Make `StatusBar.vue` denser so it matches the compact toolbar**

```less
.status-bar__shell {
  min-height: 60px;
  padding: 10px 12px;
}

.sb-btn,
.sb-publish {
  min-height: 36px;
}

.sb-chip,
.sb-saved {
  min-height: 34px;
}
```

- [ ] **Step 6: Run the focused source-contract tests**

Run: `npm run test:run -- src/views/Write.test.ts src/components/post/EditorToolbar.test.ts src/components/post/StatusBar.test.ts`
Expected: PASS

- [ ] **Step 7: Run the required local `npm test` check after the Vue file edits**

Run: `npm test -- --run src/views/Write.test.ts src/components/post/EditorToolbar.test.ts src/components/post/StatusBar.test.ts`
Expected: PASS

- [ ] **Step 8: Commit the shared visual tuning**

```bash
git add src/views/Write.vue src/components/post/PublishPanel.vue src/components/post/StatusBar.vue src/assets/base.css src/components/post/StatusBar.test.ts
git commit -m "improve: unify write page control surfaces"
```

### Task 4: Full verification and browser regression

**Files:**
- Verify only

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: exit code 0

- [ ] **Step 2: Run the repository test suite once**

Run: `npm run test:run`
Expected: PASS

- [ ] **Step 3: Run the required local `npm test` check for JavaScript/Vue changes**

Run: `npm test -- --run`
Expected: PASS and exit cleanly after the one-shot run

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: exit code 0 and Vite build output completes successfully

- [ ] **Step 5: Perform browser verification on the write page**

Verify:
- toolbar stays on one row in desktop light mode
- toolbar stays on one row in desktop dark mode
- toolbar remains usable in a narrow/mobile viewport
- “更多”菜单 opens and closes correctly
- title and editor regain visual priority over the control surfaces
- publish panel no longer competes with the main editor card
- bottom status bar feels denser and visually related to the toolbar

- [ ] **Step 6: Commit the finished implementation**

```bash
git add src/components/post/EditorToolbar.vue src/components/post/EditorToolbar.test.ts src/views/Write.vue src/views/Write.test.ts src/components/post/PublishPanel.vue src/components/post/StatusBar.vue src/assets/base.css docs/superpowers/plans/2026-03-31-write-slim-focus-toolbar.md
git commit -m "improve: polish write page slim focus ui"
```
