import { createPinia, setActivePinia } from 'pinia'
import { fetchPosts } from '@/services/postService'
import { usePostsStore } from './usePostsStore'
import type { Post } from '@/types/post'

vi.mock('@/services/postService', () => ({
  fetchPosts: vi.fn(),
}))

const post: Post = {
  id: 'post-1',
  slug: 'post-1',
  title: 'Store test',
  excerpt: 'Store test excerpt',
  tags: [],
  author: { id: 'author-1', name: 'Author' },
  publishedAt: '2026-09-14T00:00:00.000Z',
  readMinutes: 1,
}

describe('usePostsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchPosts).mockReset()
  })

  it('deduplicates concurrent loads and serves the cached result', async () => {
    let resolveRequest!: (posts: Post[]) => void
    vi.mocked(fetchPosts).mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve
    }))
    const store = usePostsStore()

    const first = store.ensurePosts()
    const second = store.ensurePosts()
    resolveRequest([post])

    await expect(first).resolves.toEqual([post])
    await expect(second).resolves.toEqual([post])
    await expect(store.ensurePosts()).resolves.toEqual([post])
    expect(fetchPosts).toHaveBeenCalledTimes(1)
  })

  it('forces a refresh and exposes request failures', async () => {
    vi.mocked(fetchPosts)
      .mockResolvedValueOnce([post])
      .mockRejectedValueOnce(new Error('network unavailable'))
    const store = usePostsStore()

    await store.ensurePosts()
    await expect(store.refreshPosts()).rejects.toThrow('network unavailable')

    expect(store.error).toBe('network unavailable')
    expect(store.loading).toBe(false)
    expect(fetchPosts).toHaveBeenCalledTimes(2)
  })

  it('uses a localized fallback for non-Error failures', async () => {
    vi.mocked(fetchPosts).mockRejectedValueOnce('offline')
    const store = usePostsStore()

    await expect(store.ensurePosts()).rejects.toBe('offline')

    expect(store.error).toBe('加载主题失败')
    expect(store.loading).toBe(false)
  })
})
