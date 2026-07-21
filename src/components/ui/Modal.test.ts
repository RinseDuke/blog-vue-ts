// @vitest-environment happy-dom

import { defineComponent, nextTick, ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import Modal from './Modal.vue'

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const wrappers: VueWrapper[] = []

function mountModal(modelValue = true, label = 'Test modal') {
  const wrapper = mount(Modal, {
    attachTo: document.querySelector('#mount') as HTMLElement,
    props: { modelValue, title: label },
    slots: {
      default: '<input data-testid="modal-input" />',
      footer: '<button type="button" data-testid="modal-last">Last</button>',
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

function getDialogs() {
  return Array.from(document.body.querySelectorAll<HTMLElement>('.modal'))
}

beforeEach(() => {
  document.body.innerHTML =
    '<div id="app"><button id="modal-trigger" type="button">Open</button><div id="mount"></div></div>'
  document.body.style.overflow = 'clip'
})

afterEach(() => {
  while (wrappers.length) wrappers.pop()?.unmount()
  document.body.removeAttribute('style')
  document.body.innerHTML = ''
})

describe('Modal focus and stacking behavior', () => {
  it('focuses the first control, traps edges and recovers focus from outside', async () => {
    const trigger = document.querySelector('#modal-trigger') as HTMLButtonElement
    trigger.focus()
    mountModal()
    await nextTick()

    const dialog = getDialogs()[0]
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    expect(document.activeElement).toBe(first)

    last.focus()
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(first)

    first.focus()
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
    )
    expect(document.activeElement).toBe(last)

    trigger.focus()
    const outsideTab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    trigger.dispatchEvent(outsideTab)
    expect(outsideTab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    trigger.focus()
    const outsideShiftTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    trigger.dispatchEvent(outsideShiftTab)
    expect(outsideShiftTab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
  })

  it('restores the trigger and the original inline overflow when closed', async () => {
    const trigger = document.querySelector('#modal-trigger') as HTMLButtonElement
    trigger.focus()
    const modal = mountModal()
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    await modal.setProps({ modelValue: false })

    expect(document.activeElement).toBe(trigger)
    expect(document.body.style.overflow).toBe('clip')
  })

  it('lets only the top modal handle Escape and keeps scroll locked until the last closes', async () => {
    const Harness = defineComponent({
      components: { Modal },
      setup() {
        return { lowerOpen: ref(true), topOpen: ref(true) }
      },
      template: `
        <Modal v-model="lowerOpen" title="Lower"><button type="button">Lower action</button></Modal>
        <Modal v-model="topOpen" title="Top"><button type="button">Top action</button></Modal>
      `,
    })
    const harness = mount(Harness, {
      attachTo: document.querySelector('#mount') as HTMLElement,
    })
    wrappers.push(harness)
    await nextTick()

    expect(getDialogs()).toHaveLength(2)
    expect(document.body.style.overflow).toBe('hidden')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await nextTick()

    expect(getDialogs()).toHaveLength(1)
    expect(getDialogs()[0].textContent).toContain('Lower')
    expect(document.body.style.overflow).toBe('hidden')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await nextTick()

    expect(getDialogs()).toHaveLength(0)
    expect(document.body.style.overflow).toBe('clip')
  })

  it('keeps scroll locked when a non-top modal closes first', async () => {
    const lower = mountModal(true, 'Lower')
    const top = mountModal(true, 'Top')
    await nextTick()

    await lower.setProps({ modelValue: false })
    expect(getDialogs()).toHaveLength(1)
    expect(document.body.style.overflow).toBe('hidden')

    await top.setProps({ modelValue: false })
    expect(document.body.style.overflow).toBe('clip')
  })
})
