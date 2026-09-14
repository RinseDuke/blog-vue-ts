import {
  applyMarkdownCommand,
  clearMarkdownFormatting,
  insertHorizontalRule,
  insertLink,
  insertTable,
  mutateMarkdownTable,
  toggleCodeBlock,
  toggleInlineMark,
  toggleLinePrefix,
} from './markdownCommands'
import type { MarkdownCommand } from './markdownCommands'

describe('toggleInlineMark', () => {
  it.each(['**', '*', '~~'] as const)('adds and removes the %s mark', (mark) => {
    const marked = toggleInlineMark('正文', { from: 0, to: 2 }, mark)

    expect(marked).toEqual({
      value: `${mark}正文${mark}`,
      selection: { from: mark.length, to: mark.length + 2 },
    })
    expect(toggleInlineMark(marked.value, marked.selection, mark)).toEqual({
      value: '正文',
      selection: { from: 0, to: 2 },
    })
  })

  it('places an empty selection between the inserted marks', () => {
    expect(toggleInlineMark('正文', { from: 1, to: 1 }, '**')).toEqual({
      value: '正****文',
      selection: { from: 3, to: 3 },
    })
  })

  it('adds and removes italic without consuming surrounding bold marks', () => {
    const italic = toggleInlineMark('**正文**', { from: 2, to: 4 }, '*')

    expect(italic).toEqual({
      value: '***正文***',
      selection: { from: 3, to: 5 },
    })
    expect(toggleInlineMark(italic.value, italic.selection, '*')).toEqual({
      value: '**正文**',
      selection: { from: 2, to: 4 },
    })
  })

  it('adds and removes bold inside existing italic marks', () => {
    const bold = toggleInlineMark('*正文*', { from: 1, to: 3 }, '**')

    expect(bold).toEqual({
      value: '***正文***',
      selection: { from: 3, to: 5 },
    })
    expect(toggleInlineMark(bold.value, bold.selection, '**')).toEqual({
      value: '*正文*',
      selection: { from: 1, to: 3 },
    })
  })
})

describe('toggleLinePrefix', () => {
  it.each(['## ', '### ', '- ', '1. ', '> '] as const)(
    'adds and removes the %s prefix on one line',
    (prefix) => {
      const prefixed = toggleLinePrefix('正文', { from: 0, to: 0 }, prefix)

      expect(prefixed).toEqual({
        value: `${prefix}正文`,
        selection: { from: prefix.length, to: prefix.length },
      })
      expect(toggleLinePrefix(prefixed.value, prefixed.selection, prefix)).toEqual({
        value: '正文',
        selection: { from: 0, to: 0 },
      })
    }
  )

  it('toggles every selected line and keeps the text selected', () => {
    const prefixed = toggleLinePrefix('第一行\n第二行', { from: 0, to: 7 }, '- ')

    expect(prefixed).toEqual({
      value: '- 第一行\n- 第二行',
      selection: { from: 2, to: 11 },
    })
    expect(toggleLinePrefix(prefixed.value, prefixed.selection, '- ')).toEqual({
      value: '第一行\n第二行',
      selection: { from: 0, to: 7 },
    })
  })

  it('preserves CRLF line endings', () => {
    expect(toggleLinePrefix('甲\r\n乙', { from: 0, to: 4 }, '> ')).toEqual({
      value: '> 甲\r\n> 乙',
      selection: { from: 2, to: 8 },
    })
  })

  it('replaces another heading prefix instead of nesting it', () => {
    expect(toggleLinePrefix('## 标题', { from: 3, to: 5 }, '### ')).toEqual({
      value: '### 标题',
      selection: { from: 4, to: 6 },
    })
  })
})

