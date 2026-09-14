import articleSource from './Article.vue?raw'
import { readFileSync } from 'node:fs'

const baseSource = readFileSync(new URL('../assets/base.css', import.meta.url), 'utf8')

describe('Article source contract', () => {
  it('renders the first post and replies inside the community layout', () => {
    expect(articleSource).toContain('CommunityLayout')
    expect(articleSource).toContain('topic-first-post')
    expect(articleSource).toContain('ArticleContextRail')
    expect(articleSource).toContain('ReadingProgress')
    expect(articleSource).toContain('CommentSection')
    expect(articleSource).not.toContain('article-hero__rule')
    expect(articleSource).not.toContain('article-hero__fallback')
  })

  it('keeps a readable sanitized article body without a cover hero', () => {
    expect(articleSource).not.toContain('v-if="post.coverImage"')
    expect(articleSource).not.toContain('class="article-hero__image"')
    expect(articleSource).toContain('DOMPurify.sanitize')
    expect(articleSource).toContain('class="article-body"')
    expect(articleSource).toContain('topic-actions')
  })

  it('uses the shared markdown preview and keeps a sanitized legacy HTML path', () => {
    expect(articleSource).toContain("import MarkdownPreview from '@/components/post/MarkdownPreview.vue'")
    expect(articleSource).toContain('<MarkdownPreview')
    expect(articleSource).toContain('isHistoricalHtml')
    expect(articleSource).toContain('stripLeadingMarkdownTitle')
    expect(articleSource).toContain(':source="markdownSource"')
    expect(articleSource).toContain('v-html="safeHtml"')
    expect(articleSource).toContain('DOMPurify.sanitize')
    expect(articleSource).toMatch(/const candidates = \[source\?\.markdown, source\?\.content/)
  })

  it('does not classify every leading angle bracket as legacy HTML', () => {
    expect(articleSource).toMatch(/const\s+historicalHtmlPattern\s*=\s*\/\^\\s\*<\(/)
    expect(articleSource).toContain('HTML_BLOCK_TAGS')
    expect(articleSource).toContain('const contentMode = computed')
  })

  it('uses shared typography and editor color tokens without active-line boxes', () => {
    expect(articleSource).toMatch(/\.article-body\s*\{[\s\S]*font-family:\s*var\(--font-body\)/)
    expect(articleSource).toMatch(/\.article-body\s*:deep\(h1\)[\s\S]*font-family:\s*var\(--font-display\)/)
    expect(articleSource).toMatch(/\.article-body\s*:deep\(code\)[\s\S]*font-family:\s*var\(--font-mono\)/)
    expect(articleSource).not.toContain('highlightActiveLine')
    expect(articleSource).not.toContain('.cm-activeLine')
    expect(articleSource).not.toContain('.cm-activeLineGutter')
  })
})

describe('article typography tokens', () => {
  it('defines low-contrast syntax and strong caret colors for both themes', () => {
    expect(baseSource).toContain('--write-markdown-syntax: #aaa4a0;')
    expect(baseSource).toContain('--write-markdown-caret: var(--ink-strong);')
    expect(baseSource).toMatch(/:root\[data-theme=['"]dark['"]\][\s\S]*--write-markdown-syntax:/)
    expect(baseSource).toMatch(/:root\[data-theme=['"]dark['"]\][\s\S]*--write-markdown-caret:/)
  })

  it('keeps the three shared font variables available', () => {
    expect(baseSource).toContain('--font-body:')
    expect(baseSource).toContain('--font-display:')
    expect(baseSource).toContain('--font-mono:')
    expect(baseSource).not.toContain('@import url(')
  })
})
