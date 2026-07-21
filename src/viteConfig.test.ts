// @ts-expect-error - Node types are intentionally excluded from the browser app project.
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')

describe('Vite devtools plugin contract', () => {
  it('keeps Vue DevTools behind an explicit opt-in', () => {
    expect(source).toContain("process.env.VITE_ENABLE_VUE_DEVTOOLS === 'true'")
  })

  it('restricts Vue DevTools to the development server', () => {
    expect(source).toContain("command === 'serve'")
    expect(source).not.toContain('plugins: [vue(), vueDevTools()]')
  })

  it('loads the optional plugin only inside the guarded branch', () => {
    expect(source).toMatch(
      /if \(enableVueDevTools\) \{[\s\S]*?import\('vite-plugin-vue-devtools'\)[\s\S]*?plugins\.push\(vueDevTools\(\)\)[\s\S]*?\}/,
    )
  })
})
