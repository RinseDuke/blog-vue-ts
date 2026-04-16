<template>
  <div v-if="editor" class="editor-toolbar">
    <div class="editor-toolbar__surface">
      <div class="editor-toolbar__layout">
        <div class="editor-toolbar__scroll">
          <div class="editor-toolbar__actions">
            <button
              type="button"
              class="toolbar-btn toolbar-btn--compact toolbar-btn--desktop-regular"
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
              class="toolbar-btn toolbar-btn--compact toolbar-btn--desktop-regular"
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
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-token',
                { 'is-active': editor.isActive('heading', { level: 2 }) },
              ]"
              aria-label="H2"
              title="标题 2 (H2)"
              @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
            >
              <span class="toolbar-icon-text" aria-hidden="true">H2</span>
              <span class="toolbar-label toolbar-label--desktop-hidden">H2</span>
            </button>

            <button
              type="button"
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-token',
                { 'is-active': editor.isActive('heading', { level: 3 }) },
              ]"
              aria-label="H3"
              title="标题 3 (H3)"
              @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
            >
              <span class="toolbar-icon-text" aria-hidden="true">H3</span>
              <span class="toolbar-label toolbar-label--desktop-hidden">H3</span>
            </button>

            <button
              type="button"
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-regular',
                { 'is-active': editor.isActive('bold') },
              ]"
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
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-regular',
                { 'is-active': editor.isActive('italic') },
              ]"
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
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-regular',
                { 'is-active': editor.isActive('bulletList') },
              ]"
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
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-regular',
                { 'is-active': editor.isActive('blockquote') },
              ]"
              title="引用"
              @click="editor.chain().focus().toggleBlockquote().run()"
            >
              <span class="toolbar-icon-text" aria-hidden="true">”</span>
              <span class="toolbar-label">引用</span>
            </button>

            <button
              type="button"
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-regular',
                { 'is-active': editor.isActive('codeBlock') },
              ]"
              title="代码块"
              @click="editor.chain().focus().toggleCodeBlock().run()"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span class="toolbar-label">代码</span>
            </button>

            <button
              type="button"
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-only',
                'toolbar-btn--desktop-wide',
                { 'is-active': editor.isActive('strike') },
              ]"
              title="删除线"
              @click="toggleStrike"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 10c0-2 2-4 6-4s6 2 6 4-2 4-6 4-6 2-6 4 2 4 6 4 6-2 6-4" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
              <span class="toolbar-label">删除线</span>
            </button>

            <button
              type="button"
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-only',
                'toolbar-btn--desktop-regular',
                { 'is-active': editor.isActive('orderedList') },
              ]"
              title="有序列表"
              @click="toggleOrderedList"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
                <path d="M4 6h1v4" />
                <path d="M4 10h2" />
                <path d="M4 18h2c0-1.1-.9-2-2-2 1.1 0 2-.9 2-2" />
              </svg>
              <span class="toolbar-label">有序</span>
            </button>

            <button
              type="button"
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-only',
                'toolbar-btn--desktop-regular',
                { 'is-active': editor.isActive('link') },
              ]"
              title="链接"
              @click="setLinkFromPrompt"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 1 0-7.07-7.07L10.5 5.43" />
                <path d="M14 11a5 5 0 0 0-7.07 0l-1.41 1.41a5 5 0 0 0 7.07 7.07l.91-.91" />
              </svg>
              <span class="toolbar-label">链接</span>
            </button>

            <button
              type="button"
              :class="[
                'toolbar-btn',
                'toolbar-btn--compact',
                'toolbar-btn--desktop-only',
                'toolbar-btn--desktop-regular',
                { 'is-active': editor.isActive('table') },
              ]"
              title="插入表格"
              @click="insertTable"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="1.5" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="9" y1="5" x2="9" y2="19" />
                <line x1="15" y1="5" x2="15" y2="19" />
              </svg>
              <span class="toolbar-label">表格</span>
            </button>

            <button
              type="button"
              class="toolbar-btn toolbar-btn--compact toolbar-btn--desktop-only toolbar-btn--desktop-regular"
              title="分割线"
              @click="insertRule"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
              <span class="toolbar-label">分割</span>
            </button>

            <button
              type="button"
              class="toolbar-btn toolbar-btn--compact toolbar-btn--desktop-only toolbar-btn--desktop-regular"
              title="清空格式"
              @click="clearFormatting"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 20h7" />
                <path d="M7 4h9" />
                <path d="M9 4 4 12h6l-1 8 5-8H8z" />
              </svg>
              <span class="toolbar-label">清空</span>
            </button>
          </div>
        </div>

        <div ref="moreRef" class="toolbar-more" @keydown.esc.stop="closeMoreMenu">
            <button
              type="button"
              class="toolbar-btn toolbar-btn--compact toolbar-btn--more toolbar-btn--desktop-wide"
              :aria-expanded="menuOpen"
              aria-controls="editor-toolbar-more-menu"
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
            <svg
              class="toolbar-more__arrow"
              :class="{ 'toolbar-more__arrow--open': menuOpen }"
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="1,1 5,5 9,1" />
            </svg>
          </button>

          <Transition name="toolbar-more-menu">
            <div v-if="menuOpen" id="editor-toolbar-more-menu" class="toolbar-more__menu" role="menu">
              <button
                type="button"
                role="menuitem"
                :class="[
                  'toolbar-more__item',
                  'toolbar-more__item--mobile-shortcut',
                  { 'toolbar-more__item--active': editor.isActive('strike') },
                ]"
                @click="runMoreAction(toggleStrike)"
              >
                <span>删除线</span>
              </button>
              <button
                type="button"
                role="menuitem"
                :class="[
                  'toolbar-more__item',
                  'toolbar-more__item--mobile-shortcut',
                  { 'toolbar-more__item--active': editor.isActive('orderedList') },
                ]"
                @click="runMoreAction(toggleOrderedList)"
              >
                <span>有序列表</span>
              </button>
              <button
                type="button"
                role="menuitem"
                class="toolbar-more__item toolbar-more__item--mobile-shortcut"
                @click="setLinkFromPrompt"
              >
                <span>链接</span>
              </button>
              <button
                type="button"
                role="menuitem"
                class="toolbar-more__item toolbar-more__item--mobile-shortcut"
                @click="runMoreAction(insertTable)"
              >
                <span>插入表格</span>
              </button>
              <button
                type="button"
                role="menuitem"
                class="toolbar-more__item"
                :disabled="!editor.can().addRowAfter()"
                @click="runMoreAction(addRowAfter)"
              >
                <span>新增一行</span>
              </button>
              <button
                type="button"
                role="menuitem"
                class="toolbar-more__item"
                :disabled="!editor.can().addColumnAfter()"
                @click="runMoreAction(addColumnAfter)"
              >
                <span>新增一列</span>
              </button>
              <button
                type="button"
                role="menuitem"
                class="toolbar-more__item"
                :disabled="!editor.can().deleteRow()"
                @click="runMoreAction(deleteRow)"
              >
                <span>删除当前行</span>
              </button>
              <button
                type="button"
                role="menuitem"
                class="toolbar-more__item"
                :disabled="!editor.can().deleteColumn()"
                @click="runMoreAction(deleteColumn)"
              >
                <span>删除当前列</span>
              </button>
              <button
                type="button"
                role="menuitem"
                class="toolbar-more__item"
                :disabled="!editor.can().deleteTable()"
                @click="runMoreAction(deleteTable)"
              >
                <span>删除表格</span>
              </button>
              <button
                type="button"
                role="menuitem"
                class="toolbar-more__item toolbar-more__item--mobile-shortcut"
                @click="runMoreAction(insertRule)"
              >
                <span>分割线</span>
              </button>
              <button
                type="button"
                role="menuitem"
                class="toolbar-more__item toolbar-more__item--mobile-shortcut"
                @click="runMoreAction(clearFormatting)"
              >
                <span>清空格式</span>
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

