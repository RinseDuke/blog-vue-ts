<template>
  <section class="write-page">
    <!-- 编辑器区域 -->
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

        <!--实时阅览-->
        <template v-if="viewMode === 'live'">
          <EditorToolbar :editor="editor || null" />
          <editor-content :editor="editor" class="tiptap-editor" />
        </template>

        <!--源码模式 -->
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

        <!-- 阅读视图  -->
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

      <!-- 发布设置面板 -->
      <PublishPanel
        :status="publishStatus"
        :visibility="publishVisibility"
        @update:status="handlePublishStatusChange"
        @update:visibility="handlePublishVisibilityChange"
      />
      <input
        ref="coverInputRef"
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        class="sr-only"
        @change="onCoverChange"
      />
    </div>

    <p v-if="publishError" class="write-page__feedback write-page__feedback--error">{{ publishError }}</p>

    <!-- 按钮 -->
    <StatusBar 
      :word-count="wordCount"
      :current-mode-label="currentModeLabel"
      :view-mode="viewMode"
      :save-label="saveLabel"
      :is-publishing="isPublishing"
      :publish-label="publishLabel"
      @change-mode="setViewMode"
      @clear-draft="onClearDraft"
      @save-draft="saveDraftNow"
      @export-markdown="onExportMarkdown"
      @publish="onPublish"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

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

import { gfm } from 'turndown-plugin-gfm'
import MarkdownIt from 'markdown-it'

import { useDraft } from '@/features/post/composables/useDraft'
import { useCoverUpload } from '@/features/post/composables/useCoverUpload'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { useTagManager } from '@/features/post/composables/useTagManager'

import EditorToolbar from '@/components/post/EditorToolbar.vue'
import PublishPanel from '@/components/post/PublishPanel.vue'
import StatusBar from '@/components/post/StatusBar.vue'
import { createPost } from '@/services/postService'

const router = useRouter()
const postsStore = usePostsStore()

// 封面上传（bushi）
const turndownService = new TurndownService({ headingStyle: 'atx' })
turndownService.use(gfm)
const mdParser = new MarkdownIt()

type ViewMode = 'read' | 'source' | 'live'
const VIEW_MODE_KEY = 'blog_write_view_mode_v1'
const DEFAULT_PUBLISH_STATUS = 'published'
const DEFAULT_PUBLISH_VISIBILITY = 'public'


const {
  lastSavedAt, isDirty,
  readDraft, persistDraft, clearPersistedDraft,
  markDirty, queueAutosave, cancelPendingAutosave, flushPendingAutosave,
} = useDraft()

//自动保存
function onDirtyAndAutosave() {
  markDirty()
  queueAutosave(saveDraftNow)
}

const {
  coverInputRef, coverPreviewUrl,
  handleCoverSelect, removeCover, restoreCoverFromUrl,
} = useCoverUpload(onDirtyAndAutosave)

const {
  selectedTags, restoreTags, clearTags,
} = useTagManager(onDirtyAndAutosave)


const title = ref('')
const markdown = ref('')
const viewMode = ref<ViewMode>(readViewMode())
const publishStatus = ref<'draft' | 'published'>(DEFAULT_PUBLISH_STATUS)
const publishVisibility = ref<'public' | 'private'>(DEFAULT_PUBLISH_VISIBILITY)
const isPublishing = ref(false)
const publishError = ref('')
const isSyncingEditorContent = ref(false)


//顶部编辑栏
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
    if (isSyncingEditorContent.value) return

    // 生成 HTML → 转 Markdown → 更新状态
    const html = editor.getHTML()
    markdown.value = turndownService.turndown(html)
    onDirtyAndAutosave()
  },
})

// 计算字数
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
const publishLabel = computed(() => (isPublishing.value ? '发布中...' : '发布'))

// 实时渲染 Markdown 为 HTML
const renderedHtml = computed(() => mdParser.render(markdown.value))

function syncEditorFromMarkdown(source: string) {
  if (!editor.value) return

  isSyncingEditorContent.value = true
  try {
    editor.value.commands.setContent(mdParser.render(source))
  } finally {
    isSyncingEditorContent.value = false
  }
}

function setViewMode(mode: string) {
  const prevMode = viewMode.value
  const newMode = mode as ViewMode

  if (prevMode === 'live' && editor.value) {
    const html = editor.value.getHTML()
    markdown.value = turndownService.turndown(html)
  }

  // 输入模式切换到实时阅览， markdown 渲染成 HTML 注入编辑器
  if (newMode === 'live') {
    syncEditorFromMarkdown(markdown.value)
  }

  // 输入模式切换到阅读视图
  viewMode.value = newMode
  localStorage.setItem(VIEW_MODE_KEY, mode)
}

