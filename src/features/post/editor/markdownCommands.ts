import {
  formatMarkdownTableRow,
  getMarkdownLines,
  isEscapedCharacter,
  type MarkdownLine,
} from './markdownText'

export interface MarkdownSelection {
  from: number
  to: number
}

export interface MarkdownEditResult {
  value: string
  selection: MarkdownSelection
}

export type MarkdownInlineMark = '**' | '*' | '~~'
export type MarkdownLinePrefix = '## ' | '### ' | '- ' | '1. ' | '> '
export type MarkdownTableMutation =
  | 'add-row'
  | 'add-column'
  | 'delete-row'
  | 'delete-column'
  | 'delete-table'
export type MarkdownCommand =
  | 'undo'
  | 'redo'
  | 'heading-2'
  | 'heading-3'
  | 'bold'
  | 'italic'
  | 'strike'
  | 'bullet-list'
  | 'ordered-list'
  | 'blockquote'
  | 'code-block'
  | 'link'
  | 'table'
  | MarkdownTableMutation
  | 'horizontal-rule'
  | 'clear-formatting'

interface TextChange {
  from: number
  to: number
  insert: string
}

interface ParsedTableRow {
  cells: string[]
  ranges: Array<{ from: number; to: number }>
}

interface MarkdownTableBlock {
  start: number
  end: number
  lineEnding: '\r\n' | '\n'
  rows: string[][]
  currentRow: number
  currentColumn: number
}

function normalizeSelection(value: string, selection: MarkdownSelection): MarkdownSelection {
  const from = Math.max(0, Math.min(value.length, Math.min(selection.from, selection.to)))
  const to = Math.max(from, Math.min(value.length, Math.max(selection.from, selection.to)))

  return { from, to }
}

function applyTextChanges(value: string, changes: TextChange[]): string {
  return [...changes]
    .sort((left, right) => right.from - left.from)
    .reduce(
      (current, change) =>
        current.slice(0, change.from) + change.insert + current.slice(change.to),
      value
    )
}

function mapPositionThroughChanges(position: number, changes: TextChange[]): number {
  let delta = 0

  for (const change of [...changes].sort((left, right) => left.from - right.from)) {
    const removedLength = change.to - change.from
    const changeDelta = change.insert.length - removedLength

    if (position < change.from) break

    if (position <= change.to) {
      return change.from + delta + change.insert.length
    }

    delta += changeDelta
  }

  return position + delta
}

function getLineStart(value: string, position: number): number {
  return value.lastIndexOf('\n', Math.max(0, position - 1)) + 1
}

function getLineContentEnd(value: string, lineStart: number): number {
  const lineFeed = value.indexOf('\n', lineStart)
  const lineEnd = lineFeed === -1 ? value.length : lineFeed

  return lineEnd > lineStart && value[lineEnd - 1] === '\r' ? lineEnd - 1 : lineEnd
}

function detectLineEnding(value: string): '\r\n' | '\n' {
  return value.includes('\r\n') ? '\r\n' : '\n'
}

function parseTableRow(line: string): ParsedTableRow | null {
  const pipePositions: number[] = []

  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '|' && !isEscapedCharacter(line, index)) {
      pipePositions.push(index)
    }
  }

  if (pipePositions.length === 0) return null

  const segments: Array<{ from: number; to: number }> = []
  let segmentStart = 0

  for (const pipePosition of pipePositions) {
    segments.push({ from: segmentStart, to: pipePosition })
    segmentStart = pipePosition + 1
  }
  segments.push({ from: segmentStart, to: line.length })

  const firstVisible = line.search(/\S/u)
  const lastVisibleMatch = line.match(/\S(?=\s*$)/u)
  const lastVisible = lastVisibleMatch?.index ?? -1
  const hasLeadingPipe = firstVisible >= 0 && line[firstVisible] === '|'
  const hasTrailingPipe =
    lastVisible >= 0 && line[lastVisible] === '|' && !isEscapedCharacter(line, lastVisible)
  const cellSegments = segments.slice(
    hasLeadingPipe ? 1 : 0,
    hasTrailingPipe ? segments.length - 1 : segments.length
  )

  if (cellSegments.length === 0) return null

  return {
    cells: cellSegments.map(({ from, to }) => line.slice(from, to).trim()),
    ranges: cellSegments.map(({ from, to }) => ({ from, to })),
  }
}

function isTableDelimiter(row: ParsedTableRow): boolean {
  return row.cells.every((cell) => /^:?-{3,}:?$/u.test(cell))
}

