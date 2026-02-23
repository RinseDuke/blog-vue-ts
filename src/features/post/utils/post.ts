import type { Post } from '@/types/post'

export interface ScoredPost {
  post: Post
  score: number
}

const ZH_DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export function sortPostsByDateDesc(a: Post, b: Post) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

export function formatPostDate(dateIso: string) {
  return ZH_DATE_FORMATTER.format(new Date(dateIso))
}

export function calculatePostRelevance(post: Post, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return 0

  const title = post.title.toLowerCase()
  const excerpt = (post.excerpt ?? '').toLowerCase()
  const author = (post.author?.name ?? '').toLowerCase()
  const tags = post.tags.map((tag) => tag.toLowerCase())
  let score = 0

  if (title.includes(normalized)) score += 6
  if (excerpt.includes(normalized)) score += 3
  if (author.includes(normalized)) score += 2
  score += tags.reduce((total, tag) => (tag.includes(normalized) ? total + 3 : total), 0)

  const frequency = (title + ' ' + excerpt).split(normalized).length - 1
  score += frequency

  return score
}

export function rankPostsByRelevance(posts: Post[], query: string): ScoredPost[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return posts
    .map((post) => ({ post, score: calculatePostRelevance(post, normalized) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || sortPostsByDateDesc(a.post, b.post))
}

export function buildRecommendedPosts(
  posts: Post[],
  options: {
    poolMin?: number
    poolMax?: number
    take?: number
    randomize?: boolean
  } = {}
) {
  const { poolMin = 6, poolMax = 12, take = 6, randomize = false } = options
  const sortedByRead = posts
    .slice()
    .sort((a, b) => b.readMinutes - a.readMinutes || sortPostsByDateDesc(a, b))

  const poolSize = Math.max(poolMin, Math.min(poolMax, sortedByRead.length))
  const topPool = sortedByRead.slice(0, poolSize)
  const selected = randomize ? topPool.slice().sort(() => Math.random() - 0.5) : topPool

  return selected.slice(0, Math.min(take, selected.length))
}
