# GitHub Solid Topbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有悬浮毛玻璃顶栏改成贴顶的实体顶栏，只调整外层骨架和页面顶部留白，不改内部控件逻辑。

**Architecture:** 保留 `App.vue` 里现有桌面端和移动端的控件结构，只把 `TopHeaderLayout.vue` 从“悬浮卡片外壳”改成“实体导航壳”。同时移除 `base.css` 里对 `.topbar__inner` 的暗色毛玻璃覆盖，让浅色和深色都回到同一套实体层级；用源码合同测试把顶栏壳体和页面顶部留白锁住。

**Tech Stack:** Vue 3、TypeScript、Less、Vitest、Vite

---

## File Map

- `src/components/navigation/TopHeaderLayout.vue`
  - 把顶栏外层从透明悬浮容器改成贴顶实体条。
- `src/App.vue`
  - 同步桌面端和移动端的 `padding-top`，保证正文和新顶栏高度匹配。
- `src/assets/base.css`
  - 移除暗色模式下强行给 `.topbar__inner` 注入毛玻璃背景的全局覆盖。
- `src/components/navigation/topHeaderLayout.test.ts`
  - 新增顶栏外层壳体源码合同测试。

## Precondition

- 当前工作区已有未提交改动：`src/components/ui/DropdownSelect.vue`
- 实现过程中不要修改、格式化、暂存或提交这个文件。

### Task 1: Replace The Floating Glass Shell With A Solid Topbar Shell

**Files:**
- Create: `src/components/navigation/topHeaderLayout.test.ts`
- Modify: `src/components/navigation/TopHeaderLayout.vue`
- Modify: `src/App.vue`
- Modify: `src/assets/base.css`

- [ ] **Step 1: Write the failing topbar shell contract**

Create `src/components/navigation/topHeaderLayout.test.ts` with this content:

