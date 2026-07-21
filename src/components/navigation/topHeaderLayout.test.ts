import appSource from '@/App.vue?raw'
import topHeaderLayoutSource from './TopHeaderLayout.vue?raw'
import topSearchBoxSource from '@/components/search/TopSearchBox.vue?raw'
import topBrandSource from './TopBrand.vue?raw'
import topNavigationSource from './TopNavigation.vue?raw'
import topThemeToggleSource from './TopThemeToggle.vue?raw'

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
  it('uses a floating glass topbar that tightens and gains definition after scrolling', () => {
    const topbarBlock = extractBlock(topHeaderLayoutSource, '.topbar')
    const scrolledTopbarBlock = extractBlock(topHeaderLayoutSource, '.topbar.scrolled')
    const topbarInnerBlock = extractBlock(topHeaderLayoutSource, '.topbar__inner')
    const hiddenTopbarBlock = extractBlock(topHeaderLayoutSource, '.topbar.hidden')
    const condensedInnerBlock = extractBlock(topHeaderLayoutSource, '.topbar.condensed .topbar__inner')
    const layoutBlock = extractBlock(appSource, '.layout')
    const desktopTopbarBlock = extractBlock(appSource, '.desktop-topbar')
    const searchBoxBlock = extractBlock(topSearchBoxSource, '.search-box')
    const searchInputWrapperBlock = extractBlock(topSearchBoxSource, '.search-input-wrapper')
    const mobileMediaBlock = extractBlock(topHeaderLayoutSource, '@media (max-width: 768px)')
    const mobileTopbarBlock = extractBlock(mobileMediaBlock, '.topbar')
    const mobileTopbarInnerBlock = extractBlock(mobileMediaBlock, '.topbar__inner')
    const mobileLayoutMediaBlock = extractBlock(appSource, '@media (max-width: 768px)')
    const mobileLayoutBlock = extractBlock(mobileLayoutMediaBlock, '.layout')

    expect(topbarBlock).toContain('width: calc(100% - 2rem);')
    expect(topbarBlock).toContain('max-width: 1388px;')
    expect(topbarBlock).toContain('top: 0.75rem;')
    expect(topbarBlock).toContain('background: var(--glass-surface);')
    expect(topbarBlock).toContain('border: 1px solid var(--glass-border);')
    expect(topbarBlock).toContain('box-shadow: var(--glass-shadow);')
    expect(topbarBlock).toContain('backdrop-filter: blur(var(--glass-blur)) saturate(145%);')
    expect(topbarBlock).toContain('border-radius: 22px;')

    expect(scrolledTopbarBlock).toContain('border-color: color-mix(in srgb, var(--glass-border) 78%, var(--line-strong) 22%);')
    expect(scrolledTopbarBlock).toContain('box-shadow: var(--glass-shadow), var(--nav-shadow-scrolled);')
    expect(topHeaderLayoutSource).toMatch(
      /\.topbar\.condensed\s*\{[^}]*top: 0\.5rem;[^}]*width: calc\(100% - 2\.5rem\);/s
    )
    expect(condensedInnerBlock).toContain('min-height: 54px;')

    expect(topbarInnerBlock).toContain('width: min(1360px, 100%);')
    expect(topbarInnerBlock).toContain('gap: 0.65rem;')
    expect(topbarInnerBlock).toContain('min-height: 60px;')
    expect(topbarInnerBlock).toContain('padding: 0.35rem 0;')
    expect(hiddenTopbarBlock).toContain('transform: translate(-50%, calc(-100% - 1.5rem));')

    expect(layoutBlock).toContain('padding-top: 84px;')
    expect(desktopTopbarBlock).toContain('gap: 0.65rem;')
    expect(searchBoxBlock).toContain('padding: 0 0.15rem;')
    expect(searchInputWrapperBlock).toContain('max-width: 640px;')
    expect(mobileTopbarBlock).toContain('width: calc(100% - 1rem);')
    expect(mobileTopbarBlock).toContain('top: 0.5rem;')
    expect(mobileTopbarInnerBlock).toContain('min-height: 52px;')
    expect(mobileTopbarInnerBlock).toContain('padding: 0.25rem 0;')
    expect(mobileLayoutBlock).toContain('padding-top: 68px;')
  })

  it('shares the glass tokens across navigation, brand, theme and search controls', () => {
    expect(topNavigationSource).toContain('background: var(--glass-surface);')
    expect(topNavigationSource).toContain('border: 1px solid var(--glass-border);')
    expect(topBrandSource).toContain('background: var(--glass-surface);')
    expect(topBrandSource).toContain('border: 1px solid var(--glass-border);')
    expect(topThemeToggleSource).toContain('background: var(--glass-surface);')
    expect(topThemeToggleSource).toContain('border: 1px solid var(--glass-border);')
    expect(topSearchBoxSource).toContain('background: var(--glass-surface);')
    expect(topSearchBoxSource).toContain('border: 1px solid var(--glass-border);')
    expect(topSearchBoxSource).toContain('box-shadow: var(--glass-shadow);')
  })
})
