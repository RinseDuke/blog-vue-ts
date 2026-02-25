# Codebase Map

## 1. 项目定位
- 技术栈：Vue 3 + TypeScript + Vite + Vue Router。
- 项目类型：博客前端（首页列表、文章页、搜索页、写作页、关于页）。
- 数据来源：支持 `Mock` 与真实后端切换（环境变量控制）。

## 2. 入口与运行链路
1. `src/main.ts` 创建应用并挂载路由。
2. `src/App.vue` 提供全局布局（导航、全局搜索、页脚）并承载 `RouterView`。
3. `src/router/index.ts` 将路径映射到 `views`。
4. `views` 内组合 `components` 与 `services` 完成功能页面。

## 3. 路由地图
- `/` -> `HomeView.vue`（首页，内部使用 `FrontPage.vue` 展示文章列表）
- `/article` -> `ArticlePage.vue`（文章列表 + 筛选）
- `/article/:slug` -> `ArticlePage.vue`（文章详情模式，内部渲染 `Article.vue`）
- `/search` -> `Search.vue`（搜索与结果）
- `/write` -> `Write.vue`（编辑器页面）
- `/about` -> `AboutView.vue`（个人主页样式展示）

## 4. 数据与类型
- `src/types/post.ts`
  - 核心实体：`Post`、`Author`。
- `src/mocks/posts.ts`
  - 本地 Mock 文章数据源。
- `src/services/postService.ts`
  - `fetchPosts(params)`：拉取列表（支持 `limit`、`featuredOnly`）。
  - `fetchPostBySlug(slug)`：按 `slug` 拉取详情。
  - 通过 `VITE_USE_MOCK` 和 `VITE_API_BASE_URL` 控制 Mock/真实后端。

## 5. 页面职责
- `FrontPage.vue`
  - 首页文章卡片流，按发布时间排序展示。
- `ArticlePage.vue`
  - 列表模式：标签/时间筛选 + 列表展示。
  - 详情模式：存在 `slug` 时切换到 `Article.vue`。
- `Article.vue`
  - 文章详情渲染（标题、作者、封面、正文、标签）。
- `Search.vue`
  - 搜索结果页，含推荐、历史、相关度排序、下拉建议。
- `Write.vue`
  - 写作页（当前用 `Vditor` 初始化编辑器，保留了 WangEditor 相关遗留代码）。
- `AboutView.vue`
  - 个人主页/数据看板风格展示页（静态内容）。

## 6. 目前结构性风险
1. 搜索逻辑重复：`App.vue` 与 `Search.vue` 均实现了历史、推荐、相关度算法，后续维护成本高。
2. 编辑器实现混杂：`Write.vue` 同时存在 WangEditor 与 Vditor 的痕迹，存在无效状态与无用变量。
3. 富文本安全：`Article.vue` 直接 `v-html` 渲染正文，接入真实后端后存在 XSS 风险。
4. 依赖清理：`package.json` 中有 markdown 相关依赖，当前页面未形成统一渲染管线。

## 7. 建议重构顺序
1. 抽离 `search` 领域模块：`composables/useSearch.ts`（相关度、推荐、历史）。
2. 固化编辑器方案：保留单一编辑器并删除遗留变量/回调。
3. 引入正文净化：在详情页对 HTML 内容做统一 sanitize。
4. 新增测试：
   - 服务层（mock/real 切换与异常分支）
   - 搜索排序规则
   - 路由关键路径（`/article/:slug`、`/search`）

## 8. 构建与验证
- `npm run type-check`：通过。
- `npm run build`：通过（产物输出到 `dist/`）。
