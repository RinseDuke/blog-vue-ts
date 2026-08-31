# Modern Community UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有报纸风格博客改造成排版统一、无大图、系统字体、结构接近 Discourse 的现代个人博客与社区论坛混合界面。

**Architecture:** 保留现有 Vue、Pinia、服务层与路由行为，在视图层增加可复用的社区页面框架和主题视图模型。博客文章与社区帖子继续共用 Post 数据，通过 TopicListItem 映射层补齐界面语义；后端没有提供的统计字段保持可选并在界面隐藏。

**Tech Stack:** Vue 3、TypeScript、Pinia、Vue Router、Less、Vitest、Vite

---

## 文件结构

### 新增

- `src/components/community/CommunityLayout.vue`：桌面三栏、平板双栏、移动单栏的统一页面框架。
- `src/components/community/CommunitySidebar.vue`：稳定的社区导航和移动抽屉内容。
- `src/components/community/CommunityContextRail.vue`：首页与列表页的上下文信息。
- `src/components/topic/TopicList.vue`：连续主题列表容器。
- `src/components/topic/TopicRow.vue`：单条主题信息的响应式展示。
- `src/components/article/ArticleContextRail.vue`：文章作者、标签与目录上下文。
- `src/features/topic/topic.ts`：Post 到 TopicListItem 的映射与排序。
- `src/features/topic/topic.test.ts`：映射、官方优先级与缺省统计测试。
- `src/assets/base.test.ts`：全局视觉令牌约束测试。

### 修改

- `src/assets/base.css`：系统字体、中性色、蓝色交互色、边框、圆角和深色主题。
- `src/App.vue`：保留全局顶栏和搜索，清理报纸式页面背景。
- `src/components/navigation/TopHeaderLayout.vue`：移除模糊材质，改为实色固定顶栏。
- `src/components/navigation/TopBrand.vue`：移除印章和报纸副标题，使用现代文字标识。
- `src/components/navigation/TopNavigation.vue`：将桌面顶栏导航收敛为搜索、发帖和账户操作。
- `src/components/navigation/MobileTopTabs.vue`：移动端导航改为社区抽屉入口。
- `src/views/HomeView.vue`、`src/views/HomeView.test.ts`：统一主题流首页。
- `src/components/post/PostList.vue`、`src/components/post/PostCard.vue`：文章存档复用主题行。
- `src/views/ArticleListView.vue`：套用社区框架并保留筛选、分页和查询参数行为。
- `src/components/Article.vue`、`src/components/Article.test.ts`：改为首帖加连续讨论结构。
- `src/components/comment/CommentSection.vue`、`CommentItem.vue`、`CommentForm.vue`：统一回复排版与提交状态。
- `src/views/Write.vue`、`src/components/post/EditorToolbar.vue`、`src/components/post/StatusBar.vue`：桌面底部编辑体验与移动全屏体验。
- `src/views/LoginView.vue`、`RegisterView.vue`、`AboutView.vue`、`ProfileArticlesView.vue`、`Search.vue`：统一系统字体、页面宽度和表面层级。
- `src/components/ui/SkeletonLoader.vue`、`EmptyState.vue`、`Toast.vue`、`Modal.vue`：统一加载、空状态、错误和弹窗外观。
- `src/components/navigation/topHeaderLayout.test.ts`、`mobileTopbar.test.ts`：更新顶栏和移动导航契约。

## Task 1：建立现代系统字体与全局视觉令牌

**Files:**
- Create: `src/assets/base.test.ts`
- Modify: `src/assets/base.css`
- Modify: `src/components/navigation/TopHeaderLayout.vue`
- Modify: `src/components/navigation/topHeaderLayout.test.ts`

- [ ] **Step 1: 写失败测试，锁定系统字体与无玻璃规则**

