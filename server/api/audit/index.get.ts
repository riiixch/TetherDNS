import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 50))
    const skip = (page - 1) * limit
    const action = query.action as string | undefined

    try {
        const where: any = {}
        if (action) where.action = action

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { username: true } } }
            }),
            prisma.auditLog.count({ where })
        ])

        return {
            success: true,
            data: logs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
