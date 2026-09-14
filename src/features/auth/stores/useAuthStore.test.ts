import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { AUTH_SESSION_KEY } from '@/services/authSession'

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
<<<<<<< HEAD
    expect(localStorage.getItem(AUTH_KEY)).toContain('tester@example.com')
    const persistedAuth = [
      localStorage.getItem(AUTH_KEY),
      sessionStorage.getItem(AUTH_KEY),
      localStorage.getItem(USERS_KEY),
    ].filter((value): value is string => value !== null)

    expect(persistedAuth.join('\n')).not.toContain('SecurePass123')
    expect(localStorage.getItem(USERS_KEY)).toBeNull()
=======
    const storedSession = localStorage.getItem(AUTH_SESSION_KEY) ?? ''
    expect(storedSession).toContain('tester@example.com')
    expect(storedSession).not.toContain('SecurePass123')
    expect(localStorage.getItem(USERS_KEY)).toBeNull()
    expect(sessionStorage.getItem(USERS_KEY)).toBeNull()
>>>>>>> origin/main
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
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toContain('demo@sign.local')
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

<<<<<<< HEAD
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
=======
  it('keeps a registered mock credential only for the current store lifetime', async () => {
    const store = useAuthStore()

    await store.register({
      username: 'memory_user',
      email: 'memory@example.com',
      password: 'MemoryOnly123',
      rememberMe: false,
    })
    store.logout()

    await store.login({
      username: 'memory_user',
      password: 'MemoryOnly123',
>>>>>>> origin/main
      rememberMe: false,
    })

    expect(store.isLoggedIn).toBe(true)
<<<<<<< HEAD
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
=======
    expect(sessionStorage.getItem(AUTH_SESSION_KEY)).not.toContain('MemoryOnly123')
  })

  it('removes legacy password storage and strips unknown session fields', () => {
    localStorage.setItem(USERS_KEY, JSON.stringify([{ email: 'legacy@example.com', password: 'Leaked123' }]))
    localStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({
        email: 'legacy@example.com',
        rememberMe: true,
        loggedAt: '2026-09-14T00:00:00.000Z',
>>>>>>> origin/main
        token: 'legacy-token',
        user: {
          id: 'legacy-user',
          username: 'legacy',
          nickname: 'legacy',
          email: 'legacy@example.com',
<<<<<<< HEAD
          visibility: 'public',
          password: legacyPassword,
        },
      })
=======
          password: 'Leaked123',
          visibility: 'public',
        },
      }),
>>>>>>> origin/main
    )

    const store = useAuthStore()

<<<<<<< HEAD
    expect(localStorage.getItem(USERS_KEY)).toBeNull()
    expect(localStorage.getItem(AUTH_KEY)).toBeNull()
    expect(sessionStorage.getItem(AUTH_KEY)).toBeNull()
    expect(JSON.stringify(store.session)).not.toContain(legacyPassword)
    expect(store.session).toBeNull()
=======
    expect(store.isLoggedIn).toBe(true)
    expect(localStorage.getItem(USERS_KEY)).toBeNull()
    expect(localStorage.getItem(AUTH_SESSION_KEY)).not.toContain('Leaked123')
>>>>>>> origin/main
  })
})
