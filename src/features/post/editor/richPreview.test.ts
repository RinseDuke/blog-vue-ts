// @vitest-environment jsdom
import { getRichPreviewRanges } from './richPreview'
import { getMarkdownDecorationRanges } from './livePreviewDecorations'

describe('rich preview safety and source boundaries', () => {
  it.each([
    '````md\n```\n**原样** $x$ ![图](/x)\n````',
    '> ~~~md\n> **原样** $x$ ![图](/x)\n> ~~~',
    '    **原样** $x$ ![图](/x)',
    '```md\n**原样** $x$ ![图](/x)',
  ])('does not decorate literal code: %s', (source) => {
    expect(getRichPreviewRanges(source)).toEqual([])
    const ranges = getMarkdownDecorationRanges(source + '\n\n结尾', 0)
    expect(ranges.map((range) => source.slice(range.from, range.to))).not.toContain('**')
  })

  it('does not render formulas or images inside inline code', () => {
    expect(getRichPreviewRanges('`$x$ ![图](/x)`')).toEqual([])
  })

  it('supports escaped pipes and column alignment without author HTML', () => {
    const source = '| 左 | 右 |\n| :--- | ---: |\n| a\\|b | <img src=x onerror=alert(1)> |'
    const previews = getRichPreviewRanges(source)
    expect(previews).toHaveLength(3)
    const html = previews.at(-1)!.html
    expect(html).toContain('a|b')
    expect(html).toContain('text-align:right')
    expect(html).not.toContain('<img')
  })

  it('rejects unsafe image destinations and untrusted math commands', () => {
    const html = getRichPreviewRanges('![x](javascript:alert(1))\n$\\href{javascript:alert(1)}{x}$').map((range) => range.html).join('')
    const host = document.createElement('div')
    host.innerHTML = html
    expect(host.querySelector('a, script, iframe, form, img')).toBeNull()
  })

  it('renders single-line display math but leaves prices and escaped dollars literal', () => {
    expect(getRichPreviewRanges('$$x^2$$')[0]?.html).toContain('katex-display')
    expect(getRichPreviewRanges('价格 $5 和 $10，\\$x\\$')).toEqual([])
  })
})
