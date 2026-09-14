import type { Report, ReportReason, ReportTargetType } from '@/types/post'
import { requireAuthSession } from './authSession'
import { apiFetch, isMockMode, networkDelay } from './apiClient'

const mockReports: Report[] = []
let nextReportId = 1

export interface CreateReportPayload {
    targetType: ReportTargetType
    targetId: string
    reason: ReportReason
    detail?: string
}

export async function submitReport(payload: CreateReportPayload): Promise<Report> {
    if (import.meta.env.DEV && isMockMode()) {
        await networkDelay(200)
        const session = requireAuthSession('请先登录后再提交举报')

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
