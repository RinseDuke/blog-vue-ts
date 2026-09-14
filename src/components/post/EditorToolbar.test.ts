// @vitest-environment jsdom

import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'

import type { MarkdownToolbarState } from '@/features/post/editor/markdownEditorTypes'

import source from './EditorToolbar.vue?raw'

import EditorToolbar from './EditorToolbar.vue'

enableAutoUnmount(afterEach)

const baseState: MarkdownToolbarState = {
  canUndo: true,
  canRedo: true,
  heading2: false,
  heading3: false,
  bold: false,
  italic: false,
  strike: false,
  bulletList: false,
  orderedList: false,
  blockquote: false,
  codeBlock: false,
  link: false,
  table: false,
}

function mountToolbar(state: Partial<MarkdownToolbarState> = {}) {
  return mount(EditorToolbar, { props: { state: { ...baseState, ...state } } })
}

function commandEvents(wrapper: VueWrapper) {
  return wrapper.emitted('command') ?? []
}

describe('EditorToolbar', () => {
  it('accepts markdown toolbar state and emits commands from the primary actions', async () => {
    const wrapper = mountToolbar()
    const actions = [
      ['撤销 (Ctrl+Z)', 'undo'],
      ['重做 (Ctrl+Y)', 'redo'],
      ['标题 2 (H2)', 'heading-2'],
      ['标题 3 (H3)', 'heading-3'],
      ['加粗 (Ctrl+B)', 'bold'],
      ['斜体 (Ctrl+I)', 'italic'],
      ['无序列表', 'bullet-list'],
      ['引用', 'blockquote'],
      ['代码块', 'code-block'],
      ['删除线', 'strike'],
      ['有序列表', 'ordered-list'],
      ['插入表格', 'table'],
      ['分割线', 'horizontal-rule'],
      ['清空格式', 'clear-formatting'],
    ] as const

    for (const [title, command] of actions) {
      await wrapper.get(`button[title="${title}"]`).trigger('click')
      expect(commandEvents(wrapper).at(-1)).toEqual([command])
    }
  })

  it('prompts for a link URL, emits its payload, and closes the more menu on cancel', async () => {
    const wrapper = mountToolbar()
    const prompt = vi.spyOn(window, 'prompt').mockReturnValueOnce('https://example.com')

    await wrapper.get('button[title="链接"]').trigger('click')
    expect(prompt).toHaveBeenCalledWith('URL', '')
    expect(commandEvents(wrapper).at(-1)).toEqual(['link', 'https://example.com'])

    await wrapper.get('button[title="更多格式"]').trigger('click')
    expect(wrapper.find('.toolbar-more__menu').exists()).toBe(true)
    prompt.mockReturnValueOnce(null)
    const linkAction = wrapper.findAll('.toolbar-more__item').find((item) => item.text() === '链接')
    await linkAction?.trigger('click')

    expect(commandEvents(wrapper)).toHaveLength(1)
    expect(wrapper.find('.toolbar-more__menu').exists()).toBe(false)
    prompt.mockRestore()
  })

  it('reflects active state and undo/redo availability on buttons', async () => {
    const wrapper = mountToolbar({
      canUndo: false,
      canRedo: true,
      heading2: true,
      bold: true,
      strike: true,
      table: true,
    })

    expect(wrapper.get('button[title="撤销 (Ctrl+Z)"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[title="重做 (Ctrl+Y)"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('button[title="标题 2 (H2)"]').classes()).toContain('is-active')
    expect(wrapper.get('button[title="加粗 (Ctrl+B)"]').classes()).toContain('is-active')
    expect(wrapper.get('button[title="删除线"]').classes()).toContain('is-active')
    expect(wrapper.get('button[title="插入表格"]').classes()).toContain('is-active')

    await wrapper.setProps({ state: { ...baseState, table: false } })
    await wrapper.get('button[title="更多格式"]').trigger('click')
    const rowAction = wrapper.findAll('.toolbar-more__item').find((item) => item.text() === '新增一行')
    expect(rowAction?.attributes('disabled')).toBeDefined()
  })

  it('emits table mutation commands and closes the more menu after each action', async () => {
    const wrapper = mountToolbar({ table: true })
    const mutations = [
      ['新增一行', 'add-row'],
      ['新增一列', 'add-column'],
      ['删除当前行', 'delete-row'],
      ['删除当前列', 'delete-column'],
      ['删除表格', 'delete-table'],
    ] as const

    for (const [label, command] of mutations) {
      await wrapper.get('button[title="更多格式"]').trigger('click')
      await wrapper.findAll('.toolbar-more__item').find((item) => item.text() === label)?.trigger('click')
      expect(commandEvents(wrapper).at(-1)).toEqual([command])
      expect(wrapper.find('.toolbar-more__menu').exists()).toBe(false)
    }
  })

  it('keeps the more menu outside the horizontal scroll layer and preserves toolbar semantics', () => {
    expect(source).not.toContain("@tiptap/vue-3")
    expect(source).toContain('editor-toolbar__layout')
    expect(source).toContain('editor-toolbar__scroll')
    expect(source).toContain('editor-toolbar__actions')
    expect(source).toContain('toolbar-btn--compact')
    expect(source).toContain('toolbar-more')
    expect(source).toContain('toolbar-more__menu')
    expect(source.indexOf('editor-toolbar__scroll')).toBeLessThan(source.indexOf('toolbar-more'))
    expect(source).toContain('toolbar-btn--desktop-only')
    expect(source).toContain('toolbar-more__item--mobile-shortcut')
    expect(source).toContain('toolbar-label--desktop-hidden')
    expect(source).toMatch(/@media \(min-width: 769px\) {[\s\S]*\.toolbar-btn[\s\S]*flex-direction: row;/)
    expect(source).toContain('toolbar-btn--desktop-token')
    expect(source).toContain('toolbar-btn--desktop-regular')
    expect(source).toContain('toolbar-btn--desktop-wide')
  })
})
