// @vitest-environment happy-dom

import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import MobileSearchSheet from './MobileSearchSheet.vue'
import source from './MobileSearchSheet.vue?raw'
import {
  createMobileSearchBackgroundIsolation,
  createMobileSearchDesktopCloseLifecycle,
  createMobileSearchFocusLifecycle,
  getMobileSearchKeyAction,
  type MobileSearchBackgroundElement,
  type MobileSearchBodyElement,
  type MobileSearchFocusTarget,
  type MobileSearchMediaQuery,
} from './mobileSearchKeyboard'

function isFocusTarget(value: unknown): value is MobileSearchFocusTarget {
  return typeof value === 'object' && value !== null && 'focus' in value && typeof value.focus === 'function'
}

function createBackground(inert: boolean, ariaHidden: string | null): MobileSearchBackgroundElement {
  const attributes = new Map<string, string>()
  if (ariaHidden !== null) attributes.set('aria-hidden', ariaHidden)

  return {
    inert,
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
  }
}

class FakeMediaQuery implements MobileSearchMediaQuery {
  matches = false
  private listeners = new Set<(event: { matches: boolean }) => void>()

  addEventListener = vi.fn((_type: 'change', listener: (event: { matches: boolean }) => void) => {
    this.listeners.add(listener)
  })

  removeEventListener = vi.fn((_type: 'change', listener: (event: { matches: boolean }) => void) => {
    this.listeners.delete(listener)
  })

  dispatch(matches: boolean) {
    this.matches = matches
    this.listeners.forEach((listener) => listener({ matches }))
  }

  listenerCount() {
    return this.listeners.size
  }
}

const baseProps = {
  open: false,
  modelValue: '',
  recommendedPosts: [],
  suggestionPosts: [],
  searchHistory: [],
  normalizedQuery: '',
}

let wrapper: VueWrapper | null = null
let mediaQuery: FakeMediaQuery

function mountSheet(open = false) {
  wrapper = mount(MobileSearchSheet, {
    attachTo: document.querySelector('#mount') as HTMLElement,
    props: { ...baseProps, open },
    global: {
      stubs: {
        SearchDropdownContent: {
          template:
            '<div data-testid="search-content"><button type="button" data-focus="content-first">First result</button><button type="button" data-focus="content-last">Last result</button></div>',
        },
      },
    },
  })
  return wrapper
}

beforeEach(() => {
  document.body.innerHTML =
    '<div id="app" aria-hidden="false"><button id="search-trigger" type="button">Search</button><div id="mount"></div></div>'
  const app = document.querySelector('#app') as HTMLElement
  app.inert = false
  document.body.style.overflow = 'auto'
  mediaQuery = new FakeMediaQuery()
  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery as unknown as MediaQueryList))
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.unstubAllGlobals()
  document.body.removeAttribute('style')
  document.body.innerHTML = ''
})

describe('MobileSearchSheet integration', () => {
  it('uses a high-opacity glass panel with solid fallback and 52px controls', () => {
    expect(source).toContain(
      'background: color-mix(in srgb, var(--glass-surface) 28%, var(--surface-strong) 72%);'
    )
    expect(source).toContain('border: 1px solid var(--glass-border);')
    expect(source).toContain('box-shadow: var(--glass-shadow);')
    expect(source).toContain('backdrop-filter: blur(var(--glass-blur)) saturate(135%);')
    expect(source).toContain('@supports not ((backdrop-filter: blur(1px))')
    expect(source).toContain('background: var(--surface-strong);')
    expect(source).toMatch(
      /\.mobile-search-sheet__input-wrap input\s*\{[^}]*min-width: 52px;[^}]*height: 52px;/s
    )
    expect(source).toMatch(/\.mobile-search-sheet__submit\s*\{[^}]*min-width: 52px;[^}]*height: 52px;/s)
    expect(source).toMatch(/\.mobile-search-sheet__close\s*\{[^}]*min-width: 52px;[^}]*height: 52px;/s)
  })

  it('teleports a labelled modal, isolates the app, focuses the input, and restores the trigger on close', async () => {
    const app = document.querySelector('#app') as HTMLElement
    const trigger = document.querySelector('#search-trigger') as HTMLButtonElement
    trigger.focus()
    const mounted = mountSheet()

    await mounted.setProps({ open: true })
    await nextTick()

    const backdrop = document.body.querySelector('.mobile-search-sheet__backdrop') as HTMLElement
    const dialog = backdrop.querySelector('[role="dialog"]') as HTMLElement
    const input = dialog.querySelector('input') as HTMLInputElement
    expect(document.body.contains(backdrop)).toBe(true)
    expect(app.contains(backdrop)).toBe(false)
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-label')).toBe('移动端文章搜索')
    expect(document.activeElement).toBe(input)
    expect(app.inert).toBe(true)
    expect(app.getAttribute('aria-hidden')).toBe('true')
    expect(document.body.style.overflow).toBe('hidden')

    await mounted.setProps({ open: false })

    expect(app.inert).toBe(false)
    expect(app.getAttribute('aria-hidden')).toBe('false')
    expect(document.body.style.overflow).toBe('auto')
    expect(document.activeElement).toBe(trigger)
  })

  it('closes on Escape and traps forward and backward Tab navigation', async () => {
    const mounted = mountSheet(true)
    await nextTick()
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement
    const input = dialog.querySelector('input') as HTMLInputElement
    const last = dialog.querySelector('[data-focus="content-last"]') as HTMLButtonElement

    last.focus()
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(input)

    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(last)

    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    dialog.dispatchEvent(escape)
    expect(escape.defaultPrevented).toBe(true)
    expect(mounted.emitted('close')).toHaveLength(1)
  })

  it('closes only when the backdrop itself is clicked', async () => {
    const mounted = mountSheet(true)
    await nextTick()
    const backdrop = document.body.querySelector('.mobile-search-sheet__backdrop') as HTMLElement
    const dialog = backdrop.querySelector('[role="dialog"]') as HTMLElement

    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(mounted.emitted('close')).toBeUndefined()

    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(mounted.emitted('close')).toHaveLength(1)
  })

  it('emits close at the desktop breakpoint and removes the media listener on unmount', async () => {
    const app = document.querySelector('#app') as HTMLElement
    const mounted = mountSheet(true)
    await nextTick()
    expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    mediaQuery.dispatch(true)
    expect(mounted.emitted('close')).toHaveLength(1)

    const registeredListener = mediaQuery.addEventListener.mock.calls[0]?.[1]
    mounted.unmount()
    wrapper = null
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', registeredListener)
    expect(mediaQuery.listenerCount()).toBe(0)
    expect(app.inert).toBe(false)
    expect(app.getAttribute('aria-hidden')).toBe('false')
    expect(document.body.style.overflow).toBe('auto')
  })
})

