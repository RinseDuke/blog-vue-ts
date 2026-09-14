import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import katex from 'katex'
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'
import texmath from 'markdown-it-texmath'
import toc from 'markdown-it-toc-done-right'
import TurndownService from 'turndown'

type TurndownNode = {
  nodeName: string
  parentNode?: TurndownNode | null
}

<<<<<<< HEAD
type MarkdownRenderRule = NonNullable<MarkdownIt['renderer']['rules'][string]>

const unsafeMarkdownLinkProtocol = /(\]\(\s*<?)(?:javascript|vbscript|file|data)\s*:/giu
const blockedHtmlTags = new Set(['embed', 'iframe', 'noscript', 'object', 'script', 'style', 'template'])
const voidHtmlTags = new Set(['br', 'hr', 'img', 'input', 'wbr'])
const allowedHtmlTags = new Set([
  'a', 'abbr', 'article', 'aside', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'dd',
  'del', 'details', 'div', 'dl', 'dt', 'em', 'eq', 'eqn', 'figcaption', 'figure', 'footer',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'img', 'input', 'kbd', 'label',
  'li', 'main', 'mark', 'nav', 'ol', 'p', 'pre', 'q', 's', 'section', 'small', 'span', 'strong',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul',
  'wbr', 'annotation', 'maction', 'math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mi',
  'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mprescripts', 'mroot', 'mrow',
  'mspace', 'msqrt', 'mstyle', 'msub', 'msubsup', 'msup', 'mtable', 'mtd', 'mtext', 'mtr',
  'munder', 'munderover', 'none', 'semantics', 'circle', 'defs', 'ellipse', 'g', 'line', 'path',
  'polygon', 'polyline', 'rect', 'svg', 'text', 'tspan',
])
const globalHtmlAttributes = new Set(['class', 'dir', 'id', 'lang', 'role', 'style', 'tabindex', 'title'])
const presentationHtmlAttributes = new Set([
  'accent', 'accentunder', 'columnalign', 'columnlines', 'columnspacing', 'cx', 'cy', 'd', 'depth',
  'display', 'displaystyle', 'encoding', 'equalcolumns', 'equalrows', 'fence', 'fill', 'form', 'frame',
  'framespacing', 'height', 'lspace', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant',
  'maxsize', 'minlabelspacing', 'minsize', 'movablelimits', 'notation', 'points', 'preserveaspectratio',
  'r', 'rowalign', 'rowlines', 'rowspacing', 'rspace', 'rx', 'ry', 'scriptlevel', 'separator', 'side',
  'stroke', 'stroke-width', 'stretchy', 'symmetric', 'transform', 'viewbox', 'voffset', 'width', 'x',
  'x1', 'x2', 'xmlns', 'y', 'y1', 'y2',
])
const allowedStyleProperties = new Set([
  'background-color', 'border-bottom-color', 'border-bottom-style', 'border-bottom-width',
  'border-left-color', 'border-left-style', 'border-left-width', 'border-right-color',
  'border-right-style', 'border-right-width', 'border-top-color', 'border-top-style',
  'border-top-width', 'bottom', 'color', 'display', 'font-size', 'height', 'left', 'line-height',
  'margin', 'margin-bottom', 'margin-left', 'margin-right', 'margin-top', 'max-width', 'min-width',
  'opacity', 'overflow', 'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top',
  'position', 'right', 'text-align', 'top', 'transform', 'transform-origin', 'vertical-align',
  'white-space', 'width',
])
const allowedAttributesByTag: Record<string, ReadonlySet<string>> = {
  a: new Set(['href', 'name', 'rel', 'target']),
  img: new Set(['alt', 'decoding', 'height', 'loading', 'src', 'width']),
  input: new Set(['checked', 'disabled', 'type']),
  li: new Set(['value']),
  ol: new Set(['reversed', 'start', 'type']),
  td: new Set(['colspan', 'headers', 'rowspan']),
  th: new Set(['colspan', 'headers', 'rowspan', 'scope']),
  time: new Set(['datetime']),
}

type ParsedHtmlTag = {
  attributes: string
  closing: boolean
  end: number
  name: string
  selfClosing: boolean
  special: boolean
}

