import source from './Write.vue?raw'

describe('Write view source contract', () => {
  it('keeps the toolbar above the editor card with a compact toolbar wrapper', () => {
    expect(source).toContain('editor-toolbar-wrap')
    expect(source).toContain('editor-main-card')
    expect(source).toContain('editor-main-card__header')
    expect(source).toContain('editor-main-card__canvas')
    expect(source.indexOf('editor-toolbar-wrap')).toBeLessThan(source.indexOf('editor-main-card'))
  })

  it('lets the desktop editor width follow the shared write content max width', () => {
    expect(source).toMatch(/\.editor-main\s*\{[\s\S]*max-width: var\(--write-content-max-width, 980px\);/)
  })
})
