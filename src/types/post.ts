export interface Author {
  id: string
  name: string
  avatarUrl?: string
  bio?: string
}

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  coverImage?: string
  content?: string
  tags: string[]
  author: Author
  publishedAt: string
  readMinutes: number
  featured?: boolean
}
