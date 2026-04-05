import source from './EditorToolbar.vue?raw'

describe('EditorToolbar source contract', () => {
  it('keeps the more menu outside the horizontal scroll layer', () => {
    expect(source).toContain('editor-toolbar__layout')
    expect(source).toContain('editor-toolbar__scroll')
    expect(source).toContain('editor-toolbar__actions')
    expect(source).toContain('toolbar-btn--compact')
    expect(source).toContain('toolbar-more')
    expect(source).toContain('toolbar-more__menu')
    expect(source.indexOf('editor-toolbar__scroll')).toBeLessThan(source.indexOf('toolbar-more'))
  })

  it('exposes table editing actions in the more menu', () => {
    expect(source).toContain('插入表格')
    expect(source).toContain('新增一行')
    expect(source).toContain('新增一列')
    expect(source).toContain('删除当前行')
    expect(source).toContain('删除当前列')
    expect(source).toContain('删除表格')
    expect(source).toContain('addRowAfter')
    expect(source).toContain('addColumnAfter')
    expect(source).toContain('deleteRow')
    expect(source).toContain('deleteColumn')
    expect(source).toContain('deleteTable')
  })

  it('surfaces desktop shortcuts while keeping mobile-only duplicates in the more menu', () => {
    expect(source).toContain('toolbar-btn--desktop-only')
    expect(source).toContain('toolbar-more__item--mobile-shortcut')
  })

  it('uses an inline desktop toolbar treatment with deduplicated heading labels', () => {
    expect(source).toContain('toolbar-label--desktop-hidden')
    expect(source).toMatch(/@media \(min-width: 769px\) {[\s\S]*\.toolbar-btn[\s\S]*flex-direction: row;/)
  })

  it('assigns desktop width tiers to keep the toolbar rhythm consistent', () => {
    expect(source).toContain('toolbar-btn--desktop-token')
    expect(source).toContain('toolbar-btn--desktop-regular')
    expect(source).toContain('toolbar-btn--desktop-wide')
  })
})