describe('MobileSearchSheet keyboard and lifecycle helpers', () => {
  it('wraps Tab from the last focusable element to the first', () => {
    const first = { id: 'first' }
    const last = { id: 'last' }

    expect(getMobileSearchKeyAction('Tab', false, [first, last], last)).toEqual({
      type: 'focus',
      target: first,
    })
  })

  it('wraps Shift+Tab from the first focusable element to the last', () => {
    const first = { id: 'first' }
    const last = { id: 'last' }

    expect(getMobileSearchKeyAction('Tab', true, [first, last], first)).toEqual({
      type: 'focus',
      target: last,
    })
  })

  it('keeps zero and one focusable element inside the sheet safely', () => {
    const only = { id: 'only' }

    expect(getMobileSearchKeyAction('Tab', false, [], null)).toEqual({ type: 'focus-sheet' })
    expect(getMobileSearchKeyAction('Tab', false, [only], only)).toEqual({ type: 'focus', target: only })
  })

  it('maps Escape to the close path', () => {
    expect(getMobileSearchKeyAction('Escape', false, [], null)).toEqual({ type: 'close' })
  })

  it('captures the trigger on open, restores it once on close, and clears it', () => {
    const trigger = { focus: vi.fn() }
    let activeElement: unknown = trigger
    const lifecycle = createMobileSearchFocusLifecycle(() => activeElement, isFocusTarget)

    lifecycle.open()
    activeElement = { focus: vi.fn() }
    lifecycle.close()
    lifecycle.close()

    expect(trigger.focus).toHaveBeenCalledTimes(1)
  })

  it('does nothing when initially notified that the sheet is closed', () => {
    const trigger = { focus: vi.fn() }
    const lifecycle = createMobileSearchFocusLifecycle(() => trigger, isFocusTarget)

    lifecycle.close()

    expect(trigger.focus).not.toHaveBeenCalled()
  })

  it('does not replace the original trigger on repeated open notifications', () => {
    const trigger = { focus: vi.fn() }
    const laterActiveElement = { focus: vi.fn() }
    let activeElement: unknown = trigger
    const lifecycle = createMobileSearchFocusLifecycle(() => activeElement, isFocusTarget)

    lifecycle.open()
    activeElement = laterActiveElement
    lifecycle.open()
    lifecycle.close()

    expect(trigger.focus).toHaveBeenCalledTimes(1)
    expect(laterActiveElement.focus).not.toHaveBeenCalled()
  })

  it('safely ignores invalid or unavailable active elements', () => {
    let activeElement: unknown = { focus: 'not-a-function' }
    const lifecycle = createMobileSearchFocusLifecycle(() => activeElement, isFocusTarget)

    lifecycle.open()
    lifecycle.close()
    activeElement = undefined
    lifecycle.open()

    expect(() => lifecycle.close()).not.toThrow()
  })

  it('isolates the background and restores exact prior states on close', () => {
    const background = createBackground(false, null)
    const body: MobileSearchBodyElement = { style: { overflow: 'scroll' } }
    const isolation = createMobileSearchBackgroundIsolation(() => background, () => body)

    isolation.open()

    expect(background.inert).toBe(true)
    expect(background.getAttribute('aria-hidden')).toBe('true')
    expect(body.style.overflow).toBe('hidden')

    isolation.close()

    expect(background.inert).toBe(false)
    expect(background.getAttribute('aria-hidden')).toBeNull()
    expect(body.style.overflow).toBe('scroll')
  })

  it('restores pre-existing background states on dispose without recapturing them', () => {
    const background = createBackground(true, 'false')
    const body: MobileSearchBodyElement = { style: { overflow: 'clip' } }
    const isolation = createMobileSearchBackgroundIsolation(() => background, () => body)

    isolation.open()
    expect(background.getAttribute('aria-hidden')).toBe('true')
    expect(body.style.overflow).toBe('hidden')
    isolation.open()
    isolation.dispose()

    expect(background.inert).toBe(true)
    expect(background.getAttribute('aria-hidden')).toBe('false')
    expect(body.style.overflow).toBe('clip')
  })

  it('closes when the desktop media query starts matching and removes its listener', () => {
    const media = new FakeMediaQuery()
    const close = vi.fn()
    const lifecycle = createMobileSearchDesktopCloseLifecycle(() => media, close)

    lifecycle.mount()
    media.dispatch(false)
    media.dispatch(true)
    lifecycle.unmount()

    expect(close).toHaveBeenCalledTimes(1)
    expect(media.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
