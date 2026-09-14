import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiFetch, isMockMode } from '@/services/apiClient'
import {
  clearStoredAuthSession,
  persistStoredAuthSession,
  readStoredAuthSession,
  sanitizeAuthUser,
  type AuthSession,
  type AuthUser,
} from '@/services/authSession'

const USERS_KEY = 'blog_auth_users_v1'

<<<<<<< HEAD
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

interface RegisteredUser {
  user: AuthUser
=======
interface RegisteredUser extends AuthUser {
>>>>>>> origin/main
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
  email: string
  avatar?: string
  bio?: string
  visibility?: 'public' | 'private'
}

const DEFAULT_MOCK_CREATED_AT = '2026-01-01T00:00:00.000Z'

const DEFAULT_MOCK_LOGIN = {
  username: import.meta.env.DEV ? 'demo' : '',
  password: import.meta.env.DEV ? 'Demo123456' : '',
  email: import.meta.env.DEV ? 'demo@sign.local' : '',
} as const

const DEFAULT_MOCK_USERS: RegisteredUser[] = [
  {
    user: {
      id: 'mock-demo-user',
      username: DEFAULT_MOCK_LOGIN.username,
      nickname: DEFAULT_MOCK_LOGIN.username,
      email: DEFAULT_MOCK_LOGIN.email,
      visibility: 'public',
    },
    password: DEFAULT_MOCK_LOGIN.password,
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

function mapBackendUser(user: BackendUser): AuthUser {
  const normalizedEmail = normalizeEmail(user.email)
  const normalizedUsername = normalizeUsername(user.username)

  return {
    id: user.id,
    username: normalizedUsername,
    nickname: normalizedUsername,
    email: normalizedEmail,
    avatar: user.avatar ?? undefined,
    bio: user.bio ?? undefined,
    visibility: user.visibility ?? 'public',
  }
}

<<<<<<< HEAD
function copyPublicUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    visibility: user.visibility,
  }
}

function hasStoredPassword(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { user?: unknown }
    return (
      parsed.user !== null &&
      typeof parsed.user === 'object' &&
      Object.prototype.hasOwnProperty.call(parsed.user, 'password')
    )
  } catch {
    return false
  }
}

