import {
  normalizeWriteMarkdown,
  renderWriteMarkdownToHtml,
  serializeEditorHtmlToMarkdown,
} from './writeMarkdown'

describe('write markdown table roundtrip', () => {
  it('serializes empty tiptap tables into valid markdown tables', () => {
    const emptyTableHtml = `
      <table>
        <tbody>
          <tr>
            <th colspan="1" rowspan="1"><p></p></th>
            <th colspan="1" rowspan="1"><p></p></th>
            <th colspan="1" rowspan="1"><p></p></th>
          </tr>
          <tr>
            <td colspan="1" rowspan="1"><p></p></td>
            <td colspan="1" rowspan="1"><p></p></td>
            <td colspan="1" rowspan="1"><p></p></td>
          </tr>
          <tr>
            <td colspan="1" rowspan="1"><p></p></td>
            <td colspan="1" rowspan="1"><p></p></td>
            <td colspan="1" rowspan="1"><p></p></td>
          </tr>
        </tbody>
      </table>
    `

    const markdown = serializeEditorHtmlToMarkdown(emptyTableHtml)

    expect(markdown).toContain('|   |   |   |')
    expect(markdown).toContain('| --- | --- | --- |')

    const html = renderWriteMarkdownToHtml(markdown)

    expect(html).toContain('<table>')
    expect(html).not.toContain('<p>|')
  })

  it('preserves tiptap tables across live/read mode conversions', () => {
    const tiptapTableHtml = `
      <table>
        <tbody>
          <tr>
            <th colspan="1" rowspan="1"><p>标题 A</p></th>
            <th colspan="1" rowspan="1"><p>标题 B</p></th>
          </tr>
          <tr>
            <td colspan="1" rowspan="1"><p>单元 1</p></td>
            <td colspan="1" rowspan="1"><p>单元 2</p></td>
          </tr>
        </tbody>
      </table>
    `

    const markdown = serializeEditorHtmlToMarkdown(tiptapTableHtml)

    expect(markdown).toContain('| 标题 A | 标题 B |')
    expect(markdown).toContain('| --- | --- |')
    expect(markdown).toContain('| 单元 1 | 单元 2 |')

    const html = renderWriteMarkdownToHtml(markdown)

    expect(html).toContain('<table>')
    expect(html).toContain('<th>标题 A</th>')
    expect(html).toContain('<td>单元 1</td>')
  })

  it('normalizes tiptap colgroup tables into GFM instead of raw html', () => {
    const tiptapTableHtml = `
      <table style="min-width: 50px;">
        <colgroup>
          <col style="min-width: 25px;">
          <col style="min-width: 25px;">
        </colgroup>
        <tbody>
          <tr>
            <th colspan="1" rowspan="1"><p>标题 A</p></th>
            <th colspan="1" rowspan="1"><p>标题 B</p></th>
          </tr>
          <tr>
            <td colspan="1" rowspan="1"><p>单元 1</p></td>
            <td colspan="1" rowspan="1"><p>单元 2</p></td>
          </tr>
        </tbody>
      </table>
    `

    const markdown = serializeEditorHtmlToMarkdown(tiptapTableHtml)

    expect(markdown).not.toContain('<table')
    expect(markdown).toContain('| 标题 A | 标题 B |')
    expect(markdown).toContain('| 单元 1 | 单元 2 |')
  })

  it('repairs legacy raw-html table markdown before rendering', () => {
    const legacyMarkdown = '<table style="min-width: 50px;"><colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>标题 A</p></th><th colspan="1" rowspan="1"><p>标题 B</p></th></tr><tr><td colspan="1" rowspan="1"><p>单元 1</p></td><td colspan="1" rowspan="1"><p>单元 2</p></td></tr></tbody></table>'

    const normalizedMarkdown = normalizeWriteMarkdown(legacyMarkdown)

    expect(normalizedMarkdown).not.toContain('<table')
    expect(normalizedMarkdown).toContain('| 标题 A | 标题 B |')

    const html = renderWriteMarkdownToHtml(legacyMarkdown)

    expect(html).toContain('<table>')
    expect(html).toContain('<td>单元 1</td>')
  })
})
