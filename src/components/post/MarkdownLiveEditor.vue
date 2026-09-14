<script setup lang="ts">
import {
  defaultKeymap,
  history,
  historyKeymap,
  redo,
  redoDepth,
  undo,
  undoDepth,
} from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { syntaxTree } from '@codemirror/language'
import {
  Compartment,
  EditorSelection,
  EditorState,
  RangeSet,
  StateField,
  Transaction,
  type Range,
} from '@codemirror/state'
import {
  Decoration,
  EditorView,
  keymap,
  placeholder as editorPlaceholder,
  WidgetType,
  type DecorationSet,
} from '@codemirror/view'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  createMarkdownDecorationState,
  getMinimalTextChange,
  getMarkdownCodeRanges,
  updateMarkdownDecorationState,
  type MarkdownDecorationRange,
  type MarkdownDecorationState,
} from '@/features/post/editor/livePreviewDecorations'
import { applyMarkdownCommand, type MarkdownCommand } from '@/features/post/editor/markdownCommands'
import type { MarkdownToolbarState } from '@/features/post/editor/markdownEditorTypes'
import { getRichPreviewRanges, type RichPreviewRange } from '@/features/post/editor/richPreview'
import 'katex/dist/katex.min.css'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    sourceMode?: boolean
  }>(),
  { placeholder: '', sourceMode: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: []
  'toolbar-state': [state: MarkdownToolbarState]
}>()

const hostRef = ref<HTMLElement | null>(null)
const placeholderCompartment = new Compartment()
const historyCompartment = new Compartment()
const previewCompartment = new Compartment()
let editorView: EditorView | null = null
let applyingExternalValue = false

class TaskCheckboxWidget extends WidgetType {
  constructor(private readonly checked: boolean) {
    super()
  }

  eq(other: TaskCheckboxWidget) {
    return this.checked === other.checked
  }

  toDOM() {
    const checkbox = document.createElement('span')
    checkbox.className = 'cm-live-preview-task-checkbox'
    checkbox.setAttribute('aria-hidden', 'true')
    checkbox.textContent = this.checked ? '☑' : '☐'
    return checkbox
  }

  ignoreEvent() {
    return true
  }
}

class ListMarkerWidget extends WidgetType {
  constructor(private readonly marker: string) {
    super()
  }

  eq(other: ListMarkerWidget) {
    return this.marker === other.marker
  }

  toDOM() {
    const marker = document.createElement('span')
    marker.className = 'cm-live-preview-list-marker'
    marker.setAttribute('aria-hidden', 'true')
    marker.textContent = this.marker
    return marker
  }

  ignoreEvent() {
    return true
  }
}

function createHiddenDecoration(source: string, range: MarkdownDecorationRange) {
  const marker = source.slice(range.from, range.to)
  const task = marker.match(/^(?:[-+*]|\d+[.)])[ \t]+\[([ xX])\][ \t]+$/u)

  if (task) {
    return Decoration.replace({ widget: new TaskCheckboxWidget(task[1].toLowerCase() === 'x') })
  }

  const unorderedList = marker.match(/^[-+*][ \t]+$/u)
  if (unorderedList) {
    return Decoration.replace({ widget: new ListMarkerWidget('• ') })
  }

  const orderedList = marker.match(/^(\d+)[.)][ \t]+$/u)
  if (orderedList) {
    return Decoration.replace({ widget: new ListMarkerWidget(`${orderedList[1]}. `) })
  }

  return Decoration.replace({})
}

