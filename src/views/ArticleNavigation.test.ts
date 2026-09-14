// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import type { Post } from '@/types/post'
import ArticleListView from './ArticleListView.vue'
import PostList from '@/components/post/PostList.vue'
import CommunitySidebar from '@/components/community/CommunitySidebar.vue'

enableAutoUnmount(afterEach)
beforeEach(() => {
  for (const name of ['localStorage', 'sessionStorage']) {
    const values = new Map<string, string>()
    vi.stubGlobal(name, {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    })
  }
})
afterEach(() => vi.unstubAllGlobals())

function makePost(id: string, tags: string[], likes: number, date: string, readMinutes = 1): Post {
  return { id, slug: id, title: id, excerpt: '', tags, likes, publishedAt: date, readMinutes, author: { id: 'a', name: '作者' } }
}

async function setup(url: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = usePostsStore()
  store.posts = [
    makePost('最多赞', ['Vue'], 90, '2026-01-01'),
    makePost('最新文章', ['VuePress'], 2, '2026-03-01', 100),
    makePost('同赞较新', ['vue'], 90, '2026-02-01'),
    makePost('其他主题', ['React'], 0, '2026-01-01'),
  ]
  vi.spyOn(store, 'ensurePosts').mockResolvedValue(store.posts)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['home', 'article-list', 'about', 'profile-articles', 'write'].map((name, index) => ({
      name, path: index === 1 ? '/article' : `/${name}`, component: { template: '<div />' },
    })),
  })
  await router.push(url)
  await router.isReady()
  const wrapper = mount(ArticleListView, {
    global: { plugins: [pinia, router], stubs: { PostList: true } },
  })
  await flushPromises()
  const ids = () => (wrapper.findComponent(PostList).props('posts') as Post[]).map((post) => post.id)
  return { wrapper, router, ids }
}

describe('article filtering and navigation', () => {
  it('keeps filtering reachable in the empty state and preserves popular sort on reset', async () => {
    const { wrapper, router, ids } = await setup('/article?sort=popular')
    await wrapper.get('.article-toolbar__filter').trigger('click')
    await wrapper.findAll('.filter-popover__presets button').find((button) => button.text() === '近 7 天')!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.date).toBe('7d')
    expect(wrapper.find('.archive-state--empty').exists()).toBe(true)
    expect(wrapper.find('.article-toolbar').exists()).toBe(true)
    await wrapper.get('.article-toolbar__reset').trigger('click')
    await flushPromises()
    expect(ids()).toHaveLength(4)
    expect(router.currentRoute.value.query.sort).toBe('popular')
    expect(router.currentRoute.value.query.date).toBeUndefined()
  })

  it('places page size beside pagination and resets the page when size changes', async () => {
    const { wrapper, router, ids } = await setup('/article')
    usePostsStore().posts = Array.from({ length: 14 }, (_, index) => makePost(String(index), [], index, '2026-01-01'))
    await flushPromises()
    await wrapper.get('[aria-label="第 2 页"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.page).toBe('2')
    await wrapper.get('.archive-pagination select').setValue('9')
    await flushPromises()
    expect(router.currentRoute.value.query.page).toBeUndefined()
    expect(router.currentRoute.value.query.size).toBe('9')
    expect(ids()).toHaveLength(9)
    expect(wrapper.find('.community-layout__right').exists()).toBe(false)
  })

  it('filters exact tags case-insensitively and can remove the visible tag', async () => {
    const { wrapper, router, ids } = await setup('/article?tag=Vue')
    expect(ids()).toEqual(['同赞较新', '最多赞'])
    expect(wrapper.get('.tag-filter').text()).toContain('Vue')
    await wrapper.get('.tag-filter button').trigger('click')
    await flushPromises()
    expect(ids()).toHaveLength(4)
    expect(router.currentRoute.value.query.tag).toBeUndefined()
  })

  it('sorts popular by real likes with newest as a tie breaker, not reading length', async () => {
    const { wrapper, ids } = await setup('/article?sort=popular')
    expect(ids()).toEqual(['同赞较新', '最多赞', '最新文章', '其他主题'])
    expect(wrapper.get('h1').text()).toContain('按点赞数')
    const current = wrapper.findAll('.community-sidebar__item[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0].text()).toContain('热门')
  })

  it('explains the fallback when the data source has no popularity counts', async () => {
    const { wrapper, ids } = await setup('/article?sort=popular')
    usePostsStore().posts = usePostsStore().posts.map((post) => ({ ...post, likes: undefined }))
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('尚未提供点赞统计')
    expect(ids()[0]).toBe('最新文章')
  })

  it('restores filters and unique navigation highlighting on back/forward', async () => {
    const { wrapper, router, ids } = await setup('/article')
    const sidebar = wrapper.findComponent(CommunitySidebar)
    expect(sidebar.get('[aria-current="page"]').text()).toContain('最新')
    await router.push('/article?tag=Vue&sort=popular')
    await flushPromises()
    expect(ids()).toHaveLength(2)
    expect(sidebar.findAll('[aria-current="page"]')).toHaveLength(0)
    router.back()
    await flushPromises()
    expect(ids()).toHaveLength(4)
    expect(sidebar.get('[aria-current="page"]').text()).toContain('最新')
    router.forward()
    await flushPromises()
    expect(ids()).toEqual(['同赞较新', '最多赞'])
    expect(wrapper.get('.tag-filter').text()).toContain('Vue')
  })

  it('searches tags through legacy keyword links too', async () => {
    const { ids } = await setup('/article?keyword=React')
    expect(ids()).toEqual(['其他主题'])
  })
})
