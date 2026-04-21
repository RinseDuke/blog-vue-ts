# 现代化 UI 打磨与功能扩展设计

## 目标

- 在保留现有 Apple + GitHub 视觉语言（Manrope 字体、品牌蓝 `#0071e3`、毛玻璃表面）的前提下，提升博客前台的现代感与功能性。
- 引入一组经过约束的功能特性：阅读进度条、悬浮目录、作者信息卡、命令面板（⌘K）、视图过渡、首页头图、滚动压缩导航、返回顶部按钮。
- 所有功能必须与 `C:\Users\Rinne\Desktop\Project\antarctica-dev\docs\API_DOCUMENTATION.md` 中后端第一阶段能力对齐，并遵守 `2026-04-06-backend-first-frontend-integration-design.md` 中的灰度隐藏规则。

## 非目标

- 不更换字体家族、不调整品牌色、不重构现有色彩体系。
- 不修改写作页、登录/注册页、个人中心页的布局与交互。
- 不新增后端接口、不改动后端字段。
- 不引入与后端能力冲突的功能：
  - **不做**分享菜单
  - **不做**相关文章推荐
  - **不做**标签相关的命令面板过滤
  - **不展示**封面、标签、精选状态、点赞数、评论区等灰度字段
- 不重写深色模式语义，仅在必要时为新增令牌补充深色覆盖。

## 协议准绳

- 前端新增数据源一律通过现有 `apiClient.ts` / `apiFetchData` / `apiFetchPage` 封装调用真实后端。
- 后端博客模型（`GET /blogs/{id}`）返回字段：`id`、`title`、`content`、`html_content`、`author: {id, username}`、`created_at`、`updated_at`、`visibility`。本设计仅消费这些字段。
- 后端用户模型（`GET /users/{id}`）返回字段：`id`、`username`、`nickname`、`email`、`avatar`、`bio`、`created_at`、`last_login_at`、`visibility`。作者信息卡消费 `nickname`、`avatar`、`bio`。
- 摘要、阅读时长等派生字段由前端根据 `content` / `html_content` 计算，继续沿用现有 Post ViewModel 映射层。

## 总体分层

```
视图层 (views/*)
   ↓
页面级组件 (components/article/*、components/post/*、components/ui/*)
   ↓
组合式函数 (features/article/composables/*、features/ui/composables/*)
   ↓
Services（沿用现有 postService、profileService）
   ↓
apiClient.ts → 后端 /api/v1
```

新增组件不直接消费后端原始响应。作者信息通过新增的 `useAuthorProfile` 组合式函数调用 `apiFetchData<BackendUser>` 获取，并在模块级缓存中按作者 ID 去重。既有 `profileService` 的当前用户单例职责保持不变。

## 设计令牌

所有令牌以增量方式写入 `src/assets/base.css`，不修改现有令牌值。

### 字体尺寸比例

```
--text-xs: 0.78rem;
--text-sm: 0.88rem;
--text-base: 1rem;
--text-lg: 1.13rem;
--text-xl: 1.31rem;
--text-2xl: 1.63rem;
--text-3xl: 2.06rem;
--text-display: 2.75rem;
```

### 运动令牌

