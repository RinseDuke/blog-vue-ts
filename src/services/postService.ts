/**
 * 文章服务
 * 真实后端模式对接 blogs 接口，Mock 模式仍保留本地发布能力。
 */

import type { Post } from '@/types/post'
import { toPlainText } from '@/features/post/utils/post'
import { mockPosts } from '@/mocks/posts'
import { readStoredAuthSession, requireAuthSession } from '@/features/auth/stores/useAuthStore'
import { apiFetch, ApiError, isMockMode, networkDelay } from './apiClient'

interface BackendBlogAuthor {
  id: string
  username: string
}

interface BackendBlog {
  id: string
  title: string
  content?: string
  html_content?: string
  author?: BackendBlogAuthor
  created_at: string
  updated_at?: string
  visibility?: 'public' | 'private'
  status?: 'draft' | 'published'
}

export interface FetchPostsParams {
  limit?: number
  featuredOnly?: boolean
  authorId?: string
  search?: string
}

export interface CreatePostPayload {
  title: string
  markdown: string
  html: string
  status?: 'draft' | 'published'
  visibility?: 'public' | 'private'
  tags?: string[]
  coverImage?: string | null
}

const PUBLISHED_POSTS_KEY = 'blog_published_posts_v1'
const DEFAULT_REAL_LIMIT = 100

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

function readPublishedPosts(): Post[] {
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
  const normalizedPosts = mergeMockPosts(posts, [])
  localStorage.setItem(PUBLISHED_POSTS_KEY, JSON.stringify(normalizedPosts))
}

function sortByPublishedAtDesc(a: Post, b: Post) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

function mergeMockPosts(storedPosts: Post[], seededPosts: Post[]) {
  const merged: Post[] = []
  const seenIds = new Set<string>()
  const seenSlugs = new Set<string>()

  for (const post of [...storedPosts, ...seededPosts]) {
    if (seenIds.has(post.id) || seenSlugs.has(post.slug)) continue
    seenIds.add(post.id)
    seenSlugs.add(post.slug)
    merged.push(post)
  }

  return merged.sort(sortByPublishedAtDesc)
}

function getAllPosts() {
  return mergeMockPosts(readPublishedPosts(), mockPosts)
}

function normalizeAuthorName(email: string) {
  return email.split('@')[0]?.trim() || 'Sign'
}

function buildAuthor(userId: string, email: string, nickname?: string, username?: string): Post['author'] {
  const name = nickname?.trim() || normalizeAuthorName(email)
  const normalizedUsername = username?.trim() || name

  return {
    id: userId,
    name,
    username: normalizedUsername,
    email,
    avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
    bio: `${name} 发布的本地模拟文章。`,
  }
}

function isPublicPublishedPost(post: Post) {
  return post.status !== 'draft' && post.visibility !== 'private'
}

function getMockViewerAuthorIds() {
  const session = readStoredAuthSession()
  if (!session) return new Set<string>()

  return new Set([session.user.id, `user-${session.email}`])
}

function canManageMockPost(post: Post) {
  return getMockViewerAuthorIds().has(post.author.id)
}

