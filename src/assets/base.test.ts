/// <reference types="node" />

import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('./base.css', import.meta.url), 'utf8')

describe('modern community visual tokens', () => {
  it('uses local system fonts without remote font imports', () => {
    expect(source).not.toContain('@import url(')
    expect(source).toContain("--font-body: -apple-system, BlinkMacSystemFont")
    expect(source).toContain("'PingFang SC'")
  })

  it('uses neutral surfaces and a restrained blue interaction color', () => {
    expect(source).toContain('--bg-canvas: #f5f5f7;')
    expect(source).toContain('--surface-strong: #ffffff;')
    expect(source).toContain('--brand-500: #0071e3;')
  })
})
