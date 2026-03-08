import type { Report, ReportReason, ReportTargetType } from '@/types/post'
import { readStoredAuthSession } from '@/features/auth/stores/useAuthStore'
import { apiFetch, isMockMode, networkDelay } from './apiClient'

const mockReports: Report[] = []
let nextReportId = 1

function requireAuthSession() {
    const session = readStoredAuthSession()
    if (!session) {
        throw new Error('请先登录后再提交举报')
    }

    return session
}

export interface CreateReportPayload {
    targetType: ReportTargetType
    targetId: string
    reason: ReportReason
    detail?: string
}

export async function submitReport(payload: CreateReportPayload): Promise<Report> {
    if (isMockMode()) {
        await networkDelay(200)
        const session = requireAuthSession()

        const report: Report = {
            id: `report-${nextReportId++}`,
            targetType: payload.targetType,
            targetId: payload.targetId,
            reason: payload.reason,
            detail: payload.detail,
            reportedBy: `user-${session.email}`,
            createdAt: new Date().toISOString(),
            status: 'pending',
        }

        mockReports.push(report)
        console.info('[Mock] 举报已提交，等待管理员审核：', report)
        return report
    }

    return apiFetch<Report>('/reports', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function getMockReports(): Report[] {
    return [...mockReports]
}
