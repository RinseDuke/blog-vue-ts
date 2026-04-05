# Mock 示例文章正文清理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清理 mock 示例文章里不适合上线展示的 `Mock / API / 后端切换` 文案，同时保持文章数量、数据结构和现有展示链路不变。

**Architecture:** 只修改 `src/mocks/posts.ts` 和一份新的 mock 内容回归测试，不触碰 UI、服务层和路由。实现上先用 Vitest 锁定最终导出的 `mockPosts` 展示文案，再最小改动通用正文模板和少数主题不合适的文章 seed，最后跑完整验证和文章详情页视觉回归。

**Tech Stack:** Vue 3、TypeScript、Vite、Vitest、Vue Router

---

## File Structure

- `src/mocks/posts.ts`
  - 继续作为 mock 示例文章唯一数据源。
  - 删除通用正文模板里的测试/后端切换说明。
  - 改写少数不适合上线展示的文章 `title`、`excerpt`、`contentLead`、`contentSections`。
- `src/mocks/posts.test.ts`
  - 新增针对最终导出 `mockPosts` 的展示文案回归测试。
  - 锁定不应再次出现的上线前关键词。
- `src/router/index.ts`
  - 不改代码，只用于验证文章详情路由仍然是 `/article/:id`，视觉回归时直接访问 `/article/1` 和 `/article/13`。

### Task 1: 先补 mock 展示文案回归测试

**Files:**
- Create: `src/mocks/posts.test.ts`
- Test: `src/mocks/posts.test.ts`

- [ ] **Step 1: 写失败测试，锁定最终展示内容里不再出现上线前文案**

```ts
import { describe, expect, it } from 'vitest'
import { mockPosts } from '@/mocks/posts'

const forbiddenDisplayPhrases = [
  '这批内容用于验证多数据场景下的分页、搜索、筛选、推荐与详情渲染。',
  '当你后续接入真实后端时，只要保持当前字段结构一致，服务层就可以直接切换。',
  '从 Mock 数据切换到真实 API 的迁移方案',
  '前端 API 类型契约实践：把接口不确定性前置',
  '如何设计可扩展的 Mock 数据层',
  '真实后端',
]

describe('mockPosts display copy', () => {
  it('does not expose prelaunch mock and backend integration wording', () => {
    const renderedText = mockPosts
      .map((post) => [post.title, post.excerpt, post.content].join('\n'))
      .join('\n')

    forbiddenDisplayPhrases.forEach((phrase) => {
      expect(renderedText).not.toContain(phrase)
    })
  })
})
```

- [ ] **Step 2: 运行定向测试，确认当前基线失败**

Run: `npm run test:run -- src/mocks/posts.test.ts`

Expected: FAIL，并包含至少一个 `expected ... not to contain`，命中通用模板文案或第 `13 / 20 / 26` 篇文章的现有展示文案。

- [ ] **Step 3: 提交测试基线**

```bash
git add src/mocks/posts.test.ts
git commit -m "test: lock mock post display copy"
```

### Task 2: 最小改动清理 mock 文章展示内容

**Files:**
- Modify: `src/mocks/posts.ts`
- Test: `src/mocks/posts.test.ts`

- [ ] **Step 1: 精简通用正文模板，去掉测试/后端切换说明**

```ts
function buildArticleContent(title: string, lead: string, sections: string[]) {
  return [
    `<h2>${title}</h2>`,
    `<p>${lead}</p>`,
    '<h3>本文要点</h3>',
    `<ul>${sections.map((section) => `<li>${section}</li>`).join('')}</ul>`,
  ].join('')
}
```

- [ ] **Step 2: 改写第 13 篇文章的展示文案，但保留 `id`、`slug`、时间、作者、标签和封面**

