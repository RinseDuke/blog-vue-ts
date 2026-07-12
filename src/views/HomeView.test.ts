import source from './HomeView.vue?raw'

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

  it('keeps the lead excerpt in one natural reading column', () => {
    const excerptBlock = extractBlock(source, '.latest-lead__excerpt')

    expect(excerptBlock).not.toContain('column-count')
    expect(excerptBlock).not.toContain('column-gap')
    expect(excerptBlock).toContain('max-width: 62ch;')
    expect(excerptBlock).toContain('line-height: 1.7;')
  })
})
