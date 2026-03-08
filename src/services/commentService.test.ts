import { createComment, setCommentLike } from '@/services/commentService'
import { mockComments } from '@/mocks/comments'

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

describe('commentService auth guard', () => {
  const originalComments = structuredClone(mockComments)

  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
    mockComments.splice(0, mockComments.length, ...structuredClone(originalComments))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects anonymous comment creation', async () => {
    await expect(
      createComment({
        postId: '1',
        content: '匿名评论不应该被允许',
      })
    ).rejects.toThrow('请先登录后再发表评论')
  })

  it('creates a comment for the logged in user', async () => {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        email: 'tester@example.com',
        rememberMe: true,
        loggedAt: '2026-03-07T10:00:00.000Z',
        token: 'mock-token-123',
      })
    )

    const comment = await createComment({
      postId: '1',
      content: '这是一个已登录用户的评论',
    })

    expect(comment.author.id).toBe('user-tester@example.com')
    expect(comment.author.name).toBe('tester')
    expect(mockComments[mockComments.length - 1]?.id).toBe(comment.id)
  })

  it('rejects anonymous comment likes', async () => {
    await expect(setCommentLike('c1', true)).rejects.toThrow('请先登录后再点赞评论')
  })

  it('supports toggling comment likes for the logged in user', async () => {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        email: 'tester@example.com',
        rememberMe: true,
        loggedAt: '2026-03-07T10:00:00.000Z',
        token: 'mock-token-123',
      })
    )

    const originalLikes = mockComments.find((comment) => comment.id === 'c1')?.likes ?? 0

    await expect(setCommentLike('c1', true)).resolves.toBe(originalLikes + 1)
    await expect(setCommentLike('c1', false)).resolves.toBe(originalLikes)
  })
})
