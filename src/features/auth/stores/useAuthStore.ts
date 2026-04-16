import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiFetch, isMockMode } from '@/services/apiClient'

const AUTH_KEY = 'blog_auth_session_v1'
const USERS_KEY = 'blog_auth_users_v1'

export interface AuthUser {
  id: string
  username: string
  nickname: string
  email: string
  avatar?: string
  bio?: string
  visibility: 'public' | 'private'
}

export interface AuthSession {
  email: string
  rememberMe: boolean
  loggedAt: string
  token: string
  user: AuthUser
}

interface RegisteredUser extends AuthUser {
  password: string
  createdAt: string
}

interface BackendUser {
  id: string
  username: string
  nickname: string
  email: string
  avatar?: string | null
  bio?: string | null
  created_at?: string | null
  last_login_at?: string | null
  visibility?: 'public' | 'private'
}

interface LoginResponse {
  token: string
  user: BackendUser
}

interface AuthCredentials {
  username: string
  password: string
  rememberMe: boolean
}

interface RegisterPayload extends AuthCredentials {
  nickname: string
  email: string
  avatar?: string
  bio?: string
  visibility?: 'public' | 'private'
}

const DEFAULT_MOCK_CREATED_AT = '2026-01-01T00:00:00.000Z'

export const DEFAULT_MOCK_LOGIN = {
  username: 'demo',
  password: 'Demo123456',
  email: 'demo@sign.local',
} as const

const DEFAULT_MOCK_USERS: RegisteredUser[] = [
  {
    id: 'mock-demo-user',
    username: DEFAULT_MOCK_LOGIN.username,
    nickname: 'Demo User',
    email: DEFAULT_MOCK_LOGIN.email,
    password: DEFAULT_MOCK_LOGIN.password,
    visibility: 'public',
    createdAt: DEFAULT_MOCK_CREATED_AT,
  },
]

function wait(ms = 400) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeUsername(username: string) {
  return username.trim()
}

function buildLegacyUser(email: string): AuthUser {
  const fallbackName = email.split('@')[0]?.trim() || 'sign'

  return {
    id: `user-${email}`,
    username: fallbackName,
    nickname: fallbackName,
    email,
    visibility: 'public',
  }
}

function mapBackendUser(user: BackendUser): AuthUser {
  const normalizedEmail = normalizeEmail(user.email)

  return {
    id: user.id,
    username: normalizeUsername(user.username),
    nickname: user.nickname?.trim() || normalizeUsername(user.username),
    email: normalizedEmail,
    avatar: user.avatar ?? undefined,
    bio: user.bio ?? undefined,
    visibility: user.visibility ?? 'public',
  }
}

function isRegisteredUser(value: unknown): value is RegisteredUser {
  if (!value || typeof value !== 'object') return false

  const user = value as Partial<RegisteredUser>
  return (
    typeof user.email === 'string' &&
    typeof user.password === 'string' &&
    typeof user.createdAt === 'string'
  )
}

function readRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return DEFAULT_MOCK_USERS.map((user) => ({ ...user }))

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return DEFAULT_MOCK_USERS.map((user) => ({ ...user }))

    const normalizedUsers = parsed.filter(isRegisteredUser).map((user) => {
      const email = normalizeEmail(user.email)
      const legacy = buildLegacyUser(email)

      const normalizedUser: RegisteredUser = {
        ...legacy,
        ...user,
        id: typeof user.id === 'string' ? user.id : legacy.id,
        username: normalizeUsername(typeof user.username === 'string' ? user.username : legacy.username),
        nickname: typeof user.nickname === 'string' ? user.nickname.trim() || legacy.nickname : legacy.nickname,
        email,
        avatar: typeof user.avatar === 'string' ? user.avatar : undefined,
        bio: typeof user.bio === 'string' ? user.bio : undefined,
        visibility: user.visibility === 'private' ? 'private' : 'public',
      }

      return normalizedUser
    })

    const mergedUsers = DEFAULT_MOCK_USERS.map((user) => ({ ...user }))

    normalizedUsers.forEach((user) => {
      const existingIndex = mergedUsers.findIndex(
        (item) => item.username === user.username || item.email === user.email
      )

      if (existingIndex >= 0) {
        mergedUsers.splice(existingIndex, 1, user)
        return
      }

      mergedUsers.push(user)
    })

    return mergedUsers
  } catch {
    return DEFAULT_MOCK_USERS.map((user) => ({ ...user }))
  }
}

