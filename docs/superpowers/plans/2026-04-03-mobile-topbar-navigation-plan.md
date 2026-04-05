# 移动端顶部导航优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让移动端顶部导航从“桌面端压缩版”改为独立优化方案：默认不常驻完整搜索框，导航更轻、更低，占用更少首屏空间，同时不影响桌面端体验。

**Architecture:** 继续保留现有桌面端顶部组件链路，在 `App.vue` 中增加移动端顶部状态编排；新增移动端搜索层与移动端导航条组件，把“展示结构”从桌面端剥离，但复用现有搜索数据、搜索提交和路由能力。实现过程中优先遵循 TDD：先为新交互和关键结构补最小测试，再落地组件与样式。

**Tech Stack:** Vue 3、TypeScript、Vite、Vitest、LESS、Vue Router、Pinia

---

## File Structure

- `src/App.vue`
  - 增加移动端搜索开合状态与桌面 / 移动端顶部编排。
- `src/components/navigation/TopHeaderLayout.vue`
  - 调整顶部容器在移动端的间距和壳层表现。
- `src/components/navigation/TopNavigation.vue`
  - 仅保留桌面端导航职责。
- `src/components/search/TopSearchBox.vue`
  - 明确桌面端搜索职责，避免移动端继续使用常驻输入框样式。
- `src/components/navigation/MobileTopTabs.vue`
  - 新建移动端标签式导航组件。
- `src/components/search/MobileSearchSheet.vue`
  - 新建移动端搜索层组件。
- `src/components/navigation/__tests__/mobileTopbar.spec.ts`
  - 新建移动端顶部结构回归测试。

### Task 1: 先锁定移动端顶部结构的回归测试

**Files:**
- Create: `src/components/navigation/__tests__/mobileTopbar.spec.ts`
- Test: `src/components/navigation/__tests__/mobileTopbar.spec.ts`

- [ ] **Step 1: 写失败测试，锁定移动端默认不显示完整搜索输入框**

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MobileSearchSheet from '@/components/search/MobileSearchSheet.vue'

