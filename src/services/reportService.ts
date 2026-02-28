import type { Report, ReportReason, ReportTargetType } from '@/types/post'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const networkDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const mockReports: Report[] = []
let nextReportId = 1

export interface CreateReportPayload {
    targetType: ReportTargetType
    targetId: string
    reason: ReportReason
    detail?: string
}

export async function submitReport(payload: CreateReportPayload): Promise<Report> {
    if (USE_MOCK || !API_BASE_URL) {
        await networkDelay(200)

        const report: Report = {
            id: `report-${nextReportId++}`,
            targetType: payload.targetType,
            targetId: payload.targetId,
            reason: payload.reason,
            detail: payload.detail,
            reportedBy: 'current-user',
            createdAt: new Date().toISOString(),
            status: 'pending',
        }

        mockReports.push(report)
        console.info('[Mock] 举报已提交，等待管理员审核：', report)
        return report
    }

    const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error(`提交举报失败：${response.status}`)
    }

    return (await response.json()) as Report
}

export function getMockReports(): Report[] {
    return [...mockReports]
}
