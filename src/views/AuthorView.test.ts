import authorViewSource from './AuthorView.vue?raw'

describe('AuthorView source contract', () => {
  it('loads and renders the selected author public posts', () => {
    expect(authorViewSource).toContain('fetchPosts({ authorId })')
    expect(authorViewSource).toContain('PostList')
  })

  it('provides a missing-author state with a route back to articles', () => {
    expect(authorViewSource).toContain('作者未找到')
    expect(authorViewSource).toContain('返回文章列表')
  })

  it('ignores stale responses after the route changes to another author', () => {
    expect(authorViewSource).toContain('requestId !== activeRequestId')
  })
})
