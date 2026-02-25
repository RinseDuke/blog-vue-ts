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
        </div>
      </header>

      <div :id="EDITOR_ID" class="vditor-host"></div>
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
  updatedAt: string
}

const EDITOR_ID = 'write-vditor-editor'
const DRAFT_KEY = 'blog_write_draft_v1'
const AUTOSAVE_DELAY = 500

const title = ref('')
const markdown = ref('')
const lastSavedAt = ref<string | null>(null)
const isDirty = ref(false)

let editor: Vditor | null = null
let autosaveTimer: ReturnType<typeof setTimeout> | null = null

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

onMounted(() => {
  const restoredDraft = readDraft()
  title.value = restoredDraft?.title ?? ''
  markdown.value = restoredDraft?.markdown ?? ''
  lastSavedAt.value = restoredDraft?.updatedAt ?? null

  editor = new Vditor(EDITOR_ID, {
    mode: 'ir',
    height: '72vh',
    lang: 'zh_CN',
    placeholder: '开始写作，支持 Markdown。Ctrl/Cmd + Enter 可快速发布',
    value: markdown.value,
    cache: { enable: false },
    counter: { enable: true, type: 'text' },
    outline: { enable: true, position: 'right' },
    preview: {
      mode: 'editor',
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
      'both',
      'outline',
      'fullscreen',
      'edit-mode',
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
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

function clearDraft() {
  const confirmed = window.confirm('确定要清空当前草稿吗？此操作不可撤销。')
  if (!confirmed) return

  title.value = ''
  markdown.value = ''
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

  persistDraft()
  console.log('Publish payload:', {
    title: finalTitle,
    markdown: content,
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

.vditor-host {
  min-height: 72vh;
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
