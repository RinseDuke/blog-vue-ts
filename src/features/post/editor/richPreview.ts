import { markdownLanguage } from '@codemirror/lang-markdown'
import DOMPurify from 'dompurify'
import katex from 'katex'
import MarkdownIt from 'markdown-it'
import texmath from 'markdown-it-texmath'
import { getMarkdownCodeRanges } from './livePreviewDecorations'

// 这里不接受原始 HTML；样式只能来自公式和表格渲染器，不能来自文章作者。
const parser = new MarkdownIt({ html: false }).use(texmath, {
  engine: katex,
  delimiters: 'dollars',
  katexOptions: { throwOnError: false, trust: false, maxExpand: 1000 },
})

export interface RichPreviewRange {
  from: number
  to: number
  html: string
  kind: 'image' | 'formula' | 'table-row'
}

export function getRichPreviewRanges(source: string): RichPreviewRange[] {
  const result: RichPreviewRange[] = []
  const code = getMarkdownCodeRanges(source)
  const overlapsCode = (from: number, to: number) => code.some((range) => from < range.to && to > range.from)
  const add = (from: number, to: number, html: string, kind: RichPreviewRange['kind']) => {
    if (from >= to || overlapsCode(from, to)) return
    result.push({ from, to, kind, html: DOMPurify.sanitize(html) })
  }

  const lines = source.split('\n')
  const starts: number[] = []
  let position = 0
  for (const line of lines) {
    starts.push(position)
    position += line.length + 1
  }

  // 表格每一行单独预览，移动光标只展开当前行，不展开整张表。
  const tokens = parser.parse(source, {})
  let insideTable = false
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type === 'table_open') {
      insideTable = true
      if (token.map) {
        const separator = token.map[0] + 1
        add(starts[separator], starts[separator] + lines[separator].length,
          '<span class="cm-rich-table-divider" aria-label="表格列对齐分隔行"></span>', 'table-row')
      }
    }
    if (token.type === 'table_close') insideTable = false
    if (!insideTable || token.type !== 'tr_open' || !token.map) continue
    const row = token.map[0]
    const cells: string[] = []
    for (let cellIndex = index + 1; cellIndex < tokens.length && tokens[cellIndex].type !== 'tr_close'; cellIndex += 1) {
      const cell = tokens[cellIndex]
      if (cell.type !== 'th_open' && cell.type !== 'td_open') continue
      const inline = tokens[cellIndex + 1]
      const alignment = cell.attrGet('style')?.match(/text-align:(left|center|right)/u)?.[1] ?? 'left'
      const content = parser.renderer.renderInline(inline.children ?? [], parser.options, {})
      const headerClass = cell.type === 'th_open' ? ' cm-rich-table-header' : ''
      cells.push(`<span class="cm-rich-table-cell${headerClass}" style="text-align:${alignment}">${content}</span>`)
    }
    add(starts[row], starts[row] + lines[row].length,
      `<span class="cm-rich-table-row">${cells.join('')}</span>`, 'table-row')
  }

  markdownLanguage.parser.parse(source).iterate({
    enter(node) {
      if (node.name !== 'Image') return
      if (source.slice(node.from, node.to).includes('\n')) return
      if (result.some((range) => node.from >= range.from && node.to <= range.to)) return
      add(node.from, node.to, parser.renderInline(source.slice(node.from, node.to)), 'image')
      return false
    },
  })

  // 由渲染器确认公式，避免把价格和转义美元符号当作数学表达式。
  const formula = /(?<![\\$])\$\$[^\n]+?\$\$(?!\$)|(?<![\\$])\$(?!\s|\$)(?:\\.|[^$\n])+?(?<![\\\s])\$(?!\$)/gu
  for (const match of source.matchAll(formula)) {
    const from = match.index
    const to = from + match[0].length
    if (overlapsCode(from, to) || result.some((range) => from < range.to && to > range.from)) continue
    const html = match[0].startsWith('$$') ? parser.render(match[0]) : parser.renderInline(match[0])
    if (html.includes('class="katex')) add(from, to, html, 'formula')
  }
  return result.sort((a, b) => a.from - b.from)
}
