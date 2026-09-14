import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'

const AUTH_KEY = 'blog_auth_session_v1'
const USERS_KEY = 'blog_auth_users_v1'

interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

function createStorageMock(): StorageLike {
  const store = new Map<string, string>()

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

describe('useAuthStore backend-aligned auth flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registers and logs in with username credentials', async () => {
    const store = useAuthStore()

    await store.register({
      username: 'tester_user',
      email: 'tester@example.com',
      password: 'SecurePass123',
      rememberMe: true,
      visibility: 'public',
    })

    expect(store.isLoggedIn).toBe(true)
    expect(store.userEmail).toBe('tester@example.com')
    expect(store.userId).toContain('user-')
    expect(store.displayName).toBe('tester_user')
    expect(localStorage.getItem(AUTH_KEY)).toContain('tester@example.com')
    const persistedAuth = [
      localStorage.getItem(AUTH_KEY),
      sessionStorage.getItem(AUTH_KEY),
      localStorage.getItem(USERS_KEY),
    ].filter((value): value is string => value !== null)

    expect(persistedAuth.join('\n')).not.toContain('SecurePass123')
    expect(localStorage.getItem(USERS_KEY)).toBeNull()
  })

  it('allows logging in with seeded mock credentials in a fresh environment', async () => {
    const store = useAuthStore()

    await store.login({
      username: 'demo',
      password: 'Demo123456',
      rememberMe: true,
    })

    expect(store.isLoggedIn).toBe(true)
    expect(store.username).toBe('demo')
    expect(store.userEmail).toBe('demo@sign.local')
    expect(localStorage.getItem(AUTH_KEY)).toContain('demo@sign.local')
  })

  it('rejects duplicate usernames during registration', async () => {
    const store = useAuthStore()

    await store.register({
      username: 'tester_user',
      email: 'tester@example.com',
      password: 'SecurePass123',
      rememberMe: true,
      visibility: 'public',
    })

    await expect(
      store.register({
        username: 'tester_user',
        email: 'tester2@example.com',
        password: 'SecurePass456',
        rememberMe: true,
        visibility: 'public',
      })
    ).rejects.toThrow('该用户名已存在，请更换后重试。')
  })

  it('keeps a newly registered mock account available in the current page', async () => {
    const store = useAuthStore()
    const credentials = {
      username: 'memory_user',
      email: 'memory@example.com',
      password: 'MemoryPass123',
      rememberMe: true,
      visibility: 'public' as const,
    }

    await store.register(credentials)
    store.logout()
    await store.login({
      username: credentials.username,
      password: credentials.password,
      rememberMe: false,
    })

    expect(store.isLoggedIn).toBe(true)
    expect(store.username).toBe(credentials.username)
  })

  it('removes legacy stored passwords and discards the affected session', () => {
    const legacyPassword = 'LegacySecret123'
    localStorage.setItem(USERS_KEY, JSON.stringify([{ password: legacyPassword }]))
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        email: 'legacy@example.com',
        rememberMe: true,
        loggedAt: '2026-01-01T00:00:00.000Z',
        token: 'legacy-token',
        user: {
          id: 'legacy-user',
          username: 'legacy',
          nickname: 'legacy',
          email: 'legacy@example.com',
          visibility: 'public',
          password: legacyPassword,
        },
      })
    )

    const store = useAuthStore()

    expect(localStorage.getItem(USERS_KEY)).toBeNull()
    expect(localStorage.getItem(AUTH_KEY)).toBeNull()
    expect(sessionStorage.getItem(AUTH_KEY)).toBeNull()
    expect(JSON.stringify(store.session)).not.toContain(legacyPassword)
    expect(store.session).toBeNull()
  })
})
