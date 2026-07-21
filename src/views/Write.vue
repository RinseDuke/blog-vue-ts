<template>
  <section class="write-page">
    <div class="editor-shell">
      <div class="editor-main">
        <div v-if="viewMode === 'live'" class="editor-toolbar-wrap">
          <EditorToolbar :editor="editor || null" />
        </div>

        <section class="editor-main-card">
          <header class="editor-main-card__header">
            <input
              v-model="title"
              class="title-input"
              type="text"
              maxlength="100"
              placeholder="请输入标题（最多 100 个字）"
              @input="onDirtyAndAutosave"
            />
            <div class="meta-toggle-row">
              <button type="button" class="meta-toggle" @click="showMeta = !showMeta">
                <svg
                  class="meta-toggle__chevron"
                  :class="{ 'meta-toggle__chevron--open': showMeta }"
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                文章设置
                <span v-if="metaBadge && !showMeta" class="meta-toggle__badge">{{ metaBadge }}</span>
              </button>
            </div>
          </header>

          <div v-if="showMeta" class="meta-panel">
            <div class="meta-panel__section">
              <h4 class="meta-panel__label">封面图</h4>
              <div v-if="coverPreviewUrl" class="meta-panel__cover-preview">
                <img :src="coverPreviewUrl" alt="封面预览" />
                <button type="button" class="meta-panel__cover-remove" @click="removeCover()">移除封面</button>
              </div>
              <button v-else type="button" class="meta-panel__cover-upload" @click="triggerCoverInput">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>点击上传封面</span>
                <span class="meta-panel__hint">支持 JPG、PNG</span>
              </button>
            </div>

            <div class="meta-panel__section">
              <h4 class="meta-panel__label">标签 ({{ selectedTags.length }}/5)</h4>
              <div class="meta-panel__tags">
                <span v-for="tag in selectedTags" :key="tag" class="meta-panel__tag">
                  {{ tag }}
                  <button type="button" @click="removeTag(tag)" aria-label="移除标签">&times;</button>
                </span>
                <input
                  v-if="selectedTags.length < 5"
                  v-model="tagInput"
                  type="text"
                  class="meta-panel__tag-input"
                  placeholder="输入标签，回车添加"
                  @keydown.enter.prevent="addCustomTag"
                />
              </div>
              <div v-if="suggestedTags.length" class="meta-panel__presets">
                <button
                  v-for="tag in suggestedTags"
                  :key="tag"
                  type="button"
                  class="meta-panel__preset"
                  @click="addTag(tag)"
                >+ {{ tag }}</button>
              </div>
            </div>
          </div>

          <div class="editor-main-card__canvas">
            <template v-if="viewMode === 'live'">
              <div class="editor-canvas editor-canvas--live">
                <EditorContent :editor="editor" class="tiptap-editor" />
              </div>
            </template>

            <template v-else-if="viewMode === 'source'">
              <div class="editor-canvas editor-canvas--source">
                <textarea
                  v-model="markdown"
                  class="source-editor"
                  placeholder="在此输入 Markdown 源码..."
                  spellcheck="false"
                  @input="onSourceInput"
                ></textarea>
              </div>
            </template>

            <template v-else-if="viewMode === 'read'">
              <div class="editor-canvas editor-canvas--read">
                <div v-if="markdown.trim()" class="read-preview" v-html="renderedHtml"></div>
                <div v-else class="read-preview read-preview--empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <p>暂无内容，请先在编辑模式中撰写文章</p>
                </div>
              </div>
            </template>
          </div>
        </section>
      </div>

      <input
        ref="coverInputRef"
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        class="sr-only"
        @change="onCoverChange"
      />
    </div>

    <p v-if="publishError" class="write-page__feedback write-page__feedback--error">{{ publishError }}</p>

    <StatusBar
      :word-count="wordCount"
      :read-minutes="readMinutes"
      :current-mode-label="currentModeLabel"
      :view-mode="viewMode"
      :save-label="saveLabel"
      :visibility="publishVisibility"
      :is-publishing="isPublishing"
      :publish-label="publishLabel"
      @change-mode="setViewMode"
      @clear-draft="onClearDraft"
      @save-draft="saveDraftNow"
      @export-markdown="onExportMarkdown"
      @publish="onPublish"
      @update:visibility="handlePublishVisibilityChange"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

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
import { useDraft } from '@/features/post/composables/useDraft'
import { useCoverUpload } from '@/features/post/composables/useCoverUpload'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { useTagManager } from '@/features/post/composables/useTagManager'
import {
  normalizeWriteMarkdown,
  renderWriteMarkdownToHtml,
  serializeEditorHtmlToMarkdown,
} from '@/features/post/utils/writeMarkdown'

