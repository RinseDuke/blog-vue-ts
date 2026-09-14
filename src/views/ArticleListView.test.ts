import source from './ArticleListView.vue?raw'

describe('ArticleListView source contract', () => {
  it('keeps filters and pagination inside the shared community layout', () => {
    expect(source).toContain('CommunityLayout')
    expect(source).toContain('PostList')
    expect(source).toContain('ArticleFilters')
    expect(source).not.toContain('template #context')
    expect(source.indexOf('<ArticleFilters')).toBeLessThan(source.indexOf('<PostList'))
    expect(source).toContain('class="page-size-control"')
    expect(source).not.toContain('feed__rule')
  })
})
