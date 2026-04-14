import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'

import { gfm } from 'turndown-plugin-gfm'

type TurndownNode = {
  nodeName: string
  parentNode?: TurndownNode | null
}

const turndownService = new TurndownService({ headingStyle: 'atx' })
turndownService.use(gfm)
turndownService.addRule('strikethroughDoubleTilde', {
  filter: ['del', 's', 'strike'],
  replacement(content: string) {
    return `~~${content}~~`
  },
})
turndownService.addRule('tableCellParagraph', {
  filter(node: TurndownNode) {
    const parentName = node.parentNode?.nodeName
    return node.nodeName === 'P' && (parentName === 'TD' || parentName === 'TH')
  },
  replacement(content: string) {
    return content.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim()
  },
})

const mdParser = new MarkdownIt()

export function serializeEditorHtmlToMarkdown(html: string) {
  const tableMarkdowns: string[] = []
  const protectedHtml = stripTiptapTableColgroups(html).replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    const placeholder = `WRITETABLETOKEN${tableMarkdowns.length}`
    tableMarkdowns.push(convertTableHtmlToMarkdown(tableHtml))
    return `<p>${placeholder}</p>`
  })

  let markdown = turndownService.turndown(protectedHtml)

  tableMarkdowns.forEach((tableMarkdown, index) => {
    markdown = markdown.replace(`WRITETABLETOKEN${index}`, `\n\n${tableMarkdown}\n\n`)
  })

  return markdown.trim()
}

export function normalizeWriteMarkdown(markdown: string) {
  return markdown.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => serializeEditorHtmlToMarkdown(tableHtml))
}

export function renderWriteMarkdownToHtml(markdown: string) {
  return mdParser.render(normalizeWriteMarkdown(markdown))
}

function stripTiptapTableColgroups(html: string) {
  return html.replace(/<colgroup>[\s\S]*?<\/colgroup>/gi, '')
}

function convertTableHtmlToMarkdown(tableHtml: string) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi), ([, rowHtml]) =>
    extractTableCells(rowHtml)
  ).filter((cells) => cells.length)

  if (!rows.length) return ''

  const columnCount = Math.max(...rows.map((cells) => cells.length))
  const normalizedRows = rows.map((cells) => padTableRow(cells, columnCount))
  const headerRow = normalizedRows[0]
  const bodyRows = normalizedRows.slice(1)
  const separatorRow = Array.from({ length: columnCount }, () => '---')

  return [
    formatMarkdownTableRow(headerRow),
    formatMarkdownTableRow(separatorRow),
    ...bodyRows.map(formatMarkdownTableRow),
  ].join('\n')
}

function extractTableCells(rowHtml: string) {
  return Array.from(rowHtml.matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi), ([, , cellHtml]) =>
    serializeTableCell(cellHtml)
  )
}

function serializeTableCell(cellHtml: string) {
  return turndownService
    .turndown(cellHtml)
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\|/g, '\\|')
}

function padTableRow(cells: string[], columnCount: number) {
  return [...cells, ...Array.from({ length: Math.max(columnCount - cells.length, 0) }, () => '')]
}

function formatMarkdownTableRow(cells: string[]) {
  return `| ${cells.map((cell) => cell || ' ').join(' | ')} |`
}
