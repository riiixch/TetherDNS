import { prisma } from '../../utils/prisma'
import { getGlobalIp } from '../../utils/getGlobalIp'

export default defineEventHandler(async () => {
    try {
        const [
            totalAccounts,
            totalZones,
            totalRecords,
            ddnsEnabledCount,
            lastLog,
            recentLogs,
            totalHealthChecks,
            upHealthChecks
        ] = await Promise.all([
            prisma.cloudflareAccount.count(),
            prisma.zone.count(),
            prisma.dnsRecord.count(),
            prisma.dnsRecord.count({ where: { isAutoUpdate: true } }),
            prisma.updateLog.findFirst({ orderBy: { createdAt: 'desc' }, include: { record: true } }),
            prisma.updateLog.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { status: true }
            }),
            prisma.healthCheck.count(),
            prisma.healthCheck.count({ where: { lastStatus: 'UP' } })
        ])

        // Fetch current IP
        let currentIp = 'N/A'
        try {
            const ip = await getGlobalIp(false)
            if (ip) currentIp = ip
        } catch { /* ignore */ }

        return {
            success: true,
            data: {
                totalAccounts,
                totalZones,
                totalRecords,
                ddnsEnabledCount,
                currentIp,
                lastUpdate: lastLog ? {
                    ip: lastLog.newIp,
                    status: lastLog.status,
                    record: lastLog.record?.name || 'Unknown',
                    time: lastLog.createdAt
                } : null,
                recentSuccessRate: recentLogs.length > 0
                    ? Math.round((recentLogs.filter(l => l.status === 'SUCCESS').length / recentLogs.length) * 100)
                    : 100,
                healthStats: {
                    total: totalHealthChecks || 0,
                    up: upHealthChecks || 0
                }
            }
        }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
