import { markdownLanguage } from '@codemirror/lang-markdown'
import {
  getMarkdownLines,
  isEscapedCharacter as isEscaped,
  type MarkdownLine,
} from './markdownText'

/** 使用语法上下文保护代码，不能把代码中的 Markdown 示例当作格式标记。 */
export function getMarkdownCodeRanges(source: string) {
  const ranges: { from: number; to: number; block: boolean; content: boolean }[] = []
  markdownLanguage.parser.parse(source).iterate({
    enter(node) {
      if (['FencedCode', 'CodeBlock', 'InlineCode', 'CodeText'].includes(node.name)) {
        ranges.push({
          from: node.from, to: node.to,
          block: node.name === 'FencedCode' || node.name === 'CodeBlock',
          content: node.name === 'CodeText' || node.name === 'CodeBlock',
        })
      }
    },
  })
  return ranges
}

export interface MarkdownDecorationRange {
  from: number
  to: number
  kind: 'syntax' | 'hidden'
}

export interface MarkdownDecorationAnalysis {
  source: string
  lines: MarkdownLine[]
  rangesByLine: MarkdownDecorationRange[][]
}

export interface MarkdownDecorationState {
  source: string
  activeLine: number
  analysis: MarkdownDecorationAnalysis
  ranges: MarkdownDecorationRange[]
}

interface MarkerRange {
  from: number
  to: number
}

function getActiveLine(lines: MarkdownLine[], sourceLength: number, activePosition: number) {
  const position = Math.max(0, Math.min(sourceLength, activePosition))

  return (
    lines.find((line, index) => {
      const nextLine = lines[index + 1]
      return position >= line.start && (!nextLine || position < nextLine.start)
    }) ?? lines[lines.length - 1]
  )
}

function isBlocked(blocked: boolean[], from: number, to: number) {
  for (let index = from; index < to; index += 1) {
    if (blocked[index]) return true
  }

  return false
}

function blockRange(blocked: boolean[], from: number, to: number) {
  for (let index = from; index < to; index += 1) {
    blocked[index] = true
  }
}

function scanLineMarkers(line: MarkdownLine): MarkerRange[] {
  const markers: MarkerRange[] = []
  const blocked = Array<boolean>(line.content.length).fill(false)
  const addMarker = (from: number, to: number) => {
    if (from >= to || isBlocked(blocked, from, to)) return
    markers.push({ from: line.start + from, to: line.start + to })
  }
  const reserve = (from: number, to: number) => blockRange(blocked, from, to)

  scanBlockPrefix(line.content, addMarker, reserve)
  scanCodeSpans(line.content, addMarker, reserve, blocked)
  scanFootnotes(line.content, addMarker, reserve, blocked)
  scanLinks(line.content, addMarker, reserve, blocked)
  scanInlineMath(line.content, addMarker, reserve, blocked)
  scanPairedDelimiter(line.content, '**', addMarker, reserve, blocked)
  scanPairedDelimiter(line.content, '__', addMarker, reserve, blocked)
  scanPairedDelimiter(line.content, '~~', addMarker, reserve, blocked)
  scanPairedDelimiter(line.content, '*', addMarker, reserve, blocked)
  scanPairedDelimiter(line.content, '_', addMarker, reserve, blocked)

  return markers
}