function canReadMockPost(post: Post) {
  return isPublicPublishedPost(post) || canManageMockPost(post)
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

  let attempts = 0
  while (existingSlugs.has(slug) && attempts < 100) {
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`
    attempts += 1
  }

  return slug
}

function mapBackendBlogToPost(blog: BackendBlog): Post {
  const excerptSource = blog.content ?? blog.html_content ?? ''

  return {
    id: blog.id,
    slug: blog.id,
    title: blog.title,
    excerpt: buildExcerpt(excerptSource) || '暂无摘要',
    content: blog.html_content,
    tags: [],
    author: {
      id: blog.author?.id ?? 'unknown',
      name: blog.author?.username ?? '未知作者',
      username: blog.author?.username,
    },
    publishedAt: blog.created_at,
    updatedAt: blog.updated_at,
    readMinutes: estimateReadMinutes(blog.content ?? excerptSource),
    status: blog.status ?? 'published',
    visibility: blog.visibility ?? 'public',
  }
}

function buildBlogsQuery(params: FetchPostsParams = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('page', '1')
  searchParams.set('per_page', String(params.limit ?? DEFAULT_REAL_LIMIT))
  searchParams.set('only_public', 'true')

  if (params.authorId) searchParams.set('author_id', params.authorId)
  if (params.search) searchParams.set('search', params.search)

  return searchParams
}

export async function fetchPosts(params: FetchPostsParams = {}): Promise<Post[]> {
  if (isMockMode()) {
    await networkDelay()
    let result = getAllPosts().filter(isPublicPublishedPost)

    if (params.featuredOnly) {
      result = result.filter((post) => post.featured)
    }

    if (params.authorId) {
      result = result.filter((post) => post.author.id === params.authorId)
    }

    if (params.search) {
      const keyword = params.search.trim().toLowerCase()
      result = result.filter((post) =>
        [post.title, post.excerpt, post.author.name].join(' ').toLowerCase().includes(keyword)
      )
    }

    if (params.limit) {
      result = result.slice(0, params.limit)
    }

    return structuredClone(result)
  }

  if (params.featuredOnly) {
    const latest = await apiFetch<BackendBlog[]>(`/blogs/latest?per_page=${params.limit ?? 12}`)
    return latest.map(mapBackendBlogToPost)
  }

  const blogs = await apiFetch<BackendBlog[]>(`/blogs?${buildBlogsQuery(params).toString()}`)
  return blogs.map(mapBackendBlogToPost)
}

export async function fetchUserPosts(userId: string): Promise<Post[]> {
  if (isMockMode()) {
    await networkDelay()
    const viewerAuthorIds = getMockViewerAuthorIds()
    const authorIds = viewerAuthorIds.has(userId) ? viewerAuthorIds : new Set([userId])
    const authoredPosts = getAllPosts().filter((post) => authorIds.has(post.author.id))
    const visiblePosts = viewerAuthorIds.has(userId)
      ? authoredPosts
      : authoredPosts.filter(isPublicPublishedPost)

    return structuredClone(visiblePosts)
  }

  const blogs = await apiFetch<BackendBlog[]>(
    `/users/${userId}/blogs?page=1&per_page=${DEFAULT_REAL_LIMIT}`,
  )

  return blogs.map(mapBackendBlogToPost)
}

export async function fetchPostById(id: string): Promise<Post | undefined> {
  if (isMockMode()) {
    await networkDelay()
    const post = getAllPosts().find((item) => item.id === id || item.slug === id)
    if (!post || !canReadMockPost(post)) return undefined
    return structuredClone(post)
  }

  try {
    const post = await apiFetch<BackendBlog>(`/blogs/${id}`)
    return mapBackendBlogToPost(post)
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) {
      return undefined
    }
    throw err
  }
}

export async function fetchPostBySlug(identifier: string): Promise<Post | undefined> {
  return fetchPostById(identifier)
}

export async function setPostLike(postId: string, liked: boolean): Promise<number> {
  if (isMockMode()) {
    await networkDelay(100)
    requireAuthSession('请先登录后再点赞文章')

    const mockPost = mockPosts.find((post) => post.id === postId)
    if (mockPost) {
      mockPost.likes = Math.max(0, (mockPost.likes ?? 0) + (liked ? 1 : -1))
      return mockPost.likes
    }

    const publishedPosts = readPublishedPosts()
    const publishedPost = publishedPosts.find((post) => post.id === postId)
    if (publishedPost) {
      publishedPost.likes = Math.max(0, (publishedPost.likes ?? 0) + (liked ? 1 : -1))
      persistPublishedPosts(publishedPosts)
      return publishedPost.likes
    }

    return liked ? 1 : 0
  }

  throw new Error('当前后端暂未开放文章点赞接口。')
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  if (isMockMode()) {
    await networkDelay(250)
    const session = requireAuthSession('请先登录后再发布文章')
    const existingPosts = getAllPosts()
    const storedPosts = readPublishedPosts()
    const publishedAt = new Date().toISOString()
    const excerpt = buildExcerpt(payload.markdown || payload.html)

    const nextPost: Post = {
      id: `user-post-${Date.now()}`,
      slug: buildSlug(payload.title, new Set(existingPosts.map((post) => post.slug))),
      title: payload.title.trim(),
      excerpt: excerpt || '新发布的文章',
      coverImage: payload.coverImage || undefined,
      content: payload.html,
      tags: Array.from(new Set((payload.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
      author: buildAuthor(session.user.id, session.email, session.user.nickname, session.user.username),
      publishedAt,
      updatedAt: publishedAt,
      readMinutes: estimateReadMinutes(payload.markdown),
      featured: false,
      likes: 0,
      status: payload.status ?? 'published',
      visibility: payload.visibility ?? 'public',
    }

    persistPublishedPosts([nextPost, ...storedPosts])
    return structuredClone(nextPost)
  }

  const blog = await apiFetch<BackendBlog>('/blogs', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title.trim(),
      content: payload.markdown,
      status: payload.status ?? 'published',
      visibility: payload.visibility ?? 'public',
    }),
  })

  return mapBackendBlogToPost(blog)
}

export async function deletePost(postId: string): Promise<void> {
  if (isMockMode()) {
    await networkDelay(180)
    requireAuthSession('请先登录后再管理文章')
    const publishedPosts = readPublishedPosts()
    const targetPost = publishedPosts.find((post) => post.id === postId)

    if (!targetPost) {
      throw new Error('未找到可管理的文章')
    }

    if (!canManageMockPost(targetPost)) {
      throw new Error('无权管理这篇文章')
    }

    persistPublishedPosts(publishedPosts.filter((post) => post.id !== postId))
    return
  }

  await apiFetch<void>(`/blogs/${postId}`, {
    method: 'DELETE',
  })
}
