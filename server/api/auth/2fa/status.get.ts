import { prisma } from '../../../utils/prisma'
import { getUserSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)

    if (!session.data.userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({ where: { id: session.data.userId } })

    return {
        enabled: user?.twoFactorEnabled || false
    }
})
