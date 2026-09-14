import { resolveAuthRedirect } from '@/features/auth/utils/redirect'

describe('resolveAuthRedirect', () => {
  it('keeps internal redirect targets', () => {
    expect(resolveAuthRedirect('/write?from=comment#editor')).toBe('/write?from=comment#editor')
  })

  it('falls back for invalid or external redirect targets', () => {
    expect(resolveAuthRedirect(undefined)).toBe('/about')
    expect(resolveAuthRedirect('https://example.com')).toBe('/about')
    expect(resolveAuthRedirect('//example.com')).toBe('/about')
    expect(resolveAuthRedirect('/\\example.com')).toBe('/about')
    expect(resolveAuthRedirect('/%2Fexample.com')).toBe('/about')
    expect(resolveAuthRedirect('/%5Cexample.com')).toBe('/about')
    expect(resolveAuthRedirect('article')).toBe('/about')
  })
})