```ts
import source from './base.css?raw'

describe('modern community visual tokens', () => {
  it('uses local system fonts without remote font imports', () => {
    expect(source).not.toContain('@import url(')
    expect(source).toContain("--font-body: -apple-system, BlinkMacSystemFont")
    expect(source).toContain("'PingFang SC'")
  })

  it('uses neutral surfaces and a restrained blue interaction color', () => {
    expect(source).toContain('--bg-canvas: #f5f5f7;')
    expect(source).toContain('--surface-strong: #ffffff;')
    expect(source).toContain('--brand-500: #0071e3;')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- src/assets/base.test.ts src/components/navigation/topHeaderLayout.test.ts`

Expected: FAIL，现有代码仍包含远程报纸字体、暖色纸张令牌和顶栏模糊。

- [ ] **Step 3: 替换全局字体、颜色和表面令牌**

在 `src/assets/base.css` 中删除 Google Fonts 导入，将字体与核心令牌改为：

```css
:root {
  --font-body: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC',
    'Helvetica Neue', 'Microsoft YaHei', Arial, sans-serif;
  --font-display: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC',
    'Helvetica Neue', 'Microsoft YaHei', Arial, sans-serif;
  --font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  --bg-canvas: #f5f5f7;
  --bg-canvas-soft: #fafafa;
  --surface: #fbfbfd;
  --surface-strong: #ffffff;
  --surface-hover: #f0f0f2;
  --surface-overlay: #ffffff;
  --ink-strong: #1d1d1f;
  --ink-main: #3a3a3c;
  --ink-muted: #6e6e73;
  --line-soft: rgba(29, 29, 31, 0.10);
  --line-strong: rgba(29, 29, 31, 0.18);
  --brand-500: #0071e3;
  --brand-400: #147ce5;
  --brand-100: rgba(0, 113, 227, 0.10);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
```

深色主题对应使用 `#000000`、`#1c1c1e`、`#2c2c2e` 和动态白色文字，不保留暖棕或朱红令牌。保留已有变量名以减少组件迁移范围。

- [ ] **Step 4: 移除顶栏模糊并改为实色层级**

`TopHeaderLayout.vue` 的 `.topbar` 使用：

```less
.topbar {
  background: color-mix(in srgb, var(--surface-strong) 96%, var(--bg-canvas));
  border-bottom: 1px solid var(--line-soft);
}

.topbar.scrolled {
  border-bottom-color: var(--line-strong);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}
```

删除 `backdrop-filter` 和 `-webkit-backdrop-filter`。

- [ ] **Step 5: 更新契约测试并运行通过**

Run: `npm run test:run -- src/assets/base.test.ts src/components/navigation/topHeaderLayout.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add src/assets/base.css src/assets/base.test.ts src/components/navigation/TopHeaderLayout.vue src/components/navigation/topHeaderLayout.test.ts
git commit -m "feat: establish modern community visual tokens"
```

## Task 2：建立全站社区页面框架

**Files:**
- Create: `src/components/community/CommunityLayout.vue`
- Create: `src/components/community/CommunitySidebar.vue`
- Create: `src/components/community/CommunityContextRail.vue`
- Modify: `src/components/navigation/TopBrand.vue`
- Modify: `src/components/navigation/TopNavigation.vue`
- Modify: `src/components/navigation/MobileTopTabs.vue`
- Modify: `src/App.vue`
- Test: `src/components/navigation/mobileTopbar.test.ts`

- [ ] **Step 1: 写失败测试，锁定品牌与导航结构**

```ts
import brandSource from './TopBrand.vue?raw'
import navigationSource from './TopNavigation.vue?raw'
import mobileSource from './MobileTopTabs.vue?raw'

it('uses a modern community identity instead of a newspaper masthead', () => {
  expect(brandSource).toContain('墨言社区')
  expect(brandSource).not.toContain('THE INK GAZETTE')
  expect(brandSource).not.toContain('brand__seal')
  expect(navigationSource).toContain('发起主题')
  expect(mobileSource).toContain('打开社区导航')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- src/components/navigation/mobileTopbar.test.ts`

Expected: FAIL，现有品牌仍为印章与报纸副标题。

- [ ] **Step 3: 创建左侧导航**

`CommunitySidebar.vue` 使用稳定路由入口；未实现的未读、分类和标签通过查询参数落在文章列表页，不创建空路由：