describe('MobileSearchSheet', () => {
  it('renders only when open is true', () => {
    const closed = mount(MobileSearchSheet, {
      props: {
        open: false,
        modelValue: '',
        recommendedPosts: [],
        suggestionPosts: [],
        searchHistory: [],
        normalizedQuery: '',
      },
    })

    expect(closed.find('[data-testid=\"mobile-search-sheet\"]').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: 写失败测试，锁定移动端导航独立于桌面端导航组件**

```ts
import MobileTopTabs from '@/components/navigation/MobileTopTabs.vue'

it('renders the four mobile navigation entries', () => {
  const wrapper = mount(MobileTopTabs, {
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
      },
    },
  })

  expect(wrapper.text()).toContain('首页')
  expect(wrapper.text()).toContain('文章')
  expect(wrapper.text()).toContain('写作')
  expect(wrapper.text()).toMatch(/个人中心|登录/)
})
```

- [ ] **Step 3: 运行定向测试确认失败**

Run: `npm run test:run -- src/components/navigation/__tests__/mobileTopbar.spec.ts`

Expected: FAIL，因为 `MobileSearchSheet.vue` 和 `MobileTopTabs.vue` 还不存在。

- [ ] **Step 4: 提交测试基线**

```bash
git add src/components/navigation/__tests__/mobileTopbar.spec.ts
git commit -m "test: lock mobile topbar behavior"
```

### Task 2: 新增移动端标签导航和移动端搜索层

**Files:**
- Create: `src/components/navigation/MobileTopTabs.vue`
- Create: `src/components/search/MobileSearchSheet.vue`
- Test: `src/components/navigation/__tests__/mobileTopbar.spec.ts`

- [ ] **Step 1: 实现移动端标签导航组件**

```vue
<template>
  <nav class="mobile-top-tabs" aria-label="移动端主导航">
    <RouterLink to="/">首页</RouterLink>
    <RouterLink to="/article">文章</RouterLink>
    <RouterLink to="/write">写作</RouterLink>
    <RouterLink to="/about">{{ isLoggedIn ? '个人中心' : '登录' }}</RouterLink>
  </nav>
</template>
```

- [ ] **Step 2: 实现移动端搜索层组件**

```vue
<template>
  <Transition name="mobile-search-sheet">
    <div v-if="open" class="mobile-search-sheet" data-testid="mobile-search-sheet">
      <div class="mobile-search-sheet__panel">
        <TopSearchBox
          :model-value="modelValue"
          :recommended-posts="recommendedPosts"
          :suggestion-posts="suggestionPosts"
          :search-history="searchHistory"
          :normalized-query="normalizedQuery"
          @update:model-value="$emit('update:modelValue', $event)"
          @search="$emit('search', $event)"
          @clear-history="$emit('clearHistory')"
        />
      </div>
    </div>
  </Transition>
</template>
```

- [ ] **Step 3: 运行定向测试确认通过**

Run: `npm run test:run -- src/components/navigation/__tests__/mobileTopbar.spec.ts`

Expected: PASS，移动端搜索层与移动端导航基础结构可渲染。

- [ ] **Step 4: 提交新增组件**

```bash
git add src/components/navigation/MobileTopTabs.vue src/components/search/MobileSearchSheet.vue src/components/navigation/__tests__/mobileTopbar.spec.ts
git commit -m "feat: add mobile topbar building blocks"
```

### Task 3: 重组 App 顶部结构，分离桌面端与移动端编排

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/search/TopSearchBox.vue`
- Modify: `src/components/navigation/TopNavigation.vue`
- Modify: `src/components/navigation/TopHeaderLayout.vue`
- Test: `src/components/navigation/__tests__/mobileTopbar.spec.ts`

- [ ] **Step 1: 在 `App.vue` 中增加移动端搜索状态并拆分顶部布局**

```ts
const isMobileSearchOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    isNavHidden.value = false
    isMobileSearchOpen.value = false
    lastScrollTop = 0
  }
)
```

```vue
<TopHeaderLayout :is-hidden="isNavHidden">
  <div class="desktop-topbar">
    <TopBrand />
    <TopSearchBox ... />
    <TopNavigation />
    <TopThemeToggle />
  </div>

  <div class="mobile-topbar">
    <div class="mobile-topbar__main">
      <TopBrand />
      <div class="mobile-topbar__actions">
        <button type="button" class="mobile-search-trigger">搜索</button>
        <TopThemeToggle />
      </div>
    </div>
    <MobileTopTabs />
    <MobileSearchSheet ... />
  </div>
</TopHeaderLayout>
```

- [ ] **Step 2: 把 `TopSearchBox.vue` 收敛为桌面端主搜索样式，不再承担移动端常驻布局**

```less
@media (max-width: 768px) {
  .search-box {
    display: none;
  }
}
```

- [ ] **Step 3: 把 `TopNavigation.vue` 收敛为桌面端导航**

```less
@media (max-width: 768px) {
  .navigation {
    display: none;
  }
}
```

- [ ] **Step 4: 调整 `TopHeaderLayout.vue` 的移动端材质、圆角、间距和占位**

```less
@media (max-width: 768px) {
  .topbar__inner {
    padding: 0.6rem;
    border-radius: 22px;
    gap: 0.5rem;
  }
}
```

- [ ] **Step 5: 运行相关测试与局部回归**

Run: `npm run test:run -- src/components/navigation/__tests__/mobileTopbar.spec.ts`

Expected: PASS，且移动端顶部组件结构与新状态编排不破坏测试。

- [ ] **Step 6: 提交顶部结构重组**

```bash
git add src/App.vue src/components/search/TopSearchBox.vue src/components/navigation/TopNavigation.vue src/components/navigation/TopHeaderLayout.vue
git commit -m "feat: split desktop and mobile topbar layouts"
```

### Task 4: 完成样式统一、运行验证和视觉回归

**Files:**
- Verify: `src/App.vue`
- Verify: `src/components/navigation/TopHeaderLayout.vue`
- Verify: `src/components/navigation/MobileTopTabs.vue`
- Verify: `src/components/search/MobileSearchSheet.vue`
- Verify: `src/components/search/TopSearchBox.vue`
- Verify: `src/views/HomeView.vue`
- Verify: `src/views/ArticleListView.vue`
- Verify: `src/views/Write.vue`
- Verify: `src/views/AboutView.vue`

- [ ] **Step 1: 运行 lint**

Run: `npm run lint`

Expected: PASS，无新增 ESLint 错误。

- [ ] **Step 2: 运行类型检查**

Run: `npm run type-check`

Expected: PASS，无 TypeScript / `vue-tsc` 错误。

- [ ] **Step 3: 运行构建**

Run: `npm run build`

Expected: PASS；若仍出现既有的 `Write` chunk warning，可记录为非本次阻塞项。

- [ ] **Step 4: 启动项目做运行验证**

Run: `npm run dev -- --host 127.0.0.1 --port 4173`

Expected: 本地开发服务启动成功，可在浏览器打开首页和其他页面。

- [ ] **Step 5: 做视觉回归**

```text
检查页面：
1. 首页
2. 文章列表
3. 写作页
4. 个人中心

检查维度：
1. 浅色 / 深色
2. 桌面 / 移动
3. 移动端搜索层关闭 / 打开

重点确认：
1. 移动端默认不再出现完整搜索栏
2. 移动端导航不再是厚重的大按钮组
3. 首页首屏可见内容明显增多
4. 桌面端导航与搜索未回归
5. 顶部壳层、搜索层和主体材质一致
```

- [ ] **Step 6: 提交最终改动**

```bash
git add src/App.vue src/components/navigation/TopHeaderLayout.vue src/components/navigation/TopNavigation.vue src/components/navigation/MobileTopTabs.vue src/components/search/TopSearchBox.vue src/components/search/MobileSearchSheet.vue src/components/navigation/__tests__/mobileTopbar.spec.ts docs/superpowers/specs/2026-04-03-mobile-topbar-navigation-design.md docs/superpowers/plans/2026-04-03-mobile-topbar-navigation-plan.md
git commit -m "feat: optimize mobile topbar navigation"
```
