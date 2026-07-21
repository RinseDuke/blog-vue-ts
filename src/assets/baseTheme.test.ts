// @ts-expect-error The app tsconfig excludes Node built-in declarations used by this test.
import { readFileSync } from 'node:fs'

import footerSource from '@/components/navigation/TopFooter.vue?raw'

const source = readFileSync(new URL('./base.css', import.meta.url), 'utf8')
const mainSource = readFileSync(new URL('./main.css', import.meta.url), 'utf8')

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

type Rgba = { red: number; green: number; blue: number; alpha: number }

function extractToken(block: string, token: string) {
  const match = new RegExp(`${token}:\\s*(#[0-9a-f]{6}|rgba\\([^)]+\\));`, 'i').exec(block)
  if (!match) throw new Error(`Missing explicit color token ${token}`)
  return match[1]
}

function parseColor(value: string): Rgba {
  if (value.startsWith('#')) {
    return {
      red: Number.parseInt(value.slice(1, 3), 16),
      green: Number.parseInt(value.slice(3, 5), 16),
      blue: Number.parseInt(value.slice(5, 7), 16),
      alpha: 1,
    }
  }

  const channels = value.match(/[\d.]+/g)?.map(Number)
  if (!channels || channels.length !== 4) throw new Error(`Invalid rgba color ${value}`)
  return { red: channels[0], green: channels[1], blue: channels[2], alpha: channels[3] }
}

function composite(foreground: Rgba, background: Rgba): Rgba {
  return {
    red: foreground.red * foreground.alpha + background.red * (1 - foreground.alpha),
    green: foreground.green * foreground.alpha + background.green * (1 - foreground.alpha),
    blue: foreground.blue * foreground.alpha + background.blue * (1 - foreground.alpha),
    alpha: 1,
  }
}

function relativeLuminance(color: Rgba) {
  const linear = [color.red, color.green, color.blue].map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

function contrastRatio(foreground: Rgba, background: Rgba) {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('base theme source contract', () => {
  it('defines liquid glass tokens for light and dark themes', () => {
    const rootBlock = extractBlock(source, ':root')
    const darkThemeBlock = extractBlock(source, ":root[data-theme='dark']")
    const glassTokens = [
      '--glass-surface',
      '--glass-border',
      '--glass-highlight',
      '--glass-shadow',
      '--glass-blur',
    ]

    for (const token of glassTokens) {
      expect(rootBlock).toContain(`${token}:`)
      expect(darkThemeBlock).toContain(`${token}:`)
    }
  })

  it('provides a reusable glass surface with a no-backdrop-filter fallback', () => {
    const glassSurfaceBlock = extractBlock(mainSource, '.glass-surface')
    const fallbackBlock = extractBlock(
      mainSource,
      '@supports not (backdrop-filter: blur(1px))',
    )

    expect(glassSurfaceBlock).toContain('background: var(--glass-surface);')
    expect(glassSurfaceBlock).toContain('border: 1px solid var(--glass-border);')
    expect(glassSurfaceBlock).toContain('box-shadow: var(--glass-shadow);')
    expect(glassSurfaceBlock).toContain(
      'backdrop-filter: blur(var(--glass-blur)) saturate(145%);',
    )
    expect(fallbackBlock).toContain('.glass-surface')
    expect(fallbackBlock).toContain('background: var(--surface-strong);')
  })

  it('keeps dark theme main and muted ink readable across canvas and surfaces', () => {
    const darkThemeBlock = extractBlock(source, ":root[data-theme='dark']")
    const footerBlock = extractBlock(footerSource, '.footer')
    const footerLinksBlock = extractBlock(footerSource, '.footer__links a')

    const mainInk = parseColor(extractToken(darkThemeBlock, '--ink-main'))
    const mutedInk = parseColor(extractToken(darkThemeBlock, '--ink-muted'))
    const backgrounds = ['--bg-canvas', '--surface', '--surface-strong'].map((token) =>
      parseColor(extractToken(darkThemeBlock, token)),
    )

    for (const background of backgrounds) {
      expect(contrastRatio(mainInk, background)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(mutedInk, background)).toBeGreaterThanOrEqual(4.5)
    }
    expect(darkThemeBlock).toContain('--post-card-text: var(--ink-main);')
    expect(darkThemeBlock).toContain('--post-card-meta: var(--ink-muted);')
    expect(footerBlock).toContain('color: var(--ink-muted);')
    expect(footerLinksBlock).toContain('color: var(--ink-muted);')
  })

  it('keeps profile hero text readable against every dark banner stop', () => {
    const rootBlock = extractBlock(source, ':root')

    const heroText = parseColor(extractToken(rootBlock, '--profile-hero-text'))
    const heroMuted = parseColor(extractToken(rootBlock, '--profile-hero-muted'))
    const bannerStops = ['--profile-hero-bg-start', '--profile-hero-bg-end'].map((token) =>
      parseColor(extractToken(rootBlock, token)),
    )

    for (const background of bannerStops) {
      expect(contrastRatio(heroText, background)).toBeGreaterThanOrEqual(3)
      expect(contrastRatio(composite(heroMuted, background), background)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
