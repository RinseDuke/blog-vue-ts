import source from './HomeView.vue?raw'

describe('HomeView source contract', () => {
  it('renders one unified community topic stream without a hero image', () => {
    expect(source).not.toContain('FeaturedHero')
    expect(source).not.toContain('heroPost')
    expect(source).toContain('sortedPosts.value.slice(0, HOME_POST_LIMIT)')
    expect(source).toContain('CommunityLayout')
    expect(source).toContain('TopicList')
    expect(source).toContain('CommunityContextRail')
    expect(source).toContain('社区动态')
    expect(source).not.toContain('masthead')
    expect(source).not.toContain('class="press"')
    expect(source).not.toContain('class="lead"')
    expect(source).not.toContain('class="dispatch"')
  })
})
