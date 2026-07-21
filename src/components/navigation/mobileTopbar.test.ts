import appSource from '@/App.vue?raw'
import mobileTabsSource from './MobileTopTabs.vue?raw'
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

  it('keeps mobile controls touchable and the dropdown on a high-opacity glass surface', () => {
    expect(appSource).toContain('min-width: 44px;')
    expect(appSource).toContain('min-height: 44px;')
    expect(mobileTabsSource).toContain('min-height: 44px;')
    expect(mobileTabsSource).toContain(
      'background: color-mix(in srgb, var(--glass-surface) 32%, var(--surface-strong) 68%);'
    )
    expect(mobileTabsSource).toContain('border: 1px solid var(--glass-border);')
    expect(mobileTabsSource).toContain('box-shadow: var(--glass-shadow);')
    expect(mobileTabsSource).toContain('backdrop-filter: blur(var(--glass-blur)) saturate(135%);')
    expect(mobileTabsSource).toContain('@supports not ((backdrop-filter: blur(1px))')
    expect(mobileTabsSource).toContain('background: var(--surface-strong);')
    expect(mobileTabsSource).toContain('overflow: hidden;')
  })
})
