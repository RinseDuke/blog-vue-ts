/**
 * 举报服务
 * 提供内容举报提交功能。Mock 模式下将举报存入内存数组。
 */

import type { Report, ReportReason, ReportTargetType } from '@/types/post'
import { readStoredAuthSession } from '@/features/auth/stores/useAuthStore'
import { apiFetch, isMockMode, networkDelay } from './apiClient'

const mockReports: Report[] = []   // Mock 举报存储
let nextReportId = 1

function requireAuthSession() {
    const session = readStoredAuthSession()
    if (!session) {
        throw new Error('请先登录后再提交举报')
    }

    return session
}

/** 提交举报的请求体 */
export interface CreateReportPayload {
    targetType: ReportTargetType  // 举报对象类型
    targetId: string              // 举报对象 ID
    reason: ReportReason          // 举报理由
    detail?: string               // 补充说明
}

/** 提交举报 */
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

/** 获取所有 Mock 举报记录（调试用） */
export function getMockReports(): Report[] {
    return [...mockReports]
}