const turndownService = new TurndownService({ headingStyle: 'atx' })
turndownService.use(gfm)
=======
const HIGHLIGHT_CLASS_PATTERN = /highlight-(?:text|source)-([a-z0-9]+)/i
const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

turndownService.addRule('highlightedCodeBlock', {
  filter(node: HTMLElement) {
    return (
      node.nodeName === 'DIV' &&
      HIGHLIGHT_CLASS_PATTERN.test(node.className) &&
      node.firstElementChild?.nodeName === 'PRE'
    )
  },
  replacement(_content: string, node: HTMLElement, options: TurndownService.Options) {
    const language = node.className.match(HIGHLIGHT_CLASS_PATTERN)?.[1] ?? ''
    const fence = options.fence ?? '```'
    const code = node.firstElementChild?.textContent ?? ''
    return `\n\n${fence}${language}\n${code}\n${fence}\n\n`
  },
})

turndownService.addRule('tiptapTaskListItem', {
  filter(node: HTMLElement) {
    return node.nodeName === 'LI' && node.getAttribute('data-type') === 'taskItem'
  },
  replacement(content: string, node: HTMLElement) {
    const checkbox = node.querySelector<HTMLInputElement>('input[type="checkbox"]')
    const checked = node.getAttribute('data-checked') === 'true' || checkbox?.checked === true
    const normalizedContent = content.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim()
    return `\n- [${checked ? 'x' : ' '}] ${normalizedContent}`
  },
})
>>>>>>> origin/main
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

const mdParser: MarkdownIt = new MarkdownIt({
  breaks: true,
  // Markdown 的标准语法包含安全的内联 HTML；输出仍会经过 DOMPurify 净化。
  html: true,
  highlight(code: string, language: string): string {
    if (language.toLowerCase() === 'mermaid') {
      return mdParser.utils.escapeHtml(code)
    }

    if (language && hljs.getLanguage(language)) {
      const highlighted = hljs.highlight(code, { language, ignoreIllegals: true }).value
      const safeLanguage = mdParser.utils.escapeHtml(language)
      return `<pre><code class="hljs language-${safeLanguage}">${highlighted}</code></pre>`
    }

    const highlighted = hljs.highlightAuto(code).value
    return `<pre><code class="hljs">${highlighted}</code></pre>`
  },
})
  .use(anchor)
  .use(toc)
  .use(taskLists)
  .use(footnote)
  .use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { throwOnError: false },
  })

const defaultLinkOpenRenderer = mdParser.renderer.rules.link_open

const renderLinkOpen: MarkdownRenderRule = (tokens, index, options, env, renderer) => {
  const token = tokens[index]
  const href = token.attrGet('href') ?? ''

  if (/^(?:https?:)?\/\//i.test(href)) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }

  return defaultLinkOpenRenderer
    ? defaultLinkOpenRenderer(tokens, index, options, env, renderer)
    : renderer.renderToken(tokens, index, options)
}
mdParser.renderer.rules.link_open = renderLinkOpen

const renderSafeText: MarkdownRenderRule = (tokens, index) => {
  const safeText = tokens[index].content.replace(unsafeMarkdownLinkProtocol, '$1#')
  return mdParser.utils.escapeHtml(safeText)
}
mdParser.renderer.rules.text = renderSafeText

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
  const renderedHtml = mdParser.render(normalizeWriteMarkdown(markdown))
  return sanitizeRenderedHtml(renderedHtml)
}

export function sanitizeRenderedHtml(html: string) {
  if (typeof DOMPurify.sanitize !== 'function') {
    return sanitizeHtmlWithoutDom(html)
  }

  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['rel', 'target'],
    ADD_TAGS: ['eqn'],
    FORBID_TAGS: ['embed', 'iframe', 'object', 'script'],
  })
}

