// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import TopFooter from './TopFooter.vue'
import source from './TopFooter.vue?raw'

describe('TopFooter', () => {
  it('renders only truthful internal navigation links', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/about', component: { template: '<div />' } },
        { path: '/article', component: { template: '<div />' } },
        { path: '/write', component: { template: '<div />' } },
      ],
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(TopFooter, {
      global: {
        plugins: [router],
      },
    })

    const links = wrapper.findAll('a').map((link) => ({
      label: link.text(),
      href: link.attributes('href'),
    }))

    expect(links).toEqual([
      { label: '个人中心', href: '/about' },
      { label: '首页', href: '/' },
      { label: '文章', href: '/article' },
      { label: '写作', href: '/write' },
    ])
    expect(links.every(({ href }) => href !== '#')).toBe(true)

    const footerText = wrapper.text()
    expect(footerText).not.toMatch(/文档|API|GitHub|Email|RSS/)
    expect(wrapper.find('.footer__social').exists()).toBe(false)
  })

  it('uses a two-column desktop layout for the remaining link groups', () => {
    expect(source).toMatch(/\.footer__columns\s*{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/)
    expect(source).not.toContain('.footer__social')
    expect(source).not.toContain('.footer__social-link')
  })
})
