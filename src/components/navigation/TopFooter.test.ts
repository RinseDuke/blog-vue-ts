// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useAuthStore, type AuthSession } from '@/features/auth/stores/useAuthStore'
import TopFooter from './TopFooter.vue'
import source from './TopFooter.vue?raw'

function extractBlock(blockSource: string, selector: string) {
  const selectorIndex = blockSource.indexOf(selector)
  const openBraceIndex = blockSource.indexOf('{', selectorIndex)

  if (selectorIndex === -1 || openBraceIndex === -1) {
    throw new Error(`Missing block for ${selector}`)
  }

  let depth = 0

  for (let index = openBraceIndex; index < blockSource.length; index += 1) {
    if (blockSource[index] === '{') depth += 1
    if (blockSource[index] === '}') depth -= 1

    if (depth === 0) {
      return blockSource.slice(openBraceIndex + 1, index)
    }
  }

  throw new Error(`Unclosed block for ${selector}`)
}

function createSession(): AuthSession {
  return {
    email: 'footer@example.com',
    rememberMe: false,
    loggedAt: '2026-07-13T00:00:00.000Z',
    token: 'footer-token',
    user: {
      id: 'footer-user',
      username: 'footer_user',
      nickname: 'footer_user',
      email: 'footer@example.com',
      visibility: 'public',
    },
  }
}

async function mountFooter(session: AuthSession | null = null) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const authStore = useAuthStore()
  authStore.session = session

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

  return mount(TopFooter, {
    global: {
      plugins: [pinia, router],
    },
  })
}

describe('TopFooter', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('labels the account route as login when logged out', async () => {
    const wrapper = await mountFooter()
    const links = wrapper.findAll('a').map((link) => ({
      label: link.text(),
      href: link.attributes('href'),
    }))

    expect(links).toEqual([
      { label: '登录', href: '/about' },
      { label: '首页', href: '/' },
      { label: '文章', href: '/article' },
      { label: '写作', href: '/write' },
    ])
    expect(wrapper.find('.footer__title').text()).toBe('账户')
    expect(links.every(({ href }) => href !== '#')).toBe(true)

    const footerText = wrapper.text()
    expect(footerText).not.toMatch(/文档|API|GitHub|Email|RSS/)
    expect(wrapper.find('.footer__social').exists()).toBe(false)
  })

  it('labels the same account route as personal center when logged in', async () => {
    const wrapper = await mountFooter(createSession())
    const accountLink = wrapper.findAll('a')[0]

    expect(accountLink?.text()).toBe('个人中心')
    expect(accountLink?.attributes('href')).toBe('/about')
  })

  it('uses a two-column desktop layout for the remaining link groups', () => {
    const desktopColumns = extractBlock(source, '.footer__columns')
    const mobileMedia = extractBlock(source, '@media (max-width: 768px)')
    const mobileColumns = extractBlock(mobileMedia, '.footer__columns')

    expect(desktopColumns).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));')
    expect(mobileColumns).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));')
    expect(source).not.toContain('.footer__social')
    expect(source).not.toContain('.footer__social-link')
  })

  it('uses the shared glass material as a restrained page separator', () => {
    const footerBlock = extractBlock(source, '.footer')

    expect(footerBlock).toContain('background: color-mix(in srgb, var(--glass-surface) 72%, transparent);')
    expect(footerBlock).toContain('border-top: 1px solid var(--glass-border);')
    expect(footerBlock).toContain('box-shadow: inset 0 1px 0 var(--glass-highlight);')
    expect(footerBlock).toContain('backdrop-filter: blur(var(--glass-blur)) saturate(120%);')
  })
})
