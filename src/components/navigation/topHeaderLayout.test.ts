import appSource from '@/App.vue?raw'
import topHeaderLayoutSource from './TopHeaderLayout.vue?raw'
import baseCssSource from '@/assets/base.css?raw'
import topSearchBoxSource from '@/components/search/TopSearchBox.vue?raw'

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findBlockRange(source: string, selector: string) {
  const pattern = new RegExp(`${escapeForRegExp(selector)}\\s*\\{`)
  const match = pattern.exec(source)

  if (!match) {
    throw new Error(`Missing block for ${selector}`)
  }

  const openBraceIndex = match.index + match[0].length - 1
  let depth = 0

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const currentChar = source[index]

    if (currentChar === '{') {
      depth += 1
    }

    if (currentChar === '}') {
      depth -= 1

      if (depth === 0) {
        return {
          blockStart: openBraceIndex + 1,
          blockEnd: index,
        }
      }
    }
  }

  throw new Error(`Unclosed block for ${selector}`)
}

function extractBlock(source: string, selector: string) {
  const range = findBlockRange(source, selector)
  return source.slice(range.blockStart, range.blockEnd)
}

describe('top header layout source contract', () => {
  it('uses a solid topbar shell instead of a floating glass card', () => {
    const topbarBlock = extractBlock(topHeaderLayoutSource, '.topbar')
    const topbarInnerBlock = extractBlock(topHeaderLayoutSource, '.topbar__inner')
    const hiddenTopbarBlock = extractBlock(topHeaderLayoutSource, '.topbar.hidden')
    const layoutBlock = extractBlock(appSource, '.layout')
    const desktopTopbarBlock = extractBlock(appSource, '.desktop-topbar')
    const searchBoxBlock = extractBlock(topSearchBoxSource, '.search-box')
    const searchInputWrapperBlock = extractBlock(topSearchBoxSource, '.search-input-wrapper')
    const mobileMediaBlock = extractBlock(topHeaderLayoutSource, '@media (max-width: 768px)')
    const mobileTopbarBlock = extractBlock(mobileMediaBlock, '.topbar')
    const mobileTopbarInnerBlock = extractBlock(mobileMediaBlock, '.topbar__inner')
    const mobileLayoutMediaBlock = extractBlock(appSource, '@media (max-width: 768px)')
    const mobileLayoutBlock = extractBlock(mobileLayoutMediaBlock, '.layout')

    expect(topbarBlock).toContain('padding: 0 1rem;')
    expect(topbarBlock).toContain('background: color-mix(in srgb, var(--surface-strong) 96%, var(--bg-canvas) 4%);')
    expect(topbarBlock).toContain('border-bottom: 1px solid color-mix(in srgb, var(--line-strong) 82%, transparent);')
    expect(topbarBlock).not.toContain('background: transparent;')

    expect(topbarInnerBlock).toContain('width: min(1360px, 100%);')
    expect(topbarInnerBlock).toContain('gap: 0.72rem;')
    expect(topbarInnerBlock).toContain('min-height: 68px;')
    expect(topbarInnerBlock).toContain('padding: 0.7rem 0;')
    expect(topbarInnerBlock).not.toContain('border-radius: 24px;')
    expect(topbarInnerBlock).not.toContain('backdrop-filter')
    expect(topbarInnerBlock).not.toContain('box-shadow')
    expect(hiddenTopbarBlock).toContain('transform: translateY(-100%);')

    expect(layoutBlock).toContain('padding-top: 68px;')
    expect(desktopTopbarBlock).toContain('gap: 0.72rem;')
    expect(searchBoxBlock).toContain('padding: 0 0.1rem;')
    expect(searchInputWrapperBlock).toContain('max-width: 700px;')
    expect(mobileTopbarBlock).toContain('padding: 0 0.75rem;')
    expect(mobileTopbarInnerBlock).toContain('min-height: 52px;')
    expect(mobileTopbarInnerBlock).toContain('padding: 0.35rem 0;')
    expect(mobileLayoutBlock).toContain('padding-top: 52px;')
  })

  it('removes the dark-mode glass override from the topbar inner shell', () => {
    expect(baseCssSource).not.toContain("html[data-theme='dark'] .topbar__inner {")
  })
})
