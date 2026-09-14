import appSource from '@/App.vue?raw'
import mobileTabsSource from './MobileTopTabs.vue?raw'
import mobileSearchSheetSource from '../search/MobileSearchSheet.vue?raw'
import brandSource from './TopBrand.vue?raw'
import navigationSource from './TopNavigation.vue?raw'

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

  it('uses a modern community identity and solid navigation surfaces', () => {
    expect(brandSource).toContain('墨言社区')
    expect(brandSource).not.toContain('THE INK GAZETTE')
    expect(brandSource).not.toContain('brand__seal')
    expect(navigationSource).toContain('发起主题')
    expect(mobileTabsSource).toContain('aria-label="打开社区导航"')
    expect(mobileTabsSource).not.toContain('linear-gradient')
    expect(mobileTabsSource).not.toContain('backdrop-filter')
  })
})
