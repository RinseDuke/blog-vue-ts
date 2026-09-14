# 代码审查报告 — blog-vue-ts

- **审查日期**: 2026-09-14
- **审查范围**: 全仓库（`src/` 102 个 TS/Vue 文件、构建配置、测试、项目卫生、安全）
- **质量基线**: `npm run lint` ✅ 0 警告 · `npm run type-check` ✅ 0 错误 · `npm run test:run` ✅ 29 文件 / 93 用例全绿

## 总体评价

代码库整体质量良好：类型纪律严格（除一个第三方 d.ts 外无 `any`）、Vue 3 组合式 API 使用规范、所有手动事件监听器均正确清理、公开文章渲染路径有 DOMPurify 防护、路由守卫与开放重定向防护到位、行为型测试（postService / useAuthStore / writeMarkdown）覆盖了真实边界场景。

主要风险集中在三处：**① mock 后端与真实后端的行为分叉**（切到真实 API 时多个功能会静默损坏）；**② mock 认证以明文密码 + 可伪造会话作为默认运行模式**；**③ 约三分之一的测试是源码文本断言而非行为测试**，且核心网络层 `apiClient.ts` 无测试、无 CI。

---

## 🔴 CRITICAL / HIGH

### 安全

**H-S1. mock 认证默认启用：明文密码持久化 + 演示凭据打包进生产产物**
- `src/features/auth/stores/useAuthStore.ts:63-79`（`DEFAULT_MOCK_LOGIN`，密码 `Demo123456`）、`:180-182`（明文密码写入 `blog_auth_users_v1`）、`:291`、`:340`
- `isMockMode()` 在 `VITE_USE_MOCK !== 'false'` 或 `VITE_API_BASE_URL` 为空时均为 true（`apiClient.ts:131-133`）——一次环境变量遗漏就会让生产部署静默降级到 mock 认证。
- 风险：任何 XSS 或共享机器场景可直接读取所有注册用户密码；演示凭据可被 grep 于生产 JS bundle。
- 建议：mock 认证用 `import.meta.env.DEV` 门控；生产构建剔除 `DEFAULT_MOCK_LOGIN`；`API_BASE_URL` 为空时在生产模式直接构建失败或高声告警。

**H-S2. mock 模式下授权完全在客户端，会话可伪造**
- `useAuthStore.ts:189`（token = `mock-token-${Date.now()}`）；`postService.ts:126-139, 356-372` 的所有权校验读取同一份可伪造的 localStorage 会话。
- 风险：任何访客可在 devtools 手工构造 `blog_auth_session_v1`，删除/编辑他人文章、读取 private/draft 文章。
- 建议：与 H-S1 一并处理——确保 mock 模式不可能出现在生产构建中，并在文档中明确声明。

### 架构

**H-A1. mock 与真实后端行为分叉，切换真实 API 时多功能静默损坏**
- `postService.ts:343-351`：真实模式 `createPost` 丢弃 `tags`、`html`、`coverImage`（数据丢失）。
- `postService.ts:173-194`：`mapBackendBlogToPost` 返回 `tags: []`、无 `likes`/`featured`、`slug = id` → 标签筛选、点赞、精选区块全部失效。
- `postService.ts:200`：`buildBlogsQuery` 恒设 `only_public=true` → 真实模式下 `fetchUserPosts` 永远拿不到自己的草稿/私密文章（mock 模式可以，`:247-254`）。
- `postService.ts:309`：`setPostLike` 在真实模式无条件 throw。
- `commentService.ts:25,57,76`：真实模式假设后端返回与前端完全一致的 camelCase 形状，无任何映射（对比 postService 的 `BackendBlog` 映射），对接 snake_case API 几乎必坏。
- 建议：见 H-A2 的接口化重构，让分叉以"缺失接口方法"的形式显式暴露。

**H-A2. mock 业务逻辑内联在每个 service 函数中，无抽象边界**
- `postService.ts` / `commentService.ts` / `profileService.ts` / `reportService.ts` / `useAuthStore.ts` 每个函数都以 `isMockMode()` 分支内联完整 mock 逻辑（slug 生成、点赞计数、localStorage 持久化 `postService.ts:41-102`）；`src/mocks/` 只有种子数据。
- 风险：接入真实 API 需要外科手术式删除数百行交错代码。
- 建议：每个领域定义一个接口，mock 实现放 `src/mocks/`、HTTP 实现放 `src/services/`，由工厂一次性选择。此重构可同时解决 H-A1、H-A3、M-A1。

