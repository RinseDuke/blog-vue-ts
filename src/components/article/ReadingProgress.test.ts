// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import ReadingProgress from './ReadingProgress.vue'

it('keeps the completed bar visible and exposes whole-page progress accessibly', async () => {
  const wrapper = mount(ReadingProgress, { props: { progress: 0 } })
  expect(wrapper.attributes('aria-valuenow')).toBe('0')
  expect(wrapper.attributes('aria-label')).toBe('整页阅读进度')
  await wrapper.setProps({ progress: 0.5 })
  expect(wrapper.attributes('style')).toContain('scaleX(0.5)')
  await wrapper.setProps({ progress: 1 })
  expect(wrapper.attributes('aria-valuenow')).toBe('100')
  expect(wrapper.attributes('style')).toContain('scaleX(1)')
  expect(wrapper.isVisible()).toBe(true)
  wrapper.unmount()
})
