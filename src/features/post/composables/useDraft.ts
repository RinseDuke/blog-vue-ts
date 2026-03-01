import { ref } from 'vue'

export interface DraftPayload {
  title: string
  markdown: string
  tags: string[]
  coverDataUrl: string | null
  updatedAt: string
}

const DRAFT_KEY = 'blog_write_draft_v1'
const AUTOSAVE_DELAY = 500

export function useDraft() {
  const lastSavedAt = ref<string | null>(null)
  const isDirty = ref(false)

  let autosaveTimer: ReturnType<typeof setTimeout> | null = null

  function readDraft(): DraftPayload | null {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<DraftPayload>
      if (typeof parsed.markdown !== 'string') return null
      return {
        title: typeof parsed.title === 'string' ? parsed.title : '',
        markdown: parsed.markdown,
        tags: Array.isArray(parsed.tags)
          ? (parsed.tags as unknown[]).filter((t): t is string => typeof t === 'string')
          : [],
        coverDataUrl: typeof parsed.coverDataUrl === 'string' ? parsed.coverDataUrl : null,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      }
    } catch {
      return null
    }
  }

  function persistDraft(payload: DraftPayload) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
    lastSavedAt.value = payload.updatedAt
    isDirty.value = false
  }

  function clearPersistedDraft() {
    localStorage.removeItem(DRAFT_KEY)
    lastSavedAt.value = null
    isDirty.value = false
  }

  function markDirty() {
    isDirty.value = true
  }

  function queueAutosave(saveFn: () => void) {
    if (autosaveTimer) clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(saveFn, AUTOSAVE_DELAY)
  }

  function cancelPendingAutosave() {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer)
      autosaveTimer = null
    }
  }

  return {
    lastSavedAt,
    isDirty,
    readDraft,
    persistDraft,
    clearPersistedDraft,
    markDirty,
    queueAutosave,
    cancelPendingAutosave,
  }
}