```ts
const items = [
  { label: '首页', to: { name: 'home' }, icon: '⌂' },
  { label: '最新', to: { name: 'article-list', query: { sort: 'newest' } }, icon: '◷' },
  { label: '热门', to: { name: 'article-list', query: { sort: 'readDesc' } }, icon: '↗' },
  { label: '我的内容', to: { name: 'profile-articles' }, icon: '◎', requiresAuth: true },
]
```

使用 `RouterLink`、`aria-current` 和文字标签，不能只靠图标表达。

- [ ] **Step 4: 创建三栏框架与上下文栏**

`CommunityLayout.vue` 接收 `title`、`description`、`compact`，并提供 `default` 与 `context` 插槽：

```vue
<div class="community-layout">
  <aside class="community-layout__left"><CommunitySidebar /></aside>
  <main class="community-layout__main">
    <header v-if="title" class="community-layout__header">
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </header>
    <slot />
  </main>
  <aside class="community-layout__right"><slot name="context" /></aside>
</div>
```

桌面列宽使用 `220px minmax(0, 760px) 260px`；低于 1100px 隐藏右栏；低于 800px 隐藏左栏并由移动导航打开。

- [ ] **Step 5: 更新品牌、顶栏和移动入口**

品牌只保留简洁圆形字母标识与“墨言社区”。顶栏将“写作”改为蓝色“发起主题”按钮；移动端导航面板复用 CommunitySidebar 的入口标签，并保持搜索与主题切换可用。

- [ ] **Step 6: 运行导航测试**

Run: `npm run test:run -- src/components/navigation/mobileTopbar.test.ts src/components/navigation/topHeaderLayout.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add src/App.vue src/components/community src/components/navigation
git commit -m "feat: add unified community shell"
```

## Task 3：统一主题视图模型与首页信息流

**Files:**
- Create: `src/features/topic/topic.ts`
- Create: `src/features/topic/topic.test.ts`
- Create: `src/components/topic/TopicRow.vue`
- Create: `src/components/topic/TopicList.vue`
- Modify: `src/views/HomeView.vue`
- Modify: `src/views/HomeView.test.ts`
- Modify: `src/components/post/PostList.vue`
- Modify: `src/components/post/PostCard.vue`
- Modify: `src/views/ArticleListView.vue`

- [ ] **Step 1: 写主题映射失败测试**

```ts
import { describe, expect, it } from 'vitest'
import { mapPostToTopic, sortTopics } from './topic'

it('maps a post without inventing community metrics', () => {
  const topic = mapPostToTopic({
    id: '1', slug: 'hello', title: '你好', excerpt: '摘要', tags: ['随笔'],
    author: { id: 'a', name: '作者' }, publishedAt: '2026-08-31T08:00:00Z',
    readMinutes: 4, featured: true,
  })
  expect(topic.official).toBe(true)
  expect(topic.replyCount).toBeUndefined()
  expect(topic.viewCount).toBeUndefined()
  expect(topic.lastActivityAt).toBe('2026-08-31T08:00:00Z')
})

it('keeps pinned official topics ahead of regular topics', () => {
  const result = sortTopics([
    { id: '2', title: '普通', excerpt: '', tags: [], author: { id: 'b', name: 'B' }, publishedAt: '2026-09-01T08:00:00Z', readMinutes: 2 },
    { id: '1', title: '官方', excerpt: '', tags: [], author: { id: 'a', name: 'A' }, publishedAt: '2026-08-31T08:00:00Z', readMinutes: 2, featured: true },
  ].map(mapPostToTopic))
  expect(result[0].official).toBe(true)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- src/features/topic/topic.test.ts`

Expected: FAIL，模块尚不存在。

- [ ] **Step 3: 实现主题视图模型**

```ts
import type { Post } from '@/types/post'

export interface TopicListItem {
  id: string
  title: string
  excerpt: string
  tags: string[]
  author: Post['author']
  publishedAt: string
  lastActivityAt: string
  readMinutes: number
  official: boolean
  replyCount?: number
  viewCount?: number
}

export function mapPostToTopic(post: Post): TopicListItem {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags,
    author: post.author,
    publishedAt: post.publishedAt,
    lastActivityAt: post.updatedAt ?? post.publishedAt,
    readMinutes: post.readMinutes,
    official: post.featured === true,
  }
}

export function sortTopics(topics: TopicListItem[]) {
  return topics.slice().sort((a, b) =>
    Number(b.official) - Number(a.official) ||
    new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  )
}
```