import EditorToolbar from '@/components/post/EditorToolbar.vue'
import StatusBar from '@/components/post/StatusBar.vue'
import { LivePreviewPlugin } from '@/extensions/LivePreviewPlugin'
import { createPost } from '@/services/postService'

const router = useRouter()
const postsStore = usePostsStore()

type ViewMode = 'read' | 'source' | 'live'
const VIEW_MODE_KEY = 'blog_write_view_mode_v1'
const DEFAULT_PUBLISH_VISIBILITY = 'public'


const {
  lastSavedAt, isDirty,
  readDraft, persistDraft, clearPersistedDraft,
  markDirty, queueAutosave, cancelPendingAutosave, flushPendingAutosave,
} = useDraft()

function onDirtyAndAutosave() {
  markDirty()
  queueAutosave(saveDraftNow)
}

const {
  coverInputRef, coverPreviewUrl, triggerCoverInput,
  handleCoverSelect, removeCover, restoreCoverFromUrl,
} = useCoverUpload(onDirtyAndAutosave)

const {
  selectedTags, tagInput, suggestedTags,
  addTag, removeTag, addCustomTag,
  restoreTags, clearTags,
} = useTagManager(onDirtyAndAutosave)


const title = ref('')
const markdown = ref('')
const viewMode = ref<ViewMode>(readViewMode())
const publishVisibility = ref<'public' | 'private'>(DEFAULT_PUBLISH_VISIBILITY)
const isPublishing = ref(false)
const publishError = ref('')
const isSyncingEditorContent = ref(false)
const showMeta = ref(false)


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
    LivePreviewPlugin,
  ],
  content: '',
  onUpdate: ({ editor }) => {
    if (isSyncingEditorContent.value) return

    const html = editor.getHTML()
    markdown.value = serializeEditorHtmlToMarkdown(html)
    onDirtyAndAutosave()
  },
})

const wordCount = computed(() => {
  const zh = (markdown.value.match(/[\u4e00-\u9fff]/g) ?? []).length
  const en = (markdown.value.replace(/[\u4e00-\u9fff]/g, '').match(/[A-Za-z0-9_]+/g) ?? []).length
  return zh + en
})

const readMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 400)))

const metaBadge = computed(() => {
  const parts: string[] = []
  if (coverPreviewUrl.value) parts.push('\u5df2\u8bbe\u5c01\u9762')
  if (selectedTags.value.length) parts.push(`${selectedTags.value.length} \u6807\u7b7e`)
  return parts.join(' \u00b7 ')
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

const renderedHtml = computed(() => renderWriteMarkdownToHtml(markdown.value))

function syncEditorFromMarkdown(source: string) {
  if (!editor.value) return

  isSyncingEditorContent.value = true
  try {
    editor.value.commands.setContent(renderWriteMarkdownToHtml(source))
  } finally {
    isSyncingEditorContent.value = false
  }
}

function setViewMode(mode: string) {
  const prevMode = viewMode.value
  const newMode = mode as ViewMode

  if (prevMode === 'live' && editor.value) {
    const html = editor.value.getHTML()
    markdown.value = serializeEditorHtmlToMarkdown(html)
  }

  if (newMode === 'live') {
    syncEditorFromMarkdown(markdown.value)
  }

  viewMode.value = newMode
  localStorage.setItem(VIEW_MODE_KEY, mode)
}

function onSourceInput() {
  onDirtyAndAutosave()
}

function handlePublishVisibilityChange(value: 'public' | 'private') {
  if (publishVisibility.value === value) return
  publishVisibility.value = value
  onDirtyAndAutosave()
}

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
    publishVisibility.value !== DEFAULT_PUBLISH_VISIBILITY
  )
}

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
    visibility: publishVisibility.value,
    updatedAt: new Date().toISOString(),
  })
}

function onClearDraft() {
  if (!window.confirm('确定要清空当前草稿吗？此操作不可撤销。')) return
  publishError.value = ''
  title.value = ''
  markdown.value = ''
  publishVisibility.value = DEFAULT_PUBLISH_VISIBILITY
  clearTags()
  removeCover()
  cancelPendingAutosave()
  clearPersistedDraft()
  syncEditorFromMarkdown('')
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
      status: 'published',
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

function readViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_KEY)
  if (stored === 'read' || stored === 'source' || stored === 'live') return stored
  return 'live'
}

