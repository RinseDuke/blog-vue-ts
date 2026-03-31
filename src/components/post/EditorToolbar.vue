<!-- 写作页编辑器工具栏 -->
<template>
  <div v-if="editor" class="editor-toolbar">
    <div class="editor-toolbar__surface">
      <div class="editor-toolbar__track">
        <button
          type="button"
          class="toolbar-btn toolbar-btn--compact"
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
          class="toolbar-btn toolbar-btn--compact"
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
          :class="['toolbar-btn', 'toolbar-btn--compact', { 'is-active': editor.isActive('heading', { level: 2 }) }]"
          title="标题 2 (H2)"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          <span class="toolbar-icon-text">H2</span>
          <span class="toolbar-label">H2</span>
        </button>

        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--compact', { 'is-active': editor.isActive('heading', { level: 3 }) }]"
          title="标题 3 (H3)"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        >
          <span class="toolbar-icon-text">H3</span>
          <span class="toolbar-label">H3</span>
        </button>

        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--compact', { 'is-active': editor.isActive('bold') }]"
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
          :class="['toolbar-btn', 'toolbar-btn--compact', { 'is-active': editor.isActive('italic') }]"
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
          :class="['toolbar-btn', 'toolbar-btn--compact', { 'is-active': editor.isActive('bulletList') }]"
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
          :class="['toolbar-btn', 'toolbar-btn--compact', { 'is-active': editor.isActive('blockquote') }]"
          title="引用"
          @click="editor.chain().focus().toggleBlockquote().run()"
        >
          <span class="toolbar-icon-text">”</span>
          <span class="toolbar-label">引用</span>
        </button>

        <button
          type="button"
          :class="['toolbar-btn', 'toolbar-btn--compact', { 'is-active': editor.isActive('codeBlock') }]"
          title="代码块"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span class="toolbar-label">代码</span>
        </button>

        <div ref="moreRef" class="toolbar-more">
          <button
            type="button"
            class="toolbar-btn toolbar-btn--compact toolbar-btn--more"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            title="更多格式"
            @click.stop="toggleMoreMenu"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
            <span class="toolbar-label">更多</span>
          </button>

          <Transition name="toolbar-more-menu">
            <div v-if="menuOpen" class="toolbar-more__menu" role="menu">
              <button
                type="button"
                role="menuitem"
                :class="['toolbar-more__item', { 'toolbar-more__item--active': editor.isActive('strike') }]"
                @click="runMoreAction(toggleStrike)"
              >
                删除线
              </button>
              <button
                type="button"
                role="menuitem"
                :class="['toolbar-more__item', { 'toolbar-more__item--active': editor.isActive('orderedList') }]"
                @click="runMoreAction(toggleOrderedList)"
              >
                有序列表
              </button>
              <button type="button" role="menuitem" class="toolbar-more__item" @click="setLinkFromPrompt">
                链接
              </button>
              <button type="button" role="menuitem" class="toolbar-more__item" @click="runMoreAction(insertTable)">
                表格
              </button>
              <button type="button" role="menuitem" class="toolbar-more__item" @click="runMoreAction(insertRule)">
                分割线
              </button>
              <button type="button" role="menuitem" class="toolbar-more__item" @click="runMoreAction(clearFormatting)">
                清空格式
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Editor } from '@tiptap/vue-3'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  editor: Editor | null
}>()

const menuOpen = ref(false)
const moreRef = ref<HTMLElement | null>(null)

function toggleMoreMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMoreMenu() {
  menuOpen.value = false
}

function onClickOutside(event: MouseEvent) {
  if (moreRef.value && !moreRef.value.contains(event.target as Node)) {
    closeMoreMenu()
  }
}

function runMoreAction(action: () => void) {
  action()
  closeMoreMenu()
}

function clearFormatting() {
  props.editor?.chain().focus().clearNodes().unsetAllMarks().run()
}

