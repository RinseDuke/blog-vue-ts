/**
 * Vite 构建配置
 * 定义路径别名和插件。
 */

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function patchNodeWebStorage() {
  const g = globalThis as unknown as {
    process?: { versions?: { node?: string } }
    navigator?: unknown
    localStorage?: { getItem?: unknown }
  }

  if (!g.process?.versions?.node) return

  // Node 20+ exposes navigator/localStorage stubs; vue-devtools-kit treats this as browser.
  if (typeof g.navigator !== 'undefined') {
    try {
      delete g.navigator
    } catch {
      // Ignore non-configurable globals in restricted runtimes.
    }
  }

  if (typeof g.localStorage !== 'undefined' && typeof g.localStorage?.getItem !== 'function') {
    try {
      delete g.localStorage
    } catch {
      // Ignore non-configurable globals in restricted runtimes.
    }
  }
}

// https://vite.dev/config/
export default defineConfig(async () => {
  patchNodeWebStorage()
  const { default: vueDevTools } = await import('vite-plugin-vue-devtools')

  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (/[\\/]node_modules[\\/]@tiptap[\\/]pm/.test(id) || /[\\/]node_modules[\\/]prosemirror-/.test(id)) {
              return 'prosemirror-vendor'
            }

            if (/[\\/]node_modules[\\/]@tiptap/.test(id)) {
              return 'tiptap-vendor'
            }

            if (/[\\/]node_modules[\\/](?:markdown-it|turndown|dompurify)/.test(id)) {
              return 'markdown-vendor'
            }
          },
        },
      },
    }
  }
})