describe('toggleCodeBlock', () => {
  it('wraps and unwraps the selected block with fences', () => {
    const source = 'const value = 1\nreturn value'
    const wrapped = toggleCodeBlock(source, { from: 0, to: source.length })

    expect(wrapped).toEqual({
      value: `\`\`\`\n${source}\n\`\`\``,
      selection: { from: 4, to: 4 + source.length },
    })
    expect(toggleCodeBlock(wrapped.value, wrapped.selection)).toEqual({
      value: source,
      selection: { from: 0, to: source.length },
    })
  })

  it('uses the existing CRLF style', () => {
    expect(toggleCodeBlock('甲\r\n乙', { from: 0, to: 4 })).toEqual({
      value: '```\r\n甲\r\n乙\r\n```',
      selection: { from: 5, to: 9 },
    })
  })

  it('expands an inline selection to full lines and restores that selection', () => {
    const source = '前缀代码后缀'
    const selection = { from: 2, to: 4 }
    const wrapped = toggleCodeBlock(source, selection)

    expect(wrapped).toEqual({
      value: '```\n前缀代码后缀\n```',
      selection: { from: 6, to: 8 },
    })
    expect(toggleCodeBlock(wrapped.value, wrapped.selection)).toEqual({
      value: source,
      selection,
    })
  })

  it('keeps surrounding CRLF lines intact for an inline selection', () => {
    const source = '首行\r\n前缀代码后缀\r\n末行'
    const from = source.indexOf('代码')
    const selection = { from, to: from + 2 }
    const wrapped = toggleCodeBlock(source, selection)
    const expected = '首行\r\n```\r\n前缀代码后缀\r\n```\r\n末行'
    const expectedFrom = expected.indexOf('代码')

    expect(wrapped).toEqual({
      value: expected,
      selection: { from: expectedFrom, to: expectedFrom + 2 },
    })
    expect(toggleCodeBlock(wrapped.value, wrapped.selection)).toEqual({
      value: source,
      selection,
    })
  })

  it('restores a selection that ends at the next line start', () => {
    const source = '第一行\r\n第二行'
    const selection = { from: 0, to: source.indexOf('第二行') }
    const wrapped = toggleCodeBlock(source, selection)

    expect(toggleCodeBlock(wrapped.value, wrapped.selection)).toEqual({
      value: source,
      selection,
    })
  })
})

describe('insertLink', () => {
  it('turns selected text into a link and keeps its label selected', () => {
    expect(insertLink('链接', { from: 0, to: 2 }, 'https://example.com')).toEqual({
      value: '[链接](https://example.com)',
      selection: { from: 1, to: 3 },
    })
  })

  it('inserts and selects a default label at an empty selection', () => {
    expect(insertLink('正文', { from: 1, to: 1 }, 'https://example.com')).toEqual({
      value: '正[链接](https://example.com)文',
      selection: { from: 2, to: 4 },
    })
  })

  it('escapes label and destination characters that would break link syntax', () => {
    const label = String.raw`路径\]说明`
    const address = String.raw`https://example.com/a(b)\c`
    const escapedLabel = String.raw`路径\\\]说明`
    const escapedAddress = String.raw`https://example.com/a\(b\)\\c`

    expect(insertLink(label, { from: 0, to: label.length }, address)).toEqual({
      value: `[${escapedLabel}](${escapedAddress})`,
      selection: { from: 1, to: 1 + escapedLabel.length },
    })
  })

  it('escapes both label brackets and uses an angle destination for spaces', () => {
    const label = '[链接]'
    const escapedLabel = String.raw`\[链接\]`
    const address = 'https://example.com/a b'

    expect(insertLink(label, { from: 0, to: label.length }, address)).toEqual({
      value: `[${escapedLabel}](<${address}>)`,
      selection: { from: 1, to: 1 + escapedLabel.length },
    })
  })
})

describe('insertTable', () => {
  it('inserts a three-column GFM table with a header and two body rows', () => {
    expect(insertTable('', { from: 0, to: 0 })).toEqual({
      value: [
        '| 表头 1 | 表头 2 | 表头 3 |',
        '| --- | --- | --- |',
        '|  |  |  |',
        '|  |  |  |',
      ].join('\n'),
      selection: { from: 2, to: 6 },
    })
  })

  it('uses CRLF when inserting into a CRLF document', () => {
    const result = insertTable('前文\r\n', { from: 4, to: 4 })

    expect(result.value).toBe(
      [
        '前文',
        '| 表头 1 | 表头 2 | 表头 3 |',
        '| --- | --- | --- |',
        '|  |  |  |',
        '|  |  |  |',
      ].join('\r\n')
    )
    expect(result.selection).toEqual({ from: 6, to: 10 })
  })
})