function getColumnAtPosition(row: ParsedTableRow, position: number): number {
  const containingColumn = row.ranges.findIndex(
    (range) => position >= range.from && position <= range.to
  )

  if (containingColumn >= 0) return containingColumn
  if (position < row.ranges[0].from) return 0
  return row.ranges.length - 1
}

function findMarkdownTable(
  value: string,
  selection: MarkdownSelection
): MarkdownTableBlock | null {
  const lines = getMarkdownLines(value)

  for (let headerIndex = 0; headerIndex < lines.length - 1; headerIndex += 1) {
    const header = parseTableRow(lines[headerIndex].content)
    const delimiter = parseTableRow(lines[headerIndex + 1].content)

    if (
      !header ||
      !delimiter ||
      header.cells.length !== delimiter.cells.length ||
      !isTableDelimiter(delimiter)
    ) {
      continue
    }

    const parsedRows = [header, delimiter]
    let lastLineIndex = headerIndex + 1

    for (let lineIndex = headerIndex + 2; lineIndex < lines.length; lineIndex += 1) {
      const row = parseTableRow(lines[lineIndex].content)
      if (!row) break
      parsedRows.push(row)
      lastLineIndex = lineIndex
    }

    const tableStart = lines[headerIndex].start
    const tableEnd = lines[lastLineIndex].contentEnd
    if (selection.from < tableStart || selection.from > tableEnd) continue

    const currentLineOffset = lines
      .slice(headerIndex, lastLineIndex + 1)
      .findIndex(
        (line) => selection.from >= line.start && selection.from <= line.contentEnd
      )

    if (currentLineOffset === -1) continue

    const currentLine = lines[headerIndex + currentLineOffset]
    const currentRow = parsedRows[currentLineOffset]
    const currentColumn = getColumnAtPosition(
      currentRow,
      selection.from - currentLine.start
    )
    const tableLineEnding = lines[headerIndex].lineEnding
    const columnCount = Math.max(...parsedRows.map((row) => row.cells.length))
    const normalizedRows = parsedRows.map((row, rowIndex) => {
      const cells = [...row.cells]
      while (cells.length < columnCount) {
        cells.push(rowIndex === 1 ? '---' : '')
      }
      return cells
    })

    return {
      start: tableStart,
      end: tableEnd,
      lineEnding:
        tableLineEnding === '\r\n' || tableLineEnding === '\n'
          ? tableLineEnding
          : detectLineEnding(value),
      rows: normalizedRows,
      currentRow: currentLineOffset,
      currentColumn,
    }
  }

  return null
}

function getFormattedCellPosition(
  rows: string[][],
  rowIndex: number,
  columnIndex: number,
  lineEnding: string
): number {
  let position = 0

  for (let index = 0; index < rowIndex; index += 1) {
    position += formatMarkdownTableRow(rows[index]).length + lineEnding.length
  }

  position += 2
  for (let index = 0; index < columnIndex; index += 1) {
    position += rows[rowIndex][index].length + 3
  }

  return position
}

function getSelectedLineStarts(value: string, selection: MarkdownSelection): number[] {
  const firstLineStart = getLineStart(value, selection.from)
  const selectionEndsAtLineStart =
    selection.to > selection.from &&
    selection.to > 0 &&
    value[selection.to - 1] === '\n'
  const effectiveTo = selectionEndsAtLineStart ? selection.to - 1 : selection.to
  const lastLineStart = getLineStart(value, effectiveTo)
  const starts: number[] = []

  for (let lineStart = firstLineStart; lineStart <= lastLineStart; ) {
    starts.push(lineStart)
    const nextLineFeed = value.indexOf('\n', lineStart)
    if (nextLineFeed === -1) break
    lineStart = nextLineFeed + 1
  }

  return starts
}

function getAlternativePrefix(line: string, prefix: MarkdownLinePrefix): string {
  if (prefix.startsWith('#')) {
    return line.match(/^#{1,6}[ \t]+/u)?.[0] ?? ''
  }

  if (prefix === '- ' || prefix === '1. ') {
    return line.match(/^(?:[-+*][ \t]+|\d+[.)][ \t]+)/u)?.[0] ?? ''
  }

  return ''
}

