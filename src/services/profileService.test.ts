import { profileService } from '@/services/profileService'

const AUTH_KEY = 'blog_auth_session_v1'

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

function setSession(email: string) {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      email,
      rememberMe: true,
      loggedAt: '2026-03-07T10:00:00.000Z',
      token: `mock-token-${email}`,
    })
  )
}

describe('profileService auth scope', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects anonymous profile access', async () => {
    await expect(profileService.getProfile()).rejects.toThrow('请先登录后再查看个人资料')
  })

  it('isolates profile data by logged in email', async () => {
    setSession('alice@example.com')

    await expect(profileService.getProfile()).resolves.toEqual(
      expect.objectContaining({
        displayName: 'alice',
        avatarInitial: 'A',
      })
    )

    await profileService.updateBio('alice bio')

    setSession('bob@example.com')
    await expect(profileService.getProfile()).resolves.toEqual(
      expect.objectContaining({
        displayName: 'bob',
        bio: '专注前端工程、界面设计与写作流程，把复杂工作拆成可执行的步骤。',
      })
    )

    setSession('alice@example.com')
    await expect(profileService.getProfile()).resolves.toEqual(
      expect.objectContaining({
        displayName: 'alice',
        bio: 'alice bio',
      })
    )
  })
})