**H-A3. 分层倒置：services 反向依赖 feature stores**
- `postService.ts:4`、`commentService.ts:3`、`profileService.ts:2`、`reportService.ts:2` 均 import `@/features/auth/stores/useAuthStore`；`postService.ts:2` import `@/features/post/utils/post`。
- 风险：与 AGENTS.md 声明的分层（services 在 features 之下）矛盾，形成双向耦合，service 脱离 auth feature 无法测试。
- 建议：把会话读取抽到中性模块（如 `src/services/authSession.ts`），auth store 与 services 共同消费。

**H-A4. `apiClient.ts` 重复实现 auth 存储知识**
- `apiClient.ts:44-57` 硬编码 `'blog_auth_session_v1'`（该 key 在仓库 10 个文件中重复出现）并独立解析会话 JSON。key 或形状一旦变更，请求会静默失去认证（401 且无明确原因）。
- 建议：单一事实来源——导出共享常量/读取器，或由 auth store 通过 setter 注入 token。

### 视图 / 组件

**H-V1. `Article.vue:74-110` 快速导航竞态**
- `loadPostById` 无过期响应防护：A→B 导航时若 A 的 fetch 较慢，A 的响应会覆盖 B 的渲染（URL 是 B、内容是 A）。`document.title`（`:94`）在导航离开/出错时也从不恢复。
- 建议：await 后校验 `route.params.id === id` 再赋值，或使用请求令牌。

**H-V2. `SkeletonLoader.vue:76,113,122` 硬编码亮色**
- `#eef1f5`/`#dde3ea` shimmer 不随主题变量，暗色模式下文章详情加载骨架显示异常。
- 建议：改用 `var(--line-soft)`/`var(--surface-strong)`。

**H-V3. `AboutView.vue:129-143` 简介保存失败静默**
- 仅 `console.error`，用户点"保存"后 spinner 结束、无任何反馈。
- 建议：参照 LoginView 模式，在 UI 中暴露 `errorMessage` 状态。

**H-V4. 搜索建议与下拉键盘不可达（a11y）**
- `TopSearchBox.vue:26-39` + `SearchDropdownContent.vue`：wrapper 有 `role="listbox"` 但内部是普通 button（无 `role="option"`），input 缺 `aria-expanded`/`aria-controls`/`aria-activedescendant`，无方向键/Enter 导航。`DropdownSelect.vue:86-99` 同样问题。
- `AboutView.vue:204-217`：tab 栏无 `role="tablist"/"tab"`、`aria-selected`、方向键导航、tabpanel 关联。

### 测试 / 工程

**H-T1. 29 个测试文件中 11 个是源码文本（`?raw`）断言，非行为测试**
- 涉及 `Article.test.ts`、`StatusBar.test.ts`、`EditorToolbar.test.ts`、`ArticleFilters.test.ts`、`mobileTopbar.test.ts`、`topHeaderLayout.test.ts`、`HomeView.test.ts`、`AboutView.test.ts`、`Write.test.ts`、`RegisterView.test.ts`、`prelaunchHints.test.ts`。
- 这些测试 import `.vue` 原始文本并断言 `toContain('article-footer')`：任何运行时 bug 都能通过，任何良性重构（改 class 名）都会失败。"93 用例全绿"的信号被稀释——约三分之一是伪装成测试的 grep。
- `vitest.config.ts` 使用 `environment: 'node'`，无 `@vue/test-utils`/jsdom/happy-dom → **没有任何组件被真正挂载渲染测试**。
- 建议：引入 `@vue/test-utils` + `happy-dom`，优先把 StatusBar / EditorToolbar / ArticleFilters 转为挂载测试，其余文本断言退役。

**H-T2. 无 CI、无覆盖率配置**
- 仓库无 `.github/`；`vitest.config.ts` 无 `coverage` 块；`@vitest/coverage-v8` 不在 devDependencies。AGENTS.md 要求的回归（lint + test:run + build）完全靠手动。
- 建议：添加 CI workflow 跑三条命令；加覆盖率 provider 与阈值，让下述缺口可见。

