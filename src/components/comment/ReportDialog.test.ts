// @vitest-environment happy-dom

import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ReportDialog from './ReportDialog.vue'

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

beforeEach(() => {
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