function addRowAfter() {
  props.editor?.chain().focus().addRowAfter().run()
}

function addColumnAfter() {
  props.editor?.chain().focus().addColumnAfter().run()
}

function deleteRow() {
  props.editor?.chain().focus().deleteRow().run()
}

function deleteColumn() {
  props.editor?.chain().focus().deleteColumn().run()
}

function deleteTable() {
  props.editor?.chain().focus().deleteTable().run()
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
  z-index: 12;
  padding: 0;
  margin: 0;
}

.editor-toolbar__surface {
  border: 1px solid var(--write-toolbar-border, var(--write-panel-border));
  border-radius: 20px;
  background: var(--write-toolbar-bg, var(--write-panel-bg));
  box-shadow: var(--write-toolbar-shadow, var(--write-panel-shadow)), var(--write-panel-inset-shadow);
  overflow: visible;
}

.editor-toolbar__layout {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
}

.editor-toolbar__scroll {
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.editor-toolbar__scroll::-webkit-scrollbar {
  display: none;
}

.editor-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  width: max-content;
  min-width: 100%;
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
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
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
  transform: translateY(1px) scale(0.97);
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

@media (min-width: 769px) {
  .editor-toolbar__actions {
    gap: 4px;
  }

  .toolbar-btn,
  .toolbar-btn--compact {
    flex-direction: row;
    gap: 6px;
    min-width: 0;
    min-height: 38px;
    padding: 0 10px;
    border-radius: 11px;
  }

  .toolbar-btn svg,
  .toolbar-icon-text,
  .toolbar-label {
    flex: 0 0 auto;
  }

  .toolbar-icon-text {
    font-size: 14px;
  }

  .toolbar-label {
    font-size: 0.72rem;
    white-space: nowrap;
  }

  .toolbar-label--desktop-hidden {
    display: none;
  }

  .toolbar-btn--desktop-token {
    width: 42px;
    min-width: 42px;
    padding-inline: 0;
    gap: 0;
    justify-content: center;
  }

  .toolbar-btn--desktop-regular {
    min-width: 56px;
    justify-content: center;
  }

  .toolbar-btn--desktop-wide {
    min-width: 64px;
    justify-content: center;
  }

  .toolbar-btn--more {
    min-width: 0;
    padding-right: 8px;
  }
}

.toolbar-more {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  padding-left: 8px;
}

.toolbar-more::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 1px;
  background: var(--write-panel-divider);
}

