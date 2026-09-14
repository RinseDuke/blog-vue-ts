import loginSource from './LoginView.vue?raw'
import registerSource from './RegisterView.vue?raw'
import searchSource from './Search.vue?raw'
import aboutSource from './AboutView.vue?raw'
import footerSource from '@/components/navigation/TopFooter.vue?raw'
import layoutSource from '@/components/community/CommunityLayout.vue?raw'
import appSource from '@/App.vue?raw'
import routerSource from '@/router/index.ts?raw'
import topSearchSource from '@/components/search/TopSearchBox.vue?raw'
import mobileSearchSource from '@/components/search/MobileSearchSheet.vue?raw'
import dropdownSource from '@/components/search/SearchDropdownContent.vue?raw'

describe('remaining community surfaces', () => {
  it('uses focused single-purpose authentication pages', () => {
    expect(loginSource).not.toContain('THE INK GAZETTE')
    expect(loginSource).not.toContain('login-page__brand')
    expect(registerSource).not.toContain('THE INK GAZETTE')
    expect(registerSource).not.toContain('register-page__brand')
  })

  it('reuses the community layout for search and removes editorial labels', () => {
    expect(searchSource).toContain('CommunityLayout')
    expect(searchSource.match(/<template>/g)).toHaveLength(1)
    expect(searchSource).not.toContain('linear-gradient')
    expect(aboutSource).not.toContain('CONTRIBUTOR')
    expect(aboutSource).not.toContain('PUBLICATION LOG')
    expect(aboutSource).not.toContain('WRITING DESK')
    expect(searchSource).toContain('全部主题')
    expect(searchSource).not.toContain('全部文章')
  })

  it('uses a simple community footer', () => {
    expect(footerSource).toContain('墨言社区')
    expect(footerSource).not.toContain('The Ink Gazette')
    expect(footerSource).not.toContain('double')
  })

  it('keeps focused pages distraction-free and moves context below content on mobile', () => {
    expect(appSource).toContain("['write', 'login', 'register']")
    expect(appSource).toContain('!isFocusPage')
    expect(layoutSource).toMatch(/@media \(max-width: 800px\)[\s\S]*community-layout__right[\s\S]*display: block/)
  })

  it('uses community terminology in navigation and search', () => {
    expect(routerSource).toContain("title: '我的主题'")
    expect(routerSource).toContain("title: '全部主题'")
    expect(topSearchSource).toContain('搜索主题')
    expect(mobileSearchSource).toContain('搜索主题')
    expect(dropdownSource).toContain('推荐主题')
  })

  it('starts each route at the top while preserving browser back positions', () => {
    expect(routerSource).toContain('scrollBehavior')
    expect(routerSource).toContain('savedPosition')
    expect(routerSource).toContain('{ top: 0 }')
  })
})
