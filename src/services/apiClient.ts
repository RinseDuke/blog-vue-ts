/**
 * 统一 API 客户端
 * 封装所有网络请求，自动注入 Auth Token、统一错误处理
 */

/** 后端 API 根地址 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
/** 是否启用 Mock 模式 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/** API 请求错误类，携带 HTTP 状态码和响应体 */
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

/** 从 localStorage / sessionStorage 读取 token
 * 构造 Authorization 请求头 */
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
        // 忽略 JSON 解析错误
    }
    return {}
}

/**
 * 类型安全的 fetch 封装
 * 自动拼接 base URL、注入 token、处理错误码
 */
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

    // 204 No Content — 无响应体
    if (response.status === 204) {
        return undefined as T
    }

    return (await response.json()) as T
}

// 判断当前是否运行在 Mock 模式 
export function isMockMode(): boolean {
    return USE_MOCK || !API_BASE_URL
}

//演示用
export const networkDelay = (ms = 300) =>
    new Promise((resolve) => setTimeout(resolve, ms))