- [ ] **Step 4: 创建连续主题列表组件**

`TopicRow.vue` 使用头像、标题、官方标识、标签、一行摘要、作者与活动时间。只有 `replyCount` 或 `viewCount` 存在时才渲染统计列。移动端通过 CSS 隐藏摘要和统计，不删除可访问名称。

`TopicList.vue` 接收 `topics: TopicListItem[]`，使用语义化列表和连续分隔线，不使用独立卡片阴影。

- [ ] **Step 5: 将首页改为统一主题流**

删除 `masthead`、`press`、`lead`、`dispatch` 和所有大字号报头。首页结构改为：

```vue
<CommunityLayout title="社区动态" description="写作、思考与工程实践">
  <nav class="topic-tabs" aria-label="主题排序">
    <button class="is-active">最新</button>
    <RouterLink :to="{ name: 'article-list', query: { sort: 'readDesc' } }">热门</RouterLink>
  </nav>
  <TopicList v-if="topics.length" :topics="topics" />
  <EmptyState v-else title="还没有主题" description="发布第一篇文章，开始一次讨论。" />
  <template #context><CommunityContextRail :posts="latestPosts" /></template>
</CommunityLayout>
```

- [ ] **Step 6: 将文章存档列表复用主题行**

`PostList.vue` 内部将 Post 映射为 TopicListItem，`ArticleListView.vue` 保留现有筛选、分页和 URL 查询同步，只替换页面框架与列表表现。

- [ ] **Step 7: 运行主题与页面测试**

Run: `npm run test:run -- src/features/topic/topic.test.ts src/views/HomeView.test.ts src/components/post/ArticleFilters.test.ts`

Expected: PASS，HomeView 测试确认不存在 masthead、press、lead、dispatch 和大图组件。

- [ ] **Step 8: 提交**

```bash
git add src/features/topic src/components/topic src/views/HomeView.vue src/views/HomeView.test.ts src/components/post src/views/ArticleListView.vue
git commit -m "feat: replace editorial home with topic stream"
```

## Task 4：将文章详情改为首帖与连续讨论

**Files:**
- Create: `src/components/article/ArticleContextRail.vue`
- Modify: `src/components/Article.vue`
- Modify: `src/components/Article.test.ts`
- Modify: `src/components/article/ReadingProgress.vue`
- Modify: `src/components/comment/CommentSection.vue`
- Modify: `src/components/comment/CommentItem.vue`
- Modify: `src/components/comment/CommentForm.vue`

- [ ] **Step 1: 写失败测试，锁定主题详情结构**

```ts
import source from './Article.vue?raw'

it('renders the first post and replies inside the community layout', () => {
  expect(source).toContain('CommunityLayout')
  expect(source).toContain('topic-first-post')
  expect(source).toContain('ArticleContextRail')
  expect(source).toContain('CommentSection')
  expect(source).not.toContain('article-hero__rule')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- src/components/Article.test.ts`

Expected: FAIL，详情页仍为居中报纸文章。

- [ ] **Step 3: 改造首帖结构**

`Article.vue` 使用 CommunityLayout。首帖左侧显示作者头像与名称，右侧依次显示标签、标题、摘要、正文和操作栏；正文继续使用 DOMPurify，最大宽度 720px。

```vue
<CommunityLayout compact>
  <article class="topic-first-post">
    <aside class="topic-author">...</aside>
    <div class="topic-content">
      <header class="topic-content__header">...</header>
      <div class="article-body" v-html="safeHtml"></div>
      <footer class="topic-actions">...</footer>
    </div>
  </article>
  <CommentSection :post-id="post.id" />
  <template #context><ArticleContextRail :post="post" /></template>
</CommunityLayout>
```

- [ ] **Step 4: 创建文章上下文栏**

