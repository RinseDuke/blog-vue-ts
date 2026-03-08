import { getMockReports, submitReport } from '@/services/reportService'

const AUTH_KEY = 'blog_auth_session_v1'

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

describe('reportService auth guard', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects anonymous reports', async () => {
    await expect(
      submitReport({
        targetType: 'comment',
        targetId: 'c1',
        reason: 'spam',
      })
    ).rejects.toThrow('请先登录后再提交举报')
  })

  it('creates a report for the logged in user', async () => {
    const initialReportCount = getMockReports().length

    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        email: 'tester@example.com',
        rememberMe: true,
        loggedAt: '2026-03-07T10:00:00.000Z',
        token: 'mock-token-123',
      })
    )

    const report = await submitReport({
      targetType: 'comment',
      targetId: 'c1',
      reason: 'misinformation',
      detail: '测试举报',
    })

    expect(report.reportedBy).toBe('user-tester@example.com')
    expect(getMockReports()).toHaveLength(initialReportCount + 1)
  })
})
