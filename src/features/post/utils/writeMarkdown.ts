import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'

import { gfm } from 'turndown-plugin-gfm'

type TurndownNode = {
  nodeName: string
  parentNode?: TurndownNode | null
}

const turndownService = new TurndownService({ headingStyle: 'atx' })
turndownService.use(gfm)
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
  return turndownService.turndown(stripTiptapTableColgroups(html))
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
