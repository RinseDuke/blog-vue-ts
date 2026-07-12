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

function setSession(email: string, options: { createdAt?: string; loggedAt?: string } = {}) {
  const username = email.split('@')[0]

  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      email,
      rememberMe: true,
      loggedAt: options.loggedAt ?? '2026-03-07T10:00:00.000Z',
      token: `mock-token-${email}`,
      user: {
        id: `user-${email}`,
        username,
        nickname: username,
        email,
        visibility: 'public',
        createdAt: options.createdAt,
      },
    })
  )
}

function setSessionWithUser(email: string, username: string) {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      email,
      rememberMe: true,
      loggedAt: '2026-03-07T10:00:00.000Z',
      token: `mock-token-${email}`,
      user: {
        id: `user-${username}`,
        username,
        nickname: username,
        email,
        visibility: 'public',
      },
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
        username: 'alice',
        displayName: 'alice',
        avatarInitial: 'A',
      })
    )

    await profileService.updateBio('alice bio')

    setSession('bob@example.com')
    await expect(profileService.getProfile()).resolves.toEqual(
      expect.objectContaining({
        username: 'bob',
        bio: '专注前端工程、界面设计与写作流程，把复杂工作拆成可执行的步骤。',
      })
    )

    setSession('alice@example.com')
    await expect(profileService.getProfile()).resolves.toEqual(
      expect.objectContaining({
        username: 'alice',
        bio: 'alice bio',
      })
    )
  })

  it('formats the account creation time for a default mock profile', async () => {
    setSession('created@example.com', { createdAt: '2026-07-13T09:30:00.000Z' })

    await expect(profileService.getProfile()).resolves.toEqual(
      expect.objectContaining({ joinedAt: '2026/07/13' }),
    )
  })

  it('falls back to the session login time when creation time is unavailable', async () => {
    setSession('legacy@example.com', { loggedAt: '2025-12-08T10:00:00.000Z' })

    await expect(profileService.getProfile()).resolves.toEqual(
      expect.objectContaining({ joinedAt: '2025/12/08' }),
    )
  })

  it('migrates the known placeholder date in an existing stored profile', async () => {
    setSession('qa@example.com', { createdAt: '2026-06-09T03:00:00.000Z' })
    const storageKey = 'blog_user_profile_v1:qa@example.com'
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        id: 'qa-user',
        username: 'qa',
        email: 'qa@example.com',
        displayName: 'qa',
        bio: 'existing bio',
        joinedAt: '2024/05/12',
        lastActive: '今天',
        avatarInitial: 'Q',
        visibility: 'public',
      }),
    )

    await expect(profileService.getProfile()).resolves.toEqual(
      expect.objectContaining({ joinedAt: '2026/06/09', bio: 'existing bio' }),
    )
    expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}').joinedAt).toBe('2026/06/09')
  })

  it('uses the registered username instead of the email prefix for default mock profiles', async () => {
    setSessionWithUser('mailbox@example.com', 'creator_user')

    await expect(profileService.getProfile()).resolves.toEqual(
      expect.objectContaining({
        id: 'user-creator_user',
        username: 'creator_user',
        displayName: 'creator_user',
      })
    )
  })
})
