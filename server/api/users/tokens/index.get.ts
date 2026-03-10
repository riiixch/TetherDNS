import { prisma } from '../../../utils/prisma'
import { getUserSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)

    if (!session.data.userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const tokens = await prisma.apiToken.findMany({
        where: { userId: session.data.userId },
        select: { id: true, name: true, lastUsedAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
    })

    return { data: tokens }
})
