import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const userId = event.context.userId

    if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const tokens = await prisma.apiToken.findMany({
        where: { userId },
        select: { id: true, name: true, lastUsedAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
    })

    return { data: tokens }
})
