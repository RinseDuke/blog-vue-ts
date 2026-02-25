# blog-vue-ts

一个基于 Vue 3 + Vite + TypeScript 的个人博客前端项目，集成了路由、Markdown 渲染与富文本编辑能力，便于快速搭建内容型站点。

## Features
- Vue 3 + Vite + TypeScript
- Vue Router 单页应用
- Markdown 渲染（markdown-it / marked）
- 富文本编辑集成（WangEditor / Vditor）
- 通过环境变量切换 Mock 与真实后端

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

## Environment
| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 空 | 真实后端地址，例如 `https://api.example.com` |
| `VITE_USE_MOCK` | `true` | 是否启用前端内置 Mock 数据 |

## Mock 数据 / 后端切换
Mock 数据位于 `src/mocks/posts.ts`，服务层在 `src/services/postService.ts`。

1. 在根目录创建 `.env` 或 `.env.local`，配置上表中的变量。
2. 接入真实后端时，保持返回数据结构与当前契约一致。
3. 逐步用真实响应替换 Mock 数据，必要时保留 Mock 作为离线演示方案。

## Project Structure
- `src/` 主要源码
- `src/router/` 路由配置
- `src/views/` 页面视图
- `src/components/` 组件
- `src/services/` 数据服务层
- `src/mocks/` Mock 数据
- `src/types/` 类型定义

## Architecture Notes
- 代码库总览与模块职责见 `docs/CODEBASE_MAP.md`

## Build Output
执行 `npm run build` 后产物输出到 `dist/`。
