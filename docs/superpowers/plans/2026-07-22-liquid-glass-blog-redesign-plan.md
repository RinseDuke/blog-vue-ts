# Liquid Glass Blog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 Vue 博客更新为兼顾桌面与移动端可读性、性能和可用性的克制液态玻璃界面。

**Architecture:** 只改表现层。以 `src/assets/base.css` 建立玻璃材质、颜色、阴影、圆角、动效和回退 token；再按全局框架、页面、共享组件分批替换样式。保留现有 Pinia store、service、router、表单处理和编辑器数据流。

**Tech Stack:** Vue 3、TypeScript、Vite、Less、Vitest、Vue Test Utils。

---

## 文件地图

- 全局材质与主题：`src/assets/base.css`、`src/assets/main.css`。
- 应用壳与导航：`src/App.vue`、`src/components/navigation/TopHeaderLayout.vue`、`TopNavigation.vue`、`MobileTopTabs.vue`、`TopBrand.vue`、`TopThemeToggle.vue`、`TopFooter.vue`。
- 首页及核心页面：`src/views/HomeView.vue`、`ArticleListView.vue`、`ArticleDetailView.vue`、`Search.vue`、`LoginView.vue`、`RegisterView.vue`、`AboutView.vue`、`ProfileArticlesView.vue`、`Write.vue`。
- 共享表面：`src/components/post/FeaturedHero.vue`、`PostCard.vue`、`PostList.vue`、`ArticleFilters.vue`、`EditorToolbar.vue`、`StatusBar.vue`、`src/components/search/*`、`src/components/comment/*`、`src/components/ui/*`、`src/components/Article.vue`。
- 契约测试与新验证：`src/assets/baseTheme.test.ts`、`src/components/navigation/topHeaderLayout.test.ts`、`src/components/navigation/mobileTopbar.test.ts`，必要时为新增玻璃 token 添加源契约测试。

### Task 1: 建立液态玻璃设计令牌与基础回退

**Files:**
- Modify: `src/assets/base.css`
- Modify: `src/assets/main.css`
- Test: `src/assets/baseTheme.test.ts`

- [ ] **Step 1: 写失败测试，锁定玻璃 token 和回退契约**

  在 `baseTheme.test.ts` 增加测试，读取 `:root` 与 `:root[data-theme='dark']`，断言存在 `--glass-surface`、`--glass-border`、`--glass-highlight`、`--glass-shadow`、`--glass-blur`，并断言 `@supports not (backdrop-filter: blur(1px))` 块存在。

- [ ] **Step 2: 运行测试确认失败**

  运行 `npm run test:run -- src/assets/baseTheme.test.ts`；预期因 token 或回退规则不存在而失败。

- [ ] **Step 3: 实现浅色/深色玻璃 token 和全局背景**

  在两个主题中加入冰白/灰蓝与深海蓝黑的玻璃表面、边界、高光和阴影；为 `body` 添加低饱和背景层；为 `.glass-surface` 提供 `background`、`border`、`box-shadow`、`backdrop-filter: blur(var(--glass-blur)) saturate(...)`；在 `@supports not` 中将背景替换为高不透明度 `var(--surface-strong)`。保留现有字体和业务 token 的兼容别名。

- [ ] **Step 4: 运行测试确认通过并检查对比度**

  运行 `npm run test:run -- src/assets/baseTheme.test.ts`；预期 PASS。对 `--ink-main`、`--ink-muted` 在浅色和深色背景上的对比度维持至少 4.5:1。

- [ ] **Step 5: 提交基础样式**

  运行 `git add src/assets/base.css src/assets/main.css src/assets/baseTheme.test.ts && git commit -m "feat: add liquid glass design tokens"`。

