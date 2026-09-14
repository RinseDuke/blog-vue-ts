// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useReadingProgress } from './useReadingProgress'

describe('whole-page reading progress', () => {
  let height: number
  let viewport: number
  let top: number
  let nextFrame: number
  let frames: Map<number, FrameRequestCallback>
  let onResize: () => void
  let disconnect: ReturnType<typeof vi.fn>
  let wrapper: ReturnType<typeof mount> | undefined

  beforeEach(() => {
    height = 3000
    viewport = 1000
    top = 0
    nextFrame = 0
    frames = new Map()
    disconnect = vi.fn()
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockImplementation(() => height)
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockImplementation(() => viewport)
    vi.spyOn(document.documentElement, 'scrollTop', 'get').mockImplementation(() => top)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback)
      return nextFrame
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { onResize = callback }
      observe() {}
      disconnect = disconnect
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function flushFrame() {
    const pending = [...frames.values()]
    frames.clear()
    pending.forEach((callback) => callback(0))
  }

  function setup() {
    const state = { progress: { value: 0 } }
    wrapper = mount(defineComponent({
      setup() {
        state.progress = useReadingProgress().progress
        return () => h('div')
      },
    }))
    flushFrame()
    return state
  }

  it('reports 0%, 50% and 100% at the top, midpoint and full-page bottom', () => {
    const state = setup()
    expect(state.progress.value).toBe(0)
    top = 1000
    window.dispatchEvent(new Event('scroll'))
    flushFrame()
    expect(state.progress.value).toBe(0.5)
    top = 2000
    window.dispatchEvent(new Event('scroll'))
    flushFrame()
    expect(state.progress.value).toBe(1)
  })

  it('measures the initial restored scroll position', () => {
    top = 500
    expect(setup().progress.value).toBe(0.25)
  })

  it('fills the bar at the bottom despite fractional pixel rounding', () => {
    top = 1999.4
    expect(setup().progress.value).toBe(1)
  })

  it('updates after comments or images change page height without scrolling', () => {
    top = 1000
    const state = setup()
    height = 5000
    onResize()
    flushFrame()
    expect(state.progress.value).toBe(0.25)
    height = 6000
    document.dispatchEvent(new Event('load'))
    flushFrame()
    expect(state.progress.value).toBe(0.2)
  })

  it('recalculates when the viewport is resized', () => {
    top = 1000
    const state = setup()
    viewport = 500
    window.dispatchEvent(new Event('resize'))
    flushFrame()
    expect(state.progress.value).toBe(0.4)
  })

  it('detects asynchronously inserted page content', async () => {
    top = 1000
    const state = setup()
    height = 5000
    const comment = document.createElement('div')
    document.body.append(comment)
    await Promise.resolve()
    flushFrame()
    expect(state.progress.value).toBe(0.25)
    comment.remove()
  })

  it('treats pages no taller than the viewport as fully visible', () => {
    height = 500
    const state = setup()
    expect(state.progress.value).toBe(1)
    height = 1000
    onResize()
    flushFrame()
    expect(state.progress.value).toBe(1)
  })

  it('clamps overscroll and coalesces scroll events into one frame', () => {
    const state = setup()
    top = -100
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    expect(frames.size).toBe(1)
    flushFrame()
    expect(state.progress.value).toBe(0)
    top = 2200
    window.dispatchEvent(new Event('scroll'))
    flushFrame()
    expect(state.progress.value).toBe(1)
  })

  it('disconnects observers and cancels pending updates on unmount', () => {
    setup()
    window.dispatchEvent(new Event('scroll'))
    wrapper!.unmount()
    wrapper = undefined
    expect(frames.size).toBe(0)
    expect(disconnect).toHaveBeenCalledOnce()
    window.dispatchEvent(new Event('scroll'))
    expect(frames.size).toBe(0)
  })
})