function getEnclosingCodeFenceChanges(
  value: string,
  selection: MarkdownSelection
): TextChange[] | null {
  let openingLine: MarkdownLine | null = null

  for (const line of getMarkdownLines(value)) {
    if (line.content.trim() !== '```') continue

    if (!openingLine) {
      openingLine = line
      continue
    }

    if (selection.from >= openingLine.end && selection.to <= line.start) {
      const preservesSelectedLineEnding = selection.to === line.start
      const precedingLineEndingLength =
        value.slice(Math.max(0, line.start - 2), line.start) === '\r\n'
          ? 2
          : value[line.start - 1] === '\n'
            ? 1
            : 0

      return [
        { from: openingLine.start, to: openingLine.end, insert: '' },
        {
          from: preservesSelectedLineEnding
            ? line.start
            : line.start - precedingLineEndingLength,
          to: preservesSelectedLineEnding ? line.end : line.contentEnd,
          insert: '',
        },
      ]
    }

    openingLine = null
  }

  return null
}

export function toggleInlineMark(
  value: string,
  selection: MarkdownSelection,
  mark: MarkdownInlineMark
): MarkdownEditResult {
  const { from, to } = normalizeSelection(value, selection)
  const markLength = mark.length
  const countAdjacentStars = (position: number, direction: -1 | 1) => {
    let count = 0
    for (
      let index = position;
      index >= 0 && index < value.length && value[index] === '*';
      index += direction
    ) {
      count += 1
    }
    return count
  }
  const hasOuterMarks =
    mark === '*'
      ? countAdjacentStars(from - 1, -1) % 2 === 1 &&
        countAdjacentStars(to, 1) % 2 === 1
      : from >= markLength &&
        value.slice(from - markLength, from) === mark &&
        value.slice(to, to + markLength) === mark

  if (hasOuterMarks) {
    return {
      value:
        value.slice(0, from - markLength) +
        value.slice(from, to) +
        value.slice(to + markLength),
      selection: { from: from - markLength, to: to - markLength },
    }
  }

  const selected = value.slice(from, to)

  return {
    value: value.slice(0, from) + mark + selected + mark + value.slice(to),
    selection: { from: from + markLength, to: to + markLength },
  }
}

export function toggleLinePrefix(
  value: string,
  selection: MarkdownSelection,
  prefix: MarkdownLinePrefix
): MarkdownEditResult {
  const normalizedSelection = normalizeSelection(value, selection)
  const lineStarts = getSelectedLineStarts(value, normalizedSelection)
  const allPrefixed = lineStarts.every((lineStart) => value.startsWith(prefix, lineStart))
  const changes = lineStarts.flatMap<TextChange>((lineStart) => {
    if (allPrefixed) {
      return [{ from: lineStart, to: lineStart + prefix.length, insert: '' }]
    }

    if (value.startsWith(prefix, lineStart)) return []

    const lineEnd = getLineContentEnd(value, lineStart)
    const line = value.slice(lineStart, lineEnd)
    const alternativePrefix = getAlternativePrefix(line, prefix)

    return [
      {
        from: lineStart,
        to: lineStart + alternativePrefix.length,
        insert: prefix,
      },
    ]
  })

  return {
    value: applyTextChanges(value, changes),
    selection: {
      from: mapPositionThroughChanges(normalizedSelection.from, changes),
      to: mapPositionThroughChanges(normalizedSelection.to, changes),
    },
  }
}

export function toggleCodeBlock(
  value: string,
  selection: MarkdownSelection
): MarkdownEditResult {
  const { from, to } = normalizeSelection(value, selection)
  const normalizedSelection = { from, to }
  const fenceChanges = getEnclosingCodeFenceChanges(value, normalizedSelection)

  if (fenceChanges) {
    return {
      value: applyTextChanges(value, fenceChanges),
      selection: {
        from: mapPositionThroughChanges(from, fenceChanges),
        to: mapPositionThroughChanges(to, fenceChanges),
      },
    }
  }

  const lineEnding = detectLineEnding(value)
  const openingFence = `\`\`\`${lineEnding}`
  const blockStart = getLineStart(value, from)
  const selectionEndsAtLineStart = to > from && to > 0 && value[to - 1] === '\n'
  const effectiveTo = selectionEndsAtLineStart ? to - 1 : to
  const lastLineStart = getLineStart(value, effectiveTo)
  const blockEnd = selectionEndsAtLineStart ? to : getLineContentEnd(value, lastLineStart)
  const selectedBlock = value.slice(blockStart, blockEnd)
  const closingFence = selectionEndsAtLineStart
    ? `\`\`\`${to < value.length ? lineEnding : ''}`
    : `${lineEnding}\`\`\``

  return {
    value:
      value.slice(0, blockStart) +
      openingFence +
      selectedBlock +
      closingFence +
      value.slice(blockEnd),
    selection: {
      from: from + openingFence.length,
      to: to + openingFence.length,
    },
  }
}

