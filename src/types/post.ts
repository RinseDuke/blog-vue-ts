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
  likes?: number
}

export interface Comment {
  id: string
  postId: string
  author: Author
  content: string
  createdAt: string
  parentId?: string
  likes?: number
}

export type ReportTargetType = 'comment' | 'post'

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'misinformation'
  | 'inappropriate'
  | 'other'

export interface Report {
  id: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  detail?: string
  reportedBy: string
  createdAt: string
  status: 'pending' | 'reviewed' | 'dismissed'
}
