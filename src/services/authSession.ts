export const AUTH_SESSION_KEY = 'blog_auth_session_v1'

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

function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function normalizeUsername(username: unknown) {
  return typeof username === 'string' ? username.trim() : ''
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

export function sanitizeAuthUser(value: Partial<AuthUser>, fallbackEmail = ''): AuthUser | null {
  const email = normalizeEmail(value.email ?? fallbackEmail)
  if (!email) return null

  const fallback = buildLegacyUser(email)
  const username = normalizeUsername(value.username) || fallback.username

  return {
    id: typeof value.id === 'string' && value.id ? value.id : fallback.id,
    username,
    nickname: normalizeUsername(value.nickname) || username,
    email,
    avatar: typeof value.avatar === 'string' ? value.avatar : undefined,
    bio: typeof value.bio === 'string' ? value.bio : undefined,
    visibility: value.visibility === 'private' ? 'private' : 'public',
  }
}

export function sanitizeAuthSession(value: Partial<AuthSession>): AuthSession | null {
  if (typeof value.token !== 'string' || !value.token) return null

  const email = normalizeEmail(value.user?.email ?? value.email)
  const user = sanitizeAuthUser(value.user ?? {}, email)
  if (!user) return null

  return {
    email: user.email,
    rememberMe: Boolean(value.rememberMe),
    loggedAt: typeof value.loggedAt === 'string' ? value.loggedAt : new Date().toISOString(),
    token: value.token,
    user,
  }
}

export function readStoredAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY) ?? sessionStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null

    return sanitizeAuthSession(JSON.parse(raw) as Partial<AuthSession>)
  } catch {
    return null
  }
}

export function persistStoredAuthSession(value: AuthSession): AuthSession {
  const session = sanitizeAuthSession(value)
  if (!session) {
    throw new Error('无法保存无效的登录会话。')
  }

  clearStoredAuthSession()
  const storage = session.rememberMe ? localStorage : sessionStorage
  storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
  return session
}

export function clearStoredAuthSession() {
  localStorage.removeItem(AUTH_SESSION_KEY)
  sessionStorage.removeItem(AUTH_SESSION_KEY)
}

export function requireAuthSession(errorMessage: string) {
  const session = readStoredAuthSession()
  if (!session) {
    throw new Error(errorMessage)
  }
  return session
}