export function insertLink(
  value: string,
  selection: MarkdownSelection,
  address: string
): MarkdownEditResult {
  const { from, to } = normalizeSelection(value, selection)
  const label = value.slice(from, to) || '链接'
  const escapedLabel = label
    .replace(/\\/gu, '\\\\')
    .replace(/[[\]]/gu, (character) => `\\${character}`)
  const escapedAddress = address
    .replace(/\\/gu, '\\\\')
    .replace(/[()]/gu, (character) => `\\${character}`)
  const destination = /\s/u.test(address) ? `<${escapedAddress}>` : escapedAddress
  const markdown = `[${escapedLabel}](${destination})`

  return {
    value: value.slice(0, from) + markdown + value.slice(to),
    selection: { from: from + 1, to: from + 1 + escapedLabel.length },
  }
}

function getBlockPadding(
  value: string,
  selection: MarkdownSelection,
  lineEnding: '\r\n' | '\n'
): { before: string; after: string } {
  const previousCharacter = value[selection.from - 1]
  const nextCharacter = value[selection.to]

  return {
    before:
      selection.from > 0 && previousCharacter !== '\n' && previousCharacter !== '\r'
        ? lineEnding
        : '',
    after:
      selection.to < value.length && nextCharacter !== '\n' && nextCharacter !== '\r'
        ? lineEnding
        : '',
  }
}

export function insertTable(
  value: string,
  selection: MarkdownSelection
): MarkdownEditResult {
  const normalizedSelection = normalizeSelection(value, selection)
  const lineEnding = detectLineEnding(value)
  const table = [
    '| 表头 1 | 表头 2 | 表头 3 |',
    '| --- | --- | --- |',
    '|  |  |  |',
    '|  |  |  |',
  ].join(lineEnding)
  const padding = getBlockPadding(value, normalizedSelection, lineEnding)
  const inserted = padding.before + table + padding.after
  const tableStart = normalizedSelection.from + padding.before.length

  return {
    value:
      value.slice(0, normalizedSelection.from) +
      inserted +
      value.slice(normalizedSelection.to),
    selection: { from: tableStart + 2, to: tableStart + 6 },
  }
}

export function mutateMarkdownTable(
  value: string,
  selection: MarkdownSelection,
  mutation: MarkdownTableMutation
): MarkdownEditResult {
  const normalizedSelection = normalizeSelection(value, selection)
  const table = findMarkdownTable(value, normalizedSelection)

  if (!table) {
    return { value, selection: normalizedSelection }
  }

  if (mutation === 'delete-table') {
    return {
      value: value.slice(0, table.start) + value.slice(table.end),
      selection: { from: table.start, to: table.start },
    }
  }

  const rows = table.rows.map((row) => [...row])
  let targetRow = table.currentRow
  let targetColumn = table.currentColumn

  if (mutation === 'add-row') {
    const insertionIndex = table.currentRow <= 1 ? 2 : table.currentRow + 1
    rows.splice(insertionIndex, 0, Array(rows[0].length).fill(''))
    targetRow = insertionIndex
  }

  if (mutation === 'add-column') {
    const insertionIndex = table.currentColumn + 1
    rows.forEach((row, rowIndex) => {
      row.splice(insertionIndex, 0, rowIndex === 1 ? '---' : '')
    })
    targetColumn = insertionIndex
    if (targetRow === 1) targetRow = 0
  }

  if (mutation === 'delete-row') {
    if (table.currentRow >= 2) {
      rows.splice(table.currentRow, 1)
      targetRow = Math.min(table.currentRow, rows.length - 1)
      if (targetRow === 1) targetRow = 0
    } else if (rows.length > 2) {
      rows[0] = rows[2]
      rows.splice(2, 1)
      targetRow = 0
    } else {
      return {
        value: value.slice(0, table.start) + value.slice(table.end),
        selection: { from: table.start, to: table.start },
      }
    }
  }

  if (mutation === 'delete-column') {
    if (rows[0].length === 1) {
      return {
        value: value.slice(0, table.start) + value.slice(table.end),
        selection: { from: table.start, to: table.start },
      }
    }

    rows.forEach((row) => row.splice(table.currentColumn, 1))
    targetColumn = Math.min(table.currentColumn, rows[0].length - 1)
    if (targetRow === 1) targetRow = 0
  }

  const formattedTable = rows.map((row) => formatMarkdownTableRow(row)).join(table.lineEnding)
  const cursor =
    table.start +
    getFormattedCellPosition(rows, targetRow, targetColumn, table.lineEnding)

  return {
    value: value.slice(0, table.start) + formattedTable + value.slice(table.end),
    selection: { from: cursor, to: cursor },
  }
}

