// @ts-expect-error The app tsconfig excludes Node built-in declarations used by this test.
import { readFileSync } from 'node:fs'

import footerSource from '@/components/navigation/TopFooter.vue?raw'

const source = readFileSync(new URL('./base.css', import.meta.url), 'utf8')

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

describe('base theme source contract', () => {
  it('provides readable warm ink and dependent post colors in dark mode', () => {
    const darkThemeBlock = extractBlock(source, ":root[data-theme='dark']")
    const footerBlock = extractBlock(footerSource, '.footer')
    const footerLinksBlock = extractBlock(footerSource, '.footer__links a')

    expect(darkThemeBlock).toContain('--ink-main: #e2d8c8;')
    expect(darkThemeBlock).toContain('--ink-muted: #b8ac98;')
    expect(darkThemeBlock).toContain('--post-card-text: var(--ink-main);')
    expect(darkThemeBlock).toContain('--post-card-meta: var(--ink-muted);')
    expect(footerBlock).toContain('color: var(--ink-muted);')
    expect(footerLinksBlock).toContain('color: var(--ink-muted);')
  })

  it('defines dedicated high-contrast profile hero ink tokens', () => {
    const rootBlock = extractBlock(source, ':root')

    expect(rootBlock).toContain('--profile-hero-text: #fff8eb;')
    expect(rootBlock).toContain('--profile-hero-muted: rgba(255, 248, 235, 0.78);')
  })
})
