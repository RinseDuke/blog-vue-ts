import {
  formatMarkdownTableRow,
  getMarkdownLines,
  isEscapedCharacter,
} from './markdownText'

describe('markdown text helpers', () => {
  it('tracks LF and CRLF line boundaries consistently', () => {
    const lines = getMarkdownLines('first\r\nsecond\n')

    expect(lines.map(({ content, lineEnding }) => ({ content, lineEnding }))).toEqual([
      { content: 'first', lineEnding: '\r\n' },
      { content: 'second', lineEnding: '\n' },
      { content: '', lineEnding: '' },
    ])
    expect(lines[1]).toMatchObject({ start: 7, contentEnd: 13, content: 'second' })
  })

  it('detects odd backslash escaping', () => {
    expect(isEscapedCharacter('\\*', 1)).toBe(true)
    expect(isEscapedCharacter('\\\\*', 2)).toBe(false)
  })

  it('formats table rows with an optional empty-cell placeholder', () => {
    expect(formatMarkdownTableRow(['A', ''])).toBe('| A |  |')
    expect(formatMarkdownTableRow(['A', ''], ' ')).toBe('| A |   |')
  })
})