describe('mutateMarkdownTable', () => {
  const table = [
    '| A | B |',
    '| --- | --- |',
    '| 1 | 2 |',
    '| 3 | 4 |',
  ].join('\n')

  it('adds a row after the current body row', () => {
    const expected = [
      '| A | B |',
      '| --- | --- |',
      '| 1 | 2 |',
      '|  |  |',
      '| 3 | 4 |',
    ].join('\n')
    const result = mutateMarkdownTable(table, { from: 30, to: 30 }, 'add-row')
    const emptyRowStart = expected.indexOf('|  |  |')

    expect(result).toEqual({
      value: expected,
      selection: { from: emptyRowStart + 5, to: emptyRowStart + 5 },
    })
  })

  it('adds a column after the current column', () => {
    const expected = [
      '| A | B |  |',
      '| --- | --- | --- |',
      '| 1 | 2 |  |',
      '| 3 | 4 |  |',
    ].join('\n')
    const result = mutateMarkdownTable(table, { from: 30, to: 30 }, 'add-column')
    const currentRowStart = expected.indexOf('| 1 | 2 |  |')

    expect(result).toEqual({
      value: expected,
      selection: { from: currentRowStart + 10, to: currentRowStart + 10 },
    })
  })

  it('deletes the current body row', () => {
    const expected = ['| A | B |', '| --- | --- |', '| 3 | 4 |'].join('\n')
    const result = mutateMarkdownTable(table, { from: 30, to: 30 }, 'delete-row')
    const remainingBodyStart = expected.indexOf('| 3 | 4 |')

    expect(result).toEqual({
      value: expected,
      selection: { from: remainingBodyStart + 6, to: remainingBodyStart + 6 },
    })
  })

  it('deletes the current column', () => {
    const expected = ['| A |', '| --- |', '| 1 |', '| 3 |'].join('\n')
    const result = mutateMarkdownTable(table, { from: 30, to: 30 }, 'delete-column')
    const currentRowStart = expected.indexOf('| 1 |')

    expect(result).toEqual({
      value: expected,
      selection: { from: currentRowStart + 2, to: currentRowStart + 2 },
    })
  })

  it('deletes the whole table', () => {
    expect(mutateMarkdownTable(table, { from: 30, to: 30 }, 'delete-table')).toEqual({
      value: '',
      selection: { from: 0, to: 0 },
    })
  })

  it('does not split a cell at an escaped pipe', () => {
    const escapedTable = [
      '| A \\| B | C |',
      '| --- | --- |',
      '| 1 | 2 |',
    ].join('\n')
    const expected = ['| C |', '| --- |', '| 2 |'].join('\n')

    expect(
      mutateMarkdownTable(escapedTable, { from: 2, to: 2 }, 'delete-column').value
    ).toBe(expected)
  })

  it('preserves CRLF while mutating a table', () => {
    const crlfTable = table.split('\n').join('\r\n')
    const result = mutateMarkdownTable(crlfTable, { from: 32, to: 32 }, 'add-row')

    expect(result.value).toContain('| 1 | 2 |\r\n|  |  |\r\n| 3 | 4 |')
    expect(result.value.split('\r\n').join('')).not.toContain('\n')
  })

  it('returns the source unchanged when the selection is outside a standard table', () => {
    expect(mutateMarkdownTable('普通正文', { from: 2, to: 2 }, 'add-row')).toEqual({
      value: '普通正文',
      selection: { from: 2, to: 2 },
    })
  })

  it('includes a short body row when adding a column', () => {
    const source = [
      '| A | B | C |',
      '| --- | --- | --- |',
      '| 1 | 2 |',
      '| 3 | 4 | 5 |',
    ].join('\n')
    const expected = [
      '| A | B |  | C |',
      '| --- | --- | --- | --- |',
      '| 1 | 2 |  |  |',
      '| 3 | 4 |  | 5 |',
    ].join('\n')
    const result = mutateMarkdownTable(
      source,
      { from: source.indexOf('2'), to: source.indexOf('2') },
      'add-column'
    )
    const currentRowStart = expected.indexOf('| 1 | 2 |  |  |')

    expect(result).toEqual({
      value: expected,
      selection: { from: currentRowStart + 10, to: currentRowStart + 10 },
    })
  })

  it('preserves extra cells from a long body row when deleting a column', () => {
    const source = [
      '| A | B |',
      '| --- | --- |',
      '| 1 | 2 | 额外 |',
      '| 3 | 4 |',
    ].join('\n')
    const expected = [
      '| A |  |',
      '| --- | --- |',
      '| 1 | 额外 |',
      '| 3 |  |',
    ].join('\n')

    expect(
      mutateMarkdownTable(
        source,
        { from: source.indexOf('B'), to: source.indexOf('B') },
        'delete-column'
      )
    ).toEqual({
      value: expected,
      selection: { from: 6, to: 6 },
    })
  })

  it('preserves surrounding CRLF content while changing an embedded table', () => {
    const embeddedTable = table.split('\n').join('\r\n')
    const source = `前文\r\n\r\n${embeddedTable}\r\n\r\n后文`
    const expectedTable = [
      '| A | B |',
      '| --- | --- |',
      '| 1 | 2 |',
      '|  |  |',
      '| 3 | 4 |',
    ].join('\r\n')
    const expected = `前文\r\n\r\n${expectedTable}\r\n\r\n后文`
    const cursor = source.indexOf('2')

    expect(mutateMarkdownTable(source, { from: cursor, to: cursor }, 'add-row').value).toBe(
      expected
    )
  })
})