**H-T3. 核心网络层 `apiClient.ts` 无测试**
- 其中 `ApiError` 消息提取、auth header 注入（含损坏会话回退）、204 处理、envelope 解包、`isMockMode()` 语义全部纯逻辑可测。所有 service 依赖它，回归会破坏一切且无测试能发现。
- 同样未测（纯逻辑、优先级次之）：`usePostsStore.ts`（缓存 + 并发去重，README 宣称的核心数据层）、`useSearchHistory.ts`、`useReadingProgress.ts`、`LivePreviewPlugin.ts`（243 行）、`router/index.ts` 守卫。
- 建议：优先补 `apiClient.test.ts` 与 `usePostsStore.test.ts`。

---

## 🟡 MEDIUM

### 架构 / 核心层

| # | 位置 | 问题 | 建议 |
|---|------|------|------|
| M-A1 | `commentService.ts:8-15`、`profileService.ts:31-38`、`reportService.ts:8-15` | `requireAuthSession` 逐字重复定义 3 次（`useAuthStore.ts:235` 已导出） | import 共享版本 |
| M-A2 | `apiClient.ts:59-129` | `apiFetch`/`apiFetchPaginated` 重复 ~30 行；paginated 变体缺 204 无 body 处理 | 抽公共 `doFetch` |
| M-A3 | `apiClient.ts:24-42` | `ApiError.errorType` 构造器解析了 `error_type` 却从不赋值，调用方也不传——死 API | 赋值或删除字段 |
| M-A4 | `features/post/composables/usePostsStore.ts` | Pinia store 放在 `composables/`（auth/comment/theme 均在 `stores/`） | 移到 `features/post/stores/` |
| M-A5 | `useAuthStore.ts:273-370` | auth store 绕过 service 层直接 `apiFetch('/login')`，并内联整个 mock 用户库（`:131-182`） | 建 `authService`，与 H-A2 一并解决 |
| M-A6 | `useCommentStore.ts:20-32,45,94` vs `usePostsStore.ts:35-38` | 错误契约不一致：`loadComments` 吞错不 rethrow，`addComment`/`likeComment` rethrow；共享单一 `error` 字符串会被后台 like 失败覆盖 load 错误 | 统一约定（建议全部 rethrow，error 按关注点分离） |
| M-A7 | `profileService.ts:87-158` | 风格与其他 service 分叉：class 单例（其余是函数模块）、内联 `new Promise(setTimeout)`（不用共享 `networkDelay`）、`getProfile` 用 `POST /users/me` 做读操作 | 统一为函数模块；与后端确认 POST 读语义 |
| M-A8 | `apiClient.ts:131-133` | `isMockMode()` 隐藏覆盖：`VITE_USE_MOCK=false` 但 `VITE_API_BASE_URL` 为空仍是 mock，与 AGENTS.md 文档矛盾 | 至少文档化；建议触发回退时打警告 |
| M-A9 | `router/index.ts:14-62` | 无 catch-all 路由，未知路径渲染空白页 | 加 `/:pathMatch(.*)*` 404/重定向 |
| M-A10 | `types/post.ts:7`、`useAuthStore.ts:8`、`profileService.ts:4` | `Author`/`AuthUser`/`UserProfile` 三种用户形状重复且字段名分叉（`name`/`username`/`displayName`、`avatarUrl`/`avatar`），迫使 `buildAuthor`/`mapBackendProfile` 做 ad-hoc 映射 | 在 `src/types/` 派生公共基类 |

### 安全

