import { AUTH_SESSION_KEY } from './authSession'
import { ApiError, apiFetch, apiFetchPaginated, isMockMode } from './apiClient'

function createStorageMock() {
  const store = new Map<string, string>()

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  }
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/v1/')
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('unwraps data and pagination envelopes', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      code: 200,
      message: 'Success',
      data: [{ id: 'post-1' }],
      pagination: { total: 1, page: 1, per_page: 10, total_pages: 1 },
    }), { status: 200 })))

    await expect(apiFetch<Array<{ id: string }>>('/posts')).resolves.toEqual([{ id: 'post-1' }])
    await expect(apiFetchPaginated<Array<{ id: string }>>('/posts')).resolves.toEqual({
      data: [{ id: 'post-1' }],
      pagination: { total: 1, page: 1, per_page: 10, total_pages: 1 },
    })
  })

  it('injects a token from the shared sanitized session reader', async () => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
      email: 'reader@example.com',
      rememberMe: true,
      loggedAt: '2026-09-14T00:00:00.000Z',
      token: 'server-token',
      user: {
        id: 'user-1',
        username: 'reader',
        nickname: 'Reader',
        email: 'reader@example.com',
        visibility: 'public',
      },
    }))
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch<void>('/profile')

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/profile', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer server-token' }),
    }))
  })

  it('handles empty paginated responses without parsing a body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })))

    await expect(apiFetchPaginated<void>('/posts')).resolves.toEqual({ data: undefined })
  })

  it('exposes backend error messages and error types', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      message: '会话已过期',
      error_type: 'AUTH_EXPIRED',
    }), { status: 401 })))

    const error = await apiFetch('/profile').catch((value: unknown) => value)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      message: '会话已过期',
      status: 401,
      errorType: 'AUTH_EXPIRED',
    })
  })

  it('never falls back to mock mode just because the API URL is missing', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')

    expect(isMockMode()).toBe(false)
    await expect(apiFetch('/posts')).rejects.toThrow('未配置 VITE_API_BASE_URL')
  })
})
