import type { Post } from '@/types/post'
import {
  buildTagOptions,
  buildRecommendedPosts,
  calculatePostRelevance,
  rankPostsByRelevance,
  sortPostsByDateDesc,
} from '@/features/post/utils/post'

const baseAuthor = {
  id: 'author-1',
  name: 'Author',
}

function createPost(partial: Partial<Post> & Pick<Post, 'id' | 'slug' | 'title' | 'publishedAt' | 'readMinutes'>): Post {
  return {
    id: partial.id,
    slug: partial.slug,
    title: partial.title,
    excerpt: partial.excerpt ?? '',
    tags: partial.tags ?? [],
    author: partial.author ?? baseAuthor,
    publishedAt: partial.publishedAt,
    readMinutes: partial.readMinutes,
    coverImage: partial.coverImage,
    content: partial.content,
    featured: partial.featured,
  }
}

describe('post utils', () => {
  it('sortPostsByDateDesc sorts newer posts first', () => {
    const posts = [
      createPost({ id: '1', slug: 'p1', title: 'Old', publishedAt: '2024-01-01T00:00:00.000Z', readMinutes: 3 }),
      createPost({ id: '2', slug: 'p2', title: 'New', publishedAt: '2024-02-01T00:00:00.000Z', readMinutes: 3 }),
    ]

    const sorted = posts.slice().sort(sortPostsByDateDesc)

    expect(sorted.map((item) => item.id)).toEqual(['2', '1'])
  })

  it('calculatePostRelevance gives higher score when title matches than excerpt-only matches', () => {
    const query = 'vue'
    const titleMatch = createPost({
      id: '1',
      slug: 'title-match',
      title: 'Vue composition guide',
      excerpt: 'Unrelated text',
      tags: ['frontend'],
      publishedAt: '2024-01-01T00:00:00.000Z',
      readMinutes: 5,
    })
    const excerptOnly = createPost({
      id: '2',
      slug: 'excerpt-only',
      title: 'React notes',
      excerpt: 'This article compares vue and react',
      tags: ['frontend'],
      publishedAt: '2024-01-01T00:00:00.000Z',
      readMinutes: 5,
    })

    expect(calculatePostRelevance(titleMatch, query)).toBeGreaterThan(calculatePostRelevance(excerptOnly, query))
  })

  it('rankPostsByRelevance sorts by score then date desc', () => {
    const posts = [
      createPost({
        id: '1',
        slug: 'older-high',
        title: 'Vue Vue',
        excerpt: 'Two matches in title',
        tags: ['vue'],
        publishedAt: '2024-01-01T00:00:00.000Z',
        readMinutes: 4,
      }),
      createPost({
        id: '2',
        slug: 'newer-high',
        title: 'Vue Vue',
        excerpt: 'Two matches in title',
        tags: ['vue'],
        publishedAt: '2024-02-01T00:00:00.000Z',
        readMinutes: 4,
      }),
      createPost({
        id: '3',
        slug: 'low',
        title: 'Other topic',
        excerpt: 'has vue once',
        tags: ['misc'],
        publishedAt: '2024-03-01T00:00:00.000Z',
        readMinutes: 4,
      }),
    ]

    const ranked = rankPostsByRelevance(posts, 'vue')

    expect(ranked.map((item) => item.post.id)).toEqual(['2', '1', '3'])
  })

  it('buildRecommendedPosts returns highest read-time posts when randomize=false', () => {
    const posts = [
      createPost({ id: '1', slug: 'p1', title: 'A', publishedAt: '2024-01-01T00:00:00.000Z', readMinutes: 3 }),
      createPost({ id: '2', slug: 'p2', title: 'B', publishedAt: '2024-01-02T00:00:00.000Z', readMinutes: 8 }),
      createPost({ id: '3', slug: 'p3', title: 'C', publishedAt: '2024-01-03T00:00:00.000Z', readMinutes: 6 }),
      createPost({ id: '4', slug: 'p4', title: 'D', publishedAt: '2024-01-04T00:00:00.000Z', readMinutes: 9 }),
    ]

    const recommended = buildRecommendedPosts(posts, {
      poolMin: 4,
      poolMax: 4,
      take: 3,
      randomize: false,
    })

    expect(recommended.map((item) => item.id)).toEqual(['4', '2', '3'])
  })

  it('buildTagOptions aggregates and sorts tags by frequency', () => {
    const posts = [
      createPost({
        id: '1',
        slug: 'p1',
        title: 'A',
        tags: ['Vue', 'TypeScript', 'Vue'],
        publishedAt: '2024-01-01T00:00:00.000Z',
        readMinutes: 3,
      }),
      createPost({
        id: '2',
        slug: 'p2',
        title: 'B',
        tags: ['TypeScript', '工程化'],
        publishedAt: '2024-01-02T00:00:00.000Z',
        readMinutes: 3,
      }),
    ]

    expect(buildTagOptions(posts)).toEqual([
      { name: 'TypeScript', count: 2 },
      { name: 'Vue', count: 2 },
      { name: '工程化', count: 1 },
    ])
  })
})
