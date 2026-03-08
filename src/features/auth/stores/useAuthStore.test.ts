import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'

const AUTH_KEY = 'blog_auth_session_v1'
const USERS_KEY = 'blog_auth_users_v1'
const VERIFY_CODES_KEY = 'blog_auth_email_codes_v1'

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

describe('useAuthStore email verification flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports expired verification codes separately from missing ones', async () => {
    const sentAt = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const expiresAt = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    localStorage.setItem(
      VERIFY_CODES_KEY,
      JSON.stringify([
        {
          email: 'tester@example.com',
          code: '123456',
          sentAt,
          expiresAt,
        },
      ])
    )

    const store = useAuthStore()

    await expect(
      store.register({
        email: 'tester@example.com',
        password: '123456',
        rememberMe: true,
        verificationCode: '123456',
      })
    ).rejects.toThrow('验证码已过期，请重新发送。')
  })

  it('registers and logs in after a valid verification code', async () => {
    const store = useAuthStore()
    const result = await store.sendVerificationCode('tester@example.com')

    await store.register({
      email: 'tester@example.com',
      password: '123456',
      rememberMe: true,
      verificationCode: result.debugCode,
    })

    expect(store.isLoggedIn).toBe(true)
    expect(store.userEmail).toBe('tester@example.com')
    expect(localStorage.getItem(AUTH_KEY)).toContain('tester@example.com')
    expect(localStorage.getItem(VERIFY_CODES_KEY)).toBeNull()
    expect(JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')).toEqual(
      expect.arrayContaining([expect.objectContaining({ email: 'tester@example.com' })])
    )
  })
})