function addLineDecorations(state: EditorState, decorations: Array<Range<Decoration>>) {
  const codeRanges = getMarkdownCodeRanges(state.doc.toString()).filter((range) => range.block)
  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const line = state.doc.line(lineNumber)
    const text = line.text
    if (codeRanges.some((range) => line.from < range.to && line.to > range.from)) {
      decorations.push(Decoration.line({ attributes: { class: 'cm-live-preview-code-line' } }).range(line.from))
      continue
    }
    const heading = text.match(/^[ \t]{0,3}(#{1,6})[ \t]+/u)

    if (heading) {
      decorations.push(
        Decoration.line({
          attributes: { class: `cm-live-preview-heading-${heading[1].length}` },
        }).range(line.from)
      )
    }

    if (/^[ \t]{0,3}>/u.test(text)) {
      decorations.push(
        Decoration.line({ attributes: { class: 'cm-live-preview-blockquote-line' } }).range(
          line.from
        )
      )
    }

    if (/^[ \t]{0,3}(?:[-+*]|\d+[.)])[ \t]+\[[ xX]\][ \t]+/u.test(text)) {
      decorations.push(
        Decoration.line({ attributes: { class: 'cm-live-preview-task-line' } }).range(line.from)
      )
    }

    if (/^[ \t]{0,3}(?:`{3,}|~{3,})/u.test(text)) {
      decorations.push(
        Decoration.line({ attributes: { class: 'cm-live-preview-code-line' } }).range(line.from)
      )
    }
  }
}

function addSyntaxTreeDecorations(
  state: EditorState,
  decorations: Array<Range<Decoration>>
) {
  syntaxTree(state).iterate({
    enter(node) {
      const className =
        node.name === 'StrongEmphasis'
          ? 'cm-live-preview-strong'
          : node.name === 'Emphasis'
            ? 'cm-live-preview-emphasis'
            : node.name === 'Strikethrough'
              ? 'cm-live-preview-strike'
              : node.name === 'Link'
                ? 'cm-live-preview-link'
                : node.name === 'InlineCode'
                  ? 'cm-live-preview-inline-code'
                  : node.name === 'FencedCode'
                    ? 'cm-live-preview-code-block'
                    : ''

      if (className && node.from < node.to) {
        decorations.push(Decoration.mark({ class: className }).range(node.from, node.to))
      }
    },
  })
}

function addFormulaAndFootnoteDecorations(
  source: string,
  decorations: Array<Range<Decoration>>
) {
  const formula = /(?<!\\)\$([^$\r\n\s](?:[^$\r\n]*?[^$\r\n\s])?)\$/gu
  const footnote = /(?<!\\)\[\^([^\]\r\n]+)\]/gu
  const codeRanges = getMarkdownCodeRanges(source)

  for (const match of source.matchAll(formula)) {
    const from = (match.index ?? 0) + 1
    if (codeRanges.some((range) => from >= range.from && from < range.to)) continue
    decorations.push(
      Decoration.mark({ class: 'cm-live-preview-formula' }).range(from, from + match[1].length)
    )
  }

  for (const match of source.matchAll(footnote)) {
    const from = (match.index ?? 0) + 2
    if (codeRanges.some((range) => from >= range.from && from < range.to)) continue
    decorations.push(
      Decoration.mark({ class: 'cm-live-preview-footnote' }).range(from, from + match[1].length)
    )
  }
}

function buildStaticDecorations(state: EditorState): DecorationSet {
  const decorations: Array<Range<Decoration>> = []

  addLineDecorations(state, decorations)
  addSyntaxTreeDecorations(state, decorations)
  addFormulaAndFootnoteDecorations(state.doc.toString(), decorations)

  return Decoration.set(decorations, true)
}

function buildDynamicDecorations(
  source: string,
  ranges: MarkdownDecorationRange[]
): DecorationSet {
  const decorations: Array<Range<Decoration>> = []

  for (const range of ranges) {
    const decoration =
      range.kind === 'syntax'
        ? Decoration.mark({ class: 'cm-live-preview-syntax' })
        : createHiddenDecoration(source, range)
    decorations.push(decoration.range(range.from, range.to))
  }

  return Decoration.set(decorations, true)
}

class RichPreviewWidget extends WidgetType {
  constructor(private readonly preview: RichPreviewRange) { super() }

  eq(other: RichPreviewWidget) {
    return this.preview.html === other.preview.html && this.preview.from === other.preview.from
  }

  toDOM(view: EditorView) {
    const element = document.createElement('span')
    element.className = `cm-rich-preview cm-rich-preview--${this.preview.kind}`
    element.innerHTML = this.preview.html
    element.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return
      event.preventDefault()
      view.dispatch({ selection: { anchor: this.preview.from } })
      view.focus()
    })
    // 图片加载后重新测量，保证后面的光标和滚动位置正确。
    element.querySelectorAll('img').forEach((img) => {
      img.addEventListener('load', () => view.requestMeasure(), { once: true })
      img.addEventListener('error', () => view.requestMeasure(), { once: true })
    })
    return element
  }

  ignoreEvent() { return false }
}

class LivePreviewState {
  markdownState: MarkdownDecorationState
  staticDecorations: DecorationSet
  decorations: DecorationSet
  richRanges: RichPreviewRange[]
  selectedLines: string

  constructor(state: EditorState, previous?: LivePreviewState) {
    const source = state.doc.toString()
    const unchanged = previous?.markdownState.source === source
    this.markdownState = unchanged
      ? updateMarkdownDecorationState(previous.markdownState, source, state.selection.main.head)
      : createMarkdownDecorationState(source, state.selection.main.head)
    this.staticDecorations = unchanged ? previous.staticDecorations : buildStaticDecorations(state)
    this.richRanges = unchanged ? previous.richRanges : getRichPreviewRanges(source)
    const selected = getSelectedLines(state)
    this.selectedLines = JSON.stringify(selected)
    const touchesSelection = (from: number, to: number) => selected.some(([start, end]) => from <= end && to >= start)
    const previews = this.richRanges.filter((range) => !touchesSelection(range.from, range.to))
    const markers = this.markdownState.ranges
      .filter((range) => !previews.some((preview) => range.from < preview.to && range.to > preview.from))
      .map((range) => touchesSelection(range.from, range.to) ? { ...range, kind: 'syntax' as const } : range)
    for (const row of this.richRanges.filter((range) => range.kind === 'table-row' && touchesSelection(range.from, range.to))) {
      const text = source.slice(row.from, row.to)
      if (/^[\s|:-]+$/u.test(text)) {
        markers.push({ from: row.from, to: row.to, kind: 'syntax' })
      } else {
        for (const match of text.matchAll(/(?<!\\)(?:\\\\)*\|/gu)) {
          const from = row.from + match.index + match[0].length - 1
          markers.push({ from, to: from + 1, kind: 'syntax' })
        }
      }
    }
    this.decorations = RangeSet.join([
      this.staticDecorations,
      buildDynamicDecorations(source, markers),
      Decoration.set(previews.map((range) => Decoration.replace({ widget: new RichPreviewWidget(range) }).range(range.from, range.to)), true),
      Decoration.set(previews.filter((range) => range.kind === 'table-row').map((range) =>
        Decoration.line({ attributes: { class: 'cm-rich-table-preview-line' } }).range(state.doc.lineAt(range.from).from)), true),
    ])
  }
}

function getSelectedLines(state: EditorState) {
  return state.selection.ranges.map((range) => [state.doc.lineAt(range.from).from, state.doc.lineAt(range.to).to])
}

const livePreviewField = StateField.define<LivePreviewState>({
  create: (state) => new LivePreviewState(state),
  update(value, transaction) {
    if (!transaction.docChanged && JSON.stringify(getSelectedLines(transaction.state)) === value.selectedLines) return value
    return new LivePreviewState(transaction.state, value)
  },
  provide: (field) => EditorView.decorations.from(field, (value) => value.decorations),
})

function lineContext(state: EditorState) {
  const line = state.doc.lineAt(state.selection.main.head)
  return line.text
}

function syntaxContext(state: EditorState) {
  const names = new Set<string>()
  const positions = [state.selection.main.from, state.selection.main.to]

  for (const position of positions) {
    let node = syntaxTree(state).resolveInner(position, -1)
    while (node) {
      names.add(node.name)
      if (!node.parent) break
      node = node.parent
    }
  }

  return names
}

function isInsideMarkdownTable(state: EditorState) {
  const current = state.doc.lineAt(state.selection.main.head)
  let fromLine = current.number
  let toLine = current.number

  while (fromLine > 1 && state.doc.line(fromLine - 1).text.includes('|')) fromLine -= 1
  while (toLine < state.doc.lines && state.doc.line(toLine + 1).text.includes('|')) toLine += 1

  for (let lineNumber = fromLine; lineNumber < toLine; lineNumber += 1) {
    const first = state.doc.line(lineNumber).text
    const second = state.doc.line(lineNumber + 1).text
    if (
      first.includes('|') &&
      /^\s*\|?\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)+\s*\|?\s*$/u.test(second)
    ) {
      return true
    }
  }

  return false
}

function getToolbarState(state: EditorState): MarkdownToolbarState {
  const line = lineContext(state)
  const syntax = syntaxContext(state)

  return {
    canUndo: undoDepth(state) > 0,
    canRedo: redoDepth(state) > 0,
    heading2: /^[ \t]{0,3}##[ \t]+/u.test(line),
    heading3: /^[ \t]{0,3}###[ \t]+/u.test(line),
    bold: syntax.has('StrongEmphasis'),
    italic: syntax.has('Emphasis'),
    strike: syntax.has('Strikethrough'),
    bulletList: /^[ \t]{0,3}[-+*][ \t]+/u.test(line),
    orderedList: /^[ \t]{0,3}\d+[.)][ \t]+/u.test(line),
    blockquote: /^[ \t]{0,3}>[ \t]?/u.test(line),
    codeBlock: syntax.has('FencedCode'),
    link: syntax.has('Link'),
    table: isInsideMarkdownTable(state),
  }
}

function emitToolbarState(state: EditorState) {
  emit('toolbar-state', getToolbarState(state))
}

function runCommand(command: MarkdownCommand, payload = '') {
  const view = editorView
  if (!view) return false

  view.focus()
  if (command === 'undo') return undo(view)
  if (command === 'redo') return redo(view)

  const source = view.state.doc.toString()
  const selection = view.state.selection.main
  const result = applyMarkdownCommand(
    source,
    { from: selection.from, to: selection.to },
    command,
    payload
  )

  if (
    result.value === source &&
    result.selection.from === selection.from &&
    result.selection.to === selection.to
  ) {
    return false
  }

  const change = getMinimalTextChange(source, result.value)
  if (!change) return false

  view.dispatch({
    changes: change,
    selection: EditorSelection.range(result.selection.from, result.selection.to),
    userEvent: 'input',
  })
  return true
}

function focus() {
  editorView?.requestMeasure()
  editorView?.focus()
}

function resetHistory() {
  const view = editorView
  if (!view) return
  view.dispatch({ effects: historyCompartment.reconfigure([]) })
  view.dispatch({ effects: historyCompartment.reconfigure(history()) })
  emitToolbarState(view.state)
}

defineExpose({ runCommand, focus, resetHistory })

onMounted(() => {
  if (!hostRef.value) return

  editorView = new EditorView({
    parent: hostRef.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        historyCompartment.of(history()),
        markdown({ base: markdownLanguage }),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': props.placeholder || 'Markdown 编辑器',
          spellcheck: 'true',
        }),
        keymap.of([
          { key: 'Mod-b', run: () => runCommand('bold') },
          { key: 'Mod-i', run: () => runCommand('italic') },
          ...defaultKeymap, ...historyKeymap,
        ]),
        placeholderCompartment.of(editorPlaceholder(props.placeholder)),
        previewCompartment.of(props.sourceMode ? [] : livePreviewField),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !applyingExternalValue) {
            emit('update:modelValue', update.state.doc.toString())
            emit('change')
          }

          if (update.docChanged || update.selectionSet) emitToolbarState(update.state)
        }),
      ],
    }),
  })
  emitToolbarState(editorView.state)
})

watch(
  () => props.modelValue,
  (value) => {
    const view = editorView
    if (!view || value === view.state.doc.toString()) return

    const change = getMinimalTextChange(view.state.doc.toString(), value)
    if (!change) return

    const mapPosition = (position: number) => {
      if (position <= change.from) return position
      if (position >= change.to) {
        return Math.max(0, Math.min(value.length, position + change.insert.length - (change.to - change.from)))
      }
      return change.from + change.insert.length
    }

    const currentSelection = view.state.selection.main
    applyingExternalValue = true
    try {
      // 先移除再重新挂载，避免同一事务重配置时保留旧 history 字段状态。
      view.dispatch({ effects: historyCompartment.reconfigure([]) })
      view.dispatch({
        changes: change,
        selection: EditorSelection.range(
          mapPosition(currentSelection.from),
          mapPosition(currentSelection.to)
        ),
        annotations: Transaction.addToHistory.of(false),
        effects: historyCompartment.reconfigure(history()),
      })
    } finally {
      applyingExternalValue = false
    }
  }
)

watch(
  () => props.sourceMode,
  (sourceMode) => {
    editorView?.dispatch({ effects: previewCompartment.reconfigure(sourceMode ? [] : livePreviewField) })
    editorView?.requestMeasure()
  }
)

watch(
  () => props.placeholder,
  (value) => {
    editorView?.dispatch({
      effects: placeholderCompartment.reconfigure(editorPlaceholder(value)),
    })
  }
)

onBeforeUnmount(() => {
  editorView?.destroy()
  editorView = null
})
</script>

<template>
  <div ref="hostRef" class="markdown-live-editor" :class="{ 'markdown-live-editor--source': sourceMode }"></div>
</template>

<style scoped>
.markdown-live-editor {
  min-height: inherit;
  color: var(--ink-main);
  font-family: var(--font-body);
}

.markdown-live-editor :deep(.cm-editor) {
  min-height: inherit;
  color: var(--ink-main);
  background: transparent;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.72;
}

.markdown-live-editor :deep(.cm-editor.cm-focused) {
  outline: none;
}

.markdown-live-editor :deep(.cm-scroller) {
  min-height: inherit;
  overflow: visible;
  font-family: inherit;
}

.markdown-live-editor :deep(.cm-content) {
  min-height: inherit;
  padding: 0;
  caret-color: var(--write-markdown-caret, var(--ink-strong));
  font-family: var(--font-body);
}

.markdown-live-editor :deep(.cm-line) {
  padding: 0;
}

.markdown-live-editor :deep(.cm-cursor),
.markdown-live-editor :deep(.cm-dropCursor) {
  border-left-color: var(--write-markdown-caret, var(--ink-strong));
}

.markdown-live-editor :deep(.cm-placeholder) {
  color: var(--ink-muted);
  font-style: normal;
}

.markdown-live-editor :deep(.cm-live-preview-heading-1),
.markdown-live-editor :deep(.cm-live-preview-heading-2),
.markdown-live-editor :deep(.cm-live-preview-heading-3),
.markdown-live-editor :deep(.cm-live-preview-heading-4),
.markdown-live-editor :deep(.cm-live-preview-heading-5),
.markdown-live-editor :deep(.cm-live-preview-heading-6) {
  color: var(--ink-strong);
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 1.35;
}

.markdown-live-editor :deep(.cm-live-preview-heading-1) {
  font-size: 2em;
}

.markdown-live-editor :deep(.cm-live-preview-heading-2) {
  font-size: 1.55em;
}

.markdown-live-editor :deep(.cm-live-preview-heading-3) {
  font-size: 1.3em;
}

.markdown-live-editor :deep(.cm-live-preview-heading-4) {
  font-size: 1.14em;
}

.markdown-live-editor :deep(.cm-live-preview-heading-5),
.markdown-live-editor :deep(.cm-live-preview-heading-6) {
  font-size: 1em;
}

.markdown-live-editor :deep(.cm-live-preview-strong) {
  color: var(--ink-strong);
  font-weight: 700;
}

.markdown-live-editor :deep(.cm-live-preview-emphasis) {
  font-style: italic;
}

.markdown-live-editor :deep(.cm-live-preview-strike) {
  text-decoration: line-through;
}

.markdown-live-editor :deep(.cm-live-preview-link) {
  color: var(--brand-500);
  text-decoration: underline;
  text-underline-offset: 0.16em;
}

.markdown-live-editor :deep(.cm-live-preview-inline-code),
.markdown-live-editor :deep(.cm-live-preview-formula),
.markdown-live-editor :deep(.cm-live-preview-code-block),
.markdown-live-editor :deep(.cm-live-preview-code-line) {
  color: var(--ink-strong);
  font-family: var(--font-mono);
}

.markdown-live-editor :deep(.cm-live-preview-footnote) {
  color: var(--brand-500);
  font-family: var(--font-mono);
  font-size: 0.72em;
  vertical-align: super;
}

.markdown-live-editor :deep(.cm-live-preview-blockquote-line) {
  padding-left: 0.85rem;
  color: var(--ink-muted);
  font-style: italic;
}

.markdown-live-editor :deep(.cm-live-preview-task-line) {
  color: var(--ink-main);
}

.markdown-live-editor :deep(.cm-live-preview-task-checkbox),
.markdown-live-editor :deep(.cm-live-preview-list-marker) {
  color: var(--ink-muted);
  font-family: var(--font-mono);
  font-style: normal;
  text-decoration: none;
}

.markdown-live-editor :deep(.cm-live-preview-task-checkbox) {
  display: inline-block;
  width: 1.35em;
}

.markdown-live-editor :deep(.cm-live-preview-syntax) {
  color: var(--write-markdown-syntax, var(--ink-muted));
  font-family: var(--font-mono);
  font-size: 0.86em;
  font-style: normal;
  font-weight: 400;
  text-decoration: none;
}

.markdown-live-editor--source :deep(.cm-content) {
  font-family: var(--font-mono);
}

.markdown-live-editor :deep(.cm-rich-preview) {
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;
}

.markdown-live-editor :deep(.cm-rich-preview img) {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
  vertical-align: middle;
  border-radius: 6px;
}

.markdown-live-editor :deep(.cm-rich-preview--formula) {
  overflow-x: auto;
}

.markdown-live-editor :deep(.cm-rich-preview--formula p) {
  margin: 0;
}

.markdown-live-editor :deep(.cm-rich-preview--table-row) {
  width: 100%;
  vertical-align: top;
}

.markdown-live-editor :deep(.cm-rich-table-preview-line) {
  line-height: 0;
}

.markdown-live-editor :deep(.cm-rich-table-preview-line .cm-widgetBuffer) {
  height: 0;
}

.markdown-live-editor :deep(.cm-rich-table-row) {
  display: flex;
  width: 100%;
  line-height: 1.72;
  border-bottom: 1px solid var(--line-soft);
}

.markdown-live-editor :deep(.cm-rich-table-cell) {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.35rem 0.6rem;
  overflow-wrap: anywhere;
  border-right: 1px solid var(--line-soft);
}

.markdown-live-editor :deep(.cm-rich-table-header) {
  font-weight: 650;
  background: var(--surface-hover);
}

.markdown-live-editor :deep(.cm-rich-table-divider) {
  display: block;
  border-top: 1px solid var(--line-strong);
}
</style>