```ts
import appSource from '@/App.vue?raw'
import topHeaderLayoutSource from './TopHeaderLayout.vue?raw'
import baseCssSource from '@/assets/base.css?raw'

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findBlockRange(source: string, selector: string) {
  const pattern = new RegExp(`${escapeForRegExp(selector)}\\s*\\{`)
  const match = pattern.exec(source)

  if (!match) {
    throw new Error(`Missing block for ${selector}`)
  }

  const openBraceIndex = match.index + match[0].length - 1
  let depth = 0

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const currentChar = source[index]

    if (currentChar === '{') {
      depth += 1
    }

    if (currentChar === '}') {
      depth -= 1

      if (depth === 0) {
        return {
          blockStart: openBraceIndex + 1,
          blockEnd: index,
        }
      }
    }
  }

  throw new Error(`Unclosed block for ${selector}`)
}

function extractBlock(source: string, selector: string) {
  const range = findBlockRange(source, selector)
  return source.slice(range.blockStart, range.blockEnd)
}

describe('top header layout source contract', () => {
  it('uses a solid topbar shell instead of a floating glass card', () => {
    const topbarBlock = extractBlock(topHeaderLayoutSource, '.topbar')
    const topbarInnerBlock = extractBlock(topHeaderLayoutSource, '.topbar__inner')
    const layoutBlock = extractBlock(appSource, '.layout')
    const mobileMediaBlock = extractBlock(topHeaderLayoutSource, '@media \\(max-width: 768px\\)')
    const mobileTopbarBlock = extractBlock(mobileMediaBlock, '.topbar')
    const mobileTopbarInnerBlock = extractBlock(mobileMediaBlock, '.topbar__inner')
    const mobileLayoutMediaBlock = extractBlock(appSource, '@media \\(max-width: 768px\\)')
    const mobileLayoutBlock = extractBlock(mobileLayoutMediaBlock, '.layout')

    expect(topbarBlock).toContain('padding: 0 1.2rem;')
    expect(topbarBlock).toContain('background: color-mix(in srgb, var(--surface-strong) 96%, var(--bg-canvas) 4%);')
    expect(topbarBlock).toContain('border-bottom: 1px solid color-mix(in srgb, var(--line-strong) 82%, transparent);')
    expect(topbarBlock).not.toContain('background: transparent;')

    expect(topbarInnerBlock).toContain('min-height: 68px;')
    expect(topbarInnerBlock).toContain('padding: 0.7rem 0;')
    expect(topbarInnerBlock).not.toContain('border-radius: 24px;')
    expect(topbarInnerBlock).not.toContain('backdrop-filter')
    expect(topbarInnerBlock).not.toContain('box-shadow')

    expect(layoutBlock).toContain('padding-top: 68px;')
    expect(mobileTopbarBlock).toContain('padding: 0 0.75rem;')
    expect(mobileTopbarInnerBlock).toContain('min-height: 72px;')
    expect(mobileTopbarInnerBlock).toContain('padding: 0.55rem 0;')
    expect(mobileLayoutBlock).toContain('padding-top: 72px;')
  })

  it('removes the dark-mode glass override from the topbar inner shell', () => {
    expect(baseCssSource).not.toContain(\"html[data-theme='dark'] .topbar__inner {\")
  })
})
```

- [ ] **Step 2: Run the new shell test to verify it fails**

Run:

```bash
npm run test:run -- src/components/navigation/topHeaderLayout.test.ts
```

Expected: FAIL, because the current topbar still has transparent outer padding, rounded glass inner shell, and the dark-mode `.topbar__inner` override still exists in `src/assets/base.css`.

- [ ] **Step 3: Implement the solid topbar shell**

Update `src/components/navigation/TopHeaderLayout.vue` styles to:

```less
.topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1.2rem;
  background: color-mix(in srgb, var(--surface-strong) 96%, var(--bg-canvas) 4%);
  border-bottom: 1px solid color-mix(in srgb, var(--line-strong) 82%, transparent);
  color: var(--ink-main);
  position: fixed;
  top: 0;
  z-index: 40;
  margin: 0;
  transition: transform 0.32s ease, background-color 0.24s ease, border-color 0.24s ease;
}

.topbar__inner {
  width: min(1220px, 100%);
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  min-height: 68px;
  padding: 0.7rem 0;
}

.topbar.hidden {
  transform: translateY(-100%);
}

@media (max-width: 768px) {
  .topbar {
    padding: 0 0.75rem;
  }

  .topbar__inner {
    display: block;
    min-height: 72px;
    padding: 0.55rem 0;
  }
}
```

Update `src/App.vue` shell spacing to:

```less
.layout {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding-top: 68px;
}

@media (max-width: 768px) {
  .layout {
    padding-top: 72px;
  }
}
```

Remove the dark-mode glass override from `src/assets/base.css` by deleting this block entirely:

```css
html[data-theme='dark'] .topbar__inner {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 94%, transparent), color-mix(in srgb, var(--surface-frost) 98%, transparent)),
    radial-gradient(circle at top left, rgba(105, 180, 255, 0.14), transparent 40%) !important;
}
```

- [ ] **Step 4: Re-run the shell contract and type-check**

Run:

```bash
npm run test:run -- src/components/navigation/topHeaderLayout.test.ts
npm run type-check
```

Expected:

- `src/components/navigation/topHeaderLayout.test.ts` PASS
- `vue-tsc` PASS

- [ ] **Step 5: Commit the solid topbar shell**

```bash
git add src/components/navigation/topHeaderLayout.test.ts src/components/navigation/TopHeaderLayout.vue src/App.vue src/assets/base.css
git commit -m "feat: use a solid topbar shell"
```

### Task 2: Verify The Solid Topbar Across Desktop And Mobile

**Files:**
- Modify: none

- [ ] **Step 1: Run the focused topbar test suite**

Run:

```bash
npm run test:run -- src/components/navigation/topHeaderLayout.test.ts src/components/navigation/mobileTopbar.test.ts
```

Expected: PASS for both files.

- [ ] **Step 2: Run type-check and production build**

Run:

```bash
npm run type-check
npm run build
```

Expected:

- `vue-tsc` PASS
- `vite build` PASS

- [ ] **Step 3: Run the app for runtime verification**

Run:

```bash
npm run dev
```

Expected: Vite starts successfully and prints a local URL.

- [ ] **Step 4: Complete visual regression for the new solid shell**

Manual checks:

- `/` desktop `light`
  - 顶栏贴顶显示，不再有上方留白和悬浮玻璃卡片感
- `/` desktop `dark`
  - 顶栏仍是实体条，和正文分隔线清晰，没有内层毛玻璃壳体
- `/` mobile `light`
  - 顶栏高度收紧，搜索展开后仍然贴着实体顶栏显示
- `/` mobile `dark`
  - 顶栏仍是实体条，没有漂浮模糊边界
- `/` mobile search open
  - 搜索层和顶栏仍对齐，没有因为外层骨架变化出现错位
- `/` mobile nav dropdown open
  - 导航下拉仍从原位置展开，没有被顶栏边界裁切

- [ ] **Step 5: Confirm only expected files changed**

Run:

```bash
git status --short
```

Expected:

- 会看到顶栏相关文件，以及预先存在的 `src/components/ui/DropdownSelect.vue`
- 不要暂存或提交 `src/components/ui/DropdownSelect.vue`
