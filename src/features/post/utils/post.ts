import type { Post } from '@/types/post'
export { toPlainText } from '@/utils/text'

interface ScoredPost {
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

// 评分维度：标题(+6)、摘要(+3)、作者(+2) + 出现频次加成
export function calculatePostRelevance(post: Post, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return 0

  const title = post.title.toLowerCase()
  const excerpt = (post.excerpt ?? '').toLowerCase()
  const author = (post.author?.name ?? '').toLowerCase()
  let score = 0

  if (title.includes(normalized)) score += 6
  if (excerpt.includes(normalized)) score += 3
  if (author.includes(normalized)) score += 2

  // 频次加成：标题/摘要中多次出现的词获得额外权重
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

// 从阅读量 Top N 池中随机抽取（Fisher-Yates 洗牌）
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

  if (randomize) {
    for (let i = topPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[topPool[i], topPool[j]] = [topPool[j], topPool[i]]
    }
  }

  return topPool.slice(0, Math.min(take, topPool.length))
}
