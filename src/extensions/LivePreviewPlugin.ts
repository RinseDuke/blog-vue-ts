import { Extension } from '@tiptap/vue-3'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorState } from '@tiptap/pm/state'
import type { Mark, Node as ProseMirrorNode, ResolvedPos } from '@tiptap/pm/model'

const PLUGIN_KEY = new PluginKey('livePreviewPlugin')

const SYNTAX_CLASS = 'live-preview-syntax'

function makeWidget(text: string, side: 'before' | 'after'): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = SYNTAX_CLASS
  span.textContent = text
  span.contentEditable = 'false'
  if (side === 'after') span.dataset.side = 'after'
  return span
}

function widgetAt(pos: number, text: string, side: 'before' | 'after'): Decoration {
  return Decoration.widget(pos, () => makeWidget(text, side), {
    side: side === 'before' ? -1 : 1,
    key: `lp-${side}-${pos}-${text}`,
  })
}

function ancestorOfType($pos: ResolvedPos, typeName: string): { node: ProseMirrorNode; pos: number; depth: number } | null {
  for (let d = $pos.depth; d >= 0; d--) {
    const node = $pos.node(d)
    if (node.type.name === typeName) {
      return { node, pos: $pos.before(d), depth: d }
    }
  }
  return null
}

function cursorInsideType($pos: ResolvedPos, typeName: string): boolean {
  return ancestorOfType($pos, typeName) !== null
}

function buildBlockDecorations(state: EditorState): Decoration[] {
  const { $head } = state.selection
  const decorations: Decoration[] = []

  for (let d = $head.depth; d >= 1; d--) {
    const node = $head.node(d)
    if (node.type.name === 'heading') {
      const start = $head.start(d)
      const level = (node.attrs as { level: number }).level ?? 1
      const prefix = '#'.repeat(level) + ' '
      decorations.push(widgetAt(start, prefix, 'before'))
      break
    }
  }

  if (cursorInsideType($head, 'blockquote')) {
    const paraStart = $head.start($head.depth)
    if ($head.parent.type.name === 'paragraph') {
      decorations.push(widgetAt(paraStart, '> ', 'before'))
    }
  }

  const bulletListItem = ancestorOfType($head, 'listItem')
  if (bulletListItem) {
    const listParent = ancestorOfType($head, 'bulletList')
    if (listParent) {
      const paraStart = $head.start($head.depth)
      if ($head.parent.type.name === 'paragraph') {
        decorations.push(widgetAt(paraStart, '- ', 'before'))
      }
    }

    const orderedParent = ancestorOfType($head, 'orderedList')
    if (orderedParent && !listParent) {
      let index = 1
      const listItemNode = bulletListItem.node
      const parentList = orderedParent.node
      parentList.forEach((child, _offset, i) => {
        if (child === listItemNode) {
          index = i + 1
        }
      })
      const listItemPos = bulletListItem.pos
      let idx = 1
      orderedParent.node.forEach((child, offset) => {
        if (orderedParent.pos + 1 + offset < listItemPos) {
          idx++
        }
      })

      const paraStart = $head.start($head.depth)
      if ($head.parent.type.name === 'paragraph') {
        decorations.push(widgetAt(paraStart, `${idx}. `, 'before'))
      }
    }
  }

  for (let d = $head.depth; d >= 1; d--) {
    const node = $head.node(d)
    if (node.type.name === 'codeBlock') {
      const before = $head.before(d)
      const after = $head.after(d)
      decorations.push(widgetAt(before + 1, '```', 'before'))
      decorations.push(widgetAt(after - 1, '```', 'after'))
      break
    }
  }

  return decorations
}

function buildInlineDecorations(state: EditorState): Decoration[] {
  const { $head } = state.selection
  const decorations: Decoration[] = []
  const cursorPos = $head.pos

  const parent = $head.parent
  const parentStart = $head.start($head.depth)

  if (!parent.isTextblock) return decorations

  let offset = 0
  parent.forEach((child) => {
    const from = parentStart + offset
    const to = from + child.nodeSize

    if (child.isText && child.marks.length > 0 && cursorPos >= from && cursorPos <= to) {
      for (const mark of child.marks) {
        const { markFrom, markTo } = findMarkRange(parent, parentStart, offset, mark)

        const syntax = markSyntax(mark.type.name)
        if (syntax) {
          decorations.push(widgetAt(markFrom, syntax, 'before'))
          decorations.push(widgetAt(markTo, syntax, 'after'))
        }
      }
    }

    offset += child.nodeSize
  })

  return decorations
}

function findMarkRange(
  parent: ProseMirrorNode,
  parentStart: number,
  startOffset: number,
  mark: Mark,
): { markFrom: number; markTo: number } {
  let markFrom = parentStart + startOffset
  let markTo = markFrom

  let off = 0
  parent.forEach((child) => {
    const childStart = parentStart + off
    const childEnd = childStart + child.nodeSize
    if (childEnd <= markFrom && child.isText && child.marks.some((m) => m.eq(mark))) {
      markFrom = childStart
    }
    off += child.nodeSize
  })

  off = 0
  parent.forEach((child) => {
    const childStart = parentStart + off
    const childEnd = childStart + child.nodeSize
    if (childStart >= parentStart + startOffset && child.isText && child.marks.some((m) => m.eq(mark))) {
      markTo = childEnd
    } else if (childStart >= parentStart + startOffset && markTo > parentStart + startOffset) {
      return false
    }
    off += child.nodeSize
  })

  if (markTo <= markFrom) {
    markFrom = parentStart + startOffset
    off = 0
    parent.forEach((child) => {
      if (off === startOffset) {
        markTo = markFrom + child.nodeSize
      }
      off += child.nodeSize
    })
  }

  return { markFrom, markTo }
}

function markSyntax(markName: string): string | null {
  switch (markName) {
    case 'bold':
      return '**'
    case 'italic':
      return '*'
    case 'strike':
      return '~~'
    case 'code':
      return '`'
    default:
      return null
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  if (state.selection.empty === false && state.selection.$head.pos !== state.selection.$anchor.pos) {
    return DecorationSet.empty
  }

  const decos = [...buildBlockDecorations(state), ...buildInlineDecorations(state)]

  const seen = new Set<string>()
  const unique = decos.filter((d) => {
    const spec = (d as unknown as { spec: { key?: string } }).spec
    const key = spec?.key
    if (!key) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return DecorationSet.create(state.doc, unique)
}

export const LivePreviewPlugin = Extension.create({
  name: 'livePreview',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: PLUGIN_KEY,
        state: {
          init(_, state) {
            return buildDecorations(state)
          },
          apply(tr, oldDecorations, _oldState, newState) {
            if (tr.selectionSet || tr.docChanged) {
              return buildDecorations(newState)
            }
            return oldDecorations
          },
        },
        props: {
          decorations(state) {
            return PLUGIN_KEY.getState(state)
          },
        },
      }),
    ]
  },
})
