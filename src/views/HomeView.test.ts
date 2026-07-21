import featuredHeroSource from '@/components/post/FeaturedHero.vue?raw'
import postCardSource from '@/components/post/PostCard.vue?raw'
import postListSource from '@/components/post/PostList.vue?raw'
import source from './HomeView.vue?raw'

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

describe('HomeView liquid glass content contract', () => {
  it('keeps post loading semantics while presenting a title, featured stage, and latest flow', () => {
    expect(source).toContain("import FeaturedHero from '@/components/post/FeaturedHero.vue'")
    expect(source).toContain("import PostList from '@/components/post/PostList.vue'")
    expect(source).toContain('const homePosts = computed(() => sortedPosts.value.slice(0, HOME_POST_LIMIT))')
    expect(source).toContain('const heroPost = computed(')
    expect(source).toContain('const latestPosts = computed(')
    expect(source).toContain('class="front__intro"')
    expect(source).toContain('class="front__title"')
    expect(source).toContain('<FeaturedHero v-if="heroPost" :post="heroPost" />')
    expect(source).toContain('<PostList v-if="latestPosts.length"')
    expect(source).toContain('await ensurePosts()')
    expect(source).toContain('await refreshPosts()')
    expect(source).toContain('feed__state--error')
    expect(source).toContain('feed__retry')
    expect(source).toContain('feed__state--empty')
  })

  it('builds the featured article as an ambient stage with one readable glass information layer', () => {
    expect(featuredHeroSource).toContain('class="featured-hero__media"')
    expect(featuredHeroSource).toContain('v-if="post.coverImage"')
    expect(featuredHeroSource).toContain('class="featured-hero__body glass-surface"')
    expect(featuredHeroSource).toContain('class="featured-hero__ambient"')
    expect(featuredHeroSource).toContain(':to="{ name: \'article-detail\', params: { id: post.id } }"')
    expect(featuredHeroSource).toContain('min-height: 44px;')
    expect(featuredHeroSource).toContain('@media (max-width: 768px)')
    expect(featuredHeroSource).toContain('min-height: 300px;')
  })

  it('uses a rhythmic desktop card grid that collapses to one column on mobile', () => {
    expect(postListSource).toContain('grid-template-columns: repeat(12, minmax(0, 1fr));')
    expect(postListSource).toContain('.post-list > :nth-child(3n + 1)')
    expect(postListSource).toContain('@media (max-width: 768px)')
    expect(postListSource).toContain('grid-template-columns: minmax(0, 1fr);')
    expect(postCardSource).toContain('class="post-card glass-surface"')
    expect(postCardSource).toContain('var(--glass-highlight)')
    expect(postCardSource).toContain('transform: translateY(-3px);')
    expect(postCardSource).toContain('overflow-wrap: anywhere;')
    expect(postCardSource).toContain("<slot name=\"footer-actions\" :post=\"post\" />")
    expect(postCardSource).toContain("name: 'article-detail'")
  })

  it('resets every rhythmic nth-child span with equal specificity at responsive breakpoints', () => {
    const tabletBlock = extractBlock(postListSource, '@media (max-width: 1024px)')
    const mobileBlock = extractBlock(postListSource, '@media (max-width: 768px)')
    const responsiveNthChildSelectors = [
      '.post-list > :nth-child(3n + 1)',
      '.post-list > :nth-child(3n + 2)',
      '.post-list > :nth-child(3n)',
    ]

    responsiveNthChildSelectors.forEach((selector) => {
      expect(tabletBlock).toContain(selector)
      expect(mobileBlock).toContain(selector)
    })

    expect(tabletBlock).toContain('grid-column: span 6;')
    expect(mobileBlock).toContain('grid-template-columns: minmax(0, 1fr);')
    expect(mobileBlock).toContain('grid-column: 1 / -1;')
  })
})
