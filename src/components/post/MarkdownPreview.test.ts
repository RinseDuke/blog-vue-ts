// @vitest-environment jsdom

import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import mermaid from 'mermaid'
import { nextTick } from 'vue'

import MarkdownPreview from './MarkdownPreview.vue'
import source from './MarkdownPreview.vue?raw'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}))

const renderMermaid = vi.mocked(mermaid.render)
const initializeMermaid = vi.mocked(mermaid.initialize)
const fence = String.fromCharCode(96).repeat(3)

enableAutoUnmount(afterEach)

async function settlePreview() {
  await nextTick()
  await flushPromises()
  await nextTick()
}

describe('MarkdownPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete document.documentElement.dataset.theme
    renderMermaid.mockResolvedValue({
      diagramType: 'flowchart',
      svg: '<svg data-testid="mermaid-svg"></svg>',
    })
  })

  it('rerenders mermaid after the source changes', async () => {
    const wrapper = mount(MarkdownPreview, {
      props: { source: [fence + 'mermaid', 'graph LR', 'A --> B', fence].join('\n') },
    })

    await settlePreview()
    expect(renderMermaid).toHaveBeenCalledTimes(1)
    expect(renderMermaid.mock.calls[0]?.[1]).toContain('graph LR')

    await wrapper.setProps({
      source: [fence + 'mermaid', 'graph TD', 'C --> D', fence].join('\n'),
    })
    await settlePreview()

    expect(renderMermaid).toHaveBeenCalledTimes(2)
    expect(renderMermaid.mock.calls[1]?.[1]).toContain('graph TD')
    expect(wrapper.find('[data-testid="mermaid-svg"]').exists()).toBe(true)
  })

  it('keeps readable mermaid source when rendering fails', async () => {
    renderMermaid.mockRejectedValueOnce(new Error('invalid mermaid'))
    const wrapper = mount(MarkdownPreview, {
      props: { source: [fence + 'mermaid', 'graph LR', 'A -->', fence].join('\n') },
    })

    await settlePreview()

    expect(wrapper.find('code.language-mermaid').text()).toContain('graph LR')
    expect(wrapper.find('pre.markdown-preview__mermaid-source').exists()).toBe(true)
  })

  it('rerenders mermaid with the dark theme when the website theme changes', async () => {
    document.documentElement.dataset.theme = 'light'
    const wrapper = mount(MarkdownPreview, {
      props: { source: [fence + 'mermaid', 'graph LR', 'A --> B', fence].join('\n') },
    })

    await settlePreview()
    expect(initializeMermaid).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'default' }))

    document.documentElement.dataset.theme = 'dark'
    await settlePreview()

    expect(renderMermaid).toHaveBeenCalledTimes(2)
    expect(initializeMermaid).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'dark' }))

    wrapper.unmount()
    document.documentElement.dataset.theme = 'light'
    await settlePreview()
    expect(renderMermaid).toHaveBeenCalledTimes(2)
  })

  it('does not mutate detached content when mermaid finishes after unmount', async () => {
    const bindFunctions = vi.fn()
    let resolveRender!: (result: Awaited<ReturnType<typeof mermaid.render>>) => void
    renderMermaid.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveRender = resolve
      })
    )
    const wrapper = mount(MarkdownPreview, {
      props: { source: [fence + 'mermaid', 'graph LR', 'A --> B', fence].join('\n') },
    })

    await settlePreview()
    expect(renderMermaid).toHaveBeenCalledTimes(1)
    const detachedPreview = wrapper.element

    wrapper.unmount()
    resolveRender({
      bindFunctions,
      diagramType: 'flowchart',
      svg: '<svg data-testid="late-mermaid-svg"></svg>',
    })
    await settlePreview()

    expect(detachedPreview.querySelector('code.language-mermaid')).not.toBeNull()
    expect(detachedPreview.querySelector('[data-testid="late-mermaid-svg"]')).toBeNull()
    expect(bindFunctions).not.toHaveBeenCalled()
  })

  it('stops rendering remaining mermaid blocks after unmount', async () => {
    let resolveRender!: (result: Awaited<ReturnType<typeof mermaid.render>>) => void
    renderMermaid.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveRender = resolve
      })
    )
    const wrapper = mount(MarkdownPreview, {
      props: {
        source: [
          fence + 'mermaid',
          'graph LR',
          'A --> B',
          fence,
          '',
          fence + 'mermaid',
          'graph TD',
          'C --> D',
          fence,
        ].join('\n'),
      },
    })

    await settlePreview()
    expect(renderMermaid).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    resolveRender({
      diagramType: 'flowchart',
      svg: '<svg></svg>',
    })
    await settlePreview()

    expect(renderMermaid).toHaveBeenCalledTimes(1)
  })

  it('reuses the website font variables', () => {
    expect(source).toContain('font-family: var(--font-body)')
    expect(source).toContain('font-family: var(--font-display)')
    expect(source).toContain('font-family: var(--font-mono)')
    expect(source).not.toMatch(/font-family:\s*['"]/)
  })
})