onMounted(() => {
  const draft = readDraft()
  title.value = draft?.title ?? ''
  markdown.value = normalizeWriteMarkdown(draft?.markdown ?? '')
  publishVisibility.value = draft?.visibility ?? DEFAULT_PUBLISH_VISIBILITY
  restoreTags(draft?.tags ?? [])
  restoreCoverFromUrl(draft?.coverDataUrl ?? null)

  if (draft?.updatedAt) {
    lastSavedAt.value = draft.updatedAt
  }

  if (markdown.value) {
    syncEditorFromMarkdown(markdown.value)
  }

  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  flushPendingAutosave(saveDraftNow)
  cancelPendingAutosave()
  window.removeEventListener('beforeunload', onBeforeUnload)
})

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
.write-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 78px);
  padding-bottom: calc(var(--write-status-bar-height, 112px) + env(safe-area-inset-bottom, 0px));
  background: var(--bg-canvas);
}

.write-page__feedback {
  max-width: var(--write-content-max-width, 980px);
  width: 100%;
  margin: 0 auto;
  padding: 0.8rem 24px 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.write-page__feedback--error {
  color: var(--danger-500);
}

.editor-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 97%, transparent), color-mix(in srgb, var(--bg-canvas) 84%, transparent));
  border-bottom: 1px solid var(--line-soft);
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: var(--write-content-max-width, 980px);
  width: 100%;
  margin: 0 auto;
  padding: 16px 24px 36px;
}

.editor-toolbar-wrap {
  position: sticky;
  top: 68px;
  z-index: 20;
  margin-bottom: 8px;
}

.editor-main-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--write-editor-card-border);
  border-radius: 22px;
  background: var(--write-editor-card-bg);
  box-shadow: var(--write-editor-card-shadow), var(--write-panel-inset-shadow);
}

.editor-main-card__header {
  padding: 0 24px;
  border-bottom: 1px solid var(--write-editor-divider);
  background: var(--write-editor-header-bg);
}

.editor-main-card__canvas {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 8px 24px 24px;
  background: var(--control-surface);
}

.meta-toggle-row {
  padding-bottom: 12px;
}

.meta-toggle {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--ink-muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  min-height: 44px;
  transition: color var(--motion-base) var(--ease-out);

  &:hover {
    color: var(--brand-500);
  }
}

.meta-toggle__chevron {
  transition: transform var(--motion-base) var(--ease-out-quint);
}

.meta-toggle__chevron--open {
  transform: rotate(180deg);
}

.meta-toggle__badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-100) 60%, transparent);
  color: var(--brand-500);
  font-size: 0.72rem;
  font-weight: 700;
}

.meta-panel {
  display: flex;
  gap: 20px;
  padding: 0 24px 16px;
  border-bottom: 1px solid var(--write-editor-divider);
}

.meta-panel__section {
  flex: 1;
  min-width: 0;
}

.meta-panel__label {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.meta-panel__cover-upload {
  appearance: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 100px;
  border: 2px dashed var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--control-surface);
  color: var(--ink-muted);
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color var(--motion-base) var(--ease-out), color var(--motion-base) var(--ease-out);

  &:hover {
    border-color: var(--brand-500);
    color: var(--brand-500);
  }
}

.meta-panel__hint {
  font-size: 0.72rem;
  opacity: 0.7;
}

.meta-panel__cover-preview {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;

  img {
    width: 100%;
    max-height: 160px;
    object-fit: cover;
    display: block;
  }
}

.meta-panel__cover-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  appearance: none;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  cursor: pointer;
  transition: background var(--motion-base) var(--ease-out);

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
}

.meta-panel__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--control-surface);
  min-height: 46px;
}

.meta-panel__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-100) 66%, transparent);
  color: var(--brand-500);
  font-size: 0.78rem;
  font-weight: 600;

  button {
    appearance: none;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 0.9rem;
    line-height: 1;
    padding: 0 2px;
    opacity: 0.7;
    transition: opacity var(--motion-fast) var(--ease-out);

    &:hover {
      opacity: 1;
    }
  }
}

.meta-panel__tag-input {
  flex: 1;
  min-width: 100px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink-strong);
  font-size: 0.82rem;
  padding: 2px 0;

  &::placeholder {
    color: var(--ink-muted);
  }
}

.meta-panel__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.meta-panel__preset {
  appearance: none;
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
  min-height: 36px;
  transition: color var(--motion-base) var(--ease-out), border-color var(--motion-base) var(--ease-out);

  &:hover {
    color: var(--brand-500);
    border-color: color-mix(in srgb, var(--brand-100) 80%, transparent);
  }
}

