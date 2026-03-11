import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
    const status = query.status as string | undefined   // "SUCCESS" | "FAILED"
    const zoneId = query.zoneId as string | undefined
    const skip = (page - 1) * limit

    try {
        const where: any = {}

        if (status) where.status = status
        if (zoneId) {
            where.record = { zone: { cfZoneId: zoneId } }
        }

        const [logs, total] = await Promise.all([
            prisma.updateLog.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    record: {
                        include: { zone: true }
                    }
                }
            }),
            prisma.updateLog.count({ where })
        ])

        return {
            success: true,
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
