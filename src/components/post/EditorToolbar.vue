<!-- 写作页编辑器工具栏 -->
<template>
  <div v-if="editor" class="editor-toolbar">
    <div class="editor-toolbar__surface">
      <div class="toolbar-group toolbar-group--surface">
        <button
          type="button"
          class="toolbar-btn toolbar-btn--surface"
          :disabled="!editor.can().undo()"
          title="撤销 (Ctrl+Z)"
          @click="editor.chain().focus().undo().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
          <span class="toolbar-label">撤销</span>
        </button>

        <button
          type="button"
          class="toolbar-btn toolbar-btn--surface"
          :disabled="!editor.can().redo()"
          title="重做 (Ctrl+Y)"
          @click="editor.chain().focus().redo().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
          <span class="toolbar-label">重做</span>
        </button>

        <button
          type="button"
          class="toolbar-btn toolbar-btn--surface"
          title="清空格式"
          @click="editor.chain().focus().clearNodes().unsetAllMarks().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
          <span class="toolbar-label">清空格式</span>
        </button>
      </div>

      <div class="toolbar-group toolbar-group--surface">
        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--surface', { 'is-active': editor.isActive('heading', { level: 2 }) }]"
          title="标题 2 (H2)"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          <span class="toolbar-icon-text">H2</span>
          <span class="toolbar-label">标题 2</span>
        </button>

        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--surface', { 'is-active': editor.isActive('heading', { level: 3 }) }]"
          title="标题 3 (H3)"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        >
          <span class="toolbar-icon-text">H3</span>
          <span class="toolbar-label">标题 3</span>
        </button>
      </div>

      <div class="toolbar-group toolbar-group--surface">
        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--surface', { 'is-active': editor.isActive('bold') }]"
          title="加粗 (Ctrl+B)"
          @click="editor.chain().focus().toggleBold().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
          <span class="toolbar-label">加粗</span>
        </button>

        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--surface', { 'is-active': editor.isActive('italic') }]"
          title="斜体 (Ctrl+I)"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
          <span class="toolbar-label">斜体</span>
        </button>

        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--surface', { 'is-active': editor.isActive('strike') }]"
          title="删除线"
          @click="editor.chain().focus().toggleStrike().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4H9a3 3 0 0 0-2.83 4" />
            <path d="M14 12a4 4 0 0 1 0 8H6" />
            <line x1="4" y1="12" x2="20" y2="12" />
          </svg>
          <span class="toolbar-label">删除线</span>
        </button>
      </div>

      <div class="toolbar-group toolbar-group--surface">
        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--surface', { 'is-active': editor.isActive('bulletList') }]"
          title="无序列表"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span class="toolbar-label">列表</span>
        </button>

        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--surface', { 'is-active': editor.isActive('orderedList') }]"
          title="有序列表"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
          <span class="toolbar-label">有序</span>
        </button>

        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--surface', { 'is-active': editor.isActive('blockquote') }]"
          title="引用"
          @click="editor.chain().focus().toggleBlockquote().run()"
        >
          <span class="toolbar-icon-text">”</span>
          <span class="toolbar-label">引用</span>
        </button>
      </div>

      <div class="toolbar-group toolbar-group--surface">
        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--surface', { 'is-active': editor.isActive('codeBlock') }]"
          title="代码块"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span class="toolbar-label">代码块</span>
        </button>

        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--surface', { 'is-active': editor.isActive('link') }]"
          title="添加链接"
          @click="addLink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span class="toolbar-label">链接</span>
        </button>

        <button
          type="button"
          class="toolbar-btn toolbar-btn--surface"
          title="插入表格"
          @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
            <path d="M3 9h18" />
            <path d="M3 15h18" />
            <path d="M9 3v18" />
            <path d="M15 3v18" />
          </svg>
          <span class="toolbar-label">表格</span>
        </button>

        <button
          type="button"
          class="toolbar-btn toolbar-btn--surface"
          title="分割线"
          @click="editor.chain().focus().setHorizontalRule().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span class="toolbar-label">分割线</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Editor } from '@tiptap/vue-3'

const props = defineProps<{
  editor: Editor | null
}>()

function addLink() {
  if (!props.editor) return
  const previousUrl = props.editor.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)

  if (url === null) {
    return
  }

  if (url === '') {
    props.editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run()
    return
  }

  props.editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run()
}
</script>

<style scoped lang="less">
.editor-toolbar {
  position: sticky;
  top: 0;
  z-index: 12;
  padding: 10px 0 0;
  margin-bottom: 12px;
}

.editor-toolbar__surface {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--write-panel-border);
  border-radius: var(--radius-lg);
  background: var(--write-panel-bg);
  box-shadow: var(--write-panel-shadow), var(--write-panel-inset-shadow);
  backdrop-filter: blur(16px);
}

.toolbar-group {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 6px;
}

.toolbar-group--surface {
  padding: 6px;
  border: 1px solid var(--write-panel-inline-border);
  border-radius: 18px;
  background: var(--write-toolbar-group-bg);
  box-shadow: var(--write-panel-inset-shadow);
}

.toolbar-btn {
  appearance: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 64px;
  min-height: 56px;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.12s ease,
    box-shadow 0.18s ease;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--write-panel-inline-hover);
  border-color: color-mix(in srgb, var(--write-panel-inline-border) 76%, var(--brand-100) 24%);
  color: var(--ink-strong);
  transform: translateY(-1px);
}

.toolbar-btn.is-active {
  background: color-mix(in srgb, var(--brand-100) 72%, transparent);
  border-color: color-mix(in srgb, var(--brand-100) 88%, transparent);
  color: var(--brand-500);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand-100) 68%, transparent), var(--write-panel-inset-shadow);
}

.toolbar-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  color: var(--line-strong);
}

.toolbar-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-100) 72%, transparent), var(--write-panel-inset-shadow);
}

.toolbar-icon-text {
  font-family: 'Manrope', sans-serif;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
}

.toolbar-label {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.01em;
  text-align: center;
}

@media (max-width: 768px) {
  .editor-toolbar {
    padding-top: 8px;
    margin-bottom: 10px;
  }

  .editor-toolbar__surface {
    gap: 8px;
    padding: 10px;
    border-radius: 20px;
  }

  .toolbar-group--surface {
    width: 100%;
    gap: 4px;
    padding: 5px;
    border-radius: 16px;
  }

  .toolbar-btn {
    min-width: 60px;
    min-height: 52px;
    padding: 8px 6px;
  }

  .toolbar-label {
    font-size: 10px;
  }
}
</style>
