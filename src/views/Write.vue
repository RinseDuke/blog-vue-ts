<template>
  <section class="write-page">
    <div class="editor-shell">
      <header class="editor-head">
        <input
          v-model="title"
          class="title-input"
          type="text"
          maxlength="120"
          placeholder="无标题文档"
          @input="handleTitleInput"
        />
        <div class="meta-row">
          <span>{{ wordCount }} 字</span>
          <span>{{ lineCount }} 行</span>
          <span>{{ saveLabel }}</span>
          <span>当前：{{ currentModeLabel }}</span>
        </div>

        <div class="tag-section">
          <div class="tag-pills">
            <span
              v-for="tag in selectedTags"
              :key="tag"
              class="tag-pill"
            >
              #{{ tag }}
              <button type="button" class="tag-pill__remove" @click="removeTag(tag)">✕</button>
            </span>

            <span v-if="selectedTags.length < MAX_TAGS" class="tag-input-wrap">
              <input
                v-model="tagInput"
                class="tag-input"
                type="text"
                placeholder="输入标签后按 Enter"
                maxlength="20"
                @keydown.enter.prevent="addCustomTag"
              />
            </span>
          </div>

          <div v-if="suggestedTags.length && selectedTags.length < MAX_TAGS" class="tag-suggestions">
            <button
              v-for="tag in suggestedTags"
              :key="tag"
              type="button"
              class="tag-suggest-btn"
              @click="addTag(tag)"
            >
              + {{ tag }}
            </button>
          </div>
        </div>
      </header>

      <div :id="EDITOR_ID" :class="['vditor-host', { 'vditor-host--read': viewMode === 'read' }]"></div>
    </div>

    <footer class="action-bar">
      <button type="button" class="btn btn-ghost" @click="clearDraft">清空草稿</button>
      <button type="button" class="btn btn-ghost" @click="downloadMarkdown">导出 Markdown</button>
      <button type="button" class="btn btn-primary" @click="handlePublish">发布</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

interface DraftPayload {
  title: string
  markdown: string
  tags: string[]
  updatedAt: string
}

type ViewMode = 'read' | 'source' | 'live'

const EDITOR_ID = 'write-vditor-editor'
const DRAFT_KEY = 'blog_write_draft_v1'
const VIEW_MODE_KEY = 'blog_write_view_mode_v1'
const AUTOSAVE_DELAY = 500

const PRESET_TAGS = ['开发经验', 'Vue Router', 'Pinia', 'TypeScript', '性能优化', 'CSS', 'JavaScript', '前端工程化']
const MAX_TAGS = 5

const title = ref('')
const markdown = ref('')
const selectedTags = ref<string[]>([])
const tagInput = ref('')
const lastSavedAt = ref<string | null>(null)
const isDirty = ref(false)
const viewMode = ref<ViewMode>(readViewMode())

let editor: Vditor | null = null
let autosaveTimer: ReturnType<typeof setTimeout> | null = null

const suggestedTags = computed(() =>
  PRESET_TAGS.filter((t) => !selectedTags.value.includes(t))
)

function addTag(tag: string) {
  const normalized = tag.trim()
  if (!normalized) return
  if (selectedTags.value.length >= MAX_TAGS) return
  if (selectedTags.value.includes(normalized)) return
  selectedTags.value.push(normalized)
  markDirtyAndAutosave()
}

function removeTag(tag: string) {
  selectedTags.value = selectedTags.value.filter((t) => t !== tag)
  markDirtyAndAutosave()
}

function addCustomTag() {
  const raw = tagInput.value.trim()
  if (raw) addTag(raw)
  tagInput.value = ''
}

const wordCount = computed(() => {
  const chineseChars = (markdown.value.match(/[\u4e00-\u9fff]/g) ?? []).length
  const latinWords = (markdown.value.replace(/[\u4e00-\u9fff]/g, '').match(/[A-Za-z0-9_]+/g) ?? []).length
  return chineseChars + latinWords
})

const lineCount = computed(() => {
  if (!markdown.value) return 0
  return markdown.value.split(/\r?\n/).length
})

