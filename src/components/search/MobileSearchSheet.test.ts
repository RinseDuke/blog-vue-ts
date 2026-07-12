import mobileSearchSheetSource from './MobileSearchSheet.vue?raw'
import {
  createMobileSearchFocusLifecycle,
  getMobileSearchKeyAction,
  type MobileSearchFocusTarget,
} from './mobileSearchKeyboard'

function isFocusTarget(value: unknown): value is MobileSearchFocusTarget {
  return typeof value === 'object' && value !== null && 'focus' in value && typeof value.focus === 'function'
}

describe('MobileSearchSheet accessibility', () => {
  it('exposes the open sheet as a labelled modal dialog', () => {
    expect(mobileSearchSheetSource).toContain('role="dialog"')
    expect(mobileSearchSheetSource).toContain('aria-modal="true"')
    expect(mobileSearchSheetSource).toContain('aria-label="移动端文章搜索"')
    expect(mobileSearchSheetSource).toContain('ref="sheetEl"')
    expect(mobileSearchSheetSource).toContain('@keydown="handleKeydown"')
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
