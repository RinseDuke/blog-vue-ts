<template>
  <section class="write-page composer-shell">
    <header class="composer-heading">
      <div>
        <span>社区写作</span>
        <h1>发起主题</h1>
      </div>
      <p>分享一段完整经验，或提出一个值得继续讨论的问题。</p>
    </header>
    <div class="editor-shell">
      <div class="editor-main">
        <div v-if="viewMode !== 'read'" class="editor-toolbar-wrap">
          <EditorToolbar :state="toolbarState" @command="runEditorCommand" />
        </div>

        <section class="editor-main-card">
          <header class="editor-main-card__header">
            <input
              v-model="title"
              class="title-input"
              type="text"
              maxlength="100"
              placeholder="主题标题（最多 100 个字）"
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
                主题设置
                <span v-if="metaBadge && !showMeta" class="meta-toggle__badge">{{ metaBadge }}</span>
              </button>
            </div>
          </header>

          <div v-if="showMeta" class="meta-panel">
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
              <div v-show="viewMode !== 'read'" class="editor-canvas editor-canvas--live">
                <MarkdownLiveEditor
                  ref="liveEditorRef"
                  v-model="markdown"
                  :source-mode="viewMode === 'source'"
                  class="markdown-live-editor-host"
                  placeholder="请输入正文..."
                  @change="onDirtyAndAutosave"
                  @toolbar-state="toolbarState = $event"
                />
              </div>

            <template v-if="viewMode === 'read'">
              <div class="editor-canvas editor-canvas--read">
                <div v-if="markdown.trim()" class="read-preview">
                  <MarkdownPreview :source="markdown" />
                </div>
                <div v-else class="read-preview read-preview--empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <p>暂无内容，请先在编辑模式中撰写主题</p>
                </div>
              </div>
            </template>
          </div>
        </section>
      </div>


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
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useDraft } from '@/features/post/composables/useDraft'
import { useCoverUpload } from '@/features/post/composables/useCoverUpload'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { useTagManager } from '@/features/post/composables/useTagManager'
import { normalizeWriteMarkdown, renderWriteMarkdownToHtml } from '@/features/post/utils/writeMarkdown'
import type { MarkdownCommand } from '@/features/post/editor/markdownCommands'
import type { MarkdownToolbarState } from '@/features/post/editor/markdownEditorTypes'

import EditorToolbar from '@/components/post/EditorToolbar.vue'
import MarkdownLiveEditor from '@/components/post/MarkdownLiveEditor.vue'
import MarkdownPreview from '@/components/post/MarkdownPreview.vue'
import StatusBar from '@/components/post/StatusBar.vue'
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
  coverPreviewUrl, removeCover, restoreCoverFromUrl,
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
const showMeta = ref(false)

const toolbarState = ref<MarkdownToolbarState>({
  canUndo: false,
  canRedo: false,
  heading2: false,
  heading3: false,
  bold: false,
  italic: false,
  strike: false,
  bulletList: false,
  orderedList: false,
  blockquote: false,
  codeBlock: false,
  link: false,
  table: false,
})
const liveEditorRef = ref<InstanceType<typeof MarkdownLiveEditor> | null>(null)

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

function runEditorCommand(command: MarkdownCommand, payload?: string) {
  liveEditorRef.value?.runCommand(command, payload)
}

function setViewMode(mode: string) {
  viewMode.value = mode as ViewMode
  localStorage.setItem(VIEW_MODE_KEY, mode)
  if (mode !== 'read') void nextTick(() => liveEditorRef.value?.focus())
}

function handlePublishVisibilityChange(value: 'public' | 'private') {
  if (publishVisibility.value === value) return
  publishVisibility.value = value
  onDirtyAndAutosave()
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
  liveEditorRef.value?.resetHistory()
  publishError.value = ''
  title.value = ''
  markdown.value = ''
  publishVisibility.value = DEFAULT_PUBLISH_VISIBILITY
  clearTags()
  removeCover()
  cancelPendingAutosave()
  clearPersistedDraft()
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
    const html = renderWriteMarkdownToHtml(markdown.value)
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
.composer-heading {
  width: min(100%, var(--write-content-max-width, 980px));
  margin: 0 auto;
  padding: 1.4rem 24px 0.4rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.composer-heading span {
  color: var(--brand-500);
  font-size: 0.72rem;
  font-weight: 650;
}

.composer-heading h1 {
  margin: 0.2rem 0 0;
  color: var(--ink-strong);
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  font-weight: 720;
  line-height: 1.2;
}

.composer-heading p {
  max-width: 360px;
  margin: 0 0 0.2rem;
  color: var(--ink-muted);
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: right;
}

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
  border-radius: var(--radius-lg);
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
  border-radius: var(--radius-sm);
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
  letter-spacing: 0;
}

.meta-panel__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--surface-strong) 60%, transparent);
  min-height: 40px;
}

.meta-panel__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 10px;
  border-radius: var(--radius-sm);
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
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
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
  font-family: var(--font-display);
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

.editor-canvas--live {
  min-height: calc(100vh - 320px);
  font-family: var(--font-body);
  color: var(--ink-main);
}

.editor-canvas--live :deep(.markdown-live-editor),
.editor-canvas--live :deep(.markdown-live-editor-host) {
  min-height: inherit;
  font-family: var(--font-body);
}

.source-editor {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 320px);
  border: none;
  outline: none;
  resize: none;
  font-family: var(--font-mono);
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
  font-family: var(--font-body);

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
  .composer-shell {
    position: fixed;
    inset: 52px 0 0;
    z-index: 30;
    overflow-y: auto;
    background: var(--bg-canvas);
  }

  .composer-heading {
    padding: 0.85rem 14px 0.2rem;
  }

  .composer-heading p {
    display: none;
  }

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
    border-radius: var(--radius-lg);
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

  .editor-canvas--live,
  .source-editor,
  .read-preview--empty {
    min-height: calc(100vh - 370px);
  }
}
</style>
