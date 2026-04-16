import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'

import { gfm } from 'turndown-plugin-gfm'

type TurndownNode = {
  nodeName: string
  parentNode?: TurndownNode | null
}

const turndownService = new TurndownService({ headingStyle: 'atx' })
turndownService.use(gfm)
// <p> 转为单换行（Obsidian 风格），表格内的 <p> 由 tableCellParagraph 规则处理
turndownService.addRule('singleNewlineParagraph', {
  filter(node: TurndownNode) {
    const parentName = node.parentNode?.nodeName
    return node.nodeName === 'P' && parentName !== 'TD' && parentName !== 'TH'
  },
  replacement(content: string) {
    return '\n' + content + '\n'
  },
})
turndownService.addRule('singleNewlineHeading', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement(content: string, node: TurndownNode) {
    const level = Number(node.nodeName.charAt(1)) || 1
    const prefix = '#'.repeat(level)
    return '\n' + prefix + ' ' + content + '\n'
  },
})
turndownService.addRule('strikethroughDoubleTilde', {
  filter(node: TurndownNode) {
    return node.nodeName === 'DEL' || node.nodeName === 'S' || node.nodeName === 'STRIKE'
  },
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

const mdParser = new MarkdownIt({ breaks: true })

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

  // 连续 3+ 空行压缩为 2 行
  markdown = markdown.replace(/\n{3,}/g, '\n\n')

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
