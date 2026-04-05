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

  it('keeps the mobile navigation dropdown on a more solid unified surface', () => {
    expect(mobileTabsSource).toContain(
      'linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 99%, transparent), color-mix(in srgb, var(--surface-frost) 100%, transparent))'
    )
    expect(mobileTabsSource).toContain(
      'radial-gradient(circle at top left, color-mix(in srgb, var(--brand-100) 32%, transparent), transparent 58%)'
    )
    expect(mobileTabsSource).toContain('background: color-mix(in srgb, var(--surface-strong) 90%, transparent);')
    expect(mobileTabsSource).toContain('overflow: hidden;')
  })
})
