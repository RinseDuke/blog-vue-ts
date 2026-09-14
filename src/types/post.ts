/**
 * 全局类型定义
 * 定义了文章、作者、评论、举报等核心数据结构，供 services / stores / 组件共用。
 */

/** 作者信息 */
export interface Author {
  id: string
  name: string
  username?: string
  email?: string
  avatarUrl?: string   // 头像地址（可选）
  bio?: string         // 个人简介
}

/** 文章主体 */
export interface Post {
  id: string
  slug: string           // URL 友好标识
  title: string
  excerpt: string        // 摘要
  coverImage?: string    // 封面图
  content?: string       // 正文 HTML（历史数据或服务端渲染结果）
  markdown?: string      // 正文 Markdown 源码（编辑和扩展渲染的唯一来源）
  tags: string[]         // 标签列表
  author: Author
  publishedAt: string    // ISO 日期字符串
  updatedAt?: string     // 最后更新时间
  readMinutes: number    // 预估阅读时长（分钟）
  featured?: boolean     // 是否精选
  likes?: number         // 点赞数
  status?: 'draft' | 'published'
  visibility?: 'public' | 'private'
}

/** 评论 */
export interface Comment {
  id: string
  postId: string         // 所属文章 ID
  author: Author
  content: string
  createdAt: string
  parentId?: string      // 父评论 ID（支持嵌套回复）
  likes?: number
}

/** 举报目标类型 */
export type ReportTargetType = 'comment' | 'post'

/** 举报理由枚举 */
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'misinformation'
  | 'inappropriate'
  | 'other'

/** 举报记录 */
export interface Report {
  id: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  detail?: string          // 补充说明
  reportedBy: string       // 举报人 ID
  createdAt: string
  status: 'pending' | 'reviewed' | 'dismissed'  // 审核状态
}
