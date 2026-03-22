/**
 * 草稿 Composable
 * 管理写作页草稿的自动保存（500ms 防抖）、读取、清除，按用户 email 隔离存储。
 */

import { ref } from 'vue'
import { readStoredAuthSession } from '@/features/auth/stores/useAuthStore'

/** 草稿数据结构 */
export interface DraftPayload {
  title: string
  markdown: string          // Markdown 源码
  tags: string[]             // 已选标签
  coverDataUrl: string | null  // 封面预览 URL
  status?: 'draft' | 'published'
  visibility?: 'public' | 'private'
  updatedAt: string          // 最后保存时间
}

const DRAFT_KEY = 'blog_write_draft_v1'
const AUTOSAVE_DELAY = 500  // 自动保存延迟（毫秒）

/** 根据当前登录用户生成独立的存储键 */
function getDraftStorageKey() {
  const session = readStoredAuthSession()
  return session ? `${DRAFT_KEY}:${session.email}` : DRAFT_KEY
}

/** 安全解析草稿 JSON，容错处理 */
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
  const lastSavedAt = ref<string | null>(null)  // 最后保存时间
  const isDirty = ref(false)                     // 是否有未保存的修改

  let autosaveTimer: ReturnType<typeof setTimeout> | null = null

  /** 读取草稿（含 legacy 数据迁移） */
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

  /** 保存草稿到 localStorage */
  function persistDraft(payload: DraftPayload) {
    const storageKey = getDraftStorageKey()
    localStorage.setItem(storageKey, JSON.stringify(payload))
    if (storageKey !== DRAFT_KEY) {
      localStorage.removeItem(DRAFT_KEY)
    }
    lastSavedAt.value = payload.updatedAt
    isDirty.value = false
  }

  /** 清除已保存的草稿 */
  function clearPersistedDraft() {
    const storageKey = getDraftStorageKey()
    localStorage.removeItem(storageKey)
    if (storageKey !== DRAFT_KEY) {
      localStorage.removeItem(DRAFT_KEY)
    }
    lastSavedAt.value = null
    isDirty.value = false
  }

  /** 标记为有未保存的修改 */
  function markDirty() {
    isDirty.value = true
  }

  /** 队列自动保存（500ms 防抖） */
  function queueAutosave(saveFn: () => void) {
    if (autosaveTimer) clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(saveFn, AUTOSAVE_DELAY)
  }

  /** 取消待执行的自动保存 */
  function cancelPendingAutosave() {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer)
      autosaveTimer = null
    }
  }

  /** 立即执行待保存内容，避免路由切换时丢失最后一次输入 */
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
