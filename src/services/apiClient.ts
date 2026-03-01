/**
 * Unified API client for all service calls.
 * Handles error formatting, auth token injection, and
 * provides a clean interface for GET/POST/PUT/DELETE.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: string,
    ) {
        const msg = body || `请求失败：${status}`
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
        // ignore parse errors
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

    // 204 No Content
    if (response.status === 204) {
        return undefined as T
    }

    return (await response.json()) as T
}

export function isMockMode(): boolean {
    return USE_MOCK || !API_BASE_URL
}

export const networkDelay = (ms = 300) =>
    new Promise((resolve) => setTimeout(resolve, ms))
