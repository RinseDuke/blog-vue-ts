import source from './StatusBar.vue?raw'

describe('StatusBar source contract', () => {
  it('includes the material shell structure used by the write dock', () => {
    expect(source).toContain('status-bar__inner')
    expect(source).toContain('status-bar__shell')
    expect(source).toContain('sb-surface-btn')
  })
})
