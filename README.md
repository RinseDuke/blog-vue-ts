# blog-vue-ts

一个基于 Vue 3 + Vite + TypeScript 的博客前端，包含首页、文章列表、文章详情、搜索和写作页。

## Features
- Vue 3 + Vite + TypeScript + Vue Router
- 统一 posts 数据层（store/composable，支持缓存与并发去重）
- 搜索能力模块化（搜索历史、相关性排序、统一下拉交互与模板）
- 文章列表页支持筛选/排序/分页，并与 URL query 双向同步
- 富文本写作页基于 Vditor
- 支持 Mock / 真实 API 切换
- 内置代码质量基线：ESLint + Vitest

## Requirements
- Node.js `^20.19.0` 或 `>=22.12.0`
- npm

## Quick Start
1. `npm install`
2. `npm run dev`

## Scripts
- `npm run dev` 启动本地开发服务
- `npm run build` 生成生产构建（`dist/`）
- `npm run preview` 预览生产构建
- `npm run type-check` 运行类型检查（`vue-tsc`）
- `npm run lint` 运行 ESLint
- `npm run lint:fix` 自动修复可修复的 ESLint 问题
- `npm run test` 启动 Vitest（watch 模式）
- `npm run test:run` 运行 Vitest 单次测试

## Environment
| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 空 | 真实后端地址，例如 `https://api.example.com` |
| `VITE_USE_MOCK` | `true` | 是否启用前端内置 Mock 数据 |

## Data Source
- Mock 数据：`src/mocks/posts.ts`
- 服务层：`src/services/postService.ts`
- 统一 posts store：`src/features/post/composables/usePostsStore.ts`

接入真实后端时，保持接口数据结构与 `src/types/post.ts` 一致即可。

## Project Structure
- `src/views/` 页面视图
- `src/components/` 跨页面组件
- `src/features/post/` 文章域能力（store、utils、tests）
- `src/features/search/` 搜索域能力（composables）
- `src/router/` 路由
- `src/services/` API 访问层
- `src/mocks/` Mock 数据
- `src/types/` 类型定义

## Tests
- `src/features/post/utils/post.test.ts`：文章工具函数单测
- `src/features/post/utils/articleListQuery.test.ts`：列表页 query state 单测

## Architecture Notes
- 代码库总览与模块职责见 `docs/CODEBASE_MAP.md`

## Build Output
执行 `npm run build` 后产物输出到 `dist/`。
