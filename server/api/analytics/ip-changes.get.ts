import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const session = await useSession(event, {
        password: process.env.SESSION_PASSWORD || 'default_secure_session_password_change_me_in_production'
    })

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
