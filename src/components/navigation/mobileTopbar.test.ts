import appSource from '@/App.vue?raw'
import mobileTabsSource from './MobileTopTabs.vue?raw'
import topBrandSource from './TopBrand.vue?raw'
import topThemeToggleSource from './TopThemeToggle.vue?raw'
import mobileSearchSheetSource from '../search/MobileSearchSheet.vue?raw'

describe('mobile topbar source contract', () => {
  it('splits the header into desktop and mobile topbar structures', () => {
    expect(appSource).toContain('desktop-topbar')
    expect(appSource).toContain('mobile-topbar')
    expect(appSource).toContain('mobile-topbar__main')
    expect(appSource).toContain('mobile-search-trigger')
    expect(appSource).toContain('MobileTopTabs')
    expect(appSource).toContain('MobileSearchSheet')
  })

  it('places the mobile navigation capsule between search and theme controls', () => {
    const actionsChunk = appSource.slice(
      appSource.indexOf('<div class="mobile-topbar__actions">'),
      appSource.indexOf('</div>', appSource.indexOf('<div class="mobile-topbar__actions">'))
    )

    expect(actionsChunk).toContain('mobile-search-trigger')
    expect(actionsChunk).toContain('<MobileTopTabs :search-open="isMobileSearchOpen" />')
    expect(actionsChunk).toContain('<TopThemeToggle />')
  })

  it('adds a collapsible mobile navigation capsule and mobile search sheet', () => {
    expect(mobileTabsSource).toContain('mobile-top-tabs')
    expect(mobileTabsSource).toContain('mobile-top-tabs__trigger')
    expect(mobileTabsSource).toContain('mobile-top-tabs__panel')
    expect(mobileTabsSource).toContain('currentTabLabel')
    expect(mobileTabsSource).toContain('searchOpen')
    expect(mobileSearchSheetSource).toContain('mobile-search-sheet')
    expect(mobileSearchSheetSource).toContain('SearchDropdownContent')
  })

  it('keeps mobile navigation controls at least 52px', () => {
    expect(appSource).toContain('min-width: 52px;')
    expect(appSource).toContain('min-height: 52px;')
    expect(mobileTabsSource).toMatch(
      /\.mobile-top-tabs__trigger\s*\{[^}]*min-width: 52px;[^}]*min-height: 52px;/s
    )
    expect(mobileTabsSource).toMatch(/\n\s+a\s*\{[^}]*min-width: 52px;[^}]*min-height: 52px;/s)
    expect(topBrandSource).toContain('min-height: 52px;')
    expect(topThemeToggleSource).toContain('min-width: 52px;')
    expect(topThemeToggleSource).toContain('min-height: 52px;')
    expect(mobileSearchSheetSource).toContain('min-width: 52px;')
    expect(mobileSearchSheetSource).toContain('height: 52px;')
  })

  it('keeps the mobile dropdown opaque without repeating the fixed header blur', () => {
    expect(mobileTabsSource).toContain(
      'background: color-mix(in srgb, var(--glass-surface) 32%, var(--surface-strong) 68%);'
    )
    expect(mobileTabsSource).toContain('border: 1px solid var(--glass-border);')
    expect(mobileTabsSource).toContain('box-shadow: var(--glass-shadow);')
    expect(mobileTabsSource).not.toContain('backdrop-filter: blur(var(--glass-blur)) saturate(135%);')
    expect(mobileTabsSource).not.toContain('-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(135%);')
    expect(mobileTabsSource).toContain('@supports not ((backdrop-filter: blur(1px))')
    expect(mobileTabsSource).toContain('background: var(--surface-strong);')
    expect(mobileTabsSource).toContain('overflow: hidden;')
  })

  it('preserves a visible focus ring on the active mobile navigation link', () => {
    expect(mobileTabsSource).toContain('a.router-link-active:focus-visible')
    expect(mobileTabsSource).toContain('box-shadow: var(--focus-ring), inset 0 1px 0 var(--glass-highlight);')
  })

  it('preserves the trigger focus ring after the menu opens', () => {
    const openRuleIndex = mobileTabsSource.indexOf('.mobile-top-tabs--open .mobile-top-tabs__trigger {')
    const openFocusRuleIndex = mobileTabsSource.indexOf(
      '.mobile-top-tabs--open .mobile-top-tabs__trigger:focus-visible {'
    )

    expect(openFocusRuleIndex).toBeGreaterThan(openRuleIndex)
    expect(mobileTabsSource).toContain('box-shadow: var(--focus-ring),')
  })
})
