import { readStoredAuthSession } from './authSession'

interface ApiEnvelope<T = unknown> {
  code: number
  message: string
  data: T
  timestamp?: string
  pagination?: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

interface ApiErrorBody {
  code?: number
  message?: string
  error_type?: string
  details?: string
}

export class ApiError extends Error {
  readonly errorType?: string

  constructor(
    public readonly status: number,
    public readonly body: string,
    errorType?: string,
  ) {
    let message = body || `请求失败：${status}`
    let parsedErrorType = errorType

    try {
      const parsed = JSON.parse(body) as ApiErrorBody
      message = parsed.message || parsed.details || message
      parsedErrorType ??= parsed.error_type
    } catch {
      // Non-JSON error bodies are already represented by `body`.
    }

    super(message)
    this.name = 'ApiError'
    this.errorType = parsedErrorType
  }
}

function getAuthHeaders(): Record<string, string> {
  const session = readStoredAuthSession()
  return session ? { Authorization: `Bearer ${session.token}` } : {}
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? ''
}

function buildApiUrl(path: string) {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl) {
    throw new Error('未配置 VITE_API_BASE_URL，真实 API 请求已中止。')
  }
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

async function request(path: string, options: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> ?? {}),
  }

  const response = await fetch(buildApiUrl(path), { ...options, headers })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new ApiError(response.status, body)
  }

  return response
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
  const response = await request(path, options)
  if (response.status === 204) return undefined as T

  const json = await response.json()
  if (json !== null && typeof json === 'object' && 'code' in json && 'data' in json) {
    return (json as ApiEnvelope<T>).data
  }

  return json as T
}

export async function apiFetchPaginated<T>(
    path: string,
    options: RequestInit = {},
): Promise<{ data: T; pagination?: ApiEnvelope['pagination'] }> {
  const response = await request(path, options)
  if (response.status === 204) return { data: undefined as T }

  const json = await response.json()
  if (json !== null && typeof json === 'object' && 'code' in json && 'data' in json) {
    const envelope = json as ApiEnvelope<T>
    return { data: envelope.data, pagination: envelope.pagination }
  }

  return { data: json as T }
}

export function isMockMode(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false'
}

export const networkDelay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms))
