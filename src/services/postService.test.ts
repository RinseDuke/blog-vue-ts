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
const PUBLISHED_POSTS_KEY = 'blog_published_posts_v1'

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

function setSessionWithUser(email: string, username: string, nickname = username, userId = `user-${username}`) {
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

function getVisibleSeededPost() {
  const candidate = mockPosts.find((post) => post.status !== 'draft' && post.visibility !== 'private')
  if (!candidate) {
    throw new Error('mock posts are unavailable for this test')
  }
  return candidate
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

  it('uses the registered username for locally published post authors', async () => {
    setSessionWithUser('mailbox@example.com', 'creator_user', 'Display Name')

    const createdPost = await createPost({
      title: '用户名作者展示',
      markdown: '# 用户名作者展示\n\n作者名应该来自用户名。',
      html: '<h1>用户名作者展示</h1><p>作者名应该来自用户名。</p>',
      status: 'published',
      visibility: 'public',
    })

    expect(createdPost.author.id).toBe('user-creator_user')
    expect(createdPost.author.name).toBe('creator_user')
    expect(createdPost.author.username).toBe('creator_user')
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

  it('keeps only one post when a persisted mock post collides with a seeded post id', async () => {
    const seededPost = structuredClone(getVisibleSeededPost())

    localStorage.setItem(
      PUBLISHED_POSTS_KEY,
      JSON.stringify([
        {
          ...seededPost,
          title: 'Local Override Title',
          excerpt: 'Local Override Excerpt',
          content: '<p>Local override content</p>',
          publishedAt: seededPost.publishedAt,
        },
      ])
    )

    const posts = await fetchPosts()
    const collidedPosts = posts.filter((post) => post.id === seededPost.id)

    expect(collidedPosts).toHaveLength(1)
    expect(collidedPosts[0]).toEqual(
      expect.objectContaining({
        id: seededPost.id,
        title: 'Local Override Title',
        excerpt: 'Local Override Excerpt',
      })
    )

    await expect(fetchPostById(seededPost.id)).resolves.toEqual(
      expect.objectContaining({
        id: seededPost.id,
        title: 'Local Override Title',
      })
    )
  })

  it('keeps only one post when a persisted mock post collides with a seeded post slug', async () => {
    const seededPost = structuredClone(getVisibleSeededPost())
    const persistedPostId = `persisted-${seededPost.id}`

    localStorage.setItem(
      PUBLISHED_POSTS_KEY,
      JSON.stringify([
        {
          ...seededPost,
          id: persistedPostId,
          title: 'Slug Collision Local Title',
          excerpt: 'Slug Collision Local Excerpt',
          content: '<p>Slug collision local content</p>',
        },
      ])
    )

    const posts = await fetchPosts()
    const collidedPosts = posts.filter((post) => post.slug === seededPost.slug)

    expect(collidedPosts).toHaveLength(1)
    expect(collidedPosts[0]).toEqual(
      expect.objectContaining({
        id: persistedPostId,
        slug: seededPost.slug,
        title: 'Slug Collision Local Title',
        excerpt: 'Slug Collision Local Excerpt',
      })
    )

    await expect(fetchPostBySlug(seededPost.slug)).resolves.toEqual(
      expect.objectContaining({
        id: persistedPostId,
        slug: seededPost.slug,
        title: 'Slug Collision Local Title',
      })
    )
  })

  it('falls back to seeded mock posts when persisted storage is corrupted', async () => {
    localStorage.setItem(PUBLISHED_POSTS_KEY, 'not-json')

    const postsPromise = fetchPosts()
    await expect(postsPromise).resolves.toEqual(expect.any(Array))
    const posts = await postsPromise

    expect(posts.length).toBeGreaterThan(0)
    expect(posts.some((post) => post.id === getVisibleSeededPost().id)).toBe(true)
  })

})