```
--motion-fast: 120ms;
--motion-base: 220ms;
--motion-slow: 420ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

### 焦点环

```
--focus-ring: 0 0 0 3px color-mix(in srgb, var(--brand-500) 32%, transparent);
```

深色模式下 `--focus-ring` 覆盖为基于 `--brand-400` 的同构表达式。

## 导航与滚动行为

### 滚动压缩顶栏

- 基线高度：桌面 68px、移动 52px；压缩后分别为 56px 与 48px。
- 触发机制：`useScrollCondense` 在页面顶部放置一个高度为 1px 的哨兵元素，通过 `IntersectionObserver` 监听哨兵是否离开视口。不使用 `scroll` 事件监听器计算 `scrollY`。
- 切换方式：`TopHeaderLayout.vue` 根据 `isCondensed` 切换 CSS 类，内部通过 `transform: scale()` 与 `padding` 过渡完成视觉变化，过渡曲线使用 `var(--motion-base) var(--ease-standard)`。
- 与 `isNavHidden` 共存：原有写作页的隐藏逻辑保留，压缩仅在未隐藏时生效。

### 阅读进度条

- 仅在 `route.name === 'article-detail'` 时渲染。
- 组件：`ReadingProgress.vue`（固定定位，紧贴顶栏底部边缘，高 2px）。
- 计算方式：`useReadingProgress` 通过 `scroll` 事件（被动监听）读取文章容器的 `getBoundingClientRect()`，计算 `(viewportHeight + scrollY - articleTop) / articleHeight`，结果夹紧到 `[0, 1]`。
- 渲染方式：固定定位的单个 div，通过 `transform: scaleX(progress)` 配合 `transform-origin: left` 驱动动画，启用 GPU 合成。
- 路由变更时自动卸载并重置监听。

### 返回顶部按钮

- 组件：`BackToTop.vue`。
- 触发：`scrollY > 600` 时淡入。
- 样式：右下 44×44 圆形，使用 `--surface-overlay` 背景与 `--shadow-md`。
- 交互：点击后 `window.scrollTo({ top: 0, behavior: 'smooth' })`。
- 隐藏场景：写作页沿用 `isWritePage` 判断。
- 过渡：进出使用 `var(--motion-base) var(--ease-out)` 的 opacity + 8px `translateY`。

## 首页头图

### FeaturedHero.vue

- 数据来源：`usePostsStore` 的 `sortedPosts[0]`（已由 `/blogs/latest` 提供）。不使用 `featured` 字段。
- 布局：
  - 桌面：通栏卡片，高度 380px。
  - 移动：高度 220px，标题降级到 `--text-2xl`。
- 内容（纯排版，无封面依赖）：
  - 顶部小标签（kicker）：固定文案 `最新`。
  - 标题：`post.title`，`--text-display`，`letter-spacing: -0.02em`。
  - 摘要：从 `post.excerpt` 读取（映射层已从 `content` 派生），2 行截断。
  - 底部元信息：作者昵称、发布日期、阅读时长（均来自现有 Post ViewModel）。
  - CTA：`阅读文章` 按钮，跳转到 `/article/:id`。
- 表面：`--write-panel-bg` 风格的径向 + 线性渐变，确保无封面时仍有视觉层次。
- 不展示：标签、点赞、评论数、封面图。
- 页面集成：`HomeView.vue` 在现有 `最新文章` 列表之上渲染该头图，列表仍为剩余文章（第 2 条起）。

## 文章详情增强

### 悬浮目录（TableOfContents）

- 组件：`TableOfContents.vue`。
- 组合式函数：`useTableOfContents(contentRef)`：
  - 在 `contentRef` 渲染完成后扫描 `h2`、`h3`。
  - 为每个标题生成 slug 形式的 `id`（基于标题文本 + 索引避免重复）。
  - 使用 `IntersectionObserver`（`rootMargin: '-20% 0px -70% 0px'`）跟踪当前激活项。
  - 暴露 `items`、`activeId`、`scrollTo(id)`。
- 渲染条件：`items.length >= 3` 且视口宽度 ≥ 1024px。
- 布局：`position: sticky; top: 96px;` 右侧栏，宽度 240px，紧贴文章容器右侧。
- 交互：点击条目平滑滚动到对应标题，并用 `history.replaceState` 更新 `location.hash`，避免污染历史记录。
- 样式：活跃项使用 `--brand-500` 左边框 + 粗体；非活跃项 `--ink-muted`。
- 测试要点：标题提取、slug 去重、激活项切换、滚动定位调用。

### 作者信息卡（AuthorCard）

- 组件：`AuthorCard.vue`。
- 数据来源：`useAuthorProfile(authorId)` 组合式函数：
  - 首次访问发起 `GET /users/{authorId}` 请求。
  - 结果缓存于模块级 Map，键为 `authorId`；已缓存直接返回。
  - 请求失败时返回 `null`，组件使用 `post.author.username` 兜底。
- 渲染位置：文章正文下方、评论区（灰度隐藏，不显示）之上。
- 内容：
  - 头像（`avatar`），缺省使用通用头像图标。
  - 昵称（`nickname`，缺省显示 `username`）。
  - 个人简介（`bio`，若存在）。
  - 次级按钮：`查看更多文章`，链接到 `/article?authorId=<id>`。
- `ArticleListView.vue` 需要支持新的查询参数 `authorId`，并将其透传到 `GET /blogs?author_id=...`。既有 URL query 同步逻辑（`articleListQuery.ts`）同步扩展。

## 命令面板（⌘K）

### CommandPalette.vue

- 全局挂载于 `App.vue`，通过 `useCommandPalette` 管理开关状态。
- 触发：
  - 键盘：macOS 下 `Meta+K`，其他平台 `Ctrl+K`。键监听器在 `onMounted` 时注册于 `window`，`onUnmounted` 时注销。
  - 点击：桌面顶部搜索框与移动搜索入口调用 `openCommandPalette()`，不再打开原搜索下拉；原 `TopSearchBox` / `MobileSearchSheet` 组件在命令面板开启时隐藏。
- 界面：
  - 桌面：居中模态，宽度 640px，高度上限 60vh，使用 `--surface-overlay` + `--shadow-md`。
  - 移动：底部升起的抽屉，顶部 16px 圆角。
  - 输入框：自动聚焦，占位 `搜索文章或导航到页面`。
  - 结果分组：
    - **文章**：防抖 200ms 后调用 `GET /blogs?search=<query>&only_public=true&per_page=8`，展示标题、作者昵称、日期。
    - **页面**：本地静态列表 — `首页 (/)`、`文章 (/article)`、`写作 (/write)`、`关于 (/about)`、`登录 (/login)`。
    - 查询为空时展示近期搜索历史（复用 `useSearchHistory`）。
- 键盘导航：
  - `↑`/`↓` 在可见结果间移动（跨分组循环，首项按 `↑` 移到末项，反之亦然）。
  - `Enter`：若当前有高亮项则触发该项（文章项跳转到详情、页面项跳转到该路由）；若无高亮项且查询非空，则跳转到 `/search?q=<query>` 作为兜底；若查询为空则不操作。
  - `Esc` 关闭面板。
  - `Tab` 遵循原生焦点顺序。
- 可达性：`role="dialog"`、`aria-modal="true"`、聚焦陷阱通过 `focus-trap-vue` 风格的最小实现（不引入依赖，原生实现即可）。
- 与灰度规则：不展示标签组，不展示评论/点赞相关入口。
- 现有组件处理：
  - `TopSearchBox` 与 `MobileSearchSheet` 退化为触发器——点击时调用 `openCommandPalette()`，不再渲染原有的建议下拉。它们本身的视觉外观保留，仅移除内部的输入监听、下拉层与推荐列表渲染。
  - 内部的历史记录存取仍通过 `useSearchHistory` 保留，由命令面板消费。
  - `/search` 路由与 `Search.vue` 页面不受影响，仍可独立访问（用户从命令面板回车兜底即进入该页面）。

## 视图过渡

### useViewTransition

- 集成点：在 `src/router/index.ts` 中通过 `router.beforeResolve` 钩子拦截路由切换。当 `document.startViewTransition` 存在时，将 DOM 更新包裹在该回调内；不存在时保持原有导航流程。实现上不与现有认证守卫（`beforeEach`）冲突，两者独立注册。
- 样式：在全局 CSS 中定义：

```css
::view-transition-old(root) { animation: vt-fade-out var(--motion-base) var(--ease-standard); }
::view-transition-new(root) { animation: vt-fade-in var(--motion-base) var(--ease-standard); }
@keyframes vt-fade-out { to { opacity: 0; transform: translateY(-8px); } }
@keyframes vt-fade-in  { from { opacity: 0; transform: translateY(8px); } }
```

- 降级：Firefox 等不支持 `startViewTransition` 的浏览器直接调用 `next()`，保持现有行为不变。
- 不绑定 `view-transition-name` 到任何元素（无封面需求）。
- 写作页因频繁切换子视图不启用视图过渡：`useViewTransition` 读取 `to.name`，若为 `write` 则跳过。

## 微交互

- 卡片悬浮：沿用 `PostCard` 现有 `translateY(-4px)` 提升，但过渡曲线改为 `var(--motion-base) var(--ease-out)`。
- 按钮按压：全局按钮在 `:active` 时 `transform: scale(0.98)`。
- 列表渐现：首页与文章列表的卡片在首次挂载时应用 `fade + 6px translateY` 的分批动画（`transition-delay` 按索引，每项 40ms，最多 10 项）。通过 CSS 类实现，不引入 JS 驱动的动画库。

## 文件组织

### 新增

```
src/components/
  article/
    ReadingProgress.vue
    TableOfContents.vue
    AuthorCard.vue
  post/
    FeaturedHero.vue
  ui/
    CommandPalette.vue
    BackToTop.vue