function clearLegacySensitiveAuthData() {
  try {
    localStorage.removeItem(USERS_KEY)

    for (const storage of [localStorage, sessionStorage]) {
      const raw = storage.getItem(AUTH_KEY)
      if (raw && hasStoredPassword(raw)) {
        storage.removeItem(AUTH_KEY)
      }
    }
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

=======
>>>>>>> origin/main
function buildSession(user: AuthUser, rememberMe: boolean, token?: string): AuthSession {
  const safeUser = sanitizeAuthUser(user)
  if (!safeUser) {
    throw new Error('无法创建无效的登录会话。')
  }

  return {
    email: safeUser.email,
    rememberMe,
    loggedAt: new Date().toISOString(),
<<<<<<< HEAD
    token: token ?? `mock-token-${Date.now()}`,
    user: copyPublicUser(user),
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

    const storedUser = parsed.user
    const fallbackUser = buildLegacyUser(normalizedEmail)
    const normalizedUsername = normalizeUsername(storedUser?.username ?? fallbackUser.username)
    const user = copyPublicUser({
      id: typeof storedUser?.id === 'string' ? storedUser.id : fallbackUser.id,
      username: normalizedUsername,
      nickname: normalizedUsername,
      email: normalizedEmail,
      avatar: typeof storedUser?.avatar === 'string' ? storedUser.avatar : undefined,
      bio: typeof storedUser?.bio === 'string' ? storedUser.bio : undefined,
      visibility: storedUser?.visibility === 'private' ? 'private' : 'public',
    })

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
  const registeredUsers = DEFAULT_MOCK_USERS.map((user) => ({ ...user }))
=======
    token: token ?? (import.meta.env.DEV ? `mock-token-${Date.now()}` : ''),
    user: safeUser,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(null)
  const registeredUsers = DEFAULT_MOCK_USERS.map((user) => ({ ...user }))

  // Older versions persisted mock passwords in browser storage. They are never migrated.
  localStorage.removeItem(USERS_KEY)
  sessionStorage.removeItem(USERS_KEY)
>>>>>>> origin/main

  const isLoggedIn = computed(() => session.value !== null)
  const userEmail = computed(() => session.value?.email ?? '')
  const userId = computed(() => session.value?.user.id ?? '')
  const username = computed(() => session.value?.user.username ?? '')
  const displayName = computed(() => session.value?.user.username ?? '')

  function persistSession(nextSession: AuthSession) {
<<<<<<< HEAD
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)

    const safeSession: AuthSession = {
      ...nextSession,
      user: copyPublicUser(nextSession.user),
    }
    const storage = safeSession.rememberMe ? localStorage : sessionStorage
    storage.setItem(AUTH_KEY, JSON.stringify(safeSession))
    session.value = safeSession
=======
    session.value = persistStoredAuthSession(nextSession)
>>>>>>> origin/main
  }

  function loadSession() {
    const storedSession = readStoredAuthSession()
    if (storedSession) {
      // Re-persist the sanitized shape to remove fields left by older versions.
      session.value = persistStoredAuthSession(storedSession)
      return
    }

    session.value = null
    clearStoredAuthSession()
  }

  async function login(payload: AuthCredentials) {
    const normalizedUsername = normalizeUsername(payload.username)
    if (!normalizedUsername) {
      throw new Error('请输入用户名。')
    }

    if (import.meta.env.DEV && isMockMode()) {
      await wait()

      const user = registeredUsers.find((item) =>
        item.user.username === normalizedUsername || item.user.email === normalizeEmail(normalizedUsername)
      )

      if (!user) {
        throw new Error('账号不存在，请先注册。')
      }

      if (user.password !== payload.password) {
        throw new Error('用户名或密码错误。')
      }

      persistSession(buildSession(user.user, payload.rememberMe))
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

  async function register(payload: RegisterPayload) {
    const normalizedUsername = normalizeUsername(payload.username)
    const normalizedEmail = normalizeEmail(payload.email)
    const visibility: AuthUser['visibility'] = payload.visibility === 'private' ? 'private' : 'public'

    if (!normalizedUsername) {
      throw new Error('请输入用户名。')
    }

    if (import.meta.env.DEV && isMockMode()) {
      await wait(500)

<<<<<<< HEAD
      if (registeredUsers.some((item) => item.user.username === normalizedUsername)) {
        throw new Error('该用户名已存在，请更换后重试。')
      }

      if (registeredUsers.some((item) => item.user.email === normalizedEmail)) {
=======
      if (registeredUsers.some((item) => item.username === normalizedUsername)) {
        throw new Error('该用户名已存在，请更换后重试。')
      }

      if (registeredUsers.some((item) => item.email === normalizedEmail)) {
>>>>>>> origin/main
        throw new Error('该邮箱已注册，请直接登录。')
      }

      const nextUser: RegisteredUser = {
        user: {
          id: `user-${Date.now()}`,
          username: normalizedUsername,
          nickname: normalizedUsername,
          email: normalizedEmail,
          avatar: payload.avatar,
          bio: payload.bio,
          visibility,
        },
        password: payload.password,
        createdAt: new Date().toISOString(),
      }

      registeredUsers.push(nextUser)
<<<<<<< HEAD
      persistSession(buildSession(nextUser.user, payload.rememberMe))
=======
      persistSession(buildSession(nextUser, payload.rememberMe))
>>>>>>> origin/main
      return
    }

    await apiFetch<BackendUser>('/register', {
      method: 'POST',
      body: JSON.stringify({
        username: normalizedUsername,
        nickname: normalizedUsername,
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
    clearStoredAuthSession()
  }

  clearLegacySensitiveAuthData()
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
    register,
    logout,
  }
})
