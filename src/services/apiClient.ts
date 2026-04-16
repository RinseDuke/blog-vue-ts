const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

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
    constructor(
        public readonly status: number,
        public readonly body: string,
        public readonly errorType?: string,
    ) {
        let msg = body || `请求失败：${status}`
        try {
            const parsed = JSON.parse(body) as ApiErrorBody
            if (parsed.message) {
                msg = parsed.message
            }
        } catch {
        }
        super(msg)
        this.name = 'ApiError'
    }
}

function getAuthHeaders(): Record<string, string> {
    try {
        const raw = localStorage.getItem('blog_auth_session_v1')
            ?? sessionStorage.getItem('blog_auth_session_v1')
        if (!raw) return {}
        const session = JSON.parse(raw) as { token?: string }
        if (session?.token) {
            return { Authorization: `Bearer ${session.token}` }
        }
    } catch {
    }
    return {}
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const url = `${API_BASE_URL}${path}`
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers as Record<string, string> ?? {}),
    }

    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new ApiError(response.status, body)
    }

    // 204 无响应体
    if (response.status === 204) {
        return undefined as T
    }

    const json = await response.json()

    // 解包后端信封格式
    if (
        json !== null &&
        typeof json === 'object' &&
        'code' in json &&
        'data' in json
    ) {
        const envelope = json as ApiEnvelope<T>
        return envelope.data
    }

    return json as T
}

export async function apiFetchPaginated<T>(
    path: string,
    options: RequestInit = {},
): Promise<{ data: T; pagination?: ApiEnvelope['pagination'] }> {
    const url = `${API_BASE_URL}${path}`
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers as Record<string, string> ?? {}),
    }

    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new ApiError(response.status, body)
    }

    const json = await response.json()

    if (
        json !== null &&
        typeof json === 'object' &&
        'code' in json &&
        'data' in json
    ) {
        const envelope = json as ApiEnvelope<T>
        return { data: envelope.data, pagination: envelope.pagination }
    }

    return { data: json as T }
}

export function isMockMode(): boolean {
    return USE_MOCK || !API_BASE_URL
}

export const networkDelay = (ms = 300) =>
    new Promise((resolve) => setTimeout(resolve, ms))
