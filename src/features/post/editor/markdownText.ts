export interface MarkdownLine {
  start: number
  contentEnd: number
  end: number
  content: string
  lineEnding: string
}

export function getMarkdownLines(value: string): MarkdownLine[] {
  const lines: MarkdownLine[] = []

  for (let start = 0; start <= value.length; ) {
    const lineFeed = value.indexOf('\n', start)
    const rawEnd = lineFeed === -1 ? value.length : lineFeed
    const contentEnd = rawEnd > start && value[rawEnd - 1] === '\r' ? rawEnd - 1 : rawEnd
    const end = lineFeed === -1 ? value.length : lineFeed + 1
    const content = value.slice(start, contentEnd)
    const lineEnding = value.slice(contentEnd, end)

    lines.push({
      start,
      contentEnd,
      end,
      content,
      lineEnding,
    })

    if (lineFeed === -1) break

    start = lineFeed + 1
    if (start === value.length) {
      lines.push({
        start,
        contentEnd: start,
        end: start,
        content: '',
        lineEnding: '',
      })
      break
    }
  }

  return lines
}

export function isEscapedCharacter(value: string, position: number): boolean {
  let backslashes = 0

  for (let index = position - 1; index >= 0 && value[index] === '\\'; index -= 1) {
    backslashes += 1
  }

  return backslashes % 2 === 1
}

export function formatMarkdownTableRow(cells: string[], emptyCell = ''): string {
  return `| ${cells.map((cell) => cell || emptyCell).join(' | ')} |`
}