export function insertHorizontalRule(
  value: string,
  selection: MarkdownSelection
): MarkdownEditResult {
  const normalizedSelection = normalizeSelection(value, selection)
  const lineEnding = detectLineEnding(value)
  const padding = getBlockPadding(value, normalizedSelection, lineEnding)
  const inserted = padding.before + '---' + padding.after
  const cursor = normalizedSelection.from + inserted.length

  return {
    value:
      value.slice(0, normalizedSelection.from) +
      inserted +
      value.slice(normalizedSelection.to),
    selection: { from: cursor, to: cursor },
  }
}

export function clearMarkdownFormatting(
  value: string,
  selection: MarkdownSelection
): MarkdownEditResult {
  const { from, to } = normalizeSelection(value, selection)
  let plain = value.slice(from, to)

  plain = plain.replace(/^[ \t]*```[^\r\n]*\r?\n/gmu, '')
  plain = plain.replace(/\r?\n[ \t]*```[^\r\n]*$/u, '')
  plain = plain.replace(/^[ \t]*```[^\r\n]*$/gmu, '')
  plain = plain.replace(
    /^[ \t]{0,3}(?:-{3,}|\*{3,}|_{3,})[ \t]*(?:\r?\n|$)/gmu,
    ''
  )
  plain = plain.replace(
    /^[ \t]*(?:(?:#{1,6}|>|[-+*]|\d+[.)])[ \t]+)+/gmu,
    ''
  )
  plain = plain.replace(/^[ \t]*\[[ xX]\][ \t]+/gmu, '')
  plain = plain.replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
  plain = plain.replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
  plain = plain.replace(/\[([^\]]+)\]\[[^\]]*\]/gu, '$1')
  plain = plain.replace(/(`+)([\s\S]*?)\1/gu, '$2')
  plain = plain.replace(
    /(?<![\p{L}\p{N}*])\*\*([^\s*](?:[\s\S]*?[^\s*])?)\*\*(?![\p{L}\p{N}*])/gu,
    '$1'
  )
  plain = plain.replace(
    /(?<![\p{L}\p{N}_])__([^\s_](?:[\s\S]*?[^\s_])?)__(?![\p{L}\p{N}_])/gu,
    '$1'
  )
  plain = plain.replace(/~~([\s\S]*?)~~/gu, '$1')
  plain = plain.replace(
    /(?<![\p{L}\p{N}*])\*([^\s*](?:[^*\r\n]*?[^\s*])?)\*(?![\p{L}\p{N}*])/gu,
    '$1'
  )
  plain = plain.replace(
    /(?<![\p{L}\p{N}_])_([^\s_](?:[^_\r\n]*?[^\s_])?)_(?![\p{L}\p{N}_])/gu,
    '$1'
  )

  return {
    value: value.slice(0, from) + plain + value.slice(to),
    selection: { from, to: from + plain.length },
  }
}

export function applyMarkdownCommand(
  value: string,
  selection: MarkdownSelection,
  command: MarkdownCommand,
  payload = ''
): MarkdownEditResult {
  if (command === 'undo' || command === 'redo') {
    return { value, selection: normalizeSelection(value, selection) }
  }

  switch (command) {
    case 'heading-2':
      return toggleLinePrefix(value, selection, '## ')
    case 'heading-3':
      return toggleLinePrefix(value, selection, '### ')
    case 'bold':
      return toggleInlineMark(value, selection, '**')
    case 'italic':
      return toggleInlineMark(value, selection, '*')
    case 'strike':
      return toggleInlineMark(value, selection, '~~')
    case 'bullet-list':
      return toggleLinePrefix(value, selection, '- ')
    case 'ordered-list':
      return toggleLinePrefix(value, selection, '1. ')
    case 'blockquote':
      return toggleLinePrefix(value, selection, '> ')
    case 'code-block':
      return toggleCodeBlock(value, selection)
    case 'link':
      return insertLink(value, selection, payload)
    case 'table':
      return insertTable(value, selection)
    case 'add-row':
    case 'add-column':
    case 'delete-row':
    case 'delete-column':
    case 'delete-table':
      return mutateMarkdownTable(value, selection, command)
    case 'horizontal-rule':
      return insertHorizontalRule(value, selection)
    case 'clear-formatting':
      return clearMarkdownFormatting(value, selection)
  }
}
