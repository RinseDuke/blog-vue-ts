import source from './AboutView.vue?raw'

function extractBlock(blockSource: string, selector: string) {
  const selectorIndex = blockSource.indexOf(selector)
  const openBraceIndex = blockSource.indexOf('{', selectorIndex)

  if (selectorIndex === -1 || openBraceIndex === -1) throw new Error('Missing block for ' + selector)

  let depth = 0

  for (let index = openBraceIndex; index < blockSource.length; index += 1) {
    if (blockSource[index] === '{') depth += 1
    if (blockSource[index] === '}') depth -= 1
    if (depth === 0) return blockSource.slice(openBraceIndex + 1, index)
  }

  throw new Error('Unclosed block for ' + selector)
}

describe('About view source contract', () => {
  it('keeps a compact mobile hero treatment', () => {
    expect(source).toMatch(/@media \(max-width: 640px\) {[\s\S]*\.profile-hero__banner {\s*min-height: 108px;/)
    expect(source).toMatch(/@media \(max-width: 640px\) {[\s\S]*\.profile-avatar {\s*width: 88px;/)
    expect(source).toMatch(/@media \(max-width: 640px\) {[\s\S]*\.profile-hero__caption {\s*display: none;/)
    expect(source).toMatch(/@media \(max-width: 640px\) {[\s\S]*\.hero-btn {[\s\S]*min-height: 44px;/)
  })

  it('surfaces relationship metrics inside the hero instead of a dedicated card', () => {
    expect(source).toContain('class="profile-hero__relationship"')
    expect(source).toContain('class="profile-hero__relationship-item"')
    expect(source).not.toContain('<h3>关注情况</h3>')
  })

  it('removes the duplicate personal about tab while keeping the sidebar bio editor', () => {
    expect(source).not.toContain("'about'")
    expect(source).not.toContain("label: '关于'")
    expect(source).not.toContain("activeTab === 'about'")
    expect(source).not.toContain('<p class="section-card__eyebrow">关于</p>')
    expect(source).toContain('<h3>个人简介</h3>')
    expect(source).toContain('updateBio')
  })

  it('starts without invented account history or relationships', () => {
    expect(source).not.toContain("joinedAt: '2024/05/12'")
    expect(source).toContain("joinedAt: '未记录'")
    expect(source).toContain("{ label: '关注', value: 0 }")
    expect(source).toContain("{ label: '粉丝', value: 0 }")
  })

  it('separates banner identity ink from profile panel metadata ink', () => {
    const bannerBlock = extractBlock(source, '.profile-hero__banner')
    const bannerIdentityBlock = extractBlock(source, '.profile-hero__banner-identity')
    const headingBlock = extractBlock(source, '.profile-hero__banner-identity h1')
    const accountBlock = extractBlock(source, '.profile-hero__account')
    const captionBlock = extractBlock(source, '.profile-hero__caption')
    const panelMetaBlock = extractBlock(source, '.profile-hero__panel-meta')
    const factsBlock = extractBlock(source, '.profile-hero__facts')
    const relationshipBlock = extractBlock(source, '.profile-hero__relationship-item')
    const relationshipValueBlock = extractBlock(source, '.profile-hero__relationship-item strong')
    const secondaryButtonBlock = extractBlock(source, '.hero-btn--secondary')

    expect(bannerBlock).toContain('var(--profile-hero-bg-start)')
    expect(bannerBlock).toContain('var(--profile-hero-bg-end)')
    expect(bannerIdentityBlock).toContain('text-shadow: 0 1px 2px rgba(18, 44, 47, 0.55);')
    expect(headingBlock).toContain('color: var(--profile-hero-text);')
    expect(accountBlock).toContain('color: var(--profile-hero-muted);')
    expect(captionBlock).toContain('color: var(--profile-hero-muted);')
    expect(panelMetaBlock).toContain('padding-top: 70px;')
    expect(factsBlock).toContain('color: var(--ink-muted);')
    expect(relationshipBlock).toContain('background: var(--surface-strong);')
    expect(relationshipBlock).toContain('color: var(--ink-muted);')
    expect(relationshipValueBlock).toContain('color: var(--ink-strong);')
    expect(secondaryButtonBlock).toContain('color: var(--ink-main);')
  })

  it('keeps panel metadata below the banner overlap on mobile', () => {
    const mobileBlock = extractBlock(source, '@media (max-width: 640px)')
    const panelMetaBlock = extractBlock(mobileBlock, '.profile-hero__panel-meta')

    expect(panelMetaBlock).toContain('padding-top: 34px;')
  })

  it('protects long profile names from the visibility badge at every breakpoint', () => {
    const identityBlock = extractBlock(source, '.profile-hero__banner-identity')
    const headingBlock = extractBlock(source, '.profile-hero__banner-identity h1')
    const accountBlock = extractBlock(source, '.profile-hero__account')
    const mobileBlock = extractBlock(source, '@media (max-width: 640px)')
    const mobileBannerBlock = extractBlock(mobileBlock, '.profile-hero__banner')
    const mobileBadgeBlock = extractBlock(mobileBlock, '.profile-hero__location')
    const mobileIdentityBlock = extractBlock(mobileBlock, '.profile-hero__banner-identity')
    const mobileCaptionBlock = extractBlock(mobileBlock, '.profile-hero__caption')

    expect(identityBlock).toContain('right: 9.5rem;')
    expect(identityBlock).toContain('max-width: calc(100% - 20rem);')
    expect(identityBlock).toContain('min-width: 0;')
    expect(headingBlock).toContain('white-space: nowrap;')
    expect(headingBlock).toContain('overflow: hidden;')
    expect(headingBlock).toContain('text-overflow: ellipsis;')
    expect(accountBlock).toContain('white-space: nowrap;')
    expect(accountBlock).toContain('overflow: hidden;')
    expect(accountBlock).toContain('text-overflow: ellipsis;')
    expect(source).toContain(':title="profile.displayName"')
    expect(source).toContain(':title="\'@\' + profile.username"')

    expect(mobileBannerBlock).toContain('min-height: 108px;')
    expect(mobileBadgeBlock).toContain('display: none;')
    expect(mobileIdentityBlock).toContain('left: 6.8rem;')
    expect(mobileIdentityBlock).toContain('right: 0.9rem;')
    expect(mobileIdentityBlock).toContain('bottom: 2.4rem;')
    expect(mobileIdentityBlock).toContain('max-width: calc(100% - 7.7rem);')
    expect(mobileCaptionBlock).toContain('display: none;')
    expect(source).toContain("{ label: '可见性', value:")
  })
})
