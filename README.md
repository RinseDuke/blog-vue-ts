# blog-vue-ts

一个基于 Vue 3 + Vite + TypeScript 的现代博客前端单页应用，包含首页、文章列表、文章详情、全局搜索、Markdown 写作和个人主页。

## 技术栈

| 分类 | 技术 | 版本 |
|---|---|---|
| 框架 | Vue 3 (Composition API + `<script setup>`) | ^3.5.18 |
| 构建工具 | Vite | ^7.3.1 |
| 语言 | TypeScript | ~5.8.0 |
| 路由 | Vue Router (HTML5 History) | ^4.5.1 |
| 状态管理 | Pinia (Setup Store 语法) | ^3.0.4 |
| Markdown 编辑器 | CodeMirror 6 | 6.x |
| Markdown | markdown-it + turndown（内建 GFM 规则） | 14.1 / 7.2 |
| HTML 净化 | DOMPurify | ^3.3.0 |
| CSS 预处理器 | Less | ^4.4.2 |
| 代码检查 | ESLint + typescript-eslint + eslint-plugin-vue | ^10.0.2 |
| 测试 | Vitest | ^4.0.18 |

## 功能特性

- **首页展示** -- 最新文章列表，支持加载/错误/重试状态
- **文章列表** -- 标签筛选、日期预设（7d/30d/90d/365d/自定义）、多种排序（最新/最早/阅读量/标题）、分页，全部与 URL query 双向同步
- **文章详情** -- 文章渲染（DOMPurify 净化 HTML）、阅读进度、评论与回复
- **评论系统** -- 文章详情页支持评论、回复、点赞与举报
- **全局搜索** -- 实时建议、相关性排序（标题/摘要/作者/标签多维评分）、搜索历史持久化、推荐文章
- **Markdown 写作** -- 基于 CodeMirror 6 的实时预览编辑器，支持标题、链接、列表、任务项、表格、代码高亮、数学公式与 Mermaid 图表，提供草稿自动保存（500ms 防抖）、封面上传和标签管理（预设 + 自定义，最多 5 个）
- **认证系统** -- 登录/登出，会话持久化（localStorage / sessionStorage），路由守卫保护写作页
- **Mock / 真实 API 无缝切换** -- 通过环境变量控制，Mock 模式带模拟网络延迟
- **统一数据层** -- Posts Store 支持缓存与并发请求去重

## 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- npm

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（开发模式默认使用 Mock 数据）
cp .env.example .env.local

# 3. 启动开发服务器
npm run dev
```

## 可用脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动本地开发服务器（HMR） |
| `npm run build` | 并行执行类型检查 + 生产构建，产物输出到 `dist/` |
| `npm run build-only` | 仅执行生产构建（跳过类型检查） |
| `npm run preview` | 本地预览生产构建 |
| `npm run type-check` | 运行 TypeScript 类型检查（`vue-tsc`） |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run lint:fix` | 自动修复可修复的 ESLint 问题 |
| `npm run test` | 启动 Vitest（watch 模式） |
| `npm run test:run` | 运行 Vitest 单次测试 |

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `VITE_API_BASE_URL` | 空 | 真实后端地址，例如 `https://api.example.com` |
| `VITE_USE_MOCK` | `true` | 是否启用前端内置 Mock 数据 |

Mock 仅允许在 Vite 开发模式启用。生产构建始终使用真实 API；如果未配置
`VITE_API_BASE_URL`，请求会以明确的配置错误中止，不会静默降级到 Mock 认证。

## 项目结构