`ArticleContextRail.vue` 显示作者、发布时间、阅读时长、标签和返回主题列表入口。目录只在扫描到至少 3 个 `h2/h3` 时显示；没有目录时不渲染空标题。

- [ ] **Step 5: 将评论改为连续回复**

评论区标题改为“回复”，CommentItem 在桌面使用 `88px minmax(0, 1fr)` 的作者/内容结构，移动端改为单列。回复、点赞、举报保留现有逻辑；空状态文案改为“还没有回复，开始这次讨论吧。”

- [ ] **Step 6: 调整阅读进度**

ReadingProgress 位于固定顶栏下方，使用品牌蓝 2px 进度线；完成后隐藏。确保减少动态效果设置下不使用平滑动画。

- [ ] **Step 7: 运行文章与评论测试**

Run: `npm run test:run -- src/components/Article.test.ts src/features/comment/stores/useCommentStore.test.ts src/services/commentService.test.ts`

Expected: PASS。

- [ ] **Step 8: 提交**

```bash
git add src/components/Article.vue src/components/Article.test.ts src/components/article src/components/comment
git commit -m "feat: unify article and discussion layout"
```

## Task 5：将写作页适配为社区发帖体验

**Files:**
- Modify: `src/views/Write.vue`
- Modify: `src/components/post/EditorToolbar.vue`
- Modify: `src/components/post/StatusBar.vue`
- Modify: `src/features/post/composables/useDraft.ts`
- Test: `src/views/Write.test.ts`
- Test: `src/components/post/EditorToolbar.test.ts`
- Test: `src/components/post/StatusBar.test.ts`
- Test: `src/features/post/composables/useDraft.test.ts`

- [ ] **Step 1: 写失败测试，锁定直接发布与响应式编辑器**

```ts
import source from './Write.vue?raw'

it('presents writing as a community composer with safe retry state', () => {
  expect(source).toContain('发起主题')
  expect(source).toContain("status: 'published'")
  expect(source).toContain('发布失败，请稍后重试。')
  expect(source).toContain('composer-shell')
  expect(source).not.toContain('meta-panel__cover-upload')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- src/views/Write.test.ts src/components/post/EditorToolbar.test.ts src/components/post/StatusBar.test.ts`

Expected: FAIL，现有编辑器仍使用文章卡片与封面设置结构。

- [ ] **Step 3: 简化发帖界面**

保留 Tiptap、Markdown、标签、公开范围、草稿与发布服务逻辑；移除封面上传入口和大卡片装饰。页面标题改为“发起主题”，桌面内容区固定在视口下半部的可扩展 composer-shell，直接访问 `/write` 时以最大宽度 980px 的专注页打开。

- [ ] **Step 4: 保证失败时草稿不丢失**

发布前先保存当前草稿快照；只有 createPost 成功后调用 resetDraft。catch 分支只更新 publishError 和 isPublishing，不清空标题、正文、标签或可见性。

- [ ] **Step 5: 移动端切换全屏**

低于 800px 时 composer-shell 使用 `position: fixed; inset: 52px 0 0;`，工具栏可横向滚动，状态栏固定底部并保留安全区间距。

- [ ] **Step 6: 运行写作测试**

Run: `npm run test:run -- src/views/Write.test.ts src/features/post/utils/writeMarkdown.test.ts src/features/post/composables/useDraft.test.ts src/components/post/EditorToolbar.test.ts src/components/post/StatusBar.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add src/views/Write.vue src/views/Write.test.ts src/components/post/EditorToolbar.vue src/components/post/EditorToolbar.test.ts src/components/post/StatusBar.vue src/components/post/StatusBar.test.ts src/features/post/composables/useDraft.ts src/features/post/composables/useDraft.test.ts
git commit -m "feat: modernize community composer"
```

## Task 6：统一其余页面与通用状态

