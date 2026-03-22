import { useDraft, type DraftPayload } from '@/features/post/composables/useDraft'

const AUTH_KEY = 'blog_auth_session_v1'
const DRAFT_KEY = 'blog_write_draft_v1'

interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

function createStorageMock(): StorageLike {
  const store = new Map<string, string>()

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

function setSession(email: string) {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      email,
      rememberMe: true,
      loggedAt: '2026-03-07T10:00:00.000Z',
      token: `mock-token-${email}`,
    })
  )
}

function createDraft(title: string): DraftPayload {
  return {
    title,
    markdown: `# ${title}`,
    tags: ['Vue'],
    coverDataUrl: null,
    status: 'published',
    visibility: 'public',
    updatedAt: '2026-03-07T10:00:00.000Z',
  }
}

describe('useDraft auth scope', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('isolates drafts by logged in email', () => {
    setSession('alice@example.com')
    const aliceDraft = useDraft()
    aliceDraft.persistDraft(createDraft('Alice Draft'))

    setSession('bob@example.com')
    const bobDraft = useDraft()
    expect(bobDraft.readDraft()).toBeNull()

    bobDraft.persistDraft(createDraft('Bob Draft'))

    setSession('alice@example.com')
    expect(useDraft().readDraft()).toEqual(createDraft('Alice Draft'))

    setSession('bob@example.com')
    expect(useDraft().readDraft()).toEqual(createDraft('Bob Draft'))
  })

  it('migrates the legacy draft key into the current user scope', () => {
    const legacyDraft = createDraft('Legacy Draft')
    localStorage.setItem(DRAFT_KEY, JSON.stringify(legacyDraft))

    setSession('alice@example.com')
    const draft = useDraft()

    expect(draft.readDraft()).toEqual(legacyDraft)
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
    expect(localStorage.getItem(`${DRAFT_KEY}:alice@example.com`)).not.toBeNull()
  })

  it('flushes a pending autosave immediately when requested', () => {
    vi.useFakeTimers()

    setSession('alice@example.com')
    const draft = useDraft()
    const saveFn = vi.fn(() => {
      draft.persistDraft(createDraft('Flushed Draft'))
    })

    draft.markDirty()
    draft.queueAutosave(saveFn)

    expect(saveFn).not.toHaveBeenCalled()
    expect(draft.flushPendingAutosave(saveFn)).toBe(true)
    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(draft.readDraft()).toEqual(createDraft('Flushed Draft'))
    expect(draft.isDirty.value).toBe(false)
  })
})
