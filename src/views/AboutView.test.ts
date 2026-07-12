import source from './AboutView.vue?raw'

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
})
