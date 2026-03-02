<template>
  <section class="write-page">
    <!-- ─── Toolbar + Editor Area ─── -->
    <div class="editor-shell">
      <div class="editor-body">
        <input
          v-model="title"
          class="title-input"
          type="text"
          maxlength="100"
          placeholder="请输入标题（最多 100 个字）"
          @input="onDirtyAndAutosave"
        />

        <!-- ═══ Mode: 实时阅览 (Live WYSIWYG) ═══ -->
        <template v-if="viewMode === 'live'">
          <EditorToolbar :editor="editor || null" />
          <editor-content :editor="editor" class="tiptap-editor" />
        </template>

        <!-- ═══ Mode: 源码模式 (Source Markdown) ═══ -->
        <template v-else-if="viewMode === 'source'">
          <div class="source-editor-wrap">
            <textarea
              v-model="markdown"
              class="source-editor"
              placeholder="在此输入 Markdown 源码..."
              spellcheck="false"
              @input="onSourceInput"
            ></textarea>
          </div>
        </template>

        <!-- ═══ Mode: 阅读视图 (Read-only Preview) ═══ -->
        <template v-else-if="viewMode === 'read'">
          <div v-if="markdown.trim()" class="read-preview" v-html="renderedHtml"></div>
          <div v-else class="read-preview read-preview--empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <p>暂无内容，请先在编辑模式中撰写文章</p>
          </div>
        </template>
      </div>

      <!-- ─── Publish Settings Panel (always visible, scroll to see) ─── -->
      <PublishPanel 
        :cover-preview-url="coverPreviewUrl"
        :selected-tags="selectedTags"
        :suggested-tags="suggestedTags"
        :max-tags="maxTags"
        v-model:tag-input="tagInput"
        @remove-cover="removeCover"
        @trigger-cover="triggerCoverInput"
        @remove-tag="removeTag"
        @add-tag="addTag"
        @add-custom-tag="addCustomTag"
      />
      <input
        ref="coverInputRef"
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        class="sr-only"
        @change="onCoverChange"
      />
    </div>

    <!-- ─── Bottom Status Bar ─── -->
    <StatusBar 
      :word-count="wordCount"
      :current-mode-label="currentModeLabel"
      :view-mode="viewMode"
      :save-label="saveLabel"
      @change-mode="setViewMode"
      @clear-draft="onClearDraft"
      @save-draft="saveDraftNow"
      @export-markdown="onExportMarkdown"
      @publish="onPublish"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import TurndownService from 'turndown'
// @ts-ignore - no types available
import { gfm } from 'turndown-plugin-gfm'
import MarkdownIt from 'markdown-it'

// Composables
import { useDraft } from '@/features/post/composables/useDraft'
import { useCoverUpload } from '@/features/post/composables/useCoverUpload'
import { useTagManager } from '@/features/post/composables/useTagManager'

// Custom Components
import EditorToolbar from '@/components/post/EditorToolbar.vue'
import PublishPanel from '@/components/post/PublishPanel.vue'
import StatusBar from '@/components/post/StatusBar.vue'

// ── Markdown/HTML Tools ──
const turndownService = new TurndownService({ headingStyle: 'atx' })
turndownService.use(gfm)
const mdParser = new MarkdownIt()

type ViewMode = 'read' | 'source' | 'live'
const VIEW_MODE_KEY = 'blog_write_view_mode_v1'

// ── Composables ──
const {
  lastSavedAt, isDirty,
  readDraft, persistDraft, clearPersistedDraft,
  markDirty, queueAutosave, cancelPendingAutosave,
} = useDraft()

function onDirtyAndAutosave() {
  markDirty()
  queueAutosave(saveDraftNow)
}

const {
  coverInputRef, coverFile, coverPreviewUrl,
  triggerCoverInput, handleCoverSelect, removeCover, restoreCoverFromUrl,
} = useCoverUpload(onDirtyAndAutosave)

const {
  selectedTags, tagInput, suggestedTags, maxTags,
  addTag, removeTag, addCustomTag, restoreTags, clearTags,
} = useTagManager(onDirtyAndAutosave)

// ── Local state ──
const title = ref('')
const markdown = ref('')
const viewMode = ref<ViewMode>(readViewMode())


// ── Tiptap Editor Initialization ──
const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: '请输入正文...',
    }),
    Underline,
    Link.configure({
      openOnClick: false,
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
  ],
  content: '',
  onUpdate: ({ editor }) => {
    // Generate markdown on the fly for saving
    const html = editor.getHTML()
    markdown.value = turndownService.turndown(html)
    onDirtyAndAutosave()
  },
})

