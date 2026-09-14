import { createPinia, setActivePinia } from 'pinia'
import { mockComments } from '@/mocks/comments'
import { useCommentStore } from '@/features/comment/stores/useCommentStore'

import { AUTH_SESSION_KEY } from '@/services/authSession'

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

describe('useCommentStore like guard', () => {
  const originalComments = structuredClone(mockComments)

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
    mockComments.splice(0, mockComments.length, ...structuredClone(originalComments))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('blocks anonymous likes before optimistic state changes', async () => {
    const store = useCommentStore()
    await store.loadComments('1')

    const originalLikes = store.getComments('1').find((comment) => comment.id === 'c1')?.likes

    await expect(store.likeComment('1', 'c1')).rejects.toThrow('请先登录后再点赞评论')

    expect(store.getComments('1').find((comment) => comment.id === 'c1')?.likes).toBe(originalLikes)
    expect(store.isCommentLiked('c1')).toBe(false)
  })

  it('keeps the local like state in sync when toggling', async () => {
    localStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({
        email: 'tester@example.com',
        rememberMe: true,
        loggedAt: '2026-03-07T10:00:00.000Z',
        token: 'mock-token-123',
      })
    )

    const store = useCommentStore()
    await store.loadComments('1')

    const originalLikes = store.getComments('1').find((comment) => comment.id === 'c1')?.likes ?? 0

    await store.likeComment('1', 'c1')
    expect(store.isCommentLiked('c1')).toBe(true)
    expect(store.getComments('1').find((comment) => comment.id === 'c1')?.likes).toBe(originalLikes + 1)

    await store.likeComment('1', 'c1')
    expect(store.isCommentLiked('c1')).toBe(false)
    expect(store.getComments('1').find((comment) => comment.id === 'c1')?.likes).toBe(originalLikes)
  })
})
