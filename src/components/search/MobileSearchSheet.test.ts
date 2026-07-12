import mobileSearchSheetSource from './MobileSearchSheet.vue?raw'
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

describe('MobileSearchSheet accessibility', () => {
  it('exposes the open sheet as a labelled modal dialog', () => {
    expect(mobileSearchSheetSource).toContain('role="dialog"')
    expect(mobileSearchSheetSource).toContain('aria-modal="true"')
    expect(mobileSearchSheetSource).toContain('aria-label="移动端文章搜索"')
    expect(mobileSearchSheetSource).toContain('ref="sheetEl"')
    expect(mobileSearchSheetSource).toContain('@keydown="handleKeydown"')
  })

  it('teleports a full-screen backdrop while keeping dialog semantics on the panel', () => {
    expect(mobileSearchSheetSource).toContain('<Teleport to="body">')
    expect(mobileSearchSheetSource).toContain('class="mobile-search-sheet__backdrop"')
    expect(mobileSearchSheetSource).toContain('@click.self="emit(\'close\')"')
    expect(mobileSearchSheetSource).toContain('position: fixed;')
    expect(mobileSearchSheetSource).toContain('inset: 0;')
  })

  it('wires background isolation and desktop breakpoint cleanup into the component lifecycle', () => {
    expect(mobileSearchSheetSource).toContain('createMobileSearchBackgroundIsolation')
    expect(mobileSearchSheetSource).toContain('backgroundIsolation.open()')
    expect(mobileSearchSheetSource).toContain('backgroundIsolation.close()')
    expect(mobileSearchSheetSource).toContain('backgroundIsolation.dispose()')
    expect(mobileSearchSheetSource).toContain("document.getElementById('app')")
    expect(mobileSearchSheetSource).toContain("window.matchMedia('(min-width: 769px)')")
    expect(mobileSearchSheetSource).toContain('if (props.open) emit(\'close\')')
    expect(mobileSearchSheetSource).toContain('desktopCloseLifecycle.mount()')
    expect(mobileSearchSheetSource).toContain('desktopCloseLifecycle.unmount()')
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
    const changeListeners: Array<(event: { matches: boolean }) => void> = []
    const mediaQuery: MobileSearchMediaQuery = {
      matches: false,
      addEventListener: vi.fn((_type, listener) => {
        changeListeners.push(listener)
      }),
      removeEventListener: vi.fn(),
    }
    const close = vi.fn()
    const lifecycle = createMobileSearchDesktopCloseLifecycle(() => mediaQuery, close)

    lifecycle.mount()
    const changeListener = changeListeners[0]
    changeListener?.({ matches: false })
    changeListener?.({ matches: true })
    lifecycle.unmount()

    expect(close).toHaveBeenCalledTimes(1)
    expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', changeListener)
  })

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

  it('saves, restores, and clears the previously focused element only across an open cycle', () => {
    expect(mobileSearchSheetSource).toContain('createMobileSearchFocusLifecycle')
    expect(mobileSearchSheetSource).toContain('focusLifecycle.open()')
    expect(mobileSearchSheetSource).toContain('focusLifecycle.close()')
    expect(mobileSearchSheetSource).toContain('await nextTick()')
    expect(mobileSearchSheetSource).toContain('inputEl.value?.focus()')
  })

  it('prevents handled keys and emits close for Escape', () => {
    expect(mobileSearchSheetSource).toContain("if (action.type === 'close')")
    expect(mobileSearchSheetSource).toContain('event.preventDefault()')
    expect(mobileSearchSheetSource).toContain("emit('close')")
  })
})