// 同步状态
function onSourceInput() {
  onDirtyAndAutosave()
}

function handlePublishStatusChange(value: 'draft' | 'published') {
  if (publishStatus.value === value) return
  publishStatus.value = value
  onDirtyAndAutosave()
}

function handlePublishVisibilityChange(value: 'public' | 'private') {
  if (publishVisibility.value === value) return
  publishVisibility.value = value
  onDirtyAndAutosave()
}

// 封面图片选择
function onCoverChange(event: Event) {
  const errMsg = handleCoverSelect(event)
  if (errMsg) alert(errMsg)
}

function hasPersistableDraft() {
  return Boolean(
    title.value.trim() ||
    markdown.value.trim() ||
    selectedTags.value.length ||
    coverPreviewUrl.value ||
    publishStatus.value !== DEFAULT_PUBLISH_STATUS ||
    publishVisibility.value !== DEFAULT_PUBLISH_VISIBILITY
  )
}

// 草稿保存
function saveDraftNow() {
  if (!hasPersistableDraft()) {
    clearPersistedDraft()
    return
  }

  persistDraft({
    title: title.value.trim(),
    markdown: markdown.value,
    tags: selectedTags.value,
    coverDataUrl: coverPreviewUrl.value,
    status: publishStatus.value,
    visibility: publishVisibility.value,
    updatedAt: new Date().toISOString(),
  })
}

//清空草稿
function onClearDraft() {
  if (!window.confirm('确定要清空当前草稿吗？此操作不可撤销。')) return
  publishError.value = ''
  title.value = ''
  markdown.value = ''
  publishStatus.value = DEFAULT_PUBLISH_STATUS
  publishVisibility.value = DEFAULT_PUBLISH_VISIBILITY
  clearTags()
  removeCover()
  cancelPendingAutosave()
  clearPersistedDraft()
  syncEditorFromMarkdown('')
}

//导出Markdown
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

async function onPublish() {
  const content = markdown.value
  const finalTitle = title.value.trim()
  publishError.value = ''

  if (!finalTitle) { publishError.value = '请先填写标题。'; return }
  if (!content.trim()) { publishError.value = '正文不能为空。'; return }
  if (isPublishing.value) return

  isPublishing.value = true

  try {
    const html = viewMode.value === 'live' && editor.value ? editor.value.getHTML() : renderedHtml.value
    const createdPost = await createPost({
      title: finalTitle,
      markdown: content,
      html,
      status: publishStatus.value,
      visibility: publishVisibility.value,
      tags: selectedTags.value,
      coverImage: coverPreviewUrl.value,
    })

    cancelPendingAutosave()
    clearPersistedDraft()
    await postsStore.refreshPosts().catch((err) => {
      console.warn('发布后刷新文章缓存失败', err)
    })
    await router.replace({ name: 'article-detail', params: { id: createdPost.id } })
  } catch (err) {
    publishError.value = err instanceof Error ? err.message : '发布失败，请稍后重试。'
  } finally {
    isPublishing.value = false
  }
}

// 模式选择
function readViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_KEY)
  if (stored === 'read' || stored === 'source' || stored === 'live') return stored
  return 'live'
}

// 加载草稿
onMounted(() => {
  const draft = readDraft()
  title.value = draft?.title ?? ''
  markdown.value = draft?.markdown ?? ''
  publishStatus.value = draft?.status ?? DEFAULT_PUBLISH_STATUS
  publishVisibility.value = draft?.visibility ?? DEFAULT_PUBLISH_VISIBILITY
  restoreTags(draft?.tags ?? [])
  restoreCoverFromUrl(draft?.coverDataUrl ?? null)

  if (draft?.updatedAt) {
    lastSavedAt.value = draft.updatedAt
  }

  //加载markdown草稿
  if (markdown.value) {
    syncEditorFromMarkdown(markdown.value)
  }

  window.addEventListener('beforeunload', onBeforeUnload)
})

// 卸载前清理
onBeforeUnmount(() => {
  flushPendingAutosave(saveDraftNow)
  cancelPendingAutosave()
  window.removeEventListener('beforeunload', onBeforeUnload)
})

// 离开页面前提示保存
function onBeforeUnload(e: BeforeUnloadEvent) {
  if (flushPendingAutosave(saveDraftNow)) {
    return
  }
  if (!isDirty.value) return
  e.preventDefault()
  e.returnValue = ''
}
</script>

<style scoped lang="less">

//页面布局
.write-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 78px);
  padding-bottom: calc(var(--write-status-bar-height, 112px) + env(safe-area-inset-bottom, 0px));
  background: var(--bg-canvas);
}