// ── Computed ──
const wordCount = computed(() => {
  const zh = (markdown.value.match(/[\u4e00-\u9fff]/g) ?? []).length
  const en = (markdown.value.replace(/[\u4e00-\u9fff]/g, '').match(/[A-Za-z0-9_]+/g) ?? []).length
  return zh + en
})

const saveLabel = computed(() => {
  if (isDirty.value || !lastSavedAt.value) return ''
  const dt = new Date(lastSavedAt.value)
  return `已保存 ${dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
})

const MODE_LABELS: Record<ViewMode, string> = {
  read: '阅读视图',
  source: '源码模式',
  live: '实时阅览',
}

const currentModeLabel = computed(() => MODE_LABELS[viewMode.value])

// Rendered HTML for read-only preview
const renderedHtml = computed(() => mdParser.render(markdown.value))

// Sync content when switching modes
function setViewMode(mode: string) {
  const prevMode = viewMode.value
  const newMode = mode as ViewMode

  // Leaving live mode → grab latest markdown from Tiptap
  if (prevMode === 'live' && editor.value) {
    const html = editor.value.getHTML()
    markdown.value = turndownService.turndown(html)
  }

  // Entering live mode → push markdown into Tiptap
  if (newMode === 'live' && editor.value) {
    const htmlContent = mdParser.render(markdown.value)
    editor.value.commands.setContent(htmlContent)
  }

  // Entering read mode → make editor non-editable feeling (just visual)
  viewMode.value = newMode
  localStorage.setItem(VIEW_MODE_KEY, mode)
}

// Source textarea input handler
function onSourceInput() {
  onDirtyAndAutosave()
}

// ── Cover handler bridge ──
function onCoverChange(event: Event) {
  const errMsg = handleCoverSelect(event)
  if (errMsg) alert(errMsg)
}

// ── Draft actions ──
function saveDraftNow() {
  persistDraft({
    title: title.value.trim(),
    markdown: markdown.value, 
    tags: selectedTags.value,
    coverDataUrl: coverPreviewUrl.value,
    updatedAt: new Date().toISOString(),
  })
}

function onClearDraft() {
  if (!window.confirm('确定要清空当前草稿吗？此操作不可撤销。')) return
  title.value = ''
  markdown.value = ''
  clearTags()
  removeCover()
  clearPersistedDraft()
  editor.value?.commands.setContent('')
}

function onExportMarkdown() {
  const content = markdown.value
  if (!content.trim()) {
    alert('当前没有可导出的内容')
    return
  }
  const name = (title.value.trim() || 'untitled').replace(/[\\/:*?"<>|]/g, '-')
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.md`
  a.click()
  URL.revokeObjectURL(url)
}

function onPublish() {
  const content = markdown.value
  const finalTitle = title.value.trim()

  if (!finalTitle) { alert('请先填写标题'); return }
  if (!content.trim()) { alert('正文不能为空'); return }
  if (selectedTags.value.length === 0) { alert('请至少添加一个标签'); return }

  saveDraftNow()
  console.log('Publish payload:', {
    title: finalTitle,
    markdown: content,
    html: editor.value?.getHTML(),
    tags: selectedTags.value,
    coverFile: coverFile.value,
    updatedAt: new Date().toISOString(),
  })
  alert('已输出到控制台，下一步可接入发布 API')
}

// ── View mode ──
function readViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_KEY)
  if (stored === 'read' || stored === 'source' || stored === 'live') return stored
  return 'live'
}

// ── Lifecycle ──
onMounted(() => {
  const draft = readDraft()
  title.value = draft?.title ?? ''
  markdown.value = draft?.markdown ?? ''
  restoreTags(draft?.tags ?? [])
  restoreCoverFromUrl(draft?.coverDataUrl ?? null)

  if (draft?.updatedAt) {
    lastSavedAt.value = draft.updatedAt
  }

  // Load markdown draft into tiptap as HTML
  if (markdown.value && editor.value) {
    const htmlContent = mdParser.render(markdown.value)
    editor.value.commands.setContent(htmlContent)
  }

  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  cancelPendingAutosave()
  window.removeEventListener('beforeunload', onBeforeUnload)
})

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (!isDirty.value) return
  e.preventDefault()
  e.returnValue = ''
}
</script>