**Files:**
- Modify: `src/views/LoginView.vue`
- Modify: `src/views/RegisterView.vue`
- Modify: `src/views/AboutView.vue`
- Modify: `src/views/ProfileArticlesView.vue`
- Modify: `src/views/Search.vue`
- Modify: `src/components/ui/SkeletonLoader.vue`
- Modify: `src/components/ui/EmptyState.vue`
- Modify: `src/components/ui/Toast.vue`
- Modify: `src/components/ui/Modal.vue`
- Modify: `src/components/navigation/TopFooter.vue`

- [ ] **Step 1: 更新现有页面契约测试**

在 `AboutView.test.ts` 增加明确的源码契约：

```ts
import source from './AboutView.vue?raw'
import baseSource from '@/assets/base.css?raw'

it('uses the shared modern community surface language', () => {
  expect(baseSource).toContain('--font-body: -apple-system')
  expect(source).toContain('var(--surface-strong)')
  expect(source).toContain('var(--line-soft)')
  expect(source).not.toContain('radial-gradient')
  expect(source).not.toContain('backdrop-filter')
})
```

共享导航测试继续断言源码不再出现 `Fraunces`、`Newsreader`、`Gazette`、`masthead` 或背景模糊。

- [ ] **Step 2: 运行相关测试确认失败**

Run: `npm run test:run -- src/views/AboutView.test.ts src/components/navigation/mobileTopbar.test.ts`

Expected: FAIL，仍有旧视觉契约。

- [ ] **Step 3: 统一认证与个人页面**

登录和注册使用居中单列内容区，不使用深色品牌宣传面板。个人页使用 CommunityLayout，资料、动态和文章用白色内容区加细分隔线组织，不使用厚重卡片或大面积渐变。

- [ ] **Step 4: 统一搜索与状态组件**

搜索结果复用 TopicList。SkeletonLoader 按主题行和首帖结构绘制；EmptyState 使用标题、说明和可选操作；Toast 与 Modal 使用 12px 圆角、细边框和短阴影，不使用模糊背景。

- [ ] **Step 5: 统一页脚**

页脚改为简单版权、关于和社区规则链接，只在非专注页面出现，使用顶部细分隔线。

- [ ] **Step 6: 运行页面测试**

Run: `npm run test:run -- src/views/AboutView.test.ts src/components/navigation/mobileTopbar.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add src/views src/components/ui src/components/navigation/TopFooter.vue
git commit -m "feat: unify remaining community surfaces"
```

## Task 7：全量验证与视觉验收

**Files:**
- Modify only if verification exposes a defect in files already listed above.

- [ ] **Step 1: 扫描旧视觉残留**

Run: `rg -n "Fraunces|Newsreader|THE INK GAZETTE|masthead|backdrop-filter|radial-gradient|FeaturedHero" src`

Expected: 不应在实际渲染代码中命中；测试中的否定断言允许存在。

- [ ] **Step 2: 运行完整测试与类型检查**

Run: `npm run test:run`

Expected: 29 个以上测试文件全部通过。

Run: `npm run type-check`

Expected: exit code 0。

- [ ] **Step 3: 运行代码规范与生产构建**

Run: `npm run lint`

Expected: exit code 0，无新增警告。

Run: `npm run build`

Expected: exit code 0，生成 dist。

- [ ] **Step 4: 浏览器检查关键页面**

启动预览后检查 `/`、`/article`、至少一个 `/article/:id`、`/write`、`/about`、`/login`、`/search`。分别使用 1440×900、900×1100、390×844 视口，确认：

- 无大图首页和报纸报头。
- 桌面三栏、平板隐藏右栏、移动单栏与抽屉正常。
- 主题行统计缺失时不显示假数据。
- 文章正文约 720px，回复连续排列。
- 浅色和深色主题文字、边框、焦点可辨识。
- 发帖失败时保留输入，移动端编辑器无内容遮挡。

- [ ] **Step 5: 检查最终差异与秘密信息**

Run: `git diff --check`

Expected: 无空白错误。

Run: `git diff --name-only`

Expected: 不包含 `.env`、密钥、构建产物或 CodeQL 数据库。

- [ ] **Step 6: 最终提交**

```bash
git add src docs/superpowers/plans/2026-08-31-modern-community-ui-plan.md
git commit -m "feat: complete modern community ui"
```