.editor-canvas {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: calc(100vh - 280px);
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.editor-canvas--read {
  padding: 4px 0 0;
}

.editor-canvas--source:focus-within {
  border-color: transparent;
  box-shadow: none;
}

.title-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: clamp(1.55rem, 2.55vw, 2.05rem);
  font-weight: 700;
  color: var(--ink-strong);
  line-height: 1.4;
  padding: 24px 0 20px;
  background: transparent;

  &::placeholder {
    color: var(--ink-muted);
    font-weight: 600;
  }
}

.tiptap-editor {
  flex: 1;
  min-height: 100%;
  padding-bottom: 0;
}

:deep(.tiptap) {
  outline: none !important;
  min-height: calc(100vh - 320px);
  font-size: 16px;
  line-height: 1.6;
  color: var(--ink-main);

  p {
    margin: 0.1em 0;
  }

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
    margin-top: 0.8em;
    margin-bottom: 0.15em;
  }

  h2 {
    font-size: 1.5em;
    border-bottom: none;
    padding-bottom: 0;
  }

  h3 { font-size: 1.25em; }

  ul, ol {
    padding-left: 1.5rem;
    margin: 0.35em 0;
  }

  blockquote {
    border-left: 3px solid var(--brand-500);
    padding-left: 1rem;
    color: var(--ink-main);
    margin: 0.4em 0;
    background: var(--article-quote-bg);
    padding: 0.5rem 1rem;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  pre {
    background: var(--article-code-block-bg);
    color: #e6edf3;
    font-family: inherit;
    padding: 1rem;
    border-radius: 8px;
    margin: 0.5em 0;
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
    margin: 0.8rem 0;
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

:deep(.live-preview-syntax) {
  display: inline;
  color: var(--ink-muted);
  opacity: 0.52;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.82em;
  font-weight: 400;
  line-height: inherit;
  letter-spacing: 0;
  user-select: none;
  pointer-events: none;
  vertical-align: baseline;
  animation: lpSyntaxIn 0.15s ease-out;
}

:deep(.live-preview-syntax[data-side='after']) {
  margin-left: 0;
}

@keyframes lpSyntaxIn {
  from {
    opacity: 0;
    transform: translateY(-1px);
  }
  to {
    opacity: 0.52;
    transform: translateY(0);
  }
}

.source-editor {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 320px);
  border: none;
  outline: none;
  resize: none;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.75;
  color: var(--ink-main);
  background: transparent;
  border-radius: 0;
  padding: 0;
  tab-size: 2;
  white-space: pre-wrap;
  word-wrap: break-word;

  &::placeholder {
    color: var(--ink-muted);
  }

  &:focus {
    background: transparent;
    box-shadow: none;
  }
}

.read-preview {
  flex: 1;
  margin-top: 0;
  padding-bottom: 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--ink-main);

  &--empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 370px);
    gap: 16px;
    color: var(--ink-muted);
    font-size: 0.92rem;
  }

  :deep(p) {
    margin: 0.1em 0;
  }

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    line-height: 1.3;
    color: var(--ink-strong);
    margin-top: 0.8em;
    margin-bottom: 0.15em;
  }

  :deep(h2) {
    font-size: 1.5em;
    border-bottom: none;
    padding-bottom: 0;
  }

  :deep(h3) { font-size: 1.25em; }

  :deep(ul), :deep(ol) {
    padding-left: 1.5rem;
    margin: 0.35em 0;
  }

  :deep(blockquote) {
    border-left: 3px solid var(--brand-500);
    color: var(--ink-main);
    margin: 0.4em 0;
    background: var(--article-quote-bg);
    padding: 0.5rem 1rem;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  :deep(pre) {
    background: var(--article-code-block-bg);
    color: #e6edf3;
    padding: 1rem;
    border-radius: 8px;
    margin: 0.5em 0;
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
    margin: 0.8rem 0;
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

  .editor-main {
    padding-left: 14px;
    padding-right: 14px;
    padding-bottom: 28px;
  }

  .editor-toolbar-wrap {
    top: 52px;
    margin-bottom: 6px;
  }

  .editor-main-card {
    border-radius: 20px;
  }

  .editor-main-card__header {
    padding: 0 16px;
  }

  .editor-main-card__canvas {
    padding: 0 16px 18px;
  }

  .meta-panel {
    flex-direction: column;
    gap: 14px;
    padding: 0 16px 14px;
  }

  .editor-canvas {
    min-height: calc(100vh - 320px);
    padding: 0;
    border-radius: 0;
  }

  .editor-canvas--read {
    padding: 2px 0 0;
  }

  .title-input {
    padding-top: 16px;
    padding-bottom: 12px;
  }

  :deep(.tiptap),
  .source-editor,
  .read-preview--empty {
    min-height: calc(100vh - 370px);
  }
}
</style>
