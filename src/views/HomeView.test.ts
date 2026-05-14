import source from './HomeView.vue?raw'

describe('HomeView source contract', () => {
  it('removes the featured display hero above latest articles', () => {
    expect(source).not.toContain('FeaturedHero')
    expect(source).not.toContain('heroPost')
    expect(source).toContain('sortedPosts.value.slice(0, HOME_POST_LIMIT)')
  })

  it('gives latest articles a distinct lead-and-stream presentation', () => {
    expect(source).toContain('latestLeadPost')
    expect(source).toContain('latestStreamPosts')
    expect(source).toContain('latestDigestPosts')
    expect(source).toContain('class="latest-board"')
    expect(source).toContain('class="latest-lead"')
    expect(source).toContain('class="latest-digest"')
    expect(source).toContain('class="latest-stream"')
    expect(source).toContain('class="latest-digest__item"')
    expect(source).toContain('class="latest-stream__index"')
    expect(source).toContain("grid-template-areas:")
  })
})
