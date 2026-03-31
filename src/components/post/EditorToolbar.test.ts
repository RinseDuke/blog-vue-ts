import source from './EditorToolbar.vue?raw'

describe('EditorToolbar source contract', () => {
  it('renders a compact single-row toolbar with a more menu trigger', () => {
    expect(source).toContain('editor-toolbar__track')
    expect(source).toContain('toolbar-btn--compact')
    expect(source).toContain('toolbar-more')
    expect(source).toContain('toolbar-more__menu')
  })
})
