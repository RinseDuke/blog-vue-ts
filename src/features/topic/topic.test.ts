import type { Post } from '@/types/post'
import { mapPostToTopic, sortTopics } from './topic'

function makePost(partial: Partial<Post> & Pick<Post, 'id' | 'title' | 'publishedAt'>): Post {
  return {
    id: partial.id,
    slug: partial.id,
    title: partial.title,
    excerpt: partial.excerpt ?? '',
    tags: partial.tags ?? [],
    author: partial.author ?? { id: 'author', name: '作者' },
    publishedAt: partial.publishedAt,
    updatedAt: partial.updatedAt,
    readMinutes: partial.readMinutes ?? 3,
    featured: partial.featured,
  }
}

describe('topic view model', () => {
  it('maps a post without inventing community metrics', () => {
    const topic = mapPostToTopic(
      makePost({
        id: '1',
        title: '你好',
        excerpt: '摘要',
        tags: ['随笔'],
        publishedAt: '2026-08-31T08:00:00Z',
        featured: true,
      })
    )

    expect(topic.official).toBe(true)
    expect(topic.replyCount).toBeUndefined()
    expect(topic.viewCount).toBeUndefined()
    expect(topic.lastActivityAt).toBe('2026-08-31T08:00:00Z')
  })

  it('uses updated time as the latest activity time', () => {
    const topic = mapPostToTopic(
      makePost({
        id: '1',
        title: '有更新',
        publishedAt: '2026-08-30T08:00:00Z',
        updatedAt: '2026-08-31T08:00:00Z',
      })
    )

    expect(topic.lastActivityAt).toBe('2026-08-31T08:00:00Z')
  })

  it('keeps official topics ahead of regular topics and sorts peers by activity', () => {
    const result = sortTopics(
      [
        makePost({ id: '2', title: '普通新帖', publishedAt: '2026-09-01T08:00:00Z' }),
        makePost({ id: '1', title: '官方文章', publishedAt: '2026-08-31T08:00:00Z', featured: true }),
        makePost({ id: '3', title: '普通旧帖', publishedAt: '2026-08-29T08:00:00Z' }),
      ].map(mapPostToTopic)
    )

    expect(result.map((topic) => topic.id)).toEqual(['1', '2', '3'])
  })
})