describe('insertHorizontalRule', () => {
  it('inserts a horizontal rule and places the cursor after it', () => {
    expect(insertHorizontalRule('', { from: 0, to: 0 })).toEqual({
      value: '---',
      selection: { from: 3, to: 3 },
    })
  })
})

describe('clearMarkdownFormatting', () => {
  it('removes common block and inline syntax while preserving text', () => {
    const fence = String.fromCharCode(96).repeat(3)
    const source = [
      '## **标题**',
      '> - [链接](https://example.com) 与 ~~删除~~、`代码`',
      fence,
      'const value = 1',
      fence,
    ].join('\n')
    const plain = ['标题', '链接 与 删除、代码', 'const value = 1'].join('\n')

    expect(clearMarkdownFormatting(source, { from: 0, to: source.length })).toEqual({
      value: plain,
      selection: { from: 0, to: plain.length },
    })
  })

  it('preserves identifier underscores while removing underscore emphasis', () => {
    const source = 'foo_bar_baz 与 _强调_'
    const plain = 'foo_bar_baz 与 强调'

    expect(clearMarkdownFormatting(source, { from: 0, to: source.length })).toEqual({
      value: plain,
      selection: { from: 0, to: plain.length },
    })
  })

  it('preserves multiplication stars while clearing real emphasis', () => {
    const source = '价格 * 数量 * 税率；*强调* 与 _重点_'
    const plain = '价格 * 数量 * 税率；强调 与 重点'

    expect(clearMarkdownFormatting(source, { from: 0, to: source.length })).toEqual({
      value: plain,
      selection: { from: 0, to: plain.length },
    })
  })
})

describe('applyMarkdownCommand', () => {
  const commands: MarkdownCommand[] = [
    'undo',
    'redo',
    'heading-2',
    'heading-3',
    'bold',
    'italic',
    'strike',
    'bullet-list',
    'ordered-list',
    'blockquote',
    'code-block',
    'link',
    'table',
    'add-row',
    'add-column',
    'delete-row',
    'delete-column',
    'delete-table',
    'horizontal-rule',
    'clear-formatting',
  ]

  it('exposes the complete toolbar command set', () => {
    expect(commands).toHaveLength(20)
  })

  it('leaves undo and redo to CodeMirror', () => {
    const selection = { from: 1, to: 1 }

    expect(applyMarkdownCommand('正文', selection, 'undo')).toEqual({
      value: '正文',
      selection,
    })
    expect(applyMarkdownCommand('正文', selection, 'redo')).toEqual({
      value: '正文',
      selection,
    })
  })

  it('dispatches source mutations', () => {
    expect(applyMarkdownCommand('正文', { from: 0, to: 2 }, 'bold')).toEqual({
      value: '**正文**',
      selection: { from: 2, to: 4 },
    })
  })
})