.write-page__feedback {
  max-width: 820px;
  width: 100%;
  margin: 0 auto;
  padding: 0.8rem 24px 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.write-page__feedback--error {
  color: var(--danger-500);
}

//编辑器主体
.editor-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--surface-strong);
  border-bottom: 1px solid var(--line-soft);
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

//标题
.title-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: clamp(1.45rem, 2.4vw, 1.9rem);
  font-weight: 700;
  color: var(--ink-strong);
  line-height: 1.4;
  padding: 28px 0 10px;
  background: transparent;

  &::placeholder {
    color: var(--ink-muted);
    font-weight: 600;
  }
}

//实时阅览编辑器
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
  color: var(--ink-main);

  p.is-editor-empty:first-child::before {
    color: var(--ink-muted);
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  h1, h2, h3, h4, h5, h6 {
    line-height: 1.3;
    color: var(--ink-strong);
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  h2 {
    font-size: 1.5em;
    border-bottom: 1px solid var(--line-soft);
    padding-bottom: 0.3em;
  }

  h3 { font-size: 1.25em; }

  ul, ol {
    padding-left: 1.5rem;
    margin: 1em 0;
  }

  blockquote {
    border-left: 4px solid var(--line-strong);
    padding-left: 1rem;
    color: var(--ink-muted);
    margin: 1em 0;
    background: var(--bg-canvas-soft);
    padding: 0.5rem 1rem;
    border-radius: 0 4px 4px 0;
  }

  pre {
    background: var(--ink-strong);
    color: var(--bg-canvas-soft);
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
    background-color: var(--bg-canvas-soft);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
    color: #db2777;
    font-family: monospace;
  }

  hr {
    border: none;
    border-top: 2px solid var(--line-soft);
    margin: 2rem 0;
  }

  table {
    border-collapse: collapse;
    margin: 0;
    overflow: hidden;
    table-layout: fixed;
    width: 100%;

    td, th {
      border: 1px solid var(--line-strong);
      box-sizing: border-box;
      min-width: 1em;
      padding: 6px 8px;
      position: relative;
      vertical-align: top;

      >* { margin-bottom: 0; }
    }

    th {
      background-color: var(--bg-canvas-soft);
      font-weight: 600;
      text-align: left;
    }
  }
}


//源码编辑器
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
  color: var(--ink-strong);
  background: var(--bg-canvas-soft);
  border-radius: 8px;
  padding: 20px;
  tab-size: 2;
  white-space: pre-wrap;
  word-wrap: break-word;
  transition: background 0.2s;

  &::placeholder {
    color: var(--ink-muted);
  }

  &:focus {
    background: var(--bg-canvas);
    box-shadow: inset 0 0 0 1.5px rgba(0, 113, 227, 0.15);
  }
}

//阅读视图
.read-preview {
  flex: 1;
  margin-top: 16px;
  padding-bottom: 40px;
  font-size: 16px;
  line-height: 1.7;
  color: var(--ink-main);

  &--empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 280px);
    gap: 16px;
    color: var(--ink-muted);
    font-size: 0.92rem;
  }

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    line-height: 1.3;
    color: var(--ink-strong);
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  :deep(h2) {
    font-size: 1.5em;
    border-bottom: 1px solid var(--line-soft);
    padding-bottom: 0.3em;
  }

  :deep(h3) { font-size: 1.25em; }

  :deep(ul), :deep(ol) {
    padding-left: 1.5rem;
    margin: 1em 0;
  }

  :deep(blockquote) {
    border-left: 4px solid var(--line-strong);
    color: var(--ink-muted);
    margin: 1em 0;
    background: var(--bg-canvas-soft);
    padding: 0.5rem 1rem;
    border-radius: 0 4px 4px 0;
  }

  :deep(pre) {
    background: var(--ink-strong);
    color: var(--bg-canvas-soft);
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
    background-color: var(--bg-canvas-soft);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
    color: #db2777;
    font-family: monospace;
  }

  :deep(hr) {
    border: none;
    border-top: 2px solid var(--line-soft);
    margin: 2rem 0;
  }

  :deep(table) {
    border-collapse: collapse;
    margin: 0;
    table-layout: fixed;
    width: 100%;

    td, th {
      border: 1px solid var(--line-strong);
      padding: 6px 8px;
      vertical-align: top;
    }

    th {
      background-color: var(--bg-canvas-soft);
      font-weight: 600;
      text-align: left;
    }
  }
}
//屏幕阅读器专用隐藏元素
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}




@media (max-width: 768px) {
  .write-page {
    padding-bottom: calc(var(--write-status-bar-height-mobile, 150px) + env(safe-area-inset-bottom, 0px));
  }

  .editor-body {
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>
