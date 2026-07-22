import source from './ArticleFilters.vue?raw'
import articleListSource from '@/views/ArticleListView.vue?raw'

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

  it('uses the shared glass surface with compact touch-safe mobile controls', () => {
    expect(source).toContain('class="filter-box glass-surface"')
    expect(source).toContain('min-height: 44px;')
    expect(source).toContain('max-height: min(56vh, 420px);')
    expect(source).toContain('overflow-y: auto;')
    expect(source).toContain('@media (max-width: 768px)')
  })

  it('keeps query-driven filtering and presents the article controls as one glass panel', () => {
    expect(articleListSource).toContain('parseArticleListQueryState')
    expect(articleListSource).toContain('buildArticleListQuery')
    expect(articleListSource).toContain('router.replace({ query: nextQuery })')
    expect(articleListSource).toContain('class="feed__head glass-surface"')
    expect(articleListSource).toContain('<PostList class="feed__grid feed__grid--list"')
    expect(articleListSource).toContain('min-height: 44px;')
  })
})