<style scoped lang="less">
/* ───────── Page Layout ───────── */
.write-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 78px);
  padding-bottom: 44px;
  background: #f5f7fa;
}

/* ───────── Editor Shell ───────── */
.editor-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #eaeff6;
}

.editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 820px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
}

/* ───────── Title ───────── */
.title-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: clamp(1.45rem, 2.4vw, 1.9rem);
  font-weight: 700;
  color: var(--ink-strong, #0f172a);
  line-height: 1.4;
  padding: 28px 0 10px;
  background: transparent;

  &::placeholder {
    color: #b4bdd0;
    font-weight: 600;
  }
}

/* ───────── Tiptap Editor Content (live mode) ───────── */
.tiptap-editor {
  flex: 1;
  margin-top: 16px;
  padding-bottom: 40px;
}

:deep(.tiptap) {
  outline: none !important;
  min-height: calc(100vh - 280px);
  font-size: 16px;
  line-height: 1.7;
  color: #334155;

  p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  h1, h2, h3, h4, h5, h6 {
    line-height: 1.3;
    color: #0f172a;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.3em;
  }

  h3 { font-size: 1.25em; }

  ul, ol {
    padding-left: 1.5rem;
    margin: 1em 0;
  }

  blockquote {
    border-left: 4px solid #cbd5e1;
    padding-left: 1rem;
    color: #64748b;
    margin: 1em 0;
    background: #f8fafc;
    padding: 0.5rem 1rem;
    border-radius: 0 4px 4px 0;
  }

  pre {
    background: #0f172a;
    color: #f8fafc;
    font-family: inherit;
    padding: 1rem;
    border-radius: 8px;
    margin: 1em 0;
    overflow-x: auto;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.9em;
    }
  }

  code {
    background-color: #f1f5f9;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
    color: #db2777;
    font-family: monospace;
  }

  hr {
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 2rem 0;
  }

  table {
    border-collapse: collapse;
    margin: 0;
    overflow: hidden;
    table-layout: fixed;
    width: 100%;

    td, th {
      border: 1px solid #cbd5e1;
      box-sizing: border-box;
      min-width: 1em;
      padding: 6px 8px;
      position: relative;
      vertical-align: top;

      >* { margin-bottom: 0; }
    }

    th {
      background-color: #f8fafc;
      font-weight: 600;
      text-align: left;
    }
  }
}

/* ───────── Source Editor (source mode) ───────── */
.source-editor-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  padding-bottom: 40px;
}

.source-editor {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 280px);
  border: none;
  outline: none;
  resize: none;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.75;
  color: #1e293b;
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  tab-size: 2;
  white-space: pre-wrap;
  word-wrap: break-word;
  transition: background 0.2s;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    background: #f1f5f9;
    box-shadow: inset 0 0 0 1.5px rgba(0, 113, 227, 0.15);
  }
}

/* ───────── Read Preview (read mode) ───────── */
.read-preview {
  flex: 1;
  margin-top: 16px;
  padding-bottom: 40px;
  font-size: 16px;
  line-height: 1.7;
  color: #334155;

  &--empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 280px);
    gap: 16px;
    color: #94a3b8;
    font-size: 0.92rem;
  }

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    line-height: 1.3;
    color: #0f172a;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  :deep(h2) {
    font-size: 1.5em;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.3em;
  }

  :deep(h3) { font-size: 1.25em; }

  :deep(ul), :deep(ol) {
    padding-left: 1.5rem;
    margin: 1em 0;
  }

  :deep(blockquote) {
    border-left: 4px solid #cbd5e1;
    color: #64748b;
    margin: 1em 0;
    background: #f8fafc;
    padding: 0.5rem 1rem;
    border-radius: 0 4px 4px 0;
  }

  :deep(pre) {
    background: #0f172a;
    color: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    margin: 1em 0;
    overflow-x: auto;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.9em;
    }
  }

  :deep(code) {
    background-color: #f1f5f9;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
    color: #db2777;
    font-family: monospace;
  }

  :deep(hr) {
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 2rem 0;
  }

  :deep(table) {
    border-collapse: collapse;
    margin: 0;
    table-layout: fixed;
    width: 100%;

    td, th {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      vertical-align: top;
    }

    th {
      background-color: #f8fafc;
      font-weight: 600;
      text-align: left;
    }
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}



/* ───────── Responsive ───────── */
@media (max-width: 768px) {
  .editor-body {
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>
