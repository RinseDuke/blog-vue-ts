import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const AUTH_KEY = 'blog_auth_session_v1'
const USERS_KEY = 'blog_auth_users_v1'
const VERIFY_CODES_KEY = 'blog_auth_email_codes_v1'
const CODE_TTL_MS = 5 * 60 * 1000

export interface AuthSession {
  email: string
  rememberMe: boolean
  loggedAt: string
  token: string
}

interface RegisteredUser {
  email: string
  password: string
  createdAt: string
}

interface AuthCredentials {
  email: string
  password: string
  rememberMe: boolean
}

interface RegisterPayload extends AuthCredentials {
  verificationCode: string
}

interface EmailVerificationRequest {
  email: string
  code: string
  sentAt: string
  expiresAt: string
}

function wait(ms = 400) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isRegisteredUser(value: unknown): value is RegisteredUser {
  if (!value || typeof value !== 'object') return false

  const user = value as Partial<RegisteredUser>
  return typeof user.email === 'string' && typeof user.password === 'string' && typeof user.createdAt === 'string'
}

function isEmailVerificationRequest(value: unknown): value is EmailVerificationRequest {
  if (!value || typeof value !== 'object') return false

  const request = value as Partial<EmailVerificationRequest>
  return (
    typeof request.email === 'string' &&
    typeof request.code === 'string' &&
    typeof request.sentAt === 'string' &&
    typeof request.expiresAt === 'string'
  )
}

function readRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isRegisteredUser).map((user) => ({
      email: normalizeEmail(user.email),
      password: user.password,
      createdAt: user.createdAt,
    }))
  } catch {
    return []
  }
}

function persistRegisteredUsers(users: RegisteredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readVerificationRequests() {
  try {
    const raw = localStorage.getItem(VERIFY_CODES_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isEmailVerificationRequest).map((request) => ({
      email: normalizeEmail(request.email),
      code: request.code,
      sentAt: request.sentAt,
      expiresAt: request.expiresAt,
    }))
  } catch {
    return []
  }
}

function persistVerificationRequests(requests: EmailVerificationRequest[]) {
  if (!requests.length) {
    localStorage.removeItem(VERIFY_CODES_KEY)
    return
  }

  localStorage.setItem(VERIFY_CODES_KEY, JSON.stringify(requests))
}

function pruneExpiredVerificationRequests(requests: EmailVerificationRequest[]) {
  const now = Date.now()
  return requests.filter((request) => new Date(request.expiresAt).getTime() > now)
}

function clearVerificationRequest(email: string) {
  const nextRequests = pruneExpiredVerificationRequests(readVerificationRequests()).filter((item) => item.email !== email)
  persistVerificationRequests(nextRequests)
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function buildSession(email: string, rememberMe: boolean): AuthSession {
  return {
    email,
    rememberMe,
    loggedAt: new Date().toISOString(),
    token: `mock-token-${Date.now()}`,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(null)

  const isLoggedIn = computed(() => session.value !== null)
  const userEmail = computed(() => session.value?.email ?? '')

  function persistSession(nextSession: AuthSession) {
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)

    const storage = nextSession.rememberMe ? localStorage : sessionStorage
    storage.setItem(AUTH_KEY, JSON.stringify(nextSession))
    session.value = nextSession
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY)
      if (!raw) {
        session.value = null
        return
      }

      const parsed = JSON.parse(raw) as AuthSession
      if (parsed?.token && parsed?.email) {
        session.value = {
          ...parsed,
          email: normalizeEmail(parsed.email),
        }
        return
      }
    } catch {
      // Ignore invalid persisted session data.
    }

    session.value = null
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)
  }

  async function login(payload: AuthCredentials) {
    await wait()

    const email = normalizeEmail(payload.email)
    const user = readRegisteredUsers().find((item) => item.email === email)

    if (!user) {
      throw new Error('账号不存在，请先注册。')
    }

    if (user.password !== payload.password) {
      throw new Error('邮箱或密码错误。')
    }

    persistSession(buildSession(email, payload.rememberMe))
  }

  async function sendVerificationCode(email: string) {
    await wait()

    const normalizedEmail = normalizeEmail(email)
    const users = readRegisteredUsers()
    if (users.some((item) => item.email === normalizedEmail)) {
      throw new Error('该邮箱已注册，请直接登录。')
    }

    const nextRequest: EmailVerificationRequest = {
      email: normalizedEmail,
      code: generateVerificationCode(),
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    }

    const requests = pruneExpiredVerificationRequests(readVerificationRequests()).filter(
      (item) => item.email !== normalizedEmail
    )
    persistVerificationRequests([...requests, nextRequest])

    console.info(`[Mock] 邮箱验证码已发送至 ${normalizedEmail}: ${nextRequest.code}`)

    return {
      expiresAt: nextRequest.expiresAt,
      debugCode: nextRequest.code,
    }
  }

  async function register(payload: RegisterPayload) {
    await wait(500)

    const email = normalizeEmail(payload.email)
    const users = readRegisteredUsers()
    const verificationRequests = pruneExpiredVerificationRequests(readVerificationRequests())

    if (users.some((item) => item.email === email)) {
      throw new Error('该邮箱已注册，请直接登录。')
    }

    const verificationRequest = verificationRequests.find((item) => item.email === email)
    if (!verificationRequest) {
      persistVerificationRequests(verificationRequests)
      throw new Error('请先发送邮箱验证码。')
    }

    if (verificationRequest.code !== payload.verificationCode.trim()) {
      throw new Error('验证码错误，请重新输入。')
    }

    const nextUser: RegisteredUser = {
      email,
      password: payload.password,
      createdAt: new Date().toISOString(),
    }

    persistRegisteredUsers([...users, nextUser])
    clearVerificationRequest(email)
    persistSession(buildSession(email, payload.rememberMe))
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
    loadSession,
    login,
    sendVerificationCode,
    register,
    logout,
  }
})