| # | 位置 | 问题 | 建议 |
|---|------|------|------|
| M-S1 | `Write.vue:102,282,394` + `writeMarkdown.ts:49` | 写作页预览与持久化的 HTML 绕过 DOMPurify。当前仅靠 markdown-it 默认 `html:false` + `validateLink` 兜底；一次配置改动（`html:true`）或 markdown-it CVE 即变成存储型 XSS（作者预览 + 持久化 payload）。公开渲染路径（`Article.vue:71`）已消毒，终端用户安全 | `renderWriteMarkdownToHtml` 输出在 `v-html` 与持久化前过 `DOMPurify.sanitize()`（纵深防御） |
| M-S2 | `postService.ts:117` | `avatarUrl: https://i.pravatar.cc/150?u=${email}` — 每个访客浏览器把作者完整 email 发给第三方；email 也存于 `blog_published_posts_v1` | 用哈希（gravatar 式）或本地头像；从公开 `Post.author` 形状剥离 `email` |
| M-S3 | `profileService.ts:106-111` | 真实模式 `POST /users/me` 携带客户端提供的 `user_id`——若后端信任该字段而非从 Bearer token 推导身份，即 IDOR（任意用户读任意 profile） | 请求移除 `user_id`，身份必须由服务端从 token 推导 |
| M-S4 | `redirect.ts:10` | 开放重定向校验漏掉反斜杠/编码绕过：拒绝 `//host` 但接受 `/\evil.com`、`/%2F%2Fevil.com`（WHATWG URL 把 `\` 当 `/`）。当前经 `router.next()` 消费同源强制，实际可利用性低，但一旦有人用于 `location.href` 即破 | 同时拒绝含 `\` 与 URL 解码后 `//` 的串，或 `new URL(redirect, location.origin).origin === location.origin` |
| M-S5 | `useCoverUpload.ts:3,46` + `useDraft.ts:71-79` | 封面上传无大小上限、`file.type` 客户端可控（MIME 白名单 jpeg/png 无 SVG——好）；data URL 持久化进 localStorage 草稿与发布存储，几张大图即撑爆 ~5MB 配额（静默保存失败） | 强制大小上限（如 2MB），理想情况客户端降采样，校验魔数；真实后端上传须复验类型/大小 |
| M-S6 | `apiClient.ts:2` + 各 service 静态 import mocks | mock 代码与数据始终打进生产 bundle（静态 import，flag 只是运行时分支非构建期 tree-shaking） | mock 经 `import.meta.env` 门控的动态 `import()` 加载，让 Rollup 可摇掉 |

### 视图 / 组件

| # | 位置 | 问题 | 建议 |
|---|------|------|------|
| M-V1 | `ui/Modal.vue`、`ui/Toast.vue`、`ui/EmptyState.vue`、`ui/Button.vue`、`post/FeaturedHero.vue`、`article/ReadingProgress.vue`（+ `useReadingProgress`）、整个 `comment/` 子树 | **~1200 行死组件树**，全仓库无 import（comment 组件源码标注"弃用中"）。且各自带 bug：Modal 无焦点陷阱/恢复；Toast `setTimeout` 未清；ReportDialog 静态 `id="report-title"`、无 ESC、`background:#fff`；comment 组件 `catch {}` 吞错、硬编码白底 | 要么接入（Toast 替换 `Write.vue` 的 `alert()`；Modal 替换 `ProfileArticlesView.vue:73,92` 与 `Write.vue:354` 的 `window.confirm`），要么删除。勿原样复活 |
| M-V2 | `ArticleListView.vue:244-265` vs `:387-389` | `.feed__toolbar { display: none }` 且无任何媒体查询恢复——搜索/排序/每页数输入是死标记，与 `ArticleFilters` 侧栏重复。后果：关键词筛选 UI 不可达（仅 `?keyword=` URL），因侧栏无关键词字段 | 删工具栏，或把关键词输入移入 ArticleFilters |
| M-V3 | `LoginView.vue` / `RegisterView.vue` | ~250 行近乎相同的样式（brand panel、`.field`、`.field__toggle`、`.submit-btn`、spinner `@keyframes spin`）与重复 brand SVG | 抽共享 `AuthLayout` 组件 + 公共 LESS |
| M-V4 | `HomeView.vue:56` | "共 {{ latestPosts.length }} 篇"实际至多 `HOME_POST_LIMIT`(12)，非真实总数（`postsStore.sortedPosts.length`）。digest(`:91-109`)与 stream(`:112-132`)项标记结构重复；`.feed__grid`(`:223-233`)死样式 | 修正计数文案；抽 `PostListItem` 带 variant；删死样式 |
| M-V5 | `PostCard.vue:18` | 模板内联 DOM 操作 `@error="($event.target as HTMLImageElement).style.display='none'"`；头像缺 `loading="lazy"`（列表渲染多卡） | 用 ref/error 状态 + 兜底初始图；加 lazy |
| M-V6 | `App.vue:187` | 全局（非 scoped）`<style lang="less">` 泄漏通用类名（`.layout`、`.page`、`.mobile-search-trigger`）到全应用命名空间；移动搜索 SVG(`:153-156`)缺 `aria-hidden` | scope 化或移入专用样式表 |
| M-V7 | `EditorToolbar.vue:482-511` | `window.prompt` 输入链接无 URL scheme 校验（可写入 `javascript:` URL；DOMPurify 渲染时会剥，但编辑器内仍显示）；strike/orderedList/link/table/hr/clear 按钮在桌面主行与"更多"菜单逐字重复 | 校验 scheme；抽配置驱动循环 |
| M-V8 | `StatusBar.vue:114` | `save-draft` emit 死代码：声明并在 `Write.vue:141` 绑定，但 StatusBar 从不 emit；mode 图标经 `v-html` 注入静态 SVG 串(`:46`) | 删或补按钮；图标改内联模板/函数组件 |
| M-V9 | `App.vue:107`、`TopHeaderLayout.vue:30`、`BackToTop.vue:45`、`useScrollCondense` | 四个独立 scroll 监听器（均正确清理），但仅 BackToTop 做 rAF 节流 | 考虑共享 scroll service/composable |
| M-V10 | `ArticleListView.vue:280-292` | 分页缺 `aria-current="page"`，激活态仅靠颜色传达 | 补 aria-current |
| M-V11 | `MobileSearchSheet.vue` | 无 ESC 关闭、关闭时无焦点恢复到触发器（打开时聚焦 `:69-76` 是好的）、无焦点陷阱（Tab 会逃到背后） | 补 ESC / 焦点恢复 / 陷阱 |
| M-V12 | `ArticleDetailView.vue` + `Article.vue` | 边界错位：view 是空壳，全部数据获取/渲染在 `components/Article.vue`，与 AGENTS.md 约定（页面逻辑在 views/）矛盾 | 把 Article.vue 内容移入 ArticleDetailView，删空壳 |

