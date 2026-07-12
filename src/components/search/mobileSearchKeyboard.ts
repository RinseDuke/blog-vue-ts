export type MobileSearchKeyAction<T> =
  | { type: 'close' }
  | { type: 'focus'; target: T }
  | { type: 'focus-sheet' }
  | { type: 'none' }

export interface MobileSearchFocusTarget {
  focus(): void
}

export interface MobileSearchBackgroundElement {
  inert: boolean
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
}

export interface MobileSearchBodyElement {
  style: { overflow: string }
}

export function createMobileSearchBackgroundIsolation(
  getBackground: () => MobileSearchBackgroundElement | null,
  getBody: () => MobileSearchBodyElement | null
) {
  let background: MobileSearchBackgroundElement | null = null
  let body: MobileSearchBodyElement | null = null
  let previousInert = false
  let previousAriaHidden: string | null = null
  let previousBodyOverflow = ''
  let isOpen = false

  function restore() {
    if (!isOpen) return

    isOpen = false
    if (background) {
      background.inert = previousInert
      if (previousAriaHidden === null) {
        background.removeAttribute('aria-hidden')
      } else {
        background.setAttribute('aria-hidden', previousAriaHidden)
      }
    }
    if (body) body.style.overflow = previousBodyOverflow

    background = null
    body = null
  }

  return {
    open() {
      if (isOpen) return

      isOpen = true
      background = getBackground()
      body = getBody()
      if (background) {
        previousInert = background.inert
        previousAriaHidden = background.getAttribute('aria-hidden')
        background.inert = true
        background.setAttribute('aria-hidden', 'true')
      }
      if (body) {
        previousBodyOverflow = body.style.overflow
        body.style.overflow = 'hidden'
      }
    },
    close: restore,
    dispose: restore,
  }
}

export interface MobileSearchMediaQuery {
  matches: boolean
  addEventListener(type: 'change', listener: (event: { matches: boolean }) => void): void
  removeEventListener(type: 'change', listener: (event: { matches: boolean }) => void): void
}

export function createMobileSearchDesktopCloseLifecycle(
  getMediaQuery: () => MobileSearchMediaQuery | null,
  onDesktop: () => void
) {
  let mediaQuery: MobileSearchMediaQuery | null = null
  const handleChange = (event: { matches: boolean }) => {
    if (event.matches) onDesktop()
  }

  return {
    mount() {
      if (mediaQuery) return

      mediaQuery = getMediaQuery()
      if (!mediaQuery) return
      mediaQuery.addEventListener('change', handleChange)
      if (mediaQuery.matches) onDesktop()
    },
    unmount() {
      if (!mediaQuery) return

      mediaQuery.removeEventListener('change', handleChange)
      mediaQuery = null
    },
  }
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
