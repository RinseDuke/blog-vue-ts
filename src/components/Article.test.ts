import articleSource from './Article.vue?raw'

describe('Article source contract', () => {
  it('removes the pre-launch feature note while keeping the article footer', () => {
    expect(articleSource).not.toContain('feature-note')
    expect(articleSource).not.toContain('当前详情页已按后端博客模型收口')
    expect(articleSource).toContain('article-footer')
    expect(articleSource).toContain('back-link')
  })

  it('does not keep the top cover image hero branch in article detail', () => {
    expect(articleSource).not.toContain('v-if="post.coverImage"')
    expect(articleSource).not.toContain('class="article-hero__image"')
    expect(articleSource).toContain('class="article-hero__fallback"')
  })
})