### 测试 / 风格 / 卫生

| # | 位置 | 问题 | 建议 |
|---|------|------|------|
| M-T1 | `src/services/*.ts`、`src/mocks/comments.ts` | 缩进分裂：services 用 4 空格，其余 2 空格。AGENTS.md 规定 2 空格，但 `eslint.config.mjs` **无任何风格规则**（无 indent/quotes/semi）——"ESLint 是强制风格工具"目前不成立 | 重排 services 目录；加 `@stylistic/eslint-plugin` 防漂移 |
| M-T2 | 10 个文件 | 魔法串 `'blog_auth_session_v1'` 重复（`useAuthStore.ts` 定义 `AUTH_KEY`，但 `apiClient.ts` 内联两次、8 个测试文件各自重声明）。key 重命名会静默破坏 token 注入 | 导出单一常量，全仓 import |
| M-T3 | `README.md:210` 等 | README 过期：引用不存在的 `docs/CODEBASE_MAP.md`；"现有测试文件"表只列 2 个（实际 29）；路由表漏 `/register` 与 profile 视图 | 更新或删除这些节；坏文档链接快速侵蚀信任 |
| M-T4 | `tsconfig.app.json:4` | 过期排除：`src/components/front.vue`（文件不存在）、`src/**/__tests__/*`（项目约定是 co-located `*.test.ts`，该模式匹配不到任何东西） | 删死配置 |
| M-T5 | `package.json:15` | `eslint . --ext .ts,.vue` —— `--ext` 是 eslintrc 时代 flag，flat config（ESLint 9+/10）不支持，至多被忽略，误报实际 lint 范围 | 改 `eslint .` |
| M-T6 | `.gitignore:55-57` | AGENTS.md / CLAUDE.md 被 git 忽略——仓库指南（AGENTS.md 自身声明的构建命令、风格规则）未提交，clone 的队友看不到；而 OPTIMIZ.md（工作计划文档）却被跟踪 | 有意决定：提交 AGENTS.md（常见做法）或把内容并入 README/docs |
| M-T7 | `OPTIMIZ.md`（根，14KB，已跟踪） | 分阶段 UI 优化计划，工作产物而非持久文档 | 移到 `docs/`（或 `docs/superpowers/plans/`）或完成后删除 |

---

## 🟢 LOW

