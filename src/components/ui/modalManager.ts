interface ModalRegistration {
  instanceId: symbol
  focus: () => void
}

const modalStack: ModalRegistration[] = []
let bodyOverflowBeforeLock: string | null = null

export function registerModal(instanceId: symbol, focus: () => void) {
  if (modalStack.some((modal) => modal.instanceId === instanceId)) return

  if (modalStack.length === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  modalStack.push({ instanceId, focus })
}

export function unregisterModal(instanceId: symbol) {
  const index = modalStack.findIndex((modal) => modal.instanceId === instanceId)
  if (index === -1) {
    return { wasTop: false, remaining: modalStack.length, focusNewTop: undefined }
  }

  const wasTop = index === modalStack.length - 1
  modalStack.splice(index, 1)

  if (modalStack.length === 0) {
    document.body.style.overflow = bodyOverflowBeforeLock ?? ''
    bodyOverflowBeforeLock = null
  }

  return {
    wasTop,
    remaining: modalStack.length,
    focusNewTop: modalStack[modalStack.length - 1]?.focus,
  }
}

export function isTopModal(instanceId: symbol) {
  return modalStack[modalStack.length - 1]?.instanceId === instanceId
}
