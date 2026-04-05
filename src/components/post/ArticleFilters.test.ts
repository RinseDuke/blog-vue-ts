import source from './ArticleFilters.vue?raw'

describe('ArticleFilters source contract', () => {
  it('keeps a dedicated mobile toggle and collapsible panel structure', () => {
    expect(source).toContain('filter-box__mobile-bar')
    expect(source).toContain('filter-box__toggle')
    expect(source).toContain('filter-box__panel')
    expect(source).toContain('aria-expanded')
    expect(source).toContain("is-mobile-open")
  })

  it('keeps reset action in the mobile control row and desktop header', () => {
    expect(source).toContain('filter-reset filter-reset--mobile')
    expect(source).toContain('filter-box__desktop-head')
    expect(source).toContain('@media (max-width: 1100px)')
  })
})