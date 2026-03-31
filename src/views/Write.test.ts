import source from './Write.vue?raw'

describe('Write view source contract', () => {
  it('keeps the toolbar above a unified editor main card', () => {
    expect(source).toContain('editor-main-card')
    expect(source).toContain('editor-main-card__header')
    expect(source).toContain('editor-main-card__canvas')
    expect(source.indexOf('<EditorToolbar')).toBeLessThan(source.indexOf('editor-main-card'))
  })
})
