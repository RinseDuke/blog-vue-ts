import articleSource from './Article.vue?raw'
import commentSectionSource from './comment/CommentSection.vue?raw'
import articleDetailViewSource from '@/views/ArticleDetailView.vue?raw'

function extractBlock(blockSource: string, selector: string) {
  const selectorIndex = blockSource.indexOf(selector)
  const openBraceIndex = blockSource.indexOf('{', selectorIndex)

  if (selectorIndex === -1 || openBraceIndex === -1) throw new Error(`Missing block for ${selector}`)

  let depth = 0
  for (let index = openBraceIndex; index < blockSource.length; index += 1) {
    if (blockSource[index] === '{') depth += 1
    if (blockSource[index] === '}') depth -= 1
    if (depth === 0) return blockSource.slice(openBraceIndex + 1, index)
  }

  throw new Error(`Unclosed block for ${selector}`)
}

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
    expect(articleSource).toContain('class="article-hero__fallback glass-surface"')
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
    const articleFooterIndex = articleSource.indexOf('<footer class="article-footer glass-surface">')

    expect(articleBodyIndex).toBeGreaterThan(-1)
    expect(commentSectionIndex).toBeGreaterThan(articleBodyIndex)
    expect(articleFooterIndex).toBeGreaterThan(commentSectionIndex)
  })

  it('offers a router-link recovery action when article loading fails', () => {
    expect(articleSource).toContain('v-else-if="error" class="article-error glass-surface"')
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

  it('places metadata and actions on glass while keeping long-form prose on a near-solid panel', () => {
    expect(articleSource).toContain('class="article-hero__fallback glass-surface"')
    expect(articleSource).toContain('class="article-reading-panel"')
    expect(articleSource).toContain('class="article-footer glass-surface"')
    expect(articleSource).toContain('background: var(--surface-strong);')
    expect(articleSource).toContain('line-height: 1.85;')
    expect(articleSource).toContain('overflow-wrap: anywhere;')

    const readingPanel = extractBlock(articleSource, '.article-reading-panel')
    expect(readingPanel).not.toContain('backdrop-filter')
    expect(readingPanel).not.toContain('var(--glass-blur)')
  })

  it('gives the detail view breathing room without allowing narrow-screen overflow', () => {
    expect(articleDetailViewSource).toContain('padding: clamp(1rem, 3vw, 2.5rem) 1rem 3rem;')
    expect(articleDetailViewSource).toContain('min-width: 0;')
    expect(articleSource).toContain('width: min(760px, calc(100vw - 2rem));')
    expect(articleSource).toContain('@media (max-width: 390px)')
  })
})