function sanitizeHtmlWithoutDom(html: string) {
  const output: string[] = []
  let blockedTag = ''
  let blockedDepth = 0
  let cursor = 0

  while (cursor < html.length) {
    const tagStart = html.indexOf('<', cursor)
    if (tagStart === -1) {
      if (!blockedTag) output.push(html.slice(cursor))
      break
    }

    if (!blockedTag) output.push(html.slice(cursor, tagStart))

    const tag = readHtmlTag(html, tagStart)
    if (!tag) {
      if (!blockedTag) output.push('&lt;')
      cursor = tagStart + 1
      continue
    }

    cursor = tag.end
    if (tag.special) continue

    if (blockedTag) {
      if (tag.name === blockedTag) {
        if (!tag.closing && !tag.selfClosing) blockedDepth += 1
        if (tag.closing) blockedDepth -= 1
        if (blockedDepth === 0) blockedTag = ''
      }
      continue
    }

    if (blockedHtmlTags.has(tag.name)) {
      if (!tag.closing && !tag.selfClosing) {
        blockedTag = tag.name
        blockedDepth = 1
      }
      continue
    }

    if (!allowedHtmlTags.has(tag.name)) continue

    if (tag.closing) {
      if (!voidHtmlTags.has(tag.name)) output.push(`</${tag.name}>`)
      continue
    }

    const attributes = sanitizeHtmlAttributes(tag.name, tag.attributes)
    output.push(`<${tag.name}${attributes}>`)
  }

  return output.join('')
}

function readHtmlTag(html: string, start: number): ParsedHtmlTag | null {
  if (html.startsWith('<!--', start)) {
    const commentEnd = html.indexOf('-->', start + 4)
    return {
      attributes: '',
      closing: false,
      end: commentEnd === -1 ? html.length : commentEnd + 3,
      name: '',
      selfClosing: false,
      special: true,
    }
  }

  let cursor = start + 1
  while (/\s/u.test(html[cursor] ?? '')) cursor += 1

  if (html[cursor] === '!' || html[cursor] === '?') {
    const end = findHtmlTagEnd(html, cursor + 1)
    return {
      attributes: '',
      closing: false,
      end: end === -1 ? html.length : end + 1,
      name: '',
      selfClosing: false,
      special: true,
    }
  }

  const closing = html[cursor] === '/'
  if (closing) cursor += 1
  while (/\s/u.test(html[cursor] ?? '')) cursor += 1

  const nameStart = cursor
  if (!/[a-z]/iu.test(html[cursor] ?? '')) return null
  while (/[\w:-]/u.test(html[cursor] ?? '')) cursor += 1

  const name = html.slice(nameStart, cursor).toLowerCase()
  const tagEnd = findHtmlTagEnd(html, cursor)
  const contentEnd = tagEnd === -1 ? html.length : tagEnd
  const attributes = html.slice(cursor, contentEnd)

  return {
    attributes,
    closing,
    end: tagEnd === -1 ? html.length : tagEnd + 1,
    name,
    selfClosing: /\/\s*$/u.test(attributes),
    special: false,
  }
}

function findHtmlTagEnd(html: string, start: number) {
  let quote = ''

  for (let index = start; index < html.length; index += 1) {
    const character = html[index]
    if (quote) {
      if (character === quote) quote = ''
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      continue
    }

    if (character === '>') return index
  }

  return -1
}

