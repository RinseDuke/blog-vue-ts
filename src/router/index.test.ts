import routerSource from './index.ts?raw'

describe('router source contract', () => {
  it('registers the lazy-loaded public author route', () => {
    expect(routerSource).toContain("path: '/author/:id'")
    expect(routerSource).toContain("name: 'author'")
    expect(routerSource).toContain("component: () => import('../views/AuthorView.vue')")
  })

  it('keeps the lazy-loaded catch-all route after every named page route', () => {
    const routePaths = [...routerSource.matchAll(/^\s+path: '([^']+)'/gm)].map((match) => match[1])

    expect(routePaths[routePaths.length - 1]).toBe('/:pathMatch(.*)*')
    expect(routerSource).toContain("name: 'not-found'")
    expect(routerSource).toContain("component: () => import('../views/NotFoundView.vue')")
  })
})
