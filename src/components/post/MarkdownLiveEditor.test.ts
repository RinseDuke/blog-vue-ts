// @vitest-environment jsdom

import { EditorView } from '@codemirror/view'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import MarkdownLiveEditor from './MarkdownLiveEditor.vue'
import source from './MarkdownLiveEditor.vue?raw'

enableAutoUnmount(afterEach)

function getEditorView(element: Element) {
  const editor = element.querySelector<HTMLElement>('.cm-editor')
  const view = editor ? EditorView.findFromDOM(editor) : null

  if (!view) throw new Error('CodeMirror EditorView 未挂载')
  return view
}

describe('MarkdownLiveEditor', () => {
  it('can explicitly discard history even when the draft text is already empty', () => {
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: '旧草稿' } })
    const view = getEditorView(wrapper.element)
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: '' }, userEvent: 'delete' })
    wrapper.vm.resetHistory()
    expect(wrapper.vm.runCommand('undo')).toBe(false)
    expect(wrapper.vm.runCommand('redo')).toBe(false)
    expect(view.state.doc.length).toBe(0)
    expect(wrapper.emitted('toolbar-state')?.at(-1)?.[0]).toMatchObject({ canUndo: false, canRedo: false })
  })

  it('preserves history, selection and one EditorView across source mode changes', async () => {
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: '正文' } })
    const view = getEditorView(wrapper.element)
    view.dispatch({ selection: { anchor: 0, head: 2 } })
    wrapper.vm.runCommand('bold')
    const selection = view.state.selection
    await wrapper.setProps({ sourceMode: true })
    expect(getEditorView(wrapper.element)).toBe(view)
    expect(view.state.selection.eq(selection)).toBe(true)
    expect(wrapper.find('.cm-live-preview-syntax').exists()).toBe(false)
    view.dispatch({ changes: { from: view.state.doc.length, insert: '\n源码追加' }, userEvent: 'input' })
    await wrapper.setProps({ sourceMode: false })
    expect(wrapper.vm.runCommand('undo')).toBe(true)
    expect(view.state.doc.toString()).not.toContain('源码追加')
    wrapper.vm.runCommand('undo')
    expect(view.state.doc.toString()).toBe('正文')
    wrapper.vm.runCommand('redo')
    expect(view.state.doc.toString()).toBe('**正文**')
  })

  it('keeps fenced and indented code literal without heading or formula styling', () => {
    const value = '~~~md\n# **原样** $x$\n~~~\n\n    # **缩进** $y$\n\n正文'
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: value } })
    const view = getEditorView(wrapper.element)
    view.dispatch({ selection: { anchor: value.length } })
    expect(wrapper.get('.cm-content').text()).toContain('# **原样** $x$')
    expect(wrapper.get('.cm-content').text()).toContain('# **缩进** $y$')
    expect(wrapper.find('.cm-live-preview-heading-1').exists()).toBe(false)
    expect(wrapper.find('.cm-rich-preview--formula').exists()).toBe(false)
  })

  it('previews table rows independently and reveals selected logical lines with keyboard movement', () => {
    const value = '| 名称 | 数值 |\n| --- | --- |\n| 甲 | 1 |\n| 乙 | 2 |\n\n正文'
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: value } })
    const view = getEditorView(wrapper.element)
    view.dispatch({ selection: { anchor: value.length } })
    expect(wrapper.findAll('.cm-rich-table-row')).toHaveLength(3)
    view.dispatch({ selection: { anchor: value.indexOf('甲') } })
    expect(wrapper.findAll('.cm-rich-table-row')).toHaveLength(2)
    expect(wrapper.get('.cm-content').text()).toContain('| 甲 | 1 |')
    view.dispatch({ selection: { anchor: value.indexOf('甲'), head: value.indexOf('乙') } })
    expect(wrapper.findAll('.cm-rich-table-row')).toHaveLength(1)
    expect(view.state.doc.toString()).toBe(value)
  })

  it('renders images and math only away from the cursor, and reveals all selected syntax', () => {
    const value = '![图片](/favicon.ico)\n$x^2$\n**正文**\n结束'
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: value } })
    const view = getEditorView(wrapper.element)
    view.dispatch({ selection: { anchor: value.length } })
    expect(wrapper.find('.cm-rich-preview img').attributes('src')).toBe('/favicon.ico')
    expect(wrapper.find('.katex').exists()).toBe(true)
    view.dispatch({ selection: { anchor: 0, head: value.indexOf('正文') } })
    expect(wrapper.find('.cm-rich-preview img').exists()).toBe(false)
    expect(wrapper.find('.katex').exists()).toBe(false)
    expect(wrapper.get('.cm-content').text()).toContain('**正文**')
  })

  it('keeps source as the only value and emits one update for an internal edit', async () => {
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: '正文' } })
    const view = getEditorView(wrapper.element)

    view.dispatch({ selection: { anchor: 0, head: 2 } })
    wrapper.vm.runCommand('bold')
    await nextTick()

    expect(view.state.doc.toString()).toBe('**正文**')
    expect(view.state.selection.main).toMatchObject({ from: 2, to: 4 })
    expect(wrapper.emitted('update:modelValue')).toEqual([['**正文**']])
    expect(wrapper.emitted('change')).toEqual([[]])
  })

  it('uses CodeMirror history for undo and redo and reports toolbar state', async () => {
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: '正文' } })
    const view = getEditorView(wrapper.element)

    view.dispatch({ selection: { anchor: 0, head: 2 } })
    wrapper.vm.runCommand('italic')
    wrapper.vm.runCommand('undo')
    expect(view.state.doc.toString()).toBe('正文')

    wrapper.vm.runCommand('redo')
    await nextTick()
    expect(view.state.doc.toString()).toBe('*正文*')
    expect(wrapper.emitted('toolbar-state')?.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        canUndo: true,
        canRedo: false,
        italic: true,
      })
    )
  })

  it('clears undo and redo history after an external value replacement', async () => {
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: '旧正文' } })
    const view = getEditorView(wrapper.element)

    view.dispatch({ selection: { anchor: 1, head: 3 } })
    wrapper.vm.runCommand('bold')
    expect(view.state.doc.toString()).toBe('旧**正文**')

    await wrapper.setProps({ modelValue: '外部新正文' })
    expect(view.state.doc.toString()).toBe('外部新正文')

    wrapper.vm.runCommand('undo')
    expect(view.state.doc.toString()).toBe('外部新正文')
    wrapper.vm.runCommand('redo')
    expect(view.state.doc.toString()).toBe('外部新正文')
  })

  it('starts recording a fresh history after the external replacement', async () => {
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: '旧正文' } })
    const view = getEditorView(wrapper.element)

    view.dispatch({ selection: { anchor: 1, head: 3 } })
    wrapper.vm.runCommand('bold')
    await wrapper.setProps({ modelValue: '外部新正文' })

    view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } })
    wrapper.vm.runCommand('italic')
    expect(view.state.doc.toString()).toBe('*外部新正文*')

    wrapper.vm.runCommand('undo')
    expect(view.state.doc.toString()).toBe('外部新正文')
    wrapper.vm.runCommand('redo')
    expect(view.state.doc.toString()).toBe('*外部新正文*')
  })

  it('uses GFM parsing for strike state and rendered styling', () => {
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: '~~内容~~' } })
    const view = getEditorView(wrapper.element)

    view.dispatch({ selection: { anchor: 3 } })

    expect(wrapper.emitted('toolbar-state')?.at(-1)?.[0]).toEqual(
      expect.objectContaining({ strike: true })
    )
    expect(wrapper.find('.cm-live-preview-strike').exists()).toBe(true)
  })

  it('applies line commands across a selection and accepts a link payload', () => {
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: '第一行\n第二行' } })
    const view = getEditorView(wrapper.element)

    view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } })
    wrapper.vm.runCommand('blockquote')
    expect(view.state.doc.toString()).toBe('> 第一行\n> 第二行')

    view.dispatch({ selection: { anchor: 2, head: 5 } })
    wrapper.vm.runCommand('link', 'https://example.com')
    expect(view.state.doc.toString()).toContain('[第一行](https://example.com)')
  })

  it('updates decorations when the cursor moves to another logical line', () => {
    const wrapper = mount(MarkdownLiveEditor, {
      props: { modelValue: '**第一行**\n**第二行**' },
    })
    const view = getEditorView(wrapper.element)
    const content = wrapper.get('.cm-content')

    expect(content.text()).toContain('**第一行**')
    expect(content.text()).toContain('第二行')
    expect(content.text()).not.toContain('**第二行**')

    view.dispatch({ selection: { anchor: view.state.doc.line(2).from + 2 } })

    expect(content.text()).toContain('第一行')
    expect(content.text()).not.toContain('**第一行**')
    expect(content.text()).toContain('**第二行**')
  })

  it('reveals fenced code markers only on the active fence line', () => {
    const wrapper = mount(MarkdownLiveEditor, {
      props: { modelValue: '```ts\nconst value = 1\n```\n普通行' },
    })
    const view = getEditorView(wrapper.element)
    const content = wrapper.get('.cm-content')

    view.dispatch({ selection: { anchor: view.state.doc.line(4).from } })
    expect(content.text()).not.toContain('```ts')
    expect(content.text()).not.toContain('```')

    view.dispatch({ selection: { anchor: view.state.doc.line(1).from + 1 } })
    expect(content.text()).toContain('```ts')
  })

  it('accepts external model updates without emitting them back', async () => {
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: '旧内容' } })
    const view = getEditorView(wrapper.element)
    const dispatch = vi.spyOn(view, 'dispatch')

    await wrapper.setProps({ modelValue: '旧文稿' })

    expect(view.state.doc.toString()).toBe('旧文稿')
    expect(dispatch.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        changes: { from: 1, to: 3, insert: '文稿' },
      })
    )
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('dispatches only the smallest changed source range for toolbar commands', () => {
    const wrapper = mount(MarkdownLiveEditor, { props: { modelValue: '前正文后' } })
    const view = getEditorView(wrapper.element)

    view.dispatch({ selection: { anchor: 1, head: 3 } })
    const dispatch = vi.spyOn(view, 'dispatch')
    wrapper.vm.runCommand('bold')

    expect(dispatch.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        changes: { from: 1, to: 3, insert: '**正文**' },
      })
    )
    expect(view.state.doc.toString()).toBe('前**正文**后')
  })

  it('shows the placeholder, exposes focus, and destroys the EditorView on unmount', () => {
    const destroy = vi.spyOn(EditorView.prototype, 'destroy')
    const wrapper = mount(MarkdownLiveEditor, {
      props: { modelValue: '', placeholder: '写点什么' },
      attachTo: document.body,
    })
    const view = getEditorView(wrapper.element)
    const focus = vi.spyOn(view, 'focus')

    expect(wrapper.get('.cm-placeholder').text()).toBe('写点什么')
    wrapper.vm.focus()
    expect(focus).toHaveBeenCalledOnce()

    wrapper.unmount()
    expect(destroy).toHaveBeenCalledOnce()
    destroy.mockRestore()
  })

  it('uses shared typography and color tokens without active-line styling', () => {
    expect(source).toContain('font-family: var(--font-body)')
    expect(source).toContain('font-family: var(--font-display)')
    expect(source).toContain('font-family: var(--font-mono)')
    expect(source).toContain('color: var(--write-markdown-syntax, var(--ink-muted))')
    expect(source).toContain('caret-color: var(--write-markdown-caret, var(--ink-strong))')
    expect(source).toContain('border-left-color: var(--write-markdown-caret, var(--ink-strong))')
    expect(source).not.toContain('highlightActiveLine')
    expect(source).not.toContain('.cm-activeLine')
    expect(source).not.toContain('.cm-activeLineGutter')
  })
})
