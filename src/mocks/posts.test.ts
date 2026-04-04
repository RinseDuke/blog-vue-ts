import { describe, expect, it } from 'vitest'
import { mockPosts } from '@/mocks/posts'

const forbiddenDisplayPhrases = [
  '这批内容用于验证多数据场景下的分页、搜索、筛选、推荐与详情渲染。',
  '当你后续接入真实后端时，只要保持当前字段结构一致，服务层就可以直接切换。',
  '从 Mock 数据切换到真实 API 的迁移方案',
  '前端 API 类型契约实践：把接口不确定性前置',
  '如何设计可扩展的 Mock 数据层',
  '真实后端',
]

describe('mockPosts display copy', () => {
  it('does not expose prelaunch mock and backend integration wording', () => {
    const renderedText = mockPosts
      .map((post) => [post.title, post.excerpt, post.content].join('\n'))
      .join('\n')

    forbiddenDisplayPhrases.forEach((phrase) => {
      expect(renderedText).not.toContain(phrase)
    })
  })
})
