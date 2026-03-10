import { prisma } from '../../utils/prisma'
import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)


    if (!session.data.userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Aggregate update logs by date
    const logs = await prisma.updateLog.findMany({
        where: {
            createdAt: { gte: thirtyDaysAgo },
            status: 'SUCCESS'
        },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
    })

    const analytics: Record<string, number> = {}

    logs.forEach(log => {
        const date = log.createdAt.toISOString().split('T')[0]
        analytics[date as string] = (analytics[date as string] || 0) + 1
    })

    // Format for chart (labels and data)
    const labels = Object.keys(analytics)
    const data = Object.values(analytics)

    return {
        success: true,
        data: {
            labels,
            datasets: [
                {
                    label: 'IP Changes',
                    data
                }
            ]
        }
    }
})
