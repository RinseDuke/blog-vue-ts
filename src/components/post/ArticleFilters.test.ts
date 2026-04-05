import source from './ArticleFilters.vue?raw'

describe('ArticleFilters source contract', () => {
  it('keeps dedicated mobile bar, toggle, and panel markers', () => {
    expect(source).toContain('class="filter-box__mobile-bar"')
    expect(source).toMatch(/filter-box__mobile-bar[\s\S]*filter-box__toggle/)
    expect(source).toMatch(/filter-box__panel[\s\S]*aria-expanded/)
    expect(source).toContain('is-mobile-open')
  })

  it('keeps reset action in the mobile control row', () => {
    expect(source).toContain('filter-reset filter-reset--mobile')
  })

  it('keeps desktop header wrapper for the reset action', () => {
    expect(source).toContain('filter-box__desktop-head')
  })
})