const saveLabel = computed(() => {
  if (isDirty.value) return '未保存'
  if (!lastSavedAt.value) return '未保存'
  const dt = new Date(lastSavedAt.value)
  return `已保存 ${dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
})

const currentModeLabel = computed(() => {
  if (viewMode.value === 'read') return '阅读视图'
  if (viewMode.value === 'source') return '源码模式'
  return '实时阅览'
})

onMounted(() => {
  const restoredDraft = readDraft()
  title.value = restoredDraft?.title ?? ''
  markdown.value = restoredDraft?.markdown ?? ''
  selectedTags.value = restoredDraft?.tags ?? []
  lastSavedAt.value = restoredDraft?.updatedAt ?? null

  mountEditor(markdown.value)

  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer)
    autosaveTimer = null
  }
  window.removeEventListener('beforeunload', handleBeforeUnload)
  editor?.destroy()
  editor = null
})

function handleTitleInput() {
  markDirtyAndAutosave()
}

function markDirtyAndAutosave() {
  isDirty.value = true
  queueAutosave()
}

function queueAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    persistDraft()
  }, AUTOSAVE_DELAY)
}

function persistDraft() {
  const payload: DraftPayload = {
    title: title.value.trim(),
    markdown: editor?.getValue() ?? markdown.value,
    tags: selectedTags.value,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
  lastSavedAt.value = payload.updatedAt
  isDirty.value = false
}

function readDraft(): DraftPayload | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DraftPayload>
    if (typeof parsed.markdown !== 'string') return null
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      markdown: parsed.markdown,
      tags: Array.isArray((parsed as { tags?: unknown }).tags) ? (parsed as { tags: string[] }).tags : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

function readViewMode(): ViewMode {
  const raw = localStorage.getItem(VIEW_MODE_KEY)
  if (raw === 'read' || raw === 'source' || raw === 'live') return raw
  if (raw === 'mixed') return 'read'
  return 'live'
}

function getEditorDisplayConfig(mode: ViewMode) {
  if (mode === 'read') {
    return { editorMode: 'sv' as const, previewMode: 'both' as const }
  }
  if (mode === 'source') {
    return { editorMode: 'sv' as const, previewMode: 'editor' as const }
  }
  return { editorMode: 'ir' as const, previewMode: 'editor' as const }
}

function getViewSwitchIcon() {
  return `<span class="write-view-trigger" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M3 6.5a2.5 2.5 0 0 1 2.5-2.5h6.5v16H5.5A2.5 2.5 0 0 1 3 17.5v-11z"></path>
      <path d="M21 6.5a2.5 2.5 0 0 0-2.5-2.5H12v16h6.5a2.5 2.5 0 0 0 2.5-2.5v-11z"></path>
    </svg>
  </span>`
}

function getViewMenuOptionIcon(targetMode: ViewMode, label: string, symbol: string) {
  const checked = viewMode.value === targetMode
  return `<span class="write-view-option">
    <span class="write-view-option__icon">${symbol}</span>
    <span class="write-view-option__text">${label}</span>
    <span class="write-view-option__check">${checked ? "✓" : ""}</span>
  </span>`
}

function createViewModeMenuItem() {
  return {
    name: 'view-mode-switch',
    icon: getViewSwitchIcon(),
    tip: '视图模式',
    toolbar: [
      {
        name: 'view-mode-read',
        icon: getViewMenuOptionIcon('read', '阅读视图', '📖'),
        tip: '阅读视图',
        click: () => switchViewMode('read'),
      },
      {
        name: 'view-mode-source',
        icon: getViewMenuOptionIcon('source', '源码模式', '&lt;/&gt;'),
        tip: '源码模式',
        click: () => switchViewMode('source'),
      },
      {
        name: 'view-mode-live',
        icon: getViewMenuOptionIcon('live', '实时阅览', '✎'),
        tip: '实时阅览',
        click: () => switchViewMode('live'),
      },
    ],
  }
}

function mountEditor(initialValue: string) {
  editor?.destroy()
  editor = null

  const { editorMode, previewMode } = getEditorDisplayConfig(viewMode.value)
  editor = new Vditor(EDITOR_ID, {
    mode: editorMode,
    height: '72vh',
    lang: 'zh_CN',
    placeholder: '开始写作，支持 Markdown。Ctrl/Cmd + Enter 可快速发布',
    value: initialValue,
    cache: { enable: false },
    counter: { enable: true, type: 'text' },
    outline: { enable: true, position: 'right' },
    preview: {
      mode: previewMode,
      markdown: {
        toc: true,
        autoSpace: true,
        sanitize: true,
      },
    },
    toolbar: [
      'emoji',
      'headings',
      'bold',
      'italic',
      'strike',
      '|',
      'line',
      'quote',
      'list',
      'ordered-list',
      'check',
      '|',
      'code',
      'inline-code',
      'table',
      'link',
      '|',
      createViewModeMenuItem(),
      'outline',
      'fullscreen',
      'export',
      '|',
      'undo',
      'redo',
    ],
    input(value: string) {
      markdown.value = value
      markDirtyAndAutosave()
    },
    ctrlEnter() {
      handlePublish()
    },
    after() {
      if (!editor) return
      markdown.value = editor.getValue()
    },
  })
}

function switchViewMode(nextMode: ViewMode) {
  if (nextMode === viewMode.value) return
  const currentValue = editor?.getValue() ?? markdown.value
  viewMode.value = nextMode
  localStorage.setItem(VIEW_MODE_KEY, nextMode)
  mountEditor(currentValue)
}

function clearDraft() {
  const confirmed = window.confirm('确定要清空当前草稿吗？此操作不可撤销。')
  if (!confirmed) return

  title.value = ''
  markdown.value = ''
  selectedTags.value = []
  tagInput.value = ''
  lastSavedAt.value = null
  isDirty.value = false
  localStorage.removeItem(DRAFT_KEY)
  editor?.setValue('', true)
}

function downloadMarkdown() {
  const content = editor?.getValue() ?? markdown.value
  if (!content.trim()) {
    editor?.tip('当前没有可导出的内容', 2000)
    return
  }

  const filenameBase = (title.value.trim() || 'untitled').replace(/[\\/:*?"<>|]/g, '-')
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filenameBase}.md`
  a.click()
  URL.revokeObjectURL(url)
}

function handlePublish() {
  const content = editor?.getValue() ?? markdown.value
  const finalTitle = title.value.trim()

  if (!finalTitle) {
    editor?.tip('请先填写标题', 2000)
    return
  }
  if (!content.trim()) {
    editor?.tip('正文不能为空', 2000)
    return
  }
  if (selectedTags.value.length === 0) {
    editor?.tip('请至少添加一个标签', 2000)
    return
  }

  persistDraft()
  console.log('Publish payload:', {
    title: finalTitle,
    markdown: content,
    tags: selectedTags.value,
    updatedAt: new Date().toISOString(),
  })
  editor?.tip('已输出到控制台，下一步可接入发布 API', 2000)
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}
</script>

<style scoped lang="less">
.write-page {
  min-height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background:
    radial-gradient(circle at 18% 10%, rgba(59, 130, 246, 0.08), transparent 45%),
    radial-gradient(circle at 84% 4%, rgba(14, 165, 233, 0.07), transparent 40%),
    #f3f7ff;
}

.editor-shell {
  width: min(1200px, 100%);
  margin: 0 auto;
  background: #fff;
  border-radius: 18px;
  border: 1px solid #dbe5f4;
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.1);
  overflow: hidden;
}

