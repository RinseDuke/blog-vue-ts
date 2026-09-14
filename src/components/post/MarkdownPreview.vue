<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import 'highlight.js/styles/github-dark-dimmed.css'
import 'katex/dist/katex.min.css'
import 'markdown-it-texmath/css/texmath.css'

import { renderWriteMarkdownToHtml } from '@/features/post/utils/writeMarkdown'

type MermaidApi = (typeof import('mermaid'))['default']

const props = defineProps<{ source: string }>()
const previewRef = ref<HTMLElement | null>(null)
const previewRevision = ref(0)
const renderedPreview = computed(() => ({
  html: renderWriteMarkdownToHtml(props.source),
  revision: previewRevision.value,
}))

let mermaidLoader: Promise<MermaidApi> | null = null
let mermaidId = 0
let themeObserver: MutationObserver | null = null
let isUnmounted = false

function createMermaidRenderId() {
  const uniqueId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${++mermaidId}`
  return `markdown-mermaid-${uniqueId}`
}

async function loadMermaid() {
  if (!mermaidLoader) {
    mermaidLoader = import('mermaid').then(({ default: mermaid }) => mermaid)
  }

  try {
    return await mermaidLoader
  } catch (error) {
    mermaidLoader = null
    throw error
  }
}

async function renderMermaidBlocks() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const preview = previewRef.value
  if (!preview) return

  const blocks = Array.from(preview.querySelectorAll<HTMLElement>('code.language-mermaid'))
  if (!blocks.length) return

  let mermaid: MermaidApi
  try {
    mermaid = await loadMermaid()
  } catch {
    return
  }
  if (isUnmounted || previewRef.value !== preview) return

  mermaid.initialize({
    securityLevel: 'strict',
    startOnLoad: false,
    suppressErrorRendering: true,
    theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default',
  })

  for (const code of blocks) {
    if (isUnmounted || previewRef.value !== preview || !preview.contains(code)) return
    if (code.dataset.mermaidRendering === 'true') continue

    const source = code.textContent ?? ''
    if (!source.trim()) continue

    code.dataset.mermaidRendering = 'true'

    try {
      const result = await mermaid.render(createMermaidRenderId(), source)
      if (isUnmounted || previewRef.value !== preview || !preview.contains(code)) continue

      const figure = document.createElement('figure')
      figure.className = 'markdown-preview__mermaid'
      figure.setAttribute('aria-label', '流程图')
      figure.innerHTML = result.svg

      const sourceContainer = code.parentElement?.tagName === 'PRE' ? code.parentElement : code
      sourceContainer.replaceWith(figure)
      result.bindFunctions?.(figure)
    } catch {
      delete code.dataset.mermaidRendering
      code.parentElement?.classList.add('markdown-preview__mermaid-source')
    }
  }
}

function scheduleMermaidRender() {
  void nextTick().then(renderMermaidBlocks)
}

function observeThemeChanges() {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return

  themeObserver = new MutationObserver(() => {
    previewRevision.value += 1
  })
  themeObserver.observe(document.documentElement, {
    attributeFilter: ['data-theme'],
    attributes: true,
  })
}

watch(renderedPreview, scheduleMermaidRender, { flush: 'post' })
onMounted(() => {
  isUnmounted = false
  observeThemeChanges()
  scheduleMermaidRender()
})
onBeforeUnmount(() => {
  isUnmounted = true
  themeObserver?.disconnect()
})
</script>

<template>
  <article
    :key="renderedPreview.revision"
    ref="previewRef"
    class="markdown-preview"
    v-html="renderedPreview.html"
  ></article>
</template>

<style scoped>
.markdown-preview {
  color: var(--article-prose-text, var(--ink-main));
  font-family: var(--font-body);
  line-height: 1.82;
  overflow-wrap: anywhere;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  color: var(--article-prose-heading, var(--ink-strong));
  font-family: var(--font-display);
  scroll-margin-top: 90px;
}

.markdown-preview :deep(code),
.markdown-preview :deep(pre) {
  font-family: var(--font-mono);
}

.markdown-preview :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
}

.markdown-preview :deep(pre code.hljs) {
  padding: 0;
  background: transparent;
}

.markdown-preview :deep(img),
.markdown-preview :deep(svg) {
  max-width: 100%;
  height: auto;
}

.markdown-preview :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--line-soft);
  text-align: left;
}

.markdown-preview :deep(.contains-task-list) {
  padding-left: 0;
}

.markdown-preview :deep(.task-list-item) {
  list-style: none;
}

.markdown-preview :deep(.task-list-item-checkbox) {
  margin-right: 0.45rem;
}

.markdown-preview :deep(.markdown-preview__mermaid) {
  margin: 1.5rem 0;
  overflow-x: auto;
  text-align: center;
}

.markdown-preview :deep(.markdown-preview__mermaid-source) {
  border-left: 3px solid var(--warning-500);
}
</style>
