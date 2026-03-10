import { prisma } from '../../../utils/prisma'
import { getUserSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)

    if (!session.data.userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = parseInt(event.context.params?.id || '0')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

    await prisma.apiToken.deleteMany({
        where: { id, userId: session.data.userId }
    })

    return { success: true }
})
