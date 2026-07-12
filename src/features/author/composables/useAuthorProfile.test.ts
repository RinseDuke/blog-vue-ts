import type { Post } from '@/types/post'
import { useAuthorProfile } from './useAuthorProfile'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

function makePost(authorId: string, authorName: string): Post {
  return {
    id: `post-${authorId}`,
    slug: `post-${authorId}`,
    title: `${authorName} 的文章`,
    excerpt: '摘要',
    tags: [],
    author: { id: authorId, name: authorName },
    publishedAt: '2026-01-01T00:00:00.000Z',
    readMinutes: 1,
  }
}

describe('useAuthorProfile', () => {
  it('keeps the latest author when requests resolve out of order', async () => {
    const first = deferred<Post[]>()
    const second = deferred<Post[]>()
    const loadPosts = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const profile = useAuthorProfile(loadPosts)

    const firstLoad = profile.load('author-a')
    const secondLoad = profile.load('author-b')

    second.resolve([makePost('author-b', '作者 B')])
    await secondLoad

    expect(loadPosts).toHaveBeenNthCalledWith(1, { authorId: 'author-a' })
    expect(loadPosts).toHaveBeenNthCalledWith(2, { authorId: 'author-b' })
    expect(profile.author.value?.id).toBe('author-b')
    expect(profile.posts.value[0]?.author.id).toBe('author-b')
    expect(profile.loading.value).toBe(false)
    expect(profile.error.value).toBeNull()

    first.resolve([makePost('author-a', '作者 A')])
    await firstLoad

    expect(profile.author.value?.id).toBe('author-b')
    expect(profile.posts.value[0]?.author.id).toBe('author-b')
    expect(profile.loading.value).toBe(false)
  })

  it('retries the current author after an error and recovers', async () => {
    const loadPosts = vi
      .fn()
      .mockRejectedValueOnce(new Error('临时错误'))
      .mockResolvedValueOnce([makePost('author-a', '作者 A')])
    const profile = useAuthorProfile(loadPosts)

    await profile.load('author-a')

    expect(profile.error.value).toBe('临时错误')
    expect(profile.loading.value).toBe(false)

    await profile.retry()

    expect(loadPosts).toHaveBeenLastCalledWith({ authorId: 'author-a' })
    expect(profile.author.value?.id).toBe('author-a')
    expect(profile.error.value).toBeNull()
    expect(profile.loading.value).toBe(false)
  })
})
