// @vitest-environment jsdom
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ArticleFilters from './ArticleFilters.vue'

enableAutoUnmount(afterEach)

function setup(overrides = {}) {
  return mount(ArticleFilters, {
    attachTo: document.body,
    props: {
      datePreset: 'all',
      dateOptions: [
        { label: '全部时间', value: 'all' },
        { label: '近 7 天', value: '7d' },
        { label: '自定义范围', value: 'custom' },
      ],
      sortMode: 'newest',
      sortOptions: [
        { label: '最新优先', value: 'newest' },
        { label: '热门：点赞最多', value: 'popular' },
        { label: '最早优先', value: 'oldest' },
      ],
      customStartDate: '',
      customEndDate: '',
      hasActiveFilters: false,
      isCustomDateInvalid: false,
      ...overrides,
    },
  })
}

function button(wrapper: VueWrapper, label: string) {
  const found = wrapper.findAll('button').find((item) => item.text() === label)
  if (!found) throw new Error('没有找到按钮：' + label)
  return found
}

describe('compact article filtering toolbar', () => {
  it('shows direct sort controls but hides reset and advanced filters by default', async () => {
    const wrapper = setup()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.find('.article-toolbar__reset').exists()).toBe(false)
    expect(button(wrapper, '最新').attributes('aria-pressed')).toBe('true')
    await button(wrapper, '热门').trigger('click')
    expect(wrapper.emitted('update:sortMode')).toEqual([['popular']])
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('opens an accessible panel and restores focus when Escape closes it', async () => {
    const wrapper = setup()
    const trigger = wrapper.get('.article-toolbar__filter')
    await trigger.trigger('click')
    await nextTick()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[role="dialog"]').attributes('id')).toBe(trigger.attributes('aria-controls'))
    expect(document.activeElement).toBe(wrapper.get('[aria-label="关闭筛选"]').element)
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('closes on outside pointer interaction and on keyboard focus leaving the toolbar', async () => {
    const wrapper = setup()
    const trigger = wrapper.get('.article-toolbar__filter')
    await trigger.trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await trigger.trigger('click')
    await wrapper.trigger('focusout', { relatedTarget: document.body })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('applies date presets immediately and keeps a visible active indicator', async () => {
    const wrapper = setup()
    await wrapper.get('.article-toolbar__filter').trigger('click')
    await button(wrapper, '近 7 天').trigger('click')
    expect(wrapper.emitted('update:datePreset')).toEqual([['7d']])
    await wrapper.setProps({ datePreset: '7d', hasActiveFilters: true })
    expect(wrapper.get('.article-toolbar__filter').text()).toContain('近 7 天')
    expect(wrapper.find('.article-toolbar__dot').exists()).toBe(true)
    await wrapper.get('.article-toolbar__reset').trigger('click')
    expect(wrapper.emitted('clearFilters')).toHaveLength(1)
  })

  it('supports custom dates, invalid-range feedback and less common sorting', async () => {
    const wrapper = setup({ datePreset: 'custom' })
    await wrapper.get('.article-toolbar__filter').trigger('click')
    const dates = wrapper.findAll('input[type="date"]')
    await dates[0].setValue('2026-09-01')
    await dates[1].setValue('2026-08-01')
    expect(wrapper.emitted('update:customStartDate')).toEqual([['2026-09-01']])
    expect(wrapper.emitted('update:customEndDate')).toEqual([['2026-08-01']])
    await wrapper.setProps({ isCustomDateInvalid: true })
    expect(wrapper.get('[role="alert"]').text()).toContain('结束日期不能早于')
    expect(dates[1].attributes('aria-invalid')).toBe('true')
    await wrapper.get('select').setValue('oldest')
    expect(wrapper.emitted('update:sortMode')).toEqual([['oldest']])
    await wrapper.setProps({ sortMode: 'oldest' })
    expect(wrapper.get('.article-toolbar__sort-summary').text()).toBe('最早优先')
    await button(wrapper, '完成').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
