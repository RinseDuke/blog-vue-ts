import { createPinia, setActivePinia } from 'pinia'
import { mockComments } from '@/mocks/comments'
import { useCommentStore } from '@/features/comment/stores/useCommentStore'
import * as commentService from '@/services/commentService'

const AUTH_KEY = 'blog_auth_session_v1'

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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
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
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps loading scoped to each post during overlapping requests', async () => {
    const firstRequest = deferred<typeof mockComments>()
    const secondRequest = deferred<typeof mockComments>()
    vi.spyOn(commentService, 'fetchCommentsByPostId').mockImplementation((postId) => {
      return postId === 'first' ? firstRequest.promise : secondRequest.promise
    })

    const store = useCommentStore()
    const firstLoad = store.loadComments('first')
    const secondLoad = store.loadComments('second')

    expect(store.isLoading('first')).toBe(true)
    expect(store.isLoading('second')).toBe(true)

    firstRequest.resolve([])
    await firstLoad

    expect(store.isLoading('first')).toBe(false)
    expect(store.isLoading('second')).toBe(true)

    secondRequest.resolve([])
    await secondLoad
    expect(store.isLoading('second')).toBe(false)
  })

  it('keeps a late error scoped to the post that failed', async () => {
    const firstRequest = deferred<typeof mockComments>()
    const secondRequest = deferred<typeof mockComments>()
    vi.spyOn(commentService, 'fetchCommentsByPostId').mockImplementation((postId) => {
      return postId === 'first' ? firstRequest.promise : secondRequest.promise
    })

    const store = useCommentStore()
    const firstLoad = store.loadComments('first')
    const secondLoad = store.loadComments('second')

    secondRequest.resolve([])
    await secondLoad
    firstRequest.reject(new Error('first failed'))
    await firstLoad

    expect(store.getError('first')).toBe('first failed')
    expect(store.getError('second')).toBeNull()
  })

  it('exposes a failed comment submission to the matching post only', async () => {
    vi.spyOn(commentService, 'createComment').mockRejectedValue(new Error('submit failed'))
    const store = useCommentStore()

    await expect(
      store.addComment({ postId: 'visible', content: 'hello' })
    ).rejects.toThrow('submit failed')

    expect(store.getError('visible')).toBe('submit failed')
    expect(store.getError('other')).toBeNull()
  })

  it('exposes a failed like action to the matching post only', async () => {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        email: 'tester@example.com',
        rememberMe: true,
        loggedAt: '2026-03-07T10:00:00.000Z',
        token: 'mock-token-123',
      })
    )
    vi.spyOn(commentService, 'setCommentLike').mockRejectedValue(new Error('like failed'))

    const store = useCommentStore()
    await store.loadComments('1')
    await expect(store.likeComment('1', 'c1')).rejects.toThrow('like failed')

    expect(store.getError('1')).toBe('like failed')
    expect(store.getError('other')).toBeNull()
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
      AUTH_KEY,
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
