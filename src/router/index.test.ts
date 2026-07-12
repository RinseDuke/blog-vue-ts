import routerSource from './index.ts?raw'

describe('router source contract', () => {
  it('registers the lazy-loaded public author route', () => {
    expect(routerSource).toContain("path: '/author/:id'")
    expect(routerSource).toContain("name: 'author'")
    expect(routerSource).toContain("component: () => import('../views/AuthorView.vue')")
  })
})
