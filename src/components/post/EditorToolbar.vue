<!-- 写作页编辑器工具栏 -->
<template>
  <div class="editor-toolbar" v-if="editor">
    <div class="toolbar-group">
      <button 
        type="button"
        class="toolbar-btn" 
        @click="editor.chain().focus().undo().run()" 
        :disabled="!editor.can().undo()"
        title="撤销 (Ctrl+Z)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
        <span class="toolbar-label">撤销</span>
      </button>
      
      <button 
        type="button"
        class="toolbar-btn" 
        @click="editor.chain().focus().redo().run()" 
        :disabled="!editor.can().redo()"
        title="重做 (Ctrl+Y)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
        <span class="toolbar-label">重做</span>
      </button>

      <button 
        type="button"
        class="toolbar-btn" 
        @click="editor.chain().focus().clearNodes().unsetAllMarks().run()"
        title="清除格式"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
        <span class="toolbar-label">清空格式</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <!-- Heading Dropdown implementation can be improved later, simple toggle for now -->
      <button 
        type="button"
        :class="['toolbar-btn', { 'is-active': editor.isActive('heading', { level: 2 }) }]" 
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        title="标题2 (H2)"
      >
        <span class="toolbar-icon-text">H2</span>
        <span class="toolbar-label">标题2</span>
      </button>

      <button 
        type="button"
        :class="['toolbar-btn', { 'is-active': editor.isActive('heading', { level: 3 }) }]" 
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        title="标题3 (H3)"
      >
        <span class="toolbar-icon-text">H3</span>
        <span class="toolbar-label">标题3</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button 
        type="button"
        :class="['toolbar-btn', { 'is-active': editor.isActive('bold') }]" 
        @click="editor.chain().focus().toggleBold().run()"
        title="加粗 (Ctrl+B)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        </svg>
        <span class="toolbar-label">加粗</span>
      </button>

      <button 
        type="button"
        :class="['toolbar-btn', { 'is-active': editor.isActive('italic') }]" 
        @click="editor.chain().focus().toggleItalic().run()"
        title="斜体 (Ctrl+I)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>
        </svg>
        <span class="toolbar-label">斜体</span>
      </button>

      <button 
        type="button"
        :class="['toolbar-btn', { 'is-active': editor.isActive('strike') }]" 
        @click="editor.chain().focus().toggleStrike().run()"
        title="删除线"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>
        </svg>
        <span class="toolbar-label">删除线</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button 
        type="button"
        :class="['toolbar-btn', { 'is-active': editor.isActive('bulletList') }]" 
        @click="editor.chain().focus().toggleBulletList().run()"
        title="无序列表"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span class="toolbar-label">列表</span>
      </button>

      <button 
        type="button"
        :class="['toolbar-btn', { 'is-active': editor.isActive('orderedList') }]" 
        @click="editor.chain().focus().toggleOrderedList().run()"
        title="有序列表"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
        </svg>
        <span class="toolbar-label">有序</span>
      </button>
      
      <button 
        type="button"
        :class="['toolbar-btn', { 'is-active': editor.isActive('blockquote') }]" 
        @click="editor.chain().focus().toggleBlockquote().run()"
        title="引用"
      >
        <span class="toolbar-icon-text">”</span>
        <span class="toolbar-label">引用</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button 
        type="button"
        :class="['toolbar-btn', { 'is-active': editor.isActive('codeBlock') }]" 
        @click="editor.chain().focus().toggleCodeBlock().run()"
        title="代码块"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span class="toolbar-label">代码块</span>
      </button>

      <button 
        type="button"
        class="toolbar-btn" 
        @click="addLink"
        :class="{ 'is-active': editor.isActive('link') }"
        title="添加链接"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span class="toolbar-label">链接</span>
      </button>

      <button 
        type="button"
        class="toolbar-btn" 
        @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
        title="插入表格"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
          <path d="M3 9h18"/><path d="M3 15h18"/>
          <path d="M9 3v18"/><path d="M15 3v18"/>
        </svg>
        <span class="toolbar-label">表格</span>
      </button>

      <button 
        type="button"
        class="toolbar-btn" 
        @click="editor.chain().focus().setHorizontalRule().run()"
        title="分割线"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span class="toolbar-label">分割线</span>
      </button>
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

  // cancelled
  if (url === null) {
    return
  }

  // empty
  if (url === '') {
    props.editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run()
    return
  }

  // update link
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
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line-soft);
  background: var(--surface-strong);
  position: sticky;
  top: 0;
  z-index: 10;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: var(--line-soft);
  margin: 0 4px;
}

.toolbar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  color: var(--ink-muted);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  gap: 4px;

  svg {
    transition: color 0.2s ease;
  }

  &:hover:not(:disabled) {
    background-color: var(--bg-canvas-soft);
    border-color: var(--line-soft);
    color: var(--brand-500);
  }

  &.is-active {
    background-color: var(--brand-100);
    border-color: var(--brand-100);
    color: var(--brand-500);
    box-shadow: inset 0 0 0 1px var(--brand-100);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: var(--line-strong);
  }
}

.toolbar-icon-text {
  font-weight: 700;
  font-size: 16px;
  line-height: 18px;
  font-family: serif;
}

.toolbar-label {
  font-size: 11px;
  font-weight: 500;
}
</style>
