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
      nickname: 'Tester',
      email: 'tester@example.com',
      password: 'SecurePass123',
      rememberMe: true,
      visibility: 'public',
    })

    expect(store.isLoggedIn).toBe(true)
    expect(store.userEmail).toBe('tester@example.com')
    expect(store.userId).toContain('user-')
    expect(localStorage.getItem(AUTH_KEY)).toContain('tester@example.com')
    expect(JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')).toEqual(
      expect.arrayContaining([expect.objectContaining({ username: 'tester_user', email: 'tester@example.com' })])
    )
  })

  it('rejects duplicate usernames during registration', async () => {
    const store = useAuthStore()

    await store.register({
      username: 'tester_user',
      nickname: 'Tester',
      email: 'tester@example.com',
      password: 'SecurePass123',
      rememberMe: true,
      visibility: 'public',
    })

    await expect(
      store.register({
        username: 'tester_user',
        nickname: 'Tester 2',
        email: 'tester2@example.com',
        password: 'SecurePass456',
        rememberMe: true,
        visibility: 'public',
      })
    ).rejects.toThrow('该用户名已存在，请更换后重试。')
  })
})
