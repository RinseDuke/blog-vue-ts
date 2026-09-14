// @vitest-environment node

import { renderToString } from '@vue/server-renderer'
import mermaid from 'mermaid'
import { createSSRApp } from 'vue'

import MarkdownPreview from './MarkdownPreview.vue'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}))

it('renders without browser globals or mermaid access during SSR', async () => {
  const fence = String.fromCharCode(96).repeat(3)
  const source = ['# 标题', '', '正文', '', fence + 'mermaid', 'graph LR', 'A --> B', fence].join('\n')

  expect(typeof window).toBe('undefined')
  expect(typeof document).toBe('undefined')

  const html = await renderToString(createSSRApp(MarkdownPreview, { source }))

  expect(html).toContain('正文')
  expect(html).toContain('language-mermaid')
  expect(mermaid.render).not.toHaveBeenCalled()
})
