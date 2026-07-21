import source from './BackToTop.vue?raw'

describe('BackToTop write overlay contract', () => {
  it('uses a write-only state above the mobile editor status bar', () => {
    expect(source).toContain(":class=\"{ 'back-to-top--write': isWritePage }\"")
    expect(source).toContain('visible.value = window.scrollY > 600')
    expect(source).toMatch(
      /@media \(max-width: 640px\) {[\s\S]*\.back-to-top--write\s*\{[^}]*bottom: calc\(var\(--write-status-bar-height-mobile, 150px\) \+ 16px \+ env\(safe-area-inset-bottom, 0px\)\);[^}]*z-index: 110;/s
    )
  })

  it('keeps the standard offset for non-write pages', () => {
    expect(source).toMatch(/\.back-to-top\s*\{[^}]*bottom: 32px;/s)
  })
})
