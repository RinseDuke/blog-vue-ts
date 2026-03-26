import { mockPosts } from '@/mocks/posts'
import {
  createPost,
  deletePost,
  fetchPostById,
  fetchPostBySlug,
  fetchPosts,
  fetchUserPosts,
  setPostLike,
} from '@/services/postService'

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

function setSession(email: string, nickname = 'writer', userId = `user-${email}`) {
  const username = email.split('@')[0]

  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      email,
      rememberMe: true,
      loggedAt: '2026-03-07T10:00:00.000Z',
      token: `mock-token-${email}`,
      user: {
        id: userId,
        username,
        nickname,
        email,
        visibility: 'public',
      },
    })
  )
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
    setSession('tester@example.com', 'Tester')

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
      })
    ).rejects.toThrow('请先登录后再发布文章')
  })

  it('rejects anonymous post deletion', async () => {
    await expect(deletePost('user-post-1')).rejects.toThrow('请先登录后再管理文章')
  })

  it('creates a published post that is visible in post queries', async () => {
    setSession('writer@example.com', 'Writer')

    const createdPost = await createPost({
      title: '新的发布文章',
      markdown: '# 新的发布文章\n\n这是一篇用于测试发布流程的内容。',
      html: '<h1>新的发布文章</h1><p>这是一篇用于测试发布流程的内容。</p>',
      status: 'published',
      visibility: 'public',
    })

    expect(createdPost.author.id).toBe('user-writer@example.com')
    expect(createdPost.status).toBe('published')
    await expect(fetchPostById(createdPost.id)).resolves.toEqual(expect.objectContaining({ id: createdPost.id }))
    await expect(fetchPostBySlug(createdPost.slug)).resolves.toEqual(expect.objectContaining({ id: createdPost.id }))

    const posts = await fetchPosts()
    expect(posts[0]?.id).toBe(createdPost.id)
    expect(posts.some((post) => post.id === createdPost.id)).toBe(true)

    const managedPosts = await fetchUserPosts(createdPost.author.id)
    expect(managedPosts.some((post) => post.id === createdPost.id)).toBe(true)
  })

  it('deletes a published post owned by the logged in user', async () => {
    setSession('writer@example.com', 'Writer')

    const createdPost = await createPost({
      title: '待删除文章',
      markdown: '# 待删除文章\n\n这是一篇会被删除的内容。',
      html: '<h1>待删除文章</h1><p>这是一篇会被删除的内容。</p>',
    })

    await expect(deletePost(createdPost.id)).resolves.toBeUndefined()
    await expect(fetchPostById(createdPost.id)).resolves.toBeUndefined()

    const posts = await fetchPosts()
    expect(posts.some((post) => post.id === createdPost.id)).toBe(false)
  })

  it('keeps draft/private posts out of public queries while allowing the author to manage them', async () => {
    setSession('writer@example.com', 'Writer', 'user-writer-42')

    const createdPost = await createPost({
      title: '仅作者可见的草稿',
      markdown: '# 仅作者可见的草稿\n\n这是一篇私密草稿。',
      html: '<h1>仅作者可见的草稿</h1><p>这是一篇私密草稿。</p>',
      status: 'draft',
      visibility: 'private',
    })

    expect(createdPost.author.id).toBe('user-writer-42')

    const publicPosts = await fetchPosts()
    expect(publicPosts.some((post) => post.id === createdPost.id)).toBe(false)

    const managedPosts = await fetchUserPosts('user-writer-42')
    expect(managedPosts.some((post) => post.id === createdPost.id)).toBe(true)

    await expect(fetchPostById(createdPost.id)).resolves.toEqual(expect.objectContaining({ id: createdPost.id }))

    setSession('reader@example.com', 'Reader', 'user-reader-7')

    await expect(fetchPostById(createdPost.id)).resolves.toBeUndefined()
    await expect(fetchUserPosts('user-writer-42')).resolves.not.toContainEqual(
      expect.objectContaining({ id: createdPost.id })
    )
  })
})