function scanBlockPrefix(
  line: string,
  addMarker: (from: number, to: number) => void,
  reserve: (from: number, to: number) => void
) {
  let cursor = line.match(/^[ \t]{0,3}/u)?.[0].length ?? 0
  const prefixStart = cursor

  while (line[cursor] === '>') {
    cursor += 1
    if (line[cursor] === ' ' || line[cursor] === '\t') cursor += 1
  }

  if (cursor > prefixStart) {
    addMarker(prefixStart, cursor)
    reserve(prefixStart, cursor)
  }

  const rest = line.slice(cursor)
  const fence = rest.match(/^(?:`{3,}|~{3,})[^\r\n]*$/u)
  if (fence) {
    addMarker(cursor, cursor + fence[0].length)
    reserve(cursor, cursor + fence[0].length)
    return
  }

  const heading = rest.match(/^#{1,6}(?:[ \t]+|$)/u)
  if (heading) {
    addMarker(cursor, cursor + heading[0].length)
    reserve(cursor, cursor + heading[0].length)
    return
  }

  const task = rest.match(/^(?:[-+*]|\d+[.)])[ \t]+\[[ xX]\][ \t]+/u)
  if (task) {
    addMarker(cursor, cursor + task[0].length)
    reserve(cursor, cursor + task[0].length)
    return
  }

  const list = rest.match(/^(?:[-+*]|\d+[.)])[ \t]+/u)
  if (list) {
    addMarker(cursor, cursor + list[0].length)
    reserve(cursor, cursor + list[0].length)
  }
}

function scanCodeSpans(
  line: string,
  addMarker: (from: number, to: number) => void,
  reserve: (from: number, to: number) => void,
  blocked: boolean[]
) {
  let opening = -1
  let delimiterLength = 0

  for (let index = 0; index < line.length; index += 1) {
    if (line[index] !== '`' || isEscaped(line, index) || blocked[index]) continue

    let currentLength = 1
    while (line[index + currentLength] === '`') currentLength += 1
    const delimiter = '`'.repeat(currentLength)

    if (opening === -1) {
      opening = index
      delimiterLength = currentLength
      index += currentLength - 1
      continue
    }

    if (currentLength !== delimiterLength || !line.startsWith(delimiter, index)) {
      index += currentLength - 1
      continue
    }

    addMarker(opening, opening + delimiterLength)
    addMarker(index, index + delimiterLength)
    reserve(opening, index + delimiterLength)
    index += currentLength - 1
    opening = -1
    delimiterLength = 0
  }
}

function scanFootnotes(
  line: string,
  addMarker: (from: number, to: number) => void,
  reserve: (from: number, to: number) => void,
  blocked: boolean[]
) {
  let opening = -1

  for (let index = 0; index < line.length; index += 1) {
    if (opening === -1) {
      if (
        line[index] === '[' &&
        line[index + 1] === '^' &&
        !isEscaped(line, index) &&
        !blocked[index]
      ) {
        opening = index
        index += 1
      }
      continue
    }

    if (line[index] !== ']' || isEscaped(line, index) || isBlocked(blocked, opening, index + 1)) {
      continue
    }

    if (index > opening + 2) {
      addMarker(opening, opening + 1)
      addMarker(opening + 1, opening + 2)
      addMarker(index, index + 1)
      reserve(opening, index + 1)
    }
    opening = -1
  }
}

function findLinkDestinationEnd(line: string, opening: number) {
  let depth = 0

  for (let index = opening; index < line.length; index += 1) {
    if (isEscaped(line, index)) continue
    if (line[index] === '(') depth += 1
    if (line[index] !== ')') continue

    depth -= 1
    if (depth === 0) return index
  }

  return -1
}

function scanLinks(
  line: string,
  addMarker: (from: number, to: number) => void,
  reserve: (from: number, to: number) => void,
  blocked: boolean[]
) {
  let labelStart = -1
  let imageStart = -1

  for (let index = 0; index < line.length; index += 1) {
    if (labelStart === -1) {
      const isImage = line[index] === '!' && line[index + 1] === '[' && !isEscaped(line, index)
      const bracket = isImage ? index + 1 : index
      if (line[bracket] === '[' && !isEscaped(line, bracket) && !blocked[bracket]) {
        labelStart = bracket
        imageStart = isImage ? index : bracket
        index = bracket
      }
      continue
    }

    if (line[index] !== ']' || isEscaped(line, index)) continue
    if (line[index + 1] !== '(') {
      labelStart = -1
      imageStart = -1
      continue
    }

    const destinationEnd = findLinkDestinationEnd(line, index + 1)
    if (destinationEnd === -1) {
      labelStart = -1
      imageStart = -1
      continue
    }

    if (!isBlocked(blocked, labelStart, destinationEnd + 1)) {
      addMarker(imageStart, labelStart + 1)
      addMarker(index, destinationEnd + 1)
      reserve(imageStart, labelStart + 1)
      reserve(index, destinationEnd + 1)
    }
    index = destinationEnd
    labelStart = -1
    imageStart = -1
  }
}

function scanInlineMath(
  line: string,
  addMarker: (from: number, to: number) => void,
  reserve: (from: number, to: number) => void,
  blocked: boolean[]
) {
  for (const match of line.matchAll(/(?<!\\)\$\$([^\r\n]+?)\$\$/gu)) {
    const from = match.index
    const to = from + match[0].length
    if (isBlocked(blocked, from, to)) continue
    addMarker(from, from + 2)
    addMarker(to - 2, to)
    reserve(from, to)
  }
  let opening = -1

  for (let index = 0; index < line.length; index += 1) {
    if (line[index] !== '$' || line[index + 1] === '$' || isEscaped(line, index) || blocked[index]) {
      continue
    }

    if (opening === -1) {
      if (!/\s/u.test(line[index + 1] ?? '')) opening = index
      continue
    }

    if (isEscaped(line, index) || /\s/u.test(line[index - 1] ?? '')) {
      opening = -1
      continue
    }

    const content = line.slice(opening + 1, index)
    const looksLikeDistantCurrency = /^\d/u.test(content) && /[\s，。；：]/u.test(content)
    if (!content.trim() || looksLikeDistantCurrency) {
      opening = -1
      continue
    }

    addMarker(opening, opening + 1)
    addMarker(index, index + 1)
    reserve(opening, index + 1)
    opening = -1
  }
}

function isWordCharacter(character: string | undefined) {
  return Boolean(character && /[\p{L}\p{N}_]/u.test(character))
}

function scanPairedDelimiter(
  line: string,
  delimiter: '**' | '__' | '~~' | '*' | '_',
  addMarker: (from: number, to: number) => void,
  reserve: (from: number, to: number) => void,
  blocked: boolean[]
) {
  let opening = -1

  for (let index = 0; index <= line.length - delimiter.length; index += 1) {
    if (
      !line.startsWith(delimiter, index) ||
      isEscaped(line, index) ||
      isBlocked(blocked, index, index + delimiter.length)
    ) {
      continue
    }

    if (opening === -1) {
      if (
        !/^\s/u.test(line[index + delimiter.length] ?? '') &&
        !(delimiter === '_' && isWordCharacter(line[index - 1]))
      ) {
        opening = index
      }
      index += delimiter.length - 1
      continue
    }

    const contentStart = opening + delimiter.length
    const canClose =
      index > contentStart &&
      !/\s/u.test(line[contentStart] ?? '') &&
      !/\s/u.test(line[index - 1] ?? '') &&
      !(delimiter === '_' && isWordCharacter(line[index + delimiter.length]))

    if (!canClose) {
      index += delimiter.length - 1
      continue
    }

    addMarker(opening, opening + delimiter.length)
    addMarker(index, index + delimiter.length)
    reserve(opening, opening + delimiter.length)
    reserve(index, index + delimiter.length)
    opening = -1
    index += delimiter.length - 1
  }
}

export function getMarkdownDecorationRanges(
  source: string,
  activePosition: number
): MarkdownDecorationRange[] {
  return createMarkdownDecorationState(source, activePosition).ranges
}

function classifyAnalysis(
  analysis: MarkdownDecorationAnalysis,
  activePosition: number
): { activeLine: number; ranges: MarkdownDecorationRange[] } {
  const activeLine = getActiveLine(analysis.lines, analysis.source.length, activePosition)
  const activeLineNumber = analysis.lines.indexOf(activeLine)

  return {
    activeLine: activeLineNumber,
    ranges: analysis.rangesByLine.flatMap((lineRanges, lineNumber) =>
      lineRanges.map((range) => ({
        ...range,
        kind: lineNumber === activeLineNumber ? ('syntax' as const) : ('hidden' as const),
      }))
    ),
  }
}

function analyzeMarkdownDecorations(source: string): MarkdownDecorationAnalysis {
  const lines = getMarkdownLines(source)
  const codeRanges = getMarkdownCodeRanges(source)
  const seen = new Set<string>()
  const rangesByLine = lines.map((line) =>
    scanLineMarkers(line)
      .sort((left, right) => left.from - right.from || left.to - right.to)
      .filter((range) => {
        if (codeRanges.some((code) => range.from < code.to && range.to > code.from &&
          (code.content || (!code.block && !/^`+$/u.test(source.slice(range.from, range.to)))))) return false
        const key = `${range.from}:${range.to}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((range) => ({ ...range, kind: 'hidden' as const }))
  )

  return { source, lines, rangesByLine }
}

export function createMarkdownDecorationState(
  source: string,
  activePosition: number
): MarkdownDecorationState {
  const analysis = analyzeMarkdownDecorations(source)
  const classified = classifyAnalysis(analysis, activePosition)

  return {
    source,
    activeLine: classified.activeLine,
    analysis,
    ranges: classified.ranges,
  }
}

export function updateMarkdownDecorationState(
  previous: MarkdownDecorationState,
  source: string,
  activePosition: number
): MarkdownDecorationState {
  if (source !== previous.source) return createMarkdownDecorationState(source, activePosition)

  const classified = classifyAnalysis(previous.analysis, activePosition)
  if (classified.activeLine === previous.activeLine) return previous

  return {
    ...previous,
    activeLine: classified.activeLine,
    ranges: classified.ranges,
  }
}

export interface MarkdownTextChange {
  from: number
  to: number
  insert: string
}

export function getMinimalTextChange(previous: string, next: string): MarkdownTextChange | null {
  let from = 0
  while (from < previous.length && from < next.length && previous[from] === next[from]) from += 1

  let previousTo = previous.length
  let nextTo = next.length
  while (previousTo > from && nextTo > from && previous[previousTo - 1] === next[nextTo - 1]) {
    previousTo -= 1
    nextTo -= 1
  }

  if (from === previousTo && from === nextTo) return null

  return { from, to: previousTo, insert: next.slice(from, nextTo) }
}
