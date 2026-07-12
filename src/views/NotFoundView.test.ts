// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import NotFoundView from './NotFoundView.vue'

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()

  return {
    ...actual,
    useRoute: () => ({ fullPath: '/missing/story?from=archive#notes' }),
  }
})

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: {
    to: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () => h('a', { href: props.to }, slots.default?.())
  },
})

describe('NotFoundView', () => {
  it('shows the missing path and accessible recovery destinations', () => {
    const wrapper = mount(NotFoundView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    })

    expect(wrapper.get('h1').text()).toContain('404')
    expect(wrapper.text()).toContain('页面不存在')
    expect(wrapper.text()).toContain('/missing/story?from=archive#notes')
    expect(wrapper.get('nav[aria-label="页面恢复选项"]')).toBeTruthy()
    expect(wrapper.get('a[href="/"]').text()).toBe('返回首页')
    expect(wrapper.get('a[href="/article"]').text()).toBe('浏览文章')
  })
})