- **L1.** `types/turndown-plugin-gfm.d.ts:2-6`：5 个 `any[]` 签名——第三方 shim 可接受，可改 `(...args: unknown[]) => void`。
- **L2.** `postService.ts:283-285`：`fetchPostBySlug` 误导性别名，仅调 `fetchPostById`；真实模式 slug 无法解析 `/blogs/{id}`。删或实现 slug 查找。
- **L3.** `useSearchHistory.ts:17-19`：解析数组不校验元素类型，可加 `.filter((x): x is string => typeof x === 'string')`（仓库别处如 `isStoredPost` 已正确这么做）。
- **L4.** `reportService.ts:41`（`console.info` 每次 mock 上报）、`profileService.ts:97`（`console.error`）：生产路径日志，应 `isMockMode()` 门控或删除。
- **L5.** `useAuthStore.ts:249-250`：`username` 与 `displayName` 是相同 computed，合并或区分。
- **L6.** `postService.ts:306` / `commentService.ts:73`：mock like 回退对未知 ID 伪造计数 `liked ? 1 : 0` 而非报错，掩盖 bug（仅 mock，低影响）。
- **L7.** `Write.vue:262-264`、`ArticleFilters.vue:41-44,104`：Unicode 转义中文字面量（`'\u5df2\u8bbe\u5c01\u9762'`），其余文件用明文——diff 不可读、不一致。
- **L8.** `RegisterView.vue:247-260`：`.register-card__switch` 块背靠背定义两次。
- **L9.** 魔法数 68px/52px header 高度重复（`App.vue:194,253`、`LoginView:125`、`RegisterView:179`、`Write.vue:503,1071`、`ArticleFilters:156`）——提升为 CSS 变量（参照已有 `--write-status-bar-height`）。
- **L10.** 内联 `style` 属性：`Article.vue:3`（`padding:2rem`）、`App.vue:124`（sentinel div）——移入 scoped CSS。
- **L11.** `AboutView.vue:231`：v-for key `${item.type}-${item.title}` 可碰撞（两篇同标题同类型文章）；应携带 `post.id`。`:25-35` 硬编码兜底 profile 与 `:98-101` `relationshipMetrics` 是烤进视图的 mock 数据。
- **L12.** 薄包装：`formatDate`/`formatLatestDate`（`Article.vue:112`、`HomeView.vue:19`、`FeaturedHero.vue:35`）仅转发 `formatPostDate`——直接调。`Article.vue:26` 头像 `loading="eager"`（below-fold 用 lazy 即可）。
- **L13.** `TopBrand.vue:6`：注释掉的 `<em></em>` 及其死 CSS(`:46-56`)——删。
- **L14.** `StatusBar.vue:46`：`v-html="mode.icon"` 渲染文件内静态 SVG 串(`:125-134`)——今日安全，建议内联组件以让 `v-html` 退出代码库。相关：`eslint.config.mjs:36` 全局关 `vue/no-v-html` 而非按行。
- **L15.** 会话 token 存 localStorage/sessionStorage（`useAuthStore.ts:252-259`、`apiClient.ts:44-57`）——标准 SPA 取舍，任何 XSS 下可外泄。真实后端模式可考虑 httpOnly cookie（会重新引入 CSRF——当前无 cookie 面，仅 Bearer header）。
- **L16.** 依赖态势良好：`dompurify ^3.3.0`、`markdown-it ^14.1.1`、`vue ^3.5`、`vite ^7`、`tiptap ^3.20` 均当前主版本。关注项：`turndown-plugin-gfm ^1.0.2` 无人维护（~2019 最后发布）；`@types/markdown-it`、`@types/turndown` 在 `dependencies` 而非 `devDependencies`（卫生，非安全）。
- **L17.** `.review-article-detail.png` / `.review-article-list.png`（~580KB，根目录）——未跟踪且已正确 git-ignore，但本地杂物，删。
- **L18.** `docs/propmt.md`——文件名拼写错误（"propmt"），内容是过去审查的 20 行元笔记，未来价值低。`docs/superpowers/` 24 个 AI 计划/规格文档，作存档可，考虑 `docs/archive/`。
- **L19.** `.gitignore` 经 `*.local` 覆盖 `.env.local`，但未覆盖裸 `.env`——显式加 `.env` 更稳。
- **L20.** 提交前缀漂移：近 8 次提交出现 `fixed:`、`fixe:`、`fix:`、`improve:`、`docs:`——装饰性，但 commit-msg 约定有助 changelog。
- **L21.** 测试样板：相同 `StorageLike`/`createStorageMock()` 助手在 `postService.test.ts`、`useAuthStore.test.ts` 等多处复制——抽到共享 `src/test-utils/`。

---

## ✅ 做得好的地方（无需行动）

