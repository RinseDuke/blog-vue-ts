import {
  createMarkdownDecorationState,
  getMarkdownDecorationRanges,
  getMinimalTextChange,
  updateMarkdownDecorationState,
  type MarkdownDecorationRange,
} from './livePreviewDecorations'

function rangesFor(
  source: string,
  activePosition: number,
  kind: MarkdownDecorationRange['kind']
) {
  return getMarkdownDecorationRanges(source, activePosition)
    .filter((range) => range.kind === kind)
    .map(({ from, to }) => source.slice(from, to))
}

describe('getMarkdownDecorationRanges', () => {
  it.each([
    ['标题', '## 标题', ['## ']],
    ['加粗', '**加粗**', ['**', '**']],
    ['斜体', '*斜体*', ['*', '*']],
    ['删除线', '~~删除~~', ['~~', '~~']],
    ['链接', '[链接](https://example.com)', ['[', '](https://example.com)']],
    ['任务列表', '- [x] 已完成', ['- [x] ']],
    ['引用', '> 引用', ['> ']],
    ['行内代码', '`代码`', ['`', '`']],
    ['行内公式', '$x + y$', ['$', '$']],
    ['脚注', '正文[^note]', ['[', '^', ']']],
  ])('returns syntax ranges for %s on the active logical line', (_name, markdown, marks) => {
    const source = `普通行\n${markdown}`

    expect(rangesFor(source, source.indexOf(markdown) + 1, 'syntax')).toEqual(marks)
    expect(rangesFor(source, source.indexOf(markdown) + 1, 'hidden')).toEqual([])
  })

  it.each([
    ['标题', '## 标题', ['## ']],
    ['加粗', '**加粗**', ['**', '**']],
    ['斜体', '*斜体*', ['*', '*']],
    ['删除线', '~~删除~~', ['~~', '~~']],
    ['链接', '[链接](https://example.com)', ['[', '](https://example.com)']],
    ['任务列表', '- [ ] 待办', ['- [ ] ']],
    ['引用', '> 引用', ['> ']],
    ['行内代码', '`代码`', ['`', '`']],
    ['行内公式', '$x + y$', ['$', '$']],
    ['脚注', '正文[^1]', ['[', '^', ']']],
  ])('returns hidden ranges for %s away from the active logical line', (_name, markdown, marks) => {
    const source = `${markdown}\n普通行`

    expect(rangesFor(source, source.length - 1, 'hidden')).toEqual(marks)
    expect(rangesFor(source, source.length - 1, 'syntax')).toEqual([])
  })

  it('keeps combined inline marks ordered and non-overlapping', () => {
    const source = '## **粗体与 *斜体*、~~删除~~、[链接](https://example.com)、`代码`、$x$[^1]**'
    const ranges = getMarkdownDecorationRanges(source, source.length)

    expect(ranges).toEqual([...ranges].sort((left, right) => left.from - right.from))
    expect(ranges.every((range, index) => index === 0 || ranges[index - 1].to <= range.from)).toBe(
      true
    )
  })

  it('uses the cursor head line with CRLF documents and leaves empty lines undecorated', () => {
    const source = '**第一行**\r\n\r\n*第三行*'
    const ranges = getMarkdownDecorationRanges(source, source.indexOf('第三行'))

    expect(rangesFor(source, source.indexOf('第三行'), 'hidden')).toEqual(['**', '**'])
    expect(rangesFor(source, source.indexOf('第三行'), 'syntax')).toEqual(['*', '*'])
    expect(ranges.some((range) => source.slice(range.from, range.to).includes('\r'))).toBe(false)
  })

  it('does not treat escaped markers or currency as Markdown syntax', () => {
    const source = String.raw`\*普通星号\*，价格 $5，转义 \$x$`

    expect(getMarkdownDecorationRanges(source, source.length)).toEqual([])
  })

  it('treats fenced code delimiters as line-local syntax', () => {
    const source = '```ts\nconst value = 1\n```\n普通行'

    expect(rangesFor(source, source.length, 'hidden')).toEqual(['```ts', '```'])
    expect(rangesFor(source, source.indexOf('value'), 'syntax')).toEqual([])
    expect(rangesFor(source, source.indexOf('```ts'), 'syntax')).toEqual(['```ts'])
  })

  it('supports tilde fenced code delimiters', () => {
    const source = '~~~js\nconst value = 1\n~~~\n普通行'

    expect(rangesFor(source, source.length, 'hidden')).toEqual(['~~~js', '~~~'])
  })

  it('reuses marker analysis within the same document and skips same-line updates', () => {
    const source = '**第一行**\n*第二行*'
    const initial = createMarkdownDecorationState(source, source.indexOf('第一行'))
    const sameLine = updateMarkdownDecorationState(
      initial,
      source,
      source.indexOf('第一行') + 1
    )
    const nextLine = updateMarkdownDecorationState(initial, source, source.indexOf('第二行'))
    const changedDocument = updateMarkdownDecorationState(
      nextLine,
      `${source}\n~~第三行~~`,
      source.length
    )

    expect(sameLine).toBe(initial)
    expect(nextLine).not.toBe(initial)
    expect(nextLine.analysis).toBe(initial.analysis)
    expect(changedDocument.analysis).not.toBe(initial.analysis)
  })

  it('finds the smallest contiguous change using common prefixes and suffixes', () => {
    expect(getMinimalTextChange('前正文后', '前**正文**后')).toEqual({
      from: 1,
      to: 3,
      insert: '**正文**',
    })
    expect(getMinimalTextChange('相同', '相同')).toBeNull()
  })

  it('scans long unmatched delimiter runs without quadratic work', () => {
    const source = `${'*a '.repeat(60_000)}*`
    const startedAt = performance.now()

    getMarkdownDecorationRanges(source, source.length)

    expect(performance.now() - startedAt).toBeLessThan(2_000)
  })
})