```ts
{
  id: '13',
  slug: 'mock-to-real-api-migration-guide',
  title: '内容站改版时如何稳定迁移文章页结构',
  excerpt: '围绕页面层级、元信息组织和旧链接兼容，整理内容站改版时更稳妥的迁移步骤。',
  contentLead: '文章页改版最容易出问题的不是样式，而是标题、摘要、作者信息和正文结构在不同入口下是否保持一致。',
  contentSections: [
    '先锁定哪些结构必须前后保持一致',
    '如何分阶段替换旧模块避免整页返工',
    '改版后用什么清单确认详情页没有漏项',
  ],
}
```

- [ ] **Step 3: 改写第 20 篇文章的展示文案，去掉 `API / 接口` 主题**

```ts
{
  id: '20',
  slug: 'typesafe-api-contracts-in-frontend',
  title: '前端类型收敛实践：把复杂状态前置',
  excerpt: '从表单状态、异步结果和页面容错三个层次讨论前端类型收敛的落点。',
  contentLead: '真正影响维护成本的，往往不是类型多，而是页面没有先约束哪些状态必须被明确区分。',
  contentSections: [
    '联合类型什么时候该拆成显式状态',
    '什么时候需要先做 normalize 再进入页面逻辑',
    '页面层和工具层如何分担兜底责任',
  ],
}
```

- [ ] **Step 4: 改写第 26 篇文章的展示文案，去掉 `Mock 数据层` 主题**

```ts
{
  id: '26',
  slug: 'extensible-mock-data-layer-design',
  title: '如何设计可扩展的示例文章库',
  excerpt: '围绕主题分布、时间跨度和阅读密度，整理一套更适合内容站演示的数据组织方式。',
  contentLead: '示例文章如果只有少量重复主题，很难帮你提前发现首页编排、专题区和推荐模块里的真实问题。',
  contentSections: [
    '为什么要覆盖不同主题和发布时间跨度',
    '示例文章之间如何建立更自然的内容关系',
    '怎样控制数量与密度让列表页更接近真实环境',
  ],
}
```

- [ ] **Step 5: 运行定向测试，确认展示文案回归通过**

Run: `npm run test:run -- src/mocks/posts.test.ts`

Expected: PASS，`mockPosts` 最终拼出的标题、摘要和正文里不再出现锁定的上线前文案。

- [ ] **Step 6: 提交正文清理改动**

```bash
git add src/mocks/posts.ts src/mocks/posts.test.ts
git commit -m "chore: clean mock post display copy"
```

### Task 3: 完整验证与视觉回归

**Files:**
- Verify: `src/mocks/posts.ts`
- Verify: `src/mocks/posts.test.ts`
- Verify: `src/router/index.ts`
- Verify: `src/views/ArticleDetailView.vue`

- [ ] **Step 1: 运行完整测试**

Run: `npm run test:run`

Expected: PASS，没有新的 Vitest 失败。

- [ ] **Step 2: 运行类型检查**

Run: `npm run type-check`

Expected: PASS，没有 `vue-tsc` 类型错误。

- [ ] **Step 3: 运行 lint**

Run: `npm run lint`

Expected: PASS，没有新的 ESLint 报错。

- [ ] **Step 4: 运行构建**

Run: `npm run build`

Expected: PASS，生成生产构建产物。

- [ ] **Step 5: 启动本地运行态验证**

Run: `npm run dev -- --host 127.0.0.1 --port 4173`

Expected: 本地开发服务启动成功，可在浏览器访问 `http://127.0.0.1:4173`。

- [ ] **Step 6: 做文章详情页视觉回归**

```text
检查页面：
1. http://127.0.0.1:4173/article/1
2. http://127.0.0.1:4173/article/13

检查维度：
1. 浅色模式
2. 深色模式
3. 桌面宽度
4. 移动宽度

重点确认：
1. 详情页正文不再出现“测试重点”“真实后端”“Mock 数据切换”等文案
2. 第 13 篇文章列表卡片和详情页标题、摘要、正文主题一致
3. 第 20 篇和第 26 篇在文章列表中不再出现 API / Mock 主题文案
4. 页面排版、毛玻璃层级和深色模式观感未被这次文案改动破坏
```

