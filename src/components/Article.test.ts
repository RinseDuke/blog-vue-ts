import articleSource from './Article.vue?raw'
import commentSectionSource from './comment/CommentSection.vue?raw'

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

  it('links the byline to the public author profile route', () => {
    expect(articleSource).toContain(
      `:to="{ name: 'author', params: { id: post.author.id } }"`,
    )
    expect(articleSource).not.toContain('<router-link to="/about" class="article-hero__meta"')
  })

  it('mounts the comment section for a loaded post inside the readable article width', () => {
    expect(articleSource).toContain(
      "import CommentSection from '@/components/comment/CommentSection.vue'",
    )
    expect(articleSource).toContain('<CommentSection :post-id="post.id" />')

    const articleBodyIndex = articleSource.indexOf('class="article-body"')
    const commentSectionIndex = articleSource.indexOf('<CommentSection :post-id="post.id" />')
    const articleProseEndIndex = articleSource.indexOf('</div>', commentSectionIndex)
    const articleFooterIndex = articleSource.indexOf('<footer class="article-footer">')

    expect(articleBodyIndex).toBeGreaterThan(-1)
    expect(commentSectionIndex).toBeGreaterThan(articleBodyIndex)
    expect(articleProseEndIndex).toBeGreaterThan(commentSectionIndex)
    expect(articleFooterIndex).toBeGreaterThan(articleProseEndIndex)
  })

  it('offers a router-link recovery action when article loading fails', () => {
    expect(articleSource).toContain('v-else-if="error" class="article-error"')
    expect(articleSource).toContain('role="alert"')
    expect(articleSource).toContain('<p class="article-error__message">{{ error }}</p>')
    expect(articleSource).toContain(
      '<router-link to="/article" class="article-error__recovery">返回文章列表</router-link>',
    )
  })

  it('reloads comments and reads request state for the current post id', () => {
    expect(commentSectionSource).toContain("import { computed, watch } from 'vue'")
    expect(commentSectionSource).toContain('computed(() => commentStore.isLoading(props.postId))')
    expect(commentSectionSource).toContain('computed(() => commentStore.getError(props.postId))')
    expect(commentSectionSource).toContain('() => props.postId')
    expect(commentSectionSource).toContain('{ immediate: true }')
  })
})
