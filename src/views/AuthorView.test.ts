import authorViewSource from './AuthorView.vue?raw'

describe('AuthorView source contract', () => {
  it('loads and renders the selected author public posts', () => {
    expect(authorViewSource).toContain('useAuthorProfile()')
    expect(authorViewSource).toContain('load(authorId)')
    expect(authorViewSource).toContain('PostList')
  })

  it('provides a missing-author state with a route back to articles', () => {
    expect(authorViewSource).toContain('作者未找到')
    expect(authorViewSource).toContain('返回文章列表')
  })

  it('wires an accessible retry action for loading errors', () => {
    expect(authorViewSource).toContain('type="button"')
    expect(authorViewSource).toContain('@click="retry"')
    expect(authorViewSource).toContain('重试')
  })

  it('treats the avatar next to the author heading as decorative', () => {
    expect(authorViewSource).toContain(':src="author.avatarUrl"')
    expect(authorViewSource).toContain('alt=""')
  })
})
