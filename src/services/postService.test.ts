import { mockPosts } from '@/mocks/posts'
import { createPost, fetchPostBySlug, fetchPosts, setPostLike } from '@/services/postService'

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

describe('postService auth guard', () => {
  const originalPosts = structuredClone(mockPosts)

  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
    mockPosts.splice(0, mockPosts.length, ...structuredClone(originalPosts))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects anonymous article likes', async () => {
    await expect(setPostLike('1', true)).rejects.toThrow('请先登录后再点赞文章')
  })

  it('supports toggling article likes for the logged in user', async () => {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        email: 'tester@example.com',
        rememberMe: true,
        loggedAt: '2026-03-07T10:00:00.000Z',
        token: 'mock-token-123',
      })
    )

    const originalLikes = mockPosts.find((post) => post.id === '1')?.likes ?? 0

    await expect(setPostLike('1', true)).resolves.toBe(originalLikes + 1)
    await expect(setPostLike('1', false)).resolves.toBe(originalLikes)
  })

  it('rejects anonymous post creation', async () => {
    await expect(
      createPost({
        title: '匿名文章',
        markdown: '# 匿名文章',
        html: '<h1>匿名文章</h1>',
        tags: ['Vue'],
      })
    ).rejects.toThrow('请先登录后再发布文章')
  })

  it('creates a published post that is visible in post queries', async () => {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        email: 'writer@example.com',
        rememberMe: true,
        loggedAt: '2026-03-07T10:00:00.000Z',
        token: 'mock-token-456',
      })
    )

    const createdPost = await createPost({
      title: '新的发布文章',
      markdown: '# 新的发布文章\n\n这是一篇用于测试发布流程的内容。',
      html: '<h1>新的发布文章</h1><p>这是一篇用于测试发布流程的内容。</p>',
      tags: ['Vue', '工程化'],
      coverImage: 'https://example.com/cover.png',
    })

    expect(createdPost.author.id).toBe('user-writer@example.com')
    expect(createdPost.slug).toContain('新的发布文章')
    await expect(fetchPostBySlug(createdPost.slug)).resolves.toEqual(expect.objectContaining({ id: createdPost.id }))

    const posts = await fetchPosts()
    expect(posts[0]?.id).toBe(createdPost.id)
    expect(posts.some((post) => post.id === createdPost.id)).toBe(true)
  })
})