src/features/
  article/composables/
    useTableOfContents.ts
    useTableOfContents.test.ts
    useReadingProgress.ts
    useReadingProgress.test.ts
    useAuthorProfile.ts
    useAuthorProfile.test.ts
  ui/composables/
    useCommandPalette.ts
    useCommandPalette.test.ts
    useViewTransition.ts
    useScrollCondense.ts
```

### 修改

```
src/assets/base.css                              # 新增类型、运动、焦点令牌（纯增量）
src/App.vue                                      # 挂载 CommandPalette / BackToTop / 注册视图过渡 hook
src/components/navigation/TopHeaderLayout.vue    # 集成滚动压缩 class
src/components/search/TopSearchBox.vue           # 退化为触发器，移除内部下拉
src/components/search/MobileSearchSheet.vue      # 退化为触发器，移除内部下拉
src/views/HomeView.vue                           # 渲染 FeaturedHero，列表调整为剩余文章
src/components/Article.vue                       # 渲染 ReadingProgress / TableOfContents / AuthorCard
src/router/index.ts                              # 注册视图过渡 beforeResolve 钩子
src/features/post/utils/articleListQuery.ts      # 增加 authorId 字段解析
src/views/ArticleListView.vue                    # 将 authorId 传递到查询
```

### 不修改

- 写作相关组件
- 登录、注册视图
- 评论、举报、点赞相关代码（保持灰度静默）
- `services/postService.ts`、`services/profileService.ts` 中现有签名；仅在必要时补充按作者筛选的路径已通过 `GET /blogs?author_id=...` 覆盖。

## 测试策略

### 单元测试（Vitest，`node` 环境，不渲染组件）

- `useTableOfContents.test.ts`：
  - 从给定 HTML 抽取 h2/h3 列表。
  - slug 去重（相同标题文本追加索引）。
  - 激活项在不同 `activeId` 下切换。
- `useReadingProgress.test.ts`：
  - 文章顶部、中部、底部进度计算正确。
  - 文章高度为 0 时返回 0，不抛错。
- `useCommandPalette.test.ts`：
  - 键盘事件触发开关。
  - 搜索防抖（依赖 `vi.useFakeTimers`）。
  - 键盘导航边界（首项按 `↑` 保持、末项按 `↓` 保持）。
- `useAuthorProfile.test.ts`：
  - 同一 `authorId` 第二次调用命中缓存（Mock fetch 调用计数）。
  - Fetch 失败时返回 `null`。
- `articleListQuery.test.ts` 扩展用例：
  - 解析 `authorId` 查询参数。
  - 构建带 `authorId` 的 URL。

### 手动验证

- 浅色 + 深色主题
- 桌面 + 移动视口
- `VITE_USE_MOCK=true` 与真实后端两种数据源
- 所有主路径：首页、文章列表、文章详情、命令面板操作、返回顶部
- 键盘导航可达性（命令面板、TOC 点击、跳转）

### 回归

- `npx vue-tsc --noEmit`
- `npm run test:run`
- `npm run build`

## 错误与边界

- 文章 `html_content` 无标题：TOC 直接不渲染，不出空容器。
- 作者 `GET /users/{id}` 失败：AuthorCard 降级展示 `username`，不显示错误。
- 命令面板搜索失败：展示 `搜索失败，请稍后重试` 文案并保留已输入文本，不清空输入框。
- 视图过渡 API 不存在：不抛错，不注册自定义过渡。
- 滚动压缩器在 iOS Safari 橡皮筋回弹场景下，由于 `IntersectionObserver` 不受影响，行为正常；无需额外处理。
- 首页头图在真实后端返回空数组时，降级为原有空状态，不渲染头图骨架。

## 风险

- **View Transitions API 浏览器支持**：Chrome / Edge / Safari TP 支持；Firefox 2026-04 尚未默认启用。降级路径已覆盖。
- **IntersectionObserver `rootMargin` 调参**：不同屏幕高度下激活项切换时机需要人工验证。若反馈偏差明显，可将 `-20% / -70%` 调整为 `-10% / -80%`。
- **命令面板与移动搜索抽屉的交互**：移动端现有 `MobileSearchSheet` 会被命令面板替代，需保证动画与开合不冲突；实现阶段通过顶层状态机收敛。
- **真实后端搜索性能**：后端 `GET /blogs?search=` 尚无排序协议，返回顺序可能与前端期望不一致；命令面板阶段直接展示后端原顺序，不做二次排序。

## 灰度能力对齐

本设计严格遵守 `2026-04-06-backend-first-frontend-integration-design.md` 的灰度开关：

| 能力 | 本设计是否依赖 |
|---|---|
| `tags` | 否 |
| `coverImage` | 否 |
| `featured` | 否 |
| `likes` | 否 |
| `comment` | 否 |
| `report` | 否 |
| `slugExperience` | 否 |

新增的 `capabilities.ts` 开关（若已存在）不会被本设计引入任何 UI 解锁条件。

## 实施顺序建议

1. **令牌与全局样式**：`base.css` 新令牌 + 视图过渡样式。
2. **导航与滚动**：`useScrollCondense`、`TopHeaderLayout` 改造、`ReadingProgress`、`BackToTop`。
3. **首页头图**：`FeaturedHero` + `HomeView.vue` 集成。
4. **文章详情增强**：`useTableOfContents`、`TableOfContents`、`useAuthorProfile`、`AuthorCard`、`Article.vue` 集成。
5. **命令面板**：`useCommandPalette`、`CommandPalette.vue`、替换 `TopSearchBox` / `MobileSearchSheet` 的触发路径。
6. **视图过渡**：`useViewTransition`、路由注册。
7. **文章列表按作者筛选**：扩展 `articleListQuery` + `ArticleListView`。
8. **回归测试**：单元 + 类型 + 构建三件套。

每个子项完成后独立验证，避免改动堆叠。
