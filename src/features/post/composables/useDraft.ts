import { ref } from 'vue'
import { readStoredAuthSession } from '@/features/auth/stores/useAuthStore'

export interface DraftPayload {
  title: string
  markdown: string
  tags: string[]
  coverDataUrl: string | null
  status?: 'draft' | 'published'
  visibility?: 'public' | 'private'
  updatedAt: string
}

const DRAFT_KEY = 'blog_write_draft_v1'
const AUTOSAVE_DELAY = 500

function getDraftStorageKey() {
  const session = readStoredAuthSession()
  return session ? `${DRAFT_KEY}:${session.email}` : DRAFT_KEY
}

function parseDraft(raw: string | null): DraftPayload | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<DraftPayload>
    if (typeof parsed.markdown !== 'string') return null

    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      markdown: parsed.markdown,
      tags: Array.isArray(parsed.tags)
        ? (parsed.tags as unknown[]).filter((t): t is string => typeof t === 'string')
        : [],
      coverDataUrl: typeof parsed.coverDataUrl === 'string' ? parsed.coverDataUrl : null,
      status: parsed.status === 'draft' ? 'draft' : 'published',
      visibility: parsed.visibility === 'private' ? 'private' : 'public',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function useDraft() {
  const lastSavedAt = ref<string | null>(null)
  const isDirty = ref(false)

  let autosaveTimer: ReturnType<typeof setTimeout> | null = null

  // 含 legacy 数据迁移
  function readDraft(): DraftPayload | null {
    const scopedKey = getDraftStorageKey()
    const scopedDraft = parseDraft(localStorage.getItem(scopedKey))
    if (scopedDraft) {
      return scopedDraft
    }

    if (scopedKey !== DRAFT_KEY) {
      const legacyDraft = parseDraft(localStorage.getItem(DRAFT_KEY))
      if (legacyDraft) {
        localStorage.setItem(scopedKey, JSON.stringify(legacyDraft))
        localStorage.removeItem(DRAFT_KEY)
        return legacyDraft
      }
    }

    return null
  }

  function persistDraft(payload: DraftPayload) {
    const storageKey = getDraftStorageKey()
    localStorage.setItem(storageKey, JSON.stringify(payload))
    if (storageKey !== DRAFT_KEY) {
      localStorage.removeItem(DRAFT_KEY)
    }
    lastSavedAt.value = payload.updatedAt
    isDirty.value = false
  }

  function clearPersistedDraft() {
    const storageKey = getDraftStorageKey()
    localStorage.removeItem(storageKey)
    if (storageKey !== DRAFT_KEY) {
      localStorage.removeItem(DRAFT_KEY)
    }
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

  // 路由切换前立即保存，避免丢失最后一次输入
  function flushPendingAutosave(saveFn: () => void) {
    if (!autosaveTimer) return false
    clearTimeout(autosaveTimer)
    autosaveTimer = null
    saveFn()
    return true
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
    flushPendingAutosave,
  }
}