.editor-head {
  padding: 18px 20px 14px;
  border-bottom: 1px solid #e9eef8;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: clamp(1.7rem, 2.8vw, 2.3rem);
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.title-input::placeholder {
  color: #9aa6bb;
  font-weight: 600;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #64748b;
  font-size: 0.88rem;
}

.tag-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tag-pills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--brand-100);
  color: var(--brand-500);
  font-weight: 600;
  font-size: 0.82rem;
  white-space: nowrap;
  animation: pill-in 0.15s ease;
}

@keyframes pill-in {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}

.tag-pill__remove {
  background: none;
  border: none;
  color: var(--brand-500);
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0 2px;
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.tag-pill__remove:hover {
  opacity: 1;
}

.tag-input-wrap {
  display: inline-flex;
}

.tag-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.85rem;
  color: var(--ink-main);
  width: 140px;
  padding: 0.2rem 0;
}

.tag-input::placeholder {
  color: #9aa6bb;
}

.tag-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.tag-suggest-btn {
  background: none;
  border: 1px dashed var(--line-strong);
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.8rem;
  color: var(--ink-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-suggest-btn:hover {
  border-color: var(--brand-400);
  color: var(--brand-500);
  background: rgba(0, 113, 227, 0.04);
}

.vditor-host {
  min-height: 72vh;
}

.vditor-host--read :deep(.vditor-sv) {
  display: none !important;
}

.vditor-host--read :deep(.vditor-preview) {
  margin-left: 0;
  border-left: none;
}

.action-bar {
  width: min(1200px, 100%);
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0.5rem 0.95rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
}

.btn-ghost {
  background: #fff;
  border-color: #d4deee;
  color: #334155;
}

.btn-ghost:hover {
  background: #f8fbff;
  border-color: #b8c9e6;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}

:deep(.vditor-toolbar) {
  border-bottom: 1px solid #e9eef8 !important;
}

:deep(.vditor-reset) {
  font-size: 16px;
}

:deep(.write-view-trigger) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.write-view-option) {
  display: inline-flex;
  align-items: center;
  width: 170px;
  justify-content: space-between;
  gap: 10px;
  color: #0f172a;
  font-size: 13px;
}

:deep(.write-view-option__icon) {
  width: 18px;
  text-align: center;
  color: #334155;
  flex-shrink: 0;
}

:deep(.write-view-option__text) {
  flex: 1;
  text-align: left;
}

:deep(.write-view-option__check) {
  width: 16px;
  text-align: right;
  color: #2563eb;
  font-weight: 700;
}

@media (max-width: 900px) {
  .write-page {
    padding: 14px;
  }

  .action-bar {
    justify-content: stretch;
  }

  .btn {
    flex: 1;
    text-align: center;
  }
}
</style>