### Task 2: 更新应用壳、导航与移动导航

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/navigation/TopHeaderLayout.vue`
- Modify: `src/components/navigation/TopNavigation.vue`
- Modify: `src/components/navigation/TopBrand.vue`
- Modify: `src/components/navigation/TopThemeToggle.vue`
- Modify: `src/components/navigation/MobileTopTabs.vue`
- Modify: `src/components/navigation/TopFooter.vue`
- Modify: `src/components/search/TopSearchBox.vue`
- Test: `src/components/navigation/topHeaderLayout.test.ts`
- Test: `src/components/navigation/mobileTopbar.test.ts`

- [ ] **Step 1: 写失败测试，锁定玻璃导航结构**

  将导航源契约改为断言 `.topbar` 使用 `var(--glass-surface)`、`backdrop-filter` 和玻璃边界，`.topbar__inner` 使用响应式圆角/阴影，并保留桌面/移动分支、搜索触发器、主题切换和菜单结构。

- [ ] **Step 2: 运行导航测试确认失败**

  运行 `npm run test:run -- src/components/navigation/topHeaderLayout.test.ts src/components/navigation/mobileTopbar.test.ts`；预期旧的实色导航断言失败。

- [ ] **Step 3: 实现桌面与移动玻璃导航**

  保留所有现有 `props`、事件和路由链接；桌面导航设置悬浮玻璃栏、滚动收紧过渡和清晰焦点环；移动导航减少入口、保持 52px 以上触控高度，菜单面板使用高不透明度玻璃回退；搜索框、主题按钮、品牌标识和页脚使用同一套 token。

- [ ] **Step 4: 运行导航测试确认通过**

  运行同一组导航测试；预期 PASS，且没有横向溢出。

- [ ] **Step 5: 提交应用壳**

  运行 `git add src/App.vue src/components/navigation src/components/search/TopSearchBox.vue src/components/navigation/*.test.ts && git commit -m "feat: restyle app shell with liquid glass navigation"`。

### Task 3: 更新首页、文章列表、搜索和文章详情

**Files:**
- Modify: `src/views/HomeView.vue`
- Modify: `src/views/ArticleListView.vue`
- Modify: `src/views/Search.vue`
- Modify: `src/views/ArticleDetailView.vue`
- Modify: `src/components/post/FeaturedHero.vue`
- Modify: `src/components/post/PostCard.vue`
- Modify: `src/components/post/PostList.vue`
- Modify: `src/components/post/ArticleFilters.vue`
- Modify: `src/components/search/SearchDropdownContent.vue`
- Modify: `src/components/search/MobileSearchSheet.vue`
- Modify: `src/components/Article.vue`
- Test: 现有首页、列表、搜索、文章组件测试

- [ ] **Step 1: 写失败测试，锁定页面层级**

  为首页和列表源契约增加断言：精选区域存在玻璃舞台类名，列表卡片和筛选器引用玻璃 token；保留 `usePostsStore`、query 同步、分页、搜索建议和文章链接。

- [ ] **Step 2: 运行相关测试确认失败**

  运行 `npm run test:run -- src/views/HomeView.test.ts src/components/post/ArticleFilters.test.ts src/components/Article.test.ts`；预期新玻璃契约失败。

- [ ] **Step 3: 实现页面与共享内容表面**

  首页使用“大标题 + 精选玻璃舞台 + 最新卡片流”；列表与搜索使用统一筛选玻璃面板；文章正文保持接近实色的高对比阅读面板，目录、操作栏和评论入口使用透明层。桌面端使用多列内容网格，768px 以下切换为单列或可收起筛选器，390px/360px 不产生横向滚动。

- [ ] **Step 4: 运行相关测试确认通过**

  运行上述测试；预期 PASS，并运行 `npm run type-check` 检查模板类型。

- [ ] **Step 5: 提交内容页面**

  运行 `git add src/views/HomeView.vue src/views/ArticleListView.vue src/views/Search.vue src/views/ArticleDetailView.vue src/components/post src/components/search src/components/Article.vue && git commit -m "feat: apply liquid glass content surfaces"`。

### Task 4: 更新认证、个人页、写作页和评论/通用控件

**Files:**
- Modify: `src/views/LoginView.vue`
- Modify: `src/views/RegisterView.vue`
- Modify: `src/views/AboutView.vue`
- Modify: `src/views/ProfileArticlesView.vue`
- Modify: `src/views/Write.vue`
- Modify: `src/components/post/EditorToolbar.vue`
- Modify: `src/components/post/StatusBar.vue`
- Modify: `src/components/comment/CommentSection.vue`
- Modify: `src/components/comment/CommentItem.vue`
- Modify: `src/components/comment/CommentForm.vue`
- Modify: `src/components/comment/ReportDialog.vue`
- Modify: `src/components/ui/*.vue`
- Test: 现有认证、个人页、写作、评论、通用 UI 测试

- [ ] **Step 1: 写失败测试，锁定表单和编辑器玻璃层**

  为认证/写作/评论源契约增加断言：表单面板、工具栏、状态栏、评论输入和弹层使用玻璃 token，同时保留提交、校验、草稿、上传、标签、回复和举报处理。

- [ ] **Step 2: 运行测试确认失败**

  运行 `npm run test:run -- src/views/LoginView.test.ts src/views/RegisterView.test.ts src/views/Write.test.ts src/components/post/EditorToolbar.test.ts src/components/post/StatusBar.test.ts`；预期新契约失败。

- [ ] **Step 3: 实现表单、编辑器、评论和通用控件样式**

  认证和个人页使用玻璃主面板；编辑器正文使用高不透明度书写画布；工具栏和状态栏使用半透明层；评论、模态框、下拉、日期选择、Toast、Skeleton 和 Button 统一边界、焦点、禁用、错误和成功状态。移动端工具栏允许横向滚动或分组折叠，控件最小触控高度为 44px。

- [ ] **Step 4: 运行测试确认通过**

  运行相关测试和 `npm run type-check`；预期 PASS。

- [ ] **Step 5: 提交表单与控件**

  运行 `git add src/views/LoginView.vue src/views/RegisterView.vue src/views/AboutView.vue src/views/ProfileArticlesView.vue src/views/Write.vue src/components/comment src/components/ui src/components/post/EditorToolbar.vue src/components/post/StatusBar.vue && git commit -m "feat: polish forms editor and feedback surfaces"`。

### Task 5: 桌面/移动视觉验收与回归验证

**Files:**
- Inspect: 全部 `src` 页面与共享组件
- Create: `dogfood-output/screenshots/liquid-glass/` 下的桌面/移动截图（不提交业务代码）

- [ ] **Step 1: 运行完整自动化验证**

  依次运行 `npm run test:run`、`npm run type-check`、`npm run lint`、`npm run build`；全部命令必须成功。

- [ ] **Step 2: 运行静态样式扫描**

  使用 `rg` 检查 `src` 中不存在旧的大面积 `radial-gradient(circle...)`、非零 `letter-spacing`、明显破坏玻璃回退的 `backdrop-filter` 用法和负 margin；检查每个玻璃表面都有不透明度回退。

- [ ] **Step 3: 检查桌面端逐项页面**

  在 1440px 和 1024px 视口检查首页、文章列表、文章详情、搜索、登录、注册、个人主页、写作页、评论、下拉和导航；切换浅色/深色，确认无重叠、裁切、不可读文字、焦点缺失或横向溢出。

- [ ] **Step 4: 检查移动端逐项页面**

  在 768px、390px 和 360px 视口检查相同页面及移动搜索、筛选、导航菜单、编辑器工具栏、评论表单和弹层；确认控件可点击、文本可读、没有横向滚动和底部遮挡。

- [ ] **Step 5: 检查降级与减少动态效果**

  在浏览器关闭 `backdrop-filter` 并启用 `prefers-reduced-motion: reduce`，确认页面仍具备明确层级、可读文本、键盘焦点和可用交互。

- [ ] **Step 6: 汇总验证证据并提交验收记录**

  保存关键视口截图和命令输出摘要，运行 `git status --short` 确认没有误提交 `.env`、凭据或无关临时文件，再提交 `git commit -m "test: verify liquid glass responsive UI"`。

