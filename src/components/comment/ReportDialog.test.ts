// @vitest-environment happy-dom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { submitReport } from '@/services/reportService'
import ReportDialog from './ReportDialog.vue'

vi.mock('@/services/reportService', () => ({
  submitReport: vi.fn(),
}))

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

let wrapper: VueWrapper | null = null

function mountDialog() {
  wrapper = mount(ReportDialog, {
    attachTo: document.querySelector('#mount') as HTMLElement,
    props: {
      targetType: 'comment',
      targetId: 'comment-1',
    },
  })
  return wrapper
}

function getDialog() {
  return document.body.querySelector('.report-dialog') as HTMLElement
}

async function submitSuccessfully() {
  vi.mocked(submitReport).mockResolvedValue({
    id: 'report-1',
    targetType: 'comment',
    targetId: 'comment-1',
    reason: 'spam',
    reportedBy: 'user-test',
    createdAt: '2026-07-22T00:00:00.000Z',
    status: 'pending',
  })

  const firstReason = getDialog().querySelector<HTMLInputElement>('input[type="radio"]')!
  firstReason.click()
  await nextTick()

  getDialog()
    .querySelector('form')!
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
  await nextTick()

  return getDialog().querySelector<HTMLButtonElement>('.report-dialog__success button')!
}

beforeEach(() => {
  vi.mocked(submitReport).mockReset()
  document.body.innerHTML =
    '<div id="app"><button id="report-trigger" type="button">举报</button><div id="mount"></div></div>'
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('ReportDialog focus behavior', () => {
  it('focuses the first interactive control when opened', async () => {
    const trigger = document.querySelector('#report-trigger') as HTMLButtonElement
    trigger.focus()
    mountDialog()

    await nextTick()

    const first = getDialog().querySelector(focusableSelector) as HTMLElement
    expect(first).toBeTruthy()
    expect(document.activeElement).toBe(first)
  })

  it('wraps Tab and Shift+Tab inside the dialog', async () => {
    mountDialog()
    await nextTick()

    const focusable = Array.from(getDialog().querySelectorAll<HTMLElement>(focusableSelector))
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    last.focus()
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(first)

    first.focus()
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
    )
    expect(document.activeElement).toBe(last)
  })

  it('focuses the success close button after a successful submission', async () => {
    mountDialog()
    await nextTick()

    const closeButton = await submitSuccessfully()

    expect(closeButton).toBeTruthy()
    expect(document.activeElement).toBe(closeButton)
  })

  it('keeps focus on the only success control for Tab and Shift+Tab', async () => {
    mountDialog()
    await nextTick()
    const closeButton = await submitSuccessfully()

    closeButton.focus()
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    closeButton.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(closeButton)

    const shiftTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    closeButton.dispatchEvent(shiftTab)
    expect(shiftTab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(closeButton)
  })

  it('recovers forward and backward Tab when focus moves outside the dialog', async () => {
    const trigger = document.querySelector('#report-trigger') as HTMLButtonElement
    mountDialog()
    await nextTick()

    const focusable = Array.from(getDialog().querySelectorAll<HTMLElement>(focusableSelector))
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    trigger.focus()
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    trigger.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    trigger.focus()
    const shiftTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    trigger.dispatchEvent(shiftTab)
    expect(shiftTab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
  })

  it('emits close on Escape', async () => {
    const mounted = mountDialog()
    await nextTick()

    getDialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))

    expect(mounted.emitted('close')).toHaveLength(1)
  })

  it('restores the previously focused trigger when unmounted', async () => {
    const trigger = document.querySelector('#report-trigger') as HTMLButtonElement
    trigger.focus()
    const mounted = mountDialog()
    await nextTick()

    mounted.unmount()
    wrapper = null

    expect(document.activeElement).toBe(trigger)
  })
})
