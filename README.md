# blog-vue-ts

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## Mock 数据 / 后端切换 

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | _(空)_ | 真实后端地址，准备接入时设置，例如 `https://api.example.com` |
| `VITE_USE_MOCK` | `true` | 是否启用前端内置的 mock 数据 |

Mock 数据位于 `src/mocks/posts.ts`，服务函数在 `src/services/postService.ts`。当你准备接入真实后端时：

1. 在根目录添加 `.env` 或 `.env.local`，配置上表中的变量。
2. 将后端接口按照 README 中的契约返回相同的数据结构。
3. 逐步用真实响应覆盖 mock 数据，必要时保留 mock 作为离线演示方案。
