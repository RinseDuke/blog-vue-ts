const modalStack: symbol[] = []
let bodyOverflowBeforeLock: string | null = null

export function registerModal(instanceId: symbol) {
  if (modalStack.includes(instanceId)) return

  if (modalStack.length === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  modalStack.push(instanceId)
}

export function unregisterModal(instanceId: symbol) {
  const index = modalStack.indexOf(instanceId)
  if (index === -1) return { wasTop: false, remaining: modalStack.length }

  const wasTop = index === modalStack.length - 1
  modalStack.splice(index, 1)

  if (modalStack.length === 0) {
    document.body.style.overflow = bodyOverflowBeforeLock ?? ''
    bodyOverflowBeforeLock = null
  }

  return { wasTop, remaining: modalStack.length }
}

export function isTopModal(instanceId: symbol) {
  return modalStack[modalStack.length - 1] === instanceId
}