function toggleStrike() {
  props.editor?.chain().focus().toggleStrike().run()
}

function toggleOrderedList() {
  props.editor?.chain().focus().toggleOrderedList().run()
}

function insertTable() {
  props.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

function insertRule() {
  props.editor?.chain().focus().setHorizontalRule().run()
}

function setLinkFromPrompt() {
  if (!props.editor) return

  const previousUrl = props.editor.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)

  if (url === null) {
    closeMoreMenu()
    return
  }

  if (url === '') {
    props.editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run()
    closeMoreMenu()
    return
  }

  props.editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run()
  closeMoreMenu()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped lang="less">
.editor-toolbar {
  position: sticky;
  top: 0;
  z-index: 12;
  padding: 6px 0 0;
  margin-bottom: 8px;
}

.editor-toolbar__surface {
  border: 1px solid var(--write-toolbar-border, var(--write-panel-border));
  border-radius: 20px;
  background: var(--write-toolbar-bg, var(--write-panel-bg));
  box-shadow: var(--write-toolbar-shadow, var(--write-panel-shadow)), var(--write-panel-inset-shadow);
  backdrop-filter: blur(16px);
}

.editor-toolbar__track {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: none;
  white-space: nowrap;
}

.editor-toolbar__track::-webkit-scrollbar {
  display: none;
}

.toolbar-btn {
  appearance: none;
  display: inline-flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 48px;
  min-height: 42px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.12s ease,
    box-shadow 0.16s ease;
}

.toolbar-btn--compact {
  min-width: 48px;
  min-height: 42px;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--write-panel-inline-hover);
  border-color: color-mix(in srgb, var(--write-panel-inline-border) 76%, var(--brand-100) 24%);
  color: var(--ink-strong);
}

.toolbar-btn.is-active,
.toolbar-more__item--active {
  color: var(--brand-500);
}

.toolbar-btn.is-active {
  background: color-mix(in srgb, var(--brand-100) 72%, transparent);
  border-color: color-mix(in srgb, var(--brand-100) 86%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand-100) 62%, transparent);
}

.toolbar-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.toolbar-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  color: var(--line-strong);
}

.toolbar-btn:focus-visible,
.toolbar-more__item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-100) 72%, transparent);
}

.toolbar-icon-text {
  font-family: 'Manrope', sans-serif;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
}

.toolbar-label {
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  text-align: center;
}

.toolbar-more {
  position: sticky;
  right: 0;
  margin-left: auto;
  padding-left: 6px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--write-toolbar-bg, var(--write-panel-bg)) 86%, transparent) 28%);
}

.toolbar-btn--more {
  min-width: 56px;
}

.toolbar-more__menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 176px;
  padding: 6px;
  border: 1px solid var(--write-panel-border);
  border-radius: 14px;
  background: var(--write-panel-bg);
  box-shadow: var(--write-panel-shadow);
  backdrop-filter: blur(16px);
  z-index: 20;
}

.toolbar-more__item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--ink-main);
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
}

.toolbar-more__item:hover {
  background: var(--write-panel-inline-hover);
  border-color: color-mix(in srgb, var(--write-panel-inline-border) 76%, var(--brand-100) 24%);
}

.toolbar-more-menu-enter-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(.4, 0, .2, 1);
}

.toolbar-more-menu-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.toolbar-more-menu-enter-from,
.toolbar-more-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 768px) {
  .editor-toolbar {
    padding-top: 4px;
    margin-bottom: 6px;
  }

  .editor-toolbar__surface {
    border-radius: 18px;
  }

  .editor-toolbar__track {
    gap: 5px;
    padding: 7px;
  }

  .toolbar-btn,
  .toolbar-btn--compact {
    min-width: 44px;
    min-height: 40px;
    padding: 7px 9px;
  }

  .toolbar-label {
    font-size: 0.64rem;
  }

  .toolbar-more__menu {
    min-width: 160px;
  }
}
</style>