.toolbar-btn--more {
  min-width: 58px;
}

.toolbar-more__arrow {
  color: currentColor;
  transition: transform 0.2s cubic-bezier(.4, 0, .2, 1);
}

.toolbar-more__arrow--open {
  transform: rotate(180deg);
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
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--ink-main);
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
}

.toolbar-more__item--mobile-shortcut {
  display: none;
}

.toolbar-more__item:hover {
  background: var(--write-panel-inline-hover);
  border-color: color-mix(in srgb, var(--write-panel-inline-border) 76%, var(--brand-100) 24%);
}

.toolbar-more__item:disabled {
  opacity: 0.46;
  cursor: not-allowed;
  color: var(--ink-muted);
  border-color: transparent;
  background: transparent;
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
    padding-top: 0;
    margin-bottom: 0;
  }

  .editor-toolbar__surface {
    border-radius: 18px;
  }

  .editor-toolbar__layout {
    gap: 6px;
    padding: 7px;
  }

  .toolbar-btn,
  .toolbar-btn--compact {
    min-width: 44px;
    min-height: 40px;
    padding: 7px 9px;
  }

  .toolbar-btn--desktop-only {
    display: none;
  }

  .toolbar-label {
    font-size: 0.64rem;
  }

  .toolbar-more {
    padding-left: 7px;
  }

  .toolbar-more::before {
    top: 5px;
    bottom: 5px;
  }

  .toolbar-more__menu {
    min-width: 160px;
  }

  .toolbar-more__item--mobile-shortcut {
    display: flex;
  }
}
</style>
