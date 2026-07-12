export type MobileSearchKeyAction<T> =
  | { type: 'close' }
  | { type: 'focus'; target: T }
  | { type: 'focus-sheet' }
  | { type: 'none' }

export interface MobileSearchFocusTarget {
  focus(): void
}

export function createMobileSearchFocusLifecycle<T extends MobileSearchFocusTarget>(
  getActiveElement: () => unknown,
  isFocusTarget: (value: unknown) => value is T
) {
  let restoreTarget: T | null = null
  let isOpen = false

  return {
    open() {
      if (isOpen) return

      isOpen = true
      const activeElement = getActiveElement()
      restoreTarget = isFocusTarget(activeElement) ? activeElement : null
    },
    close() {
      if (!isOpen) return

      isOpen = false
      const target = restoreTarget
      restoreTarget = null
      target?.focus()
    },
  }
}

export function getMobileSearchKeyAction<T>(
  key: string,
  shiftKey: boolean,
  focusableElements: readonly T[],
  activeElement: T | null
): MobileSearchKeyAction<T> {
  if (key === 'Escape') return { type: 'close' }
  if (key !== 'Tab') return { type: 'none' }
  if (focusableElements.length === 0) return { type: 'focus-sheet' }

  const first = focusableElements[0]
  const last = focusableElements[focusableElements.length - 1]
  const activeElementIsOutside = activeElement === null || !focusableElements.includes(activeElement)

  if (shiftKey && (activeElement === first || activeElementIsOutside)) {
    return { type: 'focus', target: last }
  }

  if (!shiftKey && (activeElement === last || activeElementIsOutside)) {
    return { type: 'focus', target: first }
  }

  return { type: 'none' }
}
