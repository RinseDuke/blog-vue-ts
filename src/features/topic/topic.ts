import type { Post } from '@/types/post'

export interface TopicListItem {
  id: string
  title: string
  excerpt: string
  tags: string[]
  author: Post['author']
  publishedAt: string
  lastActivityAt: string
  readMinutes: number
  official: boolean
  replyCount?: number
  viewCount?: number
}

export function mapPostToTopic(post: Post): TopicListItem {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags,
    author: post.author,
    publishedAt: post.publishedAt,
    lastActivityAt: post.updatedAt ?? post.publishedAt,
    readMinutes: post.readMinutes,
    official: post.featured === true,
  }
}

export function sortTopics(topics: TopicListItem[]) {
  return topics.slice().sort((a, b) => {
    const officialOrder = Number(b.official) - Number(a.official)
    if (officialOrder !== 0) return officialOrder
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  })
}
