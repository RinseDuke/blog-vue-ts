import { createPinia, setActivePinia } from 'pinia'

const apiMocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  mockMode: true,
}))

vi.mock('@/services/apiClient', () => ({
  apiFetch: apiMocks.apiFetch,
  isMockMode: () => apiMocks.mockMode,
}))

import { readStoredAuthSession, useAuthStore } from '@/features/auth/stores/useAuthStore'

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
    apiMocks.mockMode = true
    apiMocks.apiFetch.mockReset()
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('records one real creation timestamp and restores it with the registered session', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-13T09:30:00.000Z'))
    const store = useAuthStore()

    const registration = store.register({
      username: 'created_user',
      email: 'created@example.com',
      password: 'SecurePass123',
      rememberMe: true,
      visibility: 'public',
    })
    await vi.advanceTimersByTimeAsync(500)
    await registration

    const registeredUser = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]').find(
      (user: { email: string }) => user.email === 'created@example.com',
    )
    const storedSession = JSON.parse(localStorage.getItem(AUTH_KEY) ?? '{}')
    expect(Date.parse(registeredUser.createdAt)).toBe(Date.parse('2026-07-13T09:30:00.500Z'))
    expect(storedSession.user.createdAt).toBe(registeredUser.createdAt)
    expect(readStoredAuthSession()?.user.createdAt).toBe(registeredUser.createdAt)
  })

  it('maps backend creation time into the authenticated user', async () => {
    apiMocks.mockMode = false
    apiMocks.apiFetch.mockResolvedValue({
      token: 'backend-token',
      user: {
        id: 'backend-user',
        username: 'backend_creator',
        nickname: 'Ignored nickname',
        email: 'BACKEND@example.com',
        created_at: '2025-11-04T12:34:56.000Z',
        visibility: 'public',
      },
    })
    const store = useAuthStore()

    await store.login({ username: 'backend_creator', password: 'secret', rememberMe: true })

    expect(store.session?.user.createdAt).toBe('2025-11-04T12:34:56.000Z')
    expect(readStoredAuthSession()?.user.createdAt).toBe('2025-11-04T12:34:56.000Z')
  })

  it('preserves valid creation time from a stored session and ignores invalid legacy values', () => {
    const session = {
      email: 'stored@example.com',
      rememberMe: true,
      loggedAt: '2026-07-13T09:30:00.000Z',
      token: 'stored-token',
      user: {
        id: 'stored-user',
        username: 'stored_user',
        nickname: 'stored_user',
        email: 'stored@example.com',
        visibility: 'public',
        createdAt: '2025-02-03T04:05:06.000Z',
      },
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))

    expect(readStoredAuthSession()?.user.createdAt).toBe('2025-02-03T04:05:06.000Z')

    session.user.createdAt = 'not-a-date'
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    expect(readStoredAuthSession()?.user.createdAt).toBeUndefined()
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
    expect(JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          username: 'tester_user',
          nickname: 'tester_user',
          email: 'tester@example.com',
        }),
      ])
    )
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
})
