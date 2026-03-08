import type { Post } from '@/types/post'
import { mockPosts } from '@/mocks/posts'
import { readStoredAuthSession } from '@/features/auth/stores/useAuthStore'
import { apiFetch, isMockMode, networkDelay } from './apiClient'

export interface FetchPostsParams {
  limit?: number
  featuredOnly?: boolean
}

export interface CreatePostPayload {
  title: string
  markdown: string
  html: string
  tags: string[]
  coverImage?: string | null
}

const PUBLISHED_POSTS_KEY = 'blog_published_posts_v1'

function requireAuthSession(errorMessage: string) {
  const session = readStoredAuthSession()
  if (!session) {
    throw new Error(errorMessage)
  }

  return session
}

function isStoredPost(value: unknown): value is Post {
  if (!value || typeof value !== 'object') return false

  const post = value as Partial<Post>
  return (
    typeof post.id === 'string' &&
    typeof post.slug === 'string' &&
    typeof post.title === 'string' &&
    typeof post.excerpt === 'string' &&
    Array.isArray(post.tags) &&
    typeof post.publishedAt === 'string' &&
    typeof post.readMinutes === 'number' &&
    !!post.author &&
    typeof post.author.id === 'string' &&
    typeof post.author.name === 'string'
  )
}

function readPublishedPosts() {
  try {
    const raw = localStorage.getItem(PUBLISHED_POSTS_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isStoredPost)
  } catch {
    return []
  }
}

function persistPublishedPosts(posts: Post[]) {
  localStorage.setItem(PUBLISHED_POSTS_KEY, JSON.stringify(posts))
}

function sortByPublishedAtDesc(a: Post, b: Post) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

function getAllPosts() {
  return [...readPublishedPosts(), ...mockPosts].sort(sortByPublishedAtDesc)
}

function normalizeAuthorName(email: string) {
  return email.split('@')[0]?.trim() || 'Sign'
}

function buildAuthor(email: string): Post['author'] {
  const name = normalizeAuthorName(email)

  return {
    id: `user-${email}`,
    name,
    avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
    bio: `${name} 发布的本地模拟文章。`,
  }
}

function toPlainText(source: string) {
  return source
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildExcerpt(source: string) {
  const plainText = toPlainText(source)
  if (plainText.length <= 96) {
    return plainText
  }

  return `${plainText.slice(0, 96).trim()}...`
}

function estimateReadMinutes(source: string) {
  const plainText = toPlainText(source)
  return Math.max(1, Math.ceil(plainText.length / 320))
}

function buildSlug(title: string, existingSlugs: Set<string>) {
  const normalizedTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const baseSlug = normalizedTitle || 'article'
  let slug = `${baseSlug}-${Date.now().toString(36)}`

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`
  }

  return slug
}

//获取文章
export async function fetchPosts(params: FetchPostsParams = {}): Promise<Post[]> {
  if (isMockMode()) {
    await networkDelay()
    let result = getAllPosts()

    if (params.featuredOnly) {
      result = result.filter((post) => post.featured)
    }

    if (params.limit) {
      result = result.slice(0, params.limit)
    }

    return structuredClone(result)
  }

  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.append('limit', String(params.limit))
  if (params.featuredOnly) searchParams.append('featured', 'true')

  return apiFetch<Post[]>(`/posts?${searchParams.toString()}`)
}

export async function fetchPostBySlug(slug: string): Promise<Post | undefined> {
  if (isMockMode()) {
    await networkDelay()
    const post = getAllPosts().find((post) => post.slug === slug)
    return post ? structuredClone(post) : undefined
  }

  try {
    return await apiFetch<Post>(`/posts/${slug}`)
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
      return undefined
    }
    throw err
  }
}

export async function setPostLike(postId: string, liked: boolean): Promise<number> {
  if (isMockMode()) {
    await networkDelay(100)
    requireAuthSession('请先登录后再点赞文章')

    const post = mockPosts.find((p) => p.id === postId)
    if (post) {
      post.likes = Math.max(0, (post.likes ?? 0) + (liked ? 1 : -1))
      return post.likes
    }
    return liked ? 1 : 0
  }

  const data = await apiFetch<{ likes: number }>(`/posts/${postId}/like`, {
    method: liked ? 'POST' : 'DELETE',
  })
  return data.likes
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  if (isMockMode()) {
    await networkDelay(250)
    const session = requireAuthSession('请先登录后再发布文章')
    const existingPosts = getAllPosts()
    const publishedPosts = readPublishedPosts()
    const publishedAt = new Date().toISOString()
    const excerpt = buildExcerpt(payload.markdown || payload.html)

    const nextPost: Post = {
      id: `user-post-${Date.now()}`,
      slug: buildSlug(payload.title, new Set(existingPosts.map((post) => post.slug))),
      title: payload.title.trim(),
      excerpt: excerpt || '新发布的文章',
      coverImage: payload.coverImage || undefined,
      content: payload.html,
      tags: Array.from(new Set(payload.tags.map((tag) => tag.trim()).filter(Boolean))),
      author: buildAuthor(session.email),
      publishedAt,
      readMinutes: estimateReadMinutes(payload.markdown),
      featured: false,
      likes: 0,
    }

    persistPublishedPosts([nextPost, ...publishedPosts].sort(sortByPublishedAtDesc))
    return structuredClone(nextPost)
  }

  return apiFetch<Post>('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
