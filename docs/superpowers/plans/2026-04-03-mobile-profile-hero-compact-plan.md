# 移动端个人中心首块压缩 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让移动端个人中心首块更紧凑，减少首屏占高，同时保持桌面端和原有交互结构不变。

**Architecture:** 只修改 `src/views/AboutView.vue` 的移动端断点样式，不引入新的业务逻辑或组件拆分。测试采用现有源代码契约方式，先锁定移动端首块必须具备的紧凑样式，再实现最小 CSS 变更。

**Tech Stack:** Vue 3、TypeScript、LESS、Vitest、Vite

---

## File Structure

- `src/views/AboutView.vue`
  - 负责个人中心首块结构与样式。
  - 本次只修改移动端样式，不变更模板结构。
- `src/views/AboutView.test.ts`
  - 负责锁定移动端首块紧凑化的源代码契约。

### Task 1: 先锁定移动端首块紧凑化约束

**Files:**
- Create: `src/views/AboutView.test.ts`
- Test: `src/views/AboutView.test.ts`

- [ ] **Step 1: 写失败测试，锁定移动端 banner、头像和按钮需要压缩**

```ts
import source from './AboutView.vue?raw'

describe('About view source contract', () => {
  it('keeps a compact mobile hero treatment', () => {
    expect(source).toMatch(/@media \(max-width: 640px\) {[\s\S]*\.profile-hero__banner {\s*min-height: 108px;/)
    expect(source).toMatch(/@media \(max-width: 640px\) {[\s\S]*\.profile-avatar {\s*width: 88px;/)
    expect(source).toMatch(/@media \(max-width: 640px\) {[\s\S]*\.profile-hero__caption {\s*display: none;/)
    expect(source).toMatch(/@media \(max-width: 640px\) {[\s\S]*\.hero-btn {\s*min-height: 44px;/)
  })
})
```

- [ ] **Step 2: 运行定向测试确认失败**

Run: `npm run test:run -- src/views/AboutView.test.ts`

Expected: FAIL，因为当前移动端样式还没有这些紧凑化约束。

### Task 2: 实现移动端首块压缩样式

**Files:**
- Modify: `src/views/AboutView.vue`
- Test: `src/views/AboutView.test.ts`

- [ ] **Step 1: 在移动端断点中缩短 banner 与 body 叠层高度**

```less
.profile-hero__banner {
  min-height: 108px;
  padding: 0.8rem 0.9rem;
}

.profile-hero__body {
  margin-top: -34px;
  padding: 0 0.9rem 0.9rem;
  gap: 0.8rem;
}
```

- [ ] **Step 2: 缩小头像并收紧身份区排布**

```less
.profile-hero__identity {
  flex-direction: row;
  align-items: flex-end;
  gap: 0.8rem;
  min-width: 0;
}

.profile-avatar {
  width: 88px;
  height: 88px;
  border-width: 4px;
  font-size: 1.85rem;
}
```

- [ ] **Step 3: 弱化辅助文案并压缩按钮尺寸**

```less
.profile-hero__facts {
  margin-top: 0.35rem;
  gap: 0.28rem;
  font-size: 0.82rem;
}

.profile-hero__caption {
  display: none;
}

.hero-btn {
  min-height: 44px;
  padding: 0.68rem 1rem;
  font-size: 0.92rem;
}
```

- [ ] **Step 4: 运行定向测试确认通过**

Run: `npm run test:run -- src/views/AboutView.test.ts`

Expected: PASS，移动端首块紧凑化样式被锁定。

### Task 3: 完成验证与视觉回归

**Files:**
- Verify: `src/views/AboutView.vue`
- Verify: `src/views/AboutView.test.ts`

- [ ] **Step 1: 运行全量测试**

Run: `npm run test:run`

Expected: PASS，无其他源代码契约测试回归。

- [ ] **Step 2: 运行 lint、类型检查和构建**

Run: `npm run lint`
Expected: PASS

Run: `npm run type-check`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: 做视觉回归**

```text
检查页面：个人中心页
检查维度：浅色 / 深色、桌面 / 移动
重点确认：
1. 移动端首块高度明显下降
2. 头像、banner 和按钮区更紧凑
3. 桌面端首块未被影响
4. 首块后的内容更早进入首屏
```
