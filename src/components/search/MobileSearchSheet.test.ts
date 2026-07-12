import mobileSearchSheetSource from './MobileSearchSheet.vue?raw'
import { getMobileSearchKeyAction } from './mobileSearchKeyboard'

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

  it('saves, restores, and clears the previously focused element only across an open cycle', () => {
    expect(mobileSearchSheetSource).toContain('const previousFocusedElement = ref<HTMLElement | null>(null)')
    expect(mobileSearchSheetSource).toContain('previousFocusedElement.value =')
    expect(mobileSearchSheetSource).toContain('document.activeElement instanceof HTMLElement')
    expect(mobileSearchSheetSource).toContain('previousFocusedElement.value?.focus()')
    expect(mobileSearchSheetSource).toContain('previousFocusedElement.value = null')
    expect(mobileSearchSheetSource).toContain('if (wasOpen)')
    expect(mobileSearchSheetSource).toContain('await nextTick()')
    expect(mobileSearchSheetSource).toContain('inputEl.value?.focus()')
  })

  it('prevents handled keys and emits close for Escape', () => {
    expect(mobileSearchSheetSource).toContain("if (action.type === 'close')")
    expect(mobileSearchSheetSource).toContain('event.preventDefault()')
    expect(mobileSearchSheetSource).toContain("emit('close')")
  })
})