- **公开文章渲染**：`Article.vue:69-72` 对所有 `v-html` 内容（含插值摘要兜底）用 DOMPurify 默认配置消毒——正确。
- **路由守卫**：`router/index.ts:66-82` 用 `requiresAuth` 保护 `/write` 与 `/about/articles`，登录后重定向经（大体上）校验的 `resolveAuthRedirect`；`redirect.ts` 正确阻断 `//` 开放重定向。
- **无硬编码密钥**：`src/` 无任何 API key/secret；无 cookie/CSRF 面；无 `innerHTML`/`document.write`。`.env.example` 最小、信息充分、无密钥；无 `.env` 被提交。
- **评论系统 XSS 安全**：`CommentItem.vue:82` 用 `{{ }}` 文本渲染内容与作者名，comment feature 无 `v-html`；`CommentForm.vue` 强制长度上限。
- **`useThemeStore`**：干净的水合、SSR 安全守卫、存储失败容忍；`main.ts` 在 router 安装前正确水合主题避免闪烁。
- **`usePostsStore`**：优秀的 in-flight 去重 + 缓存模式（除文件夹位置 M-A4）。
- **Feature utils**（`redirect.ts`、`registerValidation.ts`、`calendarDate.ts`、`articleListQuery.ts`、`post.ts`）：纯函数、类型良好、测试充分。
- **Composables**（`useDraft`、`useCoverUpload`、`useTagManager`、`useSearchDropdown`、`useReadingProgress`、`useScrollCondense`）：一致工厂风格、监听器/observer 正确清理、细致的 legacy 存储迁移。
- **`LivePreviewPlugin.ts`**：扎实的 ProseMirror decoration 插件——plugin key、selection/doc 变更重建、去重守卫、无 DOM 泄漏。
- **Vue 3 惯用法整体良好**：一致 `<script setup>`、正确 computed vs methods、到处 `storeToRefs`、v-for key 齐全、`defineAsyncComponent` 用于 ProfileEntryView 登录分割，每个手动 document/window 监听器都在 unmount 移除。
- **`Write.vue` 草稿生命周期**（自动保存队列、`beforeunload` flush、发布时取消）与 **`ArticleListView` URL↔状态同步**（`isApplyingRouteState` + `nextTick` 守卫）做得细致；`Search.vue`、`PostList.vue` 干净。
- **行为型测试质量真实**：`postService.test.ts` 覆盖匿名拒绝、跨用户草稿/私密可见性、id/slug 碰撞去重、损坏存储回退；`useAuthStore.test.ts` 覆盖重名注册；`writeMarkdown.test.ts` 做真实往返断言。mock 最小且手搓——无过度 mock。
- **卫生基础扎实**：`dist/` 未被跟踪；`.gitignore` 覆盖 node_modules/dist/coverage/AI 产物；工作树干净；无 TODO/FIXME；`src` 无 `console.log`；无注释掉的代码块。
- **`vite.config.ts`** vendor 分块（prosemirror/tiptap/markdown 拆分）合理，`patchNodeWebStorage` devtools 变通带恰当 WHY 注释。
- **命名约定**（PascalCase 组件、`useXxx` composable/store、camelCase）在所有抽样处一致遵循。

---

## 建议行动优先级

1. **立即（安全/正确性）**：H-S1 + H-S2 + M-S6（mock 认证门控到 DEV、生产剔除演示凭据、`API_BASE_URL` 空时高声失败）；H-V1（文章导航竞态）；M-S1（写作页 HTML 过 DOMPurify）；M-S3（移除 `user_id`，待后端确认）。
2. **短期（架构投资，解锁真实 API 接入）**：H-A2 接口化重构（一并解决 H-A1、H-A3、M-A1、M-A5）；H-A4 + M-T2（auth key 单一事实来源）。
3. **短期（测试可信度）**：H-T2（CI + 覆盖率）；H-T3（补 `apiClient.test.ts`、`usePostsStore.test.ts`）；H-T1（引入 `@vue/test-utils`，转换高价值文本断言测试）。
4. **中期（清理/一致性）**：M-V1（删或接死组件树）；M-V2（删死工具栏或补关键词筛选）；M-A9（404 路由）；M-T1（services 缩进 + 风格 lint 规则）；M-T3/T4/T5（README/tsconfig/lint script 修正）；M-T6（决定 AGENTS.md 是否提交）。
5. **持续**：a11y 项（H-V4、M-V10、M-V11）、样式去重（M-V3）、LOW 项按触及顺带处理。