```
src/
├── App.vue                          # 根组件（全局布局、搜索、导航、页脚）
├── main.ts                          # 应用入口（createApp、Pinia、Router）
├── assets/                          # 静态资源与全局样式
│   ├── base.css                     #   CSS Reset + 设计令牌（CSS Variables）
│   └── main.css                     #   应用级全局样式
├── components/                      # 跨页面可复用组件
│   ├── Article.vue                  #   文章详情渲染器
│   ├── comment/                     #   评论组件（表单、列表项、举报对话框）
│   ├── navigation/                  #   顶部导航（品牌、搜索框、导航栏、页脚）
│   ├── post/                        #   文章相关（卡片、列表、编辑器工具栏、发布面板、筛选器、状态栏）
│   ├── search/                      #   搜索下拉内容、搜索框
│   └── ui/                          #   通用 UI 组件（骨架屏、空状态等）
├── features/                        # 按领域组织的功能模块
│   ├── auth/stores/                 #   认证 Store（会话管理、登录/登出）
│   ├── comment/stores/              #   评论 Store（加载、新增、点赞、举报）
│   ├── post/                        #   文章域
│   │   ├── composables/             #     usePostsStore、useDraft、useCoverUpload、useTagManager
│   │   └── utils/                   #     文章搜索排序工具函数 + 单元测试
│   └── search/composables/          #   搜索域（搜索、建议、历史、推荐文章）
├── mocks/                           # 内置 Mock 数据
│   ├── comments.ts                  #   评论模拟数据
│   └── posts.ts                     #   文章模拟数据
├── router/                          # 路由配置 + 认证守卫
├── services/                        # API 访问层
│   ├── apiClient.ts                 #   统一请求封装（Token 注入、错误处理、Mock 切换）
│   ├── postService.ts               #   文章服务
│   ├── commentService.ts            #   评论服务
│   ├── profileService.ts            #   个人资料服务
│   └── reportService.ts             #   举报服务
├── types/                           # TypeScript 类型定义
│   └── post.ts                      #   Post、Author、Comment、Report
└── views/                           # 页面级视图组件
    ├── HomeView.vue                 #   首页
    ├── ArticleListView.vue          #   文章列表
    ├── ArticleDetailView.vue        #   文章详情
    ├── Search.vue                   #   搜索结果
    ├── Write.vue                    #   写作页
    ├── LoginView.vue                #   登录页
    └── AboutView.vue                #   关于页 / 个人主页
```

## 路由

| 路径 | 名称 | 视图 | 需要认证 |
|---|---|---|---|
| `/` | `home` | HomeView | 否 |
| `/article` | `article-list` | ArticleListView | 否 |
| `/article/:id` | `article-detail` | ArticleDetailView | 否 |
| `/search` | `search` | Search | 否 |
| `/write` | `write` | Write | 是 |
| `/login` | `login` | LoginView | 否 |
| `/register` | `register` | RegisterView | 否 |
| `/about` | `about` | AboutView | 否 |
| `/about/articles` | `profile-articles` | ProfileArticlesView | 是 |

## 数据层架构

```
组件 / 视图
    ↓ 调用
Pinia Store（composables）── 缓存 + 并发去重
    ↓ 调用
Services（API 访问层）
    ↓ 判断
isMockMode() ──→ 是 → 返回 Mock 数据（带模拟延迟）
              └→ 否 → apiFetch() → 真实后端 API
```

- **Store 层**：Pinia Setup Store，`ensurePosts()` 实现加载一次 + 并发请求去重
- **Service 层**：`apiFetch<T>()` 统一封装，自动注入 Bearer Token、处理错误码、返回类型安全的响应
- **Mock 层**：`src/mocks/` 提供完整的模拟数据，`networkDelay()` 模拟网络延迟

接入真实后端时，保持接口返回的数据结构与 `src/types/post.ts` 中的类型定义一致即可。

## 核心类型

```typescript
interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  coverImage?: string
  content?: string
  tags: string[]
  author: Author
  publishedAt: string
  readMinutes: number
  featured?: boolean
  likes?: number
}

interface Comment {
  id: string
  postId: string
  author: Author
  content: string
  createdAt: string
  parentId?: string   // 支持嵌套回复
  likes?: number
}
```

完整类型定义见 `src/types/post.ts`。

## 测试

测试框架使用 Vitest，运行于 Node 环境，启用全局 API（无需手动 import `describe`/`it`/`expect`）。
GitHub Actions 会执行 lint、单元测试、覆盖率阈值检查和生产构建。

```bash
# watch 模式
npm run test

# 单次运行
npm run test:run

# 生成覆盖率并检查最低阈值
npm run test:coverage
```

测试与源码共置，覆盖 service、store、composable、纯工具函数以及部分页面源码契约。
核心网络层和文章 Store 均有独立行为测试。

## 构建产物

```bash
npm run build
```

产物输出到 `dist/`，构建过程会并行执行 TypeScript 类型检查和 Vite 打包。