function sanitizeHtmlAttributes(tagName: string, source: string) {
  const attributes = new Map<string, string>()
  let cursor = 0

  while (cursor < source.length) {
    while (/\s|\//u.test(source[cursor] ?? '')) cursor += 1
    if (cursor >= source.length) break

    const nameStart = cursor
    while (!/[\s=/>]/u.test(source[cursor] ?? '')) cursor += 1
    if (cursor === nameStart) {
      cursor += 1
      continue
    }

    const name = source.slice(nameStart, cursor).toLowerCase()
    while (/\s/u.test(source[cursor] ?? '')) cursor += 1

    let value = ''
    if (source[cursor] === '=') {
      cursor += 1
      while (/\s/u.test(source[cursor] ?? '')) cursor += 1

      const quote = source[cursor]
      if (quote === '"' || quote === "'") {
        cursor += 1
        const valueStart = cursor
        while (cursor < source.length && source[cursor] !== quote) cursor += 1
        value = source.slice(valueStart, cursor)
        if (source[cursor] === quote) cursor += 1
      } else {
        const valueStart = cursor
        while (!/[\s>]/u.test(source[cursor] ?? '')) cursor += 1
        value = source.slice(valueStart, cursor)
      }
    }

    if (!isAllowedHtmlAttribute(tagName, name) || attributes.has(name)) continue

    const safeValue = sanitizeHtmlAttributeValue(name, value)
    if (safeValue === null) continue
    attributes.set(name, safeValue)
  }

  if (tagName === 'a' && attributes.get('target') === '_blank') {
    const relation = new Set((attributes.get('rel') ?? '').split(/\s+/u).filter(Boolean))
    relation.add('noopener')
    relation.add('noreferrer')
    attributes.set('rel', Array.from(relation).join(' '))
  }

  return Array.from(attributes, ([name, value]) => {
    const outputName = name === 'viewbox' ? 'viewBox' : name === 'preserveaspectratio' ? 'preserveAspectRatio' : name
    return ` ${outputName}="${mdParser.utils.escapeHtml(value)}"`
  }).join('')
}

function isAllowedHtmlAttribute(tagName: string, name: string) {
  if (name.startsWith('on') || name === 'srcdoc') return false
  if (name.startsWith('aria-') || name.startsWith('data-')) return true
  return globalHtmlAttributes.has(name)
    || presentationHtmlAttributes.has(name)
    || allowedAttributesByTag[tagName]?.has(name) === true
}

function sanitizeHtmlAttributeValue(name: string, value: string) {
  if (name === 'href' || name === 'src' || name === 'xlink:href') {
    return hasUnsafeUrlProtocol(value) ? null : value
  }

  if (name === 'target' && !['_blank', '_parent', '_self', '_top'].includes(value)) return null
  if (name === 'style') return sanitizeInlineStyle(value)
  if ((name === 'fill' || name === 'stroke') && /url\s*\(/iu.test(decodeHtmlAttributeValue(value))) {
    return null
  }

  return value
}

function sanitizeInlineStyle(style: string) {
  const declarations: string[] = []

  for (const declaration of style.split(';')) {
    const separator = declaration.indexOf(':')
    if (separator === -1) continue

    const property = declaration.slice(0, separator).trim().toLowerCase()
    const value = declaration.slice(separator + 1).trim()
    const normalizedValue = decodeHtmlAttributeValue(value).toLowerCase()

    if (!allowedStyleProperties.has(property) || !value) continue
    const hasDangerousStyleValue = /url\s*\(|expression\s*\(|@import|javascript:|vbscript:|data:|-moz-binding/iu
      .test(normalizedValue) || normalizedValue.includes('\\')
    if (hasDangerousStyleValue) {
      continue
    }
    if (!/^[\w\s#(),.%+*/-]+$/u.test(value)) continue

    declarations.push(`${property}: ${value}`)
  }

  return declarations.length ? declarations.join('; ') : null
}

function hasUnsafeUrlProtocol(value: string) {
  const decoded = Array.from(decodeHtmlAttributeValue(value), (character) => ({
    character,
    codePoint: character.codePointAt(0) ?? 0,
  }))
    .filter(({ codePoint }) => codePoint > 0x20 && (codePoint < 0x7f || codePoint > 0x9f))
    .map(({ character }) => character)
    .join('')
    .toLowerCase()

  const protocol = /^([a-z][a-z\d+.-]*):/iu.exec(decoded)?.[1]
  return protocol ? !['http', 'https', 'mailto', 'tel'].includes(protocol) : false
}

function decodeHtmlAttributeValue(value: string) {
  return value
    .replace(/&#x([\da-f]+);?/giu, (_, code: string) => decodeCodePoint(code, 16))
    .replace(/&#(\d+);?/gu, (_, code: string) => decodeCodePoint(code, 10))
    .replace(/&colon;?/giu, ':')
    .replace(/&(?:tab|newline);?/giu, '')
}

function decodeCodePoint(code: string, radix: number) {
  const value = Number.parseInt(code, radix)
  const isValidCodePoint = Number.isInteger(value)
    && value >= 0
    && value <= 0x10ffff
    && (value < 0xd800 || value > 0xdfff)
  return isValidCodePoint ? String.fromCodePoint(value) : ''
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
