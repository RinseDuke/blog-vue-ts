/**
 * 文章工具函数
 * 提供相关性评分、排序、标签统计、推荐文章等纯函数工具。
 */

import type { Post } from '@/types/post'

/** 带评分的文章（搜索结果用） */
export interface ScoredPost {
  post: Post
  score: number
}

/** 标签选项（含出现次数） */
export interface PostTagOption {
  name: string
  count: number
}

/** 将 HTML / Markdown 转换为纯文本（去除标签和特殊符号） */
export function toPlainText(source: string) {
  return source
    .replace(/<[^>]+>/g, ' ')
    .replace(/[-#>*_`~[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 中文日期格式化器 */
const ZH_DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

/** 按发布日期倒序排序 */
export function sortPostsByDateDesc(a: Post, b: Post) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

/** 格式化文章日期为中文格式（如 "2024年5月12日"） */
export function formatPostDate(dateIso: string) {
  return ZH_DATE_FORMATTER.format(new Date(dateIso))
}

/**
 * 计算文章与查询词的相关性评分
 * 评分维度：标题(+6)、摘要(+3)、作者(+2) + 出现频次加成
 */
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

  // Frequency bonus: intentionally stacks with the includes checks above
  // so that repeated mentions in title/excerpt receive extra weight
  const frequency = (title + ' ' + excerpt).split(normalized).length - 1
  score += frequency

  return score
}

/** 按相关性评分倒序排列文章（同分按日期倒序） */
export function rankPostsByRelevance(posts: Post[], query: string): ScoredPost[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return posts
    .map((post) => ({ post, score: calculatePostRelevance(post, normalized) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || sortPostsByDateDesc(a.post, b.post))
}

/** 统计所有标签及其出现次数（频次倒序，同频按中文排序） */
export function buildTagOptions(posts: Post[]): PostTagOption[] {
  const tagCounts = new Map<string, number>()

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      const normalizedTag = tag.trim()
      if (!normalizedTag) return
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) ?? 0) + 1)
    })
  })

  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

/**
 * 生成推荐文章
 * 从阅读量 Top N 池中随机抽取指定数量（Fisher-Yates 洗牌）
 */
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
    // Fisher-Yates shuffle for uniform randomness
    for (let i = topPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[topPool[i], topPool[j]] = [topPool[j], topPool[i]]
    }
  }

  return topPool.slice(0, Math.min(take, topPool.length))
}
