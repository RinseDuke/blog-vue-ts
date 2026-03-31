import source from './EditorToolbar.vue?raw'

describe('EditorToolbar source contract', () => {
  it('includes the shared surface structure for the write toolbar', () => {
    expect(source).toContain('editor-toolbar__surface')
    expect(source).toContain('toolbar-group--surface')
    expect(source).toContain('toolbar-btn--surface')
  })
})
