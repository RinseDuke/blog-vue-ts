import source from './ArticleFilters.vue?raw'

describe('ArticleFilters source contract', () => {
  it('wires mobile open state and toggle handler', () => {
    expect(source).toContain('const isMobileFiltersOpen = ref(false)')
    expect(source).toContain('const toggleMobileFilters = () => {')
    expect(source).toContain(":class=\"{ 'is-mobile-open': isMobileFiltersOpen }\"")
  })

  it('wires mobile toggle to controls/expanded and panel id', () => {
    expect(source).toContain('const mobileFiltersPanelId = \'article-filters-panel\'')
    expect(source).toContain(':aria-expanded="isMobileFiltersOpen"')
    expect(source).toContain(':aria-controls="mobileFiltersPanelId"')
    expect(source).toContain('class="filter-box__panel" :id="mobileFiltersPanelId"')
  })

  it('keeps structure markers for mobile/desktop affordances', () => {
    expect(source).toContain('class="filter-box__mobile-bar"')
    expect(source).toMatch(/filter-box__mobile-bar[\s\S]*filter-box__toggle/)
    expect(source).toContain('filter-reset filter-reset--mobile')
    expect(source).toContain('filter-box__desktop-head')
  })

  it('keeps mobile open selector to reveal the panel', () => {
    expect(source).toContain('.filter-box.is-mobile-open .filter-box__panel')
  })
})
