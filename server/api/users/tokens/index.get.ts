import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const session = await useSession(event, { password: process.env.SESSION_PASSWORD || 'default_secure_session_password_change_me_in_production' })
    if (!session.data.userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const tokens = await prisma.apiToken.findMany({
        where: { userId: session.data.userId },
        select: { id: true, name: true, lastUsedAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
    })

    return { data: tokens }
})