function persistRegisteredUsers(users: RegisteredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function buildSession(user: AuthUser, rememberMe: boolean, token?: string): AuthSession {
  return {
    email: user.email,
    rememberMe,
    loggedAt: new Date().toISOString(),
    token: token ?? `mock-token-${Date.now()}`,
    user,
  }
}

export function readStoredAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<AuthSession> & {
      email?: string
      user?: Partial<AuthUser>
    }

    if (!parsed?.token) return null

    const normalizedEmail = normalizeEmail(parsed.user?.email ?? parsed.email ?? '')
    if (!normalizedEmail) return null

    const fallbackUser = buildLegacyUser(normalizedEmail)
    const user: AuthUser = {
      ...fallbackUser,
      ...(parsed.user ?? {}),
      id: typeof parsed.user?.id === 'string' ? parsed.user.id : fallbackUser.id,
      username: normalizeUsername(parsed.user?.username ?? fallbackUser.username),
      nickname: typeof parsed.user?.nickname === 'string'
        ? parsed.user.nickname.trim() || fallbackUser.nickname
        : fallbackUser.nickname,
      email: normalizedEmail,
      avatar: typeof parsed.user?.avatar === 'string' ? parsed.user.avatar : undefined,
      bio: typeof parsed.user?.bio === 'string' ? parsed.user.bio : undefined,
      visibility: parsed.user?.visibility === 'private' ? 'private' : 'public',
    }

    return {
      email: normalizedEmail,
      rememberMe: Boolean(parsed.rememberMe),
      loggedAt: typeof parsed.loggedAt === 'string' ? parsed.loggedAt : new Date().toISOString(),
      token: parsed.token,
      user,
    }
  } catch {
    return null
  }
}

export function requireAuthSession(errorMessage: string) {
  const session = readStoredAuthSession()
  if (!session) {
    throw new Error(errorMessage)
  }
  return session
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(null)

  const isLoggedIn = computed(() => session.value !== null)
  const userEmail = computed(() => session.value?.email ?? '')
  const userId = computed(() => session.value?.user.id ?? '')
  const username = computed(() => session.value?.user.username ?? '')
  const displayName = computed(() => session.value?.user.nickname ?? '')

  function persistSession(nextSession: AuthSession) {
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)

    const storage = nextSession.rememberMe ? localStorage : sessionStorage
    storage.setItem(AUTH_KEY, JSON.stringify(nextSession))
    session.value = nextSession
  }

  function loadSession() {
    const storedSession = readStoredAuthSession()
    if (storedSession) {
      session.value = storedSession
      return
    }

    session.value = null
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)
  }

  async function login(payload: AuthCredentials) {
    const normalizedUsername = normalizeUsername(payload.username)
    if (!normalizedUsername) {
      throw new Error('请输入用户名。')
    }

    if (isMockMode()) {
      await wait()

      const registeredUsers = readRegisteredUsers()
      const user = registeredUsers.find((item) =>
        item.username === normalizedUsername || item.email === normalizeEmail(normalizedUsername)
      )

      if (!user) {
        throw new Error('账号不存在，请先注册。')
      }

      if (user.password !== payload.password) {
        throw new Error('用户名或密码错误。')
      }

      persistSession(buildSession(user, payload.rememberMe))
      return
    }

    const data = await apiFetch<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({
        username: normalizedUsername,
        password: payload.password,
      }),
    })

    persistSession(buildSession(mapBackendUser(data.user), payload.rememberMe, data.token))
  }

  async function sendVerificationCode() {
    throw new Error('当前后端规范未提供邮箱验证码接口。')
  }

  async function register(payload: RegisterPayload) {
    const normalizedUsername = normalizeUsername(payload.username)
    const normalizedEmail = normalizeEmail(payload.email)
    const visibility: RegisteredUser['visibility'] = payload.visibility === 'private' ? 'private' : 'public'

    if (!normalizedUsername) {
      throw new Error('请输入用户名。')
    }

    if (isMockMode()) {
      await wait(500)

      const users = readRegisteredUsers()
      if (users.some((item) => item.username === normalizedUsername)) {
        throw new Error('该用户名已存在，请更换后重试。')
      }

      if (users.some((item) => item.email === normalizedEmail)) {
        throw new Error('该邮箱已注册，请直接登录。')
      }

      const nextUser: RegisteredUser = {
        id: `user-${Date.now()}`,
        username: normalizedUsername,
        nickname: payload.nickname.trim(),
        email: normalizedEmail,
        password: payload.password,
        avatar: payload.avatar,
        bio: payload.bio,
        visibility,
        createdAt: new Date().toISOString(),
      }

      persistRegisteredUsers([...users, nextUser])
      persistSession(buildSession(nextUser, payload.rememberMe))
      return
    }

    await apiFetch<BackendUser>('/register', {
      method: 'POST',
      body: JSON.stringify({
        username: normalizedUsername,
        nickname: payload.nickname.trim(),
        password: payload.password,
        email: normalizedEmail,
        avatar: payload.avatar,
        bio: payload.bio,
        visibility,
      }),
    })

    await login({
      username: normalizedUsername,
      password: payload.password,
      rememberMe: payload.rememberMe,
    })
  }

  function logout() {
    session.value = null
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)
  }

  loadSession()

  return {
    session,
    isLoggedIn,
    userEmail,
    userId,
    username,
    displayName,
    loadSession,
    login,
    sendVerificationCode,
    register,
    logout,
  }
})
