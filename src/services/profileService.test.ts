import { profileService } from '@/services/profileService'
import { AUTH_SESSION_KEY } from '@/services/authSession'

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
  const username = email.split('@')[0]

  localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      email,
      rememberMe: true,
      loggedAt: '2026-03-07T10:00:00.000Z',
      token: `mock-token-${email}`,
      user: {
        id: `user-${email}`,
        username,
        nickname: username,
        email,
        visibility: 'public',
      },
    })
  )
}

function setSessionWithUser(email: string, username: string) {
  localStorage.setItem(
    AUTH_SESSION_KEY,
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
